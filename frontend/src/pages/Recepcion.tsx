import { useState } from 'react'

type Paciente = {
  id: number
  codigo: string
  estudio: string
  visita: string
  medico: string
  consultorio: string
  horaTurno: string
  horaLlegada?: string
  enAtencion?: boolean
  noAsistio?: boolean
}

type RecepcionProps = {
  onVolver: () => void
}

function horaRelativa(minutos: number) {
  const fecha = new Date()
  fecha.setMinutes(fecha.getMinutes() + minutos)

  return fecha.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function minutosDesde(hora: string) {
  const ahora = new Date()
  const [h, m] = hora.split(':').map(Number)

  const momento = new Date()
  momento.setHours(h, m, 0, 0)

  return Math.floor((ahora.getTime() - momento.getTime()) / 60000)
}

export default function Recepcion({ onVolver }: RecepcionProps) {
  const [pacientes, setPacientes] = useState<Paciente[]>([
    {
      id: 1,
      codigo: 'ARG005-001',
      estudio: 'GZVA',
      visita: 'V3',
      medico: 'Dr. Puleio',
      consultorio: 'Consultorio 2',
      horaTurno: horaRelativa(-10),
    },
    {
      id: 2,
      codigo: 'ARG005-008',
      estudio: 'GZVA',
      visita: 'V5',
      medico: 'Dr. Pérez',
      consultorio: 'Consultorio 1',
      horaTurno: horaRelativa(-50),
      horaLlegada: horaRelativa(-36),
    },
    {
      id: 3,
      codigo: 'ARG005-014',
      estudio: 'GZVA',
      visita: 'V3',
      medico: 'Dr. Puleio',
      consultorio: 'Consultorio 3',
      horaTurno: horaRelativa(-40),
    },
    {
      id: 4,
      codigo: 'ARG005-006',
      estudio: 'GZVA',
      visita: 'V7',
      medico: 'Dr. Gómez',
      consultorio: 'Consultorio 1',
      horaTurno: horaRelativa(35),
    },
  ])

  function registrarLlegada(id: number) {
    const ahora = new Date().toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

    setPacientes((actuales) =>
      actuales.map((paciente) =>
        paciente.id === id
          ? { ...paciente, horaLlegada: ahora }
          : paciente
      )
    )
  }

  function estadoPaciente(paciente: Paciente) {
    if (paciente.noAsistio) {
      return {
        texto: 'No asistió',
        clase: 'estado no-asistio',
      }
    }

    if (paciente.enAtencion) {
      return {
        texto: 'En atención',
        clase: 'estado atencion',
      }
    }

    if (paciente.horaLlegada) {
      const espera = minutosDesde(paciente.horaLlegada)

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

    const demora = minutosDesde(paciente.horaTurno)

    if (demora > 30) {
      return {
        texto: `Demorado · ${demora} min`,
        clase: 'estado demorado',
      }
    }

    return {
      texto: 'Esperado',
      clase: 'estado esperado',
    }
  }

  const presentes = pacientes.filter(
    (paciente) => paciente.horaLlegada && !paciente.enAtencion
  ).length

  const demorados = pacientes.filter(
    (paciente) =>
      !paciente.horaLlegada &&
      minutosDesde(paciente.horaTurno) > 30
  ).length

  const esperaLarga = pacientes.filter(
    (paciente) =>
      paciente.horaLlegada &&
      !paciente.enAtencion &&
      minutosDesde(paciente.horaLlegada) > 30
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

        .libre {
          color: #278453;
          margin-top: 6px;
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
                {pacientes.length}
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

              {pacientes.map((paciente) => {
                const estado = estadoPaciente(paciente)

                return (
                  <div
                    className="paciente"
                    key={paciente.id}
                  >
                    <div className="hora">
                      {paciente.horaTurno}
                    </div>

                    <div>
                      <div className="codigo">
                        {paciente.codigo}
                      </div>

                      <div className="detalle">
                        {paciente.estudio} · {paciente.visita}
                      </div>
                    </div>

                    <div>
                      <div>
                        {paciente.medico}
                      </div>

                      <div className="detalle">
                        {paciente.consultorio}
                      </div>
                    </div>

                    <div>
                      <span className={estado.clase}>
                        {estado.texto}
                      </span>

                      {paciente.horaLlegada && (
                        <div className="llegada">
                          Llegó: {paciente.horaLlegada}
                        </div>
                      )}
                    </div>

                    <div>
                      {!paciente.horaLlegada &&
                        !paciente.noAsistio && (
                          <button
                            className="boton-llegada"
                            onClick={() =>
                              registrarLlegada(paciente.id)
                            }
                          >
                            Paciente llegó
                          </button>
                        )}
                    </div>
                  </div>
                )
              })}
            </section>

            <aside className="panel">
              <h2>Consultorios</h2>

              <div className="consultorio">
                <div className="consultorio-titulo">
                  Consultorio 1
                </div>
                <div className="detalle">
                  Dr. Pérez
                </div>
                <div className="libre">
                  ● Libre
                </div>
              </div>

              <div className="consultorio">
                <div className="consultorio-titulo">
                  Consultorio 2
                </div>
                <div className="detalle">
                  Dr. Puleio
                </div>
                <div className="libre">
                  ● Libre
                </div>
              </div>

              <div className="consultorio">
                <div className="consultorio-titulo">
                  Consultorio 3
                </div>
                <div className="detalle">
                  Dr. Gómez
                </div>
                <div className="libre">
                  ● Libre
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </>
  )
}