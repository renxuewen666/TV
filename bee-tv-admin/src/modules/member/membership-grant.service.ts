import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

const DAY_MS = 24 * 60 * 60 * 1000;
const PERMANENT_DURATION_DAYS = 88888888;

export type MembershipGrantSource = 'activation_code' | 'epay' | 'admin' | 'balance' | 'score';

@Injectable()
export class MembershipGrantService {
  constructor(private prisma: PrismaClient) {}

  async grant(input: {
    appUserId: number;
    levelId: number;
    source: MembershipGrantSource;
    referenceId?: string;
  }) {
    return this.prisma.$transaction((tx) => this.grantInTransaction(tx, input));
  }

  async grantInTransaction(
    tx: Prisma.TransactionClient,
    input: { appUserId: number; levelId: number; source: MembershipGrantSource; referenceId?: string },
  ) {
      const [user, level] = await Promise.all([
        tx.appUser.findUnique({ where: { id: input.appUserId } }),
        tx.memberLevel.findUnique({ where: { id: input.levelId } }),
      ]);

      if (!user) throw new NotFoundException('应用用户不存在');
      if (!level) throw new NotFoundException('会员套餐不存在');
      if (level.status !== 1) throw new BadRequestException('会员套餐已停用');
      if (!Number.isInteger(level.duration) || level.duration <= 0) {
        throw new BadRequestException('会员套餐时长必须大于0天');
      }

      const now = new Date();
      const isPermanent = level.duration >= PERMANENT_DURATION_DAYS;
      const baseTime = user.memberExpireAt && user.memberExpireAt > now ? user.memberExpireAt : now;
      const expireAt = isPermanent
        ? new Date('9999-12-31T23:59:59.999Z')
        : new Date(baseTime.getTime() + level.duration * DAY_MS);

      const updatedUser = await tx.appUser.update({
        where: { id: user.id },
        data: { memberLevel: level.id, memberExpireAt: expireAt },
      });

    return {
      source: input.source,
      referenceId: input.referenceId || '',
      level: { id: level.id, name: level.name, duration: level.duration },
      user: updatedUser,
      expireAt,
      permanent: isPermanent,
    };
  }
}
