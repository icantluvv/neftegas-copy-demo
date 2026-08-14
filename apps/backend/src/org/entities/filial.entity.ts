import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Филиал — газовая компания (Донбассгаз, Луганскгаз, Запорожгаз, Херсонгаз),
 * инициатор корректировок. Имеет собственных пользователей и работает только
 * со своими документами.
 */
@Entity('filials')
export class Filial {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  code: string;

  @Column({ default: '' })
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany('User', 'filial')
  users: unknown[];

  @OneToMany('FilialCfoLink', 'filial')
  cfoLinks: unknown[];

  @OneToMany('Correction', 'filial')
  corrections: unknown[];
}
