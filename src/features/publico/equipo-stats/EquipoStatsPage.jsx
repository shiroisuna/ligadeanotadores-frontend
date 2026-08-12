import { useEffect, useState } from 'react';
import { Marcador } from '../../../components/Marcador';
import { TeamBadge } from '../../../components/TeamBadge';
import { usePlayerModal } from '../../../components/PlayerModalProvider';
import { api } from '../../../api/client';

export default function EquipoStatsPage() {
  const { abrirJugador } = usePlayerModal();
  const [temporadaCategoriaId, setTemporadaCategoriaId] = useState(null);
  const [categoria, setCategoria] = useState(null);
  const [inscritos, setInscritos] = useState([]);
  const [equipoInscritoId, setEquipoInscritoId] = useState(null);
  const [stats, setStats] = useState({ bateo: [], pitcheo: [] });
  const [cargando, setCargando] = useState(false);

  function alCambiarCategoria(id, cat) {
    setTemporadaCategoriaId(id);
    setCategoria(cat);
  }

  useEffect(() => {
    if (!temporadaCategoriaId) return;
    api.get(`/equipos/inscritos?temporada_categoria_id=${temporadaCategoriaId}`).then((data) => {
      setInscritos(data);
      setEquipoInscritoId(data[0]?.id ?? null);
    });
  }, [temporadaCategoriaId]);

  useEffect(() => {
    if (!temporadaCategoriaId || !equipoInscritoId) return;
    setCargando(true);
    api.get(`/lideres/equipo/${equipoInscritoId}?temporada_categoria_id=${temporadaCategoriaId}`)
      .then(setStats)
      .finally(() => setCargando(false));
  }, [temporadaCategoriaId, equipoInscritoId]);

  const equipoActual = inscritos.find((e) => e.id === equipoInscritoId);

  return (
    <div>
      <Marcador onCambiarCategoria={alCambiarCategoria} />

      <main className="contenedor" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 28, marginBottom: 'var(--space-5)' }}>Estadística por equipo</h1>

        <div className="panel-doble">
          {/* Selector de equipo */}
          <div className="tarjeta-lista">
            <div className="tarjeta-lista__cabecera"><h3>Equipos</h3></div>
            {inscritos.length === 0 && <div className="vacio">Sin equipos en esta categoría.</div>}
            {inscritos.map((e) => (
              <div
                key={e.id}
                className={`item-lista ${e.id === equipoInscritoId ? 'item-lista--activo' : ''}`}
                onClick={() => setEquipoInscritoId(e.id)}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <TeamBadge nombre={e.nombre} logoUrl={e.logo_url} tamano={24} />
                  {e.nombre}
                </span>
                {e.grupo && <span className="item-lista__grupo">{e.grupo}</span>}
              </div>
            ))}
          </div>

          {/* Tablas completas del equipo seleccionado */}
          <div>
            {equipoActual && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-4)' }}>
                <TeamBadge nombre={equipoActual.nombre} logoUrl={equipoActual.logo_url} tamano={36} />
                <h2 style={{ fontSize: 20 }}>{equipoActual.nombre}</h2>
              </div>
            )}

            {cargando && <div className="vacio">Cargando…</div>}

            {!cargando && equipoActual && (
              <>
                <h3 style={{ fontSize: 14, marginBottom: 'var(--space-2)' }}>Bateo</h3>
                {stats.bateo.length === 0 ? (
                  <div className="vacio">Sin estadística de bateo registrada.</div>
                ) : (
                  <div style={{ overflowX: 'auto', marginBottom: 'var(--space-6)' }}>
                    <table className="tabla">
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left' }}>Jugador</th>
                          <th>JJ</th><th>VB</th><th>H</th><th>2B</th><th>3B</th><th>HR</th>
                          <th>CA</th><th>CI</th><th>BR</th><th>AVE</th><th>SLG</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.bateo.map((j) => (
                          <tr key={j.roster_id}>
                            <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                              <button onClick={() => abrirJugador(j.roster_id)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-field)', cursor: 'pointer', font: 'inherit' }}>
                                {j.nombres} {j.apellidos}
                              </button>
                            </td>
                            <td>{j.juegos_jugados}</td><td>{j.vb}</td><td>{j.hits}</td>
                            <td>{j.dobles}</td><td>{j.triples}</td><td>{j.jonrones}</td>
                            <td>{j.carreras_anotadas}</td><td>{j.carreras_impulsadas}</td>
                            <td>{j.bases_robadas}</td><td>{j.promedio_bateo}</td><td>{j.slugging}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {categoria?.lleva_pitcheo && (
                  <>
                    <h3 style={{ fontSize: 14, marginBottom: 'var(--space-2)' }}>Pitcheo</h3>
                    {stats.pitcheo.length === 0 ? (
                      <div className="vacio">Sin estadística de pitcheo registrada.</div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="tabla">
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'left' }}>Jugador</th>
                              <th>G</th><th>P</th><th>S</th><th>IL</th><th>SO</th><th>CL</th><th>EFE</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.pitcheo.map((j) => (
                              <tr key={j.roster_id}>
                                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                                  <button onClick={() => abrirJugador(j.roster_id)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-field)', cursor: 'pointer', font: 'inherit' }}>
                                    {j.nombres} {j.apellidos}
                                  </button>
                                </td>
                                <td>{j.ganados}</td><td>{j.perdidos}</td><td>{j.salvados}</td>
                                <td>{j.innings_lanzados}</td><td>{j.ponches}</td><td>{j.carreras_limpias}</td>
                                <td>{j.efectividad}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
