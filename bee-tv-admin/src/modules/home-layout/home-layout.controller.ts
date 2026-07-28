import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { HomeLayoutService } from './home-layout.service';
import { CreateLayoutDto, UpdateLayoutDto } from './dto/layout.dto';

@ApiTags('首页配置')
@Controller('home-layout')
export class HomeLayoutController {
  constructor(private homeLayoutService: HomeLayoutService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('type') type?: string) { return this.homeLayoutService.findAll(type); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateLayoutDto) { return this.homeLayoutService.create(dto); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLayoutDto) { return this.homeLayoutService.update(+id, dto); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) { return this.homeLayoutService.remove(+id); }

  @Public()
  @Get('active')
  getActiveAll() { return this.homeLayoutService.getActiveAll(); }
}
