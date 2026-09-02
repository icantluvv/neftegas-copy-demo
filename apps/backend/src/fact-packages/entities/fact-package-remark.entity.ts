import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';

import { Cfo } from '../../org/entities/cfo.entity';
import { User } from '../../users/entities/user.entity';
import { FactForm } from './fact-form.entity';
import { FactPackage } from './fact-package.entity';

export enum FactRemarkStatus {
  OPEN = 'OPEN',
  FIXED_BY_FILIAL = 'FIXED_BY_FILIAL',
  CLOSED = 'CLOSED',
}

/** Замечание к форме факт-пакета. cfoId = null означает автора ДТОиР. */
@Entity('fact_package_remarks')
export class FactPackageRemark {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  humanId: string;

  @ManyToOne(() => FactPackage, (factPackage) => factPackage.remarks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'factPackageId' })
  factPackage: Relation<FactPackage>;

  @Column()
  factPackageId: number;

  @ManyToOne(() => FactForm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'relatedFormId' })
  relatedForm: Relation<FactForm>;

  @Column()
  relatedFormId: number;

  @ManyToOne(() => Cfo, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cfoId' })
  cfo: Relation<Cfo> | null;

  @Column({ nullable: true })
  cfoId: number | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'authorId' })
  author: Relation<User>;

  @Column()
  authorId: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  requiredAction: string;

  @Column({
    type: 'enum',
    enum: FactRemarkStatus,
    default: FactRemarkStatus.OPEN,
  })
  status: FactRemarkStatus;

  @Column({ type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  get issuerLabel(): string {
    return this.cfo ? this.cfo.code : 'ДТОиР';
  }
}
