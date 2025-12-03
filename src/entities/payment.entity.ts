import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Tariff } from './tariff.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  tariff_id: number;

  @ManyToOne(() => Tariff)
  @JoinColumn({ name: 'tariff_id' })
  tariff: Tariff;

  @Column({ type: 'numeric' })
  amount: number;

  @Column({ type: 'text' })
  currency: string;

  @Column({ type: 'enum', enum: ['pending', 'completed', 'failed'] })
  status: 'pending' | 'completed' | 'failed';

  @Column({ type: 'text', nullable: true })
  provider: string;

  @Column({ type: 'text', nullable: true })
  provider_payment_id: string;

  @CreateDateColumn()
  created_at: Date;
}