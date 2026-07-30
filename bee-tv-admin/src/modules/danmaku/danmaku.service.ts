import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { lookup } from 'dns/promises';
import { isIP } from 'net';

@Injectable()
export class DanmakuService {
  constructor(private prisma: PrismaClient) {}

  async list(page = 1, size = 20, status?: number) {
    const where: any = {};
    if (status !== undefined) where.status = status;
    const skip = (page - 1) * size;
    const [list, total] = await Promise.all([
      this.prisma.danmakuConfig.findMany({ where, skip, take: size, orderBy: { sort: 'asc' } }),
      this.prisma.danmakuConfig.count({ where }),
    ]);
    return { list, total, page, size };
  }

  async active(appId?: string) {
    const items = await this.prisma.danmakuConfig.findMany({
      where: { status: 1 },
      orderBy: { sort: 'asc' },
    });
    if (!appId) return items;
    return items.filter(
      (item) => !item.appIds || item.appIds.split(',').map((s) => s.trim()).includes(appId),
    );
  }

  async create(data: any) {
    return this.prisma.danmakuConfig.create({ data });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.danmakuConfig.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.danmakuConfig.delete({ where: { id } });
  }

  async updateSort(id: number, sort: number) {
    await this.findOne(id);
    return this.prisma.danmakuConfig.update({ where: { id }, data: { sort } });
  }

  async batchDelete(ids: number[]) {
    return this.prisma.danmakuConfig.deleteMany({ where: { id: { in: ids } } });
  }

  async test(id: number) {
    const config = await this.findOne(id);
    try {
      const headers: Record<string, string> = config.headers
        ? JSON.parse(config.headers)
        : {};
      const params: Record<string, string> = config.params
        ? JSON.parse(config.params)
        : {};

      const url = new URL(config.apiUrl);
      await this.assertSafeTestUrl(url);
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      try {
        const res = await fetch(url.toString(), {
          method: config.method || 'GET',
          headers,
          signal: controller.signal,
        });
        const text = await res.text();
        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
        return {
          success: res.ok,
          status: res.status,
          statusText: res.statusText,
          data,
        };
      } finally {
        clearTimeout(timer);
      }
    } catch (err: any) {
      return { success: false, error: err.message || '连接失败' };
    }
  }

  private async assertSafeTestUrl(url: URL) {
    if (!['http:', 'https:'].includes(url.protocol)) throw new BadRequestException('仅支持HTTP或HTTPS弹幕接口');
    if (!url.hostname || url.hostname === 'localhost' || url.hostname.endsWith('.localhost')) {
      throw new BadRequestException('不允许测试本地或内网地址');
    }

    const addresses = isIP(url.hostname) ? [url.hostname] : (await lookup(url.hostname, { all: true })).map((item) => item.address);
    if (addresses.some((address) => this.isPrivateAddress(address))) {
      throw new BadRequestException('不允许测试本地或内网地址');
    }
  }

  private isPrivateAddress(address: string) {
    if (address === '::1' || address.startsWith('fc') || address.startsWith('fd') || address.startsWith('fe80:')) return true;
    const parts = address.split('.').map(Number);
    if (parts.length !== 4 || parts.some(Number.isNaN)) return false;
    const [a, b] = parts;
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }

  private async findOne(id: number) {
    const item = await this.prisma.danmakuConfig.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('弹幕配置不存在');
    return item;
  }
}
