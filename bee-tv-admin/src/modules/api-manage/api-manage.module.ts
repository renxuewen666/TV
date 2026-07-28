import { Module } from '@nestjs/common';
import { ApiManageController } from './api-manage.controller';
import { ApiManageService } from './api-manage.service';

@Module({ controllers: [ApiManageController], providers: [ApiManageService] })
export class ApiManageModule {}
