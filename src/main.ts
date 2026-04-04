import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import 'dotenv/config';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ["http://localhost:3000",
    'http://192.168.137.106:3000'],
    
    credentials: true,
  });

  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));
  
  const port = process.env.PORT ?? 5050;
  app.setGlobalPrefix('api');
  await app.listen(port);
  app.useGlobalPipes(new ValidationPipe());
  

  const logger = new Logger('Bootstrap');
  logger.log(`Server is running on http://localhost:${port}`);
}

bootstrap();
