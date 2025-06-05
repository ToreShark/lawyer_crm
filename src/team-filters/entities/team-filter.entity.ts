import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CaseStatus } from '../../cases/entities/case.entity';

@Entity('team_filters')
export class TeamFilter {
  @PrimaryGeneratedColumn()
  id: number;

  // Фильтр по статусу (может быть null = все статусы)
  @Column({ type: 'enum', enum: CaseStatus, nullable: true })
  status_filter: CaseStatus;

  // Фильтр по ответственному (может быть null = все ответственные)
  @Column({ nullable: true })
  responsible_id: number;

  // Фильтры по датам
  @Column({ type: 'date', nullable: true })
  filing_date_from: Date;
  
  @Column({ type: 'date', nullable: true })
  filing_date_to: Date;

  @Column({ type: 'date', nullable: true })
  hearing_date_from: Date;
  
  @Column({ type: 'date', nullable: true })
  hearing_date_to: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}