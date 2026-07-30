import { Module } from '@nestjs/common';
import { EpayController } from './epay.controller';
import { EpayService } from './epay.service';
import { MemberModule } from '../member/member.module';

@Module({
  controllers: [EpayController],
  imports: [MemberModule],
  providers: [EpayService],
  exports: [EpayService],
})
export class EpayModule {}
