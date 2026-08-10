import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Cfo } from './cfo.entity';
import { CorrectionType } from './correction-type.entity';

export enum PackageRequirementKind {
  MAIN_EXCEL = 'MAIN_EXCEL',
  EXCEL_SHEET = 'EXCEL_SHEET',
  DOCUMENT = 'DOCUMENT',
}

/**
 * Элемент обязательного пакета для типа корректировки: либо основной
 * Excel-файл целиком, либо конкретный лист Excel, либо отдельный документ.
 * Каждый элемент закреплён за ЦФО, который его проверяет — настраивается
 * администратором, не зашито в код.
 */
@Entity('package_requirements')
export class PackageRequirement {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CorrectionType, (type) => type.requirements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'correctionTypeId' })
  correctionType: CorrectionType;

  @Column()
  correctionTypeId: number;

  @Column({ type: 'enum', enum: PackageRequirementKind })
  kind: PackageRequirementKind;

  @Column()
  name: string;

  @Column({ default: true })
  isRequired: boolean;

  @ManyToOne(() => Cfo, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'responsibleCfoId' })
  responsibleCfo: Cfo | null;

  @Column({ nullable: true })
  responsibleCfoId: number | null;

  @Column({ default: '' })
  namePattern: string;

  @Column({ default: '' })
  fileFormat: string;

  @Column({ default: 0 })
  order: number;
}
