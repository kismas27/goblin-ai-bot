import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tariff } from '../../entities/tariff.entity';
import { UserTariff } from '../../entities/user-tariff.entity';
import { Payment } from '../../entities/payment.entity';
import { TariffsService } from './tariffs.service';
import { TariffsController } from './tariffs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tariff, UserTariff, Payment])],
  providers: [TariffsService],
  controllers: [TariffsController],
  exports: [TariffsService],
})
export class TariffsModule {}