import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tariff } from '../../entities/tariff.entity';
import { UserTariff } from '../../entities/user-tariff.entity';
import { Payment } from '../../entities/payment.entity';

@Injectable()
export class TariffsService {
  constructor(
    @InjectRepository(Tariff)
    private tariffRepository: Repository<Tariff>,
    @InjectRepository(UserTariff)
    private userTariffRepository: Repository<UserTariff>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async createDefaultTariffs() {
    const freeTariff = await this.tariffRepository.findOne({ where: { name: 'Free' } });
    if (!freeTariff) {
      await this.tariffRepository.save({
        name: 'Free',
        type: 'package',
        messages_limit: 10,
        price: 0,
        is_active: true,
      });
    }

    const premiumTariff = await this.tariffRepository.findOne({ where: { name: 'Premium' } });
    if (!premiumTariff) {
      await this.tariffRepository.save({
        name: 'Premium',
        type: 'subscription',
        messages_limit: 1000,
        duration_days: 30,
        price: 9.99,
        is_active: true,
      });
    }
  }

  async getUserTariff(userId: number): Promise<UserTariff | null> {
    return this.userTariffRepository.findOne({
      where: { user_id: userId, is_active: true },
      relations: ['tariff'],
    });
  }

  async assignFreeTariff(userId: number): Promise<UserTariff> {
    const freeTariff = await this.tariffRepository.findOne({ where: { name: 'Free' } });
    if (!freeTariff) {
      throw new Error('Free tariff not found');
    }

    const userTariff = this.userTariffRepository.create({
      user_id: userId,
      tariff_id: freeTariff.id,
      messages_left: freeTariff.messages_limit,
      start_at: new Date(),
    });

    return this.userTariffRepository.save(userTariff);
  }

  async canUserSendMessage(userId: number): Promise<boolean> {
    const userTariff = await this.getUserTariff(userId);
    if (!userTariff) {
      // Assign free tariff if none exists
      await this.assignFreeTariff(userId);
      return true;
    }

    // Check if subscription is expired
    if (userTariff.end_at && new Date() > userTariff.end_at) {
      userTariff.is_active = false;
      await this.userTariffRepository.save(userTariff);
      // Assign free tariff
      await this.assignFreeTariff(userId);
      return true;
    }

    return userTariff.messages_left > 0;
  }

  async deductMessage(userId: number): Promise<void> {
    const userTariff = await this.getUserTariff(userId);
    if (userTariff && userTariff.messages_left > 0) {
      userTariff.messages_left -= 1;
      await this.userTariffRepository.save(userTariff);
    }
  }

  async getUserTariffInfo(userId: number) {
    const userTariff = await this.getUserTariff(userId);
    if (!userTariff) {
      return {
        tariff: 'Free',
        messages_left: 10,
        end_date: null,
      };
    }

    return {
      tariff: userTariff.tariff.name,
      messages_left: userTariff.messages_left,
      end_date: userTariff.end_at,
    };
  }

  async upgradeToPremium(userId: number): Promise<UserTariff> {
    const premiumTariff = await this.tariffRepository.findOne({ where: { name: 'Premium' } });
    if (!premiumTariff) {
      throw new Error('Premium tariff not found');
    }

    // Deactivate current tariff
    await this.userTariffRepository.update(
      { user_id: userId, is_active: true },
      { is_active: false }
    );

    // Create new premium tariff
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + premiumTariff.duration_days);

    const userTariff = this.userTariffRepository.create({
      user_id: userId,
      tariff_id: premiumTariff.id,
      messages_left: premiumTariff.messages_limit,
      start_at: new Date(),
      end_at: endDate,
    });

    return this.userTariffRepository.save(userTariff);
  }
}