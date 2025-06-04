import { Controller, Post, Body } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('test')
  async testSend(@Body() body: { telegram_id: string; message: string }) {
    await this.telegramService.sendMessage(body.telegram_id, body.message);
    return { success: true };
  }
}
