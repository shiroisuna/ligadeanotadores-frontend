import { useEffect, useMemo, useState } from 'react';
import { Marcador } from '../../../components/Marcador';
import { TeamBadge } from '../../../components/TeamBadge';
import { api } from '../../../api/client';

export default function ResultadosPage() {
  const [temporadaCategoriaId, setTemporadaCategoriaId] = useState(null);
  const [juegos, setJuegos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [fecha, setFecha] = useState('');

  function alCambiarCategoria(id) {
    setTemporadaCategoriaId(id);
  }

  useEffect(() => {
    if (!temporadaCategoriaId) return;
    setCargando(true);
    api.get(`/juegos?temporada_categoria_id=${temporadaCategoriaId}&estado=jugado`)
      .then(setJuegos)
      .finally(() => setCargando(false));
  }, [temporadaCategoriaId]);

  const filtrados = useMemo(
    () => (fecha ? juegos.filter((j) => j.fecha === fecha) : juegos),
    [juegos, fecha]
  );

  return (
    <div>
      <Marcador onCambiarCategoria={alCambiarCategoria} />

      <main className="contenedor" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
        <div className="admin__cabecera">
          <h1 style={{ fontSize: 28 }}>Resultados recientes</h1>
          <div className="campo">
            <label>Filtrar por fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
        </div>

        {cargando && <div className="vacio">Cargando…</div>}

        {!cargando && filtrados.length === 0 && (
          <div className="vacio">No hay juegos jugados que coincidan con el filtro.</div>
        )}

        {!cargando && filtrados.length > 0 && (
          <div className="resultados-feed">
            {filtrados.map((j) => {
              const localGana = j.carreras_local > j.carreras_visitante;
              const visitanteGana = j.carreras_visitante > j.carreras_local;
              return (
                <div key={j.id} className="tarjeta-resultado">
                  <div className="tarjeta-resultado__meta">
                    {new Date(j.fecha + 'T00:00:00').toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}
                    {j.hora ? ` · ${j.hora.slice(0, 5)}` : ''}
                    {j.estadio ? ` · ${j.estadio}` : ''}
                  </div>

                  <div className={`tarjeta-resultado__fila ${localGana ? 'tarjeta-resultado__fila--gana' : ''}`}>
                    <TeamBadge nombre={j.equipo_local} logoUrl={j.logo_local} />
                    <span className="tarjeta-resultado__equipo">{j.equipo_local}</span>
                    <span className="tarjeta-resultado__carreras cifra">{j.carreras_local}</span>
                  </div>
                  <div className={`tarjeta-resultado__fila ${visitanteGana ? 'tarjeta-resultado__fila--gana' : ''}`}>
                    <TeamBadge nombre={j.equipo_visitante} logoUrl={j.logo_visitante} />
                    <span className="tarjeta-resultado__equipo">{j.equipo_visitante}</span>
                    <span className="tarjeta-resultado__carreras cifra">{j.carreras_visitante}</span>
                  </div>

                  {(j.hits_local != null || j.errores_local != null) && (
                    <div className="tarjeta-resultado__che cifra">
                      H {j.hits_local ?? '—'}/{j.hits_visitante ?? '—'} &nbsp;·&nbsp; E {j.errores_local ?? '—'}/{j.errores_visitante ?? '—'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
