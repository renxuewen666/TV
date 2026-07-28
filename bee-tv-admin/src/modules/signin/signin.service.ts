import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class SigninService {
  constructor(private prisma: PrismaClient) {}

  async sign(userId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const existing = await this.prisma.signLog.findFirst({ where: { userId, signDate: today } });
    if (existing) throw new BadRequestException('今日已签到');

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const prev = await this.prisma.signLog.findFirst({ where: { userId, signDate: yesterday } });
    const consecutiveDays = prev ? prev.consecutiveDays + 1 : 1;

    const baseReward = 10;
    const bonus = Math.min((consecutiveDays - 1) * 2, 20);
    const reward = baseReward + bonus;

    const member = await this.prisma.member.findUnique({ where: { userId } });
    const oldScore = member?.score || 0;
    const newScore = oldScore + reward;

    await this.prisma.member.upsert({
      where: { userId },
      update: { score: newScore },
      create: { userId, levelId: 1, deviceId: '', score: newScore },
    });

    await this.prisma.signLog.create({ data: { userId, signDate: today, consecutiveDays, reward } });
    await this.prisma.scoreLog.create({ data: { userId, type: 'sign_in', score: reward, balance: newScore, remark: `连续签到第${consecutiveDays}天` } });

    return { consecutiveDays, reward, totalScore: newScore };
  }

  async getStatus(userId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const signed = await this.prisma.signLog.findFirst({ where: { userId, signDate: today } });
    const member = await this.prisma.member.findUnique({ where: { userId } });
    return { signed: !!signed, score: member?.score || 0, todayReward: signed?.reward || 0 };
  }

  async getLogs(page = 1, size = 20, userId?: string) {
    const where: any = {};
    if (userId) where.userId = userId;
    const skip = (page - 1) * size;
    const [list, total] = await Promise.all([
      this.prisma.signLog.findMany({ where, skip, take: size, orderBy: { createdAt: 'desc' } }),
      this.prisma.signLog.count({ where }),
    ]);
    return { list, total, page, size };
  }

  async getScoreLogs(page = 1, size = 20, userId?: string) {
    const where: any = {};
    if (userId) where.userId = userId;
    const skip = (page - 1) * size;
    const [list, total] = await Promise.all([
      this.prisma.scoreLog.findMany({ where, skip, take: size, orderBy: { createdAt: 'desc' } }),
      this.prisma.scoreLog.count({ where }),
    ]);
    return { list, total, page, size };
  }
}
