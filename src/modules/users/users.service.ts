import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
  ) {}

  async findOrCreate(telegramId: string, username?: string, firstName?: string): Promise<User> {
    let user = await this.userRepository.findOne({ where: { telegram_id: telegramId } });
    if (!user) {
      user = this.userRepository.create({
        telegram_id: telegramId,
        username,
        first_name: firstName,
      });
      await this.userRepository.save(user);
    }
    return user;
  }

  async getProfile(userId: number): Promise<UserProfile | null> {
    return this.userProfileRepository.findOne({ where: { user_id: userId } });
  }

  async updateProfile(userId: number, data: Partial<UserProfile>): Promise<UserProfile> {
    let profile = await this.getProfile(userId);
    if (!profile) {
      profile = this.userProfileRepository.create({ user_id: userId, ...data });
    } else {
      Object.assign(profile, data);
    }
    return this.userProfileRepository.save(profile);
  }
}