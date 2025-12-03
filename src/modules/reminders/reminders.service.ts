import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Reminder } from '../../entities/reminder.entity';

@Injectable()
export class RemindersService implements OnModuleInit {
  private checkInterval: NodeJS.Timeout;

  constructor(
    @InjectRepository(Reminder)
    private reminderRepository: Repository<Reminder>,
  ) {}

  async onModuleInit() {
    // Check for reminders every minute
    this.checkInterval = setInterval(() => {
      this.checkAndSendReminders();
    }, 60000);
  }

  async onModuleDestroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  async createReminder(userId: number, message: string, remindAt: Date): Promise<Reminder> {
    const reminder = this.reminderRepository.create({
      user_id: userId,
      message,
      remind_at: remindAt,
    });
    return this.reminderRepository.save(reminder);
  }

  async getUserReminders(userId: number): Promise<Reminder[]> {
    return this.reminderRepository.find({
      where: { user_id: userId, sent: false },
      order: { remind_at: 'ASC' },
    });
  }

  async deleteReminder(userId: number, reminderId: number): Promise<boolean> {
    const result = await this.reminderRepository.delete({
      id: reminderId,
      user_id: userId,
    });
    return result.affected > 0;
  }

  private async checkAndSendReminders() {
    try {
      const now = new Date();
      const reminders = await this.reminderRepository.find({
        where: {
          remind_at: LessThan(now),
          sent: false,
        },
        relations: ['user'],
      });

      for (const reminder of reminders) {
        // Here we would send the reminder via Telegram
        // For now, just mark as sent
        console.log(`Reminder for user ${reminder.user_id}: ${reminder.message}`);

        reminder.sent = true;
        await this.reminderRepository.save(reminder);
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }

  async parseReminderTime(timeString: string): Promise<Date | null> {
    // Parse time strings like "через 5 минут", "завтра в 10:00", "в понедельник"
    const now = new Date();

    // Simple parsing for common cases
    if (timeString.includes('через')) {
      const minutes = timeString.match(/(\d+)\s*минут/);
      if (minutes) {
        return new Date(now.getTime() + parseInt(minutes[1]) * 60000);
      }

      const hours = timeString.match(/(\d+)\s*час/);
      if (hours) {
        return new Date(now.getTime() + parseInt(hours[1]) * 3600000);
      }
    }

    if (timeString.includes('завтра')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const timeMatch = timeString.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        tomorrow.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
        return tomorrow;
      }

      return tomorrow;
    }

    return null; // Could not parse
  }
}