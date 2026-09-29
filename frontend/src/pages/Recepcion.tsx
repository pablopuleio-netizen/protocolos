import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config/api'

type Participant = {
  id: string
  code: string
  studyCode: string
}

type VisitStatus =
  | 'SCHEDULED'
  | 'PRESENT'
  | 'IN_PROGRESS'
  | 'NO_SHOW'
  | 'COMPLETED'

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

type RecepcionProps = {
  onVolver: () => void
}

function fechaLocalActual() {
  const ahora = new Date()
  const año = ahora.getFullYear()
  const mes = String(ahora.getMonth() + 1).padStart(2, '0')
  const dia = String(ahora.getDate()).padStart(2, '0')
  return `${año}-${mes}-${dia}`
}

function minutosDesdeTurno(visita: Visit, ahora: number) {
  const [año, mes, dia] = visita.scheduledDate.split('-').map(Number)
  const [hora, minuto] = visita.scheduledTime.split(':').map(Number)
  const turno = new Date(año, mes - 1, dia, hora, minuto)
  return Math.floor((ahora - turno.getTime()) / 60000)
}

function minutosDesdeLlegada(arrivalAt: string, ahora: number) {
  return Math.max(0, Math.floor((ahora - new Date(arrivalAt).getTime()) / 60000))
}

