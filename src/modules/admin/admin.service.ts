import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UserTariff } from '../../entities/user-tariff.entity';
import { Tariff } from '../../entities/tariff.entity';
import { Referral } from '../../entities/referral.entity';
import { Payment } from '../../entities/payment.entity';
import { Dialog } from '../../entities/dialog.entity';
import { Message } from '../../entities/message.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserTariff)
    private userTariffRepository: Repository<UserTariff>,
    @InjectRepository(Tariff)
    private tariffRepository: Repository<Tariff>,
    @InjectRepository(Referral)
    private referralRepository: Repository<Referral>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Dialog)
    private dialogRepository: Repository<Dialog>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async getDashboardStats() {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userTariffRepository.count({ where: { is_active: true } });
    const totalMessages = await this.messageRepository.count();
    const totalPayments = await this.paymentRepository.count();

    // Calculate revenue (simplified)
    const payments = await this.paymentRepository.find();
    const totalRevenue = payments.reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0);

    return {
      totalUsers,
      activeUsers,
      totalMessages,
      totalPayments,
      totalRevenue,
    };
  }

  async getUsers(page: number = 1, limit: number = 20) {
    const [users, total] = await this.userRepository.findAndCount({
      relations: ['userTariffs', 'userTariffs.tariff'],
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTariffs() {
    return this.tariffRepository.find({ order: { id: 'ASC' } });
  }

  async updateTariff(id: number, data: Partial<Tariff>) {
    await this.tariffRepository.update(id, data);
    return this.tariffRepository.findOne({ where: { id } });
  }

  async getUserDetails(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['userTariffs', 'userTariffs.tariff', 'dialogs', 'referralsGiven', 'referralsReceived'],
    });

    if (!user) return null;

    const messageCount = await this.messageRepository.count({ where: { user_id: userId } });

    return {
      ...user,
      messageCount,
    };
  }

  async getReferralStats() {
    const totalReferrals = await this.referralRepository.count();
    const processedReferrals = await this.referralRepository.count({ where: { bonus_given: true } });

    // Top referrers
    const topReferrers = await this.referralRepository
      .createQueryBuilder('r')
      .select('r.referrer_id', 'referrerId')
      .addSelect('COUNT(r.id)', 'count')
      .groupBy('r.referrer_id')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    // Get user details for top referrers
    const referrerDetails = await Promise.all(
      topReferrers.map(async (ref) => {
        const user = await this.userRepository.findOne({ where: { id: ref.referrerId } });
        return {
          user: user ? `${user.first_name} (@${user.username})` : 'Unknown',
          count: ref.count,
        };
      })
    );

    return {
      totalReferrals,
      processedReferrals,
      topReferrers: referrerDetails,
    };
  }
}