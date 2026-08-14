import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Cfo } from '../../org/entities/cfo.entity';
import { Filial } from '../../org/entities/filial.entity';

export enum Role {
  FILIAL = 'FILIAL',
  CFO = 'CFO',
  DTOE = 'DTOE',
  /** Эквивалент is_staff/is_superuser в Django — управляет справочниками и пользователями. */
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  username: string;

  /** Bcrypt-хэш. select:false — не возвращается обычными запросами, только явным addSelect. */
  @Column({ select: false })
  passwordHash: string;

  @Column({ default: '' })
  email: string;

  @Column({ default: '' })
  firstName: string;

  @Column({ default: '' })
  lastName: string;

  @Column({ type: 'enum', enum: Role, default: Role.FILIAL })
  role: Role;

  @ManyToOne(() => Filial, (filial) => filial.users, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'filialId' })
  filial: Filial | null;

  @Column({ nullable: true })
  filialId: number | null;

  @ManyToOne(() => Cfo, (cfo) => cfo.users, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'cfoId' })
  cfo: Cfo | null;

  @Column({ nullable: true })
  cfoId: number | null;

  @Column({ default: '' })
  position: string;

  @Column({ default: '' })
  phone: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isLocked: boolean;

  @CreateDateColumn()
  dateJoined: Date;

  get fullName(): string {
    const full = [this.firstName, this.lastName].filter(Boolean).join(' ');
    return full || this.username;
  }
}
