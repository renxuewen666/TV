import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { DanmakuService } from './danmaku.service';
import { CreateDanmakuDto, UpdateDanmakuDto } from './dto/danmaku.dto';

@ApiTags('弹幕配置管理')
@Controller('danmaku')
export class DanmakuController {
  constructor(private danmakuService: DanmakuService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  list(
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('status') status?: string,
  ) {
    return this.danmakuService.list(
      +(page || 1),
      +(size || 20),
      status !== undefined ? +status : undefined,
    );
  }

  @Public()
  @Get('active')
  active(@Query('appId') appId?: string) {
    return this.danmakuService.active(appId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateDanmakuDto) {
    return this.danmakuService.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/test')
  test(@Param('id') id: string) {
    return this.danmakuService.test(+id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('batch/delete')
  batchDelete(@Body() body: { ids: number[] }) {
    return this.danmakuService.batchDelete(body.ids);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id/sort')
  updateSort(@Param('id') id: string, @Body() body: { sort: number }) {
    return this.danmakuService.updateSort(+id, body.sort);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDanmakuDto) {
    return this.danmakuService.update(+id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.danmakuService.remove(+id);
  }
}
