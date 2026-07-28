import { Module } from '@nestjs/common';
import { EpayController } from './epay.controller';
import { EpayService } from './epay.service';

@Module({
  controllers: [EpayController],
  providers: [EpayService],
  exports: [EpayService],
})
export class EpayModule {}
