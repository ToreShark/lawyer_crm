// src/seed.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { User } from './users/entities/user.entity';
import { Case, CaseStatus } from './cases/entities/case.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const userRepo = dataSource.getRepository(User);
  const caseRepo = dataSource.getRepository(Case);

  // Находим первого пользователя (или создаём своего)
  const user = await userRepo.findOneBy({ telegram_id: '376068212' });

  if (!user) {
    console.error('Пользователь не найден! Запусти users сид или создай вручную.');
    await app.close();
    return;
  }

  const existing = await caseRepo.findOneBy({ number: 'A1 Иванов' });
  if (existing) {
    console.log('Такое дело уже существует.');
    await app.close();
    return;
  }

  const filingDate = new Date('2025-06-01');

  const newCase = caseRepo.create({
    number: 'A1 Иванов',
    title: 'Иванов против ООО «Ромашка»',
    description: 'Тестовое дело по гражданскому спору.',
    status: CaseStatus.SUBMITTED,
    filing_date: filingDate,
    responsible: user,
    notifications_sent: { created: true }, // Можно пустой объект
  });

  await caseRepo.save(newCase);

  console.log('✅ Дело успешно создано:');
  console.log(newCase);

  await app.close();
}
bootstrap();
