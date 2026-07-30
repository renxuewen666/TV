import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateMemberGroupDto, QueryMemberGroupsDto, UpdateMemberGroupDto } from './dto/member-group/create-member-group.dto';
import { SystemService } from '../system/system.service';

const PERMANENT_DURATION_DAYS = 88888888;

@Injectable()
export class MemberGroupService {
  constructor(private prisma: PrismaClient, private systemService: SystemService) {}

  async getMemberGroups(query: QueryMemberGroupsDto = {}) {
    const where: any = {};
    if (query.status !== undefined) where.status = query.status;

    const page = query.page || 1;
    const size = query.size || 20;
    const skip = (page - 1) * size;
    const [list, total] = await Promise.all([
      this.prisma.memberGroup.findMany({ where, skip, take: size, orderBy: { sort: 'asc' } }),
      this.prisma.memberGroup.count({ where }),
    ]);
    return { list, total, page, size };
  }

  async createMemberGroup(dto: CreateMemberGroupDto) {
    const data = this.normalize(dto);
    return this.prisma.$transaction(async (tx) => {
      const level = await tx.memberLevel.create({
        data: { name: data.name, price: data.price, duration: data.duration, status: data.status, sort: data.sort },
      });
      return tx.memberGroup.create({ data: { ...data, levelId: level.id } });
    });
  }

  async updateMemberGroup(id: number, dto: UpdateMemberGroupDto) {
    const existing = await this.prisma.memberGroup.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('会员套餐不存在');
    const data = this.normalize({ ...existing, ...dto });

    return this.prisma.$transaction(async (tx) => {
      let levelId = existing.levelId;
      if (levelId > 0) {
        await tx.memberLevel.update({
          where: { id: levelId },
          data: { name: data.name, price: data.price, duration: data.duration, status: data.status, sort: data.sort },
        });
      } else {
        const level = await tx.memberLevel.create({
          data: { name: data.name, price: data.price, duration: data.duration, status: data.status, sort: data.sort },
        });
        levelId = level.id;
      }
      return tx.memberGroup.update({ where: { id }, data: { ...data, levelId } });
    });
  }

  async deleteMemberGroup(id: number) {
    const existing = await this.prisma.memberGroup.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('会员套餐不存在');

    await this.prisma.$transaction(async (tx) => {
      await tx.memberGroup.delete({ where: { id } });
      if (existing.levelId > 0) {
        const references = await Promise.all([
          tx.member.count({ where: { levelId: existing.levelId } }),
          tx.appUser.count({ where: { memberLevel: existing.levelId } }),
          tx.activationCode.count({ where: { levelId: existing.levelId } }),
          tx.paymentOrder.count({ where: { levelId: existing.levelId } }),
        ]);
        if (references.every((count) => count === 0)) {
          await tx.memberLevel.delete({ where: { id: existing.levelId } });
        }
      }
    });
    return { success: true };
  }

  async getDefaultDiscount(): Promise<number> {
    const discount = await this.systemService.getValue('default_group_discount');
    return parseFloat(discount) || 1.0;
  }

  private normalize(input: Partial<CreateMemberGroupDto & UpdateMemberGroupDto>) {
    const isPermanent = Boolean(input.isPermanent);
    const duration = isPermanent ? PERMANENT_DURATION_DAYS : Number(input.duration);
    const price = Number(input.price);
    if (!input.name?.trim()) throw new BadRequestException('套餐名称不能为空');
    if (!Number.isFinite(price) || price < 0) throw new BadRequestException('套餐价格不能小于0');
    if (!Number.isInteger(duration) || duration <= 0) throw new BadRequestException('会员时长必须为大于0的整数天数');

    return {
      name: input.name.trim(),
      price,
      duration,
      isPermanent,
      description: input.description?.trim() || '',
      discount: input.discount === undefined ? 1 : Number(input.discount),
      dailyScore: input.dailyScore === undefined ? 0 : Number(input.dailyScore),
      status: input.status === undefined ? 1 : Number(input.status),
      sort: input.sort === undefined ? 0 : Number(input.sort),
    };
  }
}
