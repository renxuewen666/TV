import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateLevelDto, CreateMemberRuleDto, UpdateLevelDto, UpdateMemberRuleDto } from './dto/member.dto';
import { MembershipGrantService } from './membership-grant.service';

@Injectable()
export class MemberService {
  constructor(
    private prisma: PrismaClient,
    private membershipGrantService: MembershipGrantService,
  ) {}

  async getLevels() {
    return this.prisma.memberLevel.findMany({ orderBy: { sort: 'asc' } });
  }

  async getPackages() {
    return this.prisma.memberGroup.findMany({ where: { status: 1 }, orderBy: { sort: 'asc' } });
  }

  async createLevel(dto: CreateLevelDto) {
    this.validateLevel(dto);
    return this.prisma.memberLevel.create({ data: dto });
  }

  async updateLevel(id: number, dto: UpdateLevelDto) {
    this.validateLevel(dto);
    return this.prisma.memberLevel.update({ where: { id }, data: dto });
  }

  async deleteLevel(id: number) {
    const group = await this.prisma.memberGroup.findFirst({ where: { levelId: id } });
    if (group) throw new BadRequestException('请先删除关联的会员套餐分组');
    await this.prisma.memberLevel.delete({ where: { id } });
    return { success: true };
  }

  async getMembers(page = 1, size = 20, group?: string, status?: string) {
    const skip = (page - 1) * size;
    const where: any = {};
    if (group) where.memberLevel = +group;
    if (status) where.status = +status;
    const [list, total] = await Promise.all([
      this.prisma.appUser.findMany({
        skip,
        take: size,
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          nickname: true,
          status: true,
          score: true,
          balance: true,
          memberLevel: true,
          memberExpireAt: true,
          createdAt: true,
        },
      }),
      this.prisma.appUser.count({ where }),
    ]);
    const levelIds = [...new Set(list.map((member) => member.memberLevel).filter(Boolean))];
    const levels = levelIds.length ? await this.prisma.memberLevel.findMany({ where: { id: { in: levelIds } } }) : [];
    const levelMap = new Map(levels.map((level) => [level.id, level]));
    return {
      list: list.map((member) => ({
        ...member,
        userId: String(member.id),
        levelId: member.memberLevel,
        expireAt: member.memberExpireAt,
        level: levelMap.get(member.memberLevel) || null,
      })),
      total,
      page,
      size,
    };
  }

  async grantMembership(appUserId: number, levelId: number, remark = '') {
    const result = await this.membershipGrantService.grant({
      appUserId,
      levelId,
      source: 'admin',
      referenceId: remark,
    });
    return {
      success: true,
      levelName: result.level.name,
      expireAt: result.expireAt.toISOString(),
      permanent: result.permanent,
    };
  }

  async updateMember(id: number, data: { levelId?: number; score?: number; balance?: number; status?: number; remark?: string }) {
    const existing = await this.prisma.appUser.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('应用用户不存在');

    if (data.levelId && data.levelId !== existing.memberLevel) {
      await this.grantMembership(id, data.levelId, data.remark || '后台调整会员套餐');
    }

    const updateData: { score?: number; balance?: number; status?: number } = {};
    if (data.score !== undefined) updateData.score = Number(data.score);
    if (data.balance !== undefined) updateData.balance = Number(data.balance);
    if (data.status !== undefined) updateData.status = Number(data.status);
    if (Object.keys(updateData).length) await this.prisma.appUser.update({ where: { id }, data: updateData });
    return this.prisma.appUser.findUnique({ where: { id } });
  }

  async deleteMember(id: number) {
    await this.prisma.appUser.update({ where: { id }, data: { status: 0 } });
    return { success: true };
  }

  async generateCodes(levelId: number, count: number) {
    const level = await this.prisma.memberLevel.findFirst({ where: { id: levelId, status: 1 } });
    if (!level) throw new BadRequestException('请选择启用的会员套餐');
    if (!Number.isInteger(count) || count < 1 || count > 500) throw new BadRequestException('卡密数量必须在1到500之间');

    const codes: Array<{ code: string; levelId: number; status: number; usedBy: string }> = [];
    for (let i = 0; i < count; i++) {
      codes.push({ code: this.genCode(), levelId, status: 0, usedBy: '' });
    }
    await this.prisma.activationCode.createMany({ data: codes });
    return { count: codes.length };
  }

  async getCodes(page = 1, size = 20, status?: number) {
    const where: any = {};
    if (status !== undefined) where.status = status;
    const skip = (page - 1) * size;
    const [list, total] = await Promise.all([
      this.prisma.activationCode.findMany({ where, skip, take: size, include: { level: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.activationCode.count({ where }),
    ]);
    return { list, total, page, size };
  }

  async activate(appUserId: number, code: string) {
    return this.prisma.$transaction(async (tx) => {
      const activation = await tx.activationCode.findUnique({ where: { code } });
      if (!activation) throw new NotFoundException('激活码不存在');
      if (activation.status !== 0) throw new BadRequestException('激活码已使用或已过期');

      const claimed = await tx.activationCode.updateMany({
        where: { id: activation.id, status: 0 },
        data: { status: 1, usedBy: String(appUserId), usedAt: new Date() },
      });
      if (claimed.count !== 1) throw new BadRequestException('激活码已使用或已过期');

      const result = await this.membershipGrantService.grantInTransaction(tx, {
        appUserId,
        levelId: activation.levelId,
        source: 'activation_code',
        referenceId: activation.code,
      });
      return { success: true, levelName: result.level.name, expireAt: result.expireAt.toISOString(), permanent: result.permanent };
    });
  }

  async getBalanceLogs(page = 1, size = 20, userId?: string) {
    const skip = (page - 1) * size;
    const where: any = userId ? { userId } : {};
    const [list, total] = await Promise.all([
      this.prisma.balanceLog.findMany({ where, skip, take: size, orderBy: { createdAt: 'desc' } }),
      this.prisma.balanceLog.count({ where }),
    ]);
    return { list, total, page, size };
  }

  async getScoreLogs(page = 1, size = 20, userId?: string) {
    const skip = (page - 1) * size;
    const where: any = userId ? { userId } : {};
    const [list, total] = await Promise.all([
      this.prisma.appScoreLog.findMany({ where: userId ? { userId: Number(userId) } : {}, skip, take: size, orderBy: { createdAt: 'desc' } }),
      this.prisma.appScoreLog.count({ where: userId ? { userId: Number(userId) } : {} }),
    ]);
    return { list, total, page, size };
  }

  async recharge(userId: string, amount: number, method: string, remark?: string) {
    const appUserId = Number(userId);
    if (!Number.isInteger(appUserId) || appUserId <= 0) throw new BadRequestException('用户ID无效');
    const user = await this.prisma.appUser.findUnique({ where: { id: appUserId } });
    if (!user) throw new NotFoundException('应用用户不存在');
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('充值金额必须大于0');

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.appUser.update({ where: { id: appUserId }, data: { balance: { increment: amount } } });
      await tx.balanceLog.create({
        data: {
          userId: String(appUserId),
          type: 'recharge',
          amount,
          balance: updated.balance,
          remark: remark || `充值${amount}元，支付方式：${method}`,
          orderId: `ADMIN${Date.now()}${Math.floor(Math.random() * 1000)}`,
        },
      });
      return updated;
    });
    return { success: true, userId, amount, newBalance: updatedUser.balance, method };
  }

  async getExportableCodes(levelId?: number, status?: number) {
    const where: any = { status: 0 };
    if (levelId !== undefined) where.levelId = levelId;
    if (status !== undefined) where.status = status;
    return this.prisma.activationCode.findMany({ where, include: { level: true }, orderBy: { createdAt: 'desc' } });
  }

  async updateCode(id: number, data: any) {
    return this.prisma.activationCode.update({ where: { id }, data });
  }

  async deleteCode(id: number) {
    await this.prisma.activationCode.delete({ where: { id } });
    return { success: true };
  }

  async batchDeleteCodes(ids: number[]) {
    const result = await this.prisma.activationCode.deleteMany({ where: { id: { in: ids } } });
    return { success: true, count: result.count };
  }

  async getRules(page = 1, size = 20, levelId?: number, status?: number) {
    const skip = (page - 1) * size;
    const where: any = {};
    if (levelId !== undefined) where.levelId = levelId;
    if (status !== undefined) where.status = status;
    const [list, total] = await Promise.all([
      this.prisma.memberRule.findMany({ where, skip, take: size, orderBy: { sort: 'asc' } }),
      this.prisma.memberRule.count({ where }),
    ]);
    return { list, total, page, size };
  }

  async createRule(dto: CreateMemberRuleDto) {
    return this.prisma.memberRule.create({ data: dto });
  }

  async updateRule(id: number, dto: UpdateMemberRuleDto) {
    return this.prisma.memberRule.update({ where: { id }, data: dto });
  }

  async deleteRule(id: number) {
    await this.prisma.memberRule.delete({ where: { id } });
    return { success: true };
  }

  private genCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 16; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  }

  private validateLevel(dto: CreateLevelDto | UpdateLevelDto) {
    if (dto.price !== undefined && (!Number.isFinite(dto.price) || dto.price < 0)) {
      throw new BadRequestException('套餐价格不能小于0');
    }
    if (dto.duration !== undefined && (!Number.isInteger(dto.duration) || dto.duration <= 0)) {
      throw new BadRequestException('会员时长必须为大于0的整数天数');
    }
  }
}
