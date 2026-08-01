import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { BatchMemberDto, CreateLevelDto, CreateMemberDto, CreateMemberRuleDto, UpdateLevelDto, UpdateMemberDto, UpdateMemberRuleDto, CreateMemberGroupDto, UpdateMemberGroupDto } from './dto/member.dto';
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
    return this.prisma.memberGroup.findMany({
      where: { status: 1 },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        name: true,
        levelId: true,
        price: true,
        duration: true,
        isPermanent: true,
        description: true,
        discount: true,
        dailyScore: true,
        sort: true,
      },
    });
  }

  async purchaseWithBalance(appUserId: number, groupId: number) {
    const [user, group] = await Promise.all([
      this.prisma.appUser.findUnique({ where: { id: appUserId } }),
      this.prisma.memberGroup.findFirst({ where: { id: groupId, status: 1 } }),
    ]);
    if (!user || user.status !== 1) throw new NotFoundException('应用用户不存在或已禁用');
    if (!group || !group.levelId) throw new NotFoundException('会员套餐不存在或已停用');
    const amount = Number(group.price);
    if (!Number.isFinite(amount) || amount < 0) throw new BadRequestException('会员套餐价格无效');

    return this.prisma.$transaction(async (tx) => {
      const latestUser = await tx.appUser.findUnique({ where: { id: appUserId } });
      if (!latestUser || latestUser.status !== 1) throw new NotFoundException('应用用户不存在或已禁用');
      if (latestUser.balance < amount) throw new BadRequestException(`余额不足，还需${(amount - latestUser.balance).toFixed(2)}元`);

      const updatedUser = await tx.appUser.update({
        where: { id: appUserId },
        data: { balance: { decrement: amount } },
      });
      const orderId = `BAL${Date.now()}${Math.floor(Math.random() * 1000)}`;
      await tx.balanceLog.create({
        data: {
          userId: String(appUserId),
          type: 'purchase',
          amount: -amount,
          balance: updatedUser.balance,
          remark: `余额购买会员套餐：${group.name}`,
          orderId,
        },
      });
      const result = await this.membershipGrantService.grantInTransaction(tx, {
        appUserId,
        levelId: group.levelId,
        source: 'balance',
        referenceId: orderId,
      });
      return {
        success: true,
        orderId,
        balance: updatedUser.balance,
        levelName: result.level.name,
        expireAt: result.expireAt.toISOString(),
        permanent: result.permanent,
      };
    });
  }

  async purchaseWithScore(appUserId: number, groupId: number) {
    const [user, group] = await Promise.all([
      this.prisma.appUser.findUnique({ where: { id: appUserId } }),
      this.prisma.memberGroup.findFirst({ where: { id: groupId, status: 1 } }),
    ]);
    if (!user || user.status !== 1) throw new NotFoundException('应用用户不存在或已禁用');
    if (!group || !group.levelId) throw new NotFoundException('会员套餐不存在或已停用');
    const points = Math.round(Number(group.price) * 100);
    if (!Number.isFinite(points) || points < 0) throw new BadRequestException('会员套餐积分价格无效');

    return this.prisma.$transaction(async (tx) => {
      const latestUser = await tx.appUser.findUnique({ where: { id: appUserId } });
      if (!latestUser || latestUser.status !== 1) throw new NotFoundException('应用用户不存在或已禁用');
      if (latestUser.score < points) throw new BadRequestException(`积分不足，需要${points}积分`);

      const updatedUser = await tx.appUser.update({
        where: { id: appUserId },
        data: { score: { decrement: points } },
      });
      const orderId = `SCORE${Date.now()}${Math.floor(Math.random() * 1000)}`;
      await tx.appScoreLog.create({
        data: {
          userId: appUserId,
          type: 'purchase',
          score: -points,
          balance: updatedUser.score,
          remark: `积分购买会员套餐：${group.name}`,
        },
      });
      const result = await this.membershipGrantService.grantInTransaction(tx, {
        appUserId,
        levelId: group.levelId,
        source: 'score',
        referenceId: orderId,
      });
      return {
        success: true,
        orderId,
        score: updatedUser.score,
        levelName: result.level.name,
        expireAt: result.expireAt.toISOString(),
        permanent: result.permanent,
      };
    });
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

  async getMembers(page = 1, size = 20, group?: string, status?: string, keyword?: string) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeSize = Math.min(100, Math.max(1, Number(size) || 20));
    const where: any = {};
    if (group !== undefined && group !== '') where.memberLevel = Number(group);
    if (status !== undefined && status !== '') where.status = Number(status);
    const search = String(keyword || '').trim();
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { nickname: { contains: search } },
        { email: { contains: search } },
      ];
    }
    const [list, total] = await Promise.all([
      this.prisma.appUser.findMany({
        skip: (safePage - 1) * safeSize,
        take: safeSize,
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          nickname: true,
          status: true,
          score: true,
          balance: true,
          memberLevel: true,
          memberExpireAt: true,
          createdAt: true,
          updatedAt: true,
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
      page: safePage,
      size: safeSize,
    };
  }

  async createMember(data: CreateMemberDto) {
    const username = String(data.username || '').trim();
    const password = String(data.password || '');
    const email = String(data.email || '').trim() || `${username.replace(/[^a-zA-Z0-9_-]/g, '') || 'user'}_${Date.now()}@local.bee-tv`;
    const levelId = data.levelId === undefined ? 0 : Number(data.levelId);
    if (username.length < 2) throw new BadRequestException('用户名至少2个字符');
    if (password.length < 6) throw new BadRequestException('密码长度至少6位');
    if (!Number.isInteger(levelId) || levelId < 0) throw new BadRequestException('会员套餐参数无效');
    const duplicate = await this.prisma.appUser.findFirst({ where: { OR: [{ username }, { email }] } });
    if (duplicate) throw new ConflictException('用户名或邮箱已存在');
    const passwordHash = await bcrypt.hash(password, 10);
    const member = await this.prisma.$transaction(async (tx) => {
      const created = await tx.appUser.create({
        data: {
          username,
          email,
          nickname: String(data.nickname || username).trim() || username,
          phone: String(data.phone || '').trim(),
          password: passwordHash,
          score: Math.max(0, Number(data.score || 0)),
          balance: Math.max(0, Number(data.balance || 0)),
          status: Number(data.status ?? 1),
        },
      });
      if (levelId > 0) {
        await this.membershipGrantService.grantInTransaction(tx, {
          appUserId: created.id,
          levelId,
          source: 'admin',
          referenceId: data.remark || '后台创建会员并授权',
        });
      }
      return tx.appUser.findUnique({ where: { id: created.id } });
    });
    return this.sanitizeMember(member);
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

  async updateMember(id: number, data: UpdateMemberDto) {
    const existing = await this.prisma.appUser.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('应用用户不存在');

    const username = data.username === undefined ? undefined : String(data.username).trim();
    const email = data.email === undefined ? undefined : String(data.email).trim();
    if (username !== undefined && username.length < 2) throw new BadRequestException('用户名至少2个字符');
    if (data.password !== undefined && data.password !== '' && data.password.length < 6) throw new BadRequestException('密码长度至少6位');
    if (username || email) {
      const duplicate = await this.prisma.appUser.findFirst({
        where: { id: { not: id }, OR: [...(username ? [{ username }] : []), ...(email ? [{ email }] : [])] },
      });
      if (duplicate) throw new ConflictException('用户名或邮箱已存在');
    }
    const requestedLevelId = data.levelId === undefined ? undefined : Number(data.levelId);
    if (requestedLevelId !== undefined && (!Number.isInteger(requestedLevelId) || requestedLevelId < 0)) {
      throw new BadRequestException('会员套餐参数无效');
    }

    const updateData: any = {};
    if (requestedLevelId === 0 && existing.memberLevel !== 0) {
      updateData.memberLevel = 0;
      updateData.memberExpireAt = null;
    }
    if (username !== undefined) updateData.username = username;
    if (email !== undefined && email) updateData.email = email;
    if (data.phone !== undefined) updateData.phone = String(data.phone).trim();
    if (data.nickname !== undefined) updateData.nickname = String(data.nickname).trim() || (username || existing.username || existing.nickname);
    if (data.password !== undefined && data.password !== '') updateData.password = await bcrypt.hash(data.password, 10);
    if (data.score !== undefined) updateData.score = Math.max(0, Number(data.score));
    if (data.balance !== undefined) updateData.balance = Math.max(0, Number(data.balance));
    if (data.status !== undefined) updateData.status = Number(data.status);
    const updatedMember = await this.prisma.$transaction(async (tx) => {
      if (requestedLevelId !== undefined && requestedLevelId > 0 && requestedLevelId !== existing.memberLevel) {
        await this.membershipGrantService.grantInTransaction(tx, {
          appUserId: id,
          levelId: requestedLevelId,
          source: 'admin',
          referenceId: data.remark || '后台调整会员套餐',
        });
      }
      if (Object.keys(updateData).length) {
        await tx.appUser.update({ where: { id }, data: updateData });
        // Log balance change if admin updated balance
        if (data.balance !== undefined && Number(data.balance) !== existing.balance) {
          const diff = Number(data.balance) - existing.balance;
          await tx.balanceLog.create({
            data: {
              userId: String(id),
              type: diff > 0 ? 'recharge' : 'deduct',
              amount: diff,
              balance: Number(data.balance),
              remark: data.remark || `后台调整余额：${existing.balance} → ${data.balance}`,
              orderId: `ADJ${Date.now()}`,
            },
          });
        }
        // Log score change if admin updated score
        if (data.score !== undefined && Number(data.score) !== existing.score) {
          const diff = Number(data.score) - existing.score;
          await tx.appScoreLog.create({
            data: {
              userId: id,
              type: diff > 0 ? 'sign_in' : 'consume',
              score: diff,
              balance: Number(data.score),
              remark: data.remark || `后台调整积分：${existing.score} → ${data.score}`,
            },
          });
        }
      }
      if (data.status === 0) await tx.clientSession.deleteMany({ where: { userId: id } });
      return tx.appUser.findUnique({ where: { id } });
    });
    return this.sanitizeMember(updatedMember);
  }

  async batchUpdateMembers(data: BatchMemberDto) {
    if (!Array.isArray(data.ids)) throw new BadRequestException('会员列表格式无效');
    const ids = [...new Set(data.ids.map(Number).filter((id) => Number.isInteger(id) && id > 0))];
    if (!ids.length) throw new BadRequestException('请选择至少一个会员');
    if (ids.length > 500) throw new BadRequestException('单次最多操作500个会员');
    if (!['enable', 'disable', 'delete', 'setLevel'].includes(data.action)) throw new BadRequestException('不支持的批量操作');
    if (data.action === 'setLevel') {
      if (!data.levelId || data.levelId < 1) throw new BadRequestException('请选择会员套餐');
      const level = await this.prisma.memberLevel.findFirst({ where: { id: data.levelId, status: 1 } });
      if (!level) throw new NotFoundException('会员套餐不存在或已停用');
      await this.prisma.$transaction(async (tx) => {
        for (const id of ids) await this.membershipGrantService.grantInTransaction(tx, {
          appUserId: id,
          levelId: data.levelId!,
          source: 'admin',
          referenceId: data.remark || '后台批量授予会员套餐',
        });
      });
      return { success: true, count: ids.length, action: data.action };
    }
    const status = data.action === 'enable' ? 1 : 0;
    const result = await this.prisma.appUser.updateMany({ where: { id: { in: ids } }, data: { status } });
    if (status === 0) await this.prisma.clientSession.deleteMany({ where: { userId: { in: ids } } });
    return { success: true, count: result.count, action: data.action };
  }

  async deleteMember(id: number) {
    const user = await this.prisma.appUser.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('应用用户不存在');
    await this.prisma.$transaction([
      this.prisma.appUser.update({ where: { id }, data: { status: 0 } }),
      this.prisma.clientSession.deleteMany({ where: { userId: id } }),
    ]);
    return { success: true };
  }

  private sanitizeMember(member: any) {
    if (!member) return null;
    const { password, ...safe } = member;
    return safe;
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
    // Enrich with usernames
    const userIds = [...new Set(list.map(b => b.userId))];
    const users = userIds.length ? await this.prisma.appUser.findMany({ where: { id: { in: userIds.map(Number) } }, select: { id: true, username: true, nickname: true } }) : [];
    const userMap = new Map(users.map(u => [String(u.id), u]));
    return {
      list: list.map(b => ({ ...b, username: userMap.get(b.userId)?.username || userMap.get(b.userId)?.nickname || '' })),
      total, page, size,
    };
  }

  async getScoreLogs(page = 1, size = 20, userId?: string) {
    const skip = (page - 1) * size;
    const where: any = userId ? { userId } : {};
    const [list, total] = await Promise.all([
      this.prisma.appScoreLog.findMany({ where: userId ? { userId: Number(userId) } : {}, skip, take: size, orderBy: { createdAt: 'desc' } }),
      this.prisma.appScoreLog.count({ where: userId ? { userId: Number(userId) } : {} }),
    ]);
    // Enrich with usernames
    const userIds = [...new Set(list.map(b => String(b.userId)))];
    const users = userIds.length ? await this.prisma.appUser.findMany({ where: { id: { in: userIds.map(Number) } }, select: { id: true, username: true, nickname: true } }) : [];
    const userMap = new Map(users.map(u => [String(u.id), u]));
    return {
      list: list.map(b => ({ ...b, username: userMap.get(String(b.userId))?.username || userMap.get(String(b.userId))?.nickname || '' })),
      total, page, size,
    };
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

  async createBalanceLog(data: { userId: string; type: string; amount: number; balance?: number; remark?: string; orderId?: string }) {
    return this.prisma.balanceLog.create({ data });
  }

  async updateBalanceLog(id: number, data: any) {
    return this.prisma.balanceLog.update({ where: { id }, data });
  }

  async deleteBalanceLog(id: number) {
    await this.prisma.balanceLog.delete({ where: { id } });
    return { success: true };
  }

  async batchDeleteBalanceLogs(ids: number[]) {
    const result = await this.prisma.balanceLog.deleteMany({ where: { id: { in: ids } } });
    return { success: true, count: result.count };
  }

  async createScoreLog(data: { userId: string; type: string; score: number; balance?: number; remark?: string }) {
    return this.prisma.appScoreLog.create({ data: { ...data, userId: Number(data.userId) } });
  }

  async updateScoreLog(id: number, data: any) {
    return this.prisma.appScoreLog.update({ where: { id }, data });
  }

  async deleteScoreLog(id: number) {
    await this.prisma.appScoreLog.delete({ where: { id } });
    return { success: true };
  }

  async batchDeleteScoreLogs(ids: number[]) {
    const result = await this.prisma.appScoreLog.deleteMany({ where: { id: { in: ids } } });
    return { success: true, count: result.count };
  }

  async getRechargeOrders(params: { page?: number; size?: number; keyword?: string; status?: number }) {
    const page = Math.max(1, Number(params.page) || 1);
    const size = Math.min(100, Math.max(1, Number(params.size) || 20));
    const skip = (page - 1) * size;
    const where: any = {};
    if (params.status !== undefined) where.status = params.status;
    const search = String(params.keyword || '').trim();
    if (search) {
      where.OR = [
        { orderNo: { contains: search } },
        { userId: { contains: search } },
      ];
    }
    const [list, total] = await Promise.all([
      this.prisma.rechargeOrder.findMany({ where, skip, take: size, orderBy: { createdAt: 'desc' } }),
      this.prisma.rechargeOrder.count({ where }),
    ]);
    // Enrich with usernames
    const userIds = [...new Set(list.map(r => r.userId))];
    const users = userIds.length ? await this.prisma.appUser.findMany({ where: { id: { in: userIds.map(Number) } }, select: { id: true, username: true, nickname: true } }) : [];
    const userMap = new Map(users.map(u => [String(u.id), u]));
    return {
      list: list.map(r => ({ ...r, username: userMap.get(r.userId)?.username || userMap.get(r.userId)?.nickname || '' })),
      total, page, size,
    };
  }

  async createRechargeOrder(data: any) {
    const sanitized = { ...data };
    sanitized.payTime = sanitized.payTime ? new Date(sanitized.payTime) : null;
    return this.prisma.rechargeOrder.create({ data: sanitized });
  }

  async updateRechargeOrder(id: number, data: any) {
    const sanitized = { ...data };
    sanitized.payTime = sanitized.payTime ? new Date(sanitized.payTime) : null;
    return this.prisma.rechargeOrder.update({ where: { id }, data: sanitized });
  }

  async deleteRechargeOrder(id: number) {
    await this.prisma.rechargeOrder.delete({ where: { id } });
    return { success: true };
  }

  async batchDeleteRechargeOrders(ids: number[]) {
    const result = await this.prisma.rechargeOrder.deleteMany({ where: { id: { in: ids } } });
    return { success: true, count: result.count };
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

  async getGroups(params?: { page?: number; size?: number }) {
    const page = Math.max(1, Number(params?.page) || 1);
    const size = Math.min(100, Math.max(1, Number(params?.size) || 100));
    const skip = (page - 1) * size;
    const [list, total] = await Promise.all([
      this.prisma.memberGroup.findMany({
        skip,
        take: size,
        orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.memberGroup.count(),
    ]);
    return { list, total, page, size };
  }

  async createGroup(dto: CreateMemberGroupDto) {
    if (dto.levelId && dto.levelId > 0) {
      const level = await this.prisma.memberLevel.findFirst({ where: { id: dto.levelId, status: 1 } });
      if (!level) throw new NotFoundException('会员套餐不存在或已停用');
    }
    return this.prisma.memberGroup.create({
      data: {
        name: dto.name,
        levelId: dto.levelId,
        price: Number(dto.price),
        duration: Number(dto.duration),
        isPermanent: Number(dto.isPermanent ?? 0) === 1,
        description: dto.description || '',
        discount: Number(dto.discount ?? 1),
        dailyScore: Number(dto.dailyScore ?? 0),
        status: Number(dto.status ?? 1),
        sort: Number(dto.sort ?? 0),
        deviceLimit: Number(dto.deviceLimit ?? 0),
        loginOverflowAction: dto.loginOverflowAction || 'kick_oldest',
        level: Number(dto.level ?? 0),
      },
    });
  }

  async updateGroup(id: number, dto: UpdateMemberGroupDto) {
    const existing = await this.prisma.memberGroup.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('会员套餐不存在');
    if (dto.levelId !== undefined && dto.levelId > 0) {
      const level = await this.prisma.memberLevel.findFirst({ where: { id: dto.levelId, status: 1 } });
      if (!level) throw new NotFoundException('会员套餐不存在或已停用');
    }
    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.levelId !== undefined) updateData.levelId = dto.levelId;
    if (dto.price !== undefined) updateData.price = Number(dto.price);
    if (dto.duration !== undefined) updateData.duration = Number(dto.duration);
    if (dto.isPermanent !== undefined) updateData.isPermanent = Number(dto.isPermanent) === 1;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.discount !== undefined) updateData.discount = Number(dto.discount);
    if (dto.dailyScore !== undefined) updateData.dailyScore = Number(dto.dailyScore);
    if (dto.status !== undefined) updateData.status = Number(dto.status);
    if (dto.sort !== undefined) updateData.sort = Number(dto.sort);
    if (dto.deviceLimit !== undefined) updateData.deviceLimit = Number(dto.deviceLimit);
    if (dto.loginOverflowAction !== undefined) updateData.loginOverflowAction = dto.loginOverflowAction;
    if (dto.level !== undefined) updateData.level = Number(dto.level);
    return this.prisma.memberGroup.update({ where: { id }, data: updateData });
  }

  async deleteGroup(id: number) {
    await this.prisma.memberGroup.delete({ where: { id } });
    return { success: true };
  }

  // ============ SignLog CRUD ============
  async getSignLogs(page = 1, size = 20, keyword?: string) {
    const skip = (page - 1) * size;
    const where: any = {};
    const search = String(keyword || '').trim();
    if (search) where.OR = [{ userId: { contains: search } }];
    const [list, total] = await Promise.all([
      this.prisma.signLog.findMany({ where, skip, take: size, orderBy: { createdAt: 'desc' } }),
      this.prisma.signLog.count({ where }),
    ]);
    // Enrich with usernames
    const userIds = [...new Set(list.map(s => s.userId))];
    const users = userIds.length ? await this.prisma.appUser.findMany({ where: { id: { in: userIds.map(Number) } }, select: { id: true, username: true, nickname: true } }) : [];
    const userMap = new Map(users.map(u => [String(u.id), u]));
    return {
      list: list.map(s => ({ ...s, username: userMap.get(s.userId)?.username || userMap.get(s.userId)?.nickname || '' })),
      total, page, size,
    };
  }

  async createSignLog(data: { userId: string; signDate?: string; consecutiveDays?: number; reward?: number }) {
    if (!data.userId) throw new BadRequestException('用户ID不能为空');
    return this.prisma.signLog.create({
      data: {
        userId: data.userId,
        signDate: data.signDate || new Date().toISOString().split('T')[0],
        consecutiveDays: data.consecutiveDays || 1,
        reward: data.reward || 0,
      },
    });
  }

  async updateSignLog(id: number, data: { signDate?: string; consecutiveDays?: number; reward?: number; userId?: string }) {
    const updateData: any = {};
    if (data.signDate !== undefined) updateData.signDate = data.signDate;
    if (data.consecutiveDays !== undefined) updateData.consecutiveDays = data.consecutiveDays;
    if (data.reward !== undefined) updateData.reward = data.reward;
    if (data.userId !== undefined) updateData.userId = data.userId;
    return this.prisma.signLog.update({ where: { id }, data: updateData });
  }

  async deleteSignLog(id: number) {
    await this.prisma.signLog.delete({ where: { id } });
    return { success: true };
  }

  async batchDeleteSignLogs(ids: number[]) {
    const result = await this.prisma.signLog.deleteMany({ where: { id: { in: ids } } });
    return { success: true, count: result.count };
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
