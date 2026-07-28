import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class SystemService {
  constructor(private prisma: PrismaClient) {}

  async getAll() {
    return this.prisma.systemConfig.findMany();
  }

  async getValue(key: string) {
    const config = await this.prisma.systemConfig.findUnique({ where: { key } });
    return config?.value || '';
  }

  async upsert(key: string, value: string, remark?: string) {
    return this.prisma.systemConfig.upsert({
      where: { key },
      update: { value, remark: remark || '' },
      create: { key, value, remark: remark || '' },
    });
  }

  async exportAll() {
    const [systemConfig, memberLevels, apiEndpoints, paymentConfigs, homeLayouts, appChannels, epayConfigs, notices, hotsearches] = await Promise.all([
      this.prisma.systemConfig.findMany(),
      this.prisma.memberLevel.findMany({ orderBy: { sort: 'asc' } }),
      this.prisma.apiEndpoint.findMany(),
      this.prisma.paymentConfig.findMany(),
      this.prisma.homeLayout.findMany(),
      this.prisma.appChannel.findMany(),
      this.prisma.epayConfig.findMany(),
      this.prisma.notice.findMany(),
      this.prisma.hotsearch.findMany(),
    ]);

    return {
      version: '1.1',
      exportedAt: new Date().toISOString(),
      data: {
        systemConfig: systemConfig.map(({ id, ...rest }) => rest),
        memberLevels: memberLevels.map(({ id, ...rest }) => rest),
        apiEndpoints: apiEndpoints.map(({ id, ...rest }) => rest),
        paymentConfigs: paymentConfigs.map(({ id, ...rest }) => rest),
        homeLayouts: homeLayouts.map(({ id, ...rest }) => rest),
        appChannels: appChannels.map(({ id, ...rest }) => rest),
        epayConfigs: epayConfigs.map(({ id, ...rest }) => rest),
        notices: notices.map(({ id, ...rest }) => rest),
        hotsearches: hotsearches.map(({ id, ...rest }) => rest),
      },
    };
  }

  async importAll(payload: any) {
    if (!payload?.data) throw new BadRequestException('无效的导入数据格式');

    const { data } = payload;

    if (data.systemConfig?.length) {
      for (const item of data.systemConfig) {
        await this.prisma.systemConfig.upsert({ where: { key: item.key }, update: { value: item.value, remark: item.remark || '' }, create: item });
      }
    }

    if (data.memberLevels?.length) {
      for (const item of data.memberLevels) {
        await this.prisma.memberLevel.create({ data: item });
      }
    }

    if (data.apiEndpoints?.length) {
      for (const item of data.apiEndpoints) {
        await this.prisma.apiEndpoint.create({ data: item });
      }
    }

    if (data.paymentConfigs?.length) {
      for (const item of data.paymentConfigs) {
        await this.prisma.paymentConfig.create({ data: item });
      }
    }

    if (data.homeLayouts?.length) {
      for (const item of data.homeLayouts) {
        await this.prisma.homeLayout.create({ data: item });
      }
    }

    if (data.appChannels?.length) {
      for (const item of data.appChannels) {
        await this.prisma.appChannel.create({ data: item });
      }
    }

    if (data.epayConfigs?.length) {
      for (const item of data.epayConfigs) {
        await this.prisma.epayConfig.create({ data: item });
      }
    }

    if (data.notices?.length) {
      for (const item of data.notices) {
        await this.prisma.notice.create({ data: item });
      }
    }

    if (data.hotsearches?.length) {
      for (const item of data.hotsearches) {
        await this.prisma.hotsearch.create({ data: item });
      }
    }

    return { success: true, message: '配置导入成功' };
  }
}
