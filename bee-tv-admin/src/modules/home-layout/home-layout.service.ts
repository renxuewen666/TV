import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class HomeLayoutService {
  constructor(private prisma: PrismaClient) {}

  async findAll(type?: string) {
    const where: any = {};
    if (type) where.type = type;
    return this.prisma.homeLayout.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async create(data: { name: string; type: string; template: string; config: string }) {
    return this.prisma.homeLayout.create({ data });
  }

  async update(id: number, data: { name?: string; template?: string; config?: string; status?: number }) {
    return this.prisma.homeLayout.update({ where: { id }, data });
  }

  async remove(id: number) { await this.prisma.homeLayout.delete({ where: { id } }); return { success: true }; }

  async getActiveLayout(type: string) {
    return this.prisma.homeLayout.findFirst({ where: { type, status: 1 } });
  }

  async getActiveAll() {
    const [mobile, tv] = await Promise.all([
      this.prisma.homeLayout.findFirst({ where: { type: 'mobile', status: 1 } }),
      this.prisma.homeLayout.findFirst({ where: { type: 'tv', status: 1 } }),
    ]);
    return { mobile, tv };
  }
}
