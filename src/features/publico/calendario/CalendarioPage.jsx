import { useEffect, useState } from 'react';
import { Marcador } from '../../../components/Marcador';
import { TeamBadge } from '../../../components/TeamBadge';
import { api } from '../../../api/client';
import { exportarCalendarioPDF } from '../../../utils/exportarPDF';

const ETIQUETAS = {
  programado:'Programado', jugado:'Jugado', suspendido:'Suspendido',
  pospuesto:'Pospuesto', ganado_forfeit:'Forfeit', ganado_mesa:'Mesa', ganado_retiro:'Retiro',
};

export default function CalendarioPage() {
  const [temporadaCategoriaId, setTemporadaCategoriaId] = useState(null);
  const [categoria, setCategoria] = useState(null);
  const [temporada, setTemporada] = useState(null);
  const [juegos, setJuegos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [exportando, setExportando] = useState(false);

  function alCambiarCategoria(id, cat) {
    setTemporadaCategoriaId(id);
    setCategoria(cat);
  }

  useEffect(() => {
    if (!temporadaCategoriaId) return;
    setCargando(true);
    api.get('/juegos?temporada_categoria_id=' + temporadaCategoriaId)
      .then((data) => setJuegos([...data].sort((a, b) =>
        (a.fecha + (a.hora || '')).localeCompare(b.fecha + (b.hora || ''))
      )))
      .finally(() => setCargando(false));
  }, [temporadaCategoriaId]);

  const hoy = new Date().toISOString().slice(0, 10);
  const porFecha = [];
  for (const j of juegos) {
    let g = porFecha.find((x) => x.fecha === j.fecha);
    if (!g) { g = { fecha: j.fecha, juegos: [] }; porFecha.push(g); }
    g.juegos.push(j);
  }

  async function alExportar() {
    setExportando(true);
    try {
      await exportarCalendarioPDF({
        porFecha,
        categoriaNombre: categoria?.categoria_nombre,
        temporadaNombre: temporada?.nombre,
        copaNombre: categoria?.copa_nombre,
      });
    } finally {
      setExportando(false);
    }
  }

  return (
    <div>
      <Marcador onCambiarCategoria={alCambiarCategoria} />
      <main className="contenedor" style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 8 }}>
          <h1 style={{ fontSize: 28 }}>Calendario de juegos</h1>
          <button
            onClick={alExportar}
            disabled={porFecha.length === 0 || exportando}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 'var(--r)',
              background: 'var(--blue)', color: '#fff', border: 'none',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              opacity: porFecha.length === 0 ? 0.5 : 1,
            }}
          >
            {exportando ? 'Generando…' : '⬇ Exportar PDF'}
          </button>
        </div>

        {cargando && <div className="vacio">Cargando…</div>}
        {!cargando && porFecha.length === 0 && <div className="vacio">No hay juegos programados.</div>}

        {porFecha.map((g) => (
          <div key={g.fecha} style={{ marginBottom: 'var(--space-5)' }}>
            <h2 style={{
              fontSize: 12, fontWeight: 700,
              color: g.fecha === hoy ? 'var(--amber)' : 'var(--txt-3)',
              textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8
            }}>
              {new Date(g.fecha + 'T00:00:00').toLocaleDateString('es-VE', {
                weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
              })}
              {g.fecha === hoy ? ' — HOY' : ''}
            </h2>
            <div className="tarjeta-lista">
              {g.juegos.map((j) => (
                <div key={j.id} className="item-lista" style={{ cursor: 'default', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--txt-3)', minWidth: 40 }}>
                      {j.hora ? j.hora.slice(0, 5) : '—'}
                    </span>
                    <TeamBadge nombre={j.equipo_local} logoUrl={j.logo_local} tamano={20} />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{j.equipo_local}</span>
                    <span style={{ color: 'var(--txt-4)', fontSize: 12 }}>vs</span>
                    <TeamBadge nombre={j.equipo_visitante} logoUrl={j.logo_visitante} tamano={20} />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{j.equipo_visitante}</span>
                    {j.estadio && <span style={{ fontSize: 11, color: 'var(--txt-4)' }}>· {j.estadio}</span>}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {j.estado === 'jugado' && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {j.carreras_local} - {j.carreras_visitante}
                      </span>
                    )}
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                      background: j.estado === 'jugado' ? 'rgba(21,128,61,0.1)' : 'var(--bg-3)',
                      color: j.estado === 'jugado' ? 'var(--color-win)' : 'var(--txt-3)',
                      border: '1px solid var(--border)',
                    }}>
                      {ETIQUETAS[j.estado] || j.estado}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
