import { Controller, Get, Post, Put, Delete, Param, Query, Body, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
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
      jwt.verify(token, process.env.JWT_SECRET || 'bee-tv-jwt');
    } catch { throw new UnauthorizedException(); }
    return this.dbService.download(filename, res);
  }

  @Post('restore/:filename')
  restore(@Param('filename') filename: string) { return this.dbService.restore(filename); }

  @Delete('backups/:filename')
  delete(@Param('filename') filename: string) { return this.dbService.delete(filename); }

  @Get('tables')
  tables() { return this.dbService.tables(); }

  @Get('tables/:table/columns')
  columns(@Param('table') table: string) { return this.dbService.columns(table); }

  @Get('tables/:table/rows')
  rows(@Param('table') table: string, @Query('page') page?: string, @Query('size') size?: string, @Query('keyword') keyword?: string) {
    return this.dbService.rows(table, +(page || 1), +(size || 20), keyword || '');
  }

  @Post('query')
  query(@Body() body: { sql: string }) { return this.dbService.query(body.sql || ''); }

  @Put('tables/:table/rows/:id')
  updateRow(@Param('table') table: string, @Param('id') id: string, @Body() body: Record<string, any>) {
    return this.dbService.updateRow(table, +id, body || {});
  }

  @Delete('tables/:table/rows/:id')
  deleteRow(@Param('table') table: string, @Param('id') id: string) {
    return this.dbService.deleteRow(table, +id);
  }

  @Delete('tables/:table/rows')
  clearTable(@Param('table') table: string) {
    return this.dbService.clearTable(table);
  }
}
