import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaClient) {}

  async getConfigs() { return this.prisma.paymentConfig.findMany(); }

  async saveConfig(channel: string, config: string) {
    return this.prisma.paymentConfig.upsert({
      where: { channel },
      update: { config },
      create: { channel, config },
    });
  }

  async updateStatus(channel: string, status: number) {
    return this.prisma.paymentConfig.update({ where: { channel }, data: { status } });
  }

  async getOrders(page = 1, size = 20) {
    const skip = (page - 1) * size;
    const [list, total] = await Promise.all([
      this.prisma.paymentOrder.findMany({ skip, take: size, orderBy: { createdAt: 'desc' } }),
      this.prisma.paymentOrder.count(),
    ]);
    return { list, total, page, size };
  }
}
