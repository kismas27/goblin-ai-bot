import { Controller, Get, Param, Query, Render } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @Render('admin/dashboard')
  async dashboard() {
    const stats = await this.adminService.getDashboardStats();
    return { stats, title: 'Админ-панель - Goblin AI' };
  }

  @Get('users')
  @Render('admin/users')
  async users(@Query('page') page: string = '1') {
    const usersData = await this.adminService.getUsers(parseInt(page));
    return { ...usersData, title: 'Пользователи - Goblin AI' };
  }

  @Get('users/:id')
  @Render('admin/user-detail')
  async userDetail(@Param('id') id: string) {
    const user = await this.adminService.getUserDetails(parseInt(id));
    return { user, title: `Пользователь ${user?.first_name} - Goblin AI` };
  }

  @Get('tariffs')
  @Render('admin/tariffs')
  async tariffs() {
    const tariffs = await this.adminService.getTariffs();
    return { tariffs, title: 'Тарифы - Goblin AI' };
  }

  @Get('referrals')
  @Render('admin/referrals')
  async referrals() {
    const referralStats = await this.adminService.getReferralStats();
    return { ...referralStats, title: 'Рефералы - Goblin AI' };
  }

  @Get('settings')
  @Render('admin/settings')
  async settings() {
    return { title: 'Настройки - Goblin AI' };
  }
}