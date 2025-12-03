import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Dialog } from './dialog.entity';
import { User } from './user.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  dialog_id: number;

  @ManyToOne(() => Dialog)
  @JoinColumn({ name: 'dialog_id' })
  dialog: Dialog;

  @Column()
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: ['user', 'assistant', 'system'] })
  role: 'user' | 'assistant' | 'system';

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', default: 0 })
  tokens: number;

  @CreateDateColumn()
  created_at: Date;
}