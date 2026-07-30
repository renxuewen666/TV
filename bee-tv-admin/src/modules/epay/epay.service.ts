import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import { MembershipGrantService } from '../member/membership-grant.service';

@Injectable()
export class EpayService {
  constructor(
    private prisma: PrismaClient,
    private membershipGrantService: MembershipGrantService,
  ) {}

  async getConfigs() {
    return this.prisma.epayConfig.findMany({ where: { status: 1 } });
  }

  async getConfig(id: number) {
    const config = await this.prisma.epayConfig.findUnique({ where: { id } });
    if (!config) throw new NotFoundException('支付配置不存在');
    return config;
  }

  async createConfig(data: { name: string; pid: string; key: string; apiUrl: string; notifyUrl?: string; returnUrl?: string }) {
    return this.prisma.epayConfig.create({ data });
  }

  async updateConfig(id: number, data: any) {
    await this.getConfig(id);
    return this.prisma.epayConfig.update({ where: { id }, data });
  }

  async deleteConfig(id: number) {
    await this.getConfig(id);
    return this.prisma.epayConfig.delete({ where: { id } });
  }

  async createOrder(configId: number, appUserId: number, levelId: number, payType: string) {
    const [config, user, level] = await Promise.all([
      this.getConfig(configId),
      this.prisma.appUser.findUnique({ where: { id: appUserId } }),
      this.prisma.memberLevel.findUnique({ where: { id: levelId } }),
    ]);
    if (!user || user.status !== 1) throw new NotFoundException('应用用户不存在或已禁用');
    if (!level || level.status !== 1) throw new NotFoundException('会员套餐不存在或已停用');
    if (!Number.isFinite(level.price) || level.price < 0) throw new BadRequestException('会员套餐价格无效');

    const orderNo = this.genOrderNo();
    const order = await this.prisma.paymentOrder.create({
      data: { orderNo, userId: String(appUserId), levelId, amount: level.price, channel: 'epay', payType, status: 0 },
    });

    const signStr = `pid=${config.pid}&type=${payType}&out_trade_no=${orderNo}&notify_url=${config.notifyUrl}&return_url=${config.returnUrl}&name=${encodeURIComponent(level.name)}&money=${level.price}`;
    const sign = crypto.createHash('md5').update(signStr + config.key).digest('hex');

    return {
      orderNo,
      amount: level.price,
      payUrl: `${config.apiUrl}?${signStr}&sign=${sign}&sign_type=MD5`,
    };
  }

  async handleNotify(params: any) {
    const { pid, trade_no, out_trade_no, type, name, money, trade_status, sign } = params;
    if (trade_status !== 'TRADE_SUCCESS') return 'fail';

    const order = await this.prisma.paymentOrder.findUnique({ where: { orderNo: out_trade_no } });
    if (!order) return 'fail';
    if (order.status === 1) return 'success';

    const config = await this.prisma.epayConfig.findFirst({ where: { pid } });
    if (!config) return 'fail';

    const signStr = `pid=${pid}&trade_no=${trade_no}&out_trade_no=${out_trade_no}&type=${type}&name=${name}&money=${money}&trade_status=${trade_status}`;
    const expectedSign = crypto.createHash('md5').update(signStr + config.key).digest('hex');
    if (sign !== expectedSign) return 'fail';

    if (Number(money) !== order.amount) return 'fail';
    const appUserId = Number(order.userId);
    if (!Number.isInteger(appUserId) || appUserId <= 0) return 'fail';

    try {
      await this.prisma.$transaction(async (tx) => {
        const latestOrder = await tx.paymentOrder.findUnique({ where: { id: order.id } });
        if (!latestOrder || latestOrder.status === 1) return;
        await this.membershipGrantService.grantInTransaction(tx, {
          appUserId,
          levelId: latestOrder.levelId,
          source: 'epay',
          referenceId: latestOrder.orderNo,
        });
        await tx.paymentOrder.update({
          where: { id: latestOrder.id },
          data: { status: 1, tradeNo: trade_no, paidAt: new Date() },
        });
      });
    } catch {
      return 'fail';
    }

    return 'success';
  }

  async queryOrder(orderNo: string) {
    const order = await this.prisma.paymentOrder.findUnique({ where: { orderNo } });
    if (!order) throw new NotFoundException('订单不存在');
    return { orderNo: order.orderNo, amount: order.amount, status: order.status, paidAt: order.paidAt };
  }

  async getOrders(page = 1, size = 20, status?: number) {
    const where: any = {};
    if (status !== undefined && status !== null) where.status = Number(status);
    const skip = (page - 1) * size;
    const [list, total] = await Promise.all([
      this.prisma.paymentOrder.findMany({ where, skip, take: size, orderBy: { createdAt: 'desc' } }),
      this.prisma.paymentOrder.count({ where }),
    ]);
    return { list, total, page, size };
  }

  private genOrderNo(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2, 10);
  }
}
