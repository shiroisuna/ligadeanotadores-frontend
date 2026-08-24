import { useEffect, useState } from 'react';
import { useRama } from '../../../hooks/useRama';
import { TeamBadge } from '../../../components/TeamBadge';
import { usePlayerModal } from '../../../components/PlayerModalProvider';
import { api } from '../../../api/client';

const COLS_BATEO = [
  ['juegos_jugados','JJ'],['vb','VB'],['hits','H'],['dobles','2B'],['triples','3B'],
  ['jonrones','HR'],['carreras_anotadas','CA'],['carreras_impulsadas','CI'],
  ['bases_robadas','BR'],['bases_por_bolas','BB'],['ponches','SO'],
  ['promedio_bateo','AVE'],['slugging','SLG'],
];
const COLS_PITCHEO = [
  ['ganados','G'],['perdidos','P'],['salvados','S'],['innings_lanzados','IL'],
  ['ponches','SO'],['carreras_limpias','CL'],['efectividad','EFE'],
];

export default function LideresPage() {
  const { temporadaCategoriaId, categoria } = useRama();
  const { abrirJugador } = usePlayerModal();
  const [depto, setDepto] = useState('bateo');
  const [filas, setFilas] = useState([]);
  const [orden, setOrden] = useState({ col: 'promedio_bateo', dir: 'desc' });
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!temporadaCategoriaId) return;
    setCargando(true);
    const stat = depto === 'bateo' ? 'promedio_bateo' : 'efectividad';
    setOrden({ col: stat, dir: depto === 'pitcheo' ? 'asc' : 'desc' });
    api.get(`/lideres/${depto}?temporada_categoria_id=${temporadaCategoriaId}&stat=${stat}&limit=50`)
      .then(setFilas).finally(() => setCargando(false));
  }, [temporadaCategoriaId, depto]);

  const cols = depto === 'bateo' ? COLS_BATEO : COLS_PITCHEO;
  const sorted = [...filas].sort((a, b) => {
    const va = a[orden.col] ?? 0, vb = b[orden.col] ?? 0;
    return orden.dir === 'desc' ? vb - va : va - vb;
  });

  function ordenarPor(col) {
    setOrden((o) => ({ col, dir: o.col === col && o.dir === 'desc' ? 'asc' : 'desc' }));
  }

  return (
    <main className="contenedor" style={{ padding: '1.5rem 1rem' }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem' }}>Líderes</h1>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {['bateo', ...(categoria?.lleva_pitcheo ? ['pitcheo'] : [])].map((d) => (
          <button
            key={d}
            onClick={() => setDepto(d)}
            style={{
              padding: '0.35rem 1rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700,
              border: '1px solid var(--border)',
              background: depto === d ? 'var(--blue)' : 'transparent',
              color: depto === d ? '#fff' : 'var(--txt-3)',
            }}
          >
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>

      {cargando && <div className="vacio">Cargando…</div>}
      {!cargando && filas.length === 0 && <div className="vacio">Sin estadísticas todavía.</div>}
      {!cargando && filas.length > 0 && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="tabla-oscura">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Jugador</th>
                <th style={{ textAlign: 'left' }}>Equipo</th>
                {cols.map(([k, l]) => (
                  <th
                    key={k}
                    onClick={() => ordenarPor(k)}
                    style={{ cursor: 'pointer', color: orden.col === k ? 'var(--blue-txt)' : undefined }}
                  >
                    {l}{orden.col === k ? (orden.dir === 'desc' ? ' ↓' : ' ↑') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((f) => (
                <tr key={f.roster_id}>
                  <td style={{ textAlign: 'left' }}>
                    <button
                      onClick={() => abrirJugador(f.roster_id)}
                      style={{
                        background: 'none', border: 'none', padding: 0,
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        color: 'var(--txt-2)', fontWeight: 600, cursor: 'pointer',
                        fontSize: '0.82rem',
                      }}
                    >
                      <TeamBadge nombre={f.equipo} logoUrl={f.logo_url} tamano={22} />
                      {f.nombres} {f.apellidos}
                    </button>
                  </td>
                  <td style={{ textAlign: 'left', color: 'var(--txt-3)', fontSize: '0.78rem' }}>{f.equipo}</td>
                  {cols.map(([k]) => (
                    <td key={k} style={{ fontWeight: orden.col === k ? 700 : 400 }}>{f[k]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
