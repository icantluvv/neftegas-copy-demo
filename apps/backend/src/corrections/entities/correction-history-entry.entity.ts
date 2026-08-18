import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { Correction } from './correction.entity';

/** Полная история действий по корректировке. */
@Entity('correction_history_entries')
export class CorrectionHistoryEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Correction, (correction) => correction.history, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'correctionId' })
  correction: Relation<Correction>;

  @Column()
  correctionId: number;

  @CreateDateColumn()
  timestamp: Date;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: Relation<User> | null;

  @Column({ nullable: true })
  userId: number | null;

  @Column({ length: 500 })
  text: string;
}
