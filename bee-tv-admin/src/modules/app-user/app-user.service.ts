import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AppUserService {
  constructor(private prisma: PrismaClient) {}

  async getProfile(userId: number) {
    const user = await this.prisma.appUser.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('用户不存在');
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      memberLevel: user.memberLevel,
      memberExpireAt: user.memberExpireAt,
      score: user.score,
    };
  }

  async updateProfile(userId: number, dto: { nickname?: string; avatar?: string }) {
    return this.prisma.appUser.update({
      where: { id: userId },
      data: {
        ...(dto.nickname && { nickname: dto.nickname }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar }),
      },
    });
  }

  async signIn(userId: number) {
    const today = new Date().toISOString().slice(0, 10);
    const existing = await this.prisma.appSignLog.findUnique({
      where: { userId_signDate: { userId, signDate: today } },
    });
    if (existing) throw new BadRequestException('今日已签到');

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const prev = await this.prisma.appSignLog.findUnique({
      where: { userId_signDate: { userId, signDate: yesterday } },
    });
    const consecutiveDays = prev ? prev.consecutiveDays + 1 : 1;

    const baseReward = 10;
    const bonus = Math.min((consecutiveDays - 1) * 2, 20);
    const reward = baseReward + bonus;

    const user = await this.prisma.appUser.findUnique({ where: { id: userId } });
    const newScore = (user?.score || 0) + reward;

    await this.prisma.appUser.update({ where: { id: userId }, data: { score: newScore } });
    await this.prisma.appSignLog.create({ data: { userId, signDate: today, consecutiveDays, reward } });
    await this.prisma.appScoreLog.create({ data: { userId, type: 'sign_in', score: reward, balance: newScore, remark: `连续签到第${consecutiveDays}天` } });

    return { consecutiveDays, reward, totalScore: newScore };
  }

  async getSignStatus(userId: number) {
    const today = new Date().toISOString().slice(0, 10);
    const signed = await this.prisma.appSignLog.findUnique({
      where: { userId_signDate: { userId, signDate: today } },
    });
    const user = await this.prisma.appUser.findUnique({ where: { id: userId } });
    return { signed: !!signed, consecutiveDays: signed?.consecutiveDays || 0, score: user?.score || 0, todayReward: signed?.reward || 0 };
  }

  async getScoreLogs(userId: number, page = 1) {
    const limit = 20;
    const [list, total] = await Promise.all([
      this.prisma.appScoreLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.appScoreLog.count({ where: { userId } }),
    ]);
    return { list, total, page, pagecount: Math.ceil(total / limit) };
  }

  async getHistory(userId: number, page = 1) {
    const limit = 20;
    const [list, total] = await Promise.all([
      this.prisma.userHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        distinct: ['vodId'],
      }),
      this.prisma.userHistory.count({ where: { userId } }),
    ]);
    return { list, total, page, pagecount: Math.ceil(total / limit) };
  }

  async addHistory(userId: number, dto: { vodId: string; vodName: string; vodPic: string; remark: string }) {
    await this.prisma.userHistory.deleteMany({ where: { userId, vodId: dto.vodId } });
    return this.prisma.userHistory.create({
      data: { userId, vodId: dto.vodId, vodName: dto.vodName, vodPic: dto.vodPic || '', remark: dto.remark || '' },
    });
  }

  async getFavorites(userId: number, page = 1) {
    const limit = 20;
    const [list, total] = await Promise.all([
      this.prisma.userFavorite.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.userFavorite.count({ where: { userId } }),
    ]);
    return { list, total, page, pagecount: Math.ceil(total / limit) };
  }

  async addFavorite(userId: number, dto: { vodId: string; vodName: string; vodPic: string; type: string; remark: string }) {
    return this.prisma.userFavorite.upsert({
      where: { userId_vodId: { userId, vodId: dto.vodId } },
      update: { vodName: dto.vodName, vodPic: dto.vodPic || '', type: dto.type || '', remark: dto.remark || '' },
      create: { userId, vodId: dto.vodId, vodName: dto.vodName, vodPic: dto.vodPic || '', type: dto.type || '', remark: dto.remark || '' },
    });
  }

  async removeFavorite(userId: number, vodId: string) {
    await this.prisma.userFavorite.deleteMany({ where: { userId, vodId } });
    return { success: true };
  }
}
