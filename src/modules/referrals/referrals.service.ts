import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral } from '../../entities/referral.entity';
import { User } from '../../entities/user.entity';
import { TariffsService } from '../tariffs/tariffs.service';

@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(Referral)
    private referralRepository: Repository<Referral>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private tariffsService: TariffsService,
  ) {}

  async processReferral(referrerId: number, refereeId: number): Promise<void> {
    // Check if referral already exists
    const existingReferral = await this.referralRepository.findOne({
      where: { referrer_id: referrerId, referee_id: refereeId }
    });

    if (existingReferral) {
      return; // Already processed
    }

    // Create referral record
    const referral = this.referralRepository.create({
      referrer_id: referrerId,
      referee_id: refereeId,
      bonus_given: false,
    });

    await this.referralRepository.save(referral);
  }

  async giveReferralBonus(referrerId: number): Promise<void> {
    // Find unprocessed referrals for this referrer
    const unprocessedReferrals = await this.referralRepository.find({
      where: { referrer_id: referrerId, bonus_given: false }
    });

    if (unprocessedReferrals.length > 0) {
      // Give bonus messages (5 messages per referral as per TЗ)
      const referrerTariff = await this.tariffsService.getUserTariff(referrerId);
      if (referrerTariff) {
        referrerTariff.messages_left += unprocessedReferrals.length * 5; // 5 messages per referral
        await this.tariffsService['userTariffRepository'].save(referrerTariff);
      }

      // Mark referrals as processed
      for (const referral of unprocessedReferrals) {
        referral.bonus_given = true;
        await this.referralRepository.save(referral);
      }
    }
  }

  async getReferralStats(userId: number): Promise<{
    totalReferrals: number;
    processedReferrals: number;
    referralLink: string;
  }> {
    const referrals = await this.referralRepository.find({
      where: { referrer_id: userId }
    });

    const processedReferrals = referrals.filter(r => r.bonus_given).length;

    return {
      totalReferrals: referrals.length,
      processedReferrals,
      referralLink: `https://t.me/pokupochkastars_bot?start=ref_${userId}`
    };
  }

  async getReferrerFromStartParam(startParam: string): Promise<number | null> {
    if (startParam.startsWith('ref_')) {
      const referrerId = parseInt(startParam.substring(4));
      if (!isNaN(referrerId)) {
        // Verify referrer exists
        const referrer = await this.userRepository.findOne({ where: { id: referrerId } });
        return referrer ? referrerId : null;
      }
    }
    return null;
  }
}