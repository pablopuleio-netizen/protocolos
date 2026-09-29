import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config/api'

type Participant = { id: string; code: string; studyCode: string }
type VisitStatus = 'SCHEDULED' | 'PRESENT' | 'IN_PROGRESS' | 'NO_SHOW' | 'COMPLETED'
type ProcedureStatus = 'PENDING' | 'READY' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'NOT_APPLICABLE'
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
  visit: { id: string }
  code: string
  name: string
  category: string
  responsibleRole: 'DOCTOR' | 'STUDY_COORDINATOR' | 'LAB' | 'ECG_TECH' | 'SHARED'
  status: ProcedureStatus
  timeCaptureMode: 'NONE' | 'OPTIONAL' | 'REQUIRED'
  sortOrder: number
  blockedReason: string | null
  dependsOnCodes: string[]
  startedAt: string | null
  completedAt: string | null
  performedAt: string | null
  recordedAt: string | null
  recordedBy: string | null
}
type ClinicalRecord = {
  fastingStatus: 'YES' | 'NO' | 'DOUBTFUL' | 'NOT_RECORDED'
  fastingHours: string | number | null
  weightKg: string | number | null
  waistCm: string | number | null
  systolic1: number | null; diastolic1: number | null; pulse1: number | null
  systolic2: number | null; diastolic2: number | null; pulse2: number | null
  systolic3: number | null; diastolic3: number | null; pulse3: number | null
  conmedReviewed: boolean | null; conmedChanges: boolean | null
  aeReviewed: boolean | null; hasActiveAe: boolean | null
  phq9Completed: boolean | null; cssrsCompleted: boolean | null; cssrsAlert: boolean | null
  eligibilityDecision: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'PENDING' | null
  continueStudy: 'YES' | 'NO' | 'PENDING' | null
  doseDecision: string | null
  updatedAt: string
}
type VisitData = { visit: Visit; procedures: VisitProcedure[]; record: ClinicalRecord }
type Alert = { key: string; text: string; kind: 'blocked' | 'ready' | 'clinical' }
type Activity = { id: string; at: string; clinicalTime: boolean; text: string; by: string | null }

type StudyCoordinatorProps = { onVolver: () => void }

