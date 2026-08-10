import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

/**
 * ЦФО — подразделение Администрации Общества (АНГНКС, ОГМ, ОТЭОГС и т.п.),
 * проверяющее и согласовывающее корректировки одного или нескольких филиалов.
 */
@Entity('cfos')
export class Cfo {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  code: string;

  @Column({ default: '' })
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany('User', 'cfo')
  users: unknown[];

  @OneToMany('FilialCfoLink', 'cfo')
  filialLinks: unknown[];
}
