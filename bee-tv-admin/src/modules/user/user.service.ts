import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaClient) {}

  async findAll() {
    return this.prisma.adminUser.findMany({ select: { id: true, username: true, nickname: true, role: true, status: true, createdAt: true } });
  }

  async create(dto: CreateUserDto) {
    const hash = await bcrypt.hash(dto.password, 10);
    return this.prisma.adminUser.create({ data: { ...dto, password: hash }, select: { id: true, username: true, nickname: true, role: true } });
  }

  async update(id: number, dto: UpdateUserDto) {
    const data: any = { ...dto };
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);
    else delete data.password;
    return this.prisma.adminUser.update({ where: { id }, data, select: { id: true, username: true, nickname: true, role: true, status: true } });
  }

  async remove(id: number) {
    await this.prisma.adminUser.delete({ where: { id } });
    return { success: true };
  }
}
