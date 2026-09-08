import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';

import { Cfo } from '../../org/entities/cfo.entity';
import { User } from '../../users/entities/user.entity';
import { PlanDocumentSlot } from './plan-document-slot.entity';
import { PlanFileVersion } from './plan-file-version.entity';
import { Plan } from './plan.entity';

export enum PlanRemarkStatus {
  OPEN = 'OPEN',
  FIXED_BY_FILIAL = 'FIXED_BY_FILIAL',
  REOPENED = 'REOPENED',
  CLOSED = 'CLOSED',
}

/**
 * Замечание к плану — создаётся проверяющим. cfoId заполнен для замечания от
 * ЦФО; null означает замечание от ДТОиР.
 */
@Entity('plan_remarks')
export class PlanRemark {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  humanId: string;

  @ManyToOne(() => Plan, (plan) => plan.remarks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'planId' })
  plan: Relation<Plan>;

  @Column()
  planId: number;

  @ManyToOne(() => Cfo, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cfoId' })
  cfo: Relation<Cfo> | null;

  @Column({ nullable: true })
  cfoId: number | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'authorId' })
  author: Relation<User>;

  @Column()
  authorId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => PlanDocumentSlot, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'relatedSlotId' })
  relatedSlot: Relation<PlanDocumentSlot> | null;

  @Column({ nullable: true })
  relatedSlotId: number | null;

  @ManyToOne(() => PlanFileVersion, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'fileVersionId' })
  fileVersion: Relation<PlanFileVersion> | null;

  @Column({ nullable: true })
  fileVersionId: number | null;

  @Column({ default: '' })
  sheetName: string;

  @Column({ default: '' })
  rowRef: string;

  @Column({ default: '' })
  cellRef: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  requiredAction: string;

  @Column({
    type: 'enum',
    enum: PlanRemarkStatus,
    default: PlanRemarkStatus.OPEN,
  })
  status: PlanRemarkStatus;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'closedById' })
  closedBy: Relation<User> | null;

  @Column({ nullable: true })
  closedById: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  get issuerLabel(): string {
    if (this.cfo) return this.cfo.code;
    return 'ДТОиР';
  }
}
