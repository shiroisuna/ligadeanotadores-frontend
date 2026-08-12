import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Marcador } from '../../../components/Marcador';
import { usePlayerModal } from '../../../components/PlayerModalProvider';
import { Carrusel } from '../../../components/Carrusel';
import { TeamBadge } from '../../../components/TeamBadge';
import { api } from '../../../api/client';

export default function InicioPage() {
  const { abrirJugador } = usePlayerModal();
  const [temporadaCategoriaId, setTemporadaCategoriaId] = useState(null);
  const [categoria, setCategoria] = useState(null);

  const [fotos, setFotos] = useState([]);
  const [honor, setHonor] = useState(null);
  const [lanzadores, setLanzadores] = useState([]);
  const [lideresPorEquipo, setLideresPorEquipo] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/fotos').then(setFotos).catch(() => setFotos([]));
  }, []);

  function alCambiarCategoria(id, cat) {
    setTemporadaCategoriaId(id);
    setCategoria(cat);
  }

  useEffect(() => {
    if (!temporadaCategoriaId) return;
    setCargando(true);

    const tareas = [
      api.get(`/cuadro-honor?temporada_categoria_id=${temporadaCategoriaId}`).then(setHonor),
      api.get(`/equipos/inscritos?temporada_categoria_id=${temporadaCategoriaId}`).then(async (inscritos) => {
        const porEquipo = await Promise.all(
          inscritos.map(async (e) => {
            const r = await api.get(`/lideres/equipo/${e.id}?temporada_categoria_id=${temporadaCategoriaId}`);
            return r.bateo[0] ? { equipo: e.nombre, ...r.bateo[0] } : null;
          })
        );
        setLideresPorEquipo(porEquipo.filter(Boolean));
      }),
    ];

    if (categoria?.lleva_pitcheo) {
      tareas.push(api.get(`/lideres/pitcheo?temporada_categoria_id=${temporadaCategoriaId}&stat=efectividad&limit=3`).then(setLanzadores));
    } else {
      setLanzadores([]);
    }

    Promise.all(tareas).finally(() => setCargando(false));
  }, [temporadaCategoriaId, categoria]);

  return (
    <div>
      <Marcador onCambiarCategoria={alCambiarCategoria} />

      <main className="contenedor" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
        {fotos.length > 0 ? (
          <Carrusel fotos={fotos} />
        ) : (
          <div className="vacio" style={{ background: '#fff', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-md)' }}>
            Todavía no hay fotos cargadas en la galería.
          </div>
        )}

        {/* ---- Cuadro de honor ---- */}
        <section className="inicio-seccion">
          <div className="inicio-seccion__titulo">
            <h2>Cuadro de honor</h2>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-ink-soft)' }}>
              {categoria?.categoria_nombre}
            </span>
          </div>

          {cargando && <div className="vacio">Cargando…</div>}

          {!cargando && honor && (
            <div className="tarjetas-inicio">
              {Object.entries(honor.bateo).map(([stat, jugador]) => jugador && (
                <button key={stat} onClick={() => abrirJugador(jugador.roster_id)} className="tarjeta-inicio tarjeta-inicio--boton">
                  <div className="tarjeta-inicio__etiqueta">{ETIQUETAS[stat] || stat}</div>
                  <div className="tarjeta-inicio__cuerpo">
                    <TeamBadge nombre={jugador.equipo} logoUrl={jugador.logo_url} tamano={32} />
                    <div>
                      <div className="tarjeta-inicio__nombre">{jugador.nombres} {jugador.apellidos}</div>
                      <div className="tarjeta-inicio__valor">{jugador[stat]}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ---- Mejores lanzadores ---- */}
        {categoria?.lleva_pitcheo && (
          <section className="inicio-seccion">
            <div className="inicio-seccion__titulo">
              <h2>Mejores lanzadores</h2>
              <Link to="/lideres">Ver todos →</Link>
            </div>
            {!cargando && lanzadores.length === 0 && <div className="vacio">Sin estadística de pitcheo todavía.</div>}
            <div className="tarjetas-inicio">
              {lanzadores.map((p) => (
                <button key={p.roster_id} onClick={() => abrirJugador(p.roster_id)} className="tarjeta-inicio tarjeta-inicio--boton">
                  <div className="tarjeta-inicio__etiqueta">Efectividad</div>
                  <div className="tarjeta-inicio__cuerpo">
                    <TeamBadge nombre={p.equipo} logoUrl={p.logo_url} tamano={32} />
                    <div>
                      <div className="tarjeta-inicio__nombre">{p.nombres} {p.apellidos}</div>
                      <div className="tarjeta-inicio__valor">{p.efectividad} EFE</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ---- Líderes por equipo ---- */}
        <section className="inicio-seccion">
          <div className="inicio-seccion__titulo">
            <h2>Líder de bateo por equipo</h2>
            <Link to="/estadisticas-equipo">Ver por equipo →</Link>
          </div>
          {!cargando && lideresPorEquipo.length === 0 && <div className="vacio">Sin equipos con estadística todavía.</div>}
          <div className="tarjetas-inicio">
            {lideresPorEquipo.map((j) => (
              <button key={j.roster_id} onClick={() => abrirJugador(j.roster_id)} className="tarjeta-inicio tarjeta-inicio--boton">
                <div className="tarjeta-inicio__etiqueta">{j.equipo}</div>
                <div className="tarjeta-inicio__cuerpo">
                  <TeamBadge nombre={j.equipo} logoUrl={j.logo_url} tamano={32} />
                  <div>
                    <div className="tarjeta-inicio__nombre">{j.nombres} {j.apellidos}</div>
                    <div className="tarjeta-inicio__valor">{j.promedio_bateo} AVE</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

const ETIQUETAS = {
  promedio_bateo: 'Mejor promedio',
  carreras_impulsadas: 'Más impulsadas',
  carreras_anotadas: 'Más anotadas',
  bases_robadas: 'Más bases robadas',
  slugging: 'Mejor slugging',
  hits: 'Más hits',
  dobles: 'Más dobles',
  triples: 'Más triples',
  jonrones: 'Más jonrones',
};
