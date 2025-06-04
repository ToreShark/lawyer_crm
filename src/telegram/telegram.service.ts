import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as TelegramBot from 'node-telegram-bot-api';
import { Case } from 'src/cases/entities/case.entity';

@Injectable()
export class TelegramService {
  private bot: TelegramBot;

  constructor(private readonly configService: ConfigService) {
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
    const text = `🕵️‍♂️ <b>Напоминание о проверке дела</b>\n\n` +
      `📄 <b>Дело:</b> ${caseData.number} — ${caseData.title}\n` +
      `📅 <b>Срок проверки:</b> ${this.formatDate(caseData.check_deadline)}\n` +
      `👤 <b>Ответственный:</b> ${caseData.responsible.name}`;
    await this.sendMessage(caseData.responsible.telegram_id, text);
  }

  async sendHearingReminder(caseData: Case, type: 'day_before' | 'hour_before') {
    const prefix = type === 'day_before' ? '📌 Завтра заседание!' : '⏰ Через час заседание!';
    const text = `${prefix}\n\n` +
      `📄 <b>Дело:</b> ${caseData.number} — ${caseData.title}\n` +
      `🕒 <b>Дата заседания:</b> ${this.formatDate(caseData.hearing_date)}\n` +
      `👤 <b>Ответственный:</b> ${caseData.responsible.name}`;
    await this.sendMessage(caseData.responsible.telegram_id, text);
  }

  async sendReturnNotification(caseData: Case) {
    const text = `❗ <b>Дело возвращено!</b>\n\n` +
      `📄 <b>Дело:</b> ${caseData.number} — ${caseData.title}\n` +
      `📅 <b>Дата подачи:</b> ${this.formatDate(caseData.filing_date)}\n` +
      `⚠️ Обратите внимание на причины возврата.`;
    await this.sendMessage(caseData.responsible.telegram_id, text);
  }

  async sendAppealReminder(caseData: Case) {
    const text = `📝 <b>Напоминание о частной жалобе</b>\n\n` +
      `📄 <b>Дело:</b> ${caseData.number} — ${caseData.title}\n` +
      `📅 <b>Срок подачи жалобы:</b> ${this.formatDate(caseData.appeal_deadline)}\n` +
      `👤 <b>Ответственный:</b> ${caseData.responsible.name}`;
    await this.sendMessage(caseData.responsible.telegram_id, text);
  }

  private formatDate(date: Date): string {
    return date ? new Date(date).toLocaleDateString('ru-RU') : '—';
  }

}
