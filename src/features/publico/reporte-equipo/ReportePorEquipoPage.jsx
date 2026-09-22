import { useEffect, useState } from 'react';
import { Marcador } from '../../../components/Marcador';
import { api } from '../../../api/client';
import { useToast } from '../../../components/Toast';
import { exportarReporteEquipoPDF } from '../../../utils/exportarPDF';

export default function ReportePorEquipoPage() {
  const { notificar } = useToast();
  const [temporadaCategoriaId, setTemporadaCategoriaId] = useState(null);
  const [categoria, setCategoria] = useState(null);
  const [temporadaNombre, setTemporadaNombre] = useState('');
  const [inscritos, setInscritos] = useState([]);
  const [equipoInscritoId, setEquipoInscritoId] = useState(null);
  const [generando, setGenerando] = useState(false);

  function alCambiarCategoria(id, cat) {
    setTemporadaCategoriaId(id);
    setCategoria(cat);
  }

  useEffect(() => {
    api.get('/temporadas').then((data) => {
      const activa = data.find((t) => t.activa) || data[0];
      if (activa) setTemporadaNombre(activa.nombre);
    });
  }, []);

  useEffect(() => {
    if (!temporadaCategoriaId) return;
    api.get(`/equipos/inscritos?temporada_categoria_id=${temporadaCategoriaId}`).then((data) => {
      setInscritos(data);
      setEquipoInscritoId(data[0]?.id ?? null);
    });
  }, [temporadaCategoriaId]);

  async function generar() {
    if (!temporadaCategoriaId || !equipoInscritoId) return;
    setGenerando(true);
    try {
      const equipoActual = inscritos.find((e) => e.id === equipoInscritoId);
      const [posiciones, stats] = await Promise.all([
        api.get(`/posiciones?temporada_categoria_id=${temporadaCategoriaId}`),
        api.get(`/lideres/equipo/${equipoInscritoId}?temporada_categoria_id=${temporadaCategoriaId}`),
      ]);
      await exportarReporteEquipoPDF({
        equipo: equipoActual?.nombre,
        categoria: categoria?.categoria_nombre,
        temporadaNombre,
        posiciones,
        bateo: stats.bateo,
        pitcheo: stats.pitcheo,
        fildeo: stats.fildeo,
        llevaPitcheo: !!categoria?.lleva_pitcheo,
      });
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
          <h1 style={{ fontSize: 30 }}>Reporte de Equipo</h1>
          <p style={{ color: 'var(--color-ink-soft)', fontFamily: 'var(--font-body)' }}>
            Genera un informe completo en PDF con estadísticas y standings
          </p>
        </div>

        <div className="tarjeta-lista" style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--space-5)' }}>
          <div className="campo" style={{ marginBottom: 'var(--space-4)' }}>
            <label>Equipo</label>
            <select value={equipoInscritoId ?? ''} onChange={(e) => setEquipoInscritoId(Number(e.target.value))}>
              {inscritos.length === 0 && <option value="">Sin equipos</option>}
              {inscritos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>

          <button
            className="boton boton--dorado"
            style={{ width: '100%', padding: '14px', fontSize: 15 }}
            onClick={generar}
            disabled={generando || !equipoInscritoId}
          >
            {generando ? 'Generando…' : 'Generar Reporte PDF'}
          </button>
        </div>
      </main>
    </div>
  );
}