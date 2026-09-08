import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';

import { Cfo } from '../../org/entities/cfo.entity';
import { PlanType } from './plan-type.entity';

export enum PlanRequirementKind {
  MAIN_EXCEL = 'MAIN_EXCEL',
  EXCEL_SHEET = 'EXCEL_SHEET',
  DOCUMENT = 'DOCUMENT',
}

/**
 * Элемент обязательного пакета для типа плана: либо основной Excel-файл
 * целиком, либо конкретный лист Excel, либо отдельный документ. Каждый
 * элемент закреплён за ЦФО, который его проверяет — настраивается
 * администратором, не зашито в код.
 */
@Entity('plan_package_requirements')
export class PlanPackageRequirement {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PlanType, (type) => type.requirements, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'planTypeId' })
  planType: Relation<PlanType>;

  @Column()
  planTypeId: number;

  @Column({ type: 'enum', enum: PlanRequirementKind })
  kind: PlanRequirementKind;

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

  /**
   * Общий ключ для альтернативных требований («выбери один из группы») —
   * null означает независимое требование, проверяется как раньше.
   */
  @Column({ type: 'varchar', nullable: true })
  choiceGroupKey: string | null;

  /** Заголовок группы для UI, заполнен на каждой строке группы. */
  @Column({ default: '' })
  groupLabel: string;
}
