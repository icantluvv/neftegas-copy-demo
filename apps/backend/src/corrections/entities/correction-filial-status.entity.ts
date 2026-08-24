import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
} from 'typeorm';

import { Filial } from '../../org/entities/filial.entity';
import { User } from '../../users/entities/user.entity';
import { Correction } from './correction.entity';

export enum FilialStatusValue {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  RETURNED = 'RETURNED',
}

/**
 * Независимый статус проверки каждого филиала в маршруте корректировки,
 * инициированной ЦФО (initiatorKind = CFO). Зеркало CorrectionCfoStatus —
 * формируется при направлении (`send-as-cfo`, target = FILIAL).
 */
@Entity('correction_filial_statuses')
@Unique(['correctionId', 'filialId'])
export class CorrectionFilialStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Correction, (correction) => correction.filialStatuses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'correctionId' })
  correction: Relation<Correction>;

  @Column()
  correctionId: number;

  @ManyToOne(() => Filial, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'filialId' })
  filial: Relation<Filial>;

  @Column()
  filialId: number;

  @Column({
    type: 'enum',
    enum: FilialStatusValue,
    default: FilialStatusValue.PENDING,
  })
  status: FilialStatusValue;

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
