import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { PackageRequirement } from '../../org/entities/package-requirement.entity';
import { Correction } from './correction.entity';
import { FileVersion } from './file-version.entity';

/**
 * «Ячейка» пакета — либо основной Excel, либо конкретное требование
 * (документ/лист) из настроек типа корректировки. Хранит версии файлов.
 * requirement = null означает основной Excel-файл корректировки.
 */
@Entity('document_slots')
export class DocumentSlot {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Correction, (correction) => correction.slots, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'correctionId' })
  correction: Correction;

  @Column()
  correctionId: number;

  @ManyToOne(() => PackageRequirement, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'requirementId' })
  requirement: PackageRequirement | null;

  @Column({ nullable: true })
  requirementId: number | null;

  @Column()
  label: string;

  @OneToMany(() => FileVersion, (version) => version.slot)
  versions: FileVersion[];
}
