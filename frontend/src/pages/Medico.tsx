import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config/api'

type Participant = { id: string; code: string; studyCode: string }
type VisitStatus = 'SCHEDULED' | 'PRESENT' | 'IN_PROGRESS' | 'NO_SHOW' | 'COMPLETED'
type ProcedureStatus = 'PENDING' | 'READY' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'NOT_APPLICABLE'
type TimeCaptureMode = 'NONE' | 'OPTIONAL' | 'REQUIRED'
type Visit = { id: string; participant: Participant; visitCode: string; scheduledDate: string; scheduledTime: string; assignedDoctor: string; room: string | null; status: VisitStatus; arrivalAt: string | null; startedAt: string | null; completedAt: string | null }
type VisitProcedure = { id: string; code: string; name: string; status: ProcedureStatus; blockedReason: string | null; timeCaptureMode: TimeCaptureMode; startedAt: string | null; completedAt: string | null; performedAt: string | null }
type ClinicalRecord = {
  id: string; fastingStatus: 'YES' | 'NO' | 'DOUBTFUL' | 'NOT_RECORDED'; fastingHours: string | number | null; fastingNotes: string | null
  weightKg: string | number | null; waistCm: string | number | null
  systolic1: number | null; diastolic1: number | null; pulse1: number | null
  systolic2: number | null; diastolic2: number | null; pulse2: number | null
  systolic3: number | null; diastolic3: number | null; pulse3: number | null
  conmedReviewed: boolean | null; conmedChanges: boolean | null; conmedNotes: string | null
  aeReviewed: boolean | null; hasActiveAe: boolean | null; aeNotes: string | null
  physicalExamPerformed: boolean | null; physicalExamNotes: string | null
  phq9Completed: boolean | null; cssrsCompleted: boolean | null; cssrsAlert: boolean | null; questionnaireNotes: string | null
  eligibilityDecision: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'PENDING' | null
  continueStudy: 'YES' | 'NO' | 'PENDING' | null
  doseDecision: 'INCREASE' | 'MAINTAIN' | 'DECREASE' | 'INTERRUPT' | 'RESTART' | 'DISCONTINUE' | 'NOT_APPLICABLE' | null
  doseDecisionNotes: string | null; medicalNotes: string | null; recordedBy: string | null; createdAt: string; updatedAt: string
}
type ClinicalPatch = Partial<Omit<ClinicalRecord, 'id' | 'createdAt' | 'updatedAt'>>
type MedicoProps = { onVolver: () => void }

const CURRENT_DOCTOR = 'Dr. Puleio'

function localDateString() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function localDateTimeInput() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function localTime(value: string | null) {
  return value ? new Date(value).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'Sin registrar'
}

function Choice<T extends string | boolean>({ name, value, options, onChange }: { name: string; value: T | null; options: Array<{ value: T; label: string }>; onChange: (value: T) => void }) {
  return <div className="choice-row">{options.map((option) => <label className={`choice ${value === option.value ? 'selected' : ''}`} key={`${name}-${String(option.value)}`}><input type="radio" name={name} checked={value === option.value} onChange={() => onChange(option.value)} />{option.label}</label>)}</div>
}

