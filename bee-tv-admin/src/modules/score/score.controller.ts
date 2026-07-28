import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
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
  @UseGuards(JwtAuthGuard)
  @Post('products')
  createProduct(@Body() body: any) { return this.scoreService.createProduct(body); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('products/:id')
  updateProduct(@Param('id') id: string, @Body() body: any) { return this.scoreService.updateProduct(+id, body); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) { return this.scoreService.deleteProduct(+id); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('exchanges')
  getExchanges(@Query('page') page?: string, @Query('size') size?: string, @Query('userId') userId?: string) {
    return this.scoreService.getExchanges(+(page || 1), +(size || 20), userId);
  }

  @Public()
  @Post('exchange')
  exchange(@Body() body: { userId: string; productId: number }) {
    return this.scoreService.exchange(body.userId, body.productId);
  }
}
