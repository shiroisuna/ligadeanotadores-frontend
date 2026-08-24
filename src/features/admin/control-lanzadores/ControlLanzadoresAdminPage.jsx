import { useEffect, useState } from 'react';
import { api } from '../../../api/client';
import { useToast } from '../../../components/Toast';
import { Modal } from '../../../components/Modal';
import { useTemporadaCategoria } from '../../../hooks/useTemporadaCategoria';

export default function ControlLanzadoresAdminPage() {
  const { notificar } = useToast();
  const {
    temporadas, categorias,
    temporadaId, setTemporadaId,
    temporadaCategoriaId, setTemporadaCategoriaId,
  } = useTemporadaCategoria();

  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  function cargar() {
    if (!temporadaCategoriaId) return;
    setCargando(true);
    api.get(`/control-lanzadores?temporada_categoria_id=${temporadaCategoriaId}`)
      .then(setRegistros).finally(() => setCargando(false));
  }

  useEffect(cargar, [temporadaCategoriaId]); // eslint-disable-line

  async function eliminar(id, nombre) {
    if (!confirm(`¿Eliminar el registro de ${nombre}?`)) return;
    try {
      await api.delete(`/control-lanzadores/${id}`);
      notificar('Registro eliminado', 'exito');
      cargar();
    } catch (err) {
      notificar(err.message, 'error');
    }
  }

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Control de lanzadores</h1>
          <p>Registro de envíos por juego y estado de descanso de cada pitcher.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
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
          <button className="boton boton--dorado" onClick={() => setModalAbierto(true)}>+ Registrar</button>
        </div>
      </div>

      {cargando && <div className="vacio">Cargando…</div>}
      {!cargando && registros.length === 0 && <div className="vacio">Sin registros para esta categoría.</div>}

      {!cargando && registros.length > 0 && (
        <table className="tabla" style={{ background: '#fff' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Pitcher</th>
              <th style={{ textAlign: 'left' }}>Equipo</th>
              <th>Último juego</th>
              <th>Envíos</th>
              <th>IL</th>
              <th>Descanso req.</th>
              <th>Días desde juego</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {registros.map((r) => (
              <tr key={r.id}>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                  {r.nombres} {r.apellidos}
                </td>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{r.equipo}</td>
                <td>{r.fecha}</td>
                <td>{r.envios}</td>
                <td>{r.innings_l}</td>
                <td>{r.dias_descanso_requeridos ?? 0} día(s)</td>
                <td>{r.dias_desde_juego}</td>
                <td>
                  <span style={{
                    padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                    background: r.puede_lanzar_hoy ? 'rgba(62,142,90,0.12)' : 'rgba(192,57,43,0.10)',
                    color: r.puede_lanzar_hoy ? 'var(--color-win)' : 'var(--color-clay)',
                  }}>
                    {r.puede_lanzar_hoy ? '✓ Habilitado' : `⛔ Descanso (${r.dias_descanso_requeridos - r.dias_desde_juego} día(s) más)`}
                  </span>
                </td>
                <td>
                  <button className="boton boton--peligro" onClick={() => eliminar(r.id, `${r.nombres} ${r.apellidos}`)}>
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ModalRegistrar
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        temporadaCategoriaId={temporadaCategoriaId}
        onCreado={() => { setModalAbierto(false); cargar(); notificar('Registro guardado', 'exito'); }}
      />
    </div>
  );
}

function ModalRegistrar({ abierto, onCerrar, temporadaCategoriaId, onCreado }) {
  const { notificar } = useToast();
  const [inscritos, setInscritos] = useState([]);
  const [juegos, setJuegos] = useState([]);
  const [roster, setRoster] = useState([]);
  const [equipoId, setEquipoId] = useState('');
  const [juegoId, setJuegoId] = useState('');
  const [rosterId, setRosterId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [envios, setEnvios] = useState(0);
  const [inningsL, setInningsL] = useState(0);
  const [obs, setObs] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto || !temporadaCategoriaId) return;
    api.get(`/equipos/inscritos?temporada_categoria_id=${temporadaCategoriaId}`).then(setInscritos);
    api.get(`/juegos?temporada_categoria_id=${temporadaCategoriaId}`).then(setJuegos);
  }, [abierto, temporadaCategoriaId]);

  useEffect(() => {
    if (!equipoId) { setRoster([]); return; }
    api.get(`/jugadores/roster?equipo_inscrito_id=${equipoId}`).then(setRoster);
  }, [equipoId]);

  async function alEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.post('/control-lanzadores', {
        roster_id: rosterId, juego_id: juegoId, fecha,
        envios: Number(envios), innings_l: Number(inningsL),
        observacion: obs || null,
      });
      onCreado();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo="Registrar envíos de lanzador" abierto={abierto} onCerrar={onCerrar} ancho={500}>
      <form onSubmit={alEnviar}>
        <div className="campo">
          <label>Equipo</label>
          <select required value={equipoId} onChange={(e) => setEquipoId(e.target.value)}>
            <option value="">Selecciona…</option>
            {inscritos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <div className="campo">
          <label>Pitcher</label>
          <select required value={rosterId} onChange={(e) => setRosterId(e.target.value)}>
            <option value="">Selecciona…</option>
            {roster.filter((r) => r.posicion_principal === 'P' || true).map((r) => (
              <option key={r.id} value={r.id}>#{r.numero_camiseta} {r.nombres} {r.apellidos}</option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label>Juego</label>
          <select required value={juegoId} onChange={(e) => setJuegoId(e.target.value)}>
            <option value="">Selecciona…</option>
            {juegos.map((j) => (
              <option key={j.id} value={j.id}>{j.fecha} — {j.equipo_local} vs {j.equipo_visitante}</option>
            ))}
          </select>
        </div>
        <div className="campo--fila">
          <div className="campo">
            <label>Fecha del juego</label>
            <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="campo">
            <label>Envíos (pitches)</label>
            <input type="number" min={0} required value={envios} onChange={(e) => setEnvios(e.target.value)} />
          </div>
          <div className="campo">
            <label>Innings lanzados</label>
            <input type="number" min={0} step="0.1" value={inningsL} onChange={(e) => setInningsL(e.target.value)} />
          </div>
        </div>
        <div className="campo">
          <label>Observación (opcional)</label>
          <input value={obs} onChange={(e) => setObs(e.target.value)} />
        </div>
        <div className="formulario__acciones">
          <button type="button" className="boton boton--fantasma" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="boton boton--primario" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
