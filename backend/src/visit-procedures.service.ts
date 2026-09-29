import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { Visit, VisitStatus } from './visit.entity'
import {
  TimeCaptureMode,
  VisitProcedure,
  VisitProcedureStatus,
} from './visit-procedure.entity'

type CompleteVisitProcedureBody = {
  performedAt?: string
  recordedBy?: string
}

@Injectable()
export class VisitProceduresService {
  constructor(
    @InjectRepository(VisitProcedure)
    private readonly procedures: Repository<VisitProcedure>,
    @InjectRepository(Visit)
    private readonly visits: Repository<Visit>,
    private readonly dataSource: DataSource,
  ) {}

  async findForVisit(visitId: string) {
    const visitExists = await this.visits.existsBy({ id: visitId })
    if (!visitExists) throw new NotFoundException(`Visit ${visitId} was not found`)

    return this.procedures.find({
      where: { visit: { id: visitId } },
      order: { sortOrder: 'ASC' },
    })
  }

  async findOne(id: string) {
    const procedure = await this.procedures.findOne({
      where: { id },
      relations: { visit: true },
    })
    if (!procedure) throw new NotFoundException(`Visit procedure ${id} was not found`)
    return procedure
  }

  async start(id: string) {
    const procedure = await this.procedures.findOne({
      where: { id },
      relations: { visit: true },
    })
    if (!procedure) throw new NotFoundException(`Visit procedure ${id} was not found`)
    if (procedure.status !== VisitProcedureStatus.READY) {
      throw new ConflictException(`Only READY procedures can start; current status is ${procedure.status}`)
    }

    procedure.status = VisitProcedureStatus.IN_PROGRESS
    procedure.startedAt = new Date()
    const saved = await this.procedures.save(procedure)
    await this.refreshProcedureReadiness(procedure.visit.id)
    return this.findOne(saved.id)
  }

  async complete(id: string, body?: CompleteVisitProcedureBody) {
    const procedure = await this.procedures.findOne({
      where: { id },
      relations: { visit: true },
    })
    if (!procedure) throw new NotFoundException(`Visit procedure ${id} was not found`)
    if (
      procedure.status !== VisitProcedureStatus.IN_PROGRESS &&
      procedure.status !== VisitProcedureStatus.READY
    ) {
      throw new ConflictException(`Only READY or IN_PROGRESS procedures can complete; current status is ${procedure.status}`)
    }
    if (body?.recordedBy !== undefined && (typeof body.recordedBy !== 'string' || body.recordedBy.length > 120)) {
      throw new BadRequestException('recordedBy must be a string of at most 120 characters')
    }

    let performedAt: Date | null = null
    if (procedure.timeCaptureMode === TimeCaptureMode.REQUIRED && !body?.performedAt) {
      throw new BadRequestException('performedAt is required for this procedure')
    }

    if (
      procedure.timeCaptureMode !== TimeCaptureMode.NONE &&
      body?.performedAt !== undefined
    ) {
      const isoTimestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/
      if (
        typeof body.performedAt !== 'string' ||
        !isoTimestamp.test(body.performedAt) ||
        Number.isNaN(Date.parse(body.performedAt))
      ) {
        throw new BadRequestException('performedAt must be a valid ISO timestamp')
      }
      performedAt = new Date(body.performedAt)
    }

    const recordedAt = new Date()
    procedure.status = VisitProcedureStatus.COMPLETED
    procedure.completedAt = recordedAt
    procedure.performedAt = performedAt
    procedure.recordedAt = recordedAt
    procedure.recordedBy = body?.recordedBy?.trim() || null
    const saved = await this.procedures.save(procedure)
    await this.refreshProcedureReadiness(procedure.visit.id)
    return this.findOne(saved.id)
  }

  async refreshProcedureReadiness(visitId: string) {
    const visit = await this.visits.findOneBy({ id: visitId })
    if (!visit) throw new NotFoundException(`Visit ${visitId} was not found`)
    if (visit.status !== VisitStatus.PRESENT && visit.status !== VisitStatus.IN_PROGRESS) return

    await this.dataSource.transaction(async (manager) => {
      const procedureRepository = manager.getRepository(VisitProcedure)
      const procedures = await procedureRepository.find({
        where: { visit: { id: visitId } },
        order: { sortOrder: 'ASC' },
      })
      const byCode = new Map(procedures.map((procedure) => [procedure.code, procedure]))

      for (const procedure of procedures) {
        if (
          procedure.status === VisitProcedureStatus.COMPLETED ||
          procedure.status === VisitProcedureStatus.IN_PROGRESS ||
          procedure.status === VisitProcedureStatus.NOT_APPLICABLE
        ) {
          continue
        }

        const missingCodes = procedure.dependsOnCodes.filter(
          (code) => byCode.get(code)?.status !== VisitProcedureStatus.COMPLETED,
        )

        if (missingCodes.length === 0) {
          procedure.status = VisitProcedureStatus.READY
          procedure.blockedReason = null
        } else {
          procedure.status = VisitProcedureStatus.BLOCKED
          procedure.blockedReason = `Pendiente: ${missingCodes.join(', ')}`
        }

        await procedureRepository.save(procedure)
      }
    })
  }
}