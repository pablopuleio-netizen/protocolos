import { DataSource } from 'typeorm'
import { Participant } from './participant.entity'
import { SystemCheck } from './system-check.entity'
import { Visit, VisitStatus } from './visit.entity'
import {
  VisitProcedure,
  VisitProcedureCategory,
  VisitProcedureResponsibleRole,
  VisitProcedureStatus,
  TimeCaptureMode,
} from './visit-procedure.entity'

type ProcedureDefinition = {
  code: string
  name: string
  category: VisitProcedureCategory
  responsibleRole: VisitProcedureResponsibleRole
  timeCaptureMode?: TimeCaptureMode
  dependsOnCodes?: string[]
}

const clinical = VisitProcedureCategory.CLINICAL
const questionnaire = VisitProcedureCategory.QUESTIONNAIRE
const ip = VisitProcedureCategory.IP
const iwrs = VisitProcedureCategory.IWRS
const doctor = VisitProcedureResponsibleRole.DOCTOR
const coordinator = VisitProcedureResponsibleRole.STUDY_COORDINATOR
const shared = VisitProcedureResponsibleRole.SHARED
const lab = VisitProcedureResponsibleRole.LAB
const ecgTech = VisitProcedureResponsibleRole.ECG_TECH

const proceduresByVisitCode: Record<string, ProcedureDefinition[]> = {
  V3: [
    { code: 'FASTING', name: 'Confirmación de ayuno', category: clinical, responsibleRole: shared },
    { code: 'ELIGIBILITY', name: 'Confirmación final de criterios de inclusión/exclusión', category: clinical, responsibleRole: doctor },
    { code: 'CONMED_AE', name: 'Medicación concomitante y eventos adversos', category: clinical, responsibleRole: doctor },
    { code: 'ANTHROPOMETRY', name: 'Peso y circunferencia de cintura', category: clinical, responsibleRole: shared },
    { code: 'VITALS', name: 'Signos vitales / TA protocolaria', category: clinical, responsibleRole: doctor, timeCaptureMode: TimeCaptureMode.REQUIRED },
    { code: 'PHYSICAL_EVAL', name: 'Evaluación física dirigida a síntomas', category: clinical, responsibleRole: doctor },
    { code: 'ECG', name: 'ECG de 12 derivaciones', category: VisitProcedureCategory.ECG, responsibleRole: ecgTech, timeCaptureMode: TimeCaptureMode.REQUIRED, dependsOnCodes: ['VITALS'] },
    { code: 'BASELINE_IMAGING', name: 'Confirmar DXA basal / MRI-AMRA / BIA según corresponda', category: VisitProcedureCategory.IMAGING, responsibleRole: shared, timeCaptureMode: TimeCaptureMode.OPTIONAL },
    { code: 'BASELINE_PRO', name: 'PRO basales según SoA (IWQOL-Lite-CT, EQ-5D-5L, EBAQ-17, FNQ, PGIS peso/función física, WSBQ, HCRU)', category: questionnaire, responsibleRole: doctor },
    { code: 'PHQ9', name: 'PHQ-9', category: questionnaire, responsibleRole: doctor },
    { code: 'CSSRS', name: 'C-SSRS desde última evaluación', category: questionnaire, responsibleRole: doctor, dependsOnCodes: ['CONMED_AE', 'PHQ9'] },
    { code: 'LIFESTYLE', name: 'Asesoramiento programa de estilo de vida', category: clinical, responsibleRole: doctor },
    { code: 'LAB', name: 'Laboratorio central / muestras basales según SoA', category: VisitProcedureCategory.LABORATORY, responsibleRole: lab, timeCaptureMode: TimeCaptureMode.REQUIRED, dependsOnCodes: ['VITALS'] },
    { code: 'IWRS_RANDOMIZATION', name: 'IWRS / Randomización', category: iwrs, responsibleRole: coordinator, timeCaptureMode: TimeCaptureMode.REQUIRED },
    { code: 'IP_DISPENSE', name: 'Dispensa de intervención del estudio', category: ip, responsibleRole: coordinator, dependsOnCodes: ['IWRS_RANDOMIZATION'] },
    { code: 'FIRST_DOSE', name: 'Primera dosis de intervención del estudio', category: ip, responsibleRole: doctor, timeCaptureMode: TimeCaptureMode.REQUIRED, dependsOnCodes: ['IP_DISPENSE'] },
  ],
  V5: [
    { code: 'FASTING', name: 'Confirmación de ayuno', category: clinical, responsibleRole: shared },
    { code: 'CONMED_AE', name: 'Medicación concomitante y eventos adversos', category: clinical, responsibleRole: doctor },
    { code: 'ANTHROPOMETRY', name: 'Peso y circunferencia de cintura', category: clinical, responsibleRole: shared },
    { code: 'VITALS', name: 'Signos vitales / TA protocolaria', category: clinical, responsibleRole: doctor, timeCaptureMode: TimeCaptureMode.REQUIRED },
    { code: 'PHYSICAL_EVAL', name: 'Evaluación dirigida a síntomas', category: clinical, responsibleRole: doctor },
    { code: 'EBAQ_FNQ', name: 'EBAQ-17 y FNQ', category: questionnaire, responsibleRole: doctor },
    { code: 'PHQ9', name: 'PHQ-9', category: questionnaire, responsibleRole: doctor },
    { code: 'CSSRS', name: 'C-SSRS desde última evaluación', category: questionnaire, responsibleRole: doctor, dependsOnCodes: ['CONMED_AE', 'PHQ9'] },
    { code: 'LIFESTYLE', name: 'Asesoramiento programa de estilo de vida', category: clinical, responsibleRole: doctor },
    { code: 'LAB', name: 'Laboratorio / química clínica según SoA', category: VisitProcedureCategory.LABORATORY, responsibleRole: lab, timeCaptureMode: TimeCaptureMode.REQUIRED, dependsOnCodes: ['VITALS'] },
    { code: 'IP_RETURN', name: 'Devolución de intervención no utilizada', category: ip, responsibleRole: coordinator },
    { code: 'ADHERENCE', name: 'Evaluación y documentación de adherencia', category: ip, responsibleRole: coordinator },
    { code: 'DOSE_DECISION', name: 'Evaluación de tolerabilidad / decisión de dosis', category: clinical, responsibleRole: doctor },
    { code: 'IWRS', name: 'Registro / gestión IWRS', category: iwrs, responsibleRole: coordinator, timeCaptureMode: TimeCaptureMode.OPTIONAL },
    { code: 'IP_DISPENSE', name: 'Dispensa de intervención del estudio', category: ip, responsibleRole: coordinator, dependsOnCodes: ['IWRS'] },
  ],
  V7: [
    { code: 'FASTING', name: 'Confirmación de ayuno', category: clinical, responsibleRole: shared },
    { code: 'CONMED_AE', name: 'Medicación concomitante y eventos adversos', category: clinical, responsibleRole: doctor },
    { code: 'ANTHROPOMETRY', name: 'Peso y circunferencia de cintura', category: clinical, responsibleRole: shared },
    { code: 'VITALS', name: 'Signos vitales / TA protocolaria', category: clinical, responsibleRole: doctor, timeCaptureMode: TimeCaptureMode.REQUIRED },
    { code: 'PHYSICAL_EVAL', name: 'Evaluación física dirigida a síntomas', category: clinical, responsibleRole: doctor },
    { code: 'EBAQ_FNQ', name: 'EBAQ-17 y FNQ', category: questionnaire, responsibleRole: doctor },
    { code: 'PHQ9', name: 'PHQ-9', category: questionnaire, responsibleRole: doctor },
    { code: 'CSSRS', name: 'C-SSRS desde última evaluación', category: questionnaire, responsibleRole: doctor, dependsOnCodes: ['CONMED_AE', 'PHQ9'] },
    { code: 'LIFESTYLE', name: 'Asesoramiento programa de estilo de vida', category: clinical, responsibleRole: doctor },
    { code: 'IP_RETURN', name: 'Devolución de intervención no utilizada', category: ip, responsibleRole: coordinator },
    { code: 'ADHERENCE', name: 'Evaluación y documentación de adherencia', category: ip, responsibleRole: coordinator },
    { code: 'DOSE_DECISION', name: 'Evaluación de tolerabilidad / mantenimiento de dosis', category: clinical, responsibleRole: doctor },
    { code: 'IWRS', name: 'Registro / gestión IWRS', category: iwrs, responsibleRole: coordinator, timeCaptureMode: TimeCaptureMode.OPTIONAL },
    { code: 'IP_DISPENSE', name: 'Dispensa de intervención del estudio', category: ip, responsibleRole: coordinator, dependsOnCodes: ['IWRS'] },
  ],
}

