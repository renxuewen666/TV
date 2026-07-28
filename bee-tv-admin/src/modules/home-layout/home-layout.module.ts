import { Module } from '@nestjs/common';
import { HomeLayoutController } from './home-layout.controller';
import { HomeLayoutService } from './home-layout.service';

@Module({ controllers: [HomeLayoutController], providers: [HomeLayoutService] })
export class HomeLayoutModule {}
