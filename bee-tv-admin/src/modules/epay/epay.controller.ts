import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AllowAppUser } from '../../common/decorators/allow-app-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { EpayService } from './epay.service';

@ApiTags('易支付')
@UseGuards(JwtAuthGuard, AdminAuthGuard)
@Controller('epay')
export class EpayController {
  constructor(private epayService: EpayService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @Get('configs')
  getConfigs() { return this.epayService.getConfigs(); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @Post('configs')
  createConfig(@Body() body: any) { return this.epayService.createConfig(body); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @Put('configs/:id')
  updateConfig(@Param('id') id: string, @Body() body: any) { return this.epayService.updateConfig(+id, body); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @Delete('configs/:id')
  deleteConfig(@Param('id') id: string) { return this.epayService.deleteConfig(+id); }

  @AllowAppUser()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('order')
  createOrder(@Req() req: any, @Body() body: { configId: number; levelId: number; payType: string }) {
    if (req.user.role !== 'user') throw new UnauthorizedException('请使用应用用户登录后创建支付订单');
    return this.epayService.createOrder(body.configId, Number(req.user.sub), body.levelId, body.payType);
  }

  @Public()
  @Post('notify')
  notify(@Query() query: any, @Body() body: any) {
    return this.epayService.handleNotify({ ...query, ...body });
  }

  @Public()
  @Get('notify')
  notifyGet(@Query() query: any) {
    return this.epayService.handleNotify(query);
  }

  @AllowAppUser()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('query/:orderNo')
  queryOrder(@Req() req: any, @Param('orderNo') orderNo: string) {
    const appUserId = req.user?.role === 'user' ? Number(req.user.sub) : undefined;
    return this.epayService.queryOrder(orderNo, appUserId);
  }

  @AllowAppUser()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('orders')
  getOrders(@Req() req: any, @Query('page') page?: string, @Query('size') size?: string, @Query('status') status?: string) {
    const appUserId = req.user?.role === 'user' ? Number(req.user.sub) : undefined;
    return this.epayService.getOrders(+(page || 1), +(size || 20), status ? +status : undefined, appUserId);
  }
}
