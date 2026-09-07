import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';

import { PlanFileVersion } from './plan-file-version.entity';
import { PlanPackageRequirement } from './plan-package-requirement.entity';
import { Plan } from './plan.entity';

/**
 * «Ячейка» пакета — либо основной Excel, либо конкретное требование
 * (документ/лист) из настроек типа плана. Хранит версии файлов.
 * requirement = null означает основной Excel-файл плана.
 */
@Entity('plan_document_slots')
export class PlanDocumentSlot {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Plan, (plan) => plan.slots, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'planId' })
  plan: Relation<Plan>;

  @Column()
  planId: number;

  @ManyToOne(() => PlanPackageRequirement, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'requirementId' })
  requirement: Relation<PlanPackageRequirement> | null;

  @Column({ nullable: true })
  requirementId: number | null;

  @Column()
  label: string;

  @OneToMany(() => PlanFileVersion, (version) => version.slot)
  versions: PlanFileVersion[];
}
