import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { SystemService } from '../system/system.service';

@Injectable()
export class AppConfigService {
  constructor(
    private prisma: PrismaClient,
    private systemService: SystemService,
  ) {}

  /**
   * APP端获取完整配置下发
   * 统一入口，返回APP所需的所有配置数据
   */
  async getAppConfig(appId?: string) {
    const [systemConfig, ads, marquees, notices, hotsearches, danmakuConfigs, repos, repoScripts, apiEndpoints, layouts, appVersions] = await Promise.all([
      this.prisma.systemConfig.findMany(),
      this.prisma.advertisement.findMany({ where: { status: 1 }, orderBy: { sort: 'asc' } }),
      this.prisma.marquee.findMany({ where: { status: 1 }, orderBy: { sort: 'asc' } }),
      this.prisma.notice.findMany({ where: { status: 1 }, orderBy: { createdAt: 'desc' } }),
      this.prisma.hotsearch.findMany({ where: { status: 1 }, orderBy: { sort: 'asc' } }),
      this.prisma.danmakuConfig.findMany({ where: { status: 1 }, orderBy: { sort: 'asc' } }),
      this.prisma.repoSource.findMany({ where: { status: 1 }, orderBy: { priority: 'desc' } }),
      this.prisma.repoScript.findMany({ where: { status: 1 }, orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }] }),
      this.prisma.apiEndpoint.findMany({ where: { status: 1 }, orderBy: { createdAt: 'desc' } }),
      this.prisma.homeLayout.findMany(),
      this.prisma.appVersion.findMany({ where: { status: 1 }, orderBy: { createdAt: 'desc' } }),
    ]);

    // 转换 systemConfig 为 key-value 对象
    const system: Record<string, string> = {};
    for (const c of systemConfig) {
      system[c.key] = c.value;
    }

    // 按应用筛选
    const filterByApp = <T extends { appIds: string }>(items: T[]) => {
      if (!appId) return items;
      return items.filter(item => !item.appIds || item.appIds === '' || item.appIds.split(',').includes(appId));
    };

    // H5沿用手机端布局；每个端和页面只允许一个激活布局。
    const activeLayouts = (type: string) => layouts
      .filter(layout => layout.type === type && layout.status === 1)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    const mobileLayouts = activeLayouts('mobile');
    const tvLayouts = activeLayouts('tv');
    const layoutByPage = (items: typeof layouts) => Object.fromEntries(
      items.map(layout => [layout.page || 'home', this.parseLayoutConfig(layout.config)]),
    );
    const mobileLayout = mobileLayouts.find(layout => layout.page === 'home') || mobileLayouts[0] || null;
    const tvLayout = tvLayouts.find(layout => layout.page === 'home') || tvLayouts[0] || null;

    // 获取最新版本
    const latestVersion = appVersions[0] || null;

    // 获取源重命名配置
    let sourceRename: Record<string, string> = {};
    try {
      sourceRename = JSON.parse(system.source_rename_config || '{}');
    } catch {}

    return {
      system: {
        siteName: system.site_name || '蜜蜂影视',
        siteIcp: system.site_icp || '',
        siteVersion: system.site_version || '1.0.0',
        siteLogo: system.site_logo || '',
        weather: {
          apiKey: system.weather_api_key || '',
          show: system.weather_show === 'true',
          nowUrl: system.weather_now_url || '',
          forecastUrl: system.weather_3d_url || '',
          cityUrl: system.weather_city_url || '',
        },
        player: {
          defaultPlayer: system.default_player || 'system',
          customRepoMode: system.custom_repo_mode || 'auto',
          minBufferMs: parseInt(system.player_min_buffer_ms) || 32000,
          maxBufferMs: parseInt(system.player_max_buffer_ms) || 64000,
          backBufferMs: parseInt(system.player_back_buffer_ms) || 50000,
          playbackBufferMs: parseInt(system.player_playback_buffer_ms) || 2500,
          rebufferMs: parseInt(system.player_rebuffer_ms) || 5000,
          cacheEnabled: system.player_cache_enabled !== 'false',
          cacheMaxMb: parseInt(system.player_cache_max_mb) || 1024,
        },
        member: {
          registerEnabled: system.app_register_enabled !== 'false',
          autoRegisterEnabled: system.app_auto_register_enabled === 'true',
          registerEmailRequired: system.app_register_email_required === 'true',
          regBonusScore: parseInt(system.reg_bonus_score) || 0,
          regBonusMember: parseInt(system.reg_bonus_member) || 0,
          tokenExpireHours: parseInt(system.token_expire_hours) || 168,
          deviceLimitMode: system.device_limit_mode || 'kick_oldest',
          deviceLimitCount: parseInt(system.device_limit_count) || 3,
        },
        apis: {
          liveDefault: system.live_default_api || '',
          epgToken: system.epg_token_api || '',
          vodDefault: system.vod_default_api || '',
          vodHotsearch: system.vod_hotsearch_api || '',
        },
        sourceRename,
      },
      advertisements: filterByApp(ads).map(a => ({
        id: a.id,
        title: a.title,
        image: a.image,
        link: a.link,
        position: a.position,
        sort: a.sort,
        startAt: a.startAt,
        endAt: a.endAt,
      })),
      marquees: filterByApp(marquees).map(m => ({
        id: m.id,
        content: m.content,
        color: m.color,
        bgColor: m.bgColor,
        speed: m.speed,
        position: m.position,
      })),
      notices: filterByApp(notices).map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        type: n.type,
      })),
      hotsearches: filterByApp(hotsearches).map(h => ({
        id: h.id,
        title: h.title,
        url: h.url,
        sort: h.sort,
      })),
      danmaku: filterByApp(danmakuConfigs).map(d => ({
        id: d.id,
        name: d.name,
        apiUrl: d.apiUrl,
        method: d.method,
        headers: d.headers,
        params: d.params,
        urlKeywords: d.urlKeywords,
        keywordMode: d.keywordMode,
      })),
      repos: repos.map(r => ({
        id: r.id,
        name: r.name,
        url: r.url,
        type: r.type,
        priority: r.priority,
        scripts: repoScripts.filter(s => s.repoId === r.id || s.repoId === 0).map(s => ({
          id: s.id,
          name: s.name,
          type: s.type,
          content: s.content,
          sort: s.sort,
        })),
      })),
      repoScripts: repoScripts.map(s => ({
        id: s.id,
        repoId: s.repoId,
        name: s.name,
        type: s.type,
        content: s.content,
        sort: s.sort,
      })),
      apiEndpoints: apiEndpoints.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        url: a.url,
      })),
      layout: {
        mobile: mobileLayout ? this.parseLayoutConfig(mobileLayout.config) : null,
        tv: tvLayout ? this.parseLayoutConfig(tvLayout.config) : null,
        h5: mobileLayout ? this.parseLayoutConfig(mobileLayout.config) : null,
        mobilePages: layoutByPage(mobileLayouts),
        tvPages: layoutByPage(tvLayouts),
      },
      version: latestVersion ? {
        versionName: latestVersion.versionName,
        versionCode: latestVersion.versionCode,
        channel: latestVersion.channel,
        downloadUrl: latestVersion.downloadUrl,
        changelog: latestVersion.changelog,
        forceUpdate: latestVersion.forceUpdate === 1,
      } : null,
      configVersion: '2.0',
      generatedAt: new Date().toISOString(),
    };
  }

  private parseLayoutConfig(configStr: string) {
    try {
      return JSON.parse(configStr);
    } catch {
      return null;
    }
  }

  /**
   * 获取APP配置摘要（轻量版，用于启动时快速检查）
   */
  async getConfigSummary(appId?: string) {
    const config = await this.getAppConfig(appId);
    return {
      configVersion: config.configVersion,
      generatedAt: config.generatedAt,
      siteName: config.system.siteName,
      siteVersion: config.system.siteVersion,
      hasAds: config.advertisements.length > 0,
      hasMarquees: config.marquees.length > 0,
      hasNotices: config.notices.length > 0,
      repoCount: config.repos.length,
      repoScriptCount: config.repoScripts.length,
      apiCount: config.apiEndpoints.length,
      hasMobileLayout: !!config.layout.mobile,
      hasTvLayout: !!config.layout.tv,
      version: config.version,
    };
  }
}
