import { useEffect, useState } from 'react';
import { Marcador } from '../../../components/Marcador';
import { TeamBadge } from '../../../components/TeamBadge';
import { usePlayerModal } from '../../../components/PlayerModalProvider';
import { api } from '../../../api/client';

const POSICIONES = [
  ['P', 'LANZADOR'], ['C', 'RECEPTOR'], ['1B', '1RA BASE'], ['2B', '2DA BASE'],
  ['3B', '3RA BASE'], ['SS', 'CAMPO CORTO'], ['LF', 'JARDINERO IZQUIERDO'],
  ['CF', 'JARDINERO CENTRAL'], ['RF', 'JARDINERO DERECHO'], ['DH', 'BATEADOR DESIGNADO'],
];

export default function OfensivaPage() {
  const { abrirJugador } = usePlayerModal();
  const [temporadaCategoriaId, setTemporadaCategoriaId] = useState(null);
  const [categoria, setCategoria] = useState(null);
  const [porPosicion, setPorPosicion] = useState({});
  const [cargando, setCargando] = useState(false);

  function alCambiarCategoria(id, cat) {
    setTemporadaCategoriaId(id);
    setCategoria(cat);
  }

  useEffect(() => {
    if (!temporadaCategoriaId) return;
    setCargando(true);
    Promise.all(
      POSICIONES.map(([clave]) =>
        api.get(`/lideres/bateo?temporada_categoria_id=${temporadaCategoriaId}&stat=promedio_bateo&posicion=${clave}&limit=10`)
          .then((data) => [clave, data])
      )
    ).then((resultados) => {
      setPorPosicion(Object.fromEntries(resultados));
    }).finally(() => setCargando(false));
  }, [temporadaCategoriaId]);

  return (
    <div>
      <Marcador onCambiarCategoria={alCambiarCategoria} />

      <main className="contenedor" style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-8)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
          <h1 style={{ fontSize: 32 }}>Mejores a la Ofensiva</h1>
          <p style={{ color: 'var(--color-ink-soft)', fontFamily: 'var(--font-body)' }}>
            Top 10 por posición{categoria?.categoria_nombre ? ` — ${categoria.categoria_nombre}` : ''}
          </p>
        </div>

        {cargando && <div className="vacio">Cargando…</div>}

        {!cargando && POSICIONES.map(([clave, etiqueta]) => {
          const jugadores = porPosicion[clave] || [];
          if (jugadores.length === 0) return null;
          return (
            <div key={clave} className="tarjeta-lista" style={{ marginBottom: 'var(--space-5)' }}>
              <div className="tarjeta-lista__cabecera"><h3>{etiqueta}</h3></div>
              <div style={{ overflowX: 'auto' }}>
                <table className="tabla">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Equipo</th>
                      <th style={{ textAlign: 'left' }}>Jugador</th>
                      <th>JJ</th><th>VB</th><th>H</th><th>2B</th><th>3B</th><th>HR</th>
                      <th>CA</th><th>CI</th><th>BR</th><th>AVE</th><th>SLG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jugadores.map((j) => (
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
                        <td>{j.juegos_jugados}</td><td>{j.vb}</td><td>{j.hits}</td>
                        <td>{j.dobles}</td><td>{j.triples}</td><td>{j.jonrones}</td>
                        <td>{j.carreras_anotadas}</td><td>{j.carreras_impulsadas}</td>
                        <td>{j.bases_robadas}</td>
                        <td style={{ fontWeight: 700 }}>{j.promedio_bateo}</td>
                        <td>{j.slugging}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}