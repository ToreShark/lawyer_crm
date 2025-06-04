import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
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

  // 🕒 Ежедневно в 8:00 — напоминание о проверке
  @Cron('0 8 * * *') // каждый день в 8:00
  async sendCheckReminders() {
    this.logger.log('⏰ Проверка сроков подачи');

    const today = new Date();
    const cases = await this.caseRepo.find({
      where: {
        check_deadline: LessThanOrEqual(today),
        status: CaseStatus.SUBMITTED,
      },
      relations: ['responsible'],
    });

    for (const c of cases) {
      await this.telegramService.sendCheckReminder(c);
    }
  }

  // 📆 Ежедневно в 9:00 — напоминание за день до заседания
  @Cron('0 9 * * *')
  async sendHearingRemindersDayBefore() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const cases = await this.caseRepo.find({
      where: {
        hearing_date: MoreThanOrEqual(tomorrow),
        status: CaseStatus.ACCEPTED,
      },
      relations: ['responsible'],
    });

    for (const c of cases) {
      if (new Date(c.hearing_date).toDateString() === tomorrow.toDateString()) {
        await this.telegramService.sendHearingReminder(c, 'day_before');
      }
    }
  }

  // 📌 Каждый час — можно добавить проверку на "через 1 час заседание"
  // и другие типы уведомлений при необходимости
}
