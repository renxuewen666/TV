import { Module } from '@nestjs/common';
import { MarqueeController } from './marquee.controller';
import { MarqueeService } from './marquee.service';

@Module({
  controllers: [MarqueeController],
  providers: [MarqueeService],
  exports: [MarqueeService],
})
export class MarqueeModule {}
