import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompileService } from './compile.service';

@ApiTags('APP编译')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('compile')
export class CompileController {
  constructor(private compileService: CompileService) {}

  @Get()
  getTasks(@Query('page') page?: string, @Query('size') size?: string) {
    return this.compileService.getTasks(+(page || 1), +(size || 20));
  }

  @Post()
  create(@Body() body: any) { return this.compileService.createTask(body); }

  @Post(':id/trigger')
  trigger(@Param('id') id: string) { return this.compileService.triggerBuild(+id); }

  @Get(':id/status')
  checkStatus(@Param('id') id: string) { return this.compileService.checkStatus(+id); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.compileService.deleteTask(+id); }
}
