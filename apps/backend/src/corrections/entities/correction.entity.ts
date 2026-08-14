import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CorrectionType } from '../../org/entities/correction-type.entity';
import { Filial } from '../../org/entities/filial.entity';
import { User } from '../../users/entities/user.entity';
import { CorrectionCfoStatus } from './correction-cfo-status.entity';
import { CorrectionHistoryEntry } from './correction-history-entry.entity';
import { DocumentSlot } from './document-slot.entity';
import { Remark } from './remark.entity';

export enum CorrectionStatus {
  DRAFT = 'DRAFT',
  UNDER_CFO_REVIEW = 'UNDER_CFO_REVIEW',
  PARTIALLY_APPROVED = 'PARTIALLY_APPROVED',
  RETURNED_FOR_REVISION = 'RETURNED_FOR_REVISION',
  RESUBMITTED = 'RESUBMITTED',
  ALL_CFO_APPROVED = 'ALL_CFO_APPROVED',
  SENT_TO_DTOE = 'SENT_TO_DTOE',
  UNDER_DTOE_REVIEW = 'UNDER_DTOE_REVIEW',
  RETURNED_BY_DTOE = 'RETURNED_BY_DTOE',
  APPROVED_BY_DTOE = 'APPROVED_BY_DTOE',
}

/** Корректировка — основной документ, проходящий полный цикл согласования. */
@Entity('corrections')
export class Correction {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  humanId: string;

  @ManyToOne(() => Filial, (filial) => filial.corrections, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'filialId' })
  filial: Filial;

  @Column()
  filialId: number;

  @ManyToOne(() => CorrectionType, (type) => type.corrections, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'correctionTypeId' })
  correctionType: CorrectionType;

  @Column()
  correctionTypeId: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: number;

  @Column({
    type: 'enum',
    enum: CorrectionStatus,
    default: CorrectionStatus.DRAFT,
  })
  status: CorrectionStatus;

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

  @OneToMany(() => DocumentSlot, (slot) => slot.correction)
  slots: DocumentSlot[];

  @OneToMany(() => CorrectionCfoStatus, (status) => status.correction)
  cfoStatuses: CorrectionCfoStatus[];

  @OneToMany(() => Remark, (remark) => remark.correction)
  remarks: Remark[];

  @OneToMany(() => CorrectionHistoryEntry, (entry) => entry.correction)
  history: CorrectionHistoryEntry[];

  get canSend(): boolean {
    return this.status === CorrectionStatus.DRAFT;
  }

  get canSendToDtoe(): boolean {
    return this.status === CorrectionStatus.ALL_CFO_APPROVED;
  }
}
