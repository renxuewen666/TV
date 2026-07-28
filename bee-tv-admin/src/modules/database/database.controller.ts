import { Controller, Get, Post, Delete, Param, Query, Res, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { DatabaseService } from './database.service';

@ApiTags('数据库管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('database')
export class DatabaseController {
  constructor(private dbService: DatabaseService) {}

  @Get('backups')
  list() { return this.dbService.listBackups(); }

  @Post('backup')
  backup() { return this.dbService.backup(); }

  @Public()
  @Get('backups/:filename/download')
  download(@Param('filename') filename: string, @Query('token') token: string, @Res() res: Response) {
    if (!token) throw new UnauthorizedException();
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'bee-tv-jwt-secret-change-in-production');
    } catch { throw new UnauthorizedException(); }
    return this.dbService.download(filename, res);
  }

  @Post('restore/:filename')
  restore(@Param('filename') filename: string) { return this.dbService.restore(filename); }

  @Delete('backups/:filename')
  delete(@Param('filename') filename: string) { return this.dbService.delete(filename); }
}
