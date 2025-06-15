import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { addDays } from 'date-fns';
import { addBusinessDays } from '../../utils/addBusinessDays';

// Статусы дела
export enum CaseStatus {
  SUBMITTED = 'submitted',
  PENDING_CHECK = 'pending_check',
  ACCEPTED = 'accepted',
  RETURNED = 'returned',
  CLOSED = 'closed',
  DECISION_MADE = 'decision_made',
  APPEAL = 'appeal',
}

@Entity('cases')
export class Case {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  number: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: CaseStatus,
    default: CaseStatus.SUBMITTED,
  })
  status: CaseStatus;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'responsibleId' })
  responsible: User;

  @Column({ type: 'json', nullable: true })
  notifications_sent: any;

  @Column({ type: 'date' })
  filing_date: Date;

  @Column({ type: 'date' })
  check_deadline: Date;

  @Column({ type: 'timestamptz', nullable: true })
  hearing_date: Date;

  @Column({ type: 'date', nullable: true })
  decision_date: Date;

  @Column({ type: 'date', nullable: true })
  appeal_deadline: Date;

  @Column({ type: 'date', nullable: true })
  decision_deadline: Date;

  @Column({ type: 'date', nullable: true })
  case_end_date: Date;

  @Column({ type: 'timestamptz', nullable: true })
  accepted_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // 🧠 Хук перед созданием записи
  @BeforeInsert()
  calculateCheckDeadline() {
    this.check_deadline = addBusinessDays(this.filing_date, 10);
  }

  // 🔁 Хук перед обновлением записи
  @BeforeUpdate()
  calculateDeadlines() {
    if (this.decision_date) {
      this.appeal_deadline = addDays(this.decision_date, 10);
      this.decision_deadline = addDays(this.decision_date, 30);
    }
    
    // Если дело принято и дата принятия еще не установлена
    if (this.status === CaseStatus.ACCEPTED && !this.accepted_date) {
      this.accepted_date = new Date();
      this.case_end_date = addBusinessDays(new Date(), 23);
    }
  }
}
