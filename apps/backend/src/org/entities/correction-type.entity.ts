import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { PackageRequirement } from './package-requirement.entity';

/** Тип корректировки — определяет обязательный пакет документов и маршрут проверки. */
@Entity('correction_types')
export class CorrectionType {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  code: string;

  @Column()
  name: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => PackageRequirement, (requirement) => requirement.correctionType)
  requirements: PackageRequirement[];

  @OneToMany('Correction', 'correctionType')
  corrections: unknown[];
}
