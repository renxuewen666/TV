import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ScoreService {
  constructor(private prisma: PrismaClient) {}

  async getProducts() {
    return this.prisma.scoreProduct.findMany({ orderBy: { sort: 'asc' } });
  }

  async createProduct(data: any) {
    return this.prisma.scoreProduct.create({ data });
  }

  async updateProduct(id: number, data: any) {
    return this.prisma.scoreProduct.update({ where: { id }, data });
  }

  async deleteProduct(id: number) {
    return this.prisma.scoreProduct.delete({ where: { id } });
  }

  async getExchanges(page = 1, size = 20, userId?: string) {
    const where: any = {};
    if (userId) where.userId = userId;
    const skip = (page - 1) * size;
    const [list, total] = await Promise.all([
      this.prisma.scoreExchange.findMany({ where, skip, take: size, orderBy: { createdAt: 'desc' } }),
      this.prisma.scoreExchange.count({ where }),
    ]);
    return { list, total, page, size };
  }

  async exchange(userId: string, productId: number) {
    const member = await this.prisma.member.findUnique({ where: { userId } });
    if (!member) throw new NotFoundException('用户不存在');

    const product = await this.prisma.scoreProduct.findUnique({ where: { id: productId } });
    if (!product || product.status === 0) throw new NotFoundException('商品不存在或已下架');

    if (product.stock === 0) throw new BadRequestException('商品库存不足');
    if (member.score < product.points) throw new BadRequestException(`积分不足，需要${product.points}积分，当前${member.score}积分`);

    const result = await this.prisma.$transaction(async (tx) => {
      const afterScore = member.score - product.points;

      if (product.stock > 0) {
        await tx.scoreProduct.update({ where: { id: productId }, data: { stock: product.stock - 1 } });
      }

      let exchangeResult = '';

      if (product.type === 0) {
        const days = parseInt(product.value) || 0;
        if (days <= 0) throw new BadRequestException('VIP天数配置错误');
        const now = new Date();
        const baseExpire = member.expireAt && member.expireAt > now ? new Date(member.expireAt) : now;
        const newExpire = new Date(baseExpire.getTime() + days * 86400000);
        await tx.member.update({ where: { userId }, data: { expireAt: newExpire } });
        exchangeResult = `VIP延长${days}天，到期: ${newExpire.toISOString().split('T')[0]}`;
      } else if (product.type === 1) {
        const levelId = parseInt(product.value) || 0;
        if (levelId <= 0) throw new BadRequestException('会员等级配置错误');
        const level = await tx.memberLevel.findUnique({ where: { id: levelId } });
        if (!level) throw new BadRequestException('会员等级不存在');
        const code = this.generateCode();
        await tx.activationCode.create({
          data: { code, levelId, status: 0 },
        });
        exchangeResult = `激活码: ${code} (${level.name})`;
      }

      await tx.member.update({ where: { userId }, data: { score: afterScore } });

      await tx.scoreLog.create({
        data: {
          userId,
          type: 'exchange',
          score: -product.points,
          balance: afterScore,
          remark: `兑换: ${product.name}`,
        },
      });

      const exchange = await tx.scoreExchange.create({
        data: {
          userId,
          productId,
          productName: product.name,
          points: product.points,
          result: exchangeResult,
          status: 0,
        },
      });

      return { exchange, afterScore, result: exchangeResult };
    });

    return result;
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 16; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }
}