export default function Medico({ onVolver }: MedicoProps) {
  const [visitas, setVisitas] = useState<Visit[]>([])
  const [visitaActiva, setVisitaActiva] = useState<Visit | null>(null)
  const [registro, setRegistro] = useState<ClinicalRecord | null>(null)
  const [procedimientos, setProcedimientos] = useState<VisitProcedure[]>([])
  const [cargando, setCargando] = useState(true)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [errorCarga, setErrorCarga] = useState(false)
  const [errorDetalle, setErrorDetalle] = useState(false)
  const [reintento, setReintento] = useState(0)
  const [ahora, setAhora] = useState(Date.now())
  const [guardando, setGuardando] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null)
  const [completando, setCompletando] = useState<string | null>(null)
  const [horaVitales, setHoraVitales] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const query = new URLSearchParams({ date: localDateString(), doctor: CURRENT_DOCTOR })
    async function load() {
      setCargando(true); setErrorCarga(false)
      try {
        const response = await fetch(`${API_BASE_URL}/visits?${query}`, { signal: controller.signal })
        if (!response.ok) throw new Error()
        setVisitas(await response.json() as Visit[])
      } catch {
        if (!controller.signal.aborted) setErrorCarga(true)
      } finally {
        if (!controller.signal.aborted) setCargando(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [reintento])

  useEffect(() => {
    const timer = window.setInterval(() => setAhora(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!visitaActiva) return
    const activeVisit = visitaActiva
    const controller = new AbortController()
    async function loadVisitData() {
      setCargandoDetalle(true); setErrorDetalle(false)
      try {
        const [recordResponse, procedureResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/visits/${activeVisit.id}/clinical-record`, { signal: controller.signal }),
          fetch(`${API_BASE_URL}/visits/${activeVisit.id}/procedures`, { signal: controller.signal }),
        ])
        if (!recordResponse.ok || !procedureResponse.ok) throw new Error()
        const [record, procedures] = await Promise.all([recordResponse.json(), procedureResponse.json()]) as [ClinicalRecord, VisitProcedure[]]
        setRegistro(record); setProcedimientos(procedures)
      } catch {
        if (!controller.signal.aborted) setErrorDetalle(true)
      } finally {
        if (!controller.signal.aborted) setCargandoDetalle(false)
      }
    }
    void loadVisitData()
    return () => controller.abort()
  }, [visitaActiva])

  const cola = visitas.filter((visit) => visit.status === 'PRESENT' || visit.status === 'IN_PROGRESS').sort((a, b) => {
    const aTime = a.arrivalAt ? new Date(a.arrivalAt).getTime() : new Date(`${a.scheduledDate}T${a.scheduledTime}`).getTime()
    const bTime = b.arrivalAt ? new Date(b.arrivalAt).getTime() : new Date(`${b.scheduledDate}T${b.scheduledTime}`).getTime()
    return aTime - bTime
  })
  const procedureByCode = new Map(procedimientos.map((procedure) => [procedure.code, procedure]))
  const presentCount = cola.filter((visit) => visit.status === 'PRESENT').length
  const inProgressCount = cola.filter((visit) => visit.status === 'IN_PROGRESS').length
  const prolongedCount = cola.filter((visit) => visit.status === 'PRESENT' && visit.arrivalAt && ahora - new Date(visit.arrivalAt).getTime() > 30 * 60_000).length

  async function save(section: string, patch: ClinicalPatch) {
    if (!visitaActiva) return
    setGuardando(section); setMensaje(null); setErrorGuardado(null)
    try {
      const response = await fetch(`${API_BASE_URL}/visits/${visitaActiva.id}/clinical-record`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...patch, recordedBy: CURRENT_DOCTOR }),
      })
      if (!response.ok) throw new Error()
      setRegistro(await response.json() as ClinicalRecord)
      setMensaje('Guardado correctamente')
    } catch {
      setErrorGuardado('No se pudo guardar. Reintente.')
    } finally {
      setGuardando(null)
    }
  }

  async function refreshProcedures() {
    if (!visitaActiva) return
    const response = await fetch(`${API_BASE_URL}/visits/${visitaActiva.id}/procedures`)
    if (!response.ok) throw new Error()
    setProcedimientos(await response.json() as VisitProcedure[])
  }

  async function completeMedical(code: string, performedAt?: string) {
    const procedure = procedureByCode.get(code)
    if (!procedure || !visitaActiva) return
    if (procedure.status === 'BLOCKED' || procedure.status === 'COMPLETED') return
    if (procedure.timeCaptureMode === 'REQUIRED' && !performedAt) {
      setErrorGuardado('Indique la hora realizada para completar este bloque.')
      return
    }
    const body: { recordedBy: string; performedAt?: string } = { recordedBy: CURRENT_DOCTOR }
    if (performedAt) {
      const parsed = new Date(performedAt)
      if (Number.isNaN(parsed.getTime())) { setErrorGuardado('La hora realizada no es válida.'); return }
      body.performedAt = parsed.toISOString()
    }
    setGuardando(code); setMensaje(null); setErrorGuardado(null)
    try {
      const response = await fetch(`${API_BASE_URL}/visit-procedures/${procedure.id}/complete-medical`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { message?: string } | null
        throw new Error(payload?.message ?? 'No se pudo completar el bloque médico.')
      }
      setCompletando(null); setHoraVitales(''); setMensaje('Guardado correctamente')
      await refreshProcedures()
    } catch (error) {
      setErrorGuardado(error instanceof Error ? error.message : 'No se pudo guardar. Reintente.')
    } finally {
      setGuardando(null)
    }
  }

  function ProcedureState({ code }: { code: string }) {
    const procedure = procedureByCode.get(code)
    if (!procedure) return <div className="muted">No está configurado para esta visita.</div>
    const label = procedure.status === 'READY' ? 'Listo' : procedure.status === 'BLOCKED' ? 'Bloqueado' : procedure.status === 'IN_PROGRESS' ? 'En curso' : procedure.status === 'COMPLETED' ? 'Completado' : procedure.status === 'NOT_APPLICABLE' ? 'No aplica' : 'Pendiente'
    return <div className="procedure-state"><span className={`status ${procedure.status.toLowerCase().replace('_', '-')}`}>{label}</span>{procedure.status === 'BLOCKED' && procedure.blockedReason && <span className="blocked">Pendiente de completar requisitos previos: {procedure.blockedReason.replace(/^Pendiente:\s*/, '')}</span>}{procedure.completedAt && <span className="muted">Actualizado {new Date(procedure.completedAt).toLocaleString('es-AR')}</span>}</div>
  }

  function completeButton(code: string, label: string, timed = false) {
    const procedure = procedureByCode.get(code)
    if (!procedure || ['BLOCKED', 'PENDING', 'NOT_APPLICABLE'].includes(procedure.status)) return null
    if (procedure.status === 'COMPLETED') return <div className="success">✓ Bloque completado</div>
    const needsTime = timed && procedure.timeCaptureMode === 'REQUIRED'
    const isOpen = completando === code
    return <div className="block-actions">
      {needsTime && isOpen && <label className="field">Hora realizada<input type="datetime-local" required value={horaVitales} onChange={(event) => setHoraVitales(event.target.value)} /></label>}
      <div className="actions">
        {needsTime && !isOpen
          ? <button className="button" onClick={() => { setHoraVitales(localDateTimeInput()); setCompletando(code) }}>{label}</button>
          : <button className="button" disabled={guardando === code || (needsTime && !horaVitales)} onClick={() => void completeMedical(code, needsTime ? horaVitales : undefined)}>{guardando === code ? 'Guardando...' : needsTime ? 'Confirmar finalización' : label}</button>}
        {isOpen && <button className="button secondary" disabled={guardando === code} onClick={() => { setCompletando(null); setHoraVitales('') }}>Cancelar</button>}
      </div>
    </div>
  }

  function saveButton(section: string, label: string, patch: ClinicalPatch) {
    return <button className="button secondary" disabled={guardando === section} onClick={() => void save(section, patch)}>{guardando === section ? 'Guardando...' : label}</button>
  }

  function clinicalCard(title: string, code: string, children: React.ReactNode) {
    return <section className="clinical-card"><h3>{title}</h3><ProcedureState code={code} />{children}</section>
  }

  const avg = (values: Array<number | null>) => {
    const present = values.filter((value): value is number => value !== null)
    return present.length ? Math.round(present.reduce((sum, value) => sum + value, 0) / present.length) : null
  }

  return <>
    <style>{`
      .medical-page,.medical-page *{box-sizing:border-box}
      .medical-page{min-height:100vh;background:#f4f7fb;color:#14213d}.medical-header{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:17px 22px;background:linear-gradient(90deg,#073763,#0a4f86);color:#fff}.medical-header h1{margin:0;font-size:22px}.medical-header p{margin:4px 0 0;font-size:13px;opacity:.85}.medical-header button,.button{min-height:44px;padding:9px 13px;border:0;border-radius:7px;background:#1187d1;color:#fff;font-weight:800;cursor:pointer}.medical-header button{border:1px solid #ffffff66;background:#ffffff20}.medical-wrap{width:min(100%,1050px);margin:0 auto;padding:18px 14px 36px}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px}.metric,.panel,.clinical-card{padding:13px;border:1px solid #e0e7ef;border-radius:8px;background:#fff}.metric small,.label{display:block;color:#657585;font-size:12px;font-weight:700}.metric strong{display:block;margin-top:4px;font-size:20px}.queue{display:grid;gap:9px}.patient{display:grid;grid-template-columns:70px minmax(0,1fr) minmax(130px,.7fr) auto;gap:11px;align-items:center;padding:13px;border:1px solid #dfe6ed;border-radius:8px;background:white}.time{font-size:19px;font-weight:800;color:#073763}.code{font-weight:800;font-size:14px}.muted{margin-top:4px;color:#69788b;font-size:12px}.badge{display:inline-block;padding:6px 9px;border-radius:999px;background:#e3f2fa;color:#17658e;font-size:12px;font-weight:800}.button.secondary{background:#fff;color:#17658e;border:1px solid #b9d7e8}.button:disabled{opacity:.55;cursor:not-allowed}.title-row{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:13px}.title-row h2{margin:0;font-size:20px}.summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1px;overflow:hidden;margin-bottom:12px;border:1px solid #dce5ed;border-radius:8px;background:#dce5ed}.summary>div{min-width:0;padding:10px;background:white;overflow-wrap:anywhere}.summary strong{font-size:13px}.notice,.error,.saved{margin-bottom:10px;padding:10px 12px;border-radius:7px;font-size:13px}.notice{background:#f2f8fb;border:1px solid #d7e4ed;color:#40596a}.error{background:#fff0ed;border:1px solid #efc2b8;color:#843728}.saved{background:#eaf7ef;border:1px solid #b9dfc5;color:#276c40}.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.clinical-card h3{margin:0 0 10px;font-size:15px}.procedure-state{display:flex;flex-wrap:wrap;align-items:center;gap:7px;margin-bottom:10px}.status{display:inline-flex;padding:5px 9px;border-radius:999px;background:#edf1f4;color:#526173;font-size:12px;font-weight:800}.status.ready{background:#e0f3e7;color:#17633a}.status.blocked{background:#fde8e3;color:#8b3d30}.status.in-progress{background:#dff3fb;color:#075f84}.status.completed{background:#e9f2ed;color:#276c40}.blocked{color:#843728;font-size:12px}.fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.field{display:flex;flex-direction:column;gap:5px;min-width:0;color:#526173;font-size:12px;font-weight:800}.field.full{grid-column:1/-1}.field input,.field select,.field textarea{width:100%;min-height:42px;padding:8px 10px;border:1px solid #cbd7e0;border-radius:6px;background:white;color:#14213d;font:inherit}.field textarea{min-height:64px;resize:vertical}.choices{display:flex;flex-wrap:wrap;gap:6px}.choice{display:flex;align-items:center;gap:6px;min-height:38px;padding:6px 9px;border:1px solid #d2dde5;border-radius:6px;background:white;font-size:13px;font-weight:500}.choice input{width:16px;min-height:16px;accent-color:#087eb9}.actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}.actions .button{flex:1 1 145px}.block-actions{margin-top:8px}.avg{margin-top:8px;padding:9px;border-radius:6px;background:#f1f6f9;font-size:13px;font-weight:700}.success{color:#276c40;font-size:13px;font-weight:800}.record-meta{margin-top:10px;color:#69788b;font-size:12px}
      @media(max-width:760px){.patient{grid-template-columns:60px minmax(0,1fr) auto}.patient .doctor-room{grid-column:2}.patient .patient-action{grid-column:1/-1}.patient-action button{width:100%}.summary{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:560px){.medical-header{align-items:flex-start;flex-direction:column;padding:14px}.medical-header h1{font-size:20px}.medical-header button{align-self:flex-end}.medical-wrap{padding:13px 11px 28px}.metrics{gap:5px}.metric{padding:9px}.metric strong{font-size:17px}.patient{grid-template-columns:1fr 1fr}.patient .doctor-room{grid-column:auto}.patient .patient-action{grid-column:1/-1}.patient-action button{width:100%}.title-row{align-items:flex-start;flex-direction:column}.cards{grid-template-columns:1fr}.clinical-card,.panel{padding:12px}.fields{grid-template-columns:1fr 1fr}.field.full{grid-column:1/-1}.actions .button{flex-basis:100%}}
    `}</style>
    <div className="medical-page">
      <header className="medical-header"><div><h1>CEMEDIC · Médico</h1><p>Pacientes en espera y evaluación clínica</p><p>Médico actual: {CURRENT_DOCTOR}</p></div><button onClick={onVolver}>← Volver</button></header>
      <main className="medical-wrap">
        {!visitaActiva ? <>
          <div className="metrics"><div className="metric"><small>Pacientes en espera</small><strong>{presentCount}</strong></div><div className="metric"><small>En evaluación</small><strong>{inProgressCount}</strong></div><div className="metric"><small>Espera &gt;30 min</small><strong>{prolongedCount}</strong></div></div>
          <div className="title-row"><div><h2>Mi cola</h2><span className="muted">{cola.length} pacientes · ordenados por llegada</span></div><span className="badge">{CURRENT_DOCTOR}</span></div>
          <div className="queue">
            {cargando && <div className="panel">Cargando mi cola...</div>}
            {!cargando && errorCarga && <div className="error">No se pudo conectar con el servidor local<br /><button className="button secondary" onClick={() => setReintento((value) => value + 1)}>Reintentar</button></div>}
            {!cargando && !errorCarga && cola.length === 0 && <div className="panel">No hay pacientes esperando atención en este momento.</div>}
            {!cargando && !errorCarga && cola.map((visit) => { const minutes = visit.arrivalAt ? Math.max(0, Math.floor((ahora - new Date(visit.arrivalAt).getTime()) / 60_000)) : null; return <article className="patient" key={visit.id}><div className="time">{localTime(visit.arrivalAt)}</div><div><div className="code">{visit.participant.code} · {visit.participant.studyCode} · {visit.visitCode}</div><div className="muted">Turno {visit.scheduledTime.slice(0, 5)} · Llegó {localTime(visit.arrivalAt)}</div></div><div className="doctor-room"><div>{visit.assignedDoctor}</div><div className="muted">{visit.room ?? 'Consultorio sin asignar'}</div><span className="badge">{visit.status === 'PRESENT' ? 'Esperando médico' : 'En evaluación'}</span><div className="muted">Espera {minutes ?? 0} min{visit.status === 'PRESENT' && (minutes ?? 0) > 30 ? ' · Espera prolongada' : ''}</div></div><div className="patient-action"><button className="button" onClick={() => { setRegistro(null); setProcedimientos([]); setMensaje(null); setErrorGuardado(null); setVisitaActiva(visit) }}>Abrir evaluación</button></div></article> })}
          </div>
        </> : <>
          <div className="title-row"><div><h2>{visitaActiva.participant.code} · {visitaActiva.participant.studyCode} · {visitaActiva.visitCode}</h2><span className="muted">Evaluación clínica persistente</span></div><button className="button secondary" onClick={() => { setVisitaActiva(null); setRegistro(null); setProcedimientos([]) }}>← Volver a mi cola</button></div>
          <section className="summary"><div><span className="label">Turno</span><strong>{visitaActiva.scheduledTime.slice(0, 5)}</strong></div><div><span className="label">Llegada</span><strong>{localTime(visitaActiva.arrivalAt)}</strong></div><div><span className="label">Médico</span><strong>{visitaActiva.assignedDoctor}</strong></div><div><span className="label">Consultorio</span><strong>{visitaActiva.room ?? 'Sin asignar'}</strong></div><div><span className="label">Estado</span><strong>{visitaActiva.status === 'PRESENT' ? 'Esperando médico' : 'En evaluación'}</strong></div></section>
          {mensaje && <div className="saved" role="status">{mensaje}</div>}{errorGuardado && <div className="error" role="alert">{errorGuardado}</div>}
          {cargandoDetalle && <div className="panel">Cargando registro clínico...</div>}
          {errorDetalle && <div className="error">No se pudo conectar con el servidor local</div>}
          {!cargandoDetalle && !errorDetalle && registro && <>
            <div className="cards">
              {clinicalCard('Ayuno', 'FASTING', <>
                <div className="field"><span className="label">Estado</span><Choice name="fasting" value={registro.fastingStatus === 'NOT_RECORDED' ? null : registro.fastingStatus} options={[{value:'YES',label:'Sí'},{value:'NO',label:'No'},{value:'DOUBTFUL',label:'Dudoso'}]} onChange={(value) => setRegistro({...registro,fastingStatus:value})}/></div>
                {registro.fastingStatus === 'YES' && <label className="field">Horas aproximadas<input type="number" min="0" step="0.5" value={registro.fastingHours ?? ''} onChange={(event) => setRegistro({...registro,fastingHours:event.target.value === '' ? null : Number(event.target.value)})}/></label>}
                <label className="field">Notas<textarea value={registro.fastingNotes ?? ''} onChange={(event) => setRegistro({...registro,fastingNotes:event.target.value})}/></label>
                <div className="actions">{saveButton('fasting','Guardar ayuno',{fastingStatus:registro.fastingStatus,fastingHours:registro.fastingStatus === 'YES' && registro.fastingHours !== '' ? registro.fastingHours === null ? null : Number(registro.fastingHours) : null,fastingNotes:registro.fastingNotes})}{completeButton('FASTING','Completar ayuno')}</div>
              </>)}

              {clinicalCard('Antropometría', 'ANTHROPOMETRY', <>
                <div className="fields"><label className="field">Peso kg<input type="number" min="0" step="0.1" value={registro.weightKg ?? ''} onChange={(event) => setRegistro({...registro,weightKg:event.target.value === '' ? null : Number(event.target.value)})}/></label><label className="field">Cintura cm<input type="number" min="0" step="0.1" value={registro.waistCm ?? ''} onChange={(event) => setRegistro({...registro,waistCm:event.target.value === '' ? null : Number(event.target.value)})}/></label></div>
                <div className="actions">{saveButton('anthro','Guardar',{weightKg:registro.weightKg === null || registro.weightKg === '' ? null : Number(registro.weightKg),waistCm:registro.waistCm === null || registro.waistCm === '' ? null : Number(registro.waistCm)})}{completeButton('ANTHROPOMETRY','Completar antropometría')}</div>
              </>)}

              {clinicalCard('Signos vitales', 'VITALS', <>
                <div className="fields">{([1,2,3] as const).map((number) => <div className="field full" key={number}><span className="label">Medición {number}</span><div className="fields"><label className="field">Sistólica<input type="number" min="0" value={registro[`systolic${number}`] ?? ''} onChange={(event) => setRegistro({...registro,[`systolic${number}`]:event.target.value === '' ? null : Number(event.target.value)})}/></label><label className="field">Diastólica<input type="number" min="0" value={registro[`diastolic${number}`] ?? ''} onChange={(event) => setRegistro({...registro,[`diastolic${number}`]:event.target.value === '' ? null : Number(event.target.value)})}/></label><label className="field full">Pulso<input type="number" min="0" value={registro[`pulse${number}`] ?? ''} onChange={(event) => setRegistro({...registro,[`pulse${number}`]:event.target.value === '' ? null : Number(event.target.value)})}/></label></div></div>)}</div>
                <div className="avg">Promedio visual TA: {avg([registro.systolic1,registro.systolic2,registro.systolic3]) ?? '—'} / {avg([registro.diastolic1,registro.diastolic2,registro.diastolic3]) ?? '—'} mmHg</div>
                <div className="actions">{saveButton('vitals','Guardar signos vitales',{systolic1:registro.systolic1,diastolic1:registro.diastolic1,pulse1:registro.pulse1,systolic2:registro.systolic2,diastolic2:registro.diastolic2,pulse2:registro.pulse2,systolic3:registro.systolic3,diastolic3:registro.diastolic3,pulse3:registro.pulse3})}{completeButton('VITALS','Completar signos vitales',true)}</div>
              </>)}

              {clinicalCard('Conmed + eventos adversos', 'CONMED_AE', <>
                <div className="field"><span className="label">Medicación concomitante revisada</span><Choice name="conmed-reviewed" value={registro.conmedReviewed} options={[{value:true,label:'Sí'},{value:false,label:'No'}]} onChange={(value) => setRegistro({...registro,conmedReviewed:value})}/></div>
                <div className="field"><span className="label">¿Cambios?</span><Choice name="conmed-changes" value={registro.conmedChanges} options={[{value:true,label:'Sí'},{value:false,label:'No'}]} onChange={(value) => setRegistro({...registro,conmedChanges:value})}/></div>
                <label className="field">Notas de medicación<textarea value={registro.conmedNotes ?? ''} onChange={(event) => setRegistro({...registro,conmedNotes:event.target.value})}/></label>
                <div className="field"><span className="label">Eventos adversos revisados</span><Choice name="ae-reviewed" value={registro.aeReviewed} options={[{value:true,label:'Sí'},{value:false,label:'No'}]} onChange={(value) => setRegistro({...registro,aeReviewed:value})}/></div>
                <div className="field"><span className="label">¿Hay EA activo?</span><Choice name="active-ae" value={registro.hasActiveAe} options={[{value:true,label:'Sí'},{value:false,label:'No'}]} onChange={(value) => setRegistro({...registro,hasActiveAe:value})}/></div>
                <label className="field">Notas EA<textarea value={registro.aeNotes ?? ''} onChange={(event) => setRegistro({...registro,aeNotes:event.target.value})}/></label>
                <div className="actions">{saveButton('conmed','Guardar revisión',{conmedReviewed:registro.conmedReviewed,conmedChanges:registro.conmedChanges,conmedNotes:registro.conmedNotes,aeReviewed:registro.aeReviewed,hasActiveAe:registro.hasActiveAe,aeNotes:registro.aeNotes})}{completeButton('CONMED_AE','Completar revisión Conmed / AE')}</div>
              </>)}

              {clinicalCard('Examen / evaluación dirigida', 'PHYSICAL_EVAL', <>
                <div className="field"><span className="label">Realizada</span><Choice name="physical-exam" value={registro.physicalExamPerformed} options={[{value:true,label:'Sí'},{value:false,label:'No'}]} onChange={(value) => setRegistro({...registro,physicalExamPerformed:value})}/></div>
                <label className="field">Observación breve<textarea value={registro.physicalExamNotes ?? ''} onChange={(event) => setRegistro({...registro,physicalExamNotes:event.target.value})}/></label>
                <div className="actions">{saveButton('physical','Guardar examen',{physicalExamPerformed:registro.physicalExamPerformed,physicalExamNotes:registro.physicalExamNotes})}{completeButton('PHYSICAL_EVAL','Completar examen')}</div>
              </>)}

              {clinicalCard('PHQ-9', 'PHQ9', <>
                <div className="field"><span className="label">PHQ-9 realizado</span><Choice name="phq9" value={registro.phq9Completed} options={[{value:true,label:'Sí'},{value:false,label:'No'}]} onChange={(value) => setRegistro({...registro,phq9Completed:value})}/></div>
                <label className="field">Notas<textarea value={registro.questionnaireNotes ?? ''} onChange={(event) => setRegistro({...registro,questionnaireNotes:event.target.value})}/></label>
                <div className="actions">{saveButton('phq9','Guardar PHQ-9',{phq9Completed:registro.phq9Completed,questionnaireNotes:registro.questionnaireNotes})}{completeButton('PHQ9','Completar PHQ-9')}</div>
              </>)}

              {clinicalCard('C-SSRS', 'CSSRS', <>
                {procedureByCode.get('CSSRS')?.status === 'BLOCKED' ? <div className="error">Pendiente de completar requisitos previos: {procedureByCode.get('CSSRS')?.blockedReason?.replace(/^Pendiente:\s*/, '')}</div> : <>
                  <div className="field"><span className="label">C-SSRS realizado</span><Choice name="cssrs" value={registro.cssrsCompleted} options={[{value:true,label:'Sí'},{value:false,label:'No'}]} onChange={(value) => setRegistro({...registro,cssrsCompleted:value})}/></div>
                  <div className="field"><span className="label">Alerta / requiere evaluación adicional</span><Choice name="cssrs-alert" value={registro.cssrsAlert} options={[{value:true,label:'Sí'},{value:false,label:'No'}]} onChange={(value) => setRegistro({...registro,cssrsAlert:value})}/></div>
                  <label className="field">Notas<textarea value={registro.questionnaireNotes ?? ''} onChange={(event) => setRegistro({...registro,questionnaireNotes:event.target.value})}/></label>
                  <div className="actions">{saveButton('cssrs','Guardar C-SSRS',{cssrsCompleted:registro.cssrsCompleted,cssrsAlert:registro.cssrsAlert,questionnaireNotes:registro.questionnaireNotes})}{completeButton('CSSRS','Completar C-SSRS')}</div>
                </>}
              </>)}
            </div>

            <section className="panel decision-panel"><h2>Decisión médica</h2><div className="fields">
              <label className="field">Elegibilidad<select value={registro.eligibilityDecision ?? ''} onChange={(event) => setRegistro({...registro,eligibilityDecision:(event.target.value || null) as ClinicalRecord['eligibilityDecision']})}><option value="">Seleccionar</option><option value="ELIGIBLE">Elegible</option><option value="NOT_ELIGIBLE">No elegible</option><option value="PENDING">Pendiente</option></select></label>
              <label className="field">Continuidad<select value={registro.continueStudy ?? ''} onChange={(event) => setRegistro({...registro,continueStudy:(event.target.value || null) as ClinicalRecord['continueStudy']})}><option value="">Seleccionar</option><option value="YES">Continuar</option><option value="NO">No continuar</option><option value="PENDING">Pendiente</option></select></label>
              <label className="field full">Decisión de dosis<select value={registro.doseDecision ?? ''} onChange={(event) => setRegistro({...registro,doseDecision:(event.target.value || null) as ClinicalRecord['doseDecision']})}><option value="">Seleccionar</option><option value="INCREASE">Aumentar</option><option value="MAINTAIN">Mantener</option><option value="DECREASE">Disminuir</option><option value="INTERRUPT">Interrumpir</option><option value="RESTART">Reiniciar</option><option value="DISCONTINUE">Discontinuar</option><option value="NOT_APPLICABLE">No aplica</option></select></label>
              <label className="field full">Notas de decisión<textarea value={registro.doseDecisionNotes ?? ''} onChange={(event) => setRegistro({...registro,doseDecisionNotes:event.target.value})}/></label>
              <label className="field full">Notas médicas<textarea value={registro.medicalNotes ?? ''} onChange={(event) => setRegistro({...registro,medicalNotes:event.target.value})}/></label>
            </div><div className="actions">{saveButton('decision','Guardar decisión médica',{eligibilityDecision:registro.eligibilityDecision,continueStudy:registro.continueStudy,doseDecision:registro.doseDecision,doseDecisionNotes:registro.doseDecisionNotes,medicalNotes:registro.medicalNotes})}</div><p className="muted">Estas decisiones se guardan, pero no habilitan automáticamente IWRS.</p><p className="record-meta">Actualizado: {new Date(registro.updatedAt).toLocaleString('es-AR')} · {registro.recordedBy ?? CURRENT_DOCTOR}</p></section>
          </>}
        </>}
      </main>
    </div>
  </>
}