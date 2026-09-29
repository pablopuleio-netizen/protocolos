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
import { Visit } from './visit.entity'

export enum VisitProcedureCategory {
  CLINICAL = 'CLINICAL',
  QUESTIONNAIRE = 'QUESTIONNAIRE',
  LABORATORY = 'LABORATORY',
  ECG = 'ECG',
  IP = 'IP',
  IWRS = 'IWRS',
  IMAGING = 'IMAGING',
  OTHER = 'OTHER',
}

export enum VisitProcedureResponsibleRole {
  DOCTOR = 'DOCTOR',
  STUDY_COORDINATOR = 'STUDY_COORDINATOR',
  LAB = 'LAB',
  ECG_TECH = 'ECG_TECH',
  SHARED = 'SHARED',
}

export enum VisitProcedureStatus {
  PENDING = 'PENDING',
  READY = 'READY',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

export enum TimeCaptureMode {
  NONE = 'NONE',
  OPTIONAL = 'OPTIONAL',
  REQUIRED = 'REQUIRED',
}

@Entity({ name: 'visit_procedures' })
@Unique('UQ_visit_procedures_visit_code', ['visit', 'code'])
export class VisitProcedure {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => Visit, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'visitId' })
  visit!: Visit

  @Column({ type: 'varchar', length: 80 })
  code!: string

  @Column({ type: 'varchar', length: 200 })
  name!: string

  @Column({ type: 'enum', enum: VisitProcedureCategory })
  category!: VisitProcedureCategory

  @Column({ type: 'enum', enum: VisitProcedureResponsibleRole })
  responsibleRole!: VisitProcedureResponsibleRole

  @Column({ type: 'enum', enum: VisitProcedureStatus, default: VisitProcedureStatus.PENDING })
  status!: VisitProcedureStatus

  @Column({ type: 'enum', enum: TimeCaptureMode, default: TimeCaptureMode.NONE })
  timeCaptureMode!: TimeCaptureMode

  @Column({ type: 'integer' })
  sortOrder!: number

  @Column({ type: 'text', nullable: true })
  blockedReason!: string | null

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  dependsOnCodes!: string[]

  @Column({ type: 'timestamptz', nullable: true })
  startedAt!: Date | null

  @Column({ type: 'timestamptz', nullable: true })
  completedAt!: Date | null

  // Source sheets show this only for REQUIRED or recorded OPTIONAL procedures, never technical timestamps.
  @Column({ type: 'timestamptz', nullable: true })
  performedAt!: Date | null

  @Column({ type: 'timestamptz', nullable: true })
  recordedAt!: Date | null

  @Column({ type: 'varchar', length: 120, nullable: true })
  recordedBy!: string | null

  @Column({ type: 'text', nullable: true })
  correctionReason!: string | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}