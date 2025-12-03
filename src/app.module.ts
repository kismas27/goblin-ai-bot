import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { Dialog } from './entities/dialog.entity';
import { Message } from './entities/message.entity';
import { Project } from './entities/project.entity';
import { Tariff } from './entities/tariff.entity';
import { UserTariff } from './entities/user-tariff.entity';
import { Referral } from './entities/referral.entity';
import { Promocode } from './entities/promocode.entity';
import { Payment } from './entities/payment.entity';
import { Reminder } from './entities/reminder.entity';
import { UsersModule } from './modules/users/users.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { OpenaiModule } from './modules/openai/openai.module';
import { DialogsModule } from './modules/dialogs/dialogs.module';
import { TariffsModule } from './modules/tariffs/tariffs.module';
import { ReferralsModule } from './modules/referrals/referrals.module';
import { AdminModule } from './modules/admin/admin.module';
import { RemindersModule } from './modules/reminders/reminders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, UserProfile, Dialog, Message, Project, Tariff, UserTariff, Referral, Promocode, Payment, Reminder],
      synchronize: true, // for dev
    }),
    UsersModule,
    TelegramModule,
    OpenaiModule,
    DialogsModule,
    TariffsModule,
    ReferralsModule,
    AdminModule,
    RemindersModule,
  ],
})
export class AppModule {}