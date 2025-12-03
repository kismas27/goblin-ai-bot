import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { DialogsModule } from '../dialogs/dialogs.module';
import { OpenaiModule } from '../openai/openai.module';
import { TariffsModule } from '../tariffs/tariffs.module';
import { ReferralsModule } from '../referrals/referrals.module';
// import { RemindersModule } from '../reminders/reminders.module';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';

@Module({
  imports: [UsersModule, DialogsModule, OpenaiModule, TariffsModule, ReferralsModule], // RemindersModule
  providers: [TelegramService],
  controllers: [TelegramController],
  exports: [TelegramService],
})
export class TelegramModule {}