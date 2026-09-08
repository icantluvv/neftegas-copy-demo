import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
} from 'typeorm';

import { Cfo } from '../../org/entities/cfo.entity';
import { User } from '../../users/entities/user.entity';
import { Plan } from './plan.entity';

export enum PlanCfoStatusValue {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  RETURNED = 'RETURNED',
}

/**
 * Независимый статус проверки каждого ЦФО в маршруте плана. Формируется
 * автоматически при направлении из связей Филиал <-> ЦФО.
 */
@Entity('plan_cfo_statuses')
@Unique(['planId', 'cfoId'])
export class PlanCfoStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Plan, (plan) => plan.cfoStatuses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'planId' })
  plan: Relation<Plan>;

  @Column()
  planId: number;

  @ManyToOne(() => Cfo, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cfoId' })
  cfo: Relation<Cfo>;

  @Column()
  cfoId: number;

  @Column({
    type: 'enum',
    enum: PlanCfoStatusValue,
    default: PlanCfoStatusValue.PENDING,
  })
  status: PlanCfoStatusValue;

  @Column({ default: true })
  isRequired: boolean;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'decidedById' })
  decidedBy: Relation<User> | null;

  @Column({ nullable: true })
  decidedById: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  decidedAt: Date | null;
}
