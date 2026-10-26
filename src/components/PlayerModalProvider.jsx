import { createContext, useContext, useEffect, useState } from 'react';
import { Modal } from './Modal';
import { TeamBadge } from './TeamBadge';
import { api } from '../api/client';
import { formatInnings } from '../utils/innings';

const Ctx = createContext(null);

export function PlayerModalProvider({ children }) {
  const [rosterId, setRosterId] = useState(null);
  return (
    <Ctx.Provider value={{ abrirJugador: setRosterId }}>
      {children}
      <JugadorModal rosterId={rosterId} onCerrar={() => setRosterId(null)} />
    </Ctx.Provider>
  );
}

// Uso en cualquier componente: const { abrirJugador } = usePlayerModal();
// <button onClick={() => abrirJugador(roster_id)}>{nombre}</button>
export function usePlayerModal() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePlayerModal debe usarse dentro de <PlayerModalProvider>');
  return ctx;
}

function formatFecha(f) {
  if (!f) return '';
  const d = new Date(f + 'T00:00:00');
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

const COLS_HIST_BATEO = [
  ['vb', 'VB'], ['ca', 'CA'], ['hc', 'HC'], ['bb', 'BB'],
  ['h2', '2H'], ['h3', '3H'], ['hr', 'HR'], ['ci', 'CI'], ['br', 'BR'], ['so', 'SO'],
];

const COLS_HIST_PITCHEO = [
  ['i', 'I'], ['r', 'R'], ['c', 'C'], ['vb', 'VBC'], ['hp', 'HP'],
  ['h2', '2B'], ['h3', '3B'], ['hr', 'HR'], ['il', 'IL'], ['cl', 'CL'], ['so', 'SO'], ['bb', 'BB'],
];

function TablaHistorial({ titulo, filas, cols }) {
  if (!filas || filas.length === 0) return null;
  return (
    <>
      <h3 style={{ fontSize: 16, margin: '0 0 var(--space-3)', color: 'var(--blue-txt)' }}>{titulo}</h3>
      <div style={{ overflowX: 'auto', marginBottom: 'var(--space-5)' }}>
        <table className="tabla">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Fecha</th>
              <th style={{ textAlign: 'left' }}>Vs</th>
              {cols.map(([k, l]) => <th key={k}>{l}</th>)}
            </tr>
          </thead>
          <tbody>
            {filas.map((f, i) => (
              <tr key={i}>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{formatFecha(f.fecha)}</td>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>Vs {f.rival}</td>
                {cols.map(([k]) => <td key={k}>{k === 'il' || k === 'ij' ? formatInnings(f[k], '0') : (f[k] ?? 0)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function JugadorModal({ rosterId, onCerrar }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!rosterId) return;
    setCargando(true);
    setDatos(null);
    api.get(`/lideres/jugador/${rosterId}`).then(setDatos).finally(() => setCargando(false));
  }, [rosterId]);

  const b = datos?.bateo;
  const p = datos?.pitcheo;
  const nombre = b ? `${b.nombres} ${b.apellidos}` : p ? `${p.nombres} ${p.apellidos}` : 'Jugador';
  const equipo = b?.equipo || p?.equipo;
  const categoria = b?.categoria_nombre || p?.categoria_nombre;

  return (
    <Modal
      titulo={nombre}
      abierto={!!rosterId}
      onCerrar={onCerrar}
      ancho={720}
      estiloCabecera={{ background: '#16296b', color: '#fff' }}
      subtitulo={(b || p) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15 }}>
          <TeamBadge nombre={equipo} logoUrl={b?.logo_url || p?.logo_url} tamano={22} />
          {equipo}
          {categoria && <><span style={{ opacity: 0.6 }}>|</span><span style={{ opacity: 0.85 }}>{categoria}</span></>}
        </div>
      )}
    >
      {cargando && <div className="vacio">Cargando…</div>}

      {!cargando && !b && !p && (
        <div className="vacio">Sin estadísticas registradas todavía.</div>
      )}

      {!cargando && (b || p) && (
        <>
          {datos.foto_url && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'var(--space-5)' }}>
              <img
                src={datos.foto_url}
                alt={nombre}
                style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
            </div>
          )}

          <TablaHistorial titulo="Actuación Reciente (Ofensiva)" filas={datos.historialBateo} cols={COLS_HIST_BATEO} />
          <TablaHistorial titulo="Actuación Reciente (Pitcheo)" filas={datos.historialPitcheo} cols={COLS_HIST_PITCHEO} />
        </>
      )}
    </Modal>
  );
}