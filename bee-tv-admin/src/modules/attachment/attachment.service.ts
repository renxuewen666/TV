import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AttachmentService {
  constructor(private prisma: PrismaClient) {}

  async list(
    page = 1,
    size = 20,
    keyword?: string,
    module?: string,
    type?: string,
  ) {
    const where: any = {};
    if (keyword) where.name = { contains: keyword };
    if (module) where.module = module;
    if (type) where.type = type;
    const skip = (page - 1) * size;
    const [list, total] = await Promise.all([
      this.prisma.attachment.findMany({
        where,
        skip,
        take: size,
        orderBy: { id: 'desc' },
      }),
      this.prisma.attachment.count({ where }),
    ]);
    return { list, total, page, size };
  }

  async create(data: any) {
    return this.prisma.attachment.create({ data });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.attachment.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.attachment.delete({ where: { id } });
  }

  private async findOne(id: number) {
    const item = await this.prisma.attachment.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('附件不存在');
    return item;
  }
}
