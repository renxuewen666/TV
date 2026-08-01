import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AppUserService } from './app-user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('APP-用户')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class AppUserController {
  constructor(private appUserService: AppUserService) {}

  private appUserId(req: any): number {
    if (req.user?.role !== 'user') throw new UnauthorizedException('请使用应用用户登录');
    return Number(req.user.sub);
  }

  @Get('user/profile')
  getProfile(@Req() req: any) {
    return this.appUserService.getProfile(this.appUserId(req));
  }

  @Put('user/profile')
  updateProfile(@Req() req: any, @Body() dto: any) {
    return this.appUserService.updateProfile(this.appUserId(req), dto);
  }

  @Get('user/signin/status')
  signStatus(@Req() req: any) {
    return this.appUserService.getSignStatus(this.appUserId(req));
  }

  @Post('user/signin')
  signIn(@Req() req: any) {
    return this.appUserService.signIn(this.appUserId(req));
  }

  @Get('user/signin/logs')
  scoreLogs(@Req() req: any, @Query('p') p?: string) {
    return this.appUserService.getScoreLogs(this.appUserId(req), p ? +p : 1);
  }

  @Get('user/history')
  getHistory(@Req() req: any, @Query('p') p?: string) {
    return this.appUserService.getHistory(this.appUserId(req), p ? +p : 1);
  }

  @Post('user/history')
  addHistory(@Req() req: any, @Body() dto: any) {
    return this.appUserService.addHistory(this.appUserId(req), dto);
  }

  @Get('user/favorites')
  getFavorites(@Req() req: any, @Query('p') p?: string) {
    return this.appUserService.getFavorites(this.appUserId(req), p ? +p : 1);
  }

  @Post('user/favorites')
  addFavorite(@Req() req: any, @Body() dto: any) {
    return this.appUserService.addFavorite(this.appUserId(req), dto);
  }

  @Delete('user/favorites/:vodId')
  removeFavorite(@Req() req: any, @Param('vodId') vodId: string) {
    return this.appUserService.removeFavorite(this.appUserId(req), vodId);
  }
}
