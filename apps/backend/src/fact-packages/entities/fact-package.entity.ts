import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';

import { Cfo } from '../../org/entities/cfo.entity';
import { Filial } from '../../org/entities/filial.entity';
import { User } from '../../users/entities/user.entity';
import { Direction } from '../fact-form-catalog';
import { FactForm } from './fact-form.entity';
import { FactPackageCfoStatus } from './fact-package-cfo-status.entity';
import { FactPackageHistoryEntry } from './fact-package-history-entry.entity';
import { FactPackageRemark } from './fact-package-remark.entity';

export enum FactPackageStatus {
  DRAFT = 'DRAFT',
  UNDER_CFO_REVIEW = 'UNDER_CFO_REVIEW',
  PARTIALLY_APPROVED = 'PARTIALLY_APPROVED',
  RETURNED_FOR_REVISION = 'RETURNED_FOR_REVISION',
  RESUBMITTED = 'RESUBMITTED',
  ALL_CFO_APPROVED = 'ALL_CFO_APPROVED',
  UNDER_DTOE_REVIEW = 'UNDER_DTOE_REVIEW',
  RETURNED_BY_DTOE = 'RETURNED_BY_DTOE',
  APPROVED = 'APPROVED',
}

/**
 * Факт-пакет — пакет форм по направлению, создаётся заново каждый раз
 * автором-владельцем (по аналогии с корректировкой). Владелец — либо Филиал
 * (`filialId`, идёт на проверку выбранным ЦФО), либо ЦФО (`cfoId`, свой пакет
 * без проверки ЦФО, направляется сразу в ДТОиР) — ровно один из двух
 * заполнен (openspec/changes/fact-package-review).
 */
@Entity('fact_packages')
export class FactPackage {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  humanId: string;

  @ManyToOne(() => Filial, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'filialId' })
  filial: Relation<Filial> | null;

  @Column({ nullable: true })
  filialId: number | null;

  @ManyToOne(() => Cfo, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'cfoId' })
  cfo: Relation<Cfo> | null;

  @Column({ nullable: true })
  cfoId: number | null;

  @Column({ type: 'enum', enum: Direction })
  direction: Direction;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'authorId' })
  author: Relation<User>;

  @Column()
  authorId: number;

  @Column({
    type: 'enum',
    enum: FactPackageStatus,
    default: FactPackageStatus.DRAFT,
  })
  status: FactPackageStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  sentToDtoeAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  decidedAt: Date | null;

  @OneToMany(() => FactForm, (form) => form.factPackage)
  forms: FactForm[];

  @OneToMany(() => FactPackageCfoStatus, (status) => status.factPackage)
  cfoStatuses: FactPackageCfoStatus[];

  @OneToMany(() => FactPackageRemark, (remark) => remark.factPackage)
  remarks: FactPackageRemark[];

  @OneToMany(() => FactPackageHistoryEntry, (entry) => entry.factPackage)
  history: FactPackageHistoryEntry[];

  get canSubmit(): boolean {
    if (this.cfoId != null) {
      return (
        this.status === FactPackageStatus.DRAFT ||
        this.status === FactPackageStatus.RETURNED_BY_DTOE
      );
    }
    return (
      this.status === FactPackageStatus.DRAFT ||
      this.status === FactPackageStatus.RETURNED_FOR_REVISION
    );
  }

  get canSendToDtoe(): boolean {
    return this.status === FactPackageStatus.ALL_CFO_APPROVED;
  }
}
