import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ApiManageService {
  constructor(private prisma: PrismaClient) {}

  async findAll(type?: number) {
    const where: any = {};
    if (type !== undefined) where.type = type;
    return this.prisma.apiEndpoint.findMany({ where, orderBy: [{ type: 'asc' }, { isDefault: 'desc' }, { priority: 'desc' }, { id: 'asc' }] });
  }

  async create(data: { name: string; type: number; url: string; remark?: string; minMemberLevel?: number; priority?: number; isDefault?: boolean; status?: number }) {
    return this.prisma.apiEndpoint.create({ data: this.normalizeAccess(data) as any });
  }

  async update(id: number, data: { name?: string; type?: number; url?: string; remark?: string; minMemberLevel?: number; priority?: number; isDefault?: boolean; status?: number }) {
    return this.prisma.apiEndpoint.update({ where: { id }, data: this.normalizeAccess(data) });
  }

  async remove(id: number) { await this.prisma.apiEndpoint.delete({ where: { id } }); return { success: true }; }

  async getAppConfig(memberLevel = 0) {
    const endpoints = await this.prisma.apiEndpoint.findMany({
      where: { status: 1, minMemberLevel: { lte: memberLevel } },
      orderBy: [{ isDefault: 'desc' }, { priority: 'desc' }, { id: 'asc' }],
    });
    return {
      vod: endpoints.filter(e => e.type === 0),
      live: endpoints.filter(e => e.type === 1),
      wall: endpoints.filter(e => e.type === 2),
      parse: endpoints.filter(e => e.type === 3),
    };
  }

  private normalizeAccess(data: Record<string, any>) {
    const normalized: Record<string, any> = { ...data };
    if (normalized.minMemberLevel !== undefined) normalized.minMemberLevel = Math.max(0, Number(normalized.minMemberLevel) || 0);
    if (normalized.priority !== undefined) normalized.priority = Number(normalized.priority) || 0;
    if (normalized.isDefault !== undefined) normalized.isDefault = Boolean(normalized.isDefault);
    return normalized;
  }

  async testEndpoint(id: number) {
    const ep = await this.prisma.apiEndpoint.findUnique({ where: { id } });
    if (!ep) throw new BadRequestException('接口不存在');
    if (!ep.url || ep.url === '/') throw new BadRequestException('接口地址为空');

    const url = ep.url.startsWith('http') ? ep.url : `http://${ep.url}`;
    const start = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'BeeTV-Admin/1.0' } });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = text; }
      return {
        status: res.ok ? 'ok' : 'error',
        endpoint: ep.name,
        type: ep.type,
        targetUrl: url,
        httpStatus: res.status,
        elapsed: Date.now() - start,
        message: res.ok ? `接口 [${ep.name}] 测试成功` : `请求失败 HTTP ${res.status}`,
        data,
      };
    } catch (e: any) {
      clearTimeout(timer);
      return {
        status: 'error',
        endpoint: ep.name,
        type: ep.type,
        targetUrl: url,
        httpStatus: 0,
        elapsed: Date.now() - start,
        message: e.name === 'AbortError' ? '请求超时' : `请求失败: ${e.message}`,
        data: null,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
