import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AllowAppUser } from '../../common/decorators/allow-app-user.decorator';
import { ScoreService } from './score.service';

@ApiTags('积分消费')
@Controller('score')
export class ScoreController {
  constructor(private scoreService: ScoreService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('products')
  getProducts() { return this.scoreService.getProducts(); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @Post('products')
  createProduct(@Body() body: any) { return this.scoreService.createProduct(body); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @Put('products/:id')
  updateProduct(@Param('id') id: string, @Body() body: any) { return this.scoreService.updateProduct(+id, body); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) { return this.scoreService.deleteProduct(+id); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @Get('exchanges')
  getExchanges(@Query('page') page?: string, @Query('size') size?: string, @Query('userId') userId?: string) {
    return this.scoreService.getExchanges(+(page || 1), +(size || 20), userId);
  }

  @AllowAppUser()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('exchange')
  exchange(@Req() req: any, @Body() body: { productId: number }) {
    if (req.user?.role !== 'user') throw new UnauthorizedException('请使用应用用户登录后兑换积分商品');
    return this.scoreService.exchange(String(req.user.sub), body.productId);
  }
}
