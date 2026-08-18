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
import { DocumentSlot } from './document-slot.entity';
import { Remark } from './remark.entity';

/** Версия файла в ячейке пакета. Старые версии не удаляются. */
@Entity('file_versions')
export class FileVersion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => DocumentSlot, (slot) => slot.versions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'slotId' })
  slot: Relation<DocumentSlot>;

  @Column()
  slotId: number;

  @Column()
  versionNumber: number;

  /** Путь на диске (том Docker), не отдаётся клиенту напрямую — только через /files/:id/download. */
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

  @ManyToOne(() => Remark, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'remarkId' })
  remark: Relation<Remark> | null;

  @Column({ nullable: true })
  remarkId: number | null;

  @Column({ length: 500, default: '' })
  note: string;
}
