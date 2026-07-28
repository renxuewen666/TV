import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { AppManageService } from './app-manage.service';
import { CreateVersionDto, CreateChannelDto } from './dto/app.dto';

@ApiTags('应用管理')
@Controller('app-manage')
export class AppManageController {
  constructor(private appManageService: AppManageService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('versions')
  getVersions(@Query('channel') channel?: string) { return this.appManageService.getVersions(channel); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('versions')
  createVersion(@Body() dto: CreateVersionDto) { return this.appManageService.createVersion(dto); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('versions/:id')
  updateVersion(@Param('id') id: string, @Body() body: { status?: number }) { return this.appManageService.updateVersion(+id, body); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('versions/:id')
  deleteVersion(@Param('id') id: string) { return this.appManageService.deleteVersion(+id); }

  @Public()
  @Get('version/check')
  checkUpdate(@Query('versionCode') versionCode?: string, @Query('channel') channel?: string) {
    return this.appManageService.getLatestVersion(channel);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('channels')
  getChannels() { return this.appManageService.getChannels(); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('channels')
  createChannel(@Body() dto: CreateChannelDto) { return this.appManageService.createChannel(dto); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('channels/:id')
  deleteChannel(@Param('id') id: string) { return this.appManageService.deleteChannel(+id); }
}
