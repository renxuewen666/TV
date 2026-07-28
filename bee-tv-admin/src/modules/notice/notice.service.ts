import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class NoticeService {
  constructor(private prisma: PrismaClient) {}

  async list(page = 1, size = 20, type?: number) {
    const where: any = {};
    if (type) where.type = +type;
    const skip = (page - 1) * size;
    const [list, total] = await Promise.all([
      this.prisma.notice.findMany({ where, skip, take: size, orderBy: { createdAt: 'desc' } }),
      this.prisma.notice.count({ where }),
    ]);
    return { list, total, page, size };
  }

  async active() { return this.prisma.notice.findMany({ where: { status: 1 }, orderBy: { createdAt: 'desc' } }); }

  async create(data: { title: string; content: string; type?: number; appIds?: string }) {
    return this.prisma.notice.create({ data: { title: data.title, content: data.content, type: data.type || 1, appIds: data.appIds || '' } });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.notice.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.notice.delete({ where: { id } });
  }

  private async findOne(id: number) {
    const item = await this.prisma.notice.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('公告不存在');
    return item;
  }
}
