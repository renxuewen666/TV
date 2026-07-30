import { Controller, Get, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminLogService } from './admin-log.service';

@ApiTags('管理员日志')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin-logs')
export class AdminLogController {
  constructor(private adminLogService: AdminLogService) {}

  @Get()
  list(@Query('page') page?: string, @Query('size') size?: string, @Query('module') module?: string, @Query('action') action?: string, @Query('admin') admin?: string) {
    return this.adminLogService.list(+(page || 1), +(size || 20), { module, action, admin });
  }

  @Delete()
  clear() {
    return this.adminLogService.clear();
  }
}
