import { useEffect, useState } from 'react';
import { useRama } from '../../../hooks/useRama';
import { TeamBadge } from '../../../components/TeamBadge';
import { usePlayerModal } from '../../../components/PlayerModalProvider';
import { api } from '../../../api/client';

export default function EquipoStatsPage() {
  const { temporadaCategoriaId, categoria } = useRama();
  const { abrirJugador } = usePlayerModal();
  const [inscritos, setInscritos] = useState([]);
  const [equipoId, setEquipoId] = useState(null);
  const [stats, setStats] = useState({ bateo: [], pitcheo: [] });
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!temporadaCategoriaId) return;
    api.get(`/equipos/inscritos?temporada_categoria_id=${temporadaCategoriaId}`).then((data) => {
      setInscritos(data);
      setEquipoId(data[0]?.id ?? null);
    });
  }, [temporadaCategoriaId]);

  useEffect(() => {
    if (!temporadaCategoriaId || !equipoId) return;
    setCargando(true);
    api.get(`/lideres/equipo/${equipoId}?temporada_categoria_id=${temporadaCategoriaId}`)
      .then(setStats).finally(() => setCargando(false));
  }, [temporadaCategoriaId, equipoId]);

  const equipo = inscritos.find((e) => e.id === equipoId);

  return (
    <main className="contenedor" style={{ padding: '1.5rem 1rem' }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.25rem' }}>Estadística por equipo</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.25rem', alignItems: 'start' }}>
        <div className="card">
          {inscritos.map((e) => (
            <div
              key={e.id}
              onClick={() => setEquipoId(e.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.6rem 0.75rem', cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                background: e.id === equipoId ? 'rgba(37,99,235,0.12)' : 'transparent',
                borderLeft: e.id === equipoId ? '3px solid var(--blue)' : '3px solid transparent',
              }}
            >
              <TeamBadge nombre={e.nombre} logoUrl={e.logo_url} tamano={22} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--txt)' }}>{e.nombre}</span>
            </div>
          ))}
        </div>
        <div>
          {cargando && <div className="vacio">Cargando…</div>}
          {!cargando && equipo && (
            <>
              <h3 style={{ fontSize: '0.8rem', color: 'var(--txt-3)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bateo — {equipo.nombre}</h3>
              {stats.bateo.length === 0 ? <div className="vacio">Sin estadística de bateo.</div> : (
                <div className="card" style={{ overflowX: 'auto', marginBottom: '1.25rem' }}>
                  <table className="tabla-oscura">
                    <thead><tr>
                      <th style={{ textAlign: 'left' }}>Jugador</th>
                      <th>JJ</th><th>VB</th><th>H</th><th>2B</th><th>3B</th><th>HR</th>
                      <th>CA</th><th>CI</th><th>BR</th><th>AVE</th><th>SLG</th>
                    </tr></thead>
                    <tbody>
                      {stats.bateo.map((j) => (
                        <tr key={j.roster_id}>
                          <td style={{ textAlign: 'left' }}>
                            <button onClick={() => abrirJugador(j.roster_id)}
                              style={{ background: 'none', border: 'none', color: 'var(--blue-txt)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                              {j.nombres} {j.apellidos}
                            </button>
                          </td>
                          <td>{j.juegos_jugados}</td><td>{j.vb}</td><td>{j.hits}</td>
                          <td>{j.dobles}</td><td>{j.triples}</td><td>{j.jonrones}</td>
                          <td>{j.carreras_anotadas}</td><td>{j.carreras_impulsadas}</td>
                          <td>{j.bases_robadas}</td><td className="txt-blue">{j.promedio_bateo}</td><td>{j.slugging}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {categoria?.lleva_pitcheo && stats.pitcheo.length > 0 && (
                <>
                  <h3 style={{ fontSize: '0.8rem', color: 'var(--txt-3)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pitcheo</h3>
                  <div className="card" style={{ overflowX: 'auto' }}>
                    <table className="tabla-oscura">
                      <thead><tr>
                        <th style={{ textAlign: 'left' }}>Jugador</th>
                        <th>G</th><th>P</th><th>S</th><th>IL</th><th>SO</th><th>CL</th><th>EFE</th>
                      </tr></thead>
                      <tbody>
                        {stats.pitcheo.map((j) => (
                          <tr key={j.roster_id}>
                            <td style={{ textAlign: 'left' }}>
                              <button onClick={() => abrirJugador(j.roster_id)}
                                style={{ background: 'none', border: 'none', color: 'var(--blue-txt)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                                {j.nombres} {j.apellidos}
                              </button>
                            </td>
                            <td>{j.ganados}</td><td>{j.perdidos}</td><td>{j.salvados}</td>
                            <td>{j.innings_lanzados}</td><td>{j.ponches}</td>
                            <td>{j.carreras_limpias}</td><td className="txt-blue">{j.efectividad}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
