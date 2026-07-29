import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import AdmZip from 'adm-zip';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const APK_CACHE_DIR = join(process.cwd(), 'public', 'apk');

@Injectable()
export class CompileService {
  constructor(private prisma: PrismaClient) {}

  async getTasks(page = 1, size = 20) {
    const skip = (page - 1) * size;
    const [list, total] = await Promise.all([
      this.prisma.compileTask.findMany({ skip, take: size, orderBy: { createdAt: 'desc' } }),
      this.prisma.compileTask.count(),
    ]);
    return { list, total, page, size };
  }

  async createTask(data: { name?: string; githubRepo: string; githubToken: string; workflowFile?: string; branch?: string; version?: string; channel?: string }) {
    if (!data.githubRepo || !data.githubToken) throw new BadRequestException('GitHub仓库和Token不能为空');
    return this.prisma.compileTask.create({
      data: {
        name: data.name || '',
        githubRepo: data.githubRepo,
        githubToken: data.githubToken,
        workflowFile: data.workflowFile || 'build.yml',
        branch: data.branch || 'main',
        version: data.version || '',
        channel: data.channel || 'default',
        status: 'pending',
      },
    });
  }

  async triggerBuild(id: number) {
    const task = await this.prisma.compileTask.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('任务不存在');

    const [owner, repo] = task.githubRepo.split('/');
    if (!owner || !repo) throw new BadRequestException('仓库格式错误，应为 owner/repo');

    const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${task.workflowFile}/dispatches`;
    const body: any = { ref: task.branch };
    if (task.version || task.channel) {
      body.inputs = {};
      if (task.version) body.inputs.version = task.version;
      if (task.channel) body.inputs.channel = task.channel;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${task.githubToken}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.text();
        await this.prisma.compileTask.update({ where: { id }, data: { status: 'failed', log: err } });
        throw new BadRequestException(`触发失败: ${response.status} ${err}`);
      }

      const runsUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=1&branch=${task.branch}`;
      await new Promise(r => setTimeout(r, 3000));
      const runsRes = await fetch(runsUrl, {
        headers: { 'Authorization': `Bearer ${task.githubToken}`, 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      });
      const runsData = await runsRes.json();
      const runId = runsData.workflow_runs?.[0]?.id?.toString() || '';

      await this.prisma.compileTask.update({ where: { id }, data: { status: 'running', workflowRunId: runId, log: '构建已触发' } });

      return { success: true, workflowRunId: runId };
    } catch (e: any) {
      await this.prisma.compileTask.update({ where: { id }, data: { status: 'failed', log: e.message } });
      throw e;
    }
  }

