import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { Cfo } from '../../org/entities/cfo.entity';
import { User } from '../../users/entities/user.entity';
import { Correction } from './correction.entity';

export enum CfoStatusValue {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  RETURNED = 'RETURNED',
}

/**
 * Независимый статус проверки каждого ЦФО в маршруте корректировки.
 * Формируется автоматически при направлении из связей Филиал <-> ЦФО.
 */
@Entity('correction_cfo_statuses')
@Unique(['correctionId', 'cfoId'])
export class CorrectionCfoStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Correction, (correction) => correction.cfoStatuses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'correctionId' })
  correction: Correction;

  @Column()
  correctionId: number;

  @ManyToOne(() => Cfo, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cfoId' })
  cfo: Cfo;

  @Column()
  cfoId: number;

  @Column({
    type: 'enum',
    enum: CfoStatusValue,
    default: CfoStatusValue.PENDING,
  })
  status: CfoStatusValue;

  @Column({ default: true })
  isRequired: boolean;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'decidedById' })
  decidedBy: User | null;

  @Column({ nullable: true })
  decidedById: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  decidedAt: Date | null;
}
