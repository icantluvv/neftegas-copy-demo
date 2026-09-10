import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { PlanPackageRequirement } from './plan-package-requirement.entity';

/** Тип плана — определяет обязательный пакет документов плана на 2027. */
@Entity('plan_types')
export class PlanType {
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

  @OneToMany(
    () => PlanPackageRequirement,
    (requirement) => requirement.planType,
  )
  requirements: PlanPackageRequirement[];

  @OneToMany('Plan', 'planType')
  plans: unknown[];
}
