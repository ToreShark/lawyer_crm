// src/users/entities/user.entity.ts
// import { Case } from 'src/cases/entities/case.entity';
import { Case } from '../../cases/entities/case.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../enum/user.role';

@Entity('users')
@Unique(['telegram_id']) // Уникальность
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  telegram_id: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column()
  name: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true }) // username может быть пустым
  username?: string;

  @OneToMany(() => Case, (caseEntity) => caseEntity.responsible)
  cases: Case[];
}
