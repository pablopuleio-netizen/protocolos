import { useState } from 'react'

type EstadoTarea = 'Bloqueado' | 'Listo' | 'En curso' | 'Completado'
type Procedimiento = 'ECG' | 'Laboratorio' | 'Laboratorio + PK'
type Prerrequisito = {
  nombre: string
  estado: 'cumplido' | 'pendiente' | 'no-aplica'
}

type TareaTecnica = {
  id: number
  codigo: string
  estudio: string
  visita: string
  procedimiento: Procedimiento
  medico: string
  consultorio: string
  horaTurno: string
  horaLlegada: string
  ayuno: 'Sí' | 'No' | 'No corresponde'
  estado: EstadoTarea
  motivo?: string
  etiquetas: string[]
  coordinador: string
  prerrequisitos: Prerrequisito[]
  horaInicio?: string
  horaFinalizacion?: string
  realizadoPor?: string
}

type LaboratorioProps = {
  onVolver: () => void
}

const tareasIniciales: TareaTecnica[] = [
  {
    id: 1,
    codigo: 'ARG005-001',
    estudio: 'GZVA',
    visita: 'V3',
    procedimiento: 'ECG',
    medico: 'Dr. Puleio',
    consultorio: 'Consultorio 2',
    horaTurno: '08:00',
    horaLlegada: '08:04',
    ayuno: 'Sí',
    estado: 'Bloqueado',
    motivo: 'Signos vitales todavía no completados',
    etiquetas: [],
    coordinador: 'Study Coordinator · Lic. Gómez',
    prerrequisitos: [
      { nombre: 'Paciente presente', estado: 'cumplido' },
      { nombre: 'Ayuno confirmado', estado: 'cumplido' },
      { nombre: 'Signos vitales completados', estado: 'pendiente' },
      { nombre: 'Evaluación previa', estado: 'no-aplica' },
    ],
  },
  {
    id: 2,
    codigo: 'ARG005-001',
    estudio: 'GZVA',
    visita: 'V3',
    procedimiento: 'Laboratorio',
    medico: 'Dr. Puleio',
    consultorio: 'Consultorio 2',
    horaTurno: '08:00',
    horaLlegada: '08:04',
    ayuno: 'Sí',
    estado: 'Bloqueado',
    motivo: 'Signos vitales todavía no completados',
    etiquetas: ['Basal'],
    coordinador: 'Study Coordinator · Lic. Gómez',
    prerrequisitos: [
      { nombre: 'Paciente presente', estado: 'cumplido' },
      { nombre: 'Ayuno confirmado', estado: 'cumplido' },
      { nombre: 'Signos vitales completados', estado: 'pendiente' },
      { nombre: 'Evaluación previa', estado: 'no-aplica' },
    ],
  },
  {
    id: 3,
    codigo: 'ARG005-008',
    estudio: 'GZVA',
    visita: 'V5',
    procedimiento: 'Laboratorio',
    medico: 'Dr. Puleio',
    consultorio: 'Consultorio 1',
    horaTurno: '09:00',
    horaLlegada: '09:20',
    ayuno: 'Sí',
    estado: 'Listo',
    etiquetas: [],
    coordinador: 'Study Coordinator · Lic. Gómez',
    prerrequisitos: [
      { nombre: 'Paciente presente', estado: 'cumplido' },
      { nombre: 'Ayuno confirmado', estado: 'cumplido' },
      { nombre: 'Signos vitales completados', estado: 'cumplido' },
      { nombre: 'Evaluación previa', estado: 'no-aplica' },
    ],
  },
  {
    id: 4,
    codigo: 'ARG005-020',
    estudio: 'GZVA',
    visita: 'V6',
    procedimiento: 'Laboratorio + PK',
    medico: 'Dr. Pérez',
    consultorio: 'Sala de procedimientos',
    horaTurno: '09:40',
    horaLlegada: '09:33',
    ayuno: 'No',
    estado: 'Listo',
    etiquetas: ['PK', 'Muestra temporizada'],
    coordinador: 'Study Coordinator · Lic. Gómez',
    prerrequisitos: [
      { nombre: 'Paciente presente', estado: 'cumplido' },
      { nombre: 'Ayuno confirmado', estado: 'no-aplica' },
      { nombre: 'Signos vitales completados', estado: 'cumplido' },
      { nombre: 'Evaluación previa', estado: 'cumplido' },
    ],
  },
  {
    id: 5,
    codigo: 'ARG005-011',
    estudio: 'GZVA',
    visita: 'V11',
    procedimiento: 'ECG',
    medico: 'Dr. Puleio',
    consultorio: 'Consultorio 3',
    horaTurno: '10:00',
    horaLlegada: '09:52',
    ayuno: 'No corresponde',
    estado: 'En curso',
    etiquetas: [],
    coordinador: 'Study Coordinator · Lic. Gómez',
    prerrequisitos: [
      { nombre: 'Paciente presente', estado: 'cumplido' },
      { nombre: 'Ayuno confirmado', estado: 'no-aplica' },
      { nombre: 'Signos vitales completados', estado: 'cumplido' },
      { nombre: 'Evaluación previa', estado: 'no-aplica' },
    ],
    horaInicio: '10:02',
  },
  {
    id: 6,
    codigo: 'ARG005-004',
    estudio: 'GZVA',
    visita: 'V3',
    procedimiento: 'Laboratorio',
    medico: 'Dr. Pérez',
    consultorio: 'Sala de procedimientos',
    horaTurno: '07:45',
    horaLlegada: '07:41',
    ayuno: 'Sí',
    estado: 'Completado',
    etiquetas: ['Basal'],
    coordinador: 'Study Coordinator · Lic. Gómez',
    prerrequisitos: [
      { nombre: 'Paciente presente', estado: 'cumplido' },
      { nombre: 'Ayuno confirmado', estado: 'cumplido' },
      { nombre: 'Signos vitales completados', estado: 'cumplido' },
      { nombre: 'Evaluación previa', estado: 'no-aplica' },
    ],
    horaInicio: '07:52',
    horaFinalizacion: '08:01',
    realizadoPor: 'Técnico demo',
  },
]

