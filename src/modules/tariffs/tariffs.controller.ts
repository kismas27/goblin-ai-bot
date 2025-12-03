import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TariffsService } from './tariffs.service';

@Controller('tariffs')
export class TariffsController {
  constructor(private readonly tariffsService: TariffsService) {}

  @Post('init')
  async initTariffs() {
    await this.tariffsService.createDefaultTariffs();
    return { message: 'Default tariffs created' };
  }

  @Get('user/:userId')
  async getUserTariff(@Param('userId') userId: string) {
    return this.tariffsService.getUserTariffInfo(parseInt(userId));
  }

  @Post('user/:userId/upgrade')
  async upgradeUser(@Param('userId') userId: string) {
    return this.tariffsService.upgradeToPremium(parseInt(userId));
  }
}