import { useEffect, useState } from 'react';
import { TeamBadge } from './TeamBadge';
import { api } from '../api/client';

const SUFIJOS = { ganado_forfeit: 'FORF', ganado_mesa: 'MESA', ganado_retiro: 'RET' };

function celda(fila, columna, juegos) {
  const j = juegos.find((x) =>
    (x.local_equipo_inscrito_id === fila.id && x.visitante_equipo_inscrito_id === columna.id) ||
    (x.visitante_equipo_inscrito_id === fila.id && x.local_equipo_inscrito_id === columna.id)
  );
  if (!j) return { texto: '', clase: '' };
  const esLocal = j.local_equipo_inscrito_id === fila.id;
  const miScore = esLocal ? j.carreras_local : j.carreras_visitante;
  const rivalScore = esLocal ? j.carreras_visitante : j.carreras_local;
  if (j.estado === 'jugado') return { texto: `${miScore}-${rivalScore}`, clase: miScore > rivalScore ? 'matriz__celda--gana' : 'matriz__celda--pierde' };
  if (SUFIJOS[j.estado]) {
    const gane = j.equipo_ganador_id === fila.id;
    return { texto: `${gane ? 'G' : 'P'}-${SUFIJOS[j.estado]}`, clase: gane ? 'matriz__celda--gana' : 'matriz__celda--pierde' };
  }
  if (j.estado === 'suspendido') return { texto: 'Susp.', clase: '' };
  return { texto: 'Prog.', clase: '' };
}

// Matriz de cruces (juego por juego) entre todos los equipos de una
// categoría. Se usa embebida dentro de PosicionesPage — no trae su
// propio Marcador ni selector de categoría, recibe temporadaCategoriaId
// ya resuelto desde afuera.
export default function MatrizCruces({ temporadaCategoriaId }) {
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
  for (const e of equipos) { const g = e.grupo || 'General'; if (!grupos[g]) grupos[g] = []; grupos[g].push(e); }

  if (cargando) return <div className="vacio">Cargando cruces…</div>;
  if (equipos.length === 0) return null;

  return (
    <div style={{ marginTop: 'var(--space-6)' }}>
      <h2 style={{ fontSize: 20, marginBottom: 'var(--space-4)' }}>Juego por juego</h2>
      {Object.entries(grupos).map(([nombre, eq]) => (
        <div key={nombre} style={{ marginBottom: 'var(--space-6)' }}>
          {Object.keys(grupos).length > 1 && (
            <h3 style={{ fontSize: 13, color: 'var(--blue-txt)', marginBottom: 8, fontWeight: 700 }}>Grupo {nombre}</h3>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table className="tabla matriz">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}></th>
                  {eq.map((e) => (
                    <th key={e.id} style={{ minWidth: 80 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <TeamBadge nombre={e.nombre} logoUrl={e.logo_url} tamano={20} />
                        <span style={{ fontSize: 10 }}>{e.nombre}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {eq.map((fila) => (
                  <tr key={fila.id}>
                    <td style={{ textAlign: 'left' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <TeamBadge nombre={fila.nombre} logoUrl={fila.logo_url} tamano={18} />
                        <span style={{ fontWeight: 600 }}>{fila.nombre}</span>
                      </span>
                    </td>
                    {eq.map((col) => {
                      if (col.id === fila.id) return <td key={col.id} className="matriz__celda--propia" />;
                      const { texto, clase } = celda(fila, col, juegos);
                      return <td key={col.id} className={clase}>{texto}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}