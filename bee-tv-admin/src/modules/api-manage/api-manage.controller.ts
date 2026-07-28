import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { ApiManageService } from './api-manage.service';
import { CreateApiDto, UpdateApiDto } from './dto/api.dto';

@ApiTags('接口管理')
@Controller('api-manage')
export class ApiManageController {
  constructor(private apiManageService: ApiManageService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('type') type?: string) { return this.apiManageService.findAll(type ? +type : undefined); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateApiDto) { return this.apiManageService.create(dto); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateApiDto) { return this.apiManageService.update(+id, dto); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) { return this.apiManageService.remove(+id); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/test')
  testEndpoint(@Param('id') id: string) { return this.apiManageService.testEndpoint(+id); }

  @Public()
  @Get('app-config')
  getAppConfig() { return this.apiManageService.getAppConfig(); }
}
