import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppUserService } from './app-user.service';

@ApiTags('APP-用户')
@Controller()
export class AppUserController {
  constructor(private appUserService: AppUserService) {}

  @Get('user/profile')
  getProfile(@Req() req: any) {
    return this.appUserService.getProfile(req.user.sub);
  }

  @Put('user/profile')
  updateProfile(@Req() req: any, @Body() dto: any) {
    return this.appUserService.updateProfile(req.user.sub, dto);
  }

  @Get('user/signin/status')
  signStatus(@Req() req: any) {
    return this.appUserService.getSignStatus(req.user.sub);
  }

  @Post('user/signin')
  signIn(@Req() req: any) {
    return this.appUserService.signIn(req.user.sub);
  }

  @Get('user/signin/logs')
  scoreLogs(@Req() req: any, @Query('p') p?: string) {
    return this.appUserService.getScoreLogs(req.user.sub, p ? +p : 1);
  }

  @Get('user/history')
  getHistory(@Req() req: any, @Query('p') p?: string) {
    return this.appUserService.getHistory(req.user.sub, p ? +p : 1);
  }

  @Post('user/history')
  addHistory(@Req() req: any, @Body() dto: any) {
    return this.appUserService.addHistory(req.user.sub, dto);
  }

  @Get('user/favorites')
  getFavorites(@Req() req: any, @Query('p') p?: string) {
    return this.appUserService.getFavorites(req.user.sub, p ? +p : 1);
  }

  @Post('user/favorites')
  addFavorite(@Req() req: any, @Body() dto: any) {
    return this.appUserService.addFavorite(req.user.sub, dto);
  }

  @Delete('user/favorites/:vodId')
  removeFavorite(@Req() req: any, @Param('vodId') vodId: string) {
    return this.appUserService.removeFavorite(req.user.sub, vodId);
  }
}
