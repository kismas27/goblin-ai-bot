import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('reminders')
export class Reminder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'timestamp' })
  remind_at: Date;

  @Column({ type: 'boolean', default: false })
  sent: boolean;

  @CreateDateColumn()
  created_at: Date;
}