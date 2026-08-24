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
import { CorrectionFilialStatus } from './correction-filial-status.entity';
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
  // Зеркальный цикл для корректировок, инициированных ЦФО (initiatorKind = CFO).
  UNDER_FILIAL_REVIEW = 'UNDER_FILIAL_REVIEW',
  PARTIALLY_APPROVED_BY_FILIALS = 'PARTIALLY_APPROVED_BY_FILIALS',
  RETURNED_FOR_REVISION_BY_FILIAL = 'RETURNED_FOR_REVISION_BY_FILIAL',
  RESUBMITTED_TO_FILIALS = 'RESUBMITTED_TO_FILIALS',
  ALL_FILIALS_APPROVED = 'ALL_FILIALS_APPROVED',
}

/** Кто создал корректировку — определяет, кто выступает проверяющим. */
export enum InitiatorKind {
  FILIAL = 'FILIAL',
  CFO = 'CFO',
}

/** Куда ЦФО-инициатор фактически направил корректировку (заполняется при send-as-cfo). */
export enum TargetKind {
  FILIAL = 'FILIAL',
  DTOE = 'DTOE',
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
   * Единственный филиал-владелец при initiatorKind = FILIAL (исторический
   * смысл поля). При initiatorKind = CFO — null; целевые филиалы (может быть
   * несколько) живут в filialStatuses.
   */
  @ManyToOne(() => Filial, (filial) => filial.corrections, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'filialId' })
  filial: Relation<Filial> | null;

  @Column({ type: 'int', nullable: true })
  filialId: number | null;

  @Column({
    type: 'enum',
    enum: InitiatorKind,
    default: InitiatorKind.FILIAL,
  })
  initiatorKind: InitiatorKind;

  /** Заполнен только при initiatorKind = FILIAL (дублирует filialId по смыслу). */
  @Column({ type: 'int', nullable: true })
  initiatorFilialId: number | null;

  @ManyToOne(() => Cfo, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'initiatorCfoId' })
  initiatorCfo: Relation<Cfo> | null;

  @Column({ type: 'int', nullable: true })
  initiatorCfoId: number | null;

  /** Куда ЦФО-инициатор направил корректировку — FILIAL или DTOE. Null, пока не направлено. */
  @Column({ type: 'enum', enum: TargetKind, nullable: true })
  targetKind: TargetKind | null;

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

  @OneToMany(() => CorrectionFilialStatus, (status) => status.correction)
  filialStatuses: CorrectionFilialStatus[];

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
