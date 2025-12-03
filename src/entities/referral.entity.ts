import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  referrer_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'referrer_id' })
  referrer: User;

  @Column()
  referee_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'referee_id' })
  referee: User;

  @Column({ type: 'boolean', default: false })
  bonus_given: boolean;

  @CreateDateColumn()
  created_at: Date;
}