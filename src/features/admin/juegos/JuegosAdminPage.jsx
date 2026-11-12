import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  const [juegoAsignar, setJuegoAsignar] = useState(null);
  const [juegoProgramacion, setJuegoProgramacion] = useState(null);   // modal Editar (equipos/fecha/fase)
  const [asignados, setAsignados] = useState([]); // ids de juegos asignados al anotador
  const [params, setParams] = useSearchParams();

  function cargarJuegos() {
    if (!temporadaCategoriaId) return;
    setCargando(true);
    api.get(`/juegos?temporada_categoria_id=${temporadaCategoriaId}`)
      .then(setJuegos)
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    if (esAnotador) api.getAuth('/juegos/mis-asignados').then(setAsignados).catch(() => setAsignados([]));
  }, [esAnotador]);

  // Enlace desde Aprobaciones: /admin/juegos?editar=ID abre el modal de resultado
  useEffect(() => {
    const id = params.get('editar');
    if (!id || juegos.length === 0) return;
    const j = juegos.find((x) => String(x.id) === id);
    if (j) { setJuegoEditar(j); params.delete('editar'); setParams(params, { replace: true }); }
  }, [juegos]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(cargarJuegos, [temporadaCategoriaId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function eliminarJuego(j) {
    try {
      const d = await api.getAuth(`/juegos/${j.id}/resumen-datos`);
      const partes = [];
      const n = (k) => Number(d[k]) || 0;
      if (n('bateo_juego')) partes.push(`${n('bateo_juego')} líneas de bateo`);
      if (n('pitcheo_juego')) partes.push(`${n('pitcheo_juego')} líneas de pitcheo`);
      const est = n('est_bateo') + n('est_pitcheo') + n('est_fildeo');
      if (est) partes.push(`${est} líneas de estadísticas`);
      if (n('entradas_juego')) partes.push('las carreras por entrada');
      if (n('incidencias')) partes.push(`${n('incidencias')} incidencias`);
      const detalle = partes.length ? `\n\nTambién se borrarán: ${partes.join(', ')}.` : '';
      if (!confirm(`¿Eliminar el juego ${j.equipo_visitante} vs ${j.equipo_local} (${String(j.fecha).slice(0, 10)})?${detalle}\n\nEsta acción no se puede deshacer.`)) return;
      await api.delete(`/juegos/${j.id}`);
      notificar('Juego eliminado', 'exito');
      cargarJuegos();
    } catch (err) {
      notificar(err.message, 'error');
    }
  }

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
              <th style={{ textAlign: 'left' }}>Fase</th>
              <th style={{ textAlign: 'left' }}>Visitante</th>
              <th style={{ textAlign: 'left' }}>Local (HC)</th>
              <th>Marcador</th>
              <th style={{ textAlign: 'left' }}>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {juegos.map((j) => {
              const perteneceAlAnotador = !esAnotador || asignados.includes(j.id) || [j.local_equipo_inscrito_id, j.visitante_equipo_inscrito_id]
                .map(Number).includes(Number(usuario?.equipo_inscrito_id));
              return (
                <tr key={j.id}>
                  <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                    {j.fecha} {j.hora ? j.hora.slice(0, 5) : ''}
                  </td>
                  <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)', textTransform: 'capitalize' }}>{j.fase || 'eliminatoria'}</td>
                  <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{j.equipo_visitante}</td>
                  <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{j.equipo_local}</td>
                  <td>{j.carreras_visitante ?? '—'} - {j.carreras_local ?? '—'}</td>
                  <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{j.estado}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    {perteneceAlAnotador ? (
                      <>
                        <button className="boton boton--fantasma boton--chico" onClick={() => setJuegoEditar(j)}>Resultado</button>
                        <Link className="boton boton--primario boton--chico" to={`/admin/estadisticas/${j.id}`}>Estadísticas</Link>
                        <Link className="boton boton--primario boton--chico" to={`/admin/boxscore/${j.id}`}>Box score</Link>
                        {!esAnotador && (
                          <button className="boton boton--fantasma boton--chico" onClick={() => setJuegoAsignar(j)}>Anotadores</button>
                        )}
                        {!esAnotador && (
                          <button className="boton boton--fantasma boton--chico" onClick={() => setJuegoProgramacion(j)}>Editar</button>
                        )}
                        {!esAnotador && (
                          <button className="boton boton--peligro boton--chico" onClick={() => eliminarJuego(j)}>Eliminar</button>
                        )}
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

      {juegoProgramacion && (
        <ModalEditarJuego
          juego={juegoProgramacion}
          inscritos={inscritos}
          onCerrar={() => setJuegoProgramacion(null)}
          onGuardado={() => { setJuegoProgramacion(null); cargarJuegos(); notificar('Juego actualizado', 'exito'); }}
        />
      )}

      {juegoAsignar && (
        <ModalAnotadores juego={juegoAsignar} onCerrar={() => setJuegoAsignar(null)} />
      )}

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

// Editar la programación de un juego ya creado: equipos, fase, fecha, hora y estadio.
// (El marcador y los datos técnicos se siguen editando con el botón "Resultado".)
function ModalEditarJuego({ juego, inscritos, onCerrar, onGuardado }) {
  const { notificar } = useToast();
  const [visitante, setVisitante] = useState(String(juego.equipo_visitante_id));
  const [local, setLocal] = useState(String(juego.equipo_local_id));
  const [fase, setFase] = useState(juego.fase || 'eliminatoria');
  const [fecha, setFecha] = useState(String(juego.fecha || '').slice(0, 10));
  const [hora, setHora] = useState(juego.hora ? String(juego.hora).slice(0, 5) : '');
  const [estadioId, setEstadioId] = useState(juego.estadio_id ? String(juego.estadio_id) : '');
  const [estadios, setEstadios] = useState([]);
  const [fasesDisp, setFasesDisp] = useState([{ fase: juego.fase || 'eliminatoria' }]);
  const [equiposFase, setEquiposFase] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api.get('/estadios').then(setEstadios);
    api.get(`/fases?temporada_categoria_id=${juego.temporada_categoria_id}`).then(setFasesDisp).catch(() => {});
  }, [juego.temporada_categoria_id]);

  useEffect(() => {
    if (fase === 'eliminatoria') { setEquiposFase(null); return; }
    api.get(`/fases/equipos?temporada_categoria_id=${juego.temporada_categoria_id}&fase=${fase}`)
      .then((l) => setEquiposFase(l.map((e) => ({ id: e.equipo_inscrito_id, nombre: e.grupo ? `${e.nombre} (Grupo ${e.grupo})` : e.nombre }))))
      .catch(() => setEquiposFase([]));
  }, [fase, juego.temporada_categoria_id]);

  const opciones = equiposFase || inscritos;

  async function alEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const cambiaEquipos = Number(visitante) !== Number(juego.equipo_visitante_id) || Number(local) !== Number(juego.equipo_local_id);
      const esIntercambio = Number(visitante) === Number(juego.equipo_local_id) && Number(local) === Number(juego.equipo_visitante_id);
      let confirmar = false;
      if (cambiaEquipos && !esIntercambio) {
        const d = await api.getAuth(`/juegos/${juego.id}/resumen-datos`);
        const lineas = ['bateo_juego', 'pitcheo_juego', 'est_bateo', 'est_pitcheo', 'est_fildeo', 'entradas_juego', 'incidencias']
          .reduce((a, k) => a + (Number(d[k]) || 0), 0);
        const hayMarcador = juego.carreras_local != null || juego.carreras_visitante != null;
        if (lineas > 0 || hayMarcador) {
          if (!confirm('Vas a cambiar a OTROS equipos en un juego que ya tiene resultado/box score.\n\nSe borrarán el marcador, el box score, las estadísticas, las entradas y las incidencias de este juego, y quedará como "programado".\nSe conservan fecha, estadio, árbitros y anotadores.\n\n¿Continuar?')) {
            setEnviando(false);
            return;
          }
          confirmar = true;
        }
      }
      await api.put(`/juegos/${juego.id}`, {
        equipo_visitante_id: Number(visitante),
        equipo_local_id: Number(local),
        fase, fecha, hora: hora || null,
        estadio_id: estadioId || null,
        confirmar_borrado_datos: confirmar,
      });
      onGuardado();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo="Editar juego" abierto onCerrar={onCerrar}>
      <form onSubmit={alEnviar}>
        {fasesDisp.length > 1 && (
          <div className="campo">
            <label>Fase</label>
            <select value={fase} onChange={(e) => setFase(e.target.value)}>
              {fasesDisp.map((f) => <option key={f.fase} value={f.fase}>{f.fase.charAt(0).toUpperCase() + f.fase.slice(1)}</option>)}
            </select>
          </div>
        )}
        <div className="campo">
          <label>Equipo visitante (primero)</label>
          <select required value={visitante} onChange={(e) => setVisitante(e.target.value)}>
            <option value="">Selecciona…</option>
            {opciones.filter((e) => String(e.id) !== local).map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <div className="campo">
          <label>Equipo local / home club</label>
          <select required value={local} onChange={(e) => setLocal(e.target.value)}>
            <option value="">Selecciona…</option>
            {opciones.filter((e) => String(e.id) !== visitante).map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <p style={{ fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--color-ink-soft)' }}>
          Si solo inviertes local y visitante, el resultado y el box score se conservan (se intercambian los lados). Si cambias a otros equipos y el juego ya tiene datos, se te pedirá confirmar que se borran.
        </p>
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
          <button type="submit" className="boton boton--primario" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar cambios'}</button>
        </div>
      </form>
    </Modal>
  );
}

function ModalAnotadores({ juego, onCerrar }) {
  const { notificar } = useToast();
  const [disponibles, setDisponibles] = useState([]);
  const [sel, setSel] = useState([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.getAuth(`/juegos/${juego.id}/anotadores`).then(({ asignados, disponibles: d }) => {
      setDisponibles(d); setSel(asignados.map((a) => a.id));
    });
  }, [juego.id]);

  async function guardar() {
    setGuardando(true);
    try {
      await api.put(`/juegos/${juego.id}/anotadores`, { usuario_ids: sel });
      notificar('Anotadores asignados', 'exito');
      onCerrar();
    } catch (err) { notificar(err.message, 'error'); } finally { setGuardando(false); }
  }

  return (
    <Modal titulo={`Anotadores — ${juego.equipo_visitante} (V) vs ${juego.equipo_local} (HC)`} abierto onCerrar={onCerrar}>
      <p style={{ fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--color-ink-soft)' }}>
        Los anotadores marcados podrán cargar resultado, estadísticas y box score de este juego.
      </p>
      {disponibles.length === 0 && <p>No hay usuarios con rol anotador. Créalos en "Usuarios y accesos".</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '8px 0' }}>
        {disponibles.map((u) => (
          <label key={u.id} style={{ display: 'flex', gap: 8, fontFamily: 'var(--font-body)', fontSize: 14 }}>
            <input type="checkbox" checked={sel.includes(u.id)}
              onChange={() => setSel((p) => p.includes(u.id) ? p.filter((x) => x !== u.id) : [...p, u.id])} />
            {u.email}
          </label>
        ))}
      </div>
      <div className="formulario__acciones">
        <button className="boton boton--fantasma" onClick={onCerrar}>Cancelar</button>
        <button className="boton boton--primario" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </Modal>
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
  const [fase, setFase] = useState('eliminatoria');
  const [fasesDisp, setFasesDisp] = useState([{ fase: 'eliminatoria' }]);
  const [equiposFase, setEquiposFase] = useState(null);   // null = usar todos los inscritos

  useEffect(() => {
    if (!abierto) return;
    api.get('/estadios').then(setEstadios);
    api.get(`/fases?temporada_categoria_id=${temporadaCategoriaId}`).then(setFasesDisp).catch(() => {});
  }, [abierto, temporadaCategoriaId]);

  // En concentrado/semifinal/final solo se pueden elegir los equipos asignados a esa fase.
  useEffect(() => {
    setEquipoLocal(''); setEquipoVisitante('');
    if (fase === 'eliminatoria') { setEquiposFase(null); return; }
    api.get(`/fases/equipos?temporada_categoria_id=${temporadaCategoriaId}&fase=${fase}`)
      .then((l) => setEquiposFase(l.map((e) => ({ id: e.equipo_inscrito_id, nombre: e.grupo ? `${e.nombre} (Grupo ${e.grupo})` : e.nombre }))))
      .catch(() => setEquiposFase([]));
  }, [fase, temporadaCategoriaId]);

  const opciones = equiposFase || inscritos;

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
        fase,
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
        {fasesDisp.length > 1 && (
          <div className="campo">
            <label>Fase</label>
            <select value={fase} onChange={(e) => setFase(e.target.value)}>
              {fasesDisp.map((f) => <option key={f.fase} value={f.fase}>{f.fase.charAt(0).toUpperCase() + f.fase.slice(1)}</option>)}
            </select>
          </div>
        )}
        <div className="campo">
          <label>Equipo visitante (primero)</label>
          <select required value={equipoVisitante} onChange={(e) => setEquipoVisitante(e.target.value)}>
            <option value="">Selecciona…</option>
            {opciones.filter((e) => String(e.id) !== equipoLocal).map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <div className="campo">
          <label>Equipo local / home club</label>
          <select required value={equipoLocal} onChange={(e) => setEquipoLocal(e.target.value)}>
            <option value="">Selecciona…</option>
            {opciones.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
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
    entidad_arbitros: juego.entidad_arbitros ?? 'LOABMI',
    entidad_anotador: juego.entidad_anotador ?? 'LOABMI',
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
    io_local: juego.io_local ?? '', id_local: juego.id_local ?? '', qb_local: juego.qb_local ?? '',
    io_visitante: juego.io_visitante ?? '', id_visitante: juego.id_visitante ?? '', qb_visitante: juego.qb_visitante ?? '',
    anotador_oficial: juego.anotador_oficial ?? '',
    observacion: juego.observacion ?? '',
    equipo_ganador_id: juego.equipo_ganador_id ?? '',
    mvp_roster_id: juego.mvp_roster_id ?? '',
  });
  const [enviando, setEnviando] = useState(false);
  const necesitaGanador = ESTADOS_CON_GANADOR.includes(form.estado);

  // ── Árbitros: catálogo completo + cuáles están marcados para este juego ──
  const [catalogoArbitros, setCatalogoArbitros] = useState([]);
  const [arbitrosSeleccionados, setArbitrosSeleccionados] = useState([]); // [arbitro_id, ...]
  const [rosterMvp, setRosterMvp] = useState([]);
  const [catalogoAnot, setCatalogoAnot] = useState([]);
  const [anotSeleccionados, setAnotSeleccionados] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/arbitros'),
      api.get(`/arbitros/juego/${juego.id}`),
      api.get('/anotadores-oficiales').catch(() => []),
      api.get(`/anotadores-oficiales/juego/${juego.id}`).catch(() => []),
      api.get(`/jugadores/roster?equipo_inscrito_id=${juego.equipo_local_id}`),
      api.get(`/jugadores/roster?equipo_inscrito_id=${juego.equipo_visitante_id}`),
    ]).then(([catalogo, actuales, catAnot, actAnot, rl, rv]) => {
      setCatalogoAnot(catAnot);
      setAnotSeleccionados(actAnot.map((a) => a.id));
      setCatalogoArbitros(catalogo);
      setArbitrosSeleccionados(actuales.map((a) => a.id));
      setRosterMvp([
        ...rv.map((r) => ({ ...r, equipoEtiqueta: juego.equipo_visitante })),
        ...rl.map((r) => ({ ...r, equipoEtiqueta: juego.equipo_local })),
      ]);
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
        mvp_roster_id: form.mvp_roster_id || null,
        equipo_ganador_id: necesitaGanador ? form.equipo_ganador_id : null,
      });
      await api.put(`/arbitros/juego/${juego.id}`, {
        arbitros: arbitrosSeleccionados.map((arbitro_id) => ({ arbitro_id })),
      });
      await api.put(`/anotadores-oficiales/juego/${juego.id}`, {
        anotadores: anotSeleccionados.map((anotador_id) => ({ anotador_id })),
      });
      onGuardado();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={`Resultado — ${juego.equipo_visitante} (V) vs ${juego.equipo_local} (HC)`} abierto onCerrar={onCerrar} ancho={560}>
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
              <option value={juego.equipo_visitante_id}>{juego.equipo_visitante}</option>
              <option value={juego.equipo_local_id}>{juego.equipo_local}</option>
            </select>
          </div>
        )}

        <div className="campo--fila">
          <div className="campo">
            <label>Carreras visitante (V)</label>
            <input type="number" value={form.carreras_visitante} onChange={(e) => set('carreras_visitante', e.target.value)} />
          </div>
          <div className="campo">
            <label>Carreras local (HC)</label>
            <input type="number" value={form.carreras_local} onChange={(e) => set('carreras_local', e.target.value)} />
          </div>
        </div>
        <div className="campo--fila">
          <div className="campo">
            <label>Hits visitante (V)</label>
            <input type="number" value={form.hits_visitante} onChange={(e) => set('hits_visitante', e.target.value)} />
          </div>
          <div className="campo">
            <label>Hits local (HC)</label>
            <input type="number" value={form.hits_local} onChange={(e) => set('hits_local', e.target.value)} />
          </div>
        </div>
        <div className="campo--fila">
          <div className="campo">
            <label>Errores visitante (V)</label>
            <input type="number" value={form.errores_visitante} onChange={(e) => set('errores_visitante', e.target.value)} />
          </div>
          <div className="campo">
            <label>Errores local (HC)</label>
            <input type="number" value={form.errores_local} onChange={(e) => set('errores_local', e.target.value)} />
          </div>
        </div>

        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-ink-soft)', margin: 'var(--space-3) 0 4px' }}>
          Innings ofensivos (IO), defensivos (ID) y quedados en base (QB) — para la tabla de posiciones. Ej.: 6.33 = 6 1/3
        </p>
        <div className="campo--fila">
          <div className="campo"><label>IO visitante (V)</label><input type="number" step="0.01" min={0} value={form.io_visitante} onChange={(e) => set('io_visitante', e.target.value)} /></div>
          <div className="campo"><label>ID visitante (V)</label><input type="number" step="0.01" min={0} value={form.id_visitante} onChange={(e) => set('id_visitante', e.target.value)} /></div>
          <div className="campo"><label>QB visitante (V)</label><input type="number" min={0} value={form.qb_visitante} onChange={(e) => set('qb_visitante', e.target.value)} /></div>
        </div>
        <div className="campo--fila">
          <div className="campo"><label>IO local (HC)</label><input type="number" step="0.01" min={0} value={form.io_local} onChange={(e) => set('io_local', e.target.value)} /></div>
          <div className="campo"><label>ID local (HC)</label><input type="number" step="0.01" min={0} value={form.id_local} onChange={(e) => set('id_local', e.target.value)} /></div>
          <div className="campo"><label>QB local (HC)</label><input type="number" min={0} value={form.qb_local} onChange={(e) => set('qb_local', e.target.value)} /></div>
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
          <label>Entidad de los árbitros</label>
          <input value={form.entidad_arbitros} onChange={(e) => set('entidad_arbitros', e.target.value)} />
        </div>

        <div className="campo">
          <label>Nota del juego (opcional)</label>
          <textarea rows={2} value={form.observacion} onChange={(e) => set('observacion', e.target.value)} />
        </div>
        <div className="campo">
          <label>Anotadores oficiales que participaron</label>
          {catalogoAnot.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--color-ink-soft)', fontFamily: 'var(--font-body)' }}>
              No hay anotadores oficiales en el catálogo — créalos en "Anotadores oficiales" en el menú.
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 120, overflowY: 'auto', border: '1px solid var(--color-line)', borderRadius: 8, padding: 8 }}>
            {catalogoAnot.map((a) => (
              <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 13 }}>
                <input type="checkbox" checked={anotSeleccionados.includes(a.id)}
                  onChange={() => setAnotSeleccionados((p) => p.includes(a.id) ? p.filter((x) => x !== a.id) : [...p, a.id])} />
                {a.nombres} {a.apellidos}
              </label>
            ))}
          </div>
        </div>
        <div className="campo">
          <label>Anotador oficial (otro, texto libre — opcional)</label>
          <input value={form.anotador_oficial} onChange={(e) => set('anotador_oficial', e.target.value)} />
        </div>
        <div className="campo">
          <label>Entidad del anotador</label>
          <input value={form.entidad_anotador} onChange={(e) => set('entidad_anotador', e.target.value)} />
        </div>
        <div className="campo">
          <label>Jugador más valioso del juego (opcional)</label>
          <select value={form.mvp_roster_id} onChange={(e) => set('mvp_roster_id', e.target.value)}>
            <option value="">Sin especificar</option>
            {rosterMvp.map((r) => (
              <option key={r.id} value={r.id}>
                {r.numero_camiseta != null ? `#${r.numero_camiseta} ` : ''}{r.nombres} {r.apellidos} ({r.equipoEtiqueta})
              </option>
            ))}
          </select>
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
