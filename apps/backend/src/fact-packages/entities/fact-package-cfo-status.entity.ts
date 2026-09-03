import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
} from 'typeorm';

import { Cfo } from '../../org/entities/cfo.entity';
import { User } from '../../users/entities/user.entity';
import { FactPackage } from './fact-package.entity';

export enum FactCfoStatusValue {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  RETURNED = 'RETURNED',
}

/** Независимый статус проверки каждого ЦФО, направленного по факт-пакету. */
@Entity('fact_package_cfo_statuses')
@Unique(['factPackageId', 'cfoId'])
export class FactPackageCfoStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => FactPackage, (factPackage) => factPackage.cfoStatuses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'factPackageId' })
  factPackage: Relation<FactPackage>;

  @Column()
  factPackageId: number;

  @ManyToOne(() => Cfo, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cfoId' })
  cfo: Relation<Cfo>;

  @Column()
  cfoId: number;

  @Column({
    type: 'enum',
    enum: FactCfoStatusValue,
    default: FactCfoStatusValue.PENDING,
  })
  status: FactCfoStatusValue;

  @Column({ default: true })
  isRequired: boolean;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'decidedById' })
  decidedBy: Relation<User> | null;

  @Column({ nullable: true })
  decidedById: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  decidedAt: Date | null;
}
