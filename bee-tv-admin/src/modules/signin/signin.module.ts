import { Module } from '@nestjs/common';
import { SigninController } from './signin.controller';
import { SigninService } from './signin.service';

@Module({
  controllers: [SigninController],
  providers: [SigninService],
  exports: [SigninService],
})
export class SigninModule {}
