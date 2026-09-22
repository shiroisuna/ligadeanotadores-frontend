import { useEffect, useState } from 'react';
import { Marcador } from '../../../components/Marcador';
import { api } from '../../../api/client';
import { useToast } from '../../../components/Toast';
import { exportarIncidenciasPDF, exportarIncidenciasRangoPDF } from '../../../utils/exportarPDF';

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function IncidenciasPublicaPage() {
  const { notificar } = useToast();
  const [temporadaCategoriaId, setTemporadaCategoriaId] = useState(null);
  const [categoria, setCategoria] = useState(null);
  const [modo, setModo] = useState('rango'); // 'rango' | 'juego'

  const [fechaInicio, setFechaInicio] = useState(hoyISO());
  const [fechaFin, setFechaFin] = useState(hoyISO());

  const [juegos, setJuegos] = useState([]);
  const [juegoId, setJuegoId] = useState('');

  const [generando, setGenerando] = useState(false);

  function alCambiarCategoria(id, cat) {
    setTemporadaCategoriaId(id);
    setCategoria(cat);
  }

  useEffect(() => {
    if (!temporadaCategoriaId) return;
    api.get(`/juegos?temporada_categoria_id=${temporadaCategoriaId}&estado=jugado`)
      .then((data) => {
        const ordenados = data.sort((a, b) => b.fecha.localeCompare(a.fecha));
        setJuegos(ordenados);
        setJuegoId(ordenados[0]?.id ?? '');
      });
  }, [temporadaCategoriaId]);

  async function generar() {
    if (!temporadaCategoriaId) return;
    setGenerando(true);
    try {
      if (modo === 'rango') {
        if (!fechaInicio || !fechaFin) {
          notificar('Selecciona ambas fechas', 'error');
          return;
        }
        const incidencias = await api.get(
          `/incidencias?temporada_categoria_id=${temporadaCategoriaId}&fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`
        );
        await exportarIncidenciasRangoPDF({
          categoria: categoria?.categoria_nombre,
          fechaInicio, fechaFin,
          incidencias,
        });
      } else {
        if (!juegoId) {
          notificar('Selecciona un juego', 'error');
          return;
        }
        const juego = juegos.find((j) => j.id === Number(juegoId));
        const incidencias = await api.get(`/incidencias/${juegoId}`);
        await exportarIncidenciasPDF({ juego, incidencias });
      }
      notificar('Reporte generado', 'exito');
    } catch (err) {
      notificar(err.message || 'No se pudo generar el reporte', 'error');
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div>
      <Marcador onCambiarCategoria={alCambiarCategoria} />
      <main className="contenedor" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <h1 style={{ fontSize: 30 }}>Reporte de Incidencias</h1>
          <p style={{ color: 'var(--color-ink-soft)', fontFamily: 'var(--font-body)' }}>
            Genera un PDF con las incidencias registradas — por periodo o por juego específico
          </p>
        </div>

        <div className="tarjeta-lista" style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-4)' }}>
            <button
              onClick={() => setModo('rango')}
              className={`boton boton--chico ${modo === 'rango' ? 'boton--dorado' : 'boton--fantasma'}`}
              style={{ flex: 1 }}
            >
              Por rango de fechas
            </button>
            <button
              onClick={() => setModo('juego')}
              className={`boton boton--chico ${modo === 'juego' ? 'boton--dorado' : 'boton--fantasma'}`}
              style={{ flex: 1 }}
            >
              Por juego específico
            </button>
          </div>

          {modo === 'rango' && (
            <div className="campo--fila" style={{ marginBottom: 'var(--space-4)' }}>
              <div className="campo">
                <label>Desde</label>
                <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
              </div>
              <div className="campo">
                <label>Hasta</label>
                <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
              </div>
            </div>
          )}

          {modo === 'juego' && (
            <div className="campo" style={{ marginBottom: 'var(--space-4)' }}>
              <label>Juego</label>
              <select value={juegoId} onChange={(e) => setJuegoId(e.target.value)}>
                {juegos.length === 0 && <option value="">Sin juegos jugados</option>}
                {juegos.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.fecha} — {j.equipo_local} vs {j.equipo_visitante}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            className="boton boton--dorado"
            style={{ width: '100%', padding: '14px', fontSize: 15 }}
            onClick={generar}
            disabled={generando || !temporadaCategoriaId}
          >
            {generando ? 'Generando…' : 'Generar Reporte PDF'}
          </button>
        </div>
      </main>
    </div>
  );
}