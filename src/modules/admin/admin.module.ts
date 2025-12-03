import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { UserTariff } from '../../entities/user-tariff.entity';
import { Tariff } from '../../entities/tariff.entity';
import { Referral } from '../../entities/referral.entity';
import { Payment } from '../../entities/payment.entity';
import { Dialog } from '../../entities/dialog.entity';
import { Message } from '../../entities/message.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserTariff, Tariff, Referral, Payment, Dialog, Message])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}