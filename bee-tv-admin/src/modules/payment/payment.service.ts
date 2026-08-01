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
    const levelIds = [...new Set(list.map((item) => item.levelId))];
    const userIds = [...new Set(list.map((item) => Number(item.userId)).filter((id) => Number.isInteger(id) && id > 0))];
    const [levels, users] = await Promise.all([
      levelIds.length ? this.prisma.memberLevel.findMany({ where: { id: { in: levelIds } } }) : [],
      userIds.length ? this.prisma.appUser.findMany({ where: { id: { in: userIds } }, select: { id: true, nickname: true, email: true } }) : [],
    ]);
    const levelMap = new Map<number, string>(levels.map((level: any) => [level.id, level.name] as [number, string]));
    const userMap = new Map<number, any>(users.map((user: any) => [user.id, user] as [number, any]));
    return {
      list: list.map((item) => ({
        ...item,
        levelName: levelMap.get(item.levelId) || '',
        user: userMap.get(Number(item.userId)) || null,
      })),
      total,
      page,
      size,
    };
  }
}
