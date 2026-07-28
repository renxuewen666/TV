import { Controller, Get, Put, Post, Body, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SystemService } from './system.service';
import { UpdateConfigDto } from './dto/system.dto';

@ApiTags('系统设置')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('system')
export class SystemController {
  constructor(private systemService: SystemService) {}

  @Get()
  getAll() { return this.systemService.getAll(); }

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
  update(@Param('key') key: string, @Body() dto: UpdateConfigDto) { return this.systemService.upsert(key, dto.value, dto.remark); }

  @Post('data/import')
  importAll(@Body() body: any) { return this.systemService.importAll(body); }
}
