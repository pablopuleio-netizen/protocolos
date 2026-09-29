import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm'
import { Participant } from './participant.entity'

export enum VisitStatus {
  SCHEDULED = 'SCHEDULED',
  PRESENT = 'PRESENT',
  IN_PROGRESS = 'IN_PROGRESS',
  NO_SHOW = 'NO_SHOW',
  COMPLETED = 'COMPLETED',
}

@Entity({ name: 'visits' })
@Unique('UQ_visits_participant_code_date', [
  'participant',
  'visitCode',
  'scheduledDate',
])
export class Visit {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => Participant, (participant) => participant.visits, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'participantId' })
  participant!: Participant

  @Column({ type: 'varchar', length: 20 })
  visitCode!: string

  @Column({ type: 'date' })
  scheduledDate!: string

  @Column({ type: 'time' })
  scheduledTime!: string

  @Column({ type: 'varchar', length: 120 })
  assignedDoctor!: string

  @Column({ type: 'varchar', length: 120, nullable: true })
  room!: string | null

  @Column({ type: 'enum', enum: VisitStatus, default: VisitStatus.SCHEDULED })
  status!: VisitStatus

  @Column({ type: 'timestamptz', nullable: true })
  arrivalAt!: Date | null

  @Column({ type: 'timestamptz', nullable: true })
  startedAt!: Date | null

  @Column({ type: 'timestamptz', nullable: true })
  completedAt!: Date | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}