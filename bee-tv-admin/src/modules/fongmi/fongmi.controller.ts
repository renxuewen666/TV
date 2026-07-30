import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { RawResponse } from '../../common/decorators/raw-response.decorator';
import { FongMiService } from './fongmi.service';

@ApiTags('FongMi/TVBox兼容接口')
@Controller()
export class FongMiController {
  constructor(private fongMiService: FongMiService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('client-apps')
  getApps() { return this.fongMiService.getClientApps(); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('client-apps')
  createApp(@Body() body: any) { return this.fongMiService.createClientApp(body); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('client-apps/:id')
  updateApp(@Param('id') id: string, @Body() body: any) { return this.fongMiService.updateClientApp(+id, body); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('client-apps/:id')
  deleteApp(@Param('id') id: string) { return this.fongMiService.deleteClientApp(+id); }

  @Public()
  @RawResponse()
  @Get('main/init')
  init(@Req() req: any, @Query('app_id') appId?: string, @Query('apk_mark') apkMark?: string, @Query('sign') sign?: string) {
    return this.fongMiService.init({ appId, apkMark, sign, origin: `${req.protocol}://${req.get('host')}` });
  }

  @Public()
  @RawResponse()
  @Get('index/store')
  store(@Query('id') id?: string, @Query('repoId') repoId?: string, @Query('appid') appId?: string) {
    return this.fongMiService.getStoreProxy({ repoId: Number(id || repoId || 0) || undefined, appId });
  }

  @Public()
  @RawResponse()
  @Get('index/index')
  parse(@Query('videoUrl') videoUrl: string, @Query('parsesId') parsesId?: string) {
    return this.fongMiService.getParseProxy(videoUrl, Number(parsesId || 0) || undefined);
  }

  @Public()
  @RawResponse()
  @Post('users/login')
  legacyLogin(@Body() body: any) { return this.fongMiService.legacyLogin(this.legacyBody(body)); }

  @Public()
  @RawResponse()
  @Post('users/register')
  legacyRegister(@Body() body: any) { return this.fongMiService.legacyRegister(this.legacyBody(body)); }

  @Public()
  @RawResponse()
  @Post('users')
  legacyUser(@Headers('token') token?: string) { return this.fongMiService.legacyUser(token || ''); }

  @Public()
  @RawResponse()
  @Post('users/logout')
  legacyLogout(@Headers('token') token?: string) { return this.fongMiService.legacyLogout(token || ''); }

  @Public()
  @RawResponse()
  @Get('token/check')
  legacyTokenCheck(@Headers('token') token?: string) { return this.fongMiService.legacyTokenCheck(token || ''); }

  @Public()
  @RawResponse()
  @Get('token/refresh')
  legacyTokenRefresh(@Headers('token') token?: string) { return this.fongMiService.legacyTokenRefresh(token || ''); }

  @Public()
  @RawResponse()
  @Get('update/app')
  legacyUpdate(@Query('app_id') appId?: string, @Query('apk_mark') apkMark?: string, @Query('sign') sign?: string) {
    return this.fongMiService.legacyUpdate({ appId, apkMark, sign });
  }

  private legacyBody(body: any) {
    return {
      account: body.account, password: body.password, username: body.username,
      appId: body.app_id || body.appId, apkMark: body.apk_mark || body.apkMark,
      mark: body.mark, sign: body.sign,
    };
  }
}
