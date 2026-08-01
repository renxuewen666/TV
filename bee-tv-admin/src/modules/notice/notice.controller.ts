import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { NoticeService } from './notice.service';

@ApiTags('公告管理')
@Controller('notice')
export class NoticeController {
  constructor(private noticeService: NoticeService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @Get()
  list(@Query('page') page?: string, @Query('size') size?: string, @Query('type') type?: string) {
    return this.noticeService.list(+(page || 1), +(size || 20), type ? +type : undefined);
  }

  @Public()
  @Get('active')
  active() { return this.noticeService.active(); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @Post()
  create(@Body() body: any) { return this.noticeService.create(body); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.noticeService.update(+id, body); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) { return this.noticeService.remove(+id); }
}
