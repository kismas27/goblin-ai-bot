import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { UserTariff } from './user-tariff.entity';
import { Payment } from './payment.entity';

@Entity('tariffs')
export class Tariff {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'enum', enum: ['package', 'subscription'] })
  type: 'package' | 'subscription';

  @Column({ type: 'int' })
  messages_limit: number;

  @Column({ type: 'int', nullable: true })
  duration_days: number;

  @Column({ type: 'numeric' })
  price: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @OneToMany(() => UserTariff, userTariff => userTariff.tariff)
  userTariffs: UserTariff[];

  @OneToMany(() => Payment, payment => payment.tariff)
  payments: Payment[];
}