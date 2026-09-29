import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Visit } from './visit.entity'
import {
  ContinueStudyDecision,
  DoseDecision,
  EligibilityDecision,
  FastingStatus,
  VisitClinicalRecord,
} from './visit-clinical-record.entity'

const enumFields = {
  fastingStatus: Object.values(FastingStatus),
  eligibilityDecision: Object.values(EligibilityDecision),
  continueStudy: Object.values(ContinueStudyDecision),
  doseDecision: Object.values(DoseDecision),
} as const

const booleanFields = new Set([
  'conmedReviewed', 'conmedChanges', 'aeReviewed', 'hasActiveAe',
  'physicalExamPerformed', 'phq9Completed', 'cssrsCompleted', 'cssrsAlert',
])

const integerFields = new Set([
  'systolic1', 'diastolic1', 'pulse1', 'systolic2', 'diastolic2', 'pulse2',
  'systolic3', 'diastolic3', 'pulse3',
])

const decimalFields = new Set(['fastingHours', 'weightKg', 'waistCm'])
const textFields = new Set([
  'fastingNotes', 'conmedNotes', 'aeNotes', 'physicalExamNotes',
  'questionnaireNotes', 'doseDecisionNotes', 'medicalNotes', 'recordedBy',
])

const allowedFields = new Set([
  ...Object.keys(enumFields), ...booleanFields, ...integerFields,
  ...decimalFields, ...textFields,
])

@Injectable()
export class VisitClinicalRecordsService {
  constructor(
    @InjectRepository(VisitClinicalRecord)
    private readonly records: Repository<VisitClinicalRecord>,
    @InjectRepository(Visit)
    private readonly visits: Repository<Visit>,
  ) {}

  async findOrCreate(visitId: string) {
    const visit = await this.visits.findOneBy({ id: visitId })
    if (!visit) throw new NotFoundException(`Visit ${visitId} was not found`)

    let record = await this.records.findOne({ where: { visit: { id: visitId } } })
    if (!record) {
      record = this.records.create({ visit })
      try {
        record = await this.records.save(record)
      } catch {
        record = await this.records.findOneByOrFail({ visit: { id: visitId } })
      }
    }
    return record
  }

  async update(visitId: string, payload: unknown) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new BadRequestException('Request body must be a JSON object')
    }

    const changes = payload as Record<string, unknown>
    const unknownFields = Object.keys(changes).filter((field) => !allowedFields.has(field))
    if (unknownFields.length > 0) {
      throw new BadRequestException(`Unsupported clinical record fields: ${unknownFields.join(', ')}`)
    }

    const record = await this.findOrCreate(visitId)
    for (const [field, value] of Object.entries(changes)) {
      if (enumFields[field as keyof typeof enumFields]) {
        if (value !== null && !(enumFields[field as keyof typeof enumFields] as readonly unknown[]).includes(value)) {
          throw new BadRequestException(`${field} has an invalid value`)
        }
      } else if (booleanFields.has(field)) {
        if (value !== null && typeof value !== 'boolean') {
          throw new BadRequestException(`${field} must be a boolean or null`)
        }
      } else if (integerFields.has(field)) {
        if (value !== null && (!Number.isInteger(value) || Number(value) < 0)) {
          throw new BadRequestException(`${field} must be a non-negative integer or null`)
        }
      } else if (decimalFields.has(field)) {
        if (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < 0)) {
          throw new BadRequestException(`${field} must be a non-negative number or null`)
        }
      } else if (textFields.has(field)) {
        if (value !== null && typeof value !== 'string') {
          throw new BadRequestException(`${field} must be a string or null`)
        }
        if (field === 'recordedBy' && typeof value === 'string' && value.length > 120) {
          throw new BadRequestException('recordedBy must be at most 120 characters')
        }
      }

      Object.assign(record, { [field]: value })
    }

    return this.records.save(record)
  }
}