import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
} from 'typeorm';

import { FactFormCode } from '../fact-form-catalog';
import { FactFormVersion } from './fact-form-version.entity';
import { FactPackage } from './fact-package.entity';

/**
 * Форма факт-пакета — «элемент пакета»/слот, копящий версии файла. Создаётся
 * для каждого кода из каталога направления при создании факт-пакета.
 */
@Entity('fact_forms')
@Unique(['factPackageId', 'code'])
export class FactForm {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => FactPackage, (factPackage) => factPackage.forms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'factPackageId' })
  factPackage: Relation<FactPackage>;

  @Column()
  factPackageId: number;

  @Column({ type: 'enum', enum: FactFormCode })
  code: FactFormCode;

  @Column()
  label: string;

  @OneToMany(() => FactFormVersion, (version) => version.form)
  versions: FactFormVersion[];
}
