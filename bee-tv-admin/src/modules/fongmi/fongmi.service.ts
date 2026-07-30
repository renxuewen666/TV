import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createCipheriv, createHash, randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AppConfigService } from '../app-config/app-config.service';
import { SystemService } from '../system/system.service';

const ALNUM = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

@Injectable()
export class FongMiService {
  constructor(
    private prisma: PrismaClient,
    private jwtService: JwtService,
    private appConfigService: AppConfigService,
    private systemService: SystemService,
  ) {}

  async getClientApps() {
    return this.prisma.clientApp.findMany({ orderBy: [{ status: 'desc' }, { createdAt: 'desc' }] });
  }

  async createClientApp(data: any) {
    const appId = String(data.appId || '').trim();
    if (!appId) throw new BadRequestException('AppId不能为空');
    const appKey = String(data.appKey || '').trim() || randomBytes(16).toString('hex').toUpperCase();
    return this.prisma.clientApp.create({
      data: {
        name: String(data.name || appId), appId, appKey, qqGroup: String(data.qqGroup || ''),
        packageId: String(data.packageId || ''), platform: String(data.platform || 'tv'),
        loginLimit: Math.max(1, Number(data.loginLimit || 3)), operationMode: String(data.operationMode || 'all_free'),
        logo: String(data.logo || ''), splash: String(data.splash || ''), backdrop: String(data.backdrop || ''),
        playerImage: String(data.playerImage || ''), serviceImage: String(data.serviceImage || ''),
        about: String(data.about || ''), runtimeConfig: this.normalizeRuntimeConfig(data.runtimeConfig),
        registerPolicy: this.normalizePolicy(data.registerPolicy), autoRegisterPolicy: this.normalizePolicy(data.autoRegisterPolicy),
        emailPolicy: this.normalizePolicy(data.emailPolicy), status: Number(data.status ?? 1),
      },
    });
  }

  async updateClientApp(id: number, data: any) {
    const update: Record<string, any> = {};
    const fields = ['name', 'appId', 'appKey', 'qqGroup', 'packageId', 'platform', 'operationMode', 'logo', 'splash', 'backdrop', 'playerImage', 'serviceImage', 'about'];
    for (const field of fields) if (data[field] !== undefined) update[field] = String(data[field]);
    if (data.runtimeConfig !== undefined) update.runtimeConfig = this.normalizeRuntimeConfig(data.runtimeConfig);
    if (data.registerPolicy !== undefined) update.registerPolicy = this.normalizePolicy(data.registerPolicy);
    if (data.autoRegisterPolicy !== undefined) update.autoRegisterPolicy = this.normalizePolicy(data.autoRegisterPolicy);
    if (data.emailPolicy !== undefined) update.emailPolicy = this.normalizePolicy(data.emailPolicy);
    if (data.loginLimit !== undefined) update.loginLimit = Math.max(1, Number(data.loginLimit));
    if (data.status !== undefined) update.status = Number(data.status);
    return this.prisma.clientApp.update({ where: { id }, data: update });
  }

  async deleteClientApp(id: number) {
    await this.prisma.clientApp.delete({ where: { id } });
    return { success: true };
  }

  async init(params: { appId?: string; apkMark?: string; sign?: string; origin: string }) {
    const app = await this.resolveApp(params.appId, params.apkMark, params.sign, false);
    const config = await this.appConfigService.getAppConfig(app?.appId);
    const system = await this.systemValues();
    const version = await this.prisma.appVersion.findFirst({
      where: { status: 1, ...(app ? { channel: app.appId } : {}) },
      orderBy: { versionCode: 'desc' },
    }) || config.version;

    const data = {
      siteConfig: {
        name: system.site_name || '蜜蜂影视',
        live_api: system.live_default_api || '',
        epg_api: system.epg_token_api || '',
        hot_search_api: '',
        depot_site_hide: system.depot_site_hide || '',
        depot_class_hide: system.depot_class_hide || '',
        depot_parses_hide: system.depot_parses_hide || '',
        maccms_key: system.maccms_key || '',
        qweather_key: system.weather_api_key || '',
        default_player: this.ui6Player(system.default_player),
        custom_depot: this.ui6CustomRepo(system.custom_repo_mode),
        resource_renaming: this.sourceRenameAsPipe(system.source_rename_config || '{}'),
        service_qq: system.service_contact || '',
        pay_type_list: [],
        app_config: app ? this.clientAppDto(app) : this.emptyAppConfig(),
      },
      noticeList: config.notices.map((item: any) => ({
        id: item.id, title: item.title, content: item.content, updatetime: Math.floor(new Date().getTime() / 1000), status: 'normal', weigh: 0,
      })),
      homeConfig: config.advertisements.map((item: any) => ({
        id: item.id, title: item.title, subtitle: '', parameter: item.link ? `web===${item.link}` : '', blurbcontent: '', coverimage: item.image, status: 'normal', weigh: item.sort,
      })),
      depotConfig: config.repos.map((repo: any) => ({
        id: repo.id, name: repo.name, url: `${params.origin}/api/index/store?id=${repo.id}&appid=${encodeURIComponent(app?.appId || '')}`, status: 'normal', status_text: 'normal', weigh: repo.priority,
      })),
      parsesConfig: config.apiEndpoints.map((endpoint: any) => ({
        id: endpoint.id, name: endpoint.name, url: endpoint.url, ext: '', type: String(endpoint.type), status: 'normal', weigh: 0,
      })),
      version: version ? this.versionDto(version) : null,
    };
    return this.envelope(data);
  }

