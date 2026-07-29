import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AppAuthService {
  constructor(
    private prisma: PrismaClient,
    private jwtService: JwtService,
  ) {}

  async register(dto: { email: string; nickname: string; password: string }) {
    const existing = await this.prisma.appUser.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('该邮箱已被注册');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.appUser.create({
      data: {
        email: dto.email,
        nickname: dto.nickname,
        password: hashedPassword,
      },
    });

    const payload = { sub: user.id, email: user.email, role: 'user' };
    return {
      token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        memberLevel: user.memberLevel,
        memberExpireAt: user.memberExpireAt,
        score: user.score,
      },
    };
  }

  async login(dto: { account: string; password: string }) {
    const user = await this.prisma.appUser.findFirst({
      where: {
        OR: [
          { email: dto.account },
          { nickname: dto.account },
        ],
      },
    });

    if (!user || user.status !== 1) throw new UnauthorizedException('账号不存在或已禁用');
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('密码错误');

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        memberLevel: user.memberLevel,
        memberExpireAt: user.memberExpireAt,
        score: user.score,
      },
    };
  }

  async getMe(userId: number) {
    const user = await this.prisma.appUser.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('用户不存在');
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
}
