import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { SystemService } from '../system/system.service';

@Injectable()
export class AppAuthService {
  constructor(
    private prisma: PrismaClient,
    private jwtService: JwtService,
    private systemService: SystemService,
  ) {}

  async register(dto: { email?: string; nickname?: string; username?: string; password: string; appId?: string; deviceId?: string }) {
    const app = await this.resolveEnabledApp(dto.appId);
    const registerEnabled = this.resolvePolicy(app?.registerPolicy, await this.systemService.getValue('app_register_enabled'));
    if (!registerEnabled) throw new BadRequestException('当前应用已关闭用户注册');

    if (!dto.password || dto.password.length < 6) throw new BadRequestException('密码长度至少6位');

    const emailRequired = this.resolvePolicy(app?.emailPolicy, await this.systemService.getValue('app_register_email_required'));
    const accountName = (dto.username || dto.nickname || '').trim();
    if (!accountName) throw new BadRequestException('请输入账号或昵称');

    let email = (dto.email || '').trim();
    if (emailRequired && !email) throw new BadRequestException('请输入邮箱');
    if (!email) email = `${accountName.replace(/[^a-zA-Z0-9_-]/g, '') || 'user'}_${Date.now()}@local.bee-tv`;

    const existing = await this.prisma.appUser.findFirst({
      where: { OR: [{ email }, { nickname: accountName }] },
    });
    if (existing) throw new ConflictException('账号已被注册');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.appUser.create({
      data: {
        email,
        nickname: accountName,
        password: hashedPassword,
        score: parseInt(await this.systemService.getValue('reg_bonus_score')) || 0,
      },
    });

    return this.issueSession(user, dto.appId || 'default', dto.deviceId || '');
  }

  async autoRegister(dto: { deviceId?: string; nickname?: string; appId?: string }) {
    const app = await this.resolveEnabledApp(dto.appId);
    const autoEnabled = this.resolvePolicy(app?.autoRegisterPolicy, await this.systemService.getValue('app_auto_register_enabled'));
    if (!autoEnabled) throw new BadRequestException('当前应用未开启自动注册');

    const rawId = (dto.deviceId || '').trim();
    if (!rawId) throw new BadRequestException('缺少设备标识');
    const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48) || `device_${Date.now()}`;
    const email = `tv_${safeId}@local.bee-tv`;

    let user = await this.prisma.appUser.findUnique({ where: { email } });
    if (!user) {
      const hashedPassword = await bcrypt.hash(`${safeId}_${Date.now()}`, 10);
      user = await this.prisma.appUser.create({
        data: {
          email,
          nickname: dto.nickname?.trim() || `TV用户${safeId.slice(-6)}`,
          password: hashedPassword,
          score: parseInt(await this.systemService.getValue('reg_bonus_score')) || 0,
        },
      });
    }

    return this.issueSession(user, dto.appId || 'default', rawId);
  }

  async login(dto: { account: string; password: string; appId?: string; deviceId?: string }) {
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

    return this.issueSession(user, dto.appId || 'default', dto.deviceId || '');
  }

  private async resolveEnabledApp(appId?: string) {
    if (!appId || appId === 'default') return null;
    const app = await this.prisma.clientApp.findFirst({ where: { appId, status: 1 } });
    if (!app) throw new BadRequestException('应用不存在或已停用');
    return app;
  }

  private resolvePolicy(policy: number | undefined, fallback: string) {
    return policy === undefined || policy === -1 ? fallback === 'true' : policy === 1;
  }

  private async issueSession(user: any, appId: string, deviceId: string) {
    const app = await this.prisma.clientApp.findFirst({ where: { appId, status: 1 } });
    const deviceLimit = app?.loginLimit || parseInt(await this.systemService.getValue('device_limit_count')) || 3;
    const deviceLimitMode = await this.systemService.getValue('device_limit_mode');
    const normalizedDeviceId = deviceId.trim().slice(0, 128) || `web-${randomBytes(8).toString('hex')}`;
    const existing = await this.prisma.clientSession.findUnique({ where: { userId_appId_deviceId: { userId: user.id, appId, deviceId: normalizedDeviceId } } });
    if (!existing) {
      const active = await this.prisma.clientSession.findMany({ where: { userId: user.id, appId }, orderBy: { createdAt: 'asc' } });
      if (active.length >= deviceLimit) {
        if (deviceLimitMode === 'reject_new') throw new BadRequestException(`该应用最多允许${deviceLimit}台设备登录`);
        await this.prisma.clientSession.delete({ where: { id: active[0].id } });
      }
    }

    const tokenId = randomBytes(18).toString('hex');
    const hours = parseInt(await this.systemService.getValue('token_expire_hours')) || 168;
    const expireAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    await this.prisma.clientSession.upsert({
      where: { userId_appId_deviceId: { userId: user.id, appId, deviceId: normalizedDeviceId } },
      update: { tokenId, expireAt },
      create: { userId: user.id, appId, deviceId: normalizedDeviceId, tokenId, expireAt },
    });
    const payload = { sub: user.id, email: user.email, role: user.role || 'user', appId, deviceId: normalizedDeviceId, jti: tokenId };
    return {
      token: this.jwtService.sign(payload, { expiresIn: `${hours}h` }),
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        memberLevel: user.memberLevel,
        memberExpireAt: user.memberExpireAt,
        score: user.score,
        balance: user.balance,
      },
      session: { appId, deviceId: normalizedDeviceId, expireAt },
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
      balance: user.balance,
    };
  }
}