  async getStoreProxy(params: { repoId?: number; appId?: string }) {
    let repo: any;
    if (params.repoId) repo = await this.prisma.repoSource.findFirst({ where: { id: params.repoId, status: 1 } });
    if (!repo) repo = await this.prisma.repoSource.findFirst({ where: { status: 1 }, orderBy: { priority: 'desc' } });
    if (!repo) throw new NotFoundException('没有可用仓库');
    const source = await this.fetchJson(repo.url);
    const data = this.injectLiveConfig(source, await this.systemService.getValue('live_default_api'), await this.systemService.getValue('epg_token_api'));
    return `lvDou+${this.encryptJson(data)}`;
  }

  async getParseProxy(videoUrl: string, parsesId?: number) {
    if (!videoUrl || !/^https?:\/\//i.test(videoUrl)) throw new BadRequestException('videoUrl必须是http或https URL');
    const endpoint = parsesId ? await this.prisma.apiEndpoint.findFirst({ where: { id: parsesId, status: 1 } }) : null;
    if (!endpoint) throw new NotFoundException('视频解析接口不存在或已停用');
    const target = endpoint.url.includes('{url}')
      ? endpoint.url.replace('{url}', encodeURIComponent(videoUrl))
      : `${endpoint.url}${endpoint.url.includes('?') ? '&' : '?'}url=${encodeURIComponent(videoUrl)}`;
    const response = await fetch(target, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'BeeTV-FongMi/1.0' } });
    if (!response.ok) throw new BadRequestException(`解析请求失败 HTTP ${response.status}`);
    let payload: any;
    try { payload = JSON.parse(await response.text()); } catch { throw new BadRequestException('解析接口未返回JSON'); }
    const parsedUrl = payload?.url || payload?.data?.url;
    if (!parsedUrl || typeof parsedUrl !== 'string') throw new BadRequestException('解析接口未返回可播放url');
    const encryptedUrl = `https://baidu.con/${this.encryptJson(parsedUrl)}`;
    if (payload.data?.url) payload.data.url = encryptedUrl; else payload.url = encryptedUrl;
    return payload;
  }

  async legacyLogin(dto: { account?: string; password?: string; appId?: string; apkMark?: string; mark?: string; sign?: string }) {
    const app = await this.resolveApp(dto.appId, dto.apkMark, dto.sign, true);
    if (!dto.account || !dto.password) throw new BadRequestException('账号和密码不能为空');
    const user = await this.prisma.appUser.findFirst({ where: { OR: [{ email: dto.account }, { nickname: dto.account }] } });
    if (!user || user.status !== 1 || !(await bcrypt.compare(dto.password, user.password))) throw new UnauthorizedException('账号或密码错误');
    return this.envelope({ userinfo: await this.issueLegacySession(user, app, dto.mark || dto.apkMark || '') });
  }

  async legacyRegister(dto: { username?: string; password?: string; appId?: string; apkMark?: string; mark?: string; sign?: string }) {
    const app = await this.resolveApp(dto.appId, dto.apkMark, dto.sign, true);
    const registerEnabled = this.resolvePolicy(app?.registerPolicy, await this.systemService.getValue('app_register_enabled'));
    if (!registerEnabled) throw new BadRequestException('当前应用已关闭用户注册');
    const username = String(dto.username || '').trim();
    if (!username || !dto.password || dto.password.length < 6) throw new BadRequestException('用户名不能为空且密码至少6位');
    const existing = await this.prisma.appUser.findFirst({ where: { nickname: username } });
    if (existing) throw new BadRequestException('账号已被注册');
    const email = `${username.replace(/[^a-zA-Z0-9_-]/g, '') || 'user'}_${Date.now()}@local.bee-tv`;
    const bonusDays = parseInt(await this.systemService.getValue('reg_bonus_member')) || 0;
    const user = await this.prisma.appUser.create({
      data: {
        email, nickname: username, password: await bcrypt.hash(dto.password, 10),
        score: parseInt(await this.systemService.getValue('reg_bonus_score')) || 0,
        memberExpireAt: bonusDays > 0 ? new Date(Date.now() + bonusDays * 86400000) : null,
      },
    });
    return this.envelope({ userinfo: await this.issueLegacySession(user, app, dto.mark || dto.apkMark || '') });
  }

  async legacyUser(token: string) {
    const user = await this.verifyLegacyToken(token);
    return this.envelope({ userinfo: this.legacyUserDto(user) });
  }

  async legacyLogout(token: string) {
    const session = await this.getLegacySession(token);
    await this.prisma.clientSession.delete({ where: { id: session.id } });
    return this.envelope({});
  }

  async legacyTokenCheck(token: string) {
    await this.getLegacySession(token);
    return this.envelope({ valid: true });
  }

  async legacyTokenRefresh(token: string) {
    const session = await this.getLegacySession(token);
    const user = await this.prisma.appUser.findUnique({ where: { id: session.userId } });
    if (!user) throw new UnauthorizedException('用户不存在');
    const app = await this.prisma.clientApp.findFirst({ where: { appId: session.appId, status: 1 } });
    if (!app) throw new UnauthorizedException('应用不存在或已停用');
    return this.envelope({ userinfo: await this.issueLegacySession(user, app, session.deviceId) });
  }

  async legacyUpdate(params: { appId?: string; apkMark?: string; sign?: string }) {
    const app = await this.resolveApp(params.appId, params.apkMark, params.sign, false);
    const version = await this.prisma.appVersion.findFirst({ where: { status: 1, ...(app ? { channel: app.appId } : {}) }, orderBy: { versionCode: 'desc' } });
    return this.envelope(version ? this.versionDto(version) : {});
  }

  private async issueLegacySession(user: any, app: any, deviceId: string) {
    const id = deviceId.trim().slice(0, 128) || `android-${randomBytes(8).toString('hex')}`;
    const active = await this.prisma.clientSession.findMany({ where: { userId: user.id, appId: app.appId }, orderBy: { createdAt: 'asc' } });
    const existing = active.find(item => item.deviceId === id);
    const limit = app.loginLimit || 3;
    if (!existing && active.length >= limit) {
      if ((await this.systemService.getValue('device_limit_mode')) === 'reject_new') throw new BadRequestException(`该应用最多允许${limit}台设备登录`);
      await this.prisma.clientSession.delete({ where: { id: active[0].id } });
    }
    const tokenId = randomBytes(18).toString('hex');
    const hours = parseInt(await this.systemService.getValue('token_expire_hours')) || 168;
    const expireAt = new Date(Date.now() + hours * 3600000);
    await this.prisma.clientSession.upsert({
      where: { userId_appId_deviceId: { userId: user.id, appId: app.appId, deviceId: id } },
      create: { userId: user.id, appId: app.appId, deviceId: id, tokenId, expireAt },
      update: { tokenId, expireAt },
    });
    const token = this.jwtService.sign({ sub: user.id, appId: app.appId, deviceId: id, jti: tokenId }, { expiresIn: `${hours}h` });
    return { ...this.legacyUserDto(user), token };
  }

  private async resolveApp(appId?: string, apkMark?: string, sign?: string, required = true) {
    if (!appId) {
      if (required) throw new BadRequestException('缺少app_id');
      return null;
    }
    const app = await this.prisma.clientApp.findFirst({ where: { appId, status: 1 } });
    if (!app) throw new NotFoundException('应用不存在或已停用');
    if (sign) {
      const expected = createHash('sha256').update((app.appKey + appId + (apkMark || '')).split('').sort().join('')).digest('hex');
      if (expected !== sign.toLowerCase()) throw new UnauthorizedException('应用签名无效');
    }
    return app;
  }

  private async getLegacySession(token: string) {
    if (!token) throw new UnauthorizedException('缺少token');
    try {
      const payload: any = this.jwtService.verify(token);
      const session = await this.prisma.clientSession.findFirst({ where: { tokenId: payload.jti, userId: payload.sub, appId: payload.appId } });
      if (!session || (session.expireAt && session.expireAt < new Date())) throw new UnauthorizedException('登录已过期');
      return session;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('登录已过期');
    }
  }

  private async verifyLegacyToken(token: string) {
    const session = await this.getLegacySession(token);
    const user = await this.prisma.appUser.findUnique({ where: { id: session.userId } });
    if (!user || user.status !== 1) throw new UnauthorizedException('账号不存在或已禁用');
    return user;
  }

  private async systemValues() {
    const rows = await this.prisma.systemConfig.findMany();
    return Object.fromEntries(rows.map(row => [row.key, row.value])) as Record<string, string>;
  }

  private envelope(data: unknown) {
    return this.encryptJson({ code: 1, msg: 'success', time: Math.floor(Date.now() / 1000), data });
  }

  private encryptJson(data: unknown) {
    const key = this.randomKey();
    const cipher = createCipheriv('aes-128-cbc', Buffer.from(key, 'utf8'), Buffer.from(key, 'utf8'));
    const cipherText = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]).toString('base64');
    return key + cipherText;
  }

  private randomKey() {
    const bytes = randomBytes(16);
    return Array.from(bytes, value => ALNUM[value % ALNUM.length]).join('');
  }

  private clientAppDto(app: any) {
    return {
      id: app.id, name: app.name, key: app.appKey, qqgroup: app.qqGroup, logincontrol: app.loginLimit,
      operationmode: this.ui6OperationMode(app.operationMode), logoimage: app.logo, splashimage: app.splash,
      backdropimage: app.backdrop, playerimage: app.playerImage, serviceimage: app.serviceImage, about: this.encodeAbout(app.about),
      runtime_config: this.parseRuntimeConfig(app.runtimeConfig), register_enabled: this.resolvePolicy(app.registerPolicy, true),
      auto_register_enabled: this.resolvePolicy(app.autoRegisterPolicy, false), email_required: this.resolvePolicy(app.emailPolicy, false), status: 'normal',
    };
  }

  private emptyAppConfig() {
    return { name: '蜜蜂影视', key: '', qqgroup: '', logincontrol: 3, operationmode: '0', logoimage: '', splashimage: '', backdropimage: '', playerimage: '', serviceimage: '', about: this.encodeAbout('') };
  }

  private legacyUserDto(user: any) {
    return {
      id: user.id, username: user.nickname, nickname: user.nickname, email: user.email, avatar: user.avatar,
      score: user.score, money: user.balance || 0, group_id: user.memberLevel, vipendtime: user.memberExpireAt ? Math.floor(new Date(user.memberExpireAt).getTime() / 1000) : 0,
      vip: user.memberExpireAt && new Date(user.memberExpireAt) > new Date() ? 1 : 0,
    };
  }

  private versionDto(version: any) {
    return { enforce: version.forceUpdate ? 1 : 0, packagesize: version.packageSize || '', downloadurl: version.downloadUrl, version: version.versionName, newversion: version.versionName, upgradetext: version.changelog || '' };
  }

  private sourceRenameAsPipe(value: string) {
    try { return Object.entries(JSON.parse(value)).map(([key, name]) => `${key}=>${name}`).join('|'); } catch { return value; }
  }

  private ui6Player(value?: string) { return ({ system: '1', ijk: '2', ljk: '2', exo: '3' }[value || ''] || '3'); }
  private ui6CustomRepo(value?: string) { return ({ off: '1', on: '2', auto: '3' }[value || ''] || '3'); }
  private ui6OperationMode(value: string) { return ({ all_free: '0', vod_paid: '1', live_paid: '2', all_paid: '3' }[value] || '0'); }
  private normalizePolicy(value: unknown) { return [-1, 0, 1].includes(Number(value)) ? Number(value) : -1; }
  private resolvePolicy(policy: number | undefined, fallback: boolean | string) { return policy === undefined || policy === -1 ? fallback === true || fallback === 'true' : policy === 1; }
  private normalizeRuntimeConfig(value: unknown) {
    if (!value) return '';
    const text = String(value).trim();
    try { return JSON.stringify(JSON.parse(text)); } catch { throw new BadRequestException('应用扩展配置必须是有效JSON'); }
  }
  private parseRuntimeConfig(value: string) { try { return value ? JSON.parse(value) : {}; } catch { return {}; } }

  private encodeAbout(value: string) {
    if (!value) return Buffer.from('{}', 'utf8').toString('base64');
    try { JSON.parse(value); return Buffer.from(value, 'utf8').toString('base64'); } catch { return Buffer.from(JSON.stringify({ content: value }), 'utf8').toString('base64'); }
  }

  private injectLiveConfig(source: any, liveApi: string, epgApi: string) {
    const data = typeof source === 'object' && source !== null ? source : {};
    if (!liveApi) return data;
    const [epg, logo] = epgApi.split('|');
    const live = { name: 'live', type: 0, playerType: 1, url: liveApi, ua: 'okhttp/3.15', epg: epg || '', logo: logo || '' };
    return { ...data, lives: [live] };
  }

  private async fetchJson(url: string) {
    if (!/^https?:\/\//i.test(url)) throw new BadRequestException('仓库地址必须是http或https URL');
    const response = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'BeeTV-FongMi/1.0' } });
    if (!response.ok) throw new BadRequestException(`仓库请求失败 HTTP ${response.status}`);
    try { return JSON.parse(await response.text()); } catch { throw new BadRequestException('仓库内容不是有效JSON'); }
  }
}
