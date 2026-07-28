import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AppManageService {
  constructor(private prisma: PrismaClient) {}

  async getVersions(channel?: string) {
    const where: any = {};
    if (channel) where.channel = channel;
    return this.prisma.appVersion.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async createVersion(data: { versionName: string; versionCode: number; downloadUrl: string; channel?: string; changelog?: string; forceUpdate?: number }) {
    return this.prisma.appVersion.create({ data });
  }

  async updateVersion(id: number, data: { status?: number }) {
    return this.prisma.appVersion.update({ where: { id }, data });
  }

  async deleteVersion(id: number) { await this.prisma.appVersion.delete({ where: { id } }); return { success: true }; }

  async getLatestVersion(channel?: string) {
    const where: any = { status: 1 };
    if (channel) where.channel = channel;
    return this.prisma.appVersion.findFirst({ where, orderBy: { versionCode: 'desc' } });
  }

  async getChannels() { return this.prisma.appChannel.findMany(); }

  async createChannel(data: { name: string; packageId?: string }) {
    return this.prisma.appChannel.create({ data });
  }

  async deleteChannel(id: number) { await this.prisma.appChannel.delete({ where: { id } }); return { success: true }; }
}
