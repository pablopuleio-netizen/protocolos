import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm'
import { Visit } from './visit.entity'

@Entity({ name: 'participants' })
@Unique('UQ_participants_study_code', ['studyCode', 'code'])
export class Participant {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 50 })
  code!: string

  @Column({ type: 'varchar', length: 50 })
  studyCode!: string

  @Column({ type: 'boolean', default: true })
  active!: boolean

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date

  @OneToMany(() => Visit, (visit) => visit.participant)
  visits!: Visit[]
}