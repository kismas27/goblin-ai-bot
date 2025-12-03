import { Controller, Post, Body } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(private telegramService: TelegramService) {}

  @Post('webhook')
  async handleWebhook(@Body() update: any) {
    await this.telegramService.getBot().handleUpdate(update);
    return { ok: true };
  }
}