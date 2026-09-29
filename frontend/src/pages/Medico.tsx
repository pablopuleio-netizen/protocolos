import { useState } from 'react'

type EstadoEvento =
  | 'Sin EA nuevos'
  | 'EA nuevo'
  | 'EA previo continúa'
  | 'Resuelto'
  | 'SAE'
  | 'AESI'

type PacienteMedico = {
  codigo: string
  estudio: string
  visita: string
  horaLlegada: string
  medico: string
  consultorio: string
  estado: string
  reasignado?: boolean
  medicoOriginal?: string
  pendienteEA: boolean
  aleatorizado: boolean
}

type MedicoProps = {
  onVolver: () => void
}

const pacientesMock: PacienteMedico[] = [
  {
    codigo: 'ARG005-001',
    estudio: 'GZVA',
    visita: 'V3',
    horaLlegada: '08:04',
    medico: 'Dr. Puleio',
    consultorio: 'Consultorio 2',
    estado: 'Esperando médico',
    pendienteEA: true,
    aleatorizado: true,
  },
  {
    codigo: 'ARG005-008',
    estudio: 'GZVA',
    visita: 'V5',
    horaLlegada: '09:20',
    medico: 'Dr. Puleio',
    consultorio: 'Consultorio 1',
    estado: 'En evaluación',
    pendienteEA: false,
    aleatorizado: true,
  },
  {
    codigo: 'ARG005-014',
    estudio: 'GZVA',
    visita: 'V7',
    horaLlegada: '10:10',
    medico: 'Dr. Puleio',
    consultorio: 'Consultorio 3',
    estado: 'Esperando médico',
    reasignado: true,
    medicoOriginal: 'Dr. Pérez',
    pendienteEA: false,
    aleatorizado: true,
  },
].sort((a, b) => a.horaLlegada.localeCompare(b.horaLlegada))

const estadosEvento: EstadoEvento[] = [
  'Sin EA nuevos',
  'EA nuevo',
  'EA previo continúa',
  'Resuelto',
  'SAE',
  'AESI',
]

export default function Medico({ onVolver }: MedicoProps) {
  const [pacienteActivo, setPacienteActivo] = useState<PacienteMedico | null>(null)
  const [estadoEvento, setEstadoEvento] = useState<EstadoEvento | ''>('')

  function abrirEvaluacion(paciente: PacienteMedico) {
    setPacienteActivo(paciente)
    setEstadoEvento('')
  }

  function volverACola() {
    setPacienteActivo(null)
    setEstadoEvento('')
  }

  const advertenciaEA = Boolean(
    pacienteActivo?.pendienteEA && !estadoEvento
  )

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
          display: block;
          margin-top: 7px;
          background: #fff0d5;
          color: #865500;
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
          </div>
          <button className="medico-volver" onClick={onVolver}>
            ← Volver
          </button>
        </header>

        <main className="medico-content">
          {!pacienteActivo ? (
            <>
              <div className="medico-title-row">
                <div>
                  <h2>Mi cola</h2>
                  <div className="medico-muted">
                    {pacientesMock.length} pacientes asignados · ordenados por llegada
                  </div>
                </div>
                <span className="medico-badge">Dr. Puleio</span>
              </div>

              <section className="medico-queue" aria-label="Pacientes asignados">
                {pacientesMock.map((paciente) => (
                  <article className="medico-patient" key={paciente.codigo}>
                    <div className="medico-time">{paciente.horaLlegada}</div>
                    <div>
                      <div className="medico-code">
                        {paciente.codigo} · {paciente.estudio} · {paciente.visita}
                      </div>
                      {paciente.reasignado && (
                        <span className="medico-badge reasignado">
                          Reasignado desde {paciente.medicoOriginal}; llegada original conservada
                        </span>
                      )}
                    </div>
                    <div>
                      <div>{paciente.medico}</div>
                      <div className="medico-detail">{paciente.consultorio}</div>
                    </div>
                    <div>
                      <span className="medico-badge">{paciente.estado}</span>
                    </div>
                    <div className="medico-action-cell">
                      <button
                        className="medico-button"
                        onClick={() => abrirEvaluacion(paciente)}
                      >
                        Abrir evaluación
                      </button>
                    </div>
                  </article>
                ))}
              </section>
            </>
          ) : (
            <>
              <div className="medico-title-row">
                <div>
                  <h2>
                    {pacienteActivo.codigo} · {pacienteActivo.estudio} · {pacienteActivo.visita}
                  </h2>
                  <div className="medico-muted">Evaluación clínica de la visita</div>
                </div>
                <button className="medico-button secondary" onClick={volverACola}>
                  ← Volver a mi cola
                </button>
              </div>

              <section className="medico-summary" aria-label="Resumen del paciente">
                <div className="medico-summary-item">
                  <span className="medico-label">Hora de llegada</span>
                  <strong>{pacienteActivo.horaLlegada}</strong>
                </div>
                <div className="medico-summary-item">
                  <span className="medico-label">Visita</span>
                  <strong>{pacienteActivo.visita}</strong>
                </div>
                <div className="medico-summary-item">
                  <span className="medico-label">Médico</span>
                  <strong>{pacienteActivo.medico}</strong>
                </div>
                <div className="medico-summary-item">
                  <span className="medico-label">Consultorio</span>
                  <strong>{pacienteActivo.consultorio}</strong>
                </div>
                <div className="medico-summary-item">
                  <span className="medico-label">Estado</span>
                  <strong>{pacienteActivo.estado}</strong>
                </div>
              </section>

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
                {advertenciaEA && (
                  <div className="medico-warning" role="alert">
                    Debe actualizarse el estado del EA antes de finalizar la evaluación médica.
                  </div>
                )}
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
                  {pacienteActivo.aleatorizado ? (
                    <div className="medico-field">
                      <span className="medico-field-label">Autoriza IWRS</span>
                      <div className="medico-options">
                        {['Sí', 'No'].map((opcion) => <label key={`iwrs-${opcion}`}><input type="radio" name="iwrs" />{opcion}</label>)}
                      </div>
                    </div>
                  ) : (
                    <div className="medico-field">
                      <span className="medico-field-label">Elegible para randomización</span>
                      <div className="medico-options">
                        {['Sí', 'No'].map((opcion) => <label key={`randomizacion-${opcion}`}><input type="radio" name="randomizacion" />{opcion}</label>)}
                      </div>
                    </div>
                  )}
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
                  <button className="medico-button" disabled={advertenciaEA}>Finalizar evaluación médica</button>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </>
  )
}