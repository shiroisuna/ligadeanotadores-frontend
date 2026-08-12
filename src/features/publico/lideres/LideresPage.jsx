import { useEffect, useState } from 'react';
import { Marcador } from '../../../components/Marcador';
import { TeamBadge } from '../../../components/TeamBadge';
import { usePlayerModal } from '../../../components/PlayerModalProvider';
import { api } from '../../../api/client';

const COLS_BATEO = [
  ['juegos_jugados', 'JJ'], ['vb', 'VB'], ['hits', 'H'], ['dobles', '2B'], ['triples', '3B'],
  ['jonrones', 'HR'], ['carreras_anotadas', 'CA'], ['carreras_impulsadas', 'CI'],
  ['bases_robadas', 'BR'], ['bases_por_bolas', 'BB'], ['ponches', 'SO'],
  ['promedio_bateo', 'AVE'], ['slugging', 'SLG'],
];

const COLS_PITCHEO = [
  ['ganados', 'G'], ['perdidos', 'P'], ['salvados', 'S'], ['innings_lanzados', 'IL'],
  ['ponches', 'SO'], ['carreras_limpias', 'CL'], ['efectividad', 'EFE'],
];

export default function LideresPage() {
  const { abrirJugador } = usePlayerModal();
  const [temporadaCategoriaId, setTemporadaCategoriaId] = useState(null);
  const [categoria, setCategoria] = useState(null);
  const [departamento, setDepartamento] = useState('bateo'); // 'bateo' | 'pitcheo'
  const [filas, setFilas] = useState([]);
  const [orden, setOrden] = useState({ col: 'promedio_bateo', dir: 'desc' });
  const [cargando, setCargando] = useState(false);

  function alCambiarCategoria(id, cat) {
    setTemporadaCategoriaId(id);
    setCategoria(cat);
    setDepartamento('bateo');
  }

  useEffect(() => {
    if (!temporadaCategoriaId) return;
    setCargando(true);
    const statInicial = departamento === 'bateo' ? 'promedio_bateo' : 'efectividad';
    setOrden({ col: statInicial, dir: departamento === 'pitcheo' && statInicial === 'efectividad' ? 'asc' : 'desc' });
    api.get(`/lideres/${departamento}?temporada_categoria_id=${temporadaCategoriaId}&stat=${statInicial}&limit=50`)
      .then(setFilas)
      .finally(() => setCargando(false));
  }, [temporadaCategoriaId, departamento]);

  const columnas = departamento === 'bateo' ? COLS_BATEO : COLS_PITCHEO;

  function ordenarPor(col) {
    setOrden((o) => ({ col, dir: o.col === col && o.dir === 'desc' ? 'asc' : 'desc' }));
  }

  const filasOrdenadas = [...filas].sort((a, b) => {
    const va = a[orden.col] ?? 0;
    const vb = b[orden.col] ?? 0;
    return orden.dir === 'desc' ? vb - va : va - vb;
  });

  return (
    <div>
      <Marcador onCambiarCategoria={alCambiarCategoria} />

      <main className="contenedor" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 28, marginBottom: 'var(--space-4)' }}>Líderes</h1>

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
          <button className={`pestana ${departamento === 'bateo' ? 'pestana--activa' : ''}`} onClick={() => setDepartamento('bateo')}>
            Bateo
          </button>
          {categoria?.lleva_pitcheo && (
            <button className={`pestana ${departamento === 'pitcheo' ? 'pestana--activa' : ''}`} onClick={() => setDepartamento('pitcheo')}>
              Pitcheo
            </button>
          )}
        </div>

        {cargando && <div className="vacio">Cargando…</div>}
        {!cargando && filas.length === 0 && <div className="vacio">Todavía no hay estadísticas en esta categoría.</div>}

        {!cargando && filas.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="tabla">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Jugador</th>
                  <th style={{ textAlign: 'left' }}>Equipo</th>
                  {columnas.map(([key, label]) => (
                    <th
                      key={key}
                      onClick={() => ordenarPor(key)}
                      style={{ cursor: 'pointer', color: orden.col === key ? 'var(--color-field)' : undefined }}
                      title="Clic para ordenar"
                    >
                      {label}{orden.col === key ? (orden.dir === 'desc' ? ' ↓' : ' ↑') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filasOrdenadas.map((f, i) => (
                  <tr key={f.roster_id}>
                    <td style={{ textAlign: 'left' }}>
                      <button
                        onClick={() => abrirJugador(f.roster_id)}
                        style={{ background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', color: i === 0 ? 'var(--color-field)' : 'var(--color-ink)', fontWeight: i === 0 ? 600 : 400, cursor: 'pointer' }}
                      >
                        <TeamBadge nombre={f.equipo} logoUrl={f.logo_url} tamano={22} />
                        {f.nombres} {f.apellidos}
                      </button>
                    </td>
                    <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)', color: 'var(--color-ink-soft)' }}>{f.equipo}</td>
                    {columnas.map(([key]) => (
                      <td key={key} style={{ fontWeight: orden.col === key ? 700 : 400 }}>{f[key]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
