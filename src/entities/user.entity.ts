import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Dialog } from './dialog.entity';
import { UserProfile } from './user-profile.entity';
import { Project } from './project.entity';
import { UserTariff } from './user-tariff.entity';
import { Referral } from './referral.entity';
import { Payment } from './payment.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint' })
  telegram_id: string;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  first_name: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true })
  referrer_id: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'referrer_id' })
  referrer: User;

  @OneToMany(() => Dialog, dialog => dialog.user)
  dialogs: Dialog[];

  @OneToMany(() => Project, project => project.user)
  projects: Project[];

  @OneToMany(() => UserTariff, userTariff => userTariff.user)
  userTariffs: UserTariff[];

  @OneToMany(() => Referral, referral => referral.referrer)
  referralsGiven: Referral[];

  @OneToMany(() => Referral, referral => referral.referee)
  referralsReceived: Referral[];

  @OneToMany(() => Payment, payment => payment.user)
  payments: Payment[];

  @OneToMany(() => UserProfile, profile => profile.user)
  profiles: UserProfile[];
}