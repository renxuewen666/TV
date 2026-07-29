import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { join } from 'path';
import { existsSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const config = new DocumentBuilder()
    .setTitle('蜜蜂影视管理后台 API')
    .setDescription('Bee TV Admin API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const expressApp = app.getHttpAdapter().getInstance();
  const express = require('express');

  const mobileDist = join(__dirname, '..', '..', '..', 'bee-tv-mobile', 'dist');
  if (existsSync(mobileDist)) {
    expressApp.use('/m', express.static(mobileDist));
    expressApp.get('/m/*', (req, res) => {
      res.sendFile(join(mobileDist, 'index.html'));
    });
  }

  const apkDir = join(__dirname, '..', 'public', 'apk');
  if (existsSync(apkDir)) {
    expressApp.use('/public/apk', express.static(apkDir));
  }

  const webDist = join(__dirname, '..', '..', 'web', 'dist');
  if (existsSync(webDist)) {
    expressApp.use(express.static(webDist));
    expressApp.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/m')) return next();
      res.sendFile(join(webDist, 'index.html'));
    });
  }

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
