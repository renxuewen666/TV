import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class HotsearchService {
  constructor(private prisma: PrismaClient) {}

  async list() { return this.prisma.hotsearch.findMany({ orderBy: { sort: 'asc' } }); }

  async active() { return this.prisma.hotsearch.findMany({ where: { status: 1 }, orderBy: { sort: 'asc' } }); }

  async create(data: { title: string; url?: string; sort?: number; appIds?: string }) {
    return this.prisma.hotsearch.create({ data: { title: data.title, url: data.url || '', sort: data.sort || 0, appIds: data.appIds || '' } });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.hotsearch.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.hotsearch.delete({ where: { id } });
  }

  private async findOne(id: number) {
    const item = await this.prisma.hotsearch.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('热搜不存在');
    return item;
  }
}
