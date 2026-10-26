import { useEffect, useState } from 'react';
import { Marcador } from '../../../components/Marcador';
import { TeamBadge } from '../../../components/TeamBadge';
import { Carrusel } from '../../../components/Carrusel';
import { usePlayerModal } from '../../../components/PlayerModalProvider';
import { api } from '../../../api/client';


export default function InicioPage() {
  const { abrirJugador } = usePlayerModal();
  const [temporadaCategoriaId, setTemporadaCategoriaId] = useState(null);
  const [categoria, setCategoria] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [posiciones, setPosiciones] = useState([]);
  const [lideresBateo, setLideresBateo] = useState([]);
  const [proximos, setProximos] = useState([]);
  const [cargando, setCargando] = useState(false);

  function alCambiarCategoria(id, cat) {
    setTemporadaCategoriaId(id);
    setCategoria(cat);
  }

  useEffect(() => {
    api.get('/fotos').then(setFotos).catch(() => {});
  }, []);

  useEffect(() => {
    if (!temporadaCategoriaId) return;
    setCargando(true);
    Promise.all([
      api.get(`/posiciones?temporada_categoria_id=${temporadaCategoriaId}`),
      api.get(`/lideres/bateo?temporada_categoria_id=${temporadaCategoriaId}&stat=promedio_bateo&limit=5`),
      api.get(`/juegos?temporada_categoria_id=${temporadaCategoriaId}&estado=programado`),
    ]).then(([pos, bateo, juegos]) => {
      setPosiciones(pos);
      setLideresBateo(bateo);
      setProximos(juegos.slice(0, 4));
    }).finally(() => setCargando(false));
  }, [temporadaCategoriaId]);

  const copa = categoria?.copa_nombre;

  return (
    <div>
      <Marcador onCambiarCategoria={alCambiarCategoria} />

      <main className="contenedor" style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-8)' }}>

        {/* Carrusel de fotos */}
        {fotos.length > 0 && (
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <Carrusel fotos={fotos} />
          </div>
        )}

        {/* Banner de copa */}
        {copa && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'linear-gradient(90deg, var(--blue-soft), var(--amber-bg))',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-5)',
          }}>
            <span style={{ fontWeight: 700 }}>🏆 {copa}</span>
            <span style={{ fontSize: 13, color: 'var(--txt-3)' }}>{categoria?.categoria_nombre}</span>
          </div>
        )}

        {/* Grid 2 columnas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--space-5)',
        }}>
          {/* Columna izquierda: posiciones + próxima jornada */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

            {/* Tabla de posiciones compacta */}
            <div className="tarjeta-lista">
              <div className="tarjeta-lista__cabecera">
                <h3>Tabla de posiciones</h3>
                {categoria?.categoria_nombre && (
                  <span style={{ fontSize: 12, color: 'var(--txt-3)' }}>{categoria.categoria_nombre}</span>
                )}
              </div>
              {cargando && <div className="vacio">Cargando…</div>}
              {!cargando && posiciones.length === 0 && (
                <div className="vacio">Sin juegos registrados todavía.</div>
              )}
              {!cargando && posiciones.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table className="tabla">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th style={{ textAlign: 'left' }}>Equipo</th>
                        <th>JJ</th><th>JG</th><th>JP</th>
                        <th>PTOS</th><th>AVE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {posiciones.map((f, i) => (
                        <tr key={f.equipo_inscrito_id}>
                          <td style={{ color: i < 2 ? 'var(--color-amber)' : 'var(--txt-3)' }}>{i + 1}</td>
                          <td>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}>
                              <TeamBadge nombre={f.equipo} logoUrl={f.logo_url} tamano={22} />
                              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>{f.equipo}</span>
                            </span>
                          </td>
                          <td>{f.jj}</td>
                          <td style={{ color: 'var(--color-win)', fontWeight: 600 }}>{f.jg}</td>
                          <td style={{ color: 'var(--color-loss)', fontWeight: 600 }}>{f.jp}</td>
                          <td style={{ color: 'var(--blue-txt)', fontWeight: 700 }}>{f.ptos}</td>
                          <td>{f.ave}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Próxima jornada */}
            {proximos.length > 0 && (
              <div className="tarjeta-lista">
                <div className="tarjeta-lista__cabecera">
                  <h3>Próxima jornada</h3>
                </div>
                {proximos.map((j) => (
                  <div key={j.id} className="item-lista" style={{ cursor: 'default', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {j.fecha} {j.hora ? `· ${j.hora.slice(0, 5)}` : ''} {j.estadio ? `· ${j.estadio}` : ''}
                    </span>
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                      {j.equipo_local} vs {j.equipo_visitante}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Columna derecha: líderes */}
          <div>
            <div className="tarjeta-lista">
              <div className="tarjeta-lista__cabecera">
                <h3>🏅 Líderes individuales</h3>
              </div>
              {cargando && <div className="vacio">Cargando…</div>}
              {!cargando && lideresBateo.length === 0 && (
                <div className="vacio">Sin estadística todavía.</div>
              )}
              {!cargando && lideresBateo.length > 0 && (
                <div style={{ padding: 'var(--space-3)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-field)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    Promedio de bateo (AVE)
                  </div>
                  {lideresBateo.map((j, i) => (
                    <button
                      key={j.roster_id}
                      onClick={() => abrirJugador(j.roster_id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        width: '100%', background: 'var(--bg-3)',
                        border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                        padding: '8px 10px', marginBottom: 6, textAlign: 'left',
                        cursor: 'pointer', transition: 'background 100ms',
                      }}
                    >
                      <span style={{ fontSize: 11, color: 'var(--txt-4)', width: 16 }}>{i + 1}.</span>
                      <TeamBadge nombre={j.equipo} logoUrl={j.logo_url} tamano={22} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt-2)' }}>
                          {j.nombres} {j.apellidos}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--txt-4)' }}>{j.equipo}</div>
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-amber)' }}>
                        {j.promedio_bateo}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
