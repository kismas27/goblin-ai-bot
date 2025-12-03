import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('promocodes')
export class Promocode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  code: string;

  @Column({ type: 'enum', enum: ['bonus', 'discount', 'free'] })
  type: 'bonus' | 'discount' | 'free';

  @Column({ type: 'int' })
  value: number;

  @Column({ type: 'int' })
  max_uses: number;

  @Column({ type: 'int', default: 0 })
  used_count: number;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;
}