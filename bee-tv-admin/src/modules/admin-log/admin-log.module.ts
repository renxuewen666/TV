import { Global, Module } from '@nestjs/common';
import { AdminLogController } from './admin-log.controller';
import { AdminLogService } from './admin-log.service';

@Global()
@Module({
  controllers: [AdminLogController],
  providers: [AdminLogService],
  exports: [AdminLogService],
})
export class AdminLogModule {}
