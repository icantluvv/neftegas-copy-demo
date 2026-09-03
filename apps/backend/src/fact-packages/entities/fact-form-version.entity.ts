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
import { FactForm } from './fact-form.entity';
import { FactPackageRemark } from './fact-package-remark.entity';

/** Версия файла формы факт-пакета. Старые версии не удаляются. */
@Entity('fact_form_versions')
export class FactFormVersion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => FactForm, (form) => form.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'formId' })
  form: Relation<FactForm>;

  @Column()
  formId: number;

  @Column()
  versionNumber: number;

  /** Путь на диске, не отдаётся клиенту напрямую — только через /fact-files/:id/download. */
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

  @ManyToOne(() => FactPackageRemark, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'remarkId' })
  remark: Relation<FactPackageRemark> | null;

  @Column({ nullable: true })
  remarkId: number | null;

  @Column({ length: 500, default: '' })
  note: string;
}
