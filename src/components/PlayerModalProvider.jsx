import { createContext, useContext, useEffect, useState } from 'react';
import { Modal } from './Modal';
import { TeamBadge } from './TeamBadge';
import { api } from '../api/client';

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

function Estadistica({ etiqueta, valor }) {
  return (
    <div className="stat-jugador">
      <div className="stat-jugador__valor cifra">{valor ?? '—'}</div>
      <div className="stat-jugador__etiqueta">{etiqueta}</div>
    </div>
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

  return (
    <Modal titulo={nombre} abierto={!!rosterId} onCerrar={onCerrar} ancho={520}>
      {cargando && <div className="vacio">Cargando…</div>}

      {!cargando && !b && !p && (
        <div className="vacio">Sin estadísticas registradas todavía.</div>
      )}

      {!cargando && (b || p) && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'var(--space-5)' }}>
            {datos.foto_url ? (
              <img
                src={datos.foto_url}
                alt={nombre}
                style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <TeamBadge nombre={equipo} logoUrl={b?.logo_url || p?.logo_url} tamano={56} />
            )}
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                {datos.foto_url && <TeamBadge nombre={equipo} logoUrl={b?.logo_url || p?.logo_url} tamano={20} />}
                {equipo}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-ink-soft)' }}>
                {datos.numero_camiseta != null && `#${datos.numero_camiseta}`}
                {datos.numero_camiseta != null && b?.posicion_principal && ' · '}
                {b?.posicion_principal}
              </div>
            </div>
          </div>

          {b && (
            <>
              <h3 style={{ fontSize: 13, marginBottom: 'var(--space-2)' }}>Bateo</h3>
              <div className="stats-grid" style={{ marginBottom: 'var(--space-5)' }}>
                <Estadistica etiqueta="Juegos" valor={b.juegos_jugados} />
                <Estadistica etiqueta="V. al bate" valor={b.vb} />
                <Estadistica etiqueta="Hits" valor={b.hits} />
                <Estadistica etiqueta="Dobles" valor={b.dobles} />
                <Estadistica etiqueta="Triples" valor={b.triples} />
                <Estadistica etiqueta="Jonrones" valor={b.jonrones} />
                <Estadistica etiqueta="Anotadas" valor={b.carreras_anotadas} />
                <Estadistica etiqueta="Impulsadas" valor={b.carreras_impulsadas} />
                <Estadistica etiqueta="B. robadas" valor={b.bases_robadas} />
                <Estadistica etiqueta="B. x bolas" valor={b.bases_por_bolas} />
                <Estadistica etiqueta="Ponches" valor={b.ponches} />
                <Estadistica etiqueta="Promedio" valor={b.promedio_bateo} />
                <Estadistica etiqueta="Slugging" valor={b.slugging} />
              </div>
            </>
          )}

          {p && (
            <>
              <h3 style={{ fontSize: 13, marginBottom: 'var(--space-2)' }}>Pitcheo</h3>
              <div className="stats-grid">
                <Estadistica etiqueta="Ganados" valor={p.ganados} />
                <Estadistica etiqueta="Perdidos" valor={p.perdidos} />
                <Estadistica etiqueta="Salvados" valor={p.salvados} />
                <Estadistica etiqueta="Innings" valor={p.innings_lanzados} />
                <Estadistica etiqueta="Ponches" valor={p.ponches} />
                <Estadistica etiqueta="C. limpias" valor={p.carreras_limpias} />
                <Estadistica etiqueta="Efectividad" valor={p.efectividad} />
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
}
