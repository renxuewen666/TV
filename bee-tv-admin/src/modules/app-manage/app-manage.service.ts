import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import AdmZip from 'adm-zip';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const CACHE_DIR = join(process.cwd(), 'public', 'apk');

@Injectable()
export class AppManageService {
  constructor(private prisma: PrismaClient) {}

  async getVersions(channel?: string) {
    const where: any = {};
    if (channel) where.channel = channel;
    return this.prisma.appVersion.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async createVersion(data: { versionName: string; versionCode: number; downloadUrl: string; channel?: string; changelog?: string; forceUpdate?: number }) {
    return this.prisma.appVersion.create({ data });
  }

  async updateVersion(id: number, data: { status?: number }) {
    return this.prisma.appVersion.update({ where: { id }, data });
  }

  async deleteVersion(id: number) { await this.prisma.appVersion.delete({ where: { id } }); return { success: true }; }

  async getLatestVersion(channel?: string) {
    const where: any = { status: 1 };
    if (channel) where.channel = channel;
    return this.prisma.appVersion.findFirst({ where, orderBy: { versionCode: 'desc' } });
  }

  async getChannels() { return this.prisma.appChannel.findMany(); }

  async createChannel(data: { name: string; packageId?: string }) {
    return this.prisma.appChannel.create({ data });
  }

  async deleteChannel(id: number) { await this.prisma.appChannel.delete({ where: { id } }); return { success: true }; }

  async getArtifactByName(name: string) {
    const task = await this.prisma.compileTask.findFirst({
      where: { status: 'success' },
      orderBy: { id: 'desc' },
    });
    if (!task || !task.artifacts) throw new NotFoundException('无可用构建产物');

    const artifacts = JSON.parse(task.artifacts);
    const artifact = artifacts.find((a: any) => a.name === name);
    if (!artifact) throw new NotFoundException(`未找到产物: ${name}`);

    return { task, artifact };
  }

  async downloadAndExtractApk(task: any, artifactId: number, artifactName: string): Promise<{ buffer: Buffer; filename: string }> {
    mkdirSync(CACHE_DIR, { recursive: true });
    const cachePath = join(CACHE_DIR, artifactName + '.apk');

    if (existsSync(cachePath)) {
      return { buffer: readFileSync(cachePath), filename: artifactName + '.apk' };
    }

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

    if (!ghRes.ok) throw new NotFoundException('下载GitHub工件失败');

    const zipBuffer = Buffer.from(await ghRes.arrayBuffer());
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();
    const apkEntry = entries.find(e => e.entryName.endsWith('.apk'));
    if (!apkEntry) throw new NotFoundException('工件中没有APK文件');

    const apkData = apkEntry.getData();
    writeFileSync(cachePath, apkData);

    return { buffer: apkData, filename: artifactName + '.apk' };
  }
}
