import { Module } from '@nestjs/common';
import { CompileController } from './compile.controller';
import { CompileService } from './compile.service';

@Module({
  controllers: [CompileController],
  providers: [CompileService],
})
export class CompileModule {}
