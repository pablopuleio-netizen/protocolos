import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config/api'

type Participant = {
  id: string
  code: string
  studyCode: string
}

type VisitStatus = 'SCHEDULED' | 'PRESENT' | 'IN_PROGRESS' | 'NO_SHOW' | 'COMPLETED'

type Visit = {
  id: string
  participant: Participant
  visitCode: string
  scheduledDate: string
  scheduledTime: string
  assignedDoctor: string
  room: string | null
  status: VisitStatus
  arrivalAt: string | null
  startedAt: string | null
  completedAt: string | null
}

type VisitView = {
  text: string
  className: string
  alert?: 'demora' | 'espera'
  minutes?: number
}

type StudyCoordinatorProps = {
  onVolver: () => void
}

type Procedimiento = {
  nombre: string
  responsable: string
  estado: 'realizado' | 'habilitado' | 'bloqueado'
  motivo?: string
  hora?: string
}

export default function StudyCoordinator({
  onVolver,
}: StudyCoordinatorProps) {
  const [visitas, setVisitas] = useState<Visit[]>([])
  const [visitaAbierta, setVisitaAbierta] = useState<Visit | null>(null)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [reintento, setReintento] = useState(0)
  const [ahora, setAhora] = useState(() => Date.now())

  useEffect(() => {
    const controller = new AbortController()
    const currentDate = new Date()
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const day = String(currentDate.getDate()).padStart(2, '0')
    const localDate = `${year}-${month}-${day}`

    async function cargarVisitas() {
      setCargando(true)
      setErrorCarga(false)

      try {
        if (!API_BASE_URL) throw new Error('API URL no configurada')

        const response = await fetch(`${API_BASE_URL}/visits?date=${localDate}`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('No se pudieron cargar las visitas')

        const data = (await response.json()) as Visit[]
        setVisitas(
          data.sort((first, second) =>
            first.scheduledTime.localeCompare(second.scheduledTime),
          ),
        )
      } catch {
        if (!controller.signal.aborted) setErrorCarga(true)
      } finally {
        if (!controller.signal.aborted) setCargando(false)
      }
    }

    void cargarVisitas()
    return () => controller.abort()
  }, [reintento])

  useEffect(() => {
    const intervalId = window.setInterval(() => setAhora(Date.now()), 60_000)
    return () => window.clearInterval(intervalId)
  }, [])

  function estadoVisita(visita: Visit): VisitView {
    if (visita.status === 'SCHEDULED') {
      const [year, month, day] = visita.scheduledDate.split('-').map(Number)
      const [hour, minute] = visita.scheduledTime.split(':').map(Number)
      const scheduledAt = new Date(year, month - 1, day, hour, minute).getTime()
      const minutes = Math.floor((ahora - scheduledAt) / 60_000)
      if (minutes > 30) {
        return { text: `Demorado · ${minutes} min`, className: 'estado-demorado', alert: 'demora', minutes }
      }
      return { text: 'Esperado', className: 'estado-esperado' }
    }

    if (visita.status === 'PRESENT') {
      if (visita.arrivalAt) {
        const minutes = Math.max(0, Math.floor((ahora - new Date(visita.arrivalAt).getTime()) / 60_000))
        if (minutes > 30) {
          return { text: `Espera prolongada · ${minutes} min`, className: 'estado-espera', alert: 'espera', minutes }
        }
        return { text: `Presente · espera ${minutes} min`, className: 'estado-presente' }
      }
      return { text: 'Presente', className: 'estado-presente' }
    }

    if (visita.status === 'IN_PROGRESS') return { text: 'En curso', className: 'estado-en_curso' }
    if (visita.status === 'NO_SHOW') return { text: 'No asistió', className: 'estado-no_show' }
    return { text: 'Completado', className: 'estado-completado' }
  }

  const alertas = visitas.flatMap((visita) => {
    const state = estadoVisita(visita)
    if (!state.alert) return []
    const personVisit = `${visita.participant.code} · ${visita.visitCode}`
    return [{
      tipo: state.alert === 'demora' ? 'espera' : 'espera',
      texto: state.alert === 'demora'
        ? `${personVisit} lleva ${state.minutes} min demorado`
        : `${personVisit} lleva ${state.minutes} min presente sin iniciar`,
    }]
  })

  const visitasPresentes = visitas.filter((visita) => visita.status === 'PRESENT').length
  const visitasEnCurso = visitas.filter((visita) => visita.status === 'IN_PROGRESS').length

  const procedimientosPorVisita: Record<string, Procedimiento[]> = {
    V3: [
      {
        nombre: 'Confirmación de ayuno',
        responsable: 'Médico',
        estado: 'realizado',
        hora: '08:12',
      },
      {
        nombre: 'Elegibilidad final I/E',
        responsable: 'Médico',
        estado: 'realizado',
        hora: '08:15',
      },
      {
        nombre: 'Medicación concomitante y eventos adversos',
        responsable: 'Médico',
        estado: 'realizado',
        hora: '08:20',
      },
      {
        nombre: 'Peso, cintura y signos vitales',
        responsable: 'Médico',
        estado: 'habilitado',
      },
      {
        nombre: 'Evaluación física dirigida',
        responsable: 'Médico',
        estado: 'habilitado',
      },
      {
        nombre: 'ECG',
        responsable: 'ECG',
        estado: 'bloqueado',
        motivo: 'Realizar después de signos vitales',
      },
      {
        nombre: 'PRO basales',
        responsable: 'Médico / eCOA',
        estado: 'habilitado',
      },
      {
        nombre: 'PHQ-9',
        responsable: 'Médico / eCOA',
        estado: 'habilitado',
      },
      {
        nombre: 'C-SSRS',
        responsable: 'Médico / eCOA',
        estado: 'bloqueado',
        motivo: 'AEs deben estar revisados y PHQ-9 debe preceder a C-SSRS',
      },
      {
        nombre: 'DXA basal / MRI-AMRA / BIA según corresponda',
        responsable: 'Study Coordinator',
        estado: 'habilitado',
      },
      {
        nombre: 'Laboratorio y muestras basales',
        responsable: 'Laboratorio',
        estado: 'bloqueado',
        motivo: 'Realizar después de signos vitales',
      },
      {
        nombre: 'Asesoramiento de estilo de vida',
        responsable: 'Médico',
        estado: 'habilitado',
      },
      {
        nombre: 'IWRS y randomización',
        responsable: 'Study Coordinator',
        estado: 'bloqueado',
        motivo: 'Requiere elegibilidad final y procedimientos basales completos',
      },
      {
        nombre: 'Dispensa de IP',
        responsable: 'Study Coordinator',
        estado: 'bloqueado',
        motivo: 'Randomización/IWRS pendiente',
      },
      {
        nombre: 'Primera dosis',
        responsable: 'Médico / Study Coordinator',
        estado: 'bloqueado',
        motivo: 'Debe administrarse al final de la visita',
      },
    ],

    V5: [
      {
        nombre: 'Confirmación de ayuno',
        responsable: 'Médico',
        estado: 'realizado',
        hora: '09:38',
      },
      {
        nombre: 'Medicación concomitante y eventos adversos',
        responsable: 'Médico',
        estado: 'realizado',
        hora: '09:42',
      },
      {
        nombre: 'Peso, cintura y signos vitales',
        responsable: 'Médico',
        estado: 'habilitado',
      },
      {
        nombre: 'Evaluación dirigida a síntomas',
        responsable: 'Médico',
        estado: 'habilitado',
      },
      {
        nombre: 'EBAQ-17 y FNQ',
        responsable: 'Médico / eCOA',
        estado: 'habilitado',
      },
      {
        nombre: 'PHQ-9',
        responsable: 'Médico / eCOA',
        estado: 'habilitado',
      },
      {
        nombre: 'C-SSRS',
        responsable: 'Médico / eCOA',
        estado: 'bloqueado',
        motivo: 'AEs deben estar revisados y PHQ-9 debe preceder a C-SSRS',
      },
      {
        nombre: 'Laboratorio según SoA',
        responsable: 'Laboratorio',
        estado: 'bloqueado',
        motivo: 'Realizar después de signos vitales',
      },
      {
        nombre: 'Asesoramiento de estilo de vida',
        responsable: 'Médico',
        estado: 'habilitado',
      },
      {
        nombre: 'Devolución de IP y accountability',
        responsable: 'Study Coordinator',
        estado: 'habilitado',
      },
      {
        nombre: 'Evaluación de adherencia',
        responsable: 'Study Coordinator',
        estado: 'habilitado',
      },
      {
        nombre: 'Tolerabilidad y decisión de dosis',
        responsable: 'Médico',
        estado: 'bloqueado',
        motivo: 'Requiere evaluación clínica de la visita',
      },
      {
        nombre: 'IWRS',
        responsable: 'Study Coordinator',
        estado: 'bloqueado',
        motivo: 'Requiere decisión médica de continuidad/dosis',
      },
      {
        nombre: 'Dispensa de IP',
        responsable: 'Study Coordinator',
        estado: 'bloqueado',
        motivo: 'IWRS pendiente',
      },
    ],

    V7: [
      {
        nombre: 'Confirmación de ayuno',
        responsable: 'Médico',
        estado: 'habilitado',
      },
      {
        nombre: 'Medicación concomitante y eventos adversos',
        responsable: 'Médico',
        estado: 'habilitado',
      },
      {
        nombre: 'Peso, cintura y signos vitales',
        responsable: 'Médico',
        estado: 'bloqueado',
        motivo: 'Paciente debe estar presente y comenzar evaluación',
      },
      {
        nombre: 'Evaluación dirigida',
        responsable: 'Médico',
        estado: 'bloqueado',
        motivo: 'Pendiente inicio de evaluación clínica',
      },
      {
        nombre: 'EBAQ-17 y FNQ',
        responsable: 'Médico / eCOA',
        estado: 'bloqueado',
        motivo: 'Pendiente inicio de visita',
      },
      {
        nombre: 'PHQ-9',
        responsable: 'Médico / eCOA',
        estado: 'bloqueado',
        motivo: 'Pendiente inicio de visita',
      },
      {
        nombre: 'C-SSRS',
        responsable: 'Médico / eCOA',
        estado: 'bloqueado',
        motivo: 'AEs deben estar revisados y PHQ-9 debe preceder a C-SSRS',
      },
      {
        nombre: 'Asesoramiento de estilo de vida',
        responsable: 'Médico',
        estado: 'bloqueado',
        motivo: 'Pendiente evaluación clínica',
      },
      {
        nombre: 'Devolución de IP y accountability',
        responsable: 'Study Coordinator',
        estado: 'bloqueado',
        motivo: 'Pendiente recepción del paciente',
      },
      {
        nombre: 'Evaluación de adherencia',
        responsable: 'Study Coordinator',
        estado: 'bloqueado',
        motivo: 'Pendiente devolución/accountability',
      },
      {
        nombre: 'Tolerabilidad y decisión de dosis',
        responsable: 'Médico',
        estado: 'bloqueado',
        motivo: 'Requiere evaluación clínica',
      },
      {
        nombre: 'IWRS y dispensa',
        responsable: 'Study Coordinator',
        estado: 'bloqueado',
        motivo: 'Requiere autorización médica',
      },
    ],
  }

  const procedimientosActuales =
    procedimientosPorVisita[visitaAbierta?.visitCode ?? ''] ?? []

  function claseProcedimiento(estado: Procedimiento['estado']) {
    if (estado === 'realizado') return 'proc-realizado'
    if (estado === 'habilitado') return 'proc-habilitado'
    return 'proc-bloqueado'
  }

  function textoProcedimiento(estado: Procedimiento['estado']) {
    if (estado === 'realizado') return 'Realizado'
    if (estado === 'habilitado') return 'Puede avanzar'
    return 'Bloqueado'
  }

  if (visitaAbierta) {
    return (
      <>
        <style>{`
          .detalle-app {
            min-height: 100vh;
            background: #f4f7fb;
            color: #14213d;
          }

          .detalle-header {
            background: linear-gradient(90deg, #073763, #0a4f86);
            color: white;
            padding: 20px 32px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
          }

          .detalle-header h1 {
            margin: 0;
            font-size: 25px;
          }

          .detalle-header p {
            margin: 4px 0 0;
            opacity: .8;
          }

          .detalle-volver {
            background: rgba(255,255,255,.15);
            border: 1px solid rgba(255,255,255,.35);
            color: white;
            border-radius: 8px;
            padding: 9px 14px;
            cursor: pointer;
            font-weight: 600;
          }

          .detalle-content {
            max-width: 1380px;
            margin: auto;
            padding: 28px;
          }

          .detalle-resumen {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 22px;
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 18px;
            margin-bottom: 22px;
          }

          .dato-label {
            font-size: 12px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: .4px;
          }

          .dato-valor {
            margin-top: 5px;
            font-size: 17px;
            font-weight: 700;
          }

          .detalle-layout {
            display: grid;
            grid-template-columns: minmax(0, 2fr) 360px;
            gap: 22px;
          }

          .detalle-panel {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 22px;
          }

          .detalle-panel h2 {
            margin: 0 0 18px;
            font-size: 21px;
          }

          .procedimiento {
            display: grid;
            grid-template-columns: minmax(0, 1.4fr) 160px 130px;
            gap: 14px;
            align-items: center;
            padding: 15px 0;
            border-bottom: 1px solid #edf0f4;
          }

          .procedimiento:last-child {
            border-bottom: none;
          }

          .proc-nombre {
            font-weight: 700;
          }

          .proc-responsable {
            color: #6b7b8d;
            font-size: 14px;
            margin-top: 4px;
          }

          .proc-estado {
            display: inline-block;
            border-radius: 999px;
            padding: 7px 10px;
            font-size: 12px;
            font-weight: 700;
            text-align: center;
          }

          .proc-realizado {
            background: #e5f5eb;
            color: #237a49;
          }

          .proc-habilitado {
            background: #dff3ff;
            color: #16678f;
          }

          .proc-bloqueado {
            background: #fff1df;
            color: #9a5a08;
          }

          .proc-hora {
            color: #627286;
            font-size: 14px;
          }

          .motivo {
            margin-top: 5px;
            color: #9a5a08;
            font-size: 12px;
            font-weight: 500;
          }

          .side-block {
            padding: 14px 0;
            border-bottom: 1px solid #edf0f4;
          }

          .side-block:last-child {
            border-bottom: none;
          }

          .side-title {
            font-weight: 700;
            margin-bottom: 6px;
          }

          .side-text {
            color: #627286;
            font-size: 14px;
            line-height: 1.45;
          }

          .boton-secundario {
            width: 100%;
            margin-top: 12px;
            border: 1px solid #d6dee8;
            background: white;
            border-radius: 8px;
            padding: 10px 12px;
            cursor: pointer;
            font-weight: 600;
            color: #32465a;
          }

          .boton-secundario:disabled {
            cursor: not-allowed;
            opacity: .58;
          }

          .nota-plantilla {
            margin: -4px 0 16px;
            color: #69788b;
            font-size: 13px;
            line-height: 1.45;
          }

          @media (max-width: 1000px) {
            .detalle-resumen {
              grid-template-columns: repeat(2, 1fr);
            }

            .detalle-layout {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 650px) {
            .detalle-content {
              padding: 15px;
            }

            .procedimiento {
              grid-template-columns: 1fr;
            }
          }
        `}</style>

        <div className="detalle-app">
          <header className="detalle-header">
            <div>
              <h1>
                {visitaAbierta.participant.code} · {visitaAbierta.participant.studyCode} · {visitaAbierta.visitCode}
              </h1>
              <p>Control operativo de visita</p>
            </div>

            <button
              className="detalle-volver"
              onClick={() => setVisitaAbierta(null)}
            >
              ← Volver al flujo
            </button>
          </header>

          <main className="detalle-content">
            <section className="detalle-resumen">
              <div>
                <div className="dato-label">Hora</div>
                <div className="dato-valor">{visitaAbierta.scheduledTime.slice(0, 5)}</div>
              </div>

              <div>
                <div className="dato-label">Médico</div>
                <div className="dato-valor">{visitaAbierta.assignedDoctor}</div>
              </div>

              <div>
                <div className="dato-label">Consultorio</div>
                <div className="dato-valor">{visitaAbierta.room ?? 'Sin asignar'}</div>
              </div>

              <div>
                <div className="dato-label">Estado</div>
                <div className="dato-valor">
                  {estadoVisita(visitaAbierta).text}
                </div>
              </div>

              <div>
                <div className="dato-label">Llegada</div>
                <div className="dato-valor">
                  {visitaAbierta.arrivalAt
                    ? new Date(visitaAbierta.arrivalAt).toLocaleTimeString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })
                    : 'Sin registrar'}
                </div>
              </div>
            </section>

            <div className="detalle-layout">
              <section className="detalle-panel">
                <h2>Procedimientos GZVA · {visitaAbierta.visitCode}</h2>
                <p className="nota-plantilla">
                  Plantilla protocolaria. El estado de los procedimientos se conectará al registro operativo en la siguiente etapa.
                </p>

                {procedimientosActuales.map((procedimiento) => (
                  <div
                    className="procedimiento"
                    key={procedimiento.nombre}
                  >
                    <div>
                      <div className="proc-nombre">
                        {procedimiento.nombre}
                      </div>

                      <div className="proc-responsable">
                        Responsable: {procedimiento.responsable}
                      </div>

                      {procedimiento.motivo && (
                        <div className="motivo">
                          {procedimiento.motivo}
                        </div>
                      )}
                    </div>

                    <div>
                      <span
                        className={`proc-estado ${claseProcedimiento(
                          procedimiento.estado
                        )}`}
                      >
                        {textoProcedimiento(procedimiento.estado)}
                      </span>
                    </div>

                    <div className="proc-hora">
                      {procedimiento.hora
                        ? `Hora: ${procedimiento.hora}`
                        : 'Sin registrar'}
                    </div>
                  </div>
                ))}
                {procedimientosActuales.length === 0 && (
                  <p className="nota-plantilla">No hay plantilla protocolaria configurada para esta visita.</p>
                )}
              </section>

              <aside className="detalle-panel">
                <h2>Control SC</h2>

                <div className="side-block">
                  <div className="side-title">Registro operativo</div>
                  <div className="side-text">
                    Las acciones de coordinación todavía no están conectadas a registros persistentes.
                  </div>
                </div>

                <div className="side-block">
                  <div className="side-title">Visita en PostgreSQL</div>
                  <div className="side-text">
                    {visitaAbierta.status}
                  </div>
                </div>

                <button className="boton-secundario" disabled title="Próximamente">
                  Reasignar médico · Próximamente
                </button>

                <button className="boton-secundario" disabled title="Próximamente">
                  Editar consultorio · Próximamente
                </button>

                <button className="boton-secundario" disabled title="Próximamente">
                  Registrar incidencia · Próximamente
                </button>
              </aside>
            </div>
          </main>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{`
        .sc-app {
          min-height: 100vh;
          background: #f4f7fb;
          color: #14213d;
        }

        .sc-header {
          background: linear-gradient(90deg, #073763, #0a4f86);
          color: white;
          padding: 20px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sc-header h1 {
          margin: 0;
          font-size: 25px;
        }

        .sc-header p {
          margin: 4px 0 0;
          opacity: .8;
        }

        .sc-header-right {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .sc-volver {
          background: rgba(255,255,255,.15);
          border: 1px solid rgba(255,255,255,.35);
          color: white;
          border-radius: 8px;
          padding: 9px 14px;
          cursor: pointer;
          font-weight: 600;
        }

        .sc-content {
          max-width: 1450px;
          margin: auto;
          padding: 28px;
        }

        .sc-indicadores {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .sc-indicador {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 18px 20px;
        }

        .sc-numero {
          font-size: 28px;
          font-weight: 700;
        }

        .sc-label {
          color: #6f7f91;
          margin-top: 4px;
        }

        .sc-layout {
          display: grid;
          grid-template-columns: minmax(0, 2.2fr) 360px;
          gap: 22px;
        }

        .sc-panel {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 22px;
        }

        .sc-panel h2 {
          margin: 0 0 18px;
          font-size: 21px;
        }

        .visita-card {
          border: 1px solid #dfe6ee;
          border-radius: 14px;
          padding: 18px;
          margin-bottom: 16px;
        }

        .visita-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .visita-hora {
          font-size: 20px;
          font-weight: 700;
        }

        .visita-codigo {
          font-size: 18px;
          font-weight: 700;
          margin-top: 4px;
        }

        .muted {
          color: #718096;
          font-size: 14px;
          margin-top: 4px;
        }

        .estado {
          display: inline-block;
          padding: 7px 11px;
          border-radius: 999px;
          font-weight: 600;
          font-size: 13px;
        }

        .estado-presente {
          background: #dff3ff;
          color: #16678f;
        }

        .estado-en_curso {
          background: #e8ddff;
          color: #6240a7;
        }

        .estado-esperado {
          background: #edf2f7;
          color: #526173;
        }

        .estado-demorado,
        .estado-espera {
          background: #fff1df;
          color: #9a5a08;
        }

        .estado-no_show,
        .estado-completado {
          background: #edf0f3;
          color: #526173;
        }

        .visita-llegada {
          margin-top: 7px;
          color: #526173;
          font-size: 13px;
        }

        .sc-mensaje {
          padding: 12px 14px;
          border-radius: 8px;
          margin: 12px 0;
          color: #526173;
          background: #f4f7fb;
          border: 1px solid #e2e8f0;
        }

        .sc-mensaje.error {
          background: #fff0ed;
          color: #843728;
          border-color: #efc2b8;
        }

        .sc-retry {
          margin-top: 9px;
          padding: 8px 12px;
          border: 1px solid #b9d7e8;
          border-radius: 7px;
          background: white;
          color: #17658e;
          cursor: pointer;
          font-weight: 600;
        }

        .boton:disabled {
          cursor: not-allowed;
          opacity: .58;
        }

        .progreso-wrap {
          margin-top: 16px;
        }

        .progreso-info {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #66788a;
          margin-bottom: 6px;
        }

        .progreso {
          height: 8px;
          background: #edf1f5;
          border-radius: 999px;
          overflow: hidden;
        }

        .progreso-barra {
          height: 100%;
          background: #1187d1;
          border-radius: 999px;
        }

        .acciones {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-top: 17px;
        }

        .bloque {
          border-radius: 10px;
          padding: 13px;
          background: #f8fafc;
          border: 1px solid #e6ebf1;
        }

        .bloque-titulo {
          font-weight: 700;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .item {
          font-size: 13px;
          margin: 6px 0;
          color: #536477;
        }

        .habilitado {
          color: #1d7a48;
        }

        .botones {
          display: flex;
          gap: 9px;
          margin-top: 16px;
          flex-wrap: wrap;
        }

        .boton {
          border: 1px solid #d6dee8;
          background: white;
          border-radius: 8px;
          padding: 9px 12px;
          cursor: pointer;
          font-weight: 600;
          color: #32465a;
        }

        .boton-principal {
          background: #1187d1;
          color: white;
          border-color: #1187d1;
        }

        .alerta {
          border-bottom: 1px solid #edf0f4;
          padding: 14px 0;
        }

        .alerta:last-child {
          border-bottom: none;
        }

        .alerta-titulo {
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .alerta-texto {
          font-size: 14px;
          line-height: 1.4;
          color: #56687a;
        }

        .espera {
          color: #b26600;
        }

        .protocolo {
          color: #b03a2e;
        }

        .pendiente {
          color: #6b56a5;
        }

        @media (max-width: 1000px) {
          .sc-layout {
            grid-template-columns: 1fr;
          }

          .sc-indicadores {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 650px) {
          .sc-content {
            padding: 15px;
          }

          .sc-header {
            padding: 16px;
          }

          .acciones {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="sc-app">
        <header className="sc-header">
          <div>
            <h1>CEMEDIC · Study Coordinator</h1>
            <p>Torre de control de visitas</p>
          </div>

          <div className="sc-header-right">
            <div>
              {new Date().toLocaleDateString('es-AR')}
            </div>

            <button
              className="sc-volver"
              onClick={onVolver}
            >
              ← Volver
            </button>
          </div>
        </header>

        <main className="sc-content">
          <div className="sc-indicadores">
            <div className="sc-indicador">
              <div className="sc-numero">
                {visitas.length}
              </div>
              <div className="sc-label">
                Visitas hoy
              </div>
            </div>

            <div className="sc-indicador">
              <div className="sc-numero">{visitasPresentes}</div>
              <div className="sc-label">
                Presentes
              </div>
            </div>

            <div className="sc-indicador">
              <div className="sc-numero">{visitasEnCurso}</div>
              <div className="sc-label">
                En curso
              </div>
            </div>

            <div className="sc-indicador">
              <div className="sc-numero">
                {alertas.length}
              </div>
              <div className="sc-label">
                Alertas
              </div>
            </div>
          </div>

          <div className="sc-layout">
            <section className="sc-panel">
              <h2>Flujo de hoy</h2>

              {cargando && <div className="sc-mensaje" aria-live="polite">Cargando flujo del día...</div>}

              {!cargando && errorCarga && (
                <div className="sc-mensaje error" role="alert">
                  No se pudo conectar con el servidor local
                  <br />
                  <button className="sc-retry" onClick={() => setReintento((value) => value + 1)}>
                    Reintentar
                  </button>
                </div>
              )}

              {!cargando && !errorCarga && visitas.length === 0 && (
                <div className="sc-mensaje">No hay visitas para hoy.</div>
              )}

              {!cargando && !errorCarga && visitas.map((visita) => {
                const estado = estadoVisita(visita)
                return (
                <div
                  className="visita-card"
                  key={visita.id}
                >
                  <div className="visita-top">
                    <div>
                      <div className="visita-hora">
                        {visita.scheduledTime.slice(0, 5)}
                      </div>

                      <div className="visita-codigo">
                        {visita.participant.code}
                      </div>

                      <div className="muted">
                        {visita.participant.studyCode} · {visita.visitCode}
                      </div>

                      <div className="muted">
                        {visita.assignedDoctor} · {visita.room ?? 'Consultorio sin asignar'}
                      </div>

                      {visita.arrivalAt && (
                        <div className="visita-llegada">
                          Llegó {new Date(visita.arrivalAt).toLocaleTimeString('es-AR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })}
                        </div>
                      )}
                    </div>

                    <span
                      className={`estado ${estado.className}`}
                    >
                      {estado.text}
                    </span>
                  </div>

                  <div className="botones">
                    <button
                      className="boton boton-principal"
                      onClick={() => setVisitaAbierta(visita)}
                    >
                      Abrir visita
                    </button>

                    <button className="boton" disabled title="Próximamente">
                      Solicitar médico · Próximamente
                    </button>

                    <button className="boton" disabled title="Próximamente">
                      Solicitar laboratorio · Próximamente
                    </button>
                  </div>
                </div>
                )
              })}
            </section>

            <aside className="sc-panel">
              <h2>Alertas</h2>

              {!cargando && !errorCarga && alertas.length === 0 && (
                <div className="alerta-texto">Sin alertas por demora o espera prolongada.</div>
              )}

              {!cargando && !errorCarga && alertas.map((alerta) => (
                <div className="alerta" key={alerta.texto}>
                  <div className="alerta-titulo espera">ESPERA</div>
                  <div className="alerta-texto">{alerta.texto}</div>
                </div>
              ))}

              {cargando && <div className="alerta-texto">Cargando alertas...</div>}
              {errorCarga && <div className="alerta-texto">Alertas no disponibles.</div>}
            </aside>
          </div>
        </main>
      </div>
    </>
  )
}
