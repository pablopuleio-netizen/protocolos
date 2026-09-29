import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config/api'

type Participant = {
  id: string
  code: string
  studyCode: string
}

type VisitStatus = 'SCHEDULED' | 'PRESENT' | 'IN_PROGRESS' | 'NO_SHOW' | 'COMPLETED'
type ProcedureStatus = 'PENDING' | 'READY' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'NOT_APPLICABLE'
type TimeCaptureMode = 'NONE' | 'OPTIONAL' | 'REQUIRED'
type TechnicalRole = 'LAB' | 'ECG_TECH'
type ProcedureFilter = 'ALL' | TechnicalRole

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

type VisitProcedure = {
  id: string
  code: string
  name: string
  category: string
  responsibleRole: TechnicalRole
  status: ProcedureStatus
  timeCaptureMode: TimeCaptureMode
  sortOrder: number
  dependsOnCodes: string[]
  blockedReason: string | null
  startedAt: string | null
  completedAt: string | null
  performedAt: string | null
  recordedAt: string | null
  recordedBy: string | null
}

type VisitProcedureGroup = {
  visit: Visit
  procedures: VisitProcedure[]
}

type LaboratorioProps = {
  onVolver: () => void
}

const CURRENT_TECHNICIAN = 'Técnico demo'

function localDateString() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function localDateTimeInput() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hour}:${minute}`
}

function localTime(timestamp: string | null) {
  if (!timestamp) return 'Sin registrar'
  return new Date(timestamp).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function localDateTime(timestamp: string) {
  return new Date(timestamp).toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function arrivalOrder(visit: Visit) {
  if (visit.arrivalAt) return new Date(visit.arrivalAt).getTime()
  const [year, month, day] = visit.scheduledDate.split('-').map(Number)
  const [hour, minute] = visit.scheduledTime.split(':').map(Number)
  return new Date(year, month - 1, day, hour, minute).getTime()
}

function statusText(status: ProcedureStatus) {
  if (status === 'READY') return 'Listo para realizar'
  if (status === 'IN_PROGRESS') return 'En curso'
  if (status === 'BLOCKED') return 'Esperando requisito previo'
  if (status === 'COMPLETED') return 'Completado'
  if (status === 'NOT_APPLICABLE') return 'No aplica'
  return 'Pendiente'
}

function statusClass(status: ProcedureStatus) {
  if (status === 'READY') return 'ready'
  if (status === 'IN_PROGRESS') return 'in-progress'
  if (status === 'BLOCKED') return 'blocked'
  if (status === 'COMPLETED') return 'completed'
  return 'pending'
}

function isTechnicalProcedure(procedure: VisitProcedure) {
  return procedure.responsibleRole === 'LAB' || procedure.responsibleRole === 'ECG_TECH'
}

export default function Laboratorio({ onVolver }: LaboratorioProps) {
  const [groups, setGroups] = useState<VisitProcedureGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [filter, setFilter] = useState<ProcedureFilter>('ALL')
  const [busyProcedureId, setBusyProcedureId] = useState<string | null>(null)
  const [completionProcedure, setCompletionProcedure] = useState<{
    visitId: string
    procedure: VisitProcedure
  } | null>(null)
  const [performedAtInput, setPerformedAtInput] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [completionNotice, setCompletionNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!completionNotice) return
    const timeoutId = window.setTimeout(() => setCompletionNotice(null), 4500)
    return () => window.clearTimeout(timeoutId)
  }, [completionNotice])

  useEffect(() => {
    const controller = new AbortController()

    async function loadQueue() {
      setLoading(true)
      setLoadError(false)

      try {
        if (!API_BASE_URL) throw new Error('API URL no configurada')

        const visitsResponse = await fetch(
          `${API_BASE_URL}/visits?date=${localDateString()}`,
          { signal: controller.signal },
        )
        if (!visitsResponse.ok) throw new Error('No se pudieron cargar las visitas')

        const visits = (await visitsResponse.json()) as Visit[]
        const activeVisits = visits.filter(
          (visit) => visit.status === 'PRESENT' || visit.status === 'IN_PROGRESS',
        )
        const loadedGroups = await Promise.all(activeVisits.map(async (visit) => {
          const proceduresResponse = await fetch(
            `${API_BASE_URL}/visits/${visit.id}/procedures`,
            { signal: controller.signal },
          )
          if (!proceduresResponse.ok) throw new Error('No se pudieron cargar los procedimientos')

          const procedures = (await proceduresResponse.json()) as VisitProcedure[]
          return {
            visit,
            procedures: procedures
              .filter(isTechnicalProcedure)
              .sort((first, second) => first.sortOrder - second.sortOrder),
          }
        }))

        setGroups(loadedGroups.filter((group) => group.procedures.length > 0))
      } catch {
        if (!controller.signal.aborted) {
          setGroups([])
          setLoadError(true)
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadQueue()
    return () => controller.abort()
  }, [reloadKey])

  async function refreshVisitProcedures(visit: Visit) {
    const response = await fetch(`${API_BASE_URL}/visits/${visit.id}/procedures`)
    if (!response.ok) throw new Error('No se pudo actualizar la cola')
    const procedures = (await response.json()) as VisitProcedure[]
    const technicalProcedures = procedures
      .filter(isTechnicalProcedure)
      .sort((first, second) => first.sortOrder - second.sortOrder)

    setGroups((current) => [
      ...current.filter((group) => group.visit.id !== visit.id),
      ...(technicalProcedures.length > 0 ? [{ visit, procedures: technicalProcedures }] : []),
    ])
  }

  function updateProcedure(visitId: string, updatedProcedure: VisitProcedure) {
    setGroups((current) => current.map((group) =>
      group.visit.id !== visitId
        ? group
        : {
            ...group,
            procedures: group.procedures.map((procedure) =>
              procedure.id === updatedProcedure.id ? updatedProcedure : procedure,
            ),
          },
    ))
  }

  async function startProcedure(group: VisitProcedureGroup, procedure: VisitProcedure) {
    setBusyProcedureId(procedure.id)
    setActionError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/visit-procedures/${procedure.id}/start`, {
        method: 'PATCH',
      })
      if (!response.ok) throw new Error('No se pudo iniciar el procedimiento')

      const updatedProcedure = (await response.json()) as VisitProcedure
      updateProcedure(group.visit.id, updatedProcedure)
      try {
        await refreshVisitProcedures(group.visit)
      } catch {
        setActionError('El inicio se registró, pero no se pudo actualizar la cola. Pulsa Actualizar.')
      }
    } catch {
      setActionError('No se pudo iniciar el procedimiento')
    } finally {
      setBusyProcedureId(null)
    }
  }

  async function completeProcedure(visit: Visit, procedure: VisitProcedure) {
    const requiresPerformedAt = procedure.timeCaptureMode === 'REQUIRED'
    if (requiresPerformedAt && !performedAtInput) {
      setActionError('Ingresa la hora realizada para completar este procedimiento')
      return
    }

    const body: { recordedBy: string; performedAt?: string } = {
      recordedBy: CURRENT_TECHNICIAN,
    }
    if (procedure.timeCaptureMode !== 'NONE' && performedAtInput) {
      const performedAt = new Date(performedAtInput)
      if (Number.isNaN(performedAt.getTime())) {
        setActionError('La hora realizada no es válida')
        return
      }
      body.performedAt = performedAt.toISOString()
    }

    setBusyProcedureId(procedure.id)
    setActionError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/visit-procedures/${procedure.id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) throw new Error('No se pudo completar el procedimiento')

      const updatedProcedure = (await response.json()) as VisitProcedure
      updateProcedure(visit.id, updatedProcedure)
      setCompletionProcedure(null)
      setPerformedAtInput('')
      setCompletionNotice('Procedimiento registrado correctamente')
      try {
        await refreshVisitProcedures(visit)
      } catch {
        setActionError('Se registró el procedimiento, pero no se pudo actualizar la cola. Pulsa Actualizar.')
      }
    } catch {
      setActionError('No se pudo completar el procedimiento')
    } finally {
      setBusyProcedureId(null)
    }
  }

  function requestCompletion(group: VisitProcedureGroup, procedure: VisitProcedure) {
    setActionError(null)
    if (procedure.timeCaptureMode === 'NONE') {
      void completeProcedure(group.visit, procedure)
      return
    }

    setCompletionProcedure({ visitId: group.visit.id, procedure })
    setPerformedAtInput(procedure.timeCaptureMode === 'REQUIRED' ? localDateTimeInput() : '')
  }

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      procedures: group.procedures.filter((procedure) =>
        (filter === 'ALL' || procedure.responsibleRole === filter) &&
        procedure.status !== 'COMPLETED' &&
        procedure.status !== 'NOT_APPLICABLE',
      ),
    }))
    .filter((group) => group.procedures.length > 0)
    .sort((first, second) => arrivalOrder(first.visit) - arrivalOrder(second.visit))

  const completedGroups = groups
    .map((group) => ({
      ...group,
      procedures: group.procedures.filter((procedure) =>
        (filter === 'ALL' || procedure.responsibleRole === filter) &&
        procedure.status === 'COMPLETED',
      ),
    }))
    .filter((group) => group.procedures.length > 0)
    .sort((first, second) => arrivalOrder(first.visit) - arrivalOrder(second.visit))

  function procedureCard(group: VisitProcedureGroup, procedure: VisitProcedure, completed = false) {
    const isBusy = busyProcedureId === procedure.id
    const isCompleting = completionProcedure?.procedure.id === procedure.id
    const isLab = procedure.responsibleRole === 'LAB'

    return (
      <article className={`lab-procedure-card ${completed ? 'is-completed' : ''}`} key={procedure.id}>
        <div className="lab-procedure-main">
          <div>
            <div className="lab-procedure-heading">
              <div>
                <div className="lab-procedure-kind">{isLab ? 'LABORATORIO' : 'ECG'}</div>
                <h3>{procedure.name}</h3>
              </div>
              <span className={`lab-status ${statusClass(procedure.status)}`}>
                {statusText(procedure.status)}
              </span>
            </div>

            {procedure.status === 'BLOCKED' && procedure.blockedReason && (
              <div className="lab-blocked-reason">Falta: {procedure.blockedReason.replace(/^Pendiente:\s*/, '')}</div>
            )}
            {procedure.status === 'PENDING' && (
              <div className="lab-pending-copy">El procedimiento aún no está habilitado.</div>
            )}

            {completed && (
              <div className="lab-completed-details">
                {procedure.performedAt && <span>Hora realizada: {localDateTime(procedure.performedAt)}</span>}
                <span>Registrado por: {procedure.recordedBy || 'No informado'}</span>
              </div>
            )}
          </div>

          {!completed && (
            <div className="lab-procedure-actions">
              {procedure.status === 'READY' && (
                <button
                  className="lab-button primary"
                  disabled={isBusy}
                  onClick={() => void startProcedure(group, procedure)}
                >
                  {isBusy ? 'Iniciando...' : 'Iniciar'}
                </button>
              )}
              {procedure.status === 'IN_PROGRESS' && !isCompleting && (
                <button
                  className="lab-button primary"
                  disabled={isBusy}
                  onClick={() => requestCompletion(group, procedure)}
                >
                  {isBusy ? 'Guardando...' : 'Completar'}
                </button>
              )}
              {procedure.status === 'BLOCKED' && (
                <button className="lab-button disabled" disabled>Bloqueado</button>
              )}
              {procedure.status === 'IN_PROGRESS' && isCompleting && (
                <div className="lab-completion-form">
                  <label htmlFor={`performed-at-${procedure.id}`}>
                    Hora realizada{procedure.timeCaptureMode === 'REQUIRED' ? ' *' : ' (opcional)'}
                  </label>
                  <input
                    id={`performed-at-${procedure.id}`}
                    type="datetime-local"
                    required={procedure.timeCaptureMode === 'REQUIRED'}
                    value={performedAtInput}
                    onChange={(event) => setPerformedAtInput(event.target.value)}
                  />
                  <div className="lab-form-actions">
                    <button className="lab-button primary" disabled={isBusy} onClick={() => void completeProcedure(group.visit, procedure)}>
                      {isBusy ? 'Guardando...' : 'Confirmar'}
                    </button>
                    <button className="lab-button secondary" disabled={isBusy} onClick={() => setCompletionProcedure(null)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </article>
    )
  }

  function visitCard(group: VisitProcedureGroup, completed = false) {
    return (
      <section className="lab-visit-group" key={group.visit.id}>
        <header className="lab-visit-header">
          <div>
            <h2>{group.visit.participant.code} · {group.visit.participant.studyCode} · {group.visit.visitCode}</h2>
            <div className="lab-visit-details">
              <span>Turno {group.visit.scheduledTime.slice(0, 5)}</span>
              <span>Llegada {localTime(group.visit.arrivalAt)}</span>
              <span>{group.visit.room ?? 'Consultorio sin asignar'}</span>
            </div>
          </div>
        </header>
        <div className="lab-procedure-list">
          {group.procedures.map((procedure) => procedureCard(group, procedure, completed))}
        </div>
      </section>
    )
  }

  return (
    <>
      <style>{`
        .lab-page {
          min-height: 100vh;
          overflow-x: hidden;
          background: #f4f7fb;
          color: #14213d;
        }

        .lab-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 16px 20px;
          background: linear-gradient(90deg, #073763, #0a4f86);
          color: white;
        }

        .lab-header h1 { margin: 0; font-size: 22px; }
        .lab-header p { margin: 4px 0 0; opacity: .84; font-size: 14px; }
        .lab-header-actions { display: flex; flex-wrap: wrap; gap: 8px; }

        .lab-header-button {
          min-height: 42px;
          padding: 8px 12px;
          border: 1px solid rgba(255,255,255,.4);
          border-radius: 7px;
          background: rgba(255,255,255,.12);
          color: white;
          cursor: pointer;
          font-weight: 700;
        }

        .lab-header-button:hover:not(:disabled) { background: rgba(255,255,255,.22); }
        .lab-header-button:disabled { opacity: .6; cursor: wait; }

        .lab-content { width: min(100%, 980px); margin: 0 auto; padding: 18px 14px 36px; }
        .lab-context { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; }
        .lab-context p { margin: 0; color: #526173; font-size: 13px; }
        .lab-technician { color: #526173; font-size: 13px; white-space: nowrap; }

        .lab-filters { display: flex; width: fit-content; max-width: 100%; margin-bottom: 18px; padding: 3px; border: 1px solid #d5e0e9; border-radius: 8px; background: white; }
        .lab-filter { min-height: 40px; padding: 8px 13px; border: 0; border-radius: 6px; background: transparent; color: #526173; cursor: pointer; font-weight: 700; }
        .lab-filter[aria-pressed="true"] { background: #e6f3fa; color: #075b83; }

        .lab-queue { display: grid; gap: 14px; }
        .lab-visit-group { overflow: hidden; border: 1px solid #dce5ed; border-radius: 10px; background: white; }
        .lab-visit-header { padding: 14px 15px; border-bottom: 1px solid #e7edf2; background: #fff; }
        .lab-visit-header h2 { margin: 0; font-size: 16px; line-height: 1.35; overflow-wrap: anywhere; }
        .lab-visit-details { display: flex; flex-wrap: wrap; gap: 5px 14px; margin-top: 7px; color: #5e6e7e; font-size: 13px; }
        .lab-procedure-list { display: grid; gap: 0; }
        .lab-procedure-card { padding: 14px 15px; border-bottom: 1px solid #edf1f5; }
        .lab-procedure-card:last-child { border-bottom: 0; }
        .lab-procedure-card.is-completed { background: #fafcfd; }
        .lab-procedure-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .lab-procedure-kind { margin-bottom: 4px; color: #537084; font-size: 11px; font-weight: 800; letter-spacing: .04em; }
        .lab-procedure-heading h3 { margin: 0; font-size: 15px; line-height: 1.4; overflow-wrap: anywhere; }

        .lab-status { flex: 0 0 auto; display: inline-flex; align-items: center; min-height: 30px; padding: 5px 9px; border-radius: 999px; font-size: 12px; font-weight: 800; }
        .lab-status.ready { background: #e0f3e7; color: #17633a; }
        .lab-status.in-progress { background: #dff3fb; color: #075f84; }
        .lab-status.blocked { background: #fde8e3; color: #8b3d30; }
        .lab-status.pending { background: #edf1f4; color: #526173; }
        .lab-status.completed { background: #e9f2ed; color: #276c40; }

        .lab-blocked-reason { margin-top: 10px; padding: 9px 11px; border-left: 3px solid #b94430; border-radius: 4px; background: #fff3f0; color: #843728; font-size: 13px; }
        .lab-pending-copy { margin-top: 9px; color: #69788b; font-size: 13px; }
        .lab-procedure-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }

        .lab-button { min-height: 46px; padding: 10px 16px; border: 0; border-radius: 7px; cursor: pointer; font-weight: 800; font-size: 14px; }
        .lab-button.primary { flex: 1 1 150px; background: #1187d1; color: white; }
        .lab-button.primary:hover:not(:disabled) { background: #0874b7; }
        .lab-button.secondary { background: white; color: #17658e; border: 1px solid #b9d7e8; }
        .lab-button.secondary:hover:not(:disabled) { background: #eff8fc; }
        .lab-button.disabled { background: #e8edf1; color: #657585; cursor: not-allowed; }
        .lab-button:disabled { opacity: .65; cursor: wait; }

        .lab-completion-form { width: 100%; display: grid; gap: 9px; padding: 12px; border: 1px solid #cfe0ea; border-radius: 8px; background: #f5fafc; }
        .lab-completion-form label { color: #34495b; font-size: 13px; font-weight: 800; }
        .lab-completion-form input { width: 100%; min-height: 46px; padding: 9px 10px; border: 1px solid #c5d2dc; border-radius: 6px; background: white; color: #14213d; font: inherit; }
        .lab-form-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .lab-form-actions .lab-button { flex: 1 1 130px; }
        .lab-completed-details { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 10px; color: #486052; font-size: 13px; }

        .lab-section-title { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin: 24px 0 10px; }
        .lab-section-title h2 { margin: 0; font-size: 18px; }
        .lab-section-title span { color: #69788b; font-size: 12px; }
        .lab-message { padding: 14px 15px; border: 1px solid #dce5ed; border-radius: 8px; background: white; color: #526173; line-height: 1.45; }
        .lab-message.error { border-color: #efc2b8; background: #fff0ed; color: #843728; }
        .lab-retry { min-height: 42px; margin-top: 10px; padding: 8px 13px; border: 1px solid #b9d7e8; border-radius: 7px; background: white; color: #17658e; cursor: pointer; font-weight: 700; }
        .lab-notice { margin-bottom: 12px; padding: 10px 12px; border: 1px solid #b9dfc5; border-radius: 7px; background: #eaf7ef; color: #276c40; font-size: 14px; }
        .lab-action-error { margin-bottom: 12px; padding: 10px 12px; border: 1px solid #efc2b8; border-radius: 7px; background: #fff0ed; color: #843728; font-size: 14px; }

        @media (min-width: 720px) {
          .lab-header { padding: 18px 28px; }
          .lab-content { padding: 24px 22px 42px; }
          .lab-procedure-card { padding: 16px 18px; }
          .lab-procedure-main { display: grid; grid-template-columns: minmax(0, 1fr) minmax(180px, .42fr); gap: 16px; align-items: center; }
          .lab-procedure-actions { justify-content: flex-end; margin-top: 0; }
          .lab-procedure-actions > .lab-button { flex: 0 0 auto; min-width: 150px; }
          .lab-completion-form { grid-column: 1 / -1; }
        }

        @media (max-width: 480px) {
          .lab-header { align-items: flex-start; flex-direction: column; }
          .lab-header h1 { font-size: 19px; }
          .lab-header p { font-size: 12px; }
          .lab-header-actions { width: 100%; justify-content: space-between; }
          .lab-header-button { min-height: 40px; padding: 7px 9px; font-size: 12px; }
          .lab-context { align-items: flex-start; flex-direction: column; }
          .lab-status { max-width: 145px; white-space: normal; text-align: center; line-height: 1.2; }
          .lab-filter { padding-inline: 9px; font-size: 13px; }
        }
      `}</style>

      <div className="lab-page">
        <header className="lab-header">
          <div>
            <h1>CEMEDIC · Procedimientos técnicos</h1>
            <p>Laboratorio, ECG y muestras protocolizadas</p>
          </div>
          <div className="lab-header-actions">
            <button className="lab-header-button" disabled={loading} onClick={() => setReloadKey((key) => key + 1)}>
              {loading ? 'Actualizando...' : 'Actualizar'}
            </button>
            <button className="lab-header-button" onClick={onVolver}>← Volver</button>
          </div>
        </header>

        <main className="lab-content">
          <div className="lab-context">
            <p>Procedimientos técnicos de visitas presentes o en curso</p>
            <span className="lab-technician">Usuario técnico: {CURRENT_TECHNICIAN}</span>
          </div>

          <div className="lab-filters" role="group" aria-label="Filtrar procedimientos">
            {([
              ['ALL', 'Todos'],
              ['LAB', 'Laboratorio'],
              ['ECG_TECH', 'ECG'],
            ] as const).map(([value, label]) => (
              <button
                className="lab-filter"
                key={value}
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>

          {completionNotice && <div className="lab-notice" role="status">{completionNotice}</div>}
          {actionError && <div className="lab-action-error" role="alert">{actionError}</div>}

          {loading ? (
            <div className="lab-message" aria-live="polite">Cargando procedimientos técnicos...</div>
          ) : loadError ? (
            <div className="lab-message error" role="alert">
              No se pudo conectar con el servidor local
              <br />
              <button className="lab-retry" onClick={() => setReloadKey((key) => key + 1)}>Reintentar</button>
            </div>
          ) : (
            <>
              <div className="lab-section-title">
                <h2>Cola técnica</h2>
                <span>{visibleGroups.reduce((count, group) => count + group.procedures.length, 0)} pendientes</span>
              </div>

              {visibleGroups.length === 0 ? (
                <div className="lab-message">No hay procedimientos técnicos pendientes en este momento.</div>
              ) : (
                <div className="lab-queue">{visibleGroups.map((group) => visitCard(group))}</div>
              )}

              {completedGroups.length > 0 && (
                <>
                  <div className="lab-section-title">
                    <h2>Completados hoy</h2>
                    <span>{completedGroups.reduce((count, group) => count + group.procedures.length, 0)} registrados</span>
                  </div>
                  <div className="lab-queue">{completedGroups.map((group) => visitCard(group, true))}</div>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </>
  )
}