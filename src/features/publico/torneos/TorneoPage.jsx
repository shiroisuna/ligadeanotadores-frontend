import { useEffect, useState } from 'react';
import { Marcador } from '../../../components/Marcador';
import { TeamBadge } from '../../../components/TeamBadge';
import { api } from '../../../api/client';
import { exportarTorneoPDF } from '../../../utils/exportarPDF';

/* ── Tarjeta de un enfrentamiento ──────────────────────────────── */
function Cruce({ cruce, esGanadorGlobal }) {
  if (!cruce) {
    return (
      <div className="bracket__cruce bracket__cruce--vacio">
        <div className="bracket__equipo">
          <span className="bracket__equipo-nombre bracket__equipo--tbd">Por definir</span>
        </div>
        <div className="bracket__equipo">
          <span className="bracket__equipo-nombre bracket__equipo--tbd">Por definir</span>
        </div>
      </div>
    );
  }

  const jugado = cruce.juego_estado === 'jugado';
  const localGana  = jugado && cruce.carreras_local  > cruce.carreras_visitante;
  const visitGana  = jugado && cruce.carreras_visitante > cruce.carreras_local;
  const ganadorId  = cruce.equipo_ganador_id;

  const filas = [
    { id: cruce.equipo_local_id,     nombre: cruce.equipo_local,     logo: cruce.logo_local,     carr: cruce.carreras_local,     gana: localGana,  esGan: ganadorId === cruce.equipo_local_id },
    { id: cruce.equipo_visitante_id, nombre: cruce.equipo_visitante, logo: cruce.logo_visitante, carr: cruce.carreras_visitante, gana: visitGana, esGan: ganadorId === cruce.equipo_visitante_id },
  ];

  return (
    <div className={`bracket__cruce ${esGanadorGlobal ? 'bracket__cruce--campeon' : ''}`}>
      {filas.map((f, i) => (
        <div
          key={i}
          className={`bracket__equipo ${f.esGan ? 'bracket__equipo--ganador' : ''} ${jugado && !f.gana ? 'bracket__equipo--perdedor' : ''}`}
        >
          <TeamBadge nombre={f.nombre} logoUrl={f.logo} tamano={18} />
          <span className="bracket__equipo-nombre">{f.nombre || 'Por definir'}</span>
          {jugado && (
            <span className={`bracket__score ${f.gana ? 'bracket__score--gana' : ''}`}>
              {f.carr ?? '—'}
            </span>
          )}
          {f.esGan && <span className="bracket__check">✓</span>}
        </div>
      ))}
      {cruce.juego_fecha && (
        <div className="bracket__meta">
          {cruce.juego_fecha}
          {cruce.juego_hora ? ' · ' + cruce.juego_hora.slice(0, 5) : ''}
        </div>
      )}
    </div>
  );
}

/* ── Conector SVG entre fases ──────────────────────────────────── */
function Conector({ numCruces }) {
  const altoCruce = 88; // px — debe coincidir con la altura real de .bracket__cruce
  const total = numCruces * altoCruce + (numCruces - 1) * 12;
  const mitad = total / 2;

  return (
    <svg
      width={40}
      height={total}
      className="bracket__conector"
      style={{ overflow: 'visible', flexShrink: 0 }}
    >
      {Array.from({ length: numCruces / 2 }).map((_, i) => {
        const y1 = i * 2 * (altoCruce + 12) + altoCruce / 2;
        const y2 = y1 + altoCruce + 12;
        const ym = (y1 + y2) / 2;
        return (
          <g key={i}>
            <line x1={0} y1={y1} x2={20} y2={y1} stroke="var(--border)" strokeWidth={2} />
            <line x1={0} y1={y2} x2={20} y2={y2} stroke="var(--border)" strokeWidth={2} />
            <line x1={20} y1={y1} x2={20} y2={y2} stroke="var(--border)" strokeWidth={2} />
            <line x1={20} y1={ym} x2={40} y2={ym} stroke="var(--border)" strokeWidth={2} />
          </g>
        );
      })}
    </svg>
  );
}