function initialProcedureStatus(visit: Visit, dependsOnCodes: string[]) {
  if (visit.status === VisitStatus.SCHEDULED) {
    return dependsOnCodes.length > 0
      ? VisitProcedureStatus.BLOCKED
      : VisitProcedureStatus.PENDING
  }
  if (dependsOnCodes.length > 0) return VisitProcedureStatus.BLOCKED
  if (visit.status === VisitStatus.PRESENT || visit.status === VisitStatus.IN_PROGRESS) {
    return VisitProcedureStatus.READY
  }
  return VisitProcedureStatus.PENDING
}

function localDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('The development seed cannot run in production')
  }

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 5432),
    database: process.env.DATABASE_NAME ?? 'cemedic',
    username: process.env.DATABASE_USER ?? 'cemedic',
    password: process.env.DATABASE_PASSWORD ?? 'cemedic_dev',
    entities: [SystemCheck, Participant, Visit, VisitProcedure],
    synchronize: true,
  })

  await dataSource.initialize()

  try {
    await dataSource.synchronize()

    const participants = dataSource.getRepository(Participant)
    const visits = dataSource.getRepository(Visit)
    const procedures = dataSource.getRepository(VisitProcedure)
    const participantCodes = ['ARG005-001', 'ARG005-008', 'ARG005-014', 'ARG005-006']
    const participantByCode = new Map<string, Participant>()

    for (const code of participantCodes) {
      let participant = await participants.findOneBy({ code, studyCode: 'GZVA' })
      if (!participant) {
        participant = await participants.save(
          participants.create({ code, studyCode: 'GZVA', active: true }),
        )
      }
      participantByCode.set(code, participant)
    }

    const today = new Date()
    const scheduledDate = localDateString(today)
    const arrivalAt = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      9,
      35,
    )

    const demoVisits = [
      {
        participantCode: 'ARG005-001',
        visitCode: 'V3',
        scheduledTime: '08:00:00',
        assignedDoctor: 'Dr. Puleio',
        room: 'Consultorio 2',
        status: VisitStatus.SCHEDULED,
        arrivalAt: null,
      },
      {
        participantCode: 'ARG005-008',
        visitCode: 'V5',
        scheduledTime: '09:30:00',
        assignedDoctor: 'Dr. Pérez',
        room: 'Consultorio 1',
        status: VisitStatus.PRESENT,
        arrivalAt,
      },
      {
        participantCode: 'ARG005-014',
        visitCode: 'V3',
        scheduledTime: '10:00:00',
        assignedDoctor: 'Dr. Puleio',
        room: 'Consultorio 3',
        status: VisitStatus.SCHEDULED,
        arrivalAt: null,
      },
      {
        participantCode: 'ARG005-006',
        visitCode: 'V7',
        scheduledTime: '14:00:00',
        assignedDoctor: 'Dr. Gómez',
        room: 'Consultorio 1',
        status: VisitStatus.SCHEDULED,
        arrivalAt: null,
      },
    ]

    let createdVisits = 0
    for (const demoVisit of demoVisits) {
      const participant = participantByCode.get(demoVisit.participantCode)
      if (!participant) throw new Error(`Missing participant ${demoVisit.participantCode}`)

      const existingVisit = await visits.findOne({
        where: { participant: { id: participant.id }, visitCode: demoVisit.visitCode, scheduledDate },
      })
      if (existingVisit) continue

      await visits.save(
        visits.create({
          participant,
          visitCode: demoVisit.visitCode,
          scheduledDate,
          scheduledTime: demoVisit.scheduledTime,
          assignedDoctor: demoVisit.assignedDoctor,
          room: demoVisit.room,
          status: demoVisit.status,
          arrivalAt: demoVisit.arrivalAt,
          startedAt: null,
          completedAt: null,
        }),
      )
      createdVisits += 1
    }

    const gzvaVisits = await visits.find({
      where: { participant: { studyCode: 'GZVA' } },
      relations: { participant: true },
      order: { scheduledDate: 'ASC', scheduledTime: 'ASC' },
    })
    const demoParticipantCodes = new Set(participantCodes)
    let createdProcedures = 0
    let updatedProcedures = 0
    let deletedProcedures = 0

    for (const visit of gzvaVisits) {
      const definitions = proceduresByVisitCode[visit.visitCode]
      if (!definitions || !demoParticipantCodes.has(visit.participant.code)) continue

      const expectedCodes = new Set(definitions.map((definition) => definition.code))
      const existingForVisit = await procedures.find({ where: { visit: { id: visit.id } } })
      const obsoleteProcedures = existingForVisit.filter(
        (procedure) => !expectedCodes.has(procedure.code),
      )

      if (obsoleteProcedures.length > 0) {
        await procedures.remove(obsoleteProcedures)
        deletedProcedures += obsoleteProcedures.length
      }

      const existingByCode = new Map(
        existingForVisit
          .filter((procedure) => expectedCodes.has(procedure.code))
          .map((procedure) => [procedure.code, procedure]),
      )

      for (const [index, definition] of definitions.entries()) {
        const timeCaptureMode = definition.timeCaptureMode ?? TimeCaptureMode.NONE
        const dependsOnCodes = definition.dependsOnCodes ?? []
        const existingProcedure = existingByCode.get(definition.code)

        if (existingProcedure) {
          const configurationChanged =
            existingProcedure.name !== definition.name ||
            existingProcedure.category !== definition.category ||
            existingProcedure.responsibleRole !== definition.responsibleRole ||
            existingProcedure.sortOrder !== index + 1 ||
            existingProcedure.timeCaptureMode !== timeCaptureMode ||
            JSON.stringify(existingProcedure.dependsOnCodes) !== JSON.stringify(dependsOnCodes)

          if (configurationChanged) {
            existingProcedure.name = definition.name
            existingProcedure.category = definition.category
            existingProcedure.responsibleRole = definition.responsibleRole
            existingProcedure.sortOrder = index + 1
            existingProcedure.timeCaptureMode = timeCaptureMode
            existingProcedure.dependsOnCodes = dependsOnCodes
            await procedures.save(existingProcedure)
            updatedProcedures += 1
          }
          continue
        }

        const status = initialProcedureStatus(visit, dependsOnCodes)
        const createdProcedure = await procedures.save(
          procedures.create({
            visit,
            code: definition.code,
            name: definition.name,
            category: definition.category,
            responsibleRole: definition.responsibleRole,
            timeCaptureMode,
            status,
            sortOrder: index + 1,
            blockedReason: status === VisitProcedureStatus.BLOCKED
              ? `Pendiente: ${dependsOnCodes.join(', ')}`
              : null,
            dependsOnCodes,
            startedAt: null,
            completedAt: null,
            performedAt: null,
            recordedAt: null,
            recordedBy: null,
            correctionReason: null,
          }),
        )
        existingByCode.set(createdProcedure.code, createdProcedure)
        createdProcedures += 1
      }

      if (visit.status === VisitStatus.PRESENT || visit.status === VisitStatus.IN_PROGRESS || visit.status === VisitStatus.SCHEDULED) {
        for (const procedure of existingByCode.values()) {
          if (
            procedure.status === VisitProcedureStatus.COMPLETED ||
            procedure.status === VisitProcedureStatus.IN_PROGRESS ||
            procedure.status === VisitProcedureStatus.NOT_APPLICABLE
          ) {
            continue
          }

          const missingCodes = procedure.dependsOnCodes.filter(
            (code) => existingByCode.get(code)?.status !== VisitProcedureStatus.COMPLETED,
          )
          let nextStatus: VisitProcedureStatus
          let blockedReason: string | null

          if (visit.status === VisitStatus.SCHEDULED) {
            nextStatus = missingCodes.length > 0
              ? VisitProcedureStatus.BLOCKED
              : VisitProcedureStatus.PENDING
            blockedReason = missingCodes.length > 0
              ? `Pendiente: ${missingCodes.join(', ')}`
              : null
          } else {
            nextStatus = missingCodes.length > 0
              ? VisitProcedureStatus.BLOCKED
              : VisitProcedureStatus.READY
            blockedReason = missingCodes.length > 0
              ? `Pendiente: ${missingCodes.join(', ')}`
              : null
          }

          if (procedure.status !== nextStatus || procedure.blockedReason !== blockedReason) {
            procedure.status = nextStatus
            procedure.blockedReason = blockedReason
            await procedures.save(procedure)
            updatedProcedures += 1
          }
        }
      }
    }

    console.log(
      `Seed complete: ${participantByCode.size} participants, ${createdVisits} visits, ${createdProcedures} procedures created, ${updatedProcedures} updated, ${deletedProcedures} removed`,
    )
  } finally {
    await dataSource.destroy()
  }
}

void seed().catch((error: unknown) => {
  console.error('Development seed failed:', error)
  process.exitCode = 1
})