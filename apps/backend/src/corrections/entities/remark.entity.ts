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
import { Filial } from '../../org/entities/filial.entity';
import { User } from '../../users/entities/user.entity';
import { Correction } from './correction.entity';
import { DocumentSlot } from './document-slot.entity';
import { FileVersion } from './file-version.entity';

export enum RemarkStatus {
  OPEN = 'OPEN',
  FIXED_BY_FILIAL = 'FIXED_BY_FILIAL',
  REOPENED = 'REOPENED',
  CLOSED = 'CLOSED',
}

/**
 * Замечание — создаётся проверяющим при возврате на доработку. Ровно один из
 * cfoId/filialId заполнен (ЦФО или Филиал-проверяющий соответственно); оба
 * пустые — замечание от ДТОиР.
 */
@Entity('remarks')
export class Remark {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  humanId: string;

  @ManyToOne(() => Correction, (correction) => correction.remarks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'correctionId' })
  correction: Relation<Correction>;

  @Column()
  correctionId: number;

  @ManyToOne(() => Cfo, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cfoId' })
  cfo: Relation<Cfo> | null;

  @Column({ nullable: true })
  cfoId: number | null;

  @ManyToOne(() => Filial, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'filialId' })
  filial: Relation<Filial> | null;

  @Column({ nullable: true })
  filialId: number | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'authorId' })
  author: Relation<User>;

  @Column()
  authorId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => DocumentSlot, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'relatedSlotId' })
  relatedSlot: Relation<DocumentSlot> | null;

  @Column({ nullable: true })
  relatedSlotId: number | null;

  @ManyToOne(() => FileVersion, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'fileVersionId' })
  fileVersion: Relation<FileVersion> | null;

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

  @Column({ type: 'enum', enum: RemarkStatus, default: RemarkStatus.OPEN })
  status: RemarkStatus;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'closedById' })
  closedBy: Relation<User> | null;

  @Column({ nullable: true })
  closedById: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  get issuerLabel(): string {
    if (this.cfo) return this.cfo.code;
    if (this.filial) return this.filial.code;
    return 'ДТОиР';
  }
}
