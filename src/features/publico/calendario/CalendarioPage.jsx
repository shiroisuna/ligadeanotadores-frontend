import { useEffect, useState } from 'react';
import { useRama } from '../../../hooks/useRama';
import { TeamBadge } from '../../../components/TeamBadge';
import { api } from '../../../api/client';
import { exportarCalendarioPDF } from '../../../utils/exportarPDF';

const ETIQUETAS = {
  programado:'Programado',jugado:'Jugado',suspendido:'Suspendido',
  pospuesto:'Pospuesto',ganado_forfeit:'Forfeit',ganado_mesa:'Mesa',ganado_retiro:'Retiro',
};

export default function CalendarioPage() {
  const { temporadaCategoriaId, categoria, temporadas, temporadaId } = useRama();
  const [juegos, setJuegos] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!temporadaCategoriaId) return;
    setCargando(true);
    api.get('/juegos?temporada_categoria_id=' + temporadaCategoriaId)
      .then((data) => setJuegos([...data].sort((a,b) => (a.fecha+(a.hora||'')).localeCompare(b.fecha+(b.hora||'')))))
      .finally(() => setCargando(false));
  }, [temporadaCategoriaId]);

  const hoy = new Date().toISOString().slice(0, 10);
  const porFecha = [];
  for (const j of juegos) {
    let g = porFecha.find((x) => x.fecha === j.fecha);
    if (!g) { g = { fecha: j.fecha, juegos: [] }; porFecha.push(g); }
    g.juegos.push(j);
  }

  function exportarPDF() {
    const temporada = temporadas?.find((t) => String(t.id) === String(temporadaId));
    exportarCalendarioPDF({ porFecha, categoriaNombre: categoria?.categoria_nombre, temporadaNombre: temporada?.nombre, copaNombre: categoria?.copa_nombre });
  }

  return (
    <main className="contenedor" style={{ padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Calendario de juegos</h1>
        <button onClick={exportarPDF} disabled={porFecha.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem', borderRadius: 'var(--r)', background: 'var(--blue)', color: '#fff', border: 'none', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', opacity: porFecha.length === 0 ? 0.5 : 1 }}>
          ⬇ Exportar PDF
        </button>
      </div>

      {cargando && <div className="vacio">Cargando…</div>}
      {!cargando && porFecha.length === 0 && <div className="vacio">No hay juegos programados.</div>}

      {porFecha.map((g) => (
        <div key={g.fecha} style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '0.8rem', fontWeight: 700, color: g.fecha === hoy ? 'var(--amber-txt)' : 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            {new Date(g.fecha + 'T00:00:00').toLocaleDateString('es-VE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            {g.fecha === hoy ? ' — HOY' : ''}
          </h2>
          <div className="card">
            {g.juegos.map((j) => (
              <div key={j.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 1rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--txt-3)', minWidth: '40px' }}>{j.hora ? j.hora.slice(0,5) : '—'}</span>
                  <TeamBadge nombre={j.equipo_local} logoUrl={j.logo_local} tamano={20} />
                  <span style={{ fontWeight: 600, color: 'var(--txt)', fontSize: '0.85rem' }}>{j.equipo_local}</span>
                  <span style={{ color: 'var(--txt-4)', fontSize: '0.75rem' }}>vs</span>
                  <TeamBadge nombre={j.equipo_visitante} logoUrl={j.logo_visitante} tamano={20} />
                  <span style={{ fontWeight: 600, color: 'var(--txt)', fontSize: '0.85rem' }}>{j.equipo_visitante}</span>
                  {j.estadio && <span style={{ fontSize: '0.72rem', color: 'var(--txt-4)' }}>· {j.estadio}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {j.estado === 'jugado' && <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--txt)', fontSize: '0.9rem' }}>{j.carreras_local} - {j.carreras_visitante}</span>}
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px', background: j.estado === 'jugado' ? 'var(--green-soft)' : 'rgba(255,255,255,0.06)', color: j.estado === 'jugado' ? 'var(--green)' : 'var(--txt-3)', border: '1px solid ' + (j.estado === 'jugado' ? 'rgba(16,185,129,0.2)' : 'var(--border)') }}>
                    {ETIQUETAS[j.estado] || j.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
