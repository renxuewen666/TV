import { Module } from '@nestjs/common';
import { AppManageController } from './app-manage.controller';
import { AppManageService } from './app-manage.service';

@Module({ controllers: [AppManageController], providers: [AppManageService] })
export class AppManageModule {}
