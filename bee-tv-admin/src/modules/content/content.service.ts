import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaClient) {}

  private async getActiveVodEndpoint(): Promise<string | null> {
    const ep = await this.prisma.apiEndpoint.findFirst({
      where: { type: 0, status: 1 },
      orderBy: { createdAt: 'asc' },
    });
    if (!ep) return null;
    return ep.url.startsWith('http') ? ep.url : `http://${ep.url}`;
  }

  private async proxyRequest(baseUrl: string, path: string): Promise<any> {
    const url = `${baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'BeeTV-H5/1.0' },
      });
      const text = await res.text();
      try { return JSON.parse(text); } catch { return text; }
    } finally {
      clearTimeout(timer);
    }
  }

  async getHome(query: { p?: string; t?: string; f?: string }) {
    const baseUrl = await this.getActiveVodEndpoint();
    if (!baseUrl) return { list: [], total: 0, page: 1, pagecount: 0 };

    const params = new URLSearchParams();
    if (query.p) params.set('pg', query.p);
    if (query.t) params.set('t', query.t);
    if (query.f) params.set('f', query.f);

    const path = `/?${params.toString()}`;
    return this.proxyRequest(baseUrl, path);
  }

  async detail(id: string) {
    const baseUrl = await this.getActiveVodEndpoint();
    if (!baseUrl) return null;

    const params = new URLSearchParams({ ac: 'detail', ids: id });
    const path = `/?${params.toString()}`;
    return this.proxyRequest(baseUrl, path);
  }

  async search(keyword: string, query: { p?: string }) {
    const baseUrl = await this.getActiveVodEndpoint();
    if (!baseUrl) return { list: [], total: 0, page: 1, pagecount: 0 };

    const params = new URLSearchParams();
    params.set('wd', keyword);
    if (query.p) params.set('pg', query.p);

    const path = `/?${params.toString()}`;
    return this.proxyRequest(baseUrl, path);
  }

  async types() {
    return [
      { key: '1', name: '电影' },
      { key: '2', name: '电视剧' },
      { key: '3', name: '综艺' },
      { key: '4', name: '动漫' },
      { key: '5', name: '纪录片' },
    ];
  }
}
