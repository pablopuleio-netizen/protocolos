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

export default function StudyCoordinator({
  onVolver,
}: StudyCoordinatorProps) {
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

  function textoEstado(estado: Visita['estado']) {
    if (estado === 'presente') return 'Presente'
    if (estado === 'en_curso') return 'En curso'
    return 'Esperado'
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
                    <button className="boton boton-principal">
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