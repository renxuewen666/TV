import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { MarqueeService } from './marquee.service';
import { CreateMarqueeDto, UpdateMarqueeDto } from './dto/marquee.dto';

@ApiTags('跑马灯管理')
@Controller('marquee')
export class MarqueeController {
  constructor(private marqueeService: MarqueeService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  list(
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('position') position?: string,
    @Query('status') status?: string,
  ) {
    return this.marqueeService.list(
      +(page || 1),
      +(size || 20),
      position,
      status !== undefined ? +status : undefined,
    );
  }

  @Public()
  @Get('active')
  active(@Query('appId') appId?: string) {
    return this.marqueeService.active(appId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateMarqueeDto) {
    return this.marqueeService.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('batch/delete')
  batchDelete(@Body() body: { ids: number[] }) {
    return this.marqueeService.batchDelete(body.ids);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id/sort')
  updateSort(@Param('id') id: string, @Body() body: { sort: number }) {
    return this.marqueeService.updateSort(+id, body.sort);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMarqueeDto) {
    return this.marqueeService.update(+id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.marqueeService.remove(+id);
  }
}
