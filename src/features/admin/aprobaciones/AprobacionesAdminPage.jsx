import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../api/client';
import { useToast } from '../../../components/Toast';

export default function AprobacionesAdminPage() {
  const { notificar } = useToast();
  const [juegos, setJuegos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [procesando, setProcesando] = useState({});

  const cargar = useCallback(() => {
    setCargando(true);
    api.getAuth('/aprobaciones/pendientes/juegos')
      .then(setJuegos)
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function aprobar(juego_id) {
    setProcesando((p) => ({ ...p, [juego_id]: true }));
    try {
      await api.post(`/aprobaciones/juegos/${juego_id}/aprobar`);
      notificar('Juego aprobado y publicado', 'exito');
      cargar();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setProcesando((p) => ({ ...p, [juego_id]: false }));
    }
  }

  async function rechazarResultado(juego_id) {
    if (!confirm('¿Rechazar el resultado? El juego vuelve a estado "programado".')) return;
    setProcesando((p) => ({ ...p, [juego_id]: 'r' }));
    try {
      await api.post(`/aprobaciones/juegos/${juego_id}/rechazar-resultado`);
      notificar('Resultado rechazado — el anotador debe volver a cargarlo', 'exito');
      cargar();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setProcesando((p) => ({ ...p, [juego_id]: false }));
    }
  }

  async function rechazarEstadisticas(juego_id) {
    if (!confirm('¿Rechazar las estadísticas? Se eliminarán los datos pendientes de este juego.')) return;
    setProcesando((p) => ({ ...p, [juego_id]: 're' }));
    try {
      await api.post(`/aprobaciones/juegos/${juego_id}/rechazar-estadisticas`);
      notificar('Estadísticas rechazadas', 'exito');
      cargar();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setProcesando((p) => ({ ...p, [juego_id]: false }));
    }
  }

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Aprobaciones pendientes</h1>
          <p>Revisa los resultados y estadísticas cargados por los anotadores antes de publicarlos.</p>
        </div>
        {juegos.length > 0 && (
          <span style={{
            background: '#dc2626', color: '#fff',
            borderRadius: 999, padding: '4px 12px',
            fontSize: 13, fontWeight: 700,
          }}>
            {juegos.length} pendiente{juegos.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {cargando && <div className="vacio">Cargando…</div>}

      {!cargando && juegos.length === 0 && (
        <div className="vacio" style={{ fontSize: 16 }}>
          ✅ No hay datos pendientes de aprobación.
        </div>
      )}

      {!cargando && juegos.map((j) => (
        <div key={j.id} className="tarjeta-lista" style={{ marginBottom: 'var(--space-4)' }}>
          {/* Cabecera del juego */}
          <div className="tarjeta-lista__cabecera">
            <div>
              <span style={{ fontWeight: 700 }}>
                {j.equipo_local} vs {j.equipo_visitante}
              </span>
              <span style={{ color: 'var(--color-ink-soft)', fontSize: 13, marginLeft: 12 }}>
                {j.fecha} · {j.categoria} · {j.temporada}
              </span>
            </div>
            {j.cargado_por && (
              <span style={{ fontSize: 12, color: 'var(--color-ink-soft)' }}>
                Cargado por: {j.cargado_por}
              </span>
            )}
          </div>

          {/* Resultado */}
          <div className="item-lista" style={{ cursor: 'default' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                Resultado: {j.carreras_local} - {j.carreras_visitante}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-ink-soft)', marginTop: 2 }}>
                Estado: {j.estado}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="boton boton--primario"
                onClick={() => aprobar(j.id)}
                disabled={!!procesando[j.id]}
              >
                {procesando[j.id] === true ? 'Aprobando…' : '✓ Aprobar todo'}
              </button>
              <button
                className="boton boton--fantasma"
                onClick={() => rechazarEstadisticas(j.id)}
                disabled={!!procesando[j.id]}
              >
                Rechazar estadísticas
              </button>
              <button
                className="boton boton--peligro"
                onClick={() => rechazarResultado(j.id)}
                disabled={!!procesando[j.id]}
              >
                Rechazar resultado
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}