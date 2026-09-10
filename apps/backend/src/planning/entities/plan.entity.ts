import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';

import { Filial } from '../../org/entities/filial.entity';
import { User } from '../../users/entities/user.entity';
import { PlanCfoStatus } from './plan-cfo-status.entity';
import { PlanDocumentSlot } from './plan-document-slot.entity';
import { PlanHistoryEntry } from './plan-history-entry.entity';
import { PlanRemark } from './plan-remark.entity';
import { PlanType } from './plan-type.entity';

export enum PlanStatus {
  DRAFT = 'DRAFT',
  UNDER_CFO_REVIEW = 'UNDER_CFO_REVIEW',
  PARTIALLY_APPROVED = 'PARTIALLY_APPROVED',
  RETURNED_FOR_REVISION = 'RETURNED_FOR_REVISION',
  RESUBMITTED = 'RESUBMITTED',
  ALL_CFO_APPROVED = 'ALL_CFO_APPROVED',
  UNDER_DTOE_REVIEW = 'UNDER_DTOE_REVIEW',
  RETURNED_BY_DTOE = 'RETURNED_BY_DTOE',
  APPROVED_BY_DTOE = 'APPROVED_BY_DTOE',
}

/**
 * План — пообъектный план ДТОиР на планируемый год (модуль «План на 2027»).
 * Независимый домен от Correction — собственные таблицы, без внешних
 * ключей на corrections (openspec/changes/planning-2027-package-review).
 */
@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  humanId: string;

  @ManyToOne(() => Filial, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'filialId' })
  filial: Relation<Filial>;

  @Column()
  filialId: number;

  @ManyToOne(() => PlanType, (type) => type.plans, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'planTypeId' })
  planType: Relation<PlanType>;

  @Column()
  planTypeId: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'authorId' })
  author: Relation<User>;

  @Column()
  authorId: number;

  @Column({
    type: 'enum',
    enum: PlanStatus,
    default: PlanStatus.DRAFT,
  })
  status: PlanStatus;

  @Column({ default: '' })
  stageNote: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  sentToDtoeAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  decidedAt: Date | null;

  @OneToMany(() => PlanDocumentSlot, (slot) => slot.plan)
  slots: PlanDocumentSlot[];

  @OneToMany(() => PlanCfoStatus, (status) => status.plan)
  cfoStatuses: PlanCfoStatus[];

  @OneToMany(() => PlanRemark, (remark) => remark.plan)
  remarks: PlanRemark[];

  @OneToMany(() => PlanHistoryEntry, (entry) => entry.plan)
  history: PlanHistoryEntry[];

  get canSend(): boolean {
    return this.status === PlanStatus.DRAFT;
  }

  get canSendToDtoe(): boolean {
    return this.status === PlanStatus.ALL_CFO_APPROVED;
  }
}
