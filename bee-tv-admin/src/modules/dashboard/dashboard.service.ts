import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaClient) {}

  async getStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 6 * 86400000);

    const [
      memberTotal, memberToday, memberLevels,
      signToday, signWeek,
      scoreDistributed, scoreSpent,
      orderTotal, orderPending, orderAmount,
      exchangeTotal, exchangeToday,
      activeCodes, activeNotices, activeSources,
    ] = await Promise.all([
      this.prisma.member.count(),
      this.prisma.member.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.memberLevel.count({ where: { status: 1 } }),
      this.prisma.signLog.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.signLog.count({ where: { createdAt: { gte: weekStart } } }),
      this.prisma.scoreLog.aggregate({ _sum: { score: true }, where: { score: { gt: 0 } } }),
      this.prisma.scoreLog.aggregate({ _sum: { score: true }, where: { score: { lt: 0 } } }),
      this.prisma.paymentOrder.count(),
      this.prisma.paymentOrder.count({ where: { status: 0 } }),
      this.prisma.paymentOrder.aggregate({ _sum: { amount: true } }),
      this.prisma.scoreExchange.count(),
      this.prisma.scoreExchange.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.activationCode.count({ where: { status: 0 } }),
      this.prisma.notice.count({ where: { status: 1 } }),
      this.prisma.repoSource.count({ where: { status: 1 } }),
    ]);

    const trendDays = 7;
    const trendStart = new Date(todayStart.getTime() - (trendDays - 1) * 86400000);
    const dates: string[] = [];
    for (let i = 0; i < trendDays; i++) {
      const d = new Date(trendStart.getTime() + i * 86400000);
      dates.push(d.toISOString().split('T')[0]);
    }

    const [newMembersRaw, signinsRaw] = await Promise.all([
      this.prisma.member.findMany({
        where: { createdAt: { gte: trendStart } },
        select: { createdAt: true },
      }),
      this.prisma.signLog.findMany({
        where: { createdAt: { gte: trendStart } },
        select: { createdAt: true },
      }),
    ]);

    const groupByDate = (records: { createdAt: Date }[]) => {
      const map: Record<string, number> = {};
      records.forEach(r => {
        const d = new Date(r.createdAt).toISOString().split('T')[0];
        map[d] = (map[d] || 0) + 1;
      });
      return dates.map(d => ({ date: d, count: map[d] || 0 }));
    };

    return {
      members: { total: memberTotal, todayNew: memberToday },
      memberLevels,
      signin: { today: signToday, thisWeek: signWeek },
      points: {
        totalDistributed: scoreDistributed._sum.score || 0,
        totalSpent: Math.abs(scoreSpent._sum.score || 0),
      },
      orders: { total: orderTotal, pending: orderPending, amount: orderAmount._sum.amount || 0 },
      exchanges: { total: exchangeTotal, today: exchangeToday },
      resources: { activeCodes, activeNotices, activeSources },
      trends: {
        newMembers: groupByDate(newMembersRaw),
        signins: groupByDate(signinsRaw),
      },
    };
  }
}
