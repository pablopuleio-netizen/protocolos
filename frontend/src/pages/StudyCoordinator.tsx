import { useState } from 'react'

type Visita = {
  id: number
  codigo: string
  estudio: string
  visita: string
  hora: string
  medico: string
  consultorio: string
  estado: 'esperado' | 'presente' | 'en_curso'
  progreso: number
  realizados: number
  total: number
  puedeAvanzar: string[]
  pendientes: string[]
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
  const [visitaAbierta, setVisitaAbierta] = useState<Visita | null>(null)

  const visitas: Visita[] = [
    {
      id: 1,
      codigo: 'ARG005-001',
      estudio: 'GZVA',
      visita: 'V3',
      hora: '08:00',
      medico: 'Dr. Puleio',
      consultorio: 'Consultorio 2',
      estado: 'presente',
      progreso: 46,
      realizados: 6,
      total: 13,
      puedeAvanzar: ['TA / peso', 'Cuestionarios', 'ECG'],
      pendientes: [
        'Evaluación médica',
        'Laboratorio',
        'IWRS',
        'IP',
      ],
    },
    {
      id: 2,
      codigo: 'ARG005-008',
      estudio: 'GZVA',
      visita: 'V5',
      hora: '09:30',
      medico: 'Dr. Pérez',
      consultorio: 'Consultorio 1',
      estado: 'en_curso',
      progreso: 70,
      realizados: 7,
      total: 10,
      puedeAvanzar: ['Laboratorio'],
      pendientes: [
        'Decisión médica',
        'IWRS',
        'Dispensa IP',
      ],
    },
    {
      id: 3,
      codigo: 'ARG005-014',
      estudio: 'GZVA',
      visita: 'V3',
      hora: '10:00',
      medico: 'Dr. Puleio',
      consultorio: 'Consultorio 3',
      estado: 'esperado',
      progreso: 0,
      realizados: 0,
      total: 13,
      puedeAvanzar: [],
      pendientes: ['Paciente aún no presente'],
    },
  ]

  const alertas = [
    {
      tipo: 'espera',
      texto: 'ARG005-008 lleva más de 30 min en el centro',
    },
    {
      tipo: 'protocolo',
      texto: 'ARG005-001: IWRS todavía no habilitado',
    },
    {
      tipo: 'pendiente',
      texto: 'ARG005-014: confirmar ayuno al llegar',
    },
  ]

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
    procedimientosPorVisita[visitaAbierta?.visita ?? ''] ?? []

  function textoEstado(estado: Visita['estado']) {
    if (estado === 'presente') return 'Presente'
    if (estado === 'en_curso') return 'En curso'
    return 'Esperado'
  }

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
                {visitaAbierta.codigo} · {visitaAbierta.estudio} · {visitaAbierta.visita}
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
                <div className="dato-valor">{visitaAbierta.hora}</div>
              </div>

              <div>
                <div className="dato-label">Médico</div>
                <div className="dato-valor">{visitaAbierta.medico}</div>
              </div>

              <div>
                <div className="dato-label">Consultorio</div>
                <div className="dato-valor">{visitaAbierta.consultorio}</div>
              </div>

              <div>
                <div className="dato-label">Estado</div>
                <div className="dato-valor">
                  {textoEstado(visitaAbierta.estado)}
                </div>
              </div>

              <div>
                <div className="dato-label">Progreso</div>
                <div className="dato-valor">
                  {visitaAbierta.realizados}/{visitaAbierta.total}
                </div>
              </div>
            </section>

            <div className="detalle-layout">
              <section className="detalle-panel">
                <h2>Procedimientos GZVA · {visitaAbierta.visita}</h2>

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
              </section>

              <aside className="detalle-panel">
                <h2>Control SC</h2>

                <div className="side-block">
                  <div className="side-title">Pendientes activos</div>
                  <div className="side-text">
                    Evaluación médica, laboratorio, IWRS y dispensa de IP.
                  </div>
                </div>

                <div className="side-block">
                  <div className="side-title">Siguiente paso sugerido</div>
                  <div className="side-text">
                    Puede continuar con cuestionarios, ECG o evaluación médica.
                  </div>
                </div>

                <div className="side-block">
                  <div className="side-title">Advertencia de protocolo</div>
                  <div className="side-text">
                    IWRS permanece bloqueado hasta contar con autorización médica.
                  </div>
                </div>

                <button className="boton-secundario">
                  Reasignar médico
                </button>

                <button className="boton-secundario">
                  Editar consultorio
                </button>

                <button className="boton-secundario">
                  Registrar incidencia
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
              <div className="sc-numero">1</div>
              <div className="sc-label">
                Presentes
              </div>
            </div>

            <div className="sc-indicador">
              <div className="sc-numero">1</div>
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

              {visitas.map((visita) => (
                <div
                  className="visita-card"
                  key={visita.id}
                >
                  <div className="visita-top">
                    <div>
                      <div className="visita-hora">
                        {visita.hora}
                      </div>

                      <div className="visita-codigo">
                        {visita.codigo}
                      </div>

                      <div className="muted">
                        {visita.estudio} · {visita.visita}
                      </div>

                      <div className="muted">
                        {visita.medico} · {visita.consultorio}
                      </div>
                    </div>

                    <span
                      className={`estado estado-${visita.estado}`}
                    >
                      {textoEstado(visita.estado)}
                    </span>
                  </div>

                  <div className="progreso-wrap">
                    <div className="progreso-info">
                      <span>
                        {visita.realizados}/{visita.total} procedimientos
                      </span>

                      <span>
                        {visita.progreso}%
                      </span>
                    </div>

                    <div className="progreso">
                      <div
                        className="progreso-barra"
                        style={{
                          width: `${visita.progreso}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="acciones">
                    <div className="bloque">
                      <div className="bloque-titulo">
                        Puede avanzar ahora
                      </div>

                      {visita.puedeAvanzar.length === 0 ? (
                        <div className="item">
                          Ningún procedimiento habilitado
                        </div>
                      ) : (
                        visita.puedeAvanzar.map((item) => (
                          <div
                            className="item habilitado"
                            key={item}
                          >
                            ● {item}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="bloque">
                      <div className="bloque-titulo">
                        Pendientes
                      </div>

                      {visita.pendientes.map((item) => (
                        <div
                          className="item"
                          key={item}
                        >
                          ○ {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="botones">
                    <button
                      className="boton boton-principal"
                      onClick={() => setVisitaAbierta(visita)}
                    >
                      Abrir visita
                    </button>

                    <button className="boton">
                      Solicitar médico
                    </button>

                    <button className="boton">
                      Solicitar laboratorio
                    </button>
                  </div>
                </div>
              ))}
            </section>

            <aside className="sc-panel">
              <h2>Alertas</h2>

              {alertas.map((alerta) => (
                <div
                  className="alerta"
                  key={alerta.texto}
                >
                  <div
                    className={`alerta-titulo ${alerta.tipo}`}
                  >
                    {alerta.tipo === 'espera' && 'ESPERA'}
                    {alerta.tipo === 'protocolo' && 'PROTOCOLO'}
                    {alerta.tipo === 'pendiente' && 'PENDIENTE'}
                  </div>

                  <div className="alerta-texto">
                    {alerta.texto}
                  </div>
                </div>
              ))}
            </aside>
          </div>
        </main>
      </div>
    </>
  )
}
