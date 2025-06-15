import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as TelegramBot from 'node-telegram-bot-api';
import { Case } from 'src/cases/entities/case.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { TimezoneUtils } from '../utils/timezone.utils';

@Injectable()
export class TelegramService {
  private bot: TelegramBot;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User) // ← ДОБАВЬ ЭТУ СТРОКУ
    private readonly userRepo: Repository<User>,
  ) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN not set');
    }

    this.bot = new TelegramBot(token, { polling: false });
  }

  async sendMessage(telegramId: string, text: string): Promise<void> {
    try {
      console.log(`📨 Отправляем в Telegram ID ${telegramId}:\n${text}`);
      await this.bot.sendMessage(telegramId, text, {
        parse_mode: 'HTML',
      });
    } catch (error) {
      console.error('❌ Ошибка при отправке сообщения:', error.message);
    }
  }

  async sendCheckReminder(caseData: Case) {
    const text =
      `⚖️ <b>Поступление заявления в суд → вынесение определения о возбуждении дела</b>\n\n` +
      `📄 <b>Дело:</b> ${caseData.number} — ${caseData.title}\n` +
      `📅 <b>Срок вынесения определения:</b> ${this.formatDate(caseData.check_deadline)}\n` +
      `⏰ <b>Не позднее 10 рабочих дней со дня поступления заявления</b>\n` +
      `👤 <b>Ответственный:</b> ${caseData.responsible.name}`;
    await this.sendMessage(caseData.responsible.telegram_id, text);
  }

  async sendReturnNotification(caseData: Case) {
    const text =
      `❗ <b>Дело возвращено!</b>\n\n` +
      `📄 <b>Дело:</b> ${caseData.number} — ${caseData.title}\n` +
      `📅 <b>Дата подачи:</b> ${this.formatDate(caseData.filing_date)}\n` +
      `⚠️ Обратите внимание на причины возврата.`;
    await this.sendMessage(caseData.responsible.telegram_id, text);
  }

  async sendAppealReminder(caseData: Case) {
    const text =
      `📝 <b>Напоминание о частной жалобе</b>\n\n` +
      `📄 <b>Дело:</b> ${caseData.number} — ${caseData.title}\n` +
      `📅 <b>Срок подачи жалобы:</b> ${this.formatDate(caseData.appeal_deadline)}\n` +
      `👤 <b>Ответственный:</b> ${caseData.responsible.name}`;
    await this.sendMessage(caseData.responsible.telegram_id, text);
  }

  async sendCaseEndReminder(caseData: Case, daysLeft: number) {
    const text =
      `⏰ <b>Напоминание об окончании дела</b>\n\n` +
      `📄 <b>Дело:</b> ${caseData.number} — ${caseData.title}\n` +
      `📅 <b>Дата принятия:</b> ${this.formatDate(caseData.accepted_date)}\n` +
      `🔚 <b>Дата окончания:</b> ${this.formatDate(caseData.case_end_date)}\n` +
      `⚠️ <b>Осталось дней до окончания:</b> ${daysLeft}\n` +
      `👤 <b>Ответственный:</b> ${caseData.responsible.name}\n\n` +
      `📋 <b>23 рабочих дня с момента принятия дела</b>`;
    await this.sendMessage(caseData.responsible.telegram_id, text);
  }

  private formatDate(date: Date): string {
    return TimezoneUtils.formatDateForAlmaty(date);
  }

  async sendHearingReminder(
    caseData: Case,
    type: 'day_before' | 'hour_before',
  ) {
    const prefix =
      type === 'day_before'
        ? '📌 Завтра заседание!'
        : '⏰ Через час заседание!';
    const timeText = type === 'day_before' ? 'завтра' : 'через час';

    const text =
      `${prefix}\n\n` +
      `📄 <b>Дело:</b> ${caseData.number} — ${caseData.title}\n` +
      `🕒 <b>Дата заседания:</b> ${this.formatDateTime(caseData.hearing_date)}\n` +
      `👤 <b>Ответственный:</b> ${caseData.responsible.name}\n\n` +
      `⚠️ Подготовьтесь к заседанию ${timeText}!`;

    await this.sendMessage(caseData.responsible.telegram_id, text);
  }

  // Добавь этот новый метод для форматирования даты и времени
  private formatDateTime(date: Date): string {
    return TimezoneUtils.formatDateTimeForAlmaty(date);
  }

  // 🔔 Отправка уведомления всей команде при изменении статуса
  async sendStatusChangeToTeam(
    caseData: Case,
    oldStatus: string,
    newStatus: string,
    changedBy: string,
  ) {
    try {
      // Получаем всех активных пользователей команды
      const activeUsers = await this.userRepo.find({
        where: { is_active: true },
      });

      const statusText = this.getStatusText(newStatus);
      const oldStatusText = this.getStatusText(oldStatus);

      const message =
        `🔄 <b>Изменен статус дела</b>\n\n` +
        `📄 <b>Дело:</b> ${caseData.number} — ${caseData.title}\n` +
        `📊 <b>Статус:</b> ${oldStatusText} → ${statusText}\n` +
        `👤 <b>Изменил:</b> ${changedBy}\n` +
        `⏰ <b>Время:</b> ${TimezoneUtils.getCurrentDateTimeForAlmaty()}`;

      // Отправляем уведомление всем активным пользователям
      for (const user of activeUsers) {
        await this.sendMessage(user.telegram_id, message);
      }

      console.log(
        `✅ Уведомление о смене статуса отправлено ${activeUsers.length} пользователям`,
      );
    } catch (error) {
      console.error('❌ Ошибка отправки уведомлений команде:', error.message);
    }
  }

  // 🎨 Вспомогательный метод для получения текста статуса
  private getStatusText(status: string): string {
    const statusMap = {
      submitted: 'Подан',
      pending_check: 'Проверка',
      accepted: 'Принят',
      returned: 'Возвращен',
      closed: 'Закрыт',
      decision_made: 'Принято решение',
      appeal: 'Апелляция',
    };
    return statusMap[status] || status;
  }
}
