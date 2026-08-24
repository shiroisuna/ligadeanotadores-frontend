import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../api/client';
import { useAuth } from '../../../auth/AuthContext';
import { useTemporadaCategoria } from '../../../hooks/useTemporadaCategoria';

export default function EstadisticasListaPage() {
  const { usuario } = useAuth();
  const esAnotador = usuario?.rol === 'anotador';

  const {
    temporadas, categorias,
    temporadaId, setTemporadaId,
    temporadaCategoriaId, setTemporadaCategoriaId,
  } = useTemporadaCategoria();

  const [juegos, setJuegos] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!temporadaCategoriaId) return;
    setCargando(true);
    api.get(`/juegos?temporada_categoria_id=${temporadaCategoriaId}`)
      .then((data) => {
        // El anotador solo ve los juegos donde él está asignado
        const filtrados = esAnotador
          ? data.filter((j) => j.anotador_id === usuario.id)
          : data;
        setJuegos(filtrados.sort((a, b) => b.fecha.localeCompare(a.fecha)));
      })
      .finally(() => setCargando(false));
  }, [temporadaCategoriaId]); // eslint-disable-line

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Estadísticas por juego</h1>
          <p>
            {esAnotador
              ? 'Juegos que tienes asignados para anotar.'
              : 'Selecciona un juego para cargar o editar sus estadísticas de bateo, pitcheo y fildeo.'}
          </p>
        </div>
        <div className="campo--fila">
          <div className="campo">
            <label>Temporada</label>
            <select value={temporadaId} onChange={(e) => setTemporadaId(e.target.value)}>
              {temporadas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
          <div className="campo">
            <label>Categoría</label>
            <select value={temporadaCategoriaId} onChange={(e) => setTemporadaCategoriaId(e.target.value)}>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.categoria_nombre}</option>)}
            </select>
          </div>
        </div>
      </div>

      {cargando && <div className="vacio">Cargando…</div>}
      {!cargando && juegos.length === 0 && (
        <div className="vacio">
          {esAnotador
            ? 'No tienes juegos asignados en esta categoría todavía.'
            : 'No hay juegos en esta categoría.'}
        </div>
      )}

      {!cargando && juegos.length > 0 && (
        <table className="tabla" style={{ background: '#fff' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Fecha</th>
              <th style={{ textAlign: 'left' }}>Local</th>
              <th style={{ textAlign: 'left' }}>Visitante</th>
              <th>Marcador</th>
              <th style={{ textAlign: 'left' }}>Estado</th>
              <th>Bateo</th>
              <th>Pitcheo</th>
              <th>Fildeo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {juegos.map((j) => (
              <tr key={j.id}>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                  {j.fecha} {j.hora ? j.hora.slice(0, 5) : ''}
                </td>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{j.equipo_local}</td>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{j.equipo_visitante}</td>
                <td>{j.carreras_local ?? '—'} - {j.carreras_visitante ?? '—'}</td>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)', fontSize: 12 }}>{j.estado}</td>
                <td>
                  <EstadoBadge juego_id={j.id} tipo="bateo" />
                </td>
                <td>
                  <EstadoBadge juego_id={j.id} tipo="pitcheo" />
                </td>
                <td>
                  <EstadoBadge juego_id={j.id} tipo="fildeo" />
                </td>
                <td>
                  <Link
                    className="boton boton--primario boton--chico"
                    to={`/admin/estadisticas/${j.id}`}
                  >
                    Cargar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// Indicador visual de si ya hay datos cargados para este tipo en el juego
function EstadoBadge({ juego_id, tipo }) {
  const [tiene, setTiene] = useState(null);

  useEffect(() => {
    api.get(`/estadisticas/${juego_id}`).then((data) => {
      setTiene(data[tipo]?.length > 0);
    }).catch(() => setTiene(false));
  }, [juego_id, tipo]);

  if (tiene === null) return <span style={{ color: 'var(--color-ink-soft)', fontSize: 11 }}>…</span>;
  return (
    <span style={{
      fontSize: 11,
      fontFamily: 'var(--font-display)',
      letterSpacing: '0.04em',
      color: tiene ? 'var(--color-win)' : 'var(--color-ink-soft)',
    }}>
      {tiene ? '✓' : '—'}
    </span>
  );
}
