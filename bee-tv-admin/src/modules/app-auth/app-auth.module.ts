import { Module } from '@nestjs/common';
import { AppAuthController } from './app-auth.controller';
import { AppAuthService } from './app-auth.service';
import { SystemModule } from '../system/system.module';

@Module({
  imports: [SystemModule],
  controllers: [AppAuthController],
  providers: [AppAuthService],
  exports: [AppAuthService],
})
export class AppAuthModule {}
