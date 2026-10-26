import { useEffect, useState } from 'react';
import { Marcador } from '../../../components/Marcador';
import { TeamBadge } from '../../../components/TeamBadge';
import { api } from '../../../api/client';
import { formatInnings } from '../../../utils/innings';

const TABS = [
  { id: 'bateo', label: 'Bateo' },
  { id: 'pitcheo', label: 'Pitcheo' },
  { id: 'fildeo', label: 'Fildeo' },
];

// 397 -> ".397"   1000 -> "1.000"  (estilo tradicional de promedios de béisbol)
function formatAve(valor) {
  const n = Number(valor) || 0;
  if (n >= 1000) return (n / 1000).toFixed(3);
  return '.' + String(Math.round(n)).padStart(3, '0');
}

export default function ColectivoPage() {
  const [temporadaCategoriaId, setTemporadaCategoriaId] = useState(null);
  const [categoria, setCategoria] = useState(null);
  const [tab, setTab] = useState('bateo');
  const [colectivo, setColectivo] = useState({ bateo: [], pitcheo: [], fildeo: [] });
  const [cargando, setCargando] = useState(false);

  function alCambiarCategoria(id, cat) {
    setTemporadaCategoriaId(id);
    setCategoria(cat);
  }

  useEffect(() => {
    if (!temporadaCategoriaId) return;
    setCargando(true);
    api.get(`/estadisticas/colectivo?temporada_categoria_id=${temporadaCategoriaId}`)
      .then(setColectivo)
      .finally(() => setCargando(false));
  }, [temporadaCategoriaId]);

  const filas = colectivo[tab] || [];

  return (
    <div>
      <Marcador onCambiarCategoria={alCambiarCategoria} />

      <main className="contenedor" style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-8)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
          <h1 style={{ fontSize: 32 }}>Estadísticas Colectivas</h1>
          <p style={{ color: 'var(--color-ink-soft)', fontFamily: 'var(--font-body)' }}>
            Totales por equipo{categoria?.categoria_nombre ? ` — ${categoria.categoria_nombre}` : ''}
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '10px 22px',
                borderRadius: 999,
                border: 'none',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                cursor: 'pointer',
                background: tab === t.id ? 'var(--amber)' : '#fff',
                color: tab === t.id ? '#1a0e35' : 'var(--color-ink-soft)',
                boxShadow: tab === t.id ? '0 4px 14px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.08)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {cargando && <div className="vacio">Cargando…</div>}

        {!cargando && filas.length === 0 && (
          <div className="vacio">No hay estadística colectiva registrada en esta categoría.</div>
        )}

        {!cargando && filas.length > 0 && (
          <div className="tarjeta-lista" style={{ overflowX: 'auto' }}>
            <table className="tabla">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Equipo</th>
                  {tab === 'bateo' && (
                    <>
                      <th>AVG</th><th>VB</th><th>C</th><th>H</th><th>2B</th><th>3B</th>
                      <th>HR</th><th>CI</th><th>BB</th><th>SO</th><th>BR</th><th>OR</th>
                    </>
                  )}
                  {tab === 'pitcheo' && (
                    <>
                      <th>AVG</th><th>G</th><th>P</th><th>S</th><th>IL</th>
                      <th>SO</th><th>BB</th><th>CL</th><th>EFE</th>
                    </>
                  )}
                  {tab === 'fildeo' && (
                    <>
                      <th>AVE</th><th>O</th><th>A</th><th>E</th><th>TL</th><th>DP</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {filas.map((eq) => (
                  <tr key={eq.equipo_inscrito_id}>
                    <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TeamBadge nombre={eq.equipo} logoUrl={eq.logo_url} tamano={24} />
                        {eq.equipo}
                      </span>
                    </td>
                    {tab === 'bateo' && (
                      <>
                        <td style={{ fontWeight: 700 }}>{formatAve(eq.promedio_bateo)}</td>
                        <td>{eq.vb}</td><td>{eq.ca}</td><td>{eq.hc}</td><td>{eq.h2}</td><td>{eq.h3}</td>
                        <td>{eq.hr}</td><td>{eq.ci}</td><td>{eq.bb}</td><td>{eq.so}</td><td>{eq.br}</td><td>{eq.or_}</td>
                      </>
                    )}
                    {tab === 'pitcheo' && (
                      <>
                        <td style={{ fontWeight: 700 }}>{formatAve(eq.promedio_bateo_permitido)}</td>
                        <td>{eq.g}</td><td>{eq.p}</td><td>{eq.s}</td><td>{formatInnings(eq.il, '0')}</td>
                        <td>{eq.so}</td><td>{eq.bb}</td><td>{eq.cl}</td><td>{Number(eq.efectividad || 0).toFixed(2)}</td>
                      </>
                    )}
                    {tab === 'fildeo' && (
                      <>
                        <td style={{ fontWeight: 700 }}>{formatAve(eq.promedio_fildeo)}</td>
                        <td>{eq.o}</td><td>{eq.a}</td><td>{eq.e}</td><td>{eq.tl}</td><td>{eq.dp}</td>
                      </>
                    )}
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