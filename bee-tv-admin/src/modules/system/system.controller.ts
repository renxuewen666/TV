import { Controller, Get, Put, Post, Body, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SystemService } from './system.service';
import { UpdateConfigDto, BatchUpdateDto, TestEmailDto, TestWeatherDto } from './dto/system.dto';

@ApiTags('系统设置')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('system')
export class SystemController {
  constructor(private systemService: SystemService) {}

  @Get()
  getAll() { return this.systemService.getAll(); }

  @Get('grouped')
  getGrouped() { return this.systemService.getGrouped(); }

  @Get('group/:group')
  getByGroup(@Param('group') group: string) { return this.systemService.getByGroup(group); }

  @Get('source-rename')
  getSourceRename() { return this.systemService.getSourceRename(); }

  @Put('source-rename')
  updateSourceRename(@Body() body: Record<string, string>) { return this.systemService.updateSourceRename(body); }

  @Post('config/batch')
  batchUpdate(@Body() dto: BatchUpdateDto) { return this.systemService.batchUpsert(dto.items); }

  @Post('config/init-defaults')
  initDefaults() { return this.systemService.initDefaults(); }

  @Post('test-email')
  testEmail(@Body() dto: TestEmailDto) { return this.systemService.testEmail(dto.to); }

  @Post('test-weather')
  testWeather(@Body() dto: TestWeatherDto) { return this.systemService.testWeather(dto.city); }

  @Get('data/export')
  async exportAll(@Res() res: Response) {
    const data = await this.systemService.exportAll();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="beetv-config-${Date.now()}.json"`);
    res.send(JSON.stringify(data, null, 2));
  }

  @Get(':key')
  getValue(@Param('key') key: string) { return { value: this.systemService.getValue(key) }; }

  @Put(':key')
  update(@Param('key') key: string, @Body() dto: UpdateConfigDto) {
    return this.systemService.upsert(key, dto.value, dto.remark, dto.group);
  }

  @Post('data/import')
  importAll(@Body() body: any) { return this.systemService.importAll(body); }
}
