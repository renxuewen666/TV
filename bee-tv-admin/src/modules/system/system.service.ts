import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as nodemailer from 'nodemailer';

// 默认系统配置项定义
const DEFAULT_CONFIGS: Record<string, { value: string; group: string; remark: string }> = {
  // 基础配置
  site_name: { value: '蜜蜂影视', group: 'basic', remark: '站点名称' },
  site_icp: { value: '', group: 'basic', remark: '备案号' },
  site_version: { value: '1.0.0', group: 'basic', remark: '版本号' },
  site_logo: { value: '', group: 'basic', remark: '站点LOGO URL' },

  // 邮件配置
  smtp_host: { value: '', group: 'email', remark: 'SMTP服务器' },
  smtp_port: { value: '465', group: 'email', remark: 'SMTP端口' },
  smtp_user: { value: '', group: 'email', remark: 'SMTP用户名' },
  smtp_pass: { value: '', group: 'email', remark: 'SMTP密码' },
  smtp_from: { value: '', group: 'email', remark: '发件人邮箱' },
  smtp_secure: { value: 'true', group: 'email', remark: '是否使用SSL' },

  // 会员配置
  app_register_enabled: { value: 'true', group: 'member', remark: '开放用户注册开关' },
  app_auto_register_enabled: { value: 'false', group: 'member', remark: '自动注册功能开关(APP/TV设备自动开户)' },
  app_register_email_required: { value: 'false', group: 'member', remark: '注册是否必填邮箱' },
  reg_bonus_score: { value: '0', group: 'member', remark: '注册赠送积分' },
  reg_bonus_member: { value: '0', group: 'member', remark: '注册赠送会员天数' },
  token_expire_hours: { value: '168', group: 'member', remark: 'TOKEN有效期(小时)' },
  device_limit_mode: { value: 'kick_oldest', group: 'member', remark: '设备超限处理(kick_oldest/reject_new)' },
  device_limit_count: { value: '3', group: 'member', remark: '最大登录设备数' },
  default_group_discount: { value: '1.0', group: 'member', remark: '默认分组折扣' },

  // 支付配置（入口在“支付管理 - 支付配置”）
  epay_api_url: { value: '', group: 'payment', remark: '易支付API地址' },
  epay_pid: { value: '', group: 'payment', remark: '商户ID' },
  epay_key: { value: '', group: 'payment', remark: '商户秘钥' },
  epay_notify_url: { value: '', group: 'payment', remark: '回调地址' },
  epay_return_url: { value: '', group: 'payment', remark: '返回地址' },

  // 通用配置 - 对齐 FongMi/TVBox 仓库和直播协议
  live_default_api: { value: '', group: 'general', remark: '直播清单接口(默认)' },
  epg_token_api: { value: '', group: 'general', remark: 'EPG信息接口(支持URL|台标URL)' },
  vod_default_api: { value: '', group: 'general', remark: '点播搜索接口(默认)' },
  depot_site_hide: { value: '', group: 'general', remark: '仓库站点屏蔽(用|分隔)' },
  depot_class_hide: { value: '', group: 'general', remark: '仓库分类屏蔽(用|分隔)' },
  depot_parses_hide: { value: '', group: 'general', remark: '视频接口屏蔽(用|分隔)' },
  maccms_key: { value: '', group: 'general', remark: '苹果CMS接口加密密钥(32位)' },
  service_contact: { value: '', group: 'general', remark: '客服信息' },
  weather_api_key: { value: 'a2a4ae4051c54142afe5da50c0ffb43d', group: 'general', remark: '和风API KEY' },
  weather_now_url: { value: 'https://n57dn9hcgv.re.qweatherapi.com/v7/weather/now', group: 'general', remark: '实时天气接口' },
  weather_3d_url: { value: 'https://n57dn9hcgv.re.qweatherapi.com/v7/weather/3d', group: 'general', remark: '天气预报接口' },
  weather_city_url: { value: 'https://n57dn9hcgv.re.qweatherapi.com/geo/v2/city/lookup', group: 'general', remark: '城市查询接口' },
  weather_show: { value: 'true', group: 'general', remark: '显示天气预报开关' },

  // 播放器配置
  default_player: { value: 'system', group: 'player', remark: '默认播放器(system/ljk/exo)' },
  custom_repo_mode: { value: 'auto', group: 'player', remark: '自定仓库(off/on/auto)' },
  source_rename_config: { value: '{}', group: 'player', remark: '播放源重命名配置(JSON)' },
  player_min_buffer_ms: { value: '32000', group: 'player', remark: '最小缓冲(ms)' },
  player_max_buffer_ms: { value: '64000', group: 'player', remark: '最大缓冲(ms)' },
  player_back_buffer_ms: { value: '50000', group: 'player', remark: '回看缓冲(ms)' },
  player_playback_buffer_ms: { value: '2500', group: 'player', remark: '播放缓冲(ms)' },
  player_rebuffer_ms: { value: '5000', group: 'player', remark: '重连缓冲(ms)' },
  player_cache_enabled: { value: 'true', group: 'player', remark: '启用边播缓存' },
  player_cache_max_mb: { value: '1024', group: 'player', remark: '播放器缓存上限(MB)' },
};

@Injectable()
export class SystemService {
  constructor(private prisma: PrismaClient) {}

  async getAll() {
    return this.prisma.systemConfig.findMany({ orderBy: { key: 'asc' } });
  }

  async getGrouped() {
    const configs = await this.prisma.systemConfig.findMany({ orderBy: { key: 'asc' } });
    const groups: Record<string, any[]> = {};
    for (const c of configs) {
      const g = c.group || 'basic';
      if (!groups[g]) groups[g] = [];
      groups[g].push(c);
    }
    return groups;
  }

