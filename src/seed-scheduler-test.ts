import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { UserRole } from './users/enum/user.role';
import { User } from './users/entities/user.entity';
import { Case, CaseStatus } from './cases/entities/case.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const userRepo = dataSource.getRepository(User);
  const caseRepo = dataSource.getRepository(Case);

  // 🔹 Создаём тебя как lawyer (если не существует)
  let lawyer = await userRepo.findOneBy({ telegram_id: '376068212' });
  if (!lawyer) {
    lawyer = userRepo.create({
      telegram_id: '376068212',
      name: 'Tor Mot', // или своё имя
      username: 'tor_mot',
      role: UserRole.LAWYER,
    });
    await userRepo.save(lawyer);
    console.log('✅ Пользователь-юрист создан');
  }

  // 🔹 Создаём помощницу Азизу как assistant (если не существует)
  const assistantTelegramId = '827743984';
  let assistant = await userRepo.findOneBy({
    telegram_id: assistantTelegramId,
  });
  if (!assistant) {
    assistant = userRepo.create({
      telegram_id: assistantTelegramId,
      name: 'Aziza',
      username: 'aziza_assistant',
      role: UserRole.ASSISTANT,
    });
    await userRepo.save(assistant);
    console.log('✅ Помощница Aziza создана');
  }

  // 🔸 Создаем тестовые дела с ответственным lawyer
  const now = new Date();

  const overdueCase = caseRepo.create({
    number: 'TEST-001',
    title: 'Тестовое дело с истекшим сроком',
    description: 'Для тестирования напоминаний',
    status: CaseStatus.SUBMITTED,
    filing_date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    check_deadline: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    responsible: lawyer,
    notifications_sent: {},
  });

  const tomorrowHearing = new Date(now);
  tomorrowHearing.setDate(tomorrowHearing.getDate() + 1);
  tomorrowHearing.setHours(14, 30, 0, 0);

  const hearingCase = caseRepo.create({
    number: 'TEST-002',
    title: 'Дело с заседанием завтра',
    description: 'Для тестирования напоминаний о заседании',
    status: CaseStatus.ACCEPTED,
    filing_date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
    hearing_date: tomorrowHearing,
    responsible: lawyer,
    notifications_sent: {},
  });

  const hourLaterHearing = new Date(now.getTime() + 60 * 60 * 1000);

  const hourlyCase = caseRepo.create({
    number: 'TEST-003',
    title: 'Дело с заседанием через час',
    description: 'Для тестирования часовых напоминаний',
    status: CaseStatus.ACCEPTED,
    filing_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    hearing_date: hourLaterHearing,
    responsible: lawyer,
    notifications_sent: {},
  });

  await caseRepo.save([overdueCase, hearingCase, hourlyCase]);

  console.log('✅ Тестовые дела для планировщика созданы:');
  console.log('📋 TEST-001: Истекший срок проверки');
  console.log('📋 TEST-002: Заседание завтра в 14:30');
  console.log('📋 TEST-003: Заседание через час');

  await app.close();
}

bootstrap();
