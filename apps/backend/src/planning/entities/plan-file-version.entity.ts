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
import { PlanDocumentSlot } from './plan-document-slot.entity';
import { PlanRemark } from './plan-remark.entity';

/** Версия файла в ячейке пакета плана. Старые версии не удаляются. */
@Entity('plan_file_versions')
export class PlanFileVersion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PlanDocumentSlot, (slot) => slot.versions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'slotId' })
  slot: Relation<PlanDocumentSlot>;

  @Column()
  slotId: number;

  @Column()
  versionNumber: number;

  /** Путь на диске (том Docker), не отдаётся клиенту напрямую — только через /plan-files/:id/download. */
  @Column()
  storagePath: string;

  @Column()
  fileName: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column({ default: '' })
  mimeType: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: Relation<User>;

  @Column()
  uploadedById: number;

  @CreateDateColumn()
  uploadedAt: Date;

  @ManyToOne(() => PlanRemark, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'remarkId' })
  remark: Relation<PlanRemark> | null;

  @Column({ nullable: true })
  remarkId: number | null;

  @Column({ length: 500, default: '' })
  note: string;
}