  async getByGroup(group: string) {
    return this.prisma.systemConfig.findMany({ where: { group }, orderBy: { key: 'asc' } });
  }

  async getValue(key: string) {
    const config = await this.prisma.systemConfig.findUnique({ where: { key } });
    return config?.value || DEFAULT_CONFIGS[key]?.value || '';
  }

  async upsert(key: string, value: string, remark?: string, group?: string) {
    const defaultCfg = DEFAULT_CONFIGS[key];
    return this.prisma.systemConfig.upsert({
      where: { key },
      update: { value, remark: remark ?? undefined, group: group ?? undefined },
      create: { key, value, remark: remark || defaultCfg?.remark || '', group: group || defaultCfg?.group || 'basic' },
    });
  }

  async batchUpsert(items: Array<{ key: string; value: string; remark?: string; group?: string }>) {
    const results: any[] = [];
    for (const item of items) {
      const r = await this.upsert(item.key, item.value, item.remark, item.group);
      results.push(r);
    }
    return { success: true, count: results.length };
  }

  async initDefaults() {
    let created = 0;
    for (const [key, cfg] of Object.entries(DEFAULT_CONFIGS)) {
      const existing = await this.prisma.systemConfig.findUnique({ where: { key } });
      if (!existing) {
        await this.prisma.systemConfig.create({ data: { key, value: cfg.value, group: cfg.group, remark: cfg.remark } });
        created++;
      }
    }
    return { success: true, created, message: `初始化了 ${created} 个默认配置项` };
  }

  async testEmail(to: string) {
    const configs = await this.prisma.systemConfig.findMany({ where: { group: 'email' } });
    const cfg: Record<string, string> = {};
    for (const c of configs) cfg[c.key] = c.value;

    if (!cfg.smtp_host || !cfg.smtp_user || !cfg.smtp_pass) {
      throw new BadRequestException('SMTP配置不完整，请先填写SMTP服务器、用户名和密码');
    }

    try {
      const transporter = nodemailer.createTransport({
        host: cfg.smtp_host,
        port: parseInt(cfg.smtp_port) || 465,
        secure: cfg.smtp_secure === 'true',
        auth: { user: cfg.smtp_user, pass: cfg.smtp_pass },
      });

      const info = await transporter.sendMail({
        from: cfg.smtp_from || cfg.smtp_user,
        to,
        subject: '蜜蜂影视 - 邮件测试',
        text: '这是一封来自蜜蜂影视管理后台的测试邮件，如果您收到了此邮件，说明邮件配置正确。',
        html: '<h2>蜜蜂影视</h2><p>这是一封来自蜜蜂影视管理后台的测试邮件。</p><p>如果您收到了此邮件，说明邮件配置正确。</p><p style="color:#999;font-size:12px;">发送时间: ' + new Date().toLocaleString('zh-CN') + '</p>',
      });

      return { success: true, messageId: info.messageId, message: '邮件发送成功' };
    } catch (e: any) {
      throw new BadRequestException('邮件发送失败: ' + e.message);
    }
  }

  async testWeather(city: string) {
    const apiKey = await this.getValue('weather_api_key');
    const cityUrl = await this.getValue('weather_city_url');
    const nowUrl = await this.getValue('weather_now_url');

    if (!apiKey) throw new BadRequestException('和风API KEY未配置');
    if (!city) throw new BadRequestException('请输入城市名称');

    try {
      const cityRes = await fetch(`${cityUrl}?location=${encodeURIComponent(city)}&key=${apiKey}`);
      const cityData = await cityRes.json() as any;

      if (cityData.code !== '200' || !cityData.location?.length) {
        throw new BadRequestException(`城市查询失败: ${cityData.code || '未知错误'}`);
      }

      const locationId = cityData.location[0].id;
      const weatherRes = await fetch(`${nowUrl}?location=${locationId}&key=${apiKey}`);
      const weatherData = await weatherRes.json() as any;

      if (weatherData.code !== '200') {
        throw new BadRequestException(`天气查询失败: ${weatherData.code}`);
      }

      return {
        success: true,
        city: cityData.location[0].name,
        weather: weatherData.now,
        message: '天气API测试成功',
      };
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException('天气API请求失败: ' + e.message);
    }
  }

  async getSourceRename() {
    const config = await this.getValue('source_rename_config');
    try {
      return JSON.parse(config || '{}');
    } catch {
      return {};
    }
  }

  async updateSourceRename(data: Record<string, string>) {
    return this.upsert('source_rename_config', JSON.stringify(data), '播放源重命名配置', 'player');
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
      version: '2.0',
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
        await this.prisma.systemConfig.upsert({
          where: { key: item.key },
          update: { value: item.value, remark: item.remark || '', group: item.group || 'basic' },
          create: { key: item.key, value: item.value, remark: item.remark || '', group: item.group || 'basic' },
        });
      }
    }

    const tables = ['memberLevels', 'apiEndpoints', 'paymentConfigs', 'homeLayouts', 'appChannels', 'epayConfigs', 'notices', 'hotsearches'];
    const prismaModels: Record<string, any> = {
      memberLevels: this.prisma.memberLevel,
      apiEndpoints: this.prisma.apiEndpoint,
      paymentConfigs: this.prisma.paymentConfig,
      homeLayouts: this.prisma.homeLayout,
      appChannels: this.prisma.appChannel,
      epayConfigs: this.prisma.epayConfig,
      notices: this.prisma.notice,
      hotsearches: this.prisma.hotsearch,
    };

    for (const table of tables) {
      if (data[table]?.length) {
        for (const item of data[table]) {
          await prismaModels[table].create({ data: item });
        }
      }
    }

    return { success: true, message: '配置导入成功' };
  }
}