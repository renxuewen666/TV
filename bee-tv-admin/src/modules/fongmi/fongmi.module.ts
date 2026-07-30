import { Module } from '@nestjs/common';
import { AppConfigModule } from '../app-config/app-config.module';
import { SystemModule } from '../system/system.module';
import { FongMiController } from './fongmi.controller';
import { FongMiService } from './fongmi.service';

@Module({
  imports: [AppConfigModule, SystemModule],
  controllers: [FongMiController],
  providers: [FongMiService],
})
export class FongMiModule {}
