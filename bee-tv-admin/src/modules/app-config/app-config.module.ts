import { Module } from '@nestjs/common';
import { AppConfigController } from './app-config.controller';
import { AppConfigService } from './app-config.service';
import { SystemModule } from '../system/system.module';

@Module({
  imports: [SystemModule],
  controllers: [AppConfigController],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
