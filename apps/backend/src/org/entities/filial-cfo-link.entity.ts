import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
} from 'typeorm';

import { Cfo } from './cfo.entity';
import { Filial } from './filial.entity';

/** Связь many-to-many Филиал <-> ЦФО, управляется администратором (кто кого проверяет). */
@Entity('filial_cfo_links')
@Unique(['filialId', 'cfoId'])
export class FilialCfoLink {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Filial, (filial) => filial.cfoLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'filialId' })
  filial: Relation<Filial>;

  @Column()
  filialId: number;

  @ManyToOne(() => Cfo, (cfo) => cfo.filialLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cfoId' })
  cfo: Relation<Cfo>;

  @Column()
  cfoId: number;

  @Column({ default: true })
  isActive: boolean;
}
