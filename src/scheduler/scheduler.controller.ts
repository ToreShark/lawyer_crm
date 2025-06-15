import { Controller, Post } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';

@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post('test/check-reminders')
  async testCheckReminder() {
    await this.schedulerService.checkDeadlines();
    return {
      message:
        '✅ Проверка напоминаний о вынесении определения о возбуждении дела выполнена',
    };
  }

  @Post('test/hearing-reminders')
  async testHearingReminder() {
    await this.schedulerService.checkHearingReminders();
    return { message: '✅ Проверка напоминаний о заседаниях выполнена' };
  }

  @Post('test/hourly-reminders')
  async testHourlyReminder() {
    await this.schedulerService.checkHourlyReminders();
    return { message: '✅ Проверка часовых напоминаний выполнена' };
  }

  @Post('test/appeal-reminders')
  async testAppealReminder() {
    await this.schedulerService.checkAppealDeadlines();
    return { message: '✅ Проверка напоминаний о жалобах выполнена' };
  }

  @Post('test/case-end-reminders')
  async testCaseEndReminder() {
    await this.schedulerService.checkCaseEndReminders();
    return { message: '✅ Проверка напоминаний об окончании дел выполнена' };
  }

  @Post('test/all')
  async testAllReminders() {
    const result = await this.schedulerService.testAllReminders();
    return { message: result };
  }
}
