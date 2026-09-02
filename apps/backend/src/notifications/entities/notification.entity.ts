import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';

import { Correction } from '../../corrections/entities/correction.entity';
import { FactPackage } from '../../fact-packages/entities/fact-package.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Ровно одно из correctionId/factPackageId заполнено — уведомление относится
 * либо к корректировке (домен `corrections`), либо к факт-пакету (домен
 * `fact-packages`); оба домена независимы и не смешиваются.
 */
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  @Column()
  userId: number;

  @ManyToOne(() => Correction, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'correctionId' })
  correction: Relation<Correction> | null;

  @Column({ nullable: true })
  correctionId: number | null;

  @ManyToOne(() => FactPackage, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'factPackageId' })
  factPackage: Relation<FactPackage> | null;

  @Column({ nullable: true })
  factPackageId: number | null;

  @Column({ length: 500 })
  text: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
