import { useEffect, useState } from 'react';
import { Marcador } from '../../../components/Marcador';
import { api } from '../../../api/client';
import { useToast } from '../../../components/Toast';
import { exportarFichasEquipoPDF } from '../../../utils/exportarPDF';

export default function FichasEquiposPage() {
  const { notificar } = useToast();
  const [temporadaCategoriaId, setTemporadaCategoriaId] = useState(null);
  const [categoria, setCategoria] = useState(null);
  const [temporadaNombre, setTemporadaNombre] = useState('');
  const [inscritos, setInscritos] = useState([]);
  const [equipoInscritoId, setEquipoInscritoId] = useState(null);
  const [roster, setRoster] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [descargando, setDescargando] = useState(false);

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

  function cargarRoster() {
    if (!equipoInscritoId) return;
    setCargando(true);
    api.get(`/jugadores/roster?equipo_inscrito_id=${equipoInscritoId}`)
      .then(setRoster)
      .finally(() => setCargando(false));
  }

  useEffect(() => { cargarRoster(); }, [equipoInscritoId]); // eslint-disable-line

  async function descargarPDF() {
    if (!equipoInscritoId) return;
    setDescargando(true);
    try {
      const equipoActual = inscritos.find((e) => e.id === equipoInscritoId);
      await exportarFichasEquipoPDF({
        equipo: equipoActual?.nombre,
        categoria: categoria?.categoria_nombre,
        temporadaNombre,
        roster,
      });
    } catch (err) {
      notificar(err.message || 'No se pudo generar el PDF', 'error');
    } finally {
      setDescargando(false);
    }
  }

  const rosterOrdenado = [...roster].sort((a, b) => (a.numero_camiseta ?? 999) - (b.numero_camiseta ?? 999));

  return (
    <div>
      <Marcador onCambiarCategoria={alCambiarCategoria} />
      <main className="contenedor" style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 28, marginBottom: 'var(--space-4)' }}>Fichas de Equipos</h1>

        <div className="tarjeta-lista" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="campo">
              <label>Torneo</label>
              <input value={temporadaNombre} disabled style={{ minWidth: 160 }} />
            </div>
            <div className="campo">
              <label>Equipo</label>
              <select value={equipoInscritoId ?? ''} onChange={(e) => setEquipoInscritoId(Number(e.target.value))} style={{ minWidth: 160 }}>
                {inscritos.length === 0 && <option value="">Sin equipos</option>}
                {inscritos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
            <div className="campo">
              <label>Categoría</label>
              <input value={categoria?.categoria_nombre || ''} disabled style={{ minWidth: 160 }} />
            </div>
            <button className="boton boton--primario" onClick={cargarRoster} disabled={cargando}>
              {cargando ? 'Cargando…' : 'Generar Vista Previa'}
            </button>
            <button className="boton" style={{ background: '#c0392b', color: '#fff' }} onClick={descargarPDF} disabled={descargando || roster.length === 0}>
              {descargando ? 'Generando…' : 'Descargar PDF'}
            </button>
          </div>
        </div>

        {cargando && <div className="vacio">Cargando…</div>}
        {!cargando && roster.length === 0 && <div className="vacio">Sin jugadores en este equipo.</div>}

        {!cargando && roster.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
            {rosterOrdenado.map((r) => (
              <div key={r.id} className="tarjeta-lista" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                {r.foto_url ? (
                  <img
                    src={r.foto_url}
                    alt={`${r.nombres} ${r.apellidos}`}
                    style={{ width: 96, height: 96, borderRadius: 8, objectFit: 'cover', margin: '0 auto var(--space-3)' }}
                  />
                ) : (
                  <div style={{
                    width: 96, height: 96, borderRadius: 8, background: 'var(--color-fondo-suave, #f1f2f6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-3)',
                  }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b7bac2" strokeWidth="1.5">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                    </svg>
                  </div>
                )}
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--blue-txt)', fontSize: 12, marginBottom: 2 }}>
                  Jugador
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
                  {r.nombres} {r.apellidos}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-ink-soft)' }}>Num Uniforme</div>
                <div style={{ fontWeight: 700, fontSize: 20, color: '#c0392b' }}>
                  {r.numero_camiseta ?? '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}