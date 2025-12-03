import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { RemindersService } from './reminders.service';

@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get(':userId')
  async getUserReminders(@Param('userId') userId: string) {
    return this.remindersService.getUserReminders(parseInt(userId));
  }

  @Post()
  async createReminder(@Body() body: { userId: number; message: string; timeString: string }) {
    const remindAt = await this.remindersService.parseReminderTime(body.timeString);
    if (!remindAt) {
      return { error: 'Не удалось распознать время напоминания' };
    }

    const reminder = await this.remindersService.createReminder(body.userId, body.message, remindAt);
    return reminder;
  }

  @Delete(':userId/:reminderId')
  async deleteReminder(
    @Param('userId') userId: string,
    @Param('reminderId') reminderId: string,
  ) {
    const success = await this.remindersService.deleteReminder(parseInt(userId), parseInt(reminderId));
    return { success };
  }
}