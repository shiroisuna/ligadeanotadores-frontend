import { useEffect, useState } from 'react';
import { Marcador } from '../../../components/Marcador';
import { TeamBadge } from '../../../components/TeamBadge';
import { api } from '../../../api/client';

// Mapa de estado -> sufijo de etiqueta cuando el juego se decidió sin
// marcador (forfeit, mesa, retiro). "G-" si el equipo de la fila ganó,
// "P-" si perdió.
const SUFIJOS = {
  ganado_forfeit: 'FORF',
  ganado_mesa: 'MESA',
  ganado_retiro: 'RET',
};

function celda(fila, columna, juegos) {
  const juego = juegos.find((j) =>
    (j.local_equipo_inscrito_id === fila.id && j.visitante_equipo_inscrito_id === columna.id) ||
    (j.visitante_equipo_inscrito_id === fila.id && j.local_equipo_inscrito_id === columna.id)
  );
  if (!juego) return { texto: '', clase: '' };

  const esLocal = juego.local_equipo_inscrito_id === fila.id;
  const miScore = esLocal ? juego.carreras_local : juego.carreras_visitante;
  const rivalScore = esLocal ? juego.carreras_visitante : juego.carreras_local;

  if (juego.estado === 'jugado') {
    const gane = miScore > rivalScore;
    return { texto: `${miScore}-${rivalScore}`, clase: gane ? 'matriz__celda--gana' : 'matriz__celda--pierde' };
  }
  if (SUFIJOS[juego.estado]) {
    const gane = juego.equipo_ganador_id === fila.id;
    return {
      texto: `${gane ? 'G' : 'P'}-${SUFIJOS[juego.estado]}`,
      clase: gane ? 'matriz__celda--gana' : 'matriz__celda--pierde',
    };
  }
  if (juego.estado === 'suspendido') return { texto: juego.observacion ? `Susp. (${juego.observacion})` : 'Susp.', clase: '' };
  if (juego.estado === 'pospuesto') return { texto: 'Pospuesto', clase: '' };
  return { texto: 'Prog.', clase: '' }; // programado (o "Observ" — confirmar significado exacto)
}

export default function JuegosPorEquipoPage() {
  const [temporadaCategoriaId, setTemporadaCategoriaId] = useState(null);
  const [equipos, setEquipos] = useState([]);
  const [juegos, setJuegos] = useState([]);
  const [cargando, setCargando] = useState(false);

  function alCambiarCategoria(id) {
    setTemporadaCategoriaId(id);
  }

  useEffect(() => {
    if (!temporadaCategoriaId) return;
    setCargando(true);
    Promise.all([
      api.get(`/equipos/inscritos?temporada_categoria_id=${temporadaCategoriaId}`),
      api.get(`/juegos?temporada_categoria_id=${temporadaCategoriaId}`),
    ]).then(([e, j]) => { setEquipos(e); setJuegos(j); }).finally(() => setCargando(false));
  }, [temporadaCategoriaId]);

  // Agrupa los equipos por su campo `grupo` (A, B, C... o "Sin grupo")
  const grupos = {};
  for (const e of equipos) {
    const g = e.grupo || 'Sin grupo';
    if (!grupos[g]) grupos[g] = [];
    grupos[g].push(e);
  }

  return (
    <div>
      <Marcador onCambiarCategoria={alCambiarCategoria} />

      <main className="contenedor" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 28, marginBottom: 'var(--space-5)' }}>Juegos por equipo</h1>

        {cargando && <div className="vacio">Cargando…</div>}
        {!cargando && equipos.length === 0 && <div className="vacio">No hay equipos inscritos en esta categoría.</div>}

        {!cargando && Object.entries(grupos).map(([nombreGrupo, equiposGrupo]) => (
          <section key={nombreGrupo} className="inicio-seccion">
            <div className="inicio-seccion__titulo"><h2>Grupo {nombreGrupo}</h2></div>
            <div style={{ overflowX: 'auto' }}>
              <table className="tabla matriz">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}></th>
                    {equiposGrupo.map((c) => (
                      <th key={c.id} style={{ minWidth: 90 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <TeamBadge nombre={c.nombre} logoUrl={c.logo_url} tamano={22} />
                          <span style={{ fontSize: 10 }}>{c.nombre}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {equiposGrupo.map((fila) => (
                    <tr key={fila.id}>
                      <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TeamBadge nombre={fila.nombre} logoUrl={fila.logo_url} tamano={22} />
                        {fila.nombre}
                      </td>
                      {equiposGrupo.map((columna) => {
                        if (columna.id === fila.id) return <td key={columna.id} className="matriz__celda--propia" />;
                        const { texto, clase } = celda(fila, columna, juegos);
                        return <td key={columna.id} className={clase}>{texto}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
