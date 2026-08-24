import { useEffect, useState } from 'react';
import { useRama } from '../../../hooks/useRama';
import { TeamBadge } from '../../../components/TeamBadge';
import { Carrusel } from '../../../components/Carrusel';
import { usePlayerModal } from '../../../components/PlayerModalProvider';
import { api } from '../../../api/client';
import './InicioPage.css';

export default function InicioPage() {
  const { temporadaCategoriaId, categoria, categorias, rama } = useRama();
  const { abrirJugador } = usePlayerModal();
  const [fotos, setFotos] = useState([]);
  const [posiciones, setPosiciones] = useState([]);
  const [lideresBateo, setLideresBateo] = useState([]);
  const [lideresCI, setLideresCI] = useState([]);
  const [proximos, setProximos] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api.get('/fotos').then(setFotos).catch(() => {});
  }, []);

  useEffect(() => {
    if (!temporadaCategoriaId) return;
    setCargando(true);
    Promise.all([
      api.get(`/posiciones?temporada_categoria_id=${temporadaCategoriaId}`),
      api.get(`/lideres/bateo?temporada_categoria_id=${temporadaCategoriaId}&stat=promedio_bateo&limit=4`),
      api.get(`/lideres/bateo?temporada_categoria_id=${temporadaCategoriaId}&stat=carreras_impulsadas&limit=3`),
      api.get(`/juegos?temporada_categoria_id=${temporadaCategoriaId}&estado=programado`),
    ]).then(([pos, bateo, ci, juegos]) => {
      setPosiciones(pos);
      setLideresBateo(bateo);
      setLideresCI(ci);
      setProximos(juegos.slice(0, 4));
    }).finally(() => setCargando(false));
  }, [temporadaCategoriaId]);

  const copa = categoria?.copa_nombre;

  return (
    <main className="inicio contenedor">
      {/* Carrusel */}
      {fotos.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <Carrusel fotos={fotos} />
        </div>
      )}

      {/* Banner de copa */}
      {copa && (
        <div className="inicio__banner">
          <span className="inicio__copa-label">🏆 {copa}</span>
          <span className="inicio__categoria">{categoria?.categoria_nombre}</span>
        </div>
      )}

      {/* Grid 2 columnas */}
      <div className="inicio__grid">
        {/* ── Columna izquierda: Posiciones + Próxima jornada ── */}
        <div className="inicio__col-main">
          {/* Tabla de posiciones compacta */}
          <div className="card">
            <div className="card__hdr">
              <span className="card__titulo">Tabla de posiciones</span>
              {categoria?.categoria_nombre && (
                <span className="card__badge">{categoria.categoria_nombre}</span>
              )}
            </div>
            {cargando && <div className="vacio">Cargando…</div>}
            {!cargando && posiciones.length === 0 && (
              <div className="vacio">Sin juegos registrados todavía.</div>
            )}
            {!cargando && posiciones.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table className="tabla-oscura">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th style={{ textAlign: 'left' }}>Equipo</th>
                      <th>JJ</th><th>JG</th><th>JP</th>
                      <th>AVE</th><th>PTOS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posiciones.map((f, i) => (
                      <tr key={f.equipo_inscrito_id}>
                        <td className={i < 2 ? 'txt-amber' : 'txt-muted'}>{i + 1}</td>
                        <td>
                          <span className="equipo-cell">
                            <TeamBadge nombre={f.equipo} logoUrl={f.logo_url} tamano={22} />
                            <span>{f.equipo}</span>
                          </span>
                        </td>
                        <td>{f.jj}</td>
                        <td className="txt-green">{f.jg}</td>
                        <td className="txt-red">{f.jp}</td>
                        <td className="txt-blue">{f.ave}</td>
                        <td>{f.ptos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Próxima jornada */}
          <div className="card">
            <div className="card__hdr">
              <span className="card__titulo">Próxima jornada</span>
            </div>
            {proximos.length === 0 && <div className="vacio">No hay juegos programados.</div>}
            <div className="inicio__juegos">
              {proximos.map((j) => (
                <div key={j.id} className="inicio__juego">
                  <div className="inicio__juego-meta">{j.estadio || '—'} · {j.hora ? j.hora.slice(0,5) : '—'}</div>
                  <div className="inicio__juego-versus">
                    <span>{j.equipo_local}</span>
                    <span className="txt-muted">VS</span>
                    <span>{j.equipo_visitante}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Columna derecha: Líderes ── */}
        <div className="inicio__col-side">
          <div className="card">
            <div className="card__hdr">
              <span className="card__titulo">🏅 Líderes individuales</span>
            </div>

            <div style={{ padding: '0.75rem' }}>
              <h4 className="inicio__lideres-titulo">Promedio de bateo (AVE)</h4>
              {lideresBateo.map((j, i) => (
                <button
                  key={j.roster_id}
                  className="inicio__lider"
                  onClick={() => abrirJugador(j.roster_id)}
                >
                  <span className="inicio__lider-pos">{i + 1}.</span>
                  <div>
                    <div className="inicio__lider-nombre">{j.nombres} {j.apellidos}</div>
                    <div className="inicio__lider-equipo">{j.equipo}</div>
                  </div>
                  <span className="txt-amber inicio__lider-valor">{j.promedio_bateo}</span>
                </button>
              ))}

              <div style={{ borderTop: '1px solid var(--border)', margin: '0.75rem 0' }} />

              <h4 className="inicio__lideres-titulo">Carreras impulsadas (CI)</h4>
              {lideresCI.map((j, i) => (
                <button
                  key={j.roster_id}
                  className="inicio__lider"
                  onClick={() => abrirJugador(j.roster_id)}
                >
                  <span className="inicio__lider-pos">{i + 1}.</span>
                  <div>
                    <div className="inicio__lider-nombre">{j.nombres} {j.apellidos}</div>
                    <div className="inicio__lider-equipo">{j.equipo}</div>
                  </div>
                  <span className="txt-blue inicio__lider-valor">{j.carreras_impulsadas} CI</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
