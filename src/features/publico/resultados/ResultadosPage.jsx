import { useEffect, useMemo, useState } from 'react';
import { useRama } from '../../../hooks/useRama';
import { TeamBadge } from '../../../components/TeamBadge';
import { api } from '../../../api/client';

const ETIQUETAS = {
  jugado: 'Jugado', suspendido: 'Suspendido', pospuesto: 'Pospuesto',
  ganado_forfeit: 'Forfeit', ganado_mesa: 'Mesa', ganado_retiro: 'Retiro',
};

export default function ResultadosPage() {
  const { temporadaCategoriaId } = useRama();
  const [juegos, setJuegos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [fecha, setFecha] = useState('');

  useEffect(() => {
    if (!temporadaCategoriaId) return;
    setCargando(true);
    api.get(`/juegos?temporada_categoria_id=${temporadaCategoriaId}&estado=jugado`)
      .then(setJuegos).finally(() => setCargando(false));
  }, [temporadaCategoriaId]);

  const filtrados = useMemo(
    () => fecha ? juegos.filter((j) => j.fecha === fecha) : juegos,
    [juegos, fecha]
  );

  return (
    <main className="contenedor" style={{ padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Resultados recientes</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
      </div>

      {cargando && <div className="vacio">Cargando…</div>}
      {!cargando && filtrados.length === 0 && <div className="vacio">No hay resultados.</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {filtrados.map((j) => {
          const localGana = j.carreras_local > j.carreras_visitante;
          const visitanteGana = j.carreras_visitante > j.carreras_local;
          return (
            <div key={j.id} className="card" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--txt-3)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {new Date(j.fecha + 'T00:00:00').toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}
                {j.hora ? ` · ${j.hora.slice(0,5)}` : ''}
                {j.estadio ? ` · ${j.estadio}` : ''}
              </div>
              {[[j.equipo_local, j.logo_local, j.carreras_local, localGana],
                [j.equipo_visitante, j.logo_visitante, j.carreras_visitante, visitanteGana]].map(([eq, logo, carr, gana], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0', opacity: gana ? 1 : 0.6 }}>
                  <TeamBadge nombre={eq} logoUrl={logo} tamano={22} />
                  <span style={{ flex: 1, fontWeight: gana ? 700 : 400, color: 'var(--txt)' }}>{eq}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: gana ? 'var(--blue-txt)' : 'var(--txt-3)' }}>{carr ?? '—'}</span>
                </div>
              ))}
              {(j.hits_local != null) && (
                <div style={{ fontSize: '0.7rem', color: 'var(--txt-4)', marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.4rem' }}>
                  H {j.hits_local}/{j.hits_visitante} · E {j.errores_local ?? '—'}/{j.errores_visitante ?? '—'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
