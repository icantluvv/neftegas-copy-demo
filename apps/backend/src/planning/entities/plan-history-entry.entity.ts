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
import { Plan } from './plan.entity';

/** Полная история действий по плану. */
@Entity('plan_history_entries')
export class PlanHistoryEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Plan, (plan) => plan.history, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'planId' })
  plan: Relation<Plan>;

  @Column()
  planId: number;

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
