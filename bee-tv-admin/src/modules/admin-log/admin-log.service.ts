import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AdminLogService {
  constructor(private prisma: PrismaClient) {}

  async list(page = 1, size = 20, query: { module?: string; action?: string; admin?: string } = {}) {
    const skip = (page - 1) * size;
    const where: any = {};
    if (query.module) where.module = { contains: query.module };
    if (query.action) where.action = { contains: query.action };
    if (query.admin) where.admin = { contains: query.admin };

    const [list, total] = await Promise.all([
      (this.prisma as any).adminLog.findMany({ where, skip, take: size, orderBy: { createdAt: 'desc' } }),
      (this.prisma as any).adminLog.count({ where }),
    ]);
    return { list, total, page, size };
  }

  async create(data: { adminId?: number; admin?: string; action: string; module?: string; method?: string; path?: string; ip?: string; remark?: string }) {
    try {
      return await (this.prisma as any).adminLog.create({
        data: {
          adminId: data.adminId || 0,
          admin: data.admin || '',
          action: data.action,
          module: data.module || '',
          method: data.method || '',
          path: data.path || '',
          ip: data.ip || '',
          remark: data.remark || '',
        },
      });
    } catch {
      return null;
    }
  }

  async clear() {
    const result = await (this.prisma as any).adminLog.deleteMany({});
    return { success: true, count: result.count };
  }
}
