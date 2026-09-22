import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../api/client';
import { useTemporadaCategoria } from '../../../hooks/useTemporadaCategoria';

export default function IncidenciasListaPage() {
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
      .then((data) => setJuegos(data.sort((a, b) => b.fecha.localeCompare(a.fecha))))
      .finally(() => setCargando(false));
  }, [temporadaCategoriaId]);

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Incidencias</h1>
          <p>Selecciona un juego para registrar o revisar sanciones, protestas y novedades.</p>
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
      {!cargando && juegos.length === 0 && <div className="vacio">No hay juegos en esta categoría.</div>}

      {!cargando && juegos.length > 0 && (
        <table className="tabla" style={{ background: '#fff' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Fecha</th>
              <th style={{ textAlign: 'left' }}>Local</th>
              <th style={{ textAlign: 'left' }}>Visitante</th>
              <th style={{ textAlign: 'left' }}>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {juegos.map((j) => (
              <tr key={j.id}>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{j.fecha}</td>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{j.equipo_local}</td>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{j.equipo_visitante}</td>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)', fontSize: 12 }}>{j.estado}</td>
                <td>
                  <Link className="boton boton--primario boton--chico" to={`/admin/incidencias/${j.id}`}>
                    Incidencias
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