const prioridadEstado: Record<EstadoTarea, number> = {
  'En curso': 0,
  Listo: 1,
  Bloqueado: 2,
  Completado: 3,
}

function horaActual() {
  return new Date().toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function esLaboratorio(procedimiento: Procedimiento) {
  return procedimiento !== 'ECG'
}

export default function Laboratorio({ onVolver }: LaboratorioProps) {
  const [tareas, setTareas] = useState(tareasIniciales)
  const [tareaActivaId, setTareaActivaId] = useState<number | null>(null)

  const tareasOrdenadas = [...tareas].sort((a, b) =>
    prioridadEstado[a.estado] - prioridadEstado[b.estado] ||
    a.horaTurno.localeCompare(b.horaTurno)
  )
  const tareaActiva = tareas.find((tarea) => tarea.id === tareaActivaId) ?? null
  const tienePrerequisitosPendientes = Boolean(
    tareaActiva?.prerrequisitos.some((prerrequisito) => prerrequisito.estado === 'pendiente')
  )

  function actualizarTarea(id: number, cambios: Partial<TareaTecnica>) {
    setTareas((actuales) =>
      actuales.map((tarea) => (tarea.id === id ? { ...tarea, ...cambios } : tarea))
    )
  }

  function iniciarProcedimiento() {
    if (!tareaActiva || tienePrerequisitosPendientes || tareaActiva.estado !== 'Listo') return

    actualizarTarea(tareaActiva.id, {
      estado: 'En curso',
      horaInicio: horaActual(),
    })
  }

  function completarProcedimiento() {
    if (!tareaActiva || tareaActiva.estado !== 'En curso') return

    actualizarTarea(tareaActiva.id, {
      estado: 'Completado',
      horaFinalizacion: horaActual(),
      realizadoPor: 'Técnico demo',
    })
  }

  function abrirTarea(id: number) {
    setTareaActivaId(id)
  }

  const alertas = [
    { codigo: 'ARG005-001', texto: 'ECG esperando signos vitales', tipo: 'bloqueo' },
    { codigo: 'ARG005-020', texto: 'PK temporizada', tipo: 'pk' },
    { codigo: 'ARG005-008', texto: 'Paciente en ayunas listo para extracción', tipo: 'listo' },
    { codigo: 'ARG005-011', texto: 'ECG en curso', tipo: 'curso' },
  ]

  return (
    <>
      <style>{`
        .lab-page {
          min-height: 100vh;
          background: #f4f7fb;
          color: #14213d;
        }

        .lab-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 20px 32px;
          background: linear-gradient(90deg, #073763, #0a4f86);
          color: white;
        }

        .lab-header h1 {
          margin: 0;
          font-size: 25px;
        }

        .lab-header p {
          margin: 4px 0 0;
          opacity: .82;
        }

        .lab-back {
          flex: 0 0 auto;
          padding: 9px 14px;
          border: 1px solid rgba(255,255,255,.35);
          border-radius: 8px;
          background: rgba(255,255,255,.14);
          color: white;
          cursor: pointer;
          font-weight: 600;
        }

        .lab-back:hover { background: rgba(255,255,255,.24); }

        .lab-content {
          max-width: 1460px;
          margin: 0 auto;
          padding: 26px 28px;
        }

        .lab-title-row {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .lab-title-row h2 { margin: 0; font-size: 22px; }
        .lab-muted { color: #69788b; font-size: 13px; }

        .lab-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 20px;
          align-items: start;
        }

        .lab-queue { display: grid; gap: 10px; }

        .lab-task {
          display: grid;
          grid-template-columns: minmax(165px, 1.15fr) minmax(155px, 1fr) minmax(140px, .9fr) auto;
          gap: 14px;
          align-items: center;
          padding: 15px 16px;
          border: 1px solid #e0e7ef;
          border-radius: 9px;
          background: white;
        }

        .lab-task.completed { opacity: .72; }
        .lab-code { font-weight: 700; font-size: 15px; }
        .lab-procedure { margin-top: 5px; font-weight: 600; }
        .lab-task-details { display: grid; gap: 5px; color: #526173; font-size: 13px; }
        .lab-detail-line strong { color: #25384b; }

        .lab-state {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .lab-state.blocked { color: #8b3d30; background: #fde8e3; }
        .lab-state.ready { color: #17633a; background: #e0f3e7; }
        .lab-state.active { color: #075f84; background: #dff3fb; }
        .lab-state.done { color: #526173; background: #edf0f3; }

        .lab-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 7px; }
        .lab-tag {
          border-radius: 4px;
          padding: 4px 7px;
          color: #725000;
          background: #fff1ca;
          font-size: 11px;
          font-weight: 700;
        }

        .lab-button {
          border: 0;
          border-radius: 7px;
          padding: 9px 12px;
          background: #1187d1;
          color: white;
          cursor: pointer;
          font-weight: 700;
          white-space: nowrap;
        }

        .lab-button:hover:not(:disabled) { background: #0874b7; }
        .lab-button:disabled { cursor: not-allowed; opacity: .55; }
        .lab-button.secondary { background: white; color: #17658e; border: 1px solid #b9d7e8; }
        .lab-button.secondary:hover { background: #eff8fc; }

        .lab-alert-panel, .lab-panel {
          border: 1px solid #e0e7ef;
          border-radius: 9px;
          background: white;
          padding: 18px;
        }

        .lab-alert-panel { position: sticky; top: 16px; }
        .lab-alert-panel h2, .lab-panel h2 { margin: 0 0 14px; font-size: 18px; }
        .lab-alert-list { display: grid; gap: 10px; }

        .lab-alert {
          padding: 10px 11px;
          border-left: 3px solid #a9b7c5;
          background: #f6f8fa;
          border-radius: 4px;
          font-size: 13px;
          line-height: 1.4;
        }

        .lab-alert strong { display: block; margin-bottom: 2px; }
        .lab-alert.blocked { border-color: #bf5945; }
        .lab-alert.pk { border-color: #bb8900; }
        .lab-alert.ready { border-color: #3d9360; }
        .lab-alert.course { border-color: #2181a7; }

        .lab-back-queue { margin-bottom: 14px; }
        .lab-detail-heading { margin: 0 0 4px; font-size: 22px; }
        .lab-detail-subtitle { color: #526173; margin-bottom: 18px; }

        .lab-summary {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 1px;
          overflow: hidden;
          margin-bottom: 16px;
          border: 1px solid #dfe7ef;
          border-radius: 8px;
          background: #dfe7ef;
        }

        .lab-summary-item { min-width: 0; padding: 12px; background: white; }
        .lab-summary-item small { display: block; margin-bottom: 5px; color: #69788b; font-weight: 600; }
        .lab-summary-item strong { font-size: 14px; overflow-wrap: anywhere; }

        .lab-detail-columns {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(280px, .8fr);
          gap: 16px;
          align-items: start;
        }

        .lab-panel { margin-bottom: 15px; }
        .lab-prereqs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
        .lab-prereq { display: flex; align-items: flex-start; gap: 8px; color: #33465a; font-size: 13px; }
        .lab-prereq-mark { width: 18px; flex: 0 0 18px; font-weight: 800; }
        .lab-prereq-mark.done { color: #278453; }
        .lab-prereq-mark.pending { color: #b35e00; }
        .lab-prereq-mark.na { color: #8190a0; }

        .lab-blocked-notice {
          margin-top: 14px;
          padding: 13px 14px;
          border: 1px solid #efc2b8;
          border-left: 4px solid #b94430;
          border-radius: 6px;
          background: #fff0ed;
          color: #843728;
        }

        .lab-blocked-notice strong { display: block; margin-bottom: 4px; }
        .lab-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px 15px; }
        .lab-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .lab-field.full { grid-column: 1 / -1; }
        .lab-field label, .lab-field-label { color: #526173; font-size: 12px; font-weight: 700; }

        .lab-field input, .lab-field select, .lab-field textarea {
          width: 100%;
          min-height: 38px;
          padding: 8px 9px;
          border: 1px solid #cfd9e3;
          border-radius: 6px;
          background: white;
          color: #14213d;
        }

        .lab-field textarea { min-height: 70px; resize: vertical; }
        .lab-inline-options { display: flex; flex-wrap: wrap; gap: 8px 14px; padding: 5px 0; }
        .lab-inline-options label { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; color: #26374a; font-weight: 500; }
        .lab-inline-options input { width: auto; min-height: auto; accent-color: #087eb9; }
        .lab-timed-note { margin-bottom: 14px; padding: 10px 12px; border-radius: 6px; background: #fff7df; color: #765500; font-size: 13px; font-weight: 700; }
        .lab-complete-box { padding: 12px; border-radius: 6px; background: #e6f5eb; color: #276c40; line-height: 1.6; }
        .lab-complete-box strong { display: block; }
        .lab-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 14px; }

        @media (max-width: 1100px) {
          .lab-layout { grid-template-columns: 1fr; }
          .lab-alert-panel { position: static; }
          .lab-alert-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .lab-summary { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }

        @media (max-width: 760px) {
          .lab-content { padding: 17px; }
          .lab-task { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
          .lab-task-action { grid-column: 1 / -1; }
          .lab-task-action .lab-button { width: 100%; }
          .lab-detail-columns { grid-template-columns: 1fr; }
        }

        @media (max-width: 560px) {
          .lab-header { align-items: flex-start; flex-direction: column; padding: 16px; }
          .lab-title-row { align-items: flex-start; flex-direction: column; }
          .lab-task { grid-template-columns: 1fr; }
          .lab-task-action { grid-column: auto; }
          .lab-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .lab-prereqs, .lab-fields { grid-template-columns: 1fr; }
          .lab-field.full { grid-column: auto; }
          .lab-alert-list { grid-template-columns: 1fr; }
          .lab-panel, .lab-alert-panel { padding: 15px; }
          .lab-actions { flex-direction: column-reverse; }
          .lab-actions .lab-button { width: 100%; }
        }
      `}</style>

      <div className="lab-page">
        <header className="lab-header">
          <div>
            <h1>CEMEDIC · Procedimientos técnicos</h1>
            <p>Laboratorio, ECG y muestras protocolizadas</p>
          </div>
          <button className="lab-back" onClick={onVolver}>← Volver</button>
        </header>

        <main className="lab-content">
          {tareaActiva ? (
            <>
              <button className="lab-button secondary lab-back-queue" onClick={() => setTareaActivaId(null)}>
                ← Volver a la cola
              </button>
              <h2 className="lab-detail-heading">
                {tareaActiva.codigo} · {tareaActiva.estudio} · {tareaActiva.visita}
              </h2>
              <div className="lab-detail-subtitle">Procedimiento: {tareaActiva.procedimiento}</div>

              <section className="lab-summary" aria-label="Resumen de la tarea">
                <div className="lab-summary-item"><small>Médico</small><strong>{tareaActiva.medico}</strong></div>
                <div className="lab-summary-item"><small>Consultorio</small><strong>{tareaActiva.consultorio}</strong></div>
                <div className="lab-summary-item"><small>Hora llegada</small><strong>{tareaActiva.horaLlegada}</strong></div>
                <div className="lab-summary-item"><small>Estado</small><span className={`lab-state ${estadoClase(tareaActiva.estado)}`}>{tareaActiva.estado}</span></div>
                <div className="lab-summary-item"><small>Ayuno</small><strong>{tareaActiva.ayuno}</strong></div>
                <div className="lab-summary-item"><small>Study Coordinator</small><strong>{tareaActiva.coordinador}</strong></div>
              </section>

              <div className="lab-detail-columns">
                <div>
                  <section className="lab-panel">
                    <h2>Prerrequisitos</h2>
                    <div className="lab-prereqs">
                      {tareaActiva.prerrequisitos.map((prerrequisito) => (
                        <div className="lab-prereq" key={prerrequisito.nombre}>
                          <span className={`lab-prereq-mark ${prerrequisito.estado === 'cumplido' ? 'done' : prerrequisito.estado === 'pendiente' ? 'pending' : 'na'}`}>
                            {prerrequisito.estado === 'cumplido' ? '✓' : prerrequisito.estado === 'pendiente' ? '○' : '—'}
                          </span>
                          <span>{prerrequisito.nombre}{prerrequisito.estado === 'no-aplica' ? ' · No aplica' : ''}</span>
                        </div>
                      ))}
                    </div>
                    {tienePrerequisitosPendientes && (
                      <div className="lab-blocked-notice" role="alert">
                        <strong>PROCEDIMIENTO BLOQUEADO</strong>
                        {tareaActiva.motivo ?? 'Complete los prerrequisitos antes de iniciar.'}
                      </div>
                    )}
                  </section>

                  <section className="lab-panel">
                    <h2>Registro técnico</h2>
                    {tareaActiva.etiquetas.includes('Muestra temporizada') && (
                      <div className="lab-timed-note">Muestra temporizada / PK · respetar la ventana protocolizada</div>
                    )}
                    <div className="lab-fields">
                      <div className="lab-field"><label htmlFor="hora-inicio">Hora inicio</label><input id="hora-inicio" type="time" value={tareaActiva.horaInicio ?? ''} readOnly /></div>
                      <div className="lab-field"><label htmlFor="hora-fin">Hora finalización</label><input id="hora-fin" type="time" value={tareaActiva.horaFinalizacion ?? ''} readOnly /></div>

                      {esLaboratorio(tareaActiva.procedimiento) && (
                        <>
                          <div className="lab-field"><label htmlFor="tipo-muestra">Tipo de muestra</label><input id="tipo-muestra" placeholder="Suero, plasma, orina..." /></div>
                          <div className="lab-field"><label htmlFor="tubos">Tubos / muestras requeridas</label><input id="tubos" placeholder="Cantidad y tipo según protocolo" /></div>
                          <div className="lab-field"><span className="lab-field-label">Muestra obtenida</span><div className="lab-inline-options"><label><input type="radio" name="muestra-obtenida" />Sí</label><label><input type="radio" name="muestra-obtenida" />No</label></div></div>
                          <div className="lab-field"><label htmlFor="incidencia">Incidencia en extracción</label><input id="incidencia" placeholder="Ninguna / describir" /></div>
                          <div className="lab-field full"><label htmlFor="observacion-lab">Observación técnica</label><textarea id="observacion-lab" placeholder="Observaciones del procedimiento" /></div>
                        </>
                      )}

                      {tareaActiva.procedimiento === 'Laboratorio + PK' && (
                        <>
                          <div className="lab-field"><label htmlFor="fecha-pk">Fecha / hora de muestra PK</label><input id="fecha-pk" type="datetime-local" /></div>
                          <div className="lab-field"><label htmlFor="ultima-dosis">Fecha / hora última dosis</label><input id="ultima-dosis" type="datetime-local" /></div>
                          <div className="lab-field"><label htmlFor="dosis-actual">Dosis actual</label><input id="dosis-actual" placeholder="Dosis registrada" /></div>
                        </>
                      )}

                      {tareaActiva.procedimiento === 'ECG' && (
                        <>
                          <div className="lab-field"><span className="lab-field-label">ECG realizado</span><div className="lab-inline-options"><label><input type="radio" name="ecg-realizado" />Sí</label><label><input type="radio" name="ecg-realizado" />No</label></div></div>
                          <div className="lab-field"><label htmlFor="hora-ecg">Hora ECG</label><input id="hora-ecg" type="time" /></div>
                          <div className="lab-field"><label htmlFor="calidad-ecg">Calidad técnica</label><select id="calidad-ecg" defaultValue=""><option value="" disabled>Seleccionar</option><option>Adecuada</option><option>Repetir</option></select></div>
                          <div className="lab-field"><label htmlFor="observacion-ecg">Observación técnica</label><input id="observacion-ecg" placeholder="Calidad / repetición técnica" /></div>
                        </>
                      )}
                    </div>

                    {tareaActiva.estado === 'Completado' ? (
                      <div className="lab-complete-box" style={{ marginTop: 16 }}>
                        <strong>✓ Completado · {tareaActiva.horaFinalizacion}</strong>
                        Realizado por: {tareaActiva.realizadoPor}
                      </div>
                    ) : (
                      <div className="lab-actions">
                        {tareaActiva.estado === 'Listo' && (
                          <button className="lab-button" disabled={tienePrerequisitosPendientes} onClick={iniciarProcedimiento}>
                            Iniciar procedimiento
                          </button>
                        )}
                        {tareaActiva.estado === 'En curso' && (
                          <button className="lab-button" onClick={completarProcedimiento}>
                            Marcar procedimiento completado
                          </button>
                        )}
                        {tareaActiva.estado === 'Bloqueado' && (
                          <button className="lab-button" disabled>Iniciar procedimiento</button>
                        )}
                      </div>
                    )}
                  </section>
                </div>

                <aside className="lab-alert-panel">
                  <h2>Alertas técnicas</h2>
                  <div className="lab-alert-list">
                    {alertas.map((alerta) => (
                      <div className={`lab-alert ${alerta.tipo}`} key={`${alerta.codigo}-${alerta.texto}`}>
                        <strong>{alerta.codigo}</strong>
                        {alerta.texto}
                      </div>
                    ))}
                  </div>
                </aside>
              </div>
            </>
          ) : (
            <div className="lab-layout">
              <section>
                <div className="lab-title-row">
                  <div>
                    <h2>Cola de tareas técnicas</h2>
                    <div className="lab-muted">Prioridad: en curso, listos, bloqueados y completados</div>
                  </div>
                  <div className="lab-muted">{tareas.length} procedimientos</div>
                </div>

                <div className="lab-queue">
                  {tareasOrdenadas.map((tarea) => (
                    <article className={`lab-task ${tarea.estado === 'Completado' ? 'completed' : ''}`} key={tarea.id}>
                      <div>
                        <div className="lab-code">{tarea.codigo} · {tarea.estudio} · {tarea.visita}</div>
                        <div className="lab-procedure">{tarea.procedimiento}{tarea.etiquetas.includes('Basal') ? ' basal' : ''}</div>
                        {tarea.etiquetas.length > 0 && (
                          <div className="lab-tags">{tarea.etiquetas.map((etiqueta) => <span className="lab-tag" key={etiqueta}>{etiqueta}</span>)}</div>
                        )}
                      </div>
                      <div className="lab-task-details">
                        <div className="lab-detail-line"><strong>Médico:</strong> {tarea.medico}</div>
                        <div className="lab-detail-line"><strong>{tarea.consultorio}</strong></div>
                        <div className="lab-detail-line">Turno {tarea.horaTurno} · Llegó {tarea.horaLlegada}</div>
                      </div>
                      <div className="lab-task-details">
                        <span className={`lab-state ${estadoClase(tarea.estado)}`}>{tarea.estado}</span>
                        <div className="lab-detail-line"><strong>Ayuno:</strong> {tarea.ayuno}</div>
                        {tarea.estado === 'Bloqueado' && <div className="lab-detail-line">{tarea.motivo}</div>}
                        {tarea.estado === 'Completado' && <div className="lab-detail-line">✓ {tarea.horaFinalizacion} · {tarea.realizadoPor}</div>}
                      </div>
                      <div className="lab-task-action">
                        <button className="lab-button secondary" onClick={() => abrirTarea(tarea.id)}>Abrir procedimiento</button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <aside className="lab-alert-panel">
                <h2>Alertas técnicas</h2>
                <div className="lab-alert-list">
                  {alertas.map((alerta) => (
                    <div className={`lab-alert ${alerta.tipo}`} key={`${alerta.codigo}-${alerta.texto}`}>
                      <strong>{alerta.codigo}</strong>
                      {alerta.texto}
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          )}
        </main>
      </div>
    </>
  )
}

function estadoClase(estado: EstadoTarea) {
  if (estado === 'Bloqueado') return 'blocked'
  if (estado === 'Listo') return 'ready'
  if (estado === 'En curso') return 'active'
  return 'done'
}