import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { EpayService } from './epay.service';

@ApiTags('易支付')
@Controller('epay')
export class EpayController {
  constructor(private epayService: EpayService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('configs')
  getConfigs() { return this.epayService.getConfigs(); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('configs')
  createConfig(@Body() body: any) { return this.epayService.createConfig(body); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('configs/:id')
  updateConfig(@Param('id') id: string, @Body() body: any) { return this.epayService.updateConfig(+id, body); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('configs/:id')
  deleteConfig(@Param('id') id: string) { return this.epayService.deleteConfig(+id); }

  @Public()
  @Post('order')
  createOrder(@Body() body: { configId: number; userId: string; levelId: number; payType: string }) {
    return this.epayService.createOrder(body.configId, body.userId, body.levelId, body.payType);
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

  @Public()
  @Get('query/:orderNo')
  queryOrder(@Param('orderNo') orderNo: string) { return this.epayService.queryOrder(orderNo); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('orders')
  getOrders(@Query('page') page?: string, @Query('size') size?: string, @Query('status') status?: string) {
    return this.epayService.getOrders(+(page || 1), +(size || 20), status ? +status : undefined);
  }
}
