import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, Between } from 'typeorm';
import { Case, CaseStatus } from '../cases/entities/case.entity';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(Case)
    private readonly caseRepo: Repository<Case>,
    private readonly telegramService: TelegramService,
  ) {}

  // 🕒 Каждый день в 9:00 (рабочие дни) — проверка сроков
  @Cron('0 9 * * 1-5', {
    timeZone: 'Asia/Almaty', // Временная зона Астаны
  })
  async checkDeadlines() {
    this.logger.log(
      '⏰ Начинаем проверку сроков вынесения определения о возбуждении дела (10 рабочих дней)',
    );

    const today = new Date();
    const cases = await this.caseRepo.find({
      where: {
        check_deadline: LessThanOrEqual(today),
        status: CaseStatus.SUBMITTED,
      },
      relations: ['responsible'],
    });

    this.logger.log(
      `📋 Найдено дел с истекшим сроком вынесения определения: ${cases.length}`,
    );

    let sentCount = 0;
    for (const caseItem of cases) {
      // Проверяем, отправлялось ли уже уведомление
      if (!this.wasNotificationSent(caseItem, 'check_reminder')) {
        try {
          await this.telegramService.sendCheckReminder(caseItem);
          await this.markNotificationSent(caseItem, 'check_reminder');
          sentCount++;
          this.logger.log(
            `✅ Отправлено напоминание о вынесении определения для дела: ${caseItem.number}`,
          );
        } catch (error) {
          this.logger.error(
            `❌ Ошибка отправки напоминания для дела ${caseItem.number}:`,
            error.message,
          );
        }
      }
    }

    this.logger.log(
      `📨 Всего отправлено напоминаний о вынесении определения: ${sentCount}`,
    );
  }

  // 📆 Каждый день в 18:00 — вечерние напоминания за день до заседания
  @Cron('0 18 * * *', {
    timeZone: 'Asia/Almaty',
  })
  async checkHearingReminders() {
    this.logger.log('📅 Проверка заседаний на завтра (18:00)');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Начало и конец завтрашнего дня для точного поиска
    const tomorrowStart = new Date(tomorrow);
    tomorrowStart.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const cases = await this.caseRepo.find({
      where: {
        hearing_date: Between(tomorrowStart, tomorrowEnd),
        status: CaseStatus.ACCEPTED,
      },
      relations: ['responsible'],
    });

    this.logger.log(`📋 Найдено заседаний на завтра: ${cases.length}`);

    let sentCount = 0;
    for (const caseItem of cases) {
      if (!this.wasNotificationSent(caseItem, 'day_before')) {
        try {
          await this.telegramService.sendHearingReminder(
            caseItem,
            'day_before',
          );
          await this.markNotificationSent(caseItem, 'day_before');
          sentCount++;
          this.logger.log(
            `✅ Отправлено напоминание о заседании для дела: ${caseItem.number}`,
          );
        } catch (error) {
          this.logger.error(
            `❌ Ошибка отправки напоминания о заседании для дела ${caseItem.number}:`,
            error.message,
          );
        }
      }
    }

    this.logger.log(
      `📨 Всего отправлено напоминаний о заседаниях: ${sentCount}`,
    );
  }

  // ⏰ Каждый час — проверка напоминаний за час до заседания
  @Cron('0 * * * *', {
    timeZone: 'Asia/Almaty',
  })
  async checkHourlyReminders() {
    this.logger.log('⏰ Проверка заседаний через час');

    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    // Диапазон: от 1 часа до 1 часа 5 минут (чтобы не пропустить)
    const rangeStart = oneHourLater;
    const rangeEnd = new Date(oneHourLater.getTime() + 5 * 60 * 1000);

    const cases = await this.caseRepo.find({
      where: {
        hearing_date: Between(rangeStart, rangeEnd),
        status: CaseStatus.ACCEPTED,
      },
      relations: ['responsible'],
    });

    this.logger.log(`📋 Найдено заседаний через час: ${cases.length}`);

    let sentCount = 0;
    for (const caseItem of cases) {
      if (!this.wasNotificationSent(caseItem, 'hour_before')) {
        try {
          await this.telegramService.sendHearingReminder(
            caseItem,
            'hour_before',
          );
          await this.markNotificationSent(caseItem, 'hour_before');
          sentCount++;
          this.logger.log(
            `✅ Отправлено напоминание за час для дела: ${caseItem.number}`,
          );
        } catch (error) {
          this.logger.error(
            `❌ Ошибка отправки напоминания за час для дела ${caseItem.number}:`,
            error.message,
          );
        }
      }
    }

    this.logger.log(`📨 Всего отправлено напоминаний за час: ${sentCount}`);
  }

  // 📝 Каждый день в 10:00 — проверка сроков подачи частных жалоб
  @Cron('0 10 * * *', {
    timeZone: 'Asia/Almaty',
  })
  async checkAppealDeadlines() {
    this.logger.log('📝 Проверка сроков подачи частных жалоб');

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Ищем дела где срок подачи жалобы истекает завтра
    const cases = await this.caseRepo.find({
      where: {
        appeal_deadline: Between(today, tomorrow),
        status: CaseStatus.CLOSED, // Предполагаем, что жалобы подаются на закрытые дела
      },
      relations: ['responsible'],
    });

    this.logger.log(
      `📋 Найдено дел с истекающим сроком жалобы: ${cases.length}`,
    );

    let sentCount = 0;
    for (const caseItem of cases) {
      if (!this.wasNotificationSent(caseItem, 'appeal_reminder')) {
        try {
          await this.telegramService.sendAppealReminder(caseItem);
          await this.markNotificationSent(caseItem, 'appeal_reminder');
          sentCount++;
          this.logger.log(
            `✅ Отправлено напоминание о жалобе для дела: ${caseItem.number}`,
          );
        } catch (error) {
          this.logger.error(
            `❌ Ошибка отправки напоминания о жалобе для дела ${caseItem.number}:`,
            error.message,
          );
        }
      }
    }

    this.logger.log(`📨 Всего отправлено напоминаний о жалобах: ${sentCount}`);
  }

  // 🔍 Проверка, отправлялось ли уведомление
  private wasNotificationSent(
    caseItem: Case,
    notificationType: string,
  ): boolean {
    if (!caseItem.notifications_sent) return false;

    const notifications = caseItem.notifications_sent;
    return notifications[notificationType] === true;
  }

  // ✅ Отметить уведомление как отправленное
  private async markNotificationSent(
    caseItem: Case,
    notificationType: string,
  ): Promise<void> {
    const notifications = caseItem.notifications_sent || {};
    notifications[notificationType] = true;
    notifications[`${notificationType}_sent_at`] = new Date().toISOString();

    await this.caseRepo.update(caseItem.id, {
      notifications_sent: notifications,
    });
  }

  // 🧪 Метод для тестирования (вызывается вручную через контроллер)
  async testAllReminders(): Promise<string> {
    this.logger.log('🧪 Запуск тестирования всех напоминаний');

    try {
      await this.checkDeadlines();
      await this.checkHearingReminders();
      await this.checkHourlyReminders();
      await this.checkAppealDeadlines();

      return '✅ Все проверки выполнены успешно';
    } catch (error) {
      this.logger.error('❌ Ошибка при тестировании:', error.message);
      return `❌ Ошибка: ${error.message}`;
    }
  }
}
