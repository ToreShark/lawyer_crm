import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🌐 CORS для продакшена
  app.enableCors({
    origin: [
      'https://bot.primelegal.kz', // Продакшн домен
      'http://localhost:8080', // Локальная разработка
      'http://127.0.0.1:8080',
      'http://86.107.45.211:8081', // Временный IP доступ
      'file://',
      'null',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  await app.listen(3000);
}
bootstrap();
