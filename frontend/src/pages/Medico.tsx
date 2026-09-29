import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config/api'

type EstadoEvento =
  | 'Sin EA nuevos'
  | 'EA nuevo'
  | 'EA previo continúa'
  | 'Resuelto'
  | 'SAE'
  | 'AESI'

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

type MedicoProps = {
  onVolver: () => void
}

const CURRENT_DOCTOR = 'Dr. Puleio'

const estadosEvento: EstadoEvento[] = [
  'Sin EA nuevos',
  'EA nuevo',
  'EA previo continúa',
  'Resuelto',
  'SAE',
  'AESI',
]

export default function Medico({ onVolver }: MedicoProps) {
  const [visitas, setVisitas] = useState<Visit[]>([])
  const [visitaActiva, setVisitaActiva] = useState<Visit | null>(null)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [reintento, setReintento] = useState(0)
  const [ahora, setAhora] = useState(() => Date.now())
  const [estadoEvento, setEstadoEvento] = useState<EstadoEvento | ''>('')

  useEffect(() => {
    const controller = new AbortController()
    const currentDate = new Date()
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const day = String(currentDate.getDate()).padStart(2, '0')
    const params = new URLSearchParams({
      date: `${year}-${month}-${day}`,
      doctor: CURRENT_DOCTOR,
    })

    async function cargarCola() {
      setCargando(true)
      setErrorCarga(false)

      try {
        if (!API_BASE_URL) throw new Error('API URL no configurada')

        const response = await fetch(`${API_BASE_URL}/visits?${params}`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('No se pudo cargar mi cola')

        const data = (await response.json()) as Visit[]
        setVisitas(data)
      } catch {
        if (!controller.signal.aborted) setErrorCarga(true)
      } finally {
        if (!controller.signal.aborted) setCargando(false)
      }
    }

    void cargarCola()
    return () => controller.abort()
  }, [reintento])

  useEffect(() => {
    const intervalId = window.setInterval(() => setAhora(Date.now()), 60_000)
    return () => window.clearInterval(intervalId)
  }, [])

  const visitasCola = visitas
    .filter((visita) => visita.status === 'PRESENT' || visita.status === 'IN_PROGRESS')
    .sort((first, second) => {
      const firstArrival = first.arrivalAt ? new Date(first.arrivalAt).getTime() : null
      const secondArrival = second.arrivalAt ? new Date(second.arrivalAt).getTime() : null
      const firstOrder = firstArrival ?? new Date(`${first.scheduledDate}T${first.scheduledTime}`).getTime()
      const secondOrder = secondArrival ?? new Date(`${second.scheduledDate}T${second.scheduledTime}`).getTime()
      return firstOrder - secondOrder
    })

  function minutosEspera(visita: Visit) {
    if (!visita.arrivalAt) return null
    return Math.max(0, Math.floor((ahora - new Date(visita.arrivalAt).getTime()) / 60_000))
  }

  function horaLocal(timestamp: string | null) {
    if (!timestamp) return 'Sin registrar'
    return new Date(timestamp).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  function estadoVisita(visita: Visit) {
    return visita.status === 'PRESENT' ? 'Esperando médico' : 'En evaluación'
  }

  function abrirEvaluacion(visita: Visit) {
    setVisitaActiva(visita)
    setEstadoEvento('')
  }

  function volverACola() {
    setVisitaActiva(null)
    setEstadoEvento('')
  }

  const pacientesEnEspera = visitasCola.filter((visita) => visita.status === 'PRESENT').length
  const pacientesEnEvaluacion = visitasCola.filter((visita) => visita.status === 'IN_PROGRESS').length
  const esperaProlongada = visitasCola.filter(
    (visita) => visita.status === 'PRESENT' && (minutosEspera(visita) ?? 0) > 30,
  ).length

  return (
    <>
      <style>{`
        .medico {
          min-height: 100vh;
          background: #f4f7fb;
          color: #14213d;
        }

        .medico-header {
          background: linear-gradient(90deg, #073763, #0a4f86);
          color: white;
          padding: 20px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .medico-header h1 {
          margin: 0;
          font-size: 25px;
        }

        .medico-header p {
          margin: 4px 0 0;
          opacity: .82;
        }

        .medico-volver {
          flex: 0 0 auto;
          background: rgba(255,255,255,.14);
          color: white;
          border: 1px solid rgba(255,255,255,.35);
          border-radius: 8px;
          padding: 9px 14px;
          cursor: pointer;
          font-weight: 600;
        }

        .medico-volver:hover {
          background: rgba(255,255,255,.24);
        }

        .medico-content {
          max-width: 1380px;
          margin: 0 auto;
          padding: 28px;
        }

        .medico-title-row {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
        }

        .medico-title-row h2 {
          margin: 0;
          font-size: 23px;
        }

        .medico-muted {
          color: #69788b;
          font-size: 14px;
        }

        .medico-demo-note {
          margin-bottom: 16px;
          padding: 11px 13px;
          border: 1px solid #d7e4ed;
          border-left: 4px solid #4b8eae;
          border-radius: 7px;
          background: #f2f8fb;
          color: #40596a;
          font-size: 13px;
          line-height: 1.45;
        }

        .medico-load-error {
          padding: 13px 15px;
          border: 1px solid #efc2b8;
          border-radius: 8px;
          background: #fff0ed;
          color: #843728;
        }

        .medico-wait-alert {
          margin-top: 6px;
          color: #a15300;
          font-size: 12px;
          font-weight: 700;
        }

        .medico-queue {
          display: grid;
          gap: 12px;
        }

        .medico-patient {
          display: grid;
          grid-template-columns: 76px minmax(150px, 1.15fr) minmax(145px, 1fr) minmax(145px, 1fr) auto;
          align-items: center;
          gap: 16px;
          background: white;
          border: 1px solid #e0e7ef;
          border-radius: 10px;
          padding: 17px 19px;
        }

        .medico-time {
          font-size: 21px;
          font-weight: 700;
          color: #073763;
        }

        .medico-code {
          font-weight: 700;
          font-size: 16px;
        }

        .medico-detail {
          margin-top: 4px;
          color: #69788b;
          font-size: 13px;
        }

        .medico-badge {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          border-radius: 999px;
          padding: 6px 10px;
          background: #e4f3fb;
          color: #17658e;
          font-size: 12px;
          font-weight: 700;
        }

        .medico-badge.reasignado {
          display: none;
        }

        .medico-button {
          border: 0;
          border-radius: 8px;
          padding: 10px 14px;
          background: #1187d1;
          color: white;
          cursor: pointer;
          font-weight: 700;
          white-space: nowrap;
        }

        .medico-button:hover:not(:disabled) {
          background: #0874b7;
        }

        .medico-button:disabled {
          cursor: not-allowed;
          opacity: .55;
        }

        .medico-button.secondary {
          background: white;
          color: #17658e;
          border: 1px solid #b9d7e8;
        }

        .medico-button.secondary:hover {
          background: #eff8fc;
        }

        .medico-summary {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 1px;
          overflow: hidden;
          border: 1px solid #dfe7ef;
          border-radius: 9px;
          background: #dfe7ef;
          margin-bottom: 18px;
        }

        .medico-summary-item {
          min-width: 0;
          background: white;
          padding: 14px 16px;
        }

        .medico-label {
          display: block;
          margin-bottom: 6px;
          color: #69788b;
          font-size: 12px;
          font-weight: 600;
        }

        .medico-panel {
          background: white;
          border: 1px solid #e0e7ef;
          border-radius: 9px;
          padding: 20px;
          margin-bottom: 16px;
        }

        .medico-panel h2 {
          margin: 0 0 16px;
          font-size: 19px;
        }

        .medico-panel h3 {
          margin: 18px 0 10px;
          font-size: 15px;
        }

        .medico-metrics {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 10px;
        }

        .medico-metric {
          padding: 13px;
          background: #f5f8fb;
          border-radius: 7px;
          min-width: 0;
        }

        .medico-metric strong {
          display: block;
          margin-top: 5px;
          font-size: 18px;
        }

        .medico-pending-list {
          display: grid;
          gap: 9px;
        }

        .medico-pending {
          display: grid;
          grid-template-columns: minmax(160px, 1fr) minmax(140px, .8fr) auto;
          align-items: center;
          gap: 12px;
          border-top: 1px solid #edf0f4;
          padding-top: 10px;
        }

        .medico-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px 18px;
        }

        .medico-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        .medico-field label,
        .medico-field-label {
          color: #526173;
          font-size: 13px;
          font-weight: 700;
        }

        .medico-field input,
        .medico-field select,
        .medico-field textarea {
          width: 100%;
          min-height: 40px;
          border: 1px solid #cfd9e3;
          border-radius: 6px;
          padding: 9px 10px;
          color: #14213d;
          background: white;
        }

        .medico-field textarea {
          min-height: 82px;
          resize: vertical;
        }

        .medico-field.full {
          grid-column: 1 / -1;
        }

        .medico-options {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 16px;
          padding: 4px 0;
        }

        .medico-options label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #26374a;
          font-size: 14px;
          font-weight: 500;
        }

        .medico-options input {
          accent-color: #087eb9;
        }

        .medico-warning {
          border: 1px solid #e7c66e;
          border-left: 4px solid #c18300;
          border-radius: 7px;
          background: #fff8e7;
          color: #704c00;
          padding: 12px 14px;
          margin-bottom: 14px;
          font-weight: 600;
          font-size: 14px;
        }

        .medico-decision {
          border-top: 1px solid #e7edf3;
          padding-top: 16px;
        }

        .medico-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 16px;
        }

        @media (max-width: 1000px) {
          .medico-patient {
            grid-template-columns: 70px 1fr 1fr;
          }

          .medico-patient .medico-action-cell {
            grid-column: 2 / -1;
          }

          .medico-summary,
          .medico-metrics {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 650px) {
          .medico-header {
            align-items: flex-start;
            flex-direction: column;
            padding: 16px;
          }

          .medico-content {
            padding: 16px;
          }

          .medico-title-row {
            align-items: flex-start;
            flex-direction: column;
          }

          .medico-patient {
            grid-template-columns: 1fr 1fr;
            gap: 11px;
            padding: 15px;
          }

          .medico-patient .medico-action-cell {
            grid-column: 1 / -1;
          }

          .medico-patient .medico-button {
            width: 100%;
          }

          .medico-summary,
          .medico-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .medico-pending {
            grid-template-columns: 1fr auto;
          }

          .medico-pending > :nth-child(2) {
            grid-column: 1;
          }

          .medico-form-grid {
            grid-template-columns: 1fr;
          }

          .medico-field.full {
            grid-column: auto;
          }

          .medico-panel {
            padding: 16px;
          }

          .medico-actions {
            flex-direction: column-reverse;
          }

          .medico-actions .medico-button {
            width: 100%;
          }
        }
      `}</style>

      <div className="medico">
        <header className="medico-header">
          <div>
            <h1>CEMEDIC · Médico</h1>
            <p>Pacientes en espera y evaluación clínica</p>
            <p>Médico actual: {CURRENT_DOCTOR}</p>
          </div>
          <button className="medico-volver" onClick={onVolver}>
            ← Volver
          </button>
        </header>

        <main className="medico-content">
          {!visitaActiva ? (
            <>
              <div className="medico-metrics">
                <div className="medico-metric"><span className="medico-label">Pacientes en espera</span><strong>{pacientesEnEspera}</strong></div>
                <div className="medico-metric"><span className="medico-label">En evaluación</span><strong>{pacientesEnEvaluacion}</strong></div>
                <div className="medico-metric"><span className="medico-label">Espera &gt;30 min</span><strong>{esperaProlongada}</strong></div>
              </div>

              <div className="medico-title-row">
                <div>
                  <h2>Mi cola</h2>
                  <div className="medico-muted">
                    {visitasCola.length} pacientes asignados · ordenados por llegada
                  </div>
                </div>
                <span className="medico-badge">{CURRENT_DOCTOR}</span>
              </div>

              <section className="medico-queue" aria-label="Pacientes asignados">
                {cargando && <div className="medico-panel" aria-live="polite">Cargando mi cola...</div>}
                {!cargando && errorCarga && (
                  <div className="medico-load-error" role="alert">
                    No se pudo conectar con el servidor local
                    <div>
                      <button className="medico-button secondary" onClick={() => setReintento((value) => value + 1)}>
                        Reintentar
                      </button>
                    </div>
                  </div>
                )}
                {!cargando && !errorCarga && visitasCola.length === 0 && (
                  <div className="medico-panel">No hay pacientes esperando atención en este momento.</div>
                )}
                {!cargando && !errorCarga && visitasCola.map((visita) => {
                  const minutos = minutosEspera(visita)
                  const esperaLarga = visita.status === 'PRESENT' && (minutos ?? 0) > 30

                  return (
                    <article className="medico-patient" key={visita.id}>
                      <div className="medico-time">{horaLocal(visita.arrivalAt)}</div>
                      <div>
                        <div className="medico-code">
                          {visita.participant.code} · {visita.participant.studyCode} · {visita.visitCode}
                        </div>
                        <div className="medico-detail">Turno: {visita.scheduledTime.slice(0, 5)}</div>
                        <div className="medico-detail">Llegó: {horaLocal(visita.arrivalAt)}</div>
                      </div>
                      <div>
                        <div>{visita.assignedDoctor}</div>
                        <div className="medico-detail">{visita.room ?? 'Consultorio sin asignar'}</div>
                      </div>
                      <div>
                        <span className="medico-badge">{estadoVisita(visita)}</span>
                        {minutos !== null && <div className="medico-detail">Espera {minutos} min</div>}
                        {esperaLarga && <div className="medico-wait-alert">Espera prolongada</div>}
                      </div>
                      <div className="medico-action-cell">
                        <button className="medico-button" onClick={() => abrirEvaluacion(visita)}>
                          Abrir evaluación
                        </button>
                      </div>
                    </article>
                  )
                })}
              </section>
            </>
          ) : (
            <>
              <div className="medico-title-row">
                <div>
                  <h2>
                    {visitaActiva.participant.code} · {visitaActiva.participant.studyCode} · {visitaActiva.visitCode}
                  </h2>
                  <div className="medico-muted">Evaluación clínica de la visita</div>
                </div>
                <button className="medico-button secondary" onClick={volverACola}>
                  ← Volver a mi cola
                </button>
              </div>

              <section className="medico-summary" aria-label="Resumen del paciente">
                <div className="medico-summary-item">
                  <span className="medico-label">Hora programada</span>
                  <strong>{visitaActiva.scheduledTime.slice(0, 5)}</strong>
                </div>
                <div className="medico-summary-item">
                  <span className="medico-label">Hora de llegada</span>
                  <strong>{horaLocal(visitaActiva.arrivalAt)}</strong>
                </div>
                <div className="medico-summary-item">
                  <span className="medico-label">Médico</span>
                  <strong>{visitaActiva.assignedDoctor}</strong>
                </div>
                <div className="medico-summary-item">
                  <span className="medico-label">Consultorio</span>
                  <strong>{visitaActiva.room ?? 'Consultorio sin asignar'}</strong>
                </div>
                <div className="medico-summary-item">
                  <span className="medico-label">Estado</span>
                  <strong>{visitaActiva.status === 'PRESENT' ? 'Esperando médico' : 'En evaluación'}</strong>
                </div>
              </section>

              <div className="medico-demo-note">
                Los datos clínicos de esta sección son de demostración. Se conectarán al registro persistente en las próximas etapas.
              </div>

              <section className="medico-panel">
                <h2>Resumen longitudinal</h2>
                <div className="medico-metrics">
                  <div className="medico-metric"><span className="medico-label">Peso inicial</span><strong>112.4 kg</strong></div>
                  <div className="medico-metric"><span className="medico-label">Peso visita anterior</span><strong>107.8 kg</strong></div>
                  <div className="medico-metric"><span className="medico-label">Peso actual</span><strong>106.9 kg</strong></div>
                  <div className="medico-metric"><span className="medico-label">Desde visita anterior</span><strong>-0.9 kg</strong></div>
                  <div className="medico-metric"><span className="medico-label">Desde basal</span><strong>-5.5 kg</strong></div>
                </div>
              </section>

              <section className="medico-panel">
                <h2>Pendientes clínicos</h2>
                <div className="medico-pending-list">
                  <div className="medico-pending">
                    <strong>EA previo activo: náuseas leves</strong>
                    <span className="medico-muted">V5 · 12/08/2026</span>
                    <span className="medico-badge">Abierto</span>
                  </div>
                  <div className="medico-pending">
                    <strong>Laboratorio previo a controlar: ALT elevada</strong>
                    <span className="medico-muted">V5 · 12/08/2026</span>
                    <span className="medico-badge">Pendiente</span>
                  </div>
                  <div className="medico-pending">
                    <strong>Kit pendiente de devolución</strong>
                    <span className="medico-muted">V5 · 12/08/2026</span>
                    <span className="medico-badge">Pendiente</span>
                  </div>
                  <div className="medico-pending">
                    <strong>Tarea futura solicitada en visita anterior</strong>
                    <span className="medico-muted">V5 · 12/08/2026</span>
                    <span className="medico-badge">En seguimiento</span>
                  </div>
                </div>
              </section>

              <section className="medico-panel">
                <h2>Evaluación médica de hoy</h2>
                <div className="medico-form-grid">
                  <div className="medico-field">
                    <span className="medico-field-label">Ayuno</span>
                    <div className="medico-options">
                      {['Sí', 'No', 'Dudoso'].map((opcion) => (
                        <label key={opcion}><input type="radio" name="ayuno" />{opcion}</label>
                      ))}
                    </div>
                  </div>
                  <div className="medico-field"><label htmlFor="medicacion">Medicación concomitante</label><input id="medicacion" placeholder="Registrar medicación" /></div>
                  <div className="medico-field"><label htmlFor="cuestionarios">Cuestionarios</label><input id="cuestionarios" placeholder="Estado o comentarios" /></div>
                  <div className="medico-field"><label htmlFor="peso">Peso</label><input id="peso" type="number" step="0.1" placeholder="kg" /></div>
                  <div className="medico-field"><label htmlFor="ta">TA</label><input id="ta" placeholder="mmHg" /></div>
                  <div className="medico-field"><label htmlFor="fc">FC</label><input id="fc" type="number" placeholder="lpm" /></div>
                  <div className="medico-field full"><label htmlFor="examen">Examen físico / evaluación dirigida</label><textarea id="examen" placeholder="Hallazgos y evaluación clínica" /></div>
                </div>
              </section>

              <section className="medico-panel">
                <h2>Eventos adversos</h2>
                <div className="medico-form-grid">
                  <div className="medico-field">
                    <label htmlFor="estado-ea">Estado de eventos adversos</label>
                    <select
                      id="estado-ea"
                      value={estadoEvento}
                      onChange={(event) => setEstadoEvento(event.target.value as EstadoEvento | '')}
                    >
                      <option value="">Seleccionar estado</option>
                      {estadosEvento.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                    </select>
                  </div>
                  <div className="medico-field">
                    <label htmlFor="detalle-ea">Detalle de EA</label>
                    <input id="detalle-ea" placeholder="Descripción, gravedad y conducta" />
                  </div>
                </div>
              </section>

              <section className="medico-panel">
                <h2>Intervención del estudio / IP</h2>
                <div className="medico-form-grid">
                  <div className="medico-field"><label htmlFor="dosis-actual">Dosis actual</label><input id="dosis-actual" defaultValue="2.4 mg semanal" /></div>
                  <div className="medico-field"><label htmlFor="ultima-dispensa">Última dispensa</label><input id="ultima-dispensa" defaultValue="12/08/2026 · Kit 004812" /></div>
                  <div className="medico-field"><label htmlFor="kit-devuelto">Kit devuelto</label><select id="kit-devuelto" defaultValue="Sí"><option>Sí</option><option>No</option><option>Parcial</option></select></div>
                  <div className="medico-field"><label htmlFor="cantidad-inicial">Cantidad inicial</label><input id="cantidad-inicial" type="number" defaultValue="28" /></div>
                  <div className="medico-field"><label htmlFor="dosis-esperadas">Dosis esperadas</label><input id="dosis-esperadas" type="number" defaultValue="4" /></div>
                  <div className="medico-field"><label htmlFor="cantidad-esperada">Cantidad para 100% adherencia</label><input id="cantidad-esperada" type="number" defaultValue="24" /></div>
                  <div className="medico-field"><label htmlFor="cantidad-devuelta">Cantidad devuelta real</label><input id="cantidad-devuelta" type="number" defaultValue="4" /></div>
                  <div className="medico-field"><span className="medico-field-label">Adherencia calculada</span><input aria-label="Adherencia calculada" value="100%" readOnly /></div>
                  <div className="medico-field"><label htmlFor="dosis-omitidas">Dosis omitidas / interrumpidas</label><input id="dosis-omitidas" defaultValue="Ninguna" /></div>
                  <div className="medico-field"><label htmlFor="nuevo-kit">Nuevo kit</label><input id="nuevo-kit" defaultValue="Pendiente de IWRS" /></div>
                  <div className="medico-field"><label htmlFor="vencimiento">Vencimiento</label><input id="vencimiento" type="date" defaultValue="2027-03-31" /></div>
                  <div className="medico-field"><label htmlFor="nueva-dosis">Nueva dosis propuesta</label><input id="nueva-dosis" placeholder="Dosis y frecuencia" /></div>
                </div>
              </section>

              <section className="medico-panel">
                <h2>Decisión médica</h2>
                <div className="medico-decision medico-form-grid">
                  <div className="medico-field">
                    <span className="medico-field-label">Puede continuar en estudio</span>
                    <div className="medico-options">
                      {['Sí', 'No'].map((opcion) => <label key={`continuar-${opcion}`}><input type="radio" name="continuar" />{opcion}</label>)}
                    </div>
                  </div>
                  <div className="medico-field">
                    <span className="medico-field-label">Elegible para randomización</span>
                    <div className="medico-options">
                      {['Sí', 'No'].map((opcion) => <label key={`randomizacion-${opcion}`}><input type="radio" name="randomizacion" />{opcion}</label>)}
                    </div>
                  </div>
                  <div className="medico-field">
                    <span className="medico-field-label">Autoriza IWRS</span>
                    <div className="medico-options">
                      {['Sí', 'No'].map((opcion) => <label key={`iwrs-${opcion}`}><input type="radio" name="iwrs" />{opcion}</label>)}
                    </div>
                  </div>
                  <div className="medico-field full">
                    <span className="medico-field-label">Decisión de dosis</span>
                    <div className="medico-options">
                      {['Aumentar', 'Mantener', 'Disminuir', 'Interrumpir', 'Reiniciar', 'Discontinuar'].map((opcion) => (
                        <label key={opcion}><input type="radio" name="decision-dosis" />{opcion}</label>
                      ))}
                    </div>
                  </div>
                  <div className="medico-field full"><label htmlFor="observacion">Motivo / observación</label><textarea id="observacion" placeholder="Fundamento de la decisión médica" /></div>
                </div>
                <div className="medico-actions">
                  <button className="medico-button secondary" onClick={volverACola}>Volver a mi cola</button>
                  <button className="medico-button" disabled title="Persistencia clínica próximamente">
                    Persistencia clínica próximamente
                  </button>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </>
  )
}