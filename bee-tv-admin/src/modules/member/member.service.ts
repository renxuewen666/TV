import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateLevelDto, UpdateLevelDto } from './dto/member.dto';

@Injectable()
export class MemberService {
  constructor(private prisma: PrismaClient) {}

  async getLevels() { return this.prisma.memberLevel.findMany({ orderBy: { sort: 'asc' } }); }

  async createLevel(dto: CreateLevelDto) { return this.prisma.memberLevel.create({ data: dto }); }

  async updateLevel(id: number, dto: UpdateLevelDto) { return this.prisma.memberLevel.update({ where: { id }, data: dto }); }

  async deleteLevel(id: number) { await this.prisma.memberLevel.delete({ where: { id } }); return { success: true }; }

  async getMembers(page = 1, size = 20) {
    const skip = (page - 1) * size;
    const [list, total] = await Promise.all([
      this.prisma.member.findMany({ skip, take: size, include: { level: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.member.count(),
    ]);
    return { list, total, page, size };
  }

  async generateCodes(levelId: number, count: number) {
    const codes: Array<{ code: string; levelId: number; status: number; usedBy: string }> = [];
    for (let i = 0; i < count; i++) {
      const code = this.genCode();
      codes.push({
        code,
        levelId,
        status: 0,
        usedBy: '',
      });
    }
    await this.prisma.activationCode.createMany({ data: codes });
    return { count: codes.length };
  }

  async getCodes(page = 1, size = 20, status?: number) {
    const where: any = {};
    if (status !== undefined) where.status = status;
    const skip = (page - 1) * size;
    const [list, total] = await Promise.all([
      this.prisma.activationCode.findMany({ where, skip, take: size, orderBy: { createdAt: 'desc' } }),
      this.prisma.activationCode.count({ where }),
    ]);
    return { list, total, page, size };
  }

  private genCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 16; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  }

  async activate(userId: string, code: string) {
    const activation = await this.prisma.activationCode.findUnique({ where: { code } });
    if (!activation) throw new NotFoundException('激活码不存在');
    if (activation.status !== 0) throw new BadRequestException('激活码已使用或已过期');

    const level = await this.prisma.memberLevel.findUnique({ where: { id: activation.levelId } });
    if (!level) throw new NotFoundException('会员等级不存在');

    const expireAt = new Date(Date.now() + level.duration * 24 * 60 * 60 * 1000);

    await this.prisma.activationCode.update({ where: { id: activation.id }, data: { status: 1, usedBy: userId, usedAt: new Date() } });

    const existing = await this.prisma.member.findUnique({ where: { userId } });
    if (existing) {
      await this.prisma.member.update({ where: { id: existing.id }, data: { levelId: level.id, expireAt: existing.expireAt && existing.expireAt > new Date() ? new Date(existing.expireAt.getTime() + level.duration * 24 * 60 * 60 * 1000) : expireAt } });
    } else {
      await this.prisma.member.create({ data: { userId, levelId: level.id, deviceId: '', expireAt } });
    }

    return { success: true, levelName: level.name, expireAt: expireAt.toISOString() };
  }
}