function horaLocal(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export default function Recepcion({ onVolver }: RecepcionProps) {
  const [visitas, setVisitas] = useState<Visit[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [reintento, setReintento] = useState(0)
  const [visitaRegistrando, setVisitaRegistrando] = useState<string | null>(null)
  const [errorLlegada, setErrorLlegada] = useState<string | null>(null)
  const [ahora, setAhora] = useState(() => Date.now())

  useEffect(() => {
    const controller = new AbortController()

    async function cargarAgenda() {
      setCargando(true)
      setErrorCarga(false)

      try {
        if (!API_BASE_URL) throw new Error('API URL no configurada')

        const respuesta = await fetch(
          `${API_BASE_URL}/visits?date=${fechaLocalActual()}`,
          { signal: controller.signal },
        )
        if (!respuesta.ok) throw new Error('No se pudo cargar la agenda')

        const datos = (await respuesta.json()) as Visit[]
        setVisitas(datos)
      } catch {
        if (!controller.signal.aborted) setErrorCarga(true)
      } finally {
        if (!controller.signal.aborted) setCargando(false)
      }
    }

    void cargarAgenda()
    return () => controller.abort()
  }, [reintento])

  useEffect(() => {
    const intervalId = window.setInterval(() => setAhora(Date.now()), 60_000)
    return () => window.clearInterval(intervalId)
  }, [])

  async function registrarLlegada(id: string) {
    setVisitaRegistrando(id)
    setErrorLlegada(null)

    try {
      if (!API_BASE_URL) throw new Error('API URL no configurada')

      const respuesta = await fetch(`${API_BASE_URL}/visits/${id}/arrival`, {
        method: 'PATCH',
      })
      if (!respuesta.ok) throw new Error('No se pudo registrar la llegada')

      const visitaActualizada = (await respuesta.json()) as Visit
      setVisitas((actuales) =>
        actuales.map((visita) =>
          visita.id === visitaActualizada.id ? visitaActualizada : visita,
        ),
      )
      setAhora(Date.now())
    } catch {
      setErrorLlegada(id)
    } finally {
      setVisitaRegistrando(null)
    }
  }

  function estadoVisita(visita: Visit) {
    if (visita.status === 'NO_SHOW') {
      return {
        texto: 'No asistió',
        clase: 'estado no-asistio',
      }
    }

    if (visita.status === 'IN_PROGRESS') {
      return {
        texto: 'En atención',
        clase: 'estado atencion',
      }
    }

    if (visita.status === 'PRESENT' && visita.arrivalAt) {
      const espera = minutosDesdeLlegada(visita.arrivalAt, ahora)

      if (espera > 30) {
        return {
          texto: `Espera prolongada · ${espera} min`,
          clase: 'estado espera-larga',
        }
      }

      return {
        texto: `Presente · espera ${Math.max(0, espera)} min`,
        clase: 'estado presente',
      }
    }

    if (visita.status === 'SCHEDULED') {
      const demora = minutosDesdeTurno(visita, ahora)

      if (demora > 30) {
        return {
          texto: `Demorado · ${demora} min`,
          clase: 'estado demorado',
        }
      }
    }

    return {
      texto: 'Esperado',
      clase: 'estado esperado',
    }
  }

  const pacientesActivos = visitas.filter((visita) => visita.status !== 'COMPLETED')
  const presentes = pacientesActivos.filter((visita) => visita.status === 'PRESENT').length

  const demorados = pacientesActivos.filter(
    (visita) => visita.status === 'SCHEDULED' && minutosDesdeTurno(visita, ahora) > 30,
  ).length

  const esperaLarga = pacientesActivos.filter(
    (visita) =>
      visita.status === 'PRESENT' &&
      visita.arrivalAt !== null &&
      minutosDesdeLlegada(visita.arrivalAt, ahora) > 30,
  ).length

  return (
    <>
      <style>{`
        .recepcion {
          min-height: 100vh;
          background: #f4f7fb;
        }

        .recepcion-header {
          background: linear-gradient(90deg, #073763, #0a4f86);
          color: white;
          padding: 20px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .recepcion-header h1 {
          margin: 0;
          font-size: 25px;
        }

        .recepcion-header p {
          margin: 4px 0 0;
          opacity: .8;
        }

        .recepcion-header-derecha {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .boton-volver {
          background: rgba(255,255,255,.15);
          color: white;
          border: 1px solid rgba(255,255,255,.35);
          border-radius: 8px;
          padding: 9px 14px;
          cursor: pointer;
          font-weight: 600;
        }

        .boton-volver:hover {
          background: rgba(255,255,255,.25);
        }

        .recepcion-content {
          max-width: 1350px;
          margin: auto;
          padding: 28px;
        }

        .indicadores {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 26px;
        }

        .indicador {
          background: white;
          border-radius: 14px;
          padding: 18px 20px;
          border: 1px solid #e3e9f0;
        }

        .indicador-numero {
          font-size: 28px;
          font-weight: 700;
        }

        .indicador-label {
          color: #718096;
          margin-top: 4px;
        }

        .layout {
          display: grid;
          grid-template-columns: minmax(0, 2fr) 340px;
          gap: 22px;
        }

        .panel {
          background: white;
          border-radius: 16px;
          border: 1px solid #e3e9f0;
          padding: 22px;
        }

        .panel h2 {
          margin: 0 0 18px;
          font-size: 21px;
        }

        .paciente {
          border: 1px solid #dde5ee;
          border-radius: 14px;
          padding: 17px;
          margin-bottom: 13px;
          display: grid;
          grid-template-columns: 80px 1.4fr 1fr 1fr auto;
          gap: 15px;
          align-items: center;
        }

        .hora {
          font-size: 21px;
          font-weight: 700;
        }

        .codigo {
          font-weight: 700;
          font-size: 17px;
        }

        .detalle {
          color: #69788b;
          font-size: 14px;
          margin-top: 4px;
        }

        .estado {
          display: inline-block;
          border-radius: 999px;
          padding: 7px 11px;
          font-size: 13px;
          font-weight: 600;
        }

        .esperado {
          background: #edf2f7;
          color: #526173;
        }

        .presente {
          background: #dff3ff;
          color: #16678f;
        }

        .demorado {
          background: #fff2cc;
          color: #8a6500;
        }

        .espera-larga {
          background: #ffe7c2;
          color: #a15300;
        }

        .atencion {
          background: #e8ddff;
          color: #6240a7;
        }

        .no-asistio {
          background: #ebedf0;
          color: #505963;
        }

        .boton-llegada {
          border: none;
          background: #1187d1;
          color: white;
          padding: 10px 14px;
          border-radius: 9px;
          cursor: pointer;
          font-weight: 600;
          white-space: nowrap;
        }

        .boton-llegada:hover {
          background: #0874b7;
        }

        .boton-llegada:disabled {
          cursor: wait;
          opacity: .7;
        }

        .mensaje-error {
          margin: 12px 0;
          padding: 12px 14px;
          border: 1px solid #efc2b8;
          border-radius: 8px;
          background: #fff0ed;
          color: #843728;
          font-size: 14px;
        }

        .boton-reintentar {
          margin-top: 10px;
          padding: 8px 12px;
          border: 1px solid #b9d7e8;
          border-radius: 7px;
          background: white;
          color: #17658e;
          cursor: pointer;
          font-weight: 600;
        }

        .boton-reintentar:hover {
          background: #eff8fc;
        }

        .llegada {
          font-size: 13px;
          color: #526173;
          margin-top: 5px;
        }

        .consultorio {
          border-bottom: 1px solid #edf0f4;
          padding: 15px 0;
        }

        .consultorio:last-child {
          border-bottom: none;
        }

        .consultorio-titulo {
          font-weight: 700;
        }

        @media (max-width: 1000px) {
          .layout {
            grid-template-columns: 1fr;
          }

          .paciente {
            grid-template-columns: 70px 1fr 1fr;
          }

          .indicadores {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 650px) {
          .recepcion-header {
            padding: 16px;
            align-items: flex-start;
            flex-direction: column;
          }

          .recepcion-header-derecha {
            width: 100%;
            justify-content: space-between;
          }

          .recepcion-content {
            padding: 16px;
          }

          .indicadores {
            grid-template-columns: 1fr 1fr;
          }

          .paciente {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="recepcion">
        <header className="recepcion-header">
          <div>
            <h1>CEMEDIC · Recepción</h1>
            <p>Agenda y circulación de pacientes</p>
          </div>

          <div className="recepcion-header-derecha">
            <div>
              {new Date().toLocaleDateString('es-AR')}
            </div>

            <button
              className="boton-volver"
              onClick={onVolver}
            >
              ← Volver
            </button>
          </div>
        </header>

        <main className="recepcion-content">
          <div className="indicadores">
            <div className="indicador">
              <div className="indicador-numero">
                {pacientesActivos.length}
              </div>
              <div className="indicador-label">
                Pacientes hoy
              </div>
            </div>

            <div className="indicador">
              <div className="indicador-numero">
                {presentes}
              </div>
              <div className="indicador-label">
                Presentes
              </div>
            </div>

            <div className="indicador">
              <div className="indicador-numero">
                {demorados}
              </div>
              <div className="indicador-label">
                Demorados &gt;30'
              </div>
            </div>

            <div className="indicador">
              <div className="indicador-numero">
                {esperaLarga}
              </div>
              <div className="indicador-label">
                Espera &gt;30'
              </div>
            </div>
          </div>

          <div className="layout">
            <section className="panel">
              <h2>Agenda de hoy</h2>

              {cargando && <p aria-live="polite">Cargando agenda...</p>}

              {!cargando && errorCarga && (
                <div className="mensaje-error" role="alert">
                  No se pudo conectar con el servidor local
                  <br />
                  <button
                    className="boton-reintentar"
                    onClick={() => setReintento((intento) => intento + 1)}
                  >
                    Reintentar
                  </button>
                </div>
              )}

              {!cargando && !errorCarga && pacientesActivos.length === 0 && (
                <p>No hay visitas programadas para hoy.</p>
              )}

              {!cargando && !errorCarga && pacientesActivos.map((paciente) => {
                const estado = estadoVisita(paciente)

                return (
                  <div
                    className="paciente"
                    key={paciente.id}
                  >
                    <div className="hora">
                      {paciente.scheduledTime.slice(0, 5)}
                    </div>

                    <div>
                      <div className="codigo">
                        {paciente.participant.code}
                      </div>

                      <div className="detalle">
                        {paciente.participant.studyCode} · {paciente.visitCode}
                      </div>
                    </div>

                    <div>
                      <div>
                        {paciente.assignedDoctor}
                      </div>

                      <div className="detalle">
                        {paciente.room ?? 'Consultorio sin asignar'}
                      </div>
                    </div>

                    <div>
                      <span className={estado.clase}>
                        {estado.texto}
                      </span>

                      {paciente.arrivalAt && (
                        <div className="llegada">
                          Llegó: {horaLocal(paciente.arrivalAt)}
                        </div>
                      )}
                    </div>

                    <div>
                      {paciente.status === 'SCHEDULED' && (
                          <button
                            className="boton-llegada"
                            disabled={visitaRegistrando === paciente.id}
                            onClick={() => void registrarLlegada(paciente.id)}
                          >
                            {visitaRegistrando === paciente.id ? 'Registrando...' : 'Paciente llegó'}
                          </button>
                        )}
                      {errorLlegada === paciente.id && (
                        <div className="mensaje-error" role="alert">
                          No se pudo registrar la llegada
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </section>

            <aside className="panel">
              <h2>Asignación del día</h2>

              <div className="consultorio">
                <div className="consultorio-titulo">
                  Consultorio 1
                </div>
                <div className="detalle">
                  Dr. Pérez
                </div>
              </div>

              <div className="consultorio">
                <div className="consultorio-titulo">
                  Consultorio 2
                </div>
                <div className="detalle">
                  Dr. Puleio
                </div>
              </div>

              <div className="consultorio">
                <div className="consultorio-titulo">
                  Consultorio 3
                </div>
                <div className="detalle">
                  Dr. Gómez
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </>
  )
}