  async checkStatus(id: number) {
    const task = await this.prisma.compileTask.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('任务不存在');
    if (task.status === 'failed') return task;
    if (!task.workflowRunId) return { ...task, message: '尚未触发构建' };

    const [owner, repo] = task.githubRepo.split('/');
    const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${task.workflowRunId}`;

    try {
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${task.githubToken}`, 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      });
      const data = await res.json();
      const conclusion = data.conclusion;
      const htmlUrl = data.html_url || '';

      if (conclusion === 'success') {
        const artifactsJson = task.artifacts
          ? task.artifacts
          : JSON.stringify(await this.fetchArtifacts(owner, repo, task));
        const artifactUrl = `${htmlUrl}/artifacts`;
        const artifacts = JSON.parse(artifactsJson);
        if (task.artifacts !== artifactsJson) {
          await this.prisma.compileTask.update({ where: { id }, data: { artifacts: artifactsJson } });
        }
        if (task.status !== 'success') {
          await this.prisma.compileTask.update({ where: { id }, data: { status: 'success', artifactUrl, log: '构建成功' } });
          this.cacheAllArtifacts(owner, repo, task.githubToken, artifacts);
          this.syncAppVersions(task, artifacts);
        }
        return { status: 'success', artifactUrl, artifacts, htmlUrl };
      }
      if (conclusion === 'failure' || conclusion === 'cancelled') {
        await this.prisma.compileTask.update({ where: { id }, data: { status: 'failed', log: `构建${conclusion}` } });
        return { status: 'failed', log: `构建${conclusion}`, htmlUrl };
      }

      return { status: task.status, message: `构建中: ${data.status || 'queued'}`, htmlUrl };
    } catch (e: any) {
      return { status: task.status, message: '检查状态失败: ' + e.message };
    }
  }

  async deleteTask(id: number) {
    await this.prisma.compileTask.findUnique({ where: { id } }).then(r => { if (!r) throw new NotFoundException('任务不存在'); });
    return this.prisma.compileTask.delete({ where: { id } });
  }

  private async fetchArtifacts(owner: string, repo: string, task: any) {
    const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${task.workflowRunId}/artifacts`;
    try {
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${task.githubToken}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });
      const data = await res.json();
      return (data.artifacts || []).map((a: any) => ({
        id: a.id,
        name: a.name.replace(/\.apk$/i, ''),
        size: a.size_in_bytes,
        downloadUrl: a.archive_download_url,
      }));
    } catch {
      return [];
    }
  }

  async downloadArtifact(id: number, artifactId: number, req: Request, res: Response) {
    const task = await this.prisma.compileTask.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('任务不存在');

    const [owner, repo] = task.githubRepo.split('/');
    const url = `https://api.github.com/repos/${owner}/${repo}/actions/artifacts/${artifactId}/zip`;

    const ghRes = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${task.githubToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      redirect: 'follow',
    });

    if (!ghRes.ok) throw new BadRequestException('下载工件失败');

    res.setHeader('Content-Type', ghRes.headers.get('content-type') || 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="artifact.zip"');
    res.setHeader('Content-Length', ghRes.headers.get('content-length') || '0');

    const reader = ghRes.body?.getReader();
    if (!reader) throw new BadRequestException('无法读取工件数据');

    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) { res.end(); break; }
        res.write(value);
      }
    };
    await pump();
  }

  private async cacheAllArtifacts(owner: string, repo: string, token: string, artifacts: any[]) {
    mkdirSync(APK_CACHE_DIR, { recursive: true });
    for (const art of artifacts) {
      try {
        const cachePath = join(APK_CACHE_DIR, art.name + '.apk');
        if (existsSync(cachePath)) continue;

        const url = `https://api.github.com/repos/${owner}/${repo}/actions/artifacts/${art.id}/zip`;
        const ghRes = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
          redirect: 'follow',
        });
        if (!ghRes.ok) continue;

        const zipBuffer = Buffer.from(await ghRes.arrayBuffer());
        const zip = new AdmZip(zipBuffer);
        const apkEntry = zip.getEntries().find(e => e.entryName.endsWith('.apk'));
        if (apkEntry) writeFileSync(cachePath, apkEntry.getData());
      } catch {}
    }
  }

  private async syncAppVersions(task: any, artifacts: any[]) {
    const channels = new Set(artifacts.map(a => a.name.replace(/-arm.*$|-aarch.*$/i, '')));
    const versionCode = parseInt(task.version?.replace(/\D/g, '')) || 1;
    const versionName = task.version || 'latest';
    const changelog = task.log || '构建成功';

    for (const channel of channels) {
      const art = artifacts.find(a => a.name === channel + '-arm64_v8a') || artifacts.find(a => a.name.startsWith(channel)) || artifacts[0];
      if (!art) continue;
      const downloadUrl = `https://mf.xuewen.plus:7443/api/app-manage/download/${art.name}`;

      const existing = await this.prisma.appVersion.findFirst({ where: { channel } });
      if (existing) {
        await this.prisma.appVersion.update({
          where: { id: existing.id },
          data: { versionName, versionCode, downloadUrl, changelog },
        });
      } else {
        await this.prisma.appVersion.create({
          data: { versionName, versionCode, channel, downloadUrl, changelog },
        });
      }
    }
  }
}
