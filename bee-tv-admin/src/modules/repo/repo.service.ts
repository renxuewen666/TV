import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';

@Injectable()
export class RepoService {
  private uploadDir = path.join(process.cwd(), 'uploads', 'repos');
  private jarProcesses: Map<number, ChildProcess> = new Map();

  constructor(private prisma: PrismaClient) {
    if (!fs.existsSync(this.uploadDir)) fs.mkdirSync(this.uploadDir, { recursive: true });
  }

  async findAll() {
    return this.prisma.repoSource.findMany({ orderBy: [{ isDefault: 'desc' }, { priority: 'desc' }, { id: 'asc' }] });
  }

  async create(data: { name: string; url: string; type: number; priority?: number; minMemberLevel?: number; isDefault?: boolean; status?: number }) {
    return this.prisma.repoSource.create({ data: this.normalizeAccess(data) as any });
  }

  async update(id: number, data: { name?: string; url?: string; priority?: number; minMemberLevel?: number; isDefault?: boolean; status?: number }) {
    return this.prisma.repoSource.update({ where: { id }, data: this.normalizeAccess(data) });
  }

  async remove(id: number) {
    const repo = await this.prisma.repoSource.findUnique({ where: { id } });
    if (repo) {
      const filePath = path.join(this.uploadDir, `${id}.jar`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await this.prisma.repoSource.delete({ where: { id } });
    return { success: true };
  }

  async uploadJar(id: number, file: Express.Multer.File) {
    const repo = await this.prisma.repoSource.findUnique({ where: { id } });
    if (!repo) throw new BadRequestException('仓库不存在');
    const filePath = path.join(this.uploadDir, `${id}.jar`);
    fs.writeFileSync(filePath, file.buffer);
    const url = `/api/repo/${id}/download`;
    return this.prisma.repoSource.update({ where: { id }, data: { url } });
  }

  async downloadJar(id: number) {
    const filePath = path.join(this.uploadDir, `${id}.jar`);
    if (!fs.existsSync(filePath)) throw new BadRequestException('文件不存在');
    return fs.readFileSync(filePath);
  }

  async testSpider(id: number, action: string, params?: string, jarPort?: number) {
    const repo = await this.prisma.repoSource.findUnique({ where: { id } });
    if (!repo) throw new BadRequestException('仓库不存在');

    if (repo.type === 0) {
      return this.testJarSpider(repo, action, params, jarPort || 9978);
    }
    return this.testHttpSpider(repo, action, params);
  }

  private buildCatVodUrl(baseUrl: string, action: string, params?: string): string {
    const url = baseUrl.replace(/\/+$/, '');
    switch (action) {
      case 'home':
        return url;
      case 'detail':
        return `${url}?ac=detail&ids=${encodeURIComponent(params || '')}`;
      case 'search':
        return `${url}?ac=search&wd=${encodeURIComponent(params || '')}`;
      case 'player':
        return `${url}?ac=play&id=${encodeURIComponent(params || '')}`;
      case 'category':
        return `${url}?ac=category&t=${encodeURIComponent(params || '')}`;
      default:
        return params ? `${url}?ac=${action}&${params}` : url;
    }
  }

  private async httpGet(url: string, timeout = 15000): Promise<{ ok: boolean; status: number; data: any; elapsed: number; error?: string }> {
    const start = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'BeeTV-Admin/1.0' } });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = text; }
      return { ok: res.ok, status: res.status, data, elapsed: Date.now() - start };
    } catch (e: any) {
      if (e.name === 'AbortError') {
        return { ok: false, status: 0, data: null, elapsed: Date.now() - start, error: '请求超时' };
      }
      return { ok: false, status: 0, data: null, elapsed: Date.now() - start, error: e.message };
    } finally {
      clearTimeout(timer);
    }
  }

  private async waitForPort(port: number, maxWait = 15000): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < maxWait) {
      try {
        const res = await fetch(`http://localhost:${port}`, { signal: AbortSignal.timeout(2000), headers: { 'User-Agent': 'BeeTV-Admin/1.0' } });
        if (res.ok || res.status < 500) return true;
      } catch {}
      await new Promise(r => setTimeout(r, 500));
    }
    return false;
  }

  private async testJarSpider(repo: any, action: string, params?: string, port?: number) {
    const jarPort = port || 9978;
    const jarPath = path.join(this.uploadDir, `${repo.id}.jar`);

    if (!fs.existsSync(jarPath)) {
      return {
        status: 'error',
        repo: repo.name,
        type: repo.type,
        action,
        message: 'JAR文件不存在，请先上传JAR文件',
        data: null,
      };
    }

    this.killJarProcess(repo.id);

    const proc = spawn('java', ['-jar', jarPath, `--port=${jarPort}`], {
      cwd: this.uploadDir,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    this.jarProcesses.set(repo.id, proc);

    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (d: Buffer) => { stdout += d.toString(); });
    proc.stderr?.on('data', (d: Buffer) => { stderr += d.toString(); });

    proc.on('exit', () => { this.jarProcesses.delete(repo.id); });

    const ready = await this.waitForPort(jarPort);

    if (!ready) {
      this.killJarProcess(repo.id);
      return {
        status: 'error',
        repo: repo.name,
        type: repo.type,
        action,
        message: `JAR爬虫启动超时(${jarPort})，请检查端口是否正确`,
        data: { stdout: stdout.slice(-500), stderr: stderr.slice(-500) },
      };
    }

    const testUrl = this.buildCatVodUrl(`http://localhost:${jarPort}`, action, params);
    const result = await this.httpGet(testUrl);

    this.killJarProcess(repo.id);

    return {
      status: result.ok ? 'ok' : 'error',
      repo: repo.name,
      type: repo.type,
      action,
      targetUrl: testUrl,
      message: result.ok ? `JAR爬虫 [${repo.name}] ${action} 测试成功` : `请求失败 HTTP ${result.status}`,
      elapsed: result.elapsed,
      error: result.error,
      data: result.data,
    };
  }

  private async testHttpSpider(repo: any, action: string, params?: string) {
    if (!repo.url || repo.url === '/') {
      return {
        status: 'error',
        repo: repo.name,
        type: repo.type,
        action,
        message: '仓库地址为空',
        data: null,
      };
    }

    const baseUrl = repo.url.startsWith('http') ? repo.url : `http://${repo.url}`;
    const testUrl = this.buildCatVodUrl(baseUrl, action, params);
    const result = await this.httpGet(testUrl);

    return {
      status: result.ok ? 'ok' : 'error',
      repo: repo.name,
      type: repo.type,
      action,
      targetUrl: testUrl,
      message: result.ok ? `爬虫 [${repo.name}] ${action} 测试成功` : `请求失败 HTTP ${result.status}`,
      elapsed: result.elapsed,
      error: result.error,
      data: result.data,
    };
  }

  private killJarProcess(id: number) {
    const proc = this.jarProcesses.get(id);
    if (proc) {
      proc.kill('SIGTERM');
      this.jarProcesses.delete(id);
    }
  }

  async getActiveRepos(memberLevel = 0) {
    return this.prisma.repoSource.findMany({
      where: { status: 1, minMemberLevel: { lte: memberLevel } },
      orderBy: [{ isDefault: 'desc' }, { priority: 'desc' }, { id: 'asc' }],
    });
  }

  private normalizeAccess(data: Record<string, any>) {
    const normalized: Record<string, any> = { ...data };
    if (normalized.minMemberLevel !== undefined) normalized.minMemberLevel = Math.max(0, Number(normalized.minMemberLevel) || 0);
    if (normalized.isDefault !== undefined) normalized.isDefault = Boolean(normalized.isDefault);
    return normalized;
  }
}