function localDateString() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function timeLabel(timestamp: string | null) {
  if (!timestamp) return 'Sin registrar'
  return new Date(timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function statusName(status: VisitStatus) {
  if (status === 'SCHEDULED') return 'Esperado'
  if (status === 'PRESENT') return 'Presente'
  if (status === 'IN_PROGRESS') return 'En atención'
  if (status === 'NO_SHOW') return 'No asistió'
  return 'Completado'
}

function procedureStatusName(status: ProcedureStatus) {
  if (status === 'READY') return 'Listo'
  if (status === 'IN_PROGRESS') return 'En curso'
  if (status === 'COMPLETED') return 'Completado'
  if (status === 'BLOCKED') return 'Bloqueado'
  if (status === 'NOT_APPLICABLE') return 'No aplica'
  return 'Pendiente'
}

function roleName(role: VisitProcedure['responsibleRole']) {
  if (role === 'DOCTOR') return 'Médico'
  if (role === 'STUDY_COORDINATOR') return 'Study Coordinator'
  if (role === 'LAB') return 'Laboratorio'
  if (role === 'ECG_TECH') return 'ECG'
  return 'Compartido'
}

function visitStatusView(visit: Visit, now: number) {
  if (visit.status === 'SCHEDULED') {
    const [year, month, day] = visit.scheduledDate.split('-').map(Number)
    const [hour, minute] = visit.scheduledTime.split(':').map(Number)
    const scheduledAt = new Date(year, month - 1, day, hour, minute).getTime()
    const minutes = Math.floor((now - scheduledAt) / 60_000)
    if (minutes > 30) return { text: `Demorado · ${minutes} min`, className: 'visit-late', waitAlert: true }
    return { text: 'Esperado', className: 'visit-scheduled', waitAlert: false }
  }
  if (visit.status === 'PRESENT' && visit.arrivalAt) {
    const minutes = Math.max(0, Math.floor((now - new Date(visit.arrivalAt).getTime()) / 60_000))
    if (minutes > 30) return { text: `Espera prolongada · ${minutes} min`, className: 'visit-late', waitAlert: true }
    return { text: `Presente · espera ${minutes} min`, className: 'visit-present', waitAlert: false }
  }
  return { text: statusName(visit.status), className: `visit-${visit.status.toLowerCase()}`, waitAlert: false }
}

function alertsFor(visit: Visit, procedures: VisitProcedure[], record: ClinicalRecord | null): Alert[] {
  const alerts: Alert[] = []
  for (const procedure of procedures) {
    if (procedure.status === 'BLOCKED') {
      alerts.push({ key: `blocked-${procedure.id}`, text: `${procedure.name} bloqueado${procedure.blockedReason ? ` — falta ${procedure.blockedReason.replace(/^Pendiente:\s*/, '')}` : ''}`, kind: 'blocked' })
    } else if (procedure.status === 'READY') {
      alerts.push({ key: `ready-${procedure.id}`, text: `${procedure.name} listo, todavía no iniciado`, kind: 'ready' })
    }
  }
  if (record?.hasActiveAe === true) alerts.push({ key: `ae-${visit.id}`, text: 'AE activo informado', kind: 'clinical' })
  if (record?.cssrsAlert === true) alerts.push({ key: `cssrs-${visit.id}`, text: 'Alerta C-SSRS informada', kind: 'clinical' })
  if (record?.fastingStatus === 'NO') alerts.push({ key: `fasting-no-${visit.id}`, text: 'Ayuno: No', kind: 'clinical' })
  if (record?.fastingStatus === 'DOUBTFUL') alerts.push({ key: `fasting-doubt-${visit.id}`, text: 'Ayuno dudoso', kind: 'clinical' })
  if (record?.eligibilityDecision === 'PENDING') alerts.push({ key: `eligibility-${visit.id}`, text: 'Elegibilidad pendiente', kind: 'clinical' })
  if (record?.continueStudy === 'PENDING') alerts.push({ key: `continue-${visit.id}`, text: 'Continuidad pendiente', kind: 'clinical' })
  return alerts
}

export default function StudyCoordinator({ onVolver }: StudyCoordinatorProps) {
  const [data, setData] = useState<VisitData[]>([])
  const [visitaAbierta, setVisitaAbierta] = useState<Visit | null>(null)
  const [procedimientosAbiertos, setProcedimientosAbiertos] = useState<VisitProcedure[]>([])
  const [registroAbierto, setRegistroAbierto] = useState<ClinicalRecord | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [listError, setListError] = useState(false)
  const [detailError, setDetailError] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const date = localDateString()
    async function loadList() {
      setLoadingList(true)
      setListError(false)
      try {
        const response = await fetch(`${API_BASE_URL}/visits?date=${date}`, { signal: controller.signal })
        if (!response.ok) throw new Error()
        const visits = (await response.json()) as Visit[]
        const sorted = visits.sort((first, second) => first.scheduledTime.localeCompare(second.scheduledTime))
        const loaded = await Promise.all(sorted.map(async (visit) => {
          const [procedureResponse, recordResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/visits/${visit.id}/procedures`, { signal: controller.signal }),
            fetch(`${API_BASE_URL}/visits/${visit.id}/clinical-record`, { signal: controller.signal }),
          ])
          if (!procedureResponse.ok || !recordResponse.ok) throw new Error()
          const [procedures, record] = await Promise.all([procedureResponse.json(), recordResponse.json()]) as [VisitProcedure[], ClinicalRecord]
          return { visit, procedures, record }
        }))
        setData(loaded)
      } catch {
        if (!controller.signal.aborted) { setListError(true); setData([]) }
      } finally {
        if (!controller.signal.aborted) setLoadingList(false)
      }
    }
    void loadList()
    return () => controller.abort()
  }, [reloadKey])

  useEffect(() => {
    if (!visitaAbierta) return
    const activeVisit = visitaAbierta
    const controller = new AbortController()
    async function loadDetail() {
      setLoadingDetail(true)
      setDetailError(false)
      try {
        const [procedureResponse, recordResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/visits/${activeVisit.id}/procedures`, { signal: controller.signal }),
          fetch(`${API_BASE_URL}/visits/${activeVisit.id}/clinical-record`, { signal: controller.signal }),
        ])
        if (!procedureResponse.ok || !recordResponse.ok) throw new Error()
        const [procedures, record] = await Promise.all([procedureResponse.json(), recordResponse.json()]) as [VisitProcedure[], ClinicalRecord]
        setProcedimientosAbiertos(procedures.sort((first, second) => first.sortOrder - second.sortOrder))
        setRegistroAbierto(record)
      } catch {
        if (!controller.signal.aborted) setDetailError(true)
      } finally {
        if (!controller.signal.aborted) setLoadingDetail(false)
      }
    }
    void loadDetail()
    return () => controller.abort()
  }, [visitaAbierta, reloadKey])

  const alertsByVisit = new Map(data.map(({ visit, procedures, record }) => [visit.id, alertsFor(visit, procedures, record)]))
  const alertsCount = data.reduce((count, item) => count + alertsFor(item.visit, item.procedures, item.record).length, 0)
  const visitsWithAlerts = data.filter((item) => alertsFor(item.visit, item.procedures, item.record).length > 0).length
  const blockedCount = data.reduce((count, item) => count + item.procedures.filter((procedure) => procedure.status === 'BLOCKED').length, 0)
  const presenteCount = data.filter(({ visit }) => visit.status === 'PRESENT').length
  const inProgressCount = data.filter(({ visit }) => visit.status === 'IN_PROGRESS').length

  function refreshAll() {
    setRefreshing(true)
    setReloadKey((value) => value + 1)
    window.setTimeout(() => setRefreshing(false), 500)
  }

  function openVisit(visit: Visit) {
    setProcedimientosAbiertos([])
    setRegistroAbierto(null)
    setVisitaAbierta(visit)
  }

  function closeVisit() {
    setVisitaAbierta(null)
    setProcedimientosAbiertos([])
    setRegistroAbierto(null)
  }

  function procedureCounts(procedures: VisitProcedure[]) {
    return {
      completed: procedures.filter((procedure) => procedure.status === 'COMPLETED').length,
      ready: procedures.filter((procedure) => procedure.status === 'READY').length,
      blocked: procedures.filter((procedure) => procedure.status === 'BLOCKED').length,
      pending: procedures.filter((procedure) => procedure.status === 'PENDING').length,
      inProgress: procedures.filter((procedure) => procedure.status === 'IN_PROGRESS').length,
      total: procedures.filter((procedure) => procedure.status !== 'NOT_APPLICABLE').length,
    }
  }

  function procedureRoleClass(role: VisitProcedure['responsibleRole']) {
    return `role-${role.toLowerCase().replace('_', '-')}`
  }

  function clinicalValue(value: string | number | boolean | null | undefined, suffix = '') {
    if (value === null || value === undefined || value === '') return null
    if (typeof value === 'boolean') return value ? 'Sí' : 'No'
    return `${value}${suffix}`
  }

  function summarizeClinical(record: ClinicalRecord) {
    const fasting = record.fastingStatus === 'NOT_RECORDED' ? 'Sin registrar' : record.fastingStatus === 'YES' ? 'Sí' : record.fastingStatus === 'NO' ? 'No' : 'Dudoso'
    const systolic = [record.systolic1, record.systolic2, record.systolic3]
    const diastolic = [record.diastolic1, record.diastolic2, record.diastolic3]
    const bpAverage = systolic.every((value) => value !== null) && diastolic.every((value) => value !== null)
      ? `${Math.round((systolic as number[]).reduce((sum, value) => sum + value, 0) / 3)} / ${Math.round((diastolic as number[]).reduce((sum, value) => sum + value, 0) / 3)} mmHg`
      : null
    return [
      ['Ayuno', fasting === 'Sí' && record.fastingHours !== null ? `Sí · ${record.fastingHours} h` : fasting],
      ['Peso', clinicalValue(record.weightKg, ' kg')],
      ['Cintura', clinicalValue(record.waistCm, ' cm')],
      ['TA promedio', bpAverage],
      ['Conmed revisada', clinicalValue(record.conmedReviewed)],
      ['Cambios conmed', clinicalValue(record.conmedChanges)],
      ['Revisión EA', clinicalValue(record.aeReviewed)],
      ['AE activo', clinicalValue(record.hasActiveAe)],
      ['PHQ-9', clinicalValue(record.phq9Completed)],
      ['C-SSRS', clinicalValue(record.cssrsCompleted)],
      ['Alerta C-SSRS', clinicalValue(record.cssrsAlert)],
      ['Elegibilidad', record.eligibilityDecision ? ({ ELIGIBLE: 'Elegible', NOT_ELIGIBLE: 'No elegible', PENDING: 'Pendiente' }[record.eligibilityDecision]) : null],
      ['Continuidad', record.continueStudy ? ({ YES: 'Continuar', NO: 'No continuar', PENDING: 'Pendiente' }[record.continueStudy]) : null],
      ['Dosis', record.doseDecision],
    ].filter((entry): entry is [string, string] => entry[1] !== null)
  }

  function clinicalAlerts(record: ClinicalRecord) {
    const alerts: Alert[] = []
    if (record.hasActiveAe === true) alerts.push({ key: 'clinical-ae', text: 'AE activo informado', kind: 'clinical' })
    if (record.cssrsAlert === true) alerts.push({ key: 'clinical-cssrs', text: 'Alerta C-SSRS', kind: 'clinical' })
    if (record.fastingStatus === 'NO') alerts.push({ key: 'clinical-fast-no', text: 'Ayuno: No', kind: 'clinical' })
    if (record.fastingStatus === 'DOUBTFUL') alerts.push({ key: 'clinical-fast-doubt', text: 'Ayuno dudoso', kind: 'clinical' })
    if (record.eligibilityDecision === 'PENDING') alerts.push({ key: 'clinical-eligibility', text: 'Elegibilidad pendiente', kind: 'clinical' })
    if (record.continueStudy === 'PENDING') alerts.push({ key: 'clinical-continue', text: 'Continuidad pendiente', kind: 'clinical' })
    return alerts
  }

  function activityFor(procedures: VisitProcedure[]): Activity[] {
    return procedures.flatMap((procedure) => {
      if (procedure.status !== 'COMPLETED') return []
      if (procedure.performedAt) return [{ id: procedure.id, at: procedure.performedAt, clinicalTime: true, text: procedure.name, by: procedure.recordedBy }]
      const technicalTime = procedure.recordedAt ?? procedure.completedAt
      if (technicalTime) return [{ id: procedure.id, at: technicalTime, clinicalTime: false, text: procedure.name, by: procedure.recordedBy }]
      return []
    }).sort((first, second) => new Date(first.at).getTime() - new Date(second.at).getTime())
  }

  const detailAlerts = visitaAbierta
    ? [...alertsFor(visitaAbierta, procedimientosAbiertos, registroAbierto), ...(registroAbierto ? clinicalAlerts(registroAbierto) : [])]
    : []
  const detailActivity = activityFor(procedimientosAbiertos)
  return <>
    <style>{`
      .sc-app,.sc-app *{box-sizing:border-box}.sc-app{min-height:100vh;background:#f4f7fb;color:#14213d}.sc-header{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:17px 24px;background:linear-gradient(90deg,#073763,#0a4f86);color:white}.sc-header h1{margin:0;font-size:23px}.sc-header p{margin:4px 0 0;font-size:13px;opacity:.84}.sc-header-actions{display:flex;align-items:center;gap:8px}.sc-button{min-height:42px;padding:8px 12px;border:1px solid #ffffff55;border-radius:7px;background:#ffffff1f;color:white;cursor:pointer;font-weight:700}.sc-button:disabled{opacity:.6;cursor:wait}.sc-content{width:min(100%,1500px);margin:0 auto;padding:20px 22px 38px}.sc-indicadores{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-bottom:17px}.sc-indicador{padding:13px;border:1px solid #e1e8ef;border-radius:8px;background:white}.sc-numero{font-size:22px;font-weight:800}.sc-label{margin-top:4px;color:#657585;font-size:12px}.sc-layout{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(300px,.8fr);gap:14px;align-items:start}.sc-panel{padding:16px;border:1px solid #e0e7ef;border-radius:9px;background:white}.sc-panel h2{margin:0 0 13px;font-size:18px}.visita-card{margin-bottom:10px;padding:14px;border:1px solid #dfe6ee;border-radius:8px;background:white}.visita-top{display:flex;justify-content:space-between;align-items:flex-start;gap:15px}.visita-hora{font-size:18px;font-weight:800;color:#073763}.visita-codigo{margin-top:4px;font-size:15px;font-weight:800}.muted{margin-top:4px;color:#718096;font-size:12px}.estado{display:inline-block;padding:6px 9px;border-radius:999px;font-size:12px;font-weight:800}.estado-presente{background:#dff3ff;color:#16678f}.estado-en_curso{background:#e8ddff;color:#6240a7}.estado-esperado{background:#edf2f7;color:#526173}.estado-demorado,.estado-espera{background:#fff1df;color:#9a5a08}.estado-no_show,.estado-completado{background:#edf0f3;color:#526173}.visita-llegada{margin-top:6px;color:#526173;font-size:12px}.progress-summary{margin-top:13px}.progress-label{display:flex;justify-content:space-between;gap:10px;margin-bottom:5px;color:#536477;font-size:12px}.progress-bar{height:7px;overflow:hidden;border-radius:999px;background:#edf1f5}.progress-bar span{display:block;height:100%;background:#1187d1}.progress-counts{margin-top:6px;color:#66788a;font-size:12px}.sc-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.sc-action{min-height:38px;padding:7px 11px;border:1px solid #d4dee7;border-radius:7px;background:white;color:#32465a;font-weight:700}.sc-action.primary{border-color:#1187d1;background:#1187d1;color:white}.sc-action:disabled{opacity:.55;cursor:not-allowed}.sc-message{padding:12px;border:1px solid #dce5ed;border-radius:8px;background:#f8fafc;color:#526173;font-size:13px}.sc-message.error{border-color:#efc2b8;background:#fff0ed;color:#843728}.sc-retry{min-height:40px;margin-top:8px;padding:7px 11px;border:1px solid #b9d7e8;border-radius:7px;background:white;color:#17658e;font-weight:700}.alert-list{display:grid;gap:8px}.alert-item{padding:9px 10px;border-left:3px solid #a9b7c5;border-radius:4px;background:#f7f9fb;color:#405261;font-size:12px;line-height:1.4}.alert-item.blocked{border-color:#b94430;background:#fff4f1}.alert-item.ready{border-color:#c18a1a;background:#fff9e9}.alert-item.clinical{border-color:#8d5a9e;background:#fbf5fc}.detail-header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}.detail-header h2{margin:0;font-size:20px}.detail-top-actions{display:flex;gap:7px}.detail-back{min-height:40px;padding:7px 11px;border:1px solid #b9d7e8;border-radius:7px;background:white;color:#17658e;font-weight:700}.detail-summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1px;overflow:hidden;margin-bottom:12px;border:1px solid #dce5ed;border-radius:8px;background:#dce5ed}.detail-summary>div{min-width:0;padding:10px;background:white;overflow-wrap:anywhere}.detail-summary small{display:block;margin-bottom:4px;color:#657585;font-size:11px;font-weight:700}.detail-summary strong{font-size:13px}.detail-columns{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(280px,.8fr);gap:12px;align-items:start}.procedure-list{display:grid;gap:7px}.procedure-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:10px 0;border-bottom:1px solid #edf1f4}.procedure-row:last-child{border-bottom:0}.procedure-title{font-size:13px;font-weight:800}.procedure-meta{display:flex;flex-wrap:wrap;gap:6px 10px;margin-top:5px;color:#69788b;font-size:11px}.role-tag{display:inline-flex;padding:3px 7px;border-radius:999px;background:#eef3f6;color:#40586a;font-size:10px;font-weight:800}.pstatus{display:inline-flex;height:fit-content;padding:5px 8px;border-radius:999px;background:#edf1f4;color:#526173;font-size:11px;font-weight:800;white-space:nowrap}.pstatus.ready{background:#e0f3e7;color:#17633a}.pstatus.blocked{background:#fde8e3;color:#8b3d30}.pstatus.in-progress{background:#dff3fb;color:#075f84}.pstatus.completed{background:#e9f2ed;color:#276c40}.pstatus.not-applicable{background:#f0f0f0;color:#646d75}.reason{margin-top:5px;color:#843728;font-size:11px}.clinical-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.clinical-item{padding:8px;border-radius:6px;background:#f5f8fa;min-width:0}.clinical-item small{display:block;margin-bottom:4px;color:#657585;font-size:10px;font-weight:700}.clinical-item span{font-size:12px;font-weight:700;overflow-wrap:anywhere}.activity-list{display:grid;gap:0}.activity-item{display:grid;grid-template-columns:72px minmax(0,1fr);gap:9px;padding:9px 0;border-bottom:1px solid #edf1f4}.activity-item:last-child{border-bottom:0}.activity-time{font-weight:800;font-size:12px;color:#075b83}.activity-detail{font-size:12px}.activity-meta{margin-top:3px;color:#69788b;font-size:10px}.sc-disabled-actions{display:grid;gap:7px;margin-top:12px}.sc-disabled-actions button{min-height:38px;border:1px solid #d5dee6;border-radius:6px;background:#f6f8fa;color:#6a7885;font-weight:700}.detail-refreshing{opacity:.65}
      @media(max-width:1050px){.sc-layout,.detail-columns{grid-template-columns:1fr}.sc-indicadores{grid-template-columns:repeat(3,minmax(0,1fr))}.detail-summary{grid-template-columns:repeat(3,minmax(0,1fr))}}
      @media(max-width:620px){.sc-header{align-items:flex-start;flex-direction:column;padding:14px}.sc-header-actions{width:100%;justify-content:space-between}.sc-content{padding:13px 11px 28px}.sc-indicadores{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.sc-indicador{padding:10px}.sc-numero{font-size:19px}.visita-top{flex-direction:column}.detail-header{flex-direction:column}.detail-top-actions{width:100%}.detail-back{flex:1}.detail-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.procedure-row{grid-template-columns:minmax(0,1fr)}.pstatus{width:fit-content}.clinical-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `}</style>

    <div className="sc-app">
      <header className="sc-header">
        <div><h1>CEMEDIC · Study Coordinator</h1><p>Torre de control de visitas</p></div>
        <div className="sc-header-actions">
          <button className="sc-button" disabled={refreshing || loadingList} onClick={refreshAll}>{refreshing ? 'Actualizando...' : 'Actualizar'}</button>
          <button className="sc-button" onClick={onVolver}>← Volver</button>
        </div>
      </header>

      <main className="sc-content">
        {visitaAbierta ? (
          <>
            <div className="detail-header">
              <div><h2>{visitaAbierta.participant.code} · {visitaAbierta.participant.studyCode} · {visitaAbierta.visitCode}</h2><span className="muted">Detalle operativo persistente</span></div>
              <div className="detail-top-actions"><button className="detail-back" disabled={refreshing} onClick={refreshAll}>{refreshing ? 'Actualizando...' : 'Actualizar'}</button><button className="detail-back" onClick={closeVisit}>← Volver al flujo</button></div>
            </div>

            {detailError && <div className="sc-message error">No se pudo cargar el estado operativo de la visita<button className="sc-retry" onClick={refreshAll}>Reintentar</button></div>}
            {loadingDetail && <div className="sc-message">Cargando estado operativo...</div>}

            {!loadingDetail && !detailError && <>
              <section className="detail-summary">
                <div><small>Hora</small><strong>{visitaAbierta.scheduledTime.slice(0,5)}</strong></div>
                <div><small>Llegada</small><strong>{timeLabel(visitaAbierta.arrivalAt)}</strong></div>
                <div><small>Médico</small><strong>{visitaAbierta.assignedDoctor}</strong></div>
                <div><small>Consultorio</small><strong>{visitaAbierta.room ?? 'Sin asignar'}</strong></div>
                <div><small>Estado</small><strong>{statusName(visitaAbierta.status)}</strong></div>
              </section>

              <div className="detail-columns">
                <section className="sc-panel">
                  <h2>Procedimientos persistentes</h2>
                  {procedimientosAbiertos.length === 0 ? <div className="sc-message">Esta visita no tiene procedimientos persistidos.</div> : <div className="procedure-list">{procedimientosAbiertos.map((procedure) => (
                        <article className="procedure-row" key={procedure.id}>
                          <div>
                            <div className="procedure-title">{procedure.name}</div>
                            {procedure.status === 'BLOCKED' && procedure.blockedReason && <div className="reason">{procedure.blockedReason}</div>}
                            <div className="procedure-meta">
                              <span className={`role-tag ${procedureRoleClass(procedure.responsibleRole)}`}>{roleName(procedure.responsibleRole)}</span>
                              {procedure.timeCaptureMode !== 'NONE' && procedure.performedAt && <span>Hora clínica: {timeLabel(procedure.performedAt)}</span>}
                              {procedure.recordedBy && <span>Registrado por: {procedure.recordedBy}</span>}
                            </div>
                          </div>
                          <span className={`pstatus ${procedure.status.toLowerCase().replace('_','-')}`}>{procedureStatusName(procedure.status)}</span>
                          {procedure.responsibleRole === 'STUDY_COORDINATOR' && procedure.status === 'READY' && <button className="sc-action" disabled title="Próximamente">Gestionar próximamente</button>}
                        </article>
                      ))}</div>}
                </section>

                <aside style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
                  <section className="sc-panel">
                    <h2>Resumen clínico operativo</h2>
                    {!registroAbierto ? <div className="sc-message">Sin registrar</div> : <div className="clinical-grid">
                      {summarizeClinical(registroAbierto).map(([label, value]) => <div className="clinical-item" key={label}><small>{label}</small><span>{value}</span></div>)}
                    </div>}
                    {registroAbierto && <div className="activity-meta" style={{ marginTop: 9 }}>Registro actualizado {new Date(registroAbierto.updatedAt).toLocaleString('es-AR')}</div>}
                  </section>

                  <section className="sc-panel">
                    <h2>Alertas operativas</h2>
                    {detailAlerts.length === 0 ? <div className="sc-message">Sin alertas operativas registradas.</div> : <div className="alert-list">{detailAlerts.map((alert) => <div className={`alert-item ${alert.kind}`} key={alert.key}>{alert.text}</div>)}</div>}
                  </section>

                  <section className="sc-panel">
                    <h2>Actividad registrada</h2>
                    {detailActivity.length === 0 ? <div className="sc-message">Sin procedimientos completados con fecha disponible.</div> : <div className="activity-list">{detailActivity.map((activity) => <div className="activity-item" key={activity.id}><div className="activity-time">{timeLabel(activity.at)}</div><div><div className="activity-detail">{activity.text}</div><div className="activity-meta">{activity.clinicalTime ? 'Hora clínica' : `Registrado a las ${timeLabel(activity.at)}`}{activity.by ? ` · ${activity.by}` : ''}</div></div></div>)}</div>}
                  </section>
                  <div className="sc-disabled-actions"><button disabled>Reasignar médico · Próximamente</button><button disabled>Editar consultorio · Próximamente</button><button disabled>Registrar incidencia · Próximamente</button></div>
                </aside>
              </div>
            </>}
          </>
        ) : (
          <>
            <div className="sc-indicadores">
              <div className="sc-indicador"><div className="sc-numero">{data.length}</div><div className="sc-label">Visitas hoy</div></div>
              <div className="sc-indicador"><div className="sc-numero">{presenteCount}</div><div className="sc-label">Presentes</div></div>
              <div className="sc-indicador"><div className="sc-numero">{inProgressCount}</div><div className="sc-label">En atención</div></div>
              <div className="sc-indicador"><div className="sc-numero">{visitsWithAlerts}</div><div className="sc-label">Visitas con alertas</div></div>
              <div className="sc-indicador"><div className="sc-numero">{blockedCount}</div><div className="sc-label">Procedimientos bloqueados</div></div>
            </div>
            <div className="sc-layout">
              <section className="sc-panel">
                <h2>Flujo de hoy</h2>
                {loadingList && <div className="sc-message">Cargando flujo del día...</div>}
                {!loadingList && listError && <div className="sc-message error">No se pudo cargar el estado operativo de la visita<button className="sc-retry" onClick={refreshAll}>Reintentar</button></div>}
                {!loadingList && !listError && data.length === 0 && <div className="sc-message">No hay visitas para hoy.</div>}
                {!loadingList && !listError && data.map(({ visit, procedures }) => {
                  const state = visitStatusView(visit, now)
                  const counts = procedureCounts(procedures)
                  const alerts = alertsByVisit.get(visit.id) ?? []
                  const percent = counts.total ? Math.round((counts.completed / counts.total) * 100) : 0
                  return <article className="visita-card" key={visit.id}>
                    <div className="visita-top"><div>
                      <div className="visita-hora">{visit.scheduledTime.slice(0,5)}</div>
                      <div className="visita-codigo">{visit.participant.code}</div>
                      <div className="muted">{visit.participant.studyCode} · {visit.visitCode}</div>
                      <div className="muted">{visit.assignedDoctor} · {visit.room ?? 'Consultorio sin asignar'}</div>
                      {visit.arrivalAt && <div className="visita-llegada">Llegó {timeLabel(visit.arrivalAt)}</div>}
                    </div><span className={`estado ${state.className}`}>{state.text}</span></div>
                    <div className="progress-summary">
                      <div className="progress-label"><span>Procedimientos</span><span>{counts.completed} completados · {counts.ready} listos · {counts.blocked} bloqueados · {counts.pending} pendientes{counts.inProgress ? ` · ${counts.inProgress} en curso` : ''}</span></div>
                      <div className="progress-bar"><span style={{ width: `${percent}%` }} /></div>
                    </div>
                    <div className="sc-actions"><button className="sc-action primary" onClick={() => openVisit(visit)}>Abrir visita</button><button className="sc-action" disabled title="Próximamente">Solicitar médico · Próximamente</button><button className="sc-action" disabled title="Próximamente">Solicitar laboratorio · Próximamente</button></div>
                    {alerts.length > 0 && <div className="alert-list" style={{ marginTop: 10 }}>{alerts.slice(0,3).map((alert) => <div className={`alert-item ${alert.kind}`} key={alert.key}>{alert.text}</div>)}</div>}
                  </article>
                })}
              </section>
              <aside className="sc-panel"><h2>Alertas operativas</h2>{loadingList && <div className="sc-message">Cargando alertas...</div>}{!loadingList && !listError && alertsCount === 0 && <div className="sc-message">Sin alertas operativas.</div>}{!loadingList && !listError && <div className="alert-list">{data.flatMap(({ visit, procedures, record }) => alertsFor(visit, procedures, record).map((alert) => <div className={`alert-item ${alert.kind}`} key={`${visit.id}-${alert.key}`}><strong>{visit.participant.code} · {visit.visitCode}</strong><br />{alert.text}</div>))}</div>}{listError && <div className="sc-message error">Alertas no disponibles.</div>}</aside>
            </div>
          </>
        )}
      </main>
    </div>
  </>
}