import { Controller, Post } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';

@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post('test/check-reminders')
  async testCheckReminder() {
    await this.schedulerService.sendCheckReminders();
    return { message: '✅ Проверка напоминаний выполнена вручную' };
  }

  @Post('test/hearing-reminders')
  async testHearingReminder() {
    await this.schedulerService.sendHearingRemindersDayBefore();
    return { message: '✅ Заседания на завтра проверены вручную' };
  }
}
