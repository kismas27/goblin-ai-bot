import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Tariff } from './tariff.entity';

@Entity('user_tariffs')
export class UserTariff {
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

  @Column({ type: 'int' })
  messages_left: number;

  @Column({ type: 'timestamp' })
  start_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_at: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;
}