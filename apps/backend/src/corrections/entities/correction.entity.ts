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

import { Cfo } from '../../org/entities/cfo.entity';
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

  /**
   * Ровно одно из filialId/cfoId заполнено: filialId — корректировка создана
   * Филиалом (обычный цикл, направляется выбранным ЦФО); cfoId —
   * корректировка создана самим ЦФО и направляется сразу в ДТОиР, минуя
   * цикл согласования другими ЦФО (см. `sendToDtoe`).
   */
  @ManyToOne(() => Filial, (filial) => filial.corrections, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'filialId' })
  filial: Relation<Filial> | null;

  @Column({ type: 'int', nullable: true })
  filialId: number | null;

  @ManyToOne(() => Cfo, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cfoId' })
  cfo: Relation<Cfo> | null;

  @Column({ type: 'int', nullable: true })
  cfoId: number | null;

  @ManyToOne(() => CorrectionType, (type) => type.corrections, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'correctionTypeId' })
  correctionType: Relation<CorrectionType>;

  @Column()
  correctionTypeId: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'authorId' })
  author: Relation<User>;

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

  /** Владелец-ЦФО может направить пакет сразу в ДТОиР из этих статусов. */
  get canSendToDtoeAsOwner(): boolean {
    return (
      this.status === CorrectionStatus.DRAFT ||
      this.status === CorrectionStatus.RETURNED_BY_DTOE
    );
  }
}
