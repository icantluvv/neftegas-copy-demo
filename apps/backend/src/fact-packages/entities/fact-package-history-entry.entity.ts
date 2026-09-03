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
import { FactPackage } from './fact-package.entity';

/** Неизменяемый лог действий по факт-пакету. */
@Entity('fact_package_history_entries')
export class FactPackageHistoryEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => FactPackage, (factPackage) => factPackage.history, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'factPackageId' })
  factPackage: Relation<FactPackage>;

  @Column()
  factPackageId: number;

  @CreateDateColumn()
  timestamp: Date;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: Relation<User> | null;

  @Column({ nullable: true })
  userId: number | null;

  @Column({ length: 500 })
  text: string;
}
