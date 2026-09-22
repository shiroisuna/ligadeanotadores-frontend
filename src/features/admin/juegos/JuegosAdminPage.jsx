import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../api/client';
import { useToast } from '../../../components/Toast';
import { Modal } from '../../../components/Modal';
import { useTemporadaCategoria } from '../../../hooks/useTemporadaCategoria';
import { useAuth } from '../../../auth/AuthContext';

const ESTADOS = ['programado', 'jugado', 'suspendido', 'pospuesto', 'ganado_forfeit', 'ganado_mesa', 'ganado_retiro'];
const ESTADOS_CON_GANADOR = ['ganado_forfeit', 'ganado_mesa', 'ganado_retiro'];
const RONDAS = ['clasificatoria', 'eliminatoria'];

export default function JuegosAdminPage() {
  const { notificar } = useToast();
  const { usuario } = useAuth();
  const esAnotador = usuario?.rol === 'anotador';
  const {
    temporadas, categorias,
    temporadaId, setTemporadaId,
    temporadaCategoriaId, setTemporadaCategoriaId,
  } = useTemporadaCategoria();

  const [juegos, setJuegos] = useState([]);
  const [inscritos, setInscritos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [juegoEditar, setJuegoEditar] = useState(null);

  function cargarJuegos() {
    if (!temporadaCategoriaId) return;
    setCargando(true);
    api.get(`/juegos?temporada_categoria_id=${temporadaCategoriaId}`)
      .then(setJuegos)
      .finally(() => setCargando(false));
  }

  useEffect(cargarJuegos, [temporadaCategoriaId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!temporadaCategoriaId) return;
    api.get(`/equipos/inscritos?temporada_categoria_id=${temporadaCategoriaId}`).then(setInscritos);
  }, [temporadaCategoriaId]);

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Calendario y juegos</h1>
          <p>Programa partidos y registra el resultado final de cada uno.</p>
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
          {!esAnotador && (
            <button className="boton boton--dorado" style={{ alignSelf: 'flex-end' }} onClick={() => setModalNuevo(true)}>
              + Nuevo juego
            </button>
          )}
        </div>
      </div>

      {cargando && <div className="vacio">Cargando…</div>}
      {!cargando && juegos.length === 0 && <div className="vacio">No hay juegos programados en esta categoría.</div>}

      {!cargando && juegos.length > 0 && (
        <table className="tabla" style={{ background: '#fff' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Fecha</th>
              <th style={{ textAlign: 'left' }}>Local</th>
              <th style={{ textAlign: 'left' }}>Visitante</th>
              <th>Marcador</th>
              <th style={{ textAlign: 'left' }}>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {juegos.map((j) => {
              const perteneceAlAnotador = !esAnotador || [j.local_equipo_inscrito_id, j.visitante_equipo_inscrito_id]
                .map(Number).includes(Number(usuario?.equipo_inscrito_id));
              return (
                <tr key={j.id}>
                  <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                    {j.fecha} {j.hora ? j.hora.slice(0, 5) : ''}
                  </td>
                  <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{j.equipo_local}</td>
                  <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{j.equipo_visitante}</td>
                  <td>{j.carreras_local ?? '—'} - {j.carreras_visitante ?? '—'}</td>
                  <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{j.estado}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    {perteneceAlAnotador ? (
                      <>
                        <button className="boton boton--fantasma boton--chico" onClick={() => setJuegoEditar(j)}>Resultado</button>
                        <Link className="boton boton--primario boton--chico" to={`/admin/estadisticas/${j.id}`}>  Box score</Link>
                      </>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--color-ink-soft)', fontFamily: 'var(--font-body)' }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <ModalNuevoJuego
        abierto={modalNuevo}
        onCerrar={() => setModalNuevo(false)}
        temporadaCategoriaId={temporadaCategoriaId}
        inscritos={inscritos}
        onCreado={() => { setModalNuevo(false); cargarJuegos(); notificar('Juego programado', 'exito'); }}
      />

      {juegoEditar && (
        <ModalResultado
          juego={juegoEditar}
          onCerrar={() => setJuegoEditar(null)}
          onGuardado={() => { setJuegoEditar(null); cargarJuegos(); notificar('Resultado actualizado', 'exito'); }}
        />
      )}
    </div>
  );
}

function ModalNuevoJuego({ abierto, onCerrar, temporadaCategoriaId, inscritos, onCreado }) {
  const { notificar } = useToast();
  const [equipoLocal, setEquipoLocal] = useState('');
  const [equipoVisitante, setEquipoVisitante] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [estadioId, setEstadioId] = useState('');
  const [estadios, setEstadios] = useState([]);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    api.get('/estadios').then(setEstadios);
  }, [abierto]);

  async function alEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.post('/juegos', {
        temporada_categoria_id: temporadaCategoriaId,
        equipo_local_id: equipoLocal,
        equipo_visitante_id: equipoVisitante,
        fecha, hora: hora || null,
        estadio_id: estadioId || null,
      });
      setEquipoLocal(''); setEquipoVisitante(''); setFecha(''); setHora(''); setEstadioId('');
      onCreado();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo="Programar juego" abierto={abierto} onCerrar={onCerrar}>
      <form onSubmit={alEnviar}>
        <div className="campo">
          <label>Equipo local</label>
          <select required value={equipoLocal} onChange={(e) => setEquipoLocal(e.target.value)}>
            <option value="">Selecciona…</option>
            {inscritos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <div className="campo">
          <label>Equipo visitante</label>
          <select required value={equipoVisitante} onChange={(e) => setEquipoVisitante(e.target.value)}>
            <option value="">Selecciona…</option>
            {inscritos.filter((e) => String(e.id) !== equipoLocal).map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <div className="campo">
          <label>Estadio (opcional)</label>
          <select value={estadioId} onChange={(e) => setEstadioId(e.target.value)}>
            <option value="">Sin asignar</option>
            {estadios.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <div className="campo--fila">
          <div className="campo">
            <label>Fecha</label>
            <input required type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="campo">
            <label>Hora fijada</label>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
          </div>
        </div>
        <div className="formulario__acciones">
          <button type="button" className="boton boton--fantasma" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="boton boton--primario" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Programar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ModalResultado({ juego, onCerrar, onGuardado }) {
  const { notificar } = useToast();
  const [form, setForm] = useState({
    estado: juego.estado,
    ronda: juego.ronda ?? '',
    entidad: juego.entidad ?? 'LOABMI',
    fecha_fin: juego.fecha_fin ?? '',
    hora_inicio: juego.hora_inicio ?? '',
    hora_final: juego.hora_final ?? '',
    duracion_minutos: juego.duracion_minutos ?? '',
    carreras_local: juego.carreras_local ?? '',
    carreras_visitante: juego.carreras_visitante ?? '',
    hits_local: juego.hits_local ?? '',
    hits_visitante: juego.hits_visitante ?? '',
    errores_local: juego.errores_local ?? '',
    errores_visitante: juego.errores_visitante ?? '',
    anotador_oficial: juego.anotador_oficial ?? '',
    equipo_ganador_id: juego.equipo_ganador_id ?? '',
  });
  const [enviando, setEnviando] = useState(false);
  const necesitaGanador = ESTADOS_CON_GANADOR.includes(form.estado);

  // ── Árbitros: catálogo completo + cuáles están marcados para este juego ──
  const [catalogoArbitros, setCatalogoArbitros] = useState([]);
  const [arbitrosSeleccionados, setArbitrosSeleccionados] = useState([]); // [arbitro_id, ...]

  useEffect(() => {
    Promise.all([
      api.get('/arbitros'),
      api.get(`/arbitros/juego/${juego.id}`),
    ]).then(([catalogo, actuales]) => {
      setCatalogoArbitros(catalogo);
      setArbitrosSeleccionados(actuales.map((a) => a.id));
    });
  }, [juego.id]);

  function alternarArbitro(arbitroId) {
    setArbitrosSeleccionados((prev) =>
      prev.includes(arbitroId) ? prev.filter((id) => id !== arbitroId) : [...prev, arbitroId]
    );
  }

  function set(campo, valor) { setForm((f) => ({ ...f, [campo]: valor })); }

  async function alEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.put(`/juegos/${juego.id}`, {
        ...form,
        ronda: form.ronda || null,
        fecha_fin: form.fecha_fin || null,
        hora_inicio: form.hora_inicio || null,
        hora_final: form.hora_final || null,
        duracion_minutos: form.duracion_minutos || null,
        equipo_ganador_id: necesitaGanador ? form.equipo_ganador_id : null,
      });
      await api.put(`/arbitros/juego/${juego.id}`, {
        arbitros: arbitrosSeleccionados.map((arbitro_id) => ({ arbitro_id })),
      });
      onGuardado();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={`Resultado — ${juego.equipo_local} vs ${juego.equipo_visitante}`} abierto onCerrar={onCerrar} ancho={560}>
      <form onSubmit={alEnviar}>
        <div className="campo--fila">
          <div className="campo">
            <label>Estado</label>
            <select value={form.estado} onChange={(e) => set('estado', e.target.value)}>
              {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="campo">
            <label>Ronda (opcional)</label>
            <select value={form.ronda} onChange={(e) => set('ronda', e.target.value)}>
              <option value="">Sin especificar</option>
              {RONDAS.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
        </div>

        {necesitaGanador && (
          <div className="campo">
            <label>Equipo ganador</label>
            <select required value={form.equipo_ganador_id} onChange={(e) => set('equipo_ganador_id', e.target.value)}>
              <option value="">Selecciona…</option>
              <option value={juego.equipo_local_id}>{juego.equipo_local}</option>
              <option value={juego.equipo_visitante_id}>{juego.equipo_visitante}</option>
            </select>
          </div>
        )}

        <div className="campo--fila">
          <div className="campo">
            <label>Carreras local</label>
            <input type="number" value={form.carreras_local} onChange={(e) => set('carreras_local', e.target.value)} />
          </div>
          <div className="campo">
            <label>Carreras visitante</label>
            <input type="number" value={form.carreras_visitante} onChange={(e) => set('carreras_visitante', e.target.value)} />
          </div>
        </div>
        <div className="campo--fila">
          <div className="campo">
            <label>Hits local</label>
            <input type="number" value={form.hits_local} onChange={(e) => set('hits_local', e.target.value)} />
          </div>
          <div className="campo">
            <label>Hits visitante</label>
            <input type="number" value={form.hits_visitante} onChange={(e) => set('hits_visitante', e.target.value)} />
          </div>
        </div>
        <div className="campo--fila">
          <div className="campo">
            <label>Errores local</label>
            <input type="number" value={form.errores_local} onChange={(e) => set('errores_local', e.target.value)} />
          </div>
          <div className="campo">
            <label>Errores visitante</label>
            <input type="number" value={form.errores_visitante} onChange={(e) => set('errores_visitante', e.target.value)} />
          </div>
        </div>

        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-ink-soft)', margin: 'var(--space-3) 0 4px' }}>
          Solo si el juego se suspendió y continuó otro día
        </p>
        <div className="campo">
          <label>Fecha en que finalizó</label>
          <input type="date" value={form.fecha_fin} onChange={(e) => set('fecha_fin', e.target.value)} />
        </div>

        <div className="campo--fila">
          <div className="campo">
            <label>Hora de inicio real</label>
            <input type="time" value={form.hora_inicio} onChange={(e) => set('hora_inicio', e.target.value)} />
          </div>
          <div className="campo">
            <label>Hora final</label>
            <input type="time" value={form.hora_final} onChange={(e) => set('hora_final', e.target.value)} />
          </div>
          <div className="campo">
            <label>Duración (minutos)</label>
            <input type="number" min={0} value={form.duracion_minutos} onChange={(e) => set('duracion_minutos', e.target.value)} />
          </div>
        </div>

        <div className="campo">
          <label>Entidad</label>
          <input value={form.entidad} onChange={(e) => set('entidad', e.target.value)} />
        </div>

        <div className="campo">
          <label>Árbitros que participaron</label>
          {catalogoArbitros.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--color-ink-soft)', fontFamily: 'var(--font-body)' }}>
              No hay árbitros en el catálogo todavía — créalos en "Árbitros" en el menú.
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 140, overflowY: 'auto', border: '1px solid var(--color-line)', borderRadius: 8, padding: 8 }}>
            {catalogoArbitros.map((a) => (
              <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={arbitrosSeleccionados.includes(a.id)}
                  onChange={() => alternarArbitro(a.id)}
                />
                {a.nombres} {a.apellidos}
              </label>
            ))}
          </div>
        </div>

        <div className="campo">
          <label>Anotador oficial</label>
          <input value={form.anotador_oficial} onChange={(e) => set('anotador_oficial', e.target.value)} />
        </div>
        <div className="formulario__acciones">
          <button type="button" className="boton boton--fantasma" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="boton boton--primario" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Guardar resultado'}
          </button>
        </div>
      </form>
    </Modal>
  );
}