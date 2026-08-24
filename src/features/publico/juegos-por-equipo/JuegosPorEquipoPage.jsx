import { useEffect, useState } from 'react';
import { useRama } from '../../../hooks/useRama';
import { TeamBadge } from '../../../components/TeamBadge';
import { api } from '../../../api/client';

const SUFIJOS = { ganado_forfeit:'FORF', ganado_mesa:'MESA', ganado_retiro:'RET' };

function celda(fila, columna, juegos) {
  const j = juegos.find((x) =>
    (x.local_equipo_inscrito_id === fila.id && x.visitante_equipo_inscrito_id === columna.id) ||
    (x.visitante_equipo_inscrito_id === fila.id && x.local_equipo_inscrito_id === columna.id)
  );
  if (!j) return { texto: '', clase: '' };
  const esLocal = j.local_equipo_inscrito_id === fila.id;
  const miScore = esLocal ? j.carreras_local : j.carreras_visitante;
  const rivalScore = esLocal ? j.carreras_visitante : j.carreras_local;
  if (j.estado === 'jugado') {
    return { texto: `${miScore}-${rivalScore}`, clase: miScore > rivalScore ? 'celda-gana' : 'celda-pierde' };
  }
  if (SUFIJOS[j.estado]) {
    const gane = j.equipo_ganador_id === fila.id;
    return { texto: `${gane ? 'G' : 'P'}-${SUFIJOS[j.estado]}`, clase: gane ? 'celda-gana' : 'celda-pierde' };
  }
  if (j.estado === 'suspendido') return { texto: 'Susp.', clase: '' };
  return { texto: 'Prog.', clase: '' };
}

export default function JuegosPorEquipoPage() {
  const { temporadaCategoriaId } = useRama();
  const [equipos, setEquipos] = useState([]);
  const [juegos, setJuegos] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!temporadaCategoriaId) return;
    setCargando(true);
    Promise.all([
      api.get(`/equipos/inscritos?temporada_categoria_id=${temporadaCategoriaId}`),
      api.get(`/juegos?temporada_categoria_id=${temporadaCategoriaId}`),
    ]).then(([e, j]) => { setEquipos(e); setJuegos(j); }).finally(() => setCargando(false));
  }, [temporadaCategoriaId]);

  const grupos = {};
  for (const e of equipos) {
    const g = e.grupo || 'General';
    if (!grupos[g]) grupos[g] = [];
    grupos[g].push(e);
  }

  return (
    <main className="contenedor" style={{ padding: '1.5rem 1rem' }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.25rem' }}>Juegos por equipo</h1>
      {cargando && <div className="vacio">Cargando…</div>}
      {!cargando && equipos.length === 0 && <div className="vacio">Sin equipos.</div>}

      {Object.entries(grupos).map(([nombre, eq]) => (
        <div key={nombre} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--blue-txt)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Grupo {nombre}</h2>
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="tabla-oscura" style={{ fontSize: '0.78rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}></th>
                  {eq.map((e) => (
                    <th key={e.id} style={{ minWidth: 80 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <TeamBadge nombre={e.nombre} logoUrl={e.logo_url} tamano={20} />
                        <span style={{ fontSize: '0.62rem' }}>{e.nombre}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {eq.map((fila) => (
                  <tr key={fila.id}>
                    <td style={{ textAlign: 'left' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <TeamBadge nombre={fila.nombre} logoUrl={fila.logo_url} tamano={18} />
                        <span style={{ color: 'var(--txt)', fontWeight: 600 }}>{fila.nombre}</span>
                      </span>
                    </td>
                    {eq.map((col) => {
                      if (col.id === fila.id) return (
                        <td key={col.id} style={{ background: 'repeating-linear-gradient(45deg, var(--border) 0, var(--border) 2px, transparent 2px, transparent 8px)' }} />
                      );
                      const { texto, clase } = celda(fila, col, juegos);
                      return (
                        <td key={col.id} className={clase} style={{ fontWeight: clase ? 700 : 400, textAlign: 'center' }}>
                          {texto}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <style>{`
        .celda-gana { background: rgba(16,185,129,0.1); color: #10b981; }
        .celda-pierde { background: rgba(244,63,94,0.08); color: #f43f5e; }
      `}</style>
    </main>
  );
}
