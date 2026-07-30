import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class HomeLayoutService {
  constructor(private prisma: PrismaClient) {}

  async findAll(type?: string, page?: string) {
    const where: any = {};
    if (type) where.type = type;
    if (page) where.page = page;
    return this.prisma.homeLayout.findMany({ where, orderBy: [{ status: 'desc' }, { updatedAt: 'desc' }] });
  }

  async create(data: { name: string; type: string; page?: string; template: string; config: string }) {
    return this.prisma.homeLayout.create({ data: { ...data, page: data.page || 'home' } });
  }

  async update(id: number, data: { name?: string; page?: string; template?: string; config?: string; status?: number }) {
    const current = await this.prisma.homeLayout.findUnique({ where: { id } });
    if (!current) throw new Error('布局不存在');
    if (data.status !== 1) return this.prisma.homeLayout.update({ where: { id }, data });
    return this.prisma.$transaction(async (tx) => {
      await tx.homeLayout.updateMany({ where: { type: current.type, page: data.page || current.page, status: 1, NOT: { id } }, data: { status: 0 } });
      return tx.homeLayout.update({ where: { id }, data: { ...data, status: 1 } });
    });
  }

  async remove(id: number) { await this.prisma.homeLayout.delete({ where: { id } }); return { success: true }; }

  async getActiveLayout(type: string, page = 'home') {
    return this.prisma.homeLayout.findFirst({ where: { type, page, status: 1 }, orderBy: { updatedAt: 'desc' } });
  }

  async getActiveAll() {
    const [mobile, tv] = await Promise.all([
      this.prisma.homeLayout.findMany({ where: { type: 'mobile', status: 1 }, orderBy: { updatedAt: 'desc' } }),
      this.prisma.homeLayout.findMany({ where: { type: 'tv', status: 1 }, orderBy: { updatedAt: 'desc' } }),
    ]);
    return { mobile, tv };
  }
}
