import { useState } from 'react'
import Laboratorio from './pages/Laboratorio'
import Medico from './pages/Medico'
import Recepcion from './pages/Recepcion'
import StudyCoordinator from './pages/StudyCoordinator'

function App() {
  const [pantalla, setPantalla] = useState<
    'inicio' | 'recepcion' | 'sc' | 'medico' | 'laboratorio'
  >('inicio')

  if (pantalla === 'recepcion') {
    return <Recepcion onVolver={() => setPantalla('inicio')} />
  }

  if (pantalla === 'sc') {
    return (
      <StudyCoordinator
        onVolver={() => setPantalla('inicio')}
      />
    )
  }

  if (pantalla === 'medico') {
    return <Medico onVolver={() => setPantalla('inicio')} />
  }

  if (pantalla === 'laboratorio') {
    return <Laboratorio onVolver={() => setPantalla('inicio')} />
  }

  const fecha = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const roles = [
    {
      titulo: 'Recepción',
      descripcion: 'Llegadas, sala de espera y consultorios',
      icono: '🏥',
    },
    {
      titulo: 'Study Coordinator',
      descripcion: 'Flujo de visitas, procedimientos y pendientes',
      icono: '📋',
    },
    {
      titulo: 'Médico',
      descripcion: 'Evaluación clínica, decisiones y seguimiento',
      icono: '🩺',
    },
    {
      titulo: 'Laboratorio',
      descripcion: 'Muestras, horarios y procedimientos',
      icono: '🧪',
    },
  ]

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Inter, Arial, sans-serif;
          background: #f4f7fb;
          color: #14213d;
        }

        #root {
          width: 100%;
          min-height: 100vh;
        }

        .app {
          min-height: 100vh;
        }

        .header {
          background: linear-gradient(90deg, #073763, #0a4f86);
          color: white;
          padding: 22px 36px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 8px rgba(0,0,0,.15);
        }

        .brand {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: .5px;
        }

        .subtitle {
          font-size: 14px;
          opacity: .8;
          margin-top: 3px;
        }

        .date {
          text-transform: capitalize;
          font-size: 15px;
        }

        .content {
          max-width: 1250px;
          margin: auto;
          padding: 46px 32px;
        }

        h1 {
          margin-bottom: 8px;
          font-size: 32px;
        }

        .intro {
          color: #65758b;
          margin-bottom: 34px;
          font-size: 17px;
        }

        .roles {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .card {
          background: white;
          border-radius: 16px;
          padding: 28px;
          min-height: 205px;
          border: 1px solid #e4eaf1;
          box-shadow: 0 5px 18px rgba(22, 52, 84, .08);
          cursor: pointer;
          transition: .2s ease;
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 28px rgba(22, 52, 84, .14);
        }

        .icon {
          font-size: 42px;
          margin-bottom: 20px;
        }

        .card h2 {
          margin: 0 0 10px 0;
          font-size: 21px;
        }

        .card p {
          margin: 0;
          line-height: 1.5;
          color: #67768a;
        }

        .status {
          margin-top: 42px;
          background: #eaf7ef;
          border: 1px solid #cdebd7;
          padding: 16px 20px;
          border-radius: 12px;
          color: #287346;
        }

        @media (max-width: 900px) {
          .roles {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 550px) {
          .roles {
            grid-template-columns: 1fr;
          }

          .header {
            padding: 18px;
          }

          .content {
            padding: 28px 18px;
          }
        }
      `}</style>

      <div className="app">
        <header className="header">
          <div>
            <div className="brand">CEMEDIC</div>
            <div className="subtitle">Clinical Workflow</div>
          </div>

          <div className="date">{fecha}</div>
        </header>

        <main className="content">
          <h1>Operativa de Estudios Clínicos</h1>

          <div className="intro">
            Seleccione el área de trabajo
          </div>

          <div className="roles">
            {roles.map((rol) => (
              <div
                className="card"
                key={rol.titulo}
                onClick={() => {
                  if (rol.titulo === 'Recepción') {
                    setPantalla('recepcion')
                  }

                  if (rol.titulo === 'Study Coordinator') {
                    setPantalla('sc')
                  }

                  if (rol.titulo === 'Médico') {
                    setPantalla('medico')
                  }

                  if (rol.titulo === 'Laboratorio') {
                    setPantalla('laboratorio')
                  }
                }}
              >
                <div className="icon">{rol.icono}</div>
                <h2>{rol.titulo}</h2>
                <p>{rol.descripcion}</p>
              </div>
            ))}
          </div>

          <div className="status">
            ● Sistema local funcionando correctamente
          </div>
        </main>
      </div>
    </>
  )
}

export default App
