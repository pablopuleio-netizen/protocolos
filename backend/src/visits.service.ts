import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindOptionsWhere, Repository } from 'typeorm'
import { Visit, VisitStatus } from './visit.entity'
import { VisitProceduresService } from './visit-procedures.service'

type VisitFilters = {
  date?: string
  studyCode?: string
  doctor?: string
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value
}

@Injectable()
export class VisitsService {
  constructor(
    @InjectRepository(Visit)
    private readonly visits: Repository<Visit>,
    private readonly visitProcedures: VisitProceduresService,
  ) {}

  findAll(filters: VisitFilters) {
    if (filters.date && !isValidDate(filters.date)) {
      throw new BadRequestException('date must use the YYYY-MM-DD format')
    }

    const where: FindOptionsWhere<Visit> = {}
    if (filters.date) where.scheduledDate = filters.date
    if (filters.doctor) where.assignedDoctor = filters.doctor
    if (filters.studyCode) where.participant = { studyCode: filters.studyCode }

    return this.visits.find({
      where,
      relations: { participant: true },
      order: { scheduledDate: 'ASC', scheduledTime: 'ASC' },
    })
  }

  async findOne(id: string) {
    const visit = await this.visits.findOne({
      where: { id },
      relations: { participant: true },
    })

    if (!visit) {
      throw new NotFoundException(`Visit ${id} was not found`)
    }

    return visit
  }

  async registerArrival(id: string) {
    const visit = await this.visits.findOne({
      where: { id },
      relations: { participant: true },
    })

    if (!visit) {
      throw new NotFoundException(`Visit ${id} was not found`)
    }

    if (visit.status === VisitStatus.NO_SHOW || visit.status === VisitStatus.COMPLETED) {
      throw new ConflictException(`Cannot register arrival for a ${visit.status} visit`)
    }

    if (visit.arrivalAt) return visit

    if (visit.status !== VisitStatus.SCHEDULED) {
      throw new ConflictException(`Cannot register arrival for a ${visit.status} visit`)
    }

    visit.arrivalAt = new Date()
    visit.status = VisitStatus.PRESENT
    const savedVisit = await this.visits.save(visit)
    await this.visitProcedures.refreshProcedureReadiness(savedVisit.id)
    return savedVisit
  }
}