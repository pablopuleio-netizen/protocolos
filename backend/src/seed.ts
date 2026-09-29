import { DataSource } from 'typeorm'
import { Participant } from './participant.entity'
import { SystemCheck } from './system-check.entity'
import { Visit, VisitStatus } from './visit.entity'

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
    entities: [SystemCheck, Participant, Visit],
    synchronize: true,
  })

  await dataSource.initialize()

  try {
    await dataSource.synchronize()

    const participants = dataSource.getRepository(Participant)
    const visits = dataSource.getRepository(Visit)
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

    console.log(`Seed complete: ${participantByCode.size} participants, ${createdVisits} visits created for ${scheduledDate}`)
  } finally {
    await dataSource.destroy()
  }
}

void seed().catch((error: unknown) => {
  console.error('Development seed failed:', error)
  process.exitCode = 1
})