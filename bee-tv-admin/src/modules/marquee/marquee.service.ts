import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class MarqueeService {
  constructor(private prisma: PrismaClient) {}

  async list(page = 1, size = 20, position?: string, status?: number) {
    const where: any = {};
    if (position) where.position = position;
    if (status !== undefined) where.status = status;
    const skip = (page - 1) * size;
    const [list, total] = await Promise.all([
      this.prisma.marquee.findMany({ where, skip, take: size, orderBy: { sort: 'asc' } }),
      this.prisma.marquee.count({ where }),
    ]);
    return { list, total, page, size };
  }

  async active(appId?: string) {
    const items = await this.prisma.marquee.findMany({
      where: { status: 1 },
      orderBy: { sort: 'asc' },
    });
    if (!appId) return items;
    return items.filter(
      (item) => !item.appIds || item.appIds.split(',').map((s) => s.trim()).includes(appId),
    );
  }

  async create(data: any) {
    return this.prisma.marquee.create({ data });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.marquee.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.marquee.delete({ where: { id } });
  }

  async updateSort(id: number, sort: number) {
    await this.findOne(id);
    return this.prisma.marquee.update({ where: { id }, data: { sort } });
  }

  async batchDelete(ids: number[]) {
    return this.prisma.marquee.deleteMany({ where: { id: { in: ids } } });
  }

  private async findOne(id: number) {
    const item = await this.prisma.marquee.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('跑马灯不存在');
    return item;
  }
}
