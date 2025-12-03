import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_profile')
export class UserProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text', nullable: true })
  about: string;

  @Column({ type: 'text', nullable: true })
  goals: string;

  @Column({ type: 'text', nullable: true })
  preferences: string;

  @CreateDateColumn()
  updated_at: Date;
}