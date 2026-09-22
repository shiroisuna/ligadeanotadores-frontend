import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../../api/client';
import { useToast } from '../../../components/Toast';

const TIPOS = [
  { value: 'sancion', label: 'Sanción' },
  { value: 'novedad', label: 'Novedad' },
  { value: 'protesta', label: 'Protesta' },
  { value: 'otro', label: 'Otro' },
];

const COLOR_TIPO = {
  sancion: '#dc2626', protesta: '#b45309', novedad: '#2563eb', otro: '#6b7280',
};

export default function IncidenciasCargaPage() {
  const { juegoId } = useParams();
  const { notificar } = useToast();

  const [juego, setJuego] = useState(null);
  const [roster, setRoster] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [tipo, setTipo] = useState('novedad');
  const [rosterId, setRosterId] = useState('');
  const [descripcion, setDescripcion] = useState('');

  async function cargar() {
    setCargando(true);
    const [j, incidenciasData] = await Promise.all([
      api.get(`/juegos/${juegoId}`),
      api.get(`/incidencias/${juegoId}`),
    ]);
    setJuego(j);
    setIncidencias(incidenciasData);

    const [rl, rv] = await Promise.all([
      api.get(`/jugadores/roster?equipo_inscrito_id=${j.equipo_local_id}`),
      api.get(`/jugadores/roster?equipo_inscrito_id=${j.equipo_visitante_id}`),
    ]);
    setRoster([
      ...rl.map((r) => ({ ...r, equipo: j.equipo_local })),
      ...rv.map((r) => ({ ...r, equipo: j.equipo_visitante })),
    ]);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, [juegoId]); // eslint-disable-line

  async function agregar() {
    if (!descripcion.trim()) {
      notificar('Escribe una descripción', 'error');
      return;
    }
    setGuardando(true);
    try {
      await api.post('/incidencias', {
        juego_id: juegoId,
        roster_id: rosterId || null,
        tipo,
        descripcion,
      });
      setDescripcion('');
      setRosterId('');
      setTipo('novedad');
      notificar('Incidencia registrada', 'exito');
      cargar();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar esta incidencia?')) return;
    try {
      await api.delete(`/incidencias/${id}`);
      notificar('Incidencia eliminada', 'exito');
      cargar();
    } catch (err) {
      notificar(err.message, 'error');
    }
  }

  if (cargando) return <div className="vacio">Cargando…</div>;
  if (!juego) return <div className="vacio">Juego no encontrado.</div>;

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Incidencias del juego</h1>
          <p>{juego.equipo_local} vs {juego.equipo_visitante} — {juego.fecha}</p>
        </div>
        <Link to="/admin/incidencias" className="boton boton--fantasma">← Volver</Link>
      </div>

      {/* ── Formulario nueva incidencia ── */}
      <div className="tarjeta-lista" style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-4)' }}>
        <h3 style={{ marginBottom: 'var(--space-3)' }}>Registrar nueva incidencia</h3>
        <div className="campo--fila" style={{ marginBottom: 'var(--space-3)' }}>
          <div className="campo">
            <label>Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="campo">
            <label>Jugador afectado (opcional)</label>
            <select value={rosterId} onChange={(e) => setRosterId(e.target.value)}>
              <option value="">— Ninguno —</option>
              {roster.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.numero_camiseta != null ? `#${r.numero_camiseta} ` : ''}{r.nombres} {r.apellidos} ({r.equipo})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="campo" style={{ marginBottom: 'var(--space-3)' }}>
          <label>Descripción</label>
          <textarea
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describe qué ocurrió, cuándo durante el juego, y cómo afecta a los equipos o al jugador…"
            style={{ width: '100%', fontFamily: 'var(--font-body)', padding: 8 }}
          />
        </div>
        <button className="boton boton--dorado" onClick={agregar} disabled={guardando}>
          {guardando ? 'Guardando…' : '+ Registrar incidencia'}
        </button>
      </div>

      {/* ── Lista de incidencias existentes ── */}
      <div className="tarjeta-lista">
        <div className="tarjeta-lista__cabecera"><h3>Registradas ({incidencias.length})</h3></div>
        {incidencias.length === 0 && <div className="vacio">Sin incidencias registradas para este juego.</div>}
        {incidencias.map((i) => (
          <div key={i.id} className="item-lista" style={{ cursor: 'default', alignItems: 'flex-start' }}>
            <div>
              <span style={{
                display: 'inline-block', fontSize: 11, fontWeight: 700, color: '#fff',
                background: COLOR_TIPO[i.tipo] || '#6b7280', borderRadius: 999, padding: '2px 10px', marginBottom: 4,
              }}>
                {TIPOS.find((t) => t.value === i.tipo)?.label || i.tipo}
              </span>
              {i.roster_id && (
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                  {i.nombres} {i.apellidos} <span style={{ color: 'var(--color-ink-soft)', fontWeight: 400 }}>({i.equipo})</span>
                </div>
              )}
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 14 }}>{i.descripcion}</div>
              <div style={{ fontSize: 11, color: 'var(--color-ink-soft)', marginTop: 4 }}>
                {new Date(i.creado_en).toLocaleString('es-VE')}
              </div>
            </div>
            <button className="boton boton--peligro boton--chico" onClick={() => eliminar(i.id)}>Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  );
}