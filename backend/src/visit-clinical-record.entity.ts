import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Visit } from './visit.entity'

export enum FastingStatus {
  YES = 'YES',
  NO = 'NO',
  DOUBTFUL = 'DOUBTFUL',
  NOT_RECORDED = 'NOT_RECORDED',
}

export enum EligibilityDecision {
  ELIGIBLE = 'ELIGIBLE',
  NOT_ELIGIBLE = 'NOT_ELIGIBLE',
  PENDING = 'PENDING',
}

export enum ContinueStudyDecision {
  YES = 'YES',
  NO = 'NO',
  PENDING = 'PENDING',
}

export enum DoseDecision {
  INCREASE = 'INCREASE',
  MAINTAIN = 'MAINTAIN',
  DECREASE = 'DECREASE',
  INTERRUPT = 'INTERRUPT',
  RESTART = 'RESTART',
  DISCONTINUE = 'DISCONTINUE',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

@Entity({ name: 'visit_clinical_records' })
export class VisitClinicalRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @OneToOne(() => Visit, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'visitId' })
  visit!: Visit

  @Column({ type: 'enum', enum: FastingStatus, default: FastingStatus.NOT_RECORDED })
  fastingStatus!: FastingStatus

  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  fastingHours!: string | null

  @Column({ type: 'text', nullable: true })
  fastingNotes!: string | null

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  weightKg!: string | null

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  waistCm!: string | null

  @Column({ type: 'integer', nullable: true })
  systolic1!: number | null

  @Column({ type: 'integer', nullable: true })
  diastolic1!: number | null

  @Column({ type: 'integer', nullable: true })
  pulse1!: number | null

  @Column({ type: 'integer', nullable: true })
  systolic2!: number | null

  @Column({ type: 'integer', nullable: true })
  diastolic2!: number | null

  @Column({ type: 'integer', nullable: true })
  pulse2!: number | null

  @Column({ type: 'integer', nullable: true })
  systolic3!: number | null

  @Column({ type: 'integer', nullable: true })
  diastolic3!: number | null

  @Column({ type: 'integer', nullable: true })
  pulse3!: number | null

  @Column({ type: 'boolean', nullable: true })
  conmedReviewed!: boolean | null

  @Column({ type: 'boolean', nullable: true })
  conmedChanges!: boolean | null

  @Column({ type: 'text', nullable: true })
  conmedNotes!: string | null

  @Column({ type: 'boolean', nullable: true })
  aeReviewed!: boolean | null

  @Column({ type: 'boolean', nullable: true })
  hasActiveAe!: boolean | null

  @Column({ type: 'text', nullable: true })
  aeNotes!: string | null

  @Column({ type: 'boolean', nullable: true })
  physicalExamPerformed!: boolean | null

  @Column({ type: 'text', nullable: true })
  physicalExamNotes!: string | null

  @Column({ type: 'boolean', nullable: true })
  phq9Completed!: boolean | null

  @Column({ type: 'boolean', nullable: true })
  cssrsCompleted!: boolean | null

  @Column({ type: 'boolean', nullable: true })
  cssrsAlert!: boolean | null

  @Column({ type: 'text', nullable: true })
  questionnaireNotes!: string | null

  @Column({ type: 'enum', enum: EligibilityDecision, nullable: true })
  eligibilityDecision!: EligibilityDecision | null

  @Column({ type: 'enum', enum: ContinueStudyDecision, nullable: true })
  continueStudy!: ContinueStudyDecision | null

  @Column({ type: 'enum', enum: DoseDecision, nullable: true })
  doseDecision!: DoseDecision | null

  @Column({ type: 'text', nullable: true })
  doseDecisionNotes!: string | null

  @Column({ type: 'text', nullable: true })
  medicalNotes!: string | null

  @Column({ type: 'varchar', length: 120, nullable: true })
  recordedBy!: string | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}