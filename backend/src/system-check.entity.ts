import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'system_checks' })
export class SystemCheck {
  @PrimaryGeneratedColumn()
  id!: number

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @Column({ type: 'text' })
  message!: string
}