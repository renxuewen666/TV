import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AdvertisementService {
  constructor(private prisma: PrismaClient) {}

  async list(page = 1, size = 20, position?: string, status?: number) {
    const where: any = {};
    if (position) where.position = position;
    if (status !== undefined) where.status = status;
    const skip = (page - 1) * size;
    const [list, total] = await Promise.all([
      this.prisma.advertisement.findMany({ where, skip, take: size, orderBy: { sort: 'asc' } }),
      this.prisma.advertisement.count({ where }),
    ]);
    return { list, total, page, size };
  }

  async active(appId?: string) {
    const items = await this.prisma.advertisement.findMany({
      where: { status: 1 },
      orderBy: { sort: 'asc' },
    });
    if (!appId) return items;
    return items.filter(
      (item) => !item.appIds || item.appIds.split(',').map((s) => s.trim()).includes(appId),
    );
  }

  private toDateOrNull(val: any): Date | null {
    if (!val) return null;
    if (val instanceof Date) return val;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  async create(data: any) {
    const sanitized = { ...data };
    sanitized.startAt = this.toDateOrNull(sanitized.startAt);
    sanitized.endAt = this.toDateOrNull(sanitized.endAt);
    return this.prisma.advertisement.create({ data: sanitized });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    const sanitized = { ...data };
    sanitized.startAt = this.toDateOrNull(sanitized.startAt);
    sanitized.endAt = this.toDateOrNull(sanitized.endAt);
    return this.prisma.advertisement.update({ where: { id }, data: sanitized });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.advertisement.delete({ where: { id } });
  }

  async updateSort(id: number, sort: number) {
    await this.findOne(id);
    return this.prisma.advertisement.update({ where: { id }, data: { sort } });
  }

  async batchDelete(ids: number[]) {
    return this.prisma.advertisement.deleteMany({ where: { id: { in: ids } } });
  }

  private async findOne(id: number) {
    const item = await this.prisma.advertisement.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('广告不存在');
    return item;
  }
}
