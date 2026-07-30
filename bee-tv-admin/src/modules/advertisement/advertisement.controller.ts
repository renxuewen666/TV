import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { AdvertisementService } from './advertisement.service';
import { CreateAdvertisementDto, UpdateAdvertisementDto } from './dto/advertisement.dto';

@ApiTags('广告管理')
@Controller('advertisement')
export class AdvertisementController {
  constructor(private advertisementService: AdvertisementService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  list(
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('position') position?: string,
    @Query('status') status?: string,
  ) {
    return this.advertisementService.list(
      +(page || 1),
      +(size || 20),
      position,
      status !== undefined ? +status : undefined,
    );
  }

  @Public()
  @Get('active')
  active(@Query('appId') appId?: string) {
    return this.advertisementService.active(appId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateAdvertisementDto) {
    return this.advertisementService.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('batch/delete')
  batchDelete(@Body() body: { ids: number[] }) {
    return this.advertisementService.batchDelete(body.ids);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id/sort')
  updateSort(@Param('id') id: string, @Body() body: { sort: number }) {
    return this.advertisementService.updateSort(+id, body.sort);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAdvertisementDto) {
    return this.advertisementService.update(+id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.advertisementService.remove(+id);
  }
}
