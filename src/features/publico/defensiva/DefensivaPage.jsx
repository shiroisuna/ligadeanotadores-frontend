import { useEffect, useState } from 'react';
import { Marcador } from '../../../components/Marcador';
import { TeamBadge } from '../../../components/TeamBadge';
import { usePlayerModal } from '../../../components/PlayerModalProvider';
import { api } from '../../../api/client';

function formatAve(valor) {
  const n = Number(valor) || 0;
  if (n >= 1000) return (n / 1000).toFixed(3);
  return '.' + String(Math.round(n)).padStart(3, '0');
}

export default function DefensivaPage() {
  const { abrirJugador } = usePlayerModal();
  const [temporadaCategoriaId, setTemporadaCategoriaId] = useState(null);
  const [categoria, setCategoria] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(false);

  function alCambiarCategoria(id, cat) {
    setTemporadaCategoriaId(id);
    setCategoria(cat);
  }

  useEffect(() => {
    if (!temporadaCategoriaId) return;
    setCargando(true);
    api.get(`/lideres/defensiva?temporada_categoria_id=${temporadaCategoriaId}&limit=10`)
      .then(setGrupos)
      .finally(() => setCargando(false));
  }, [temporadaCategoriaId]);

  return (
    <div>
      <Marcador onCambiarCategoria={alCambiarCategoria} />

      <main className="contenedor" style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-8)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
          <h1 style={{ fontSize: 32 }}>Mejores a la Defensiva</h1>
          <p style={{ color: 'var(--color-ink-soft)', fontFamily: 'var(--font-body)' }}>
            Top 10 por posición{categoria?.categoria_nombre ? ` — ${categoria.categoria_nombre}` : ''}
          </p>
        </div>

        {cargando && <div className="vacio">Cargando…</div>}

        {!cargando && grupos.map((g) => (
          <div key={g.posicion} className="tarjeta-lista" style={{ marginBottom: 'var(--space-5)' }}>
            <div className="tarjeta-lista__cabecera">
              <h3>{g.etiqueta}</h3>
            </div>

            {g.jugadores.length === 0 ? (
              <div className="vacio">
                Ningún jugador alcanza el mínimo de {g.umbral_ij} innings jugados en esta posición
                (2/3 del promedio: {g.media_ij}).
              </div>
            ) : (
              <>
                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-ink-soft)',
                  padding: '0 var(--space-3)', margin: '0 0 var(--space-2)',
                }}>
                  Para calificar, el jugador debe tener al menos <b>{g.umbral_ij} innings jugados</b> (2/3 de la media: <b>{g.media_ij}</b>).
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table className="tabla">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Equipo</th>
                        <th style={{ textAlign: 'left' }}>Jugador</th>
                        <th>INJ</th><th>O</th><th>A</th><th>E</th><th>TL</th><th>AVED</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.jugadores.map((j) => (
                        <tr key={j.roster_id}>
                          <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <TeamBadge nombre={j.equipo} logoUrl={j.logo_url} tamano={22} />
                              {j.equipo}
                            </span>
                          </td>
                          <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                            <button
                              onClick={() => abrirJugador(j.roster_id)}
                              style={{ background: 'none', border: 'none', color: 'var(--blue-txt)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                            >
                              {j.nombres} {j.apellidos}
                            </button>
                          </td>
                          <td>{j.ij}</td><td>{j.o}</td><td>{j.a}</td><td>{j.e}</td><td>{j.tl}</td>
                          <td style={{ fontWeight: 700 }}>{formatAve(j.aved)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}