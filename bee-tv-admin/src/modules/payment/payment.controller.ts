import { Controller, Get, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PaymentService } from './payment.service';
import { UpdatePaymentConfigDto } from './dto/payment.dto';

@ApiTags('支付设置')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminAuthGuard)
@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Get('configs')
  getConfigs() { return this.paymentService.getConfigs(); }

  @Put('configs/:channel')
  saveConfig(@Param('channel') channel: string, @Body() dto: UpdatePaymentConfigDto) { return this.paymentService.saveConfig(channel, dto.config); }

  @Put('configs/:channel/status')
  updateStatus(@Param('channel') channel: string, @Body() body: { status: number }) { return this.paymentService.updateStatus(channel, body.status); }

  @Get('orders')
  getOrders(@Query('page') page?: string, @Query('size') size?: string) { return this.paymentService.getOrders(+(page || 1), +(size || 20)); }
}