/* ── Página principal ──────────────────────────────────────────── */
export default function TorneoPage() {
  const [temporadaCategoriaId, setTemporadaCategoriaId] = useState(null);
  const [torneos, setTorneos] = useState([]);
  const [torneoId, setTorneoId] = useState(null);
  const [fases, setFases] = useState([]);
  const [cruces, setCruces] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [exportando, setExportando] = useState(false);

  function alCambiarCategoria(id) { setTemporadaCategoriaId(id); }

  useEffect(() => {
    if (!temporadaCategoriaId) return;
    api.get(`/torneos?temporada_categoria_id=${temporadaCategoriaId}`).then((data) => {
      setTorneos(data);
      setTorneoId(data[0]?.id ?? null);
    });
  }, [temporadaCategoriaId]);

  useEffect(() => {
    if (!torneoId) return;
    setCargando(true);
    Promise.all([
      api.get(`/torneos/${torneoId}/fases`),
      api.get(`/torneos/${torneoId}/cruces`),
    ]).then(([f, c]) => { setFases(f); setCruces(c); }).finally(() => setCargando(false));
  }, [torneoId]);

  const torneoActual = torneos.find((t) => t.id === torneoId);

  // Campeón: ganador del cruce de la última fase
  const faseOrdenada = [...fases].sort((a, b) => a.orden - b.orden);
  const faseFinal = faseOrdenada[faseOrdenada.length - 1];
  const cruceFinal = faseFinal ? cruces.find((c) => c.fase_id === faseFinal.id) : null;
  const campeonId = cruceFinal?.equipo_ganador_id;
  const campeon = campeonId
    ? (cruceFinal.equipo_local_id === campeonId ? cruceFinal.equipo_local : cruceFinal.equipo_visitante)
    : null;
  const campeonLogo = campeonId
    ? (cruceFinal.equipo_local_id === campeonId ? cruceFinal.logo_local : cruceFinal.logo_visitante)
    : null;

  return (
    <div>
      <Marcador onCambiarCategoria={alCambiarCategoria} />

      <main className="contenedor" style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-8)' }}>

        {/* Cabecera */}
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
            <h1 style={{ fontSize: 28, marginBottom: 4 }}>
              {torneoActual ? torneoActual.nombre : 'Torneo'}
            </h1>
            {torneoActual && !cargando && fases.length > 0 && (
              <button
                onClick={async () => {
                  setExportando(true);
                  try { await exportarTorneoPDF({ torneo: torneoActual, fases, cruces }); }
                  finally { setExportando(false); }
                }}
                disabled={exportando}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 'var(--r)', background: 'var(--blue)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                {exportando ? 'Generando…' : '⬇ Exportar PDF'}
              </button>
            )}
          </div>
          {torneos.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {torneos.map((t) => (
                <button key={t.id} onClick={() => setTorneoId(t.id)}
                  style={{ padding: '5px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, border: '1px solid var(--border)', background: t.id === torneoId ? 'var(--blue)' : 'transparent', color: t.id === torneoId ? '#fff' : 'var(--txt-3)', cursor: 'pointer' }}>
                  {t.nombre}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Campeón */}
        {campeon && (
          <div className="bracket__campeon">
            <span className="bracket__campeon-trofeo">🏆</span>
            <TeamBadge nombre={campeon} logoUrl={campeonLogo} tamano={48} />
            <div>
              <div className="bracket__campeon-label">Campeón</div>
              <div className="bracket__campeon-nombre">{campeon}</div>
            </div>
          </div>
        )}

        {!torneoActual && !cargando && <div className="vacio">No hay torneos activos en esta categoría.</div>}
        {cargando && <div className="vacio">Cargando…</div>}

        {/* Bracket */}
        {!cargando && faseOrdenada.length > 0 && (
          <div className="bracket">
            {faseOrdenada.map((fase, fi) => {
              const crucesDeEstaFase = cruces
                .filter((c) => c.fase_id === fase.id)
                .sort((a, b) => a.orden - b.orden);
              const faseAnterior = fi > 0 ? faseOrdenada[fi - 1] : null;
              const crucesAnt = faseAnterior ? cruces.filter((c) => c.fase_id === faseAnterior.id) : [];

              return (
                <div key={fase.id} style={{ display: 'flex', alignItems: 'center' }}>
                  {/* Conector desde la fase anterior */}
                  {fi > 0 && crucesAnt.length >= 2 && (
                    <Conector numCruces={crucesAnt.length} />
                  )}

                  {/* Columna de cruces */}
                  <div className="bracket__columna">
                    <div className="bracket__fase-label">
                      {fase.nombre === 'Final' ? '🏆' : fase.nombre === 'Semifinal' ? '🥈' : '⚔️'}
                      {' '}{fase.nombre}
                    </div>
                    <div className="bracket__cruces" style={{
                      justifyContent: crucesDeEstaFase.length === 1 ? 'center' : 'flex-start',
                    }}>
                      {crucesDeEstaFase.map((c) => (
                        <Cruce
                          key={c.cruce_id}
                          cruce={c}
                          esGanadorGlobal={fase.id === faseFinal?.id && !!campeonId}
                        />
                      ))}
                      {crucesDeEstaFase.length === 0 && <Cruce cruce={null} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <style>{`
        .bracket {
          display: flex;
          align-items: center;
          gap: 0;
          overflow-x: auto;
          padding-bottom: var(--space-4);
        }

        .bracket__columna {
          display: flex;
          flex-direction: column;
          min-width: 220px;
          max-width: 240px;
        }

        .bracket__fase-label {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--blue-txt);
          margin-bottom: 10px;
          padding: 0 4px;
        }

        .bracket__cruces {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .bracket__cruce {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: var(--r);
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          transition: box-shadow 150ms;
        }
        .bracket__cruce:hover { box-shadow: 0 3px 10px rgba(0,0,0,0.10); }

        .bracket__cruce--campeon {
          border-color: var(--amber);
          box-shadow: 0 0 0 2px var(--amber);
        }

        .bracket__cruce--vacio {
          opacity: 0.45;
          pointer-events: none;
        }

        .bracket__equipo {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 7px 10px;
          border-bottom: 1px solid var(--border);
          min-height: 36px;
          transition: background 100ms;
        }
        .bracket__equipo:last-of-type { border-bottom: none; }

        .bracket__equipo--ganador {
          background: rgba(21,128,61,0.07);
          font-weight: 700;
        }

        .bracket__equipo--perdedor {
          opacity: 0.45;
        }

        .bracket__equipo-nombre {
          flex: 1;
          font-size: 13px;
          color: var(--txt);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .bracket__equipo--tbd {
          color: var(--txt-4);
          font-style: italic;
        }

        .bracket__score {
          font-family: var(--font-mono);
          font-size: 16px;
          font-weight: 700;
          color: var(--txt-3);
          min-width: 22px;
          text-align: right;
        }
        .bracket__score--gana { color: var(--txt); }

        .bracket__check {
          color: var(--color-win);
          font-size: 11px;
          font-weight: 700;
          margin-left: 2px;
        }

        .bracket__meta {
          font-size: 10px;
          color: var(--txt-4);
          padding: 3px 10px 5px;
          background: var(--bg-3);
          border-top: 1px solid var(--border);
        }

        .bracket__conector {
          align-self: stretch;
          margin-top: 24px; /* alinear con los cruces, no con el label */
        }

        /* Campeón */
        .bracket__campeon {
          display: flex;
          align-items: center;
          gap: 14px;
          background: linear-gradient(90deg, rgba(217,119,6,0.12), rgba(255,255,255,0));
          border: 1px solid var(--amber);
          border-radius: var(--r-lg);
          padding: 14px 20px;
          margin-bottom: var(--space-5);
          max-width: 340px;
        }
        .bracket__campeon-trofeo { font-size: 32px; }
        .bracket__campeon-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--amber-txt); }
        .bracket__campeon-nombre { font-size: 20px; font-weight: 800; color: var(--txt); }
      `}</style>
    </div>
  );
}
