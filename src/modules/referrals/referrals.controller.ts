import { Controller, Get, Param } from '@nestjs/common';
import { ReferralsService } from './referrals.service';

@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('stats/:userId')
  async getReferralStats(@Param('userId') userId: string) {
    return this.referralsService.getReferralStats(parseInt(userId));
  }
}