import { useEffect, useState } from 'react';
import { api } from '../../../api/client';
import { useToast } from '../../../components/Toast';
import { Modal } from '../../../components/Modal';
import { CampoImagen } from '../../../components/CampoImagen';
import { useTemporadaCategoria } from '../../../hooks/useTemporadaCategoria';

const POSICIONES = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];

export default function EquiposAdminPage() {
  const { notificar } = useToast();
  const {
    temporadas, categorias, categoria,
    temporadaId, setTemporadaId,
    temporadaCategoriaId, setTemporadaCategoriaId,
  } = useTemporadaCategoria();

  const [inscritos, setInscritos] = useState([]);
  const [equipoInscritoId, setEquipoInscritoId] = useState(null);
  const [roster, setRoster] = useState([]);
  const [cargandoInscritos, setCargandoInscritos] = useState(false);
  const [cargandoRoster, setCargandoRoster] = useState(false);

  const [modalInscribir, setModalInscribir] = useState(false);
  const [modalJugador, setModalJugador] = useState(false);
  const [jugadorEditar, setJugadorEditar] = useState(null);

  function cargarInscritos() {
    if (!temporadaCategoriaId) return;
    setCargandoInscritos(true);
    api.get(`/equipos/inscritos?temporada_categoria_id=${temporadaCategoriaId}`)
      .then((data) => {
        setInscritos(data);
        if (!data.find((e) => e.id === equipoInscritoId)) {
          setEquipoInscritoId(data[0]?.id ?? null);
        }
      })
      .finally(() => setCargandoInscritos(false));
  }

  function cargarRoster() {
    if (!equipoInscritoId) { setRoster([]); return; }
    setCargandoRoster(true);
    api.get(`/jugadores/roster?equipo_inscrito_id=${equipoInscritoId}`)
      .then(setRoster)
      .finally(() => setCargandoRoster(false));
  }

  useEffect(cargarInscritos, [temporadaCategoriaId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(cargarRoster, [equipoInscritoId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function quitarInscripcion(id, nombre) {
    if (!confirm(`¿Quitar a ${nombre} de esta temporada/categoría?`)) return;
    try {
      await api.delete(`/equipos/inscritos/${id}`);
      notificar('Equipo removido de la categoría', 'exito');
      cargarInscritos();
    } catch (err) {
      notificar(err.message, 'error');
    }
  }

  async function actualizarRoster(id, campo, valor) {
    setRoster((prev) => prev.map((r) => (r.id === id ? { ...r, [campo]: valor } : r)));
    try {
      const linea = roster.find((r) => r.id === id);
      await api.put(`/jugadores/roster/${id}`, { ...linea, [campo]: valor });
    } catch (err) {
      notificar(err.message, 'error');
      cargarRoster();
    }
  }

  async function quitarDelRoster(id, nombre) {
    if (!confirm(`¿Quitar a ${nombre} del roster?`)) return;
    try {
      await api.delete(`/jugadores/roster/${id}`);
      notificar('Jugador removido del roster', 'exito');
      cargarRoster();
    } catch (err) {
      notificar(err.message, 'error');
    }
  }

  const equipoActual = inscritos.find((e) => e.id === equipoInscritoId);

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Equipos y roster</h1>
          <p>Inscribe equipos en la categoría activa y arma la plantilla de cada uno.</p>
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

      <div className="panel-doble">
        {/* ---- Columna izquierda: equipos inscritos ---- */}
        <div className="tarjeta-lista">
          <div className="tarjeta-lista__cabecera">
            <h3>Equipos inscritos</h3>
            <button className="boton boton--dorado boton--chico" onClick={() => setModalInscribir(true)}>
              + Inscribir
            </button>
          </div>

          {cargandoInscritos && <div className="vacio">Cargando…</div>}
          {!cargandoInscritos && inscritos.length === 0 && (
            <div className="vacio">Todavía no hay equipos inscritos en esta categoría.</div>
          )}
          {inscritos.map((e) => (
            <div
              key={e.id}
              className={`item-lista ${e.id === equipoInscritoId ? 'item-lista--activo' : ''}`}
              onClick={() => setEquipoInscritoId(e.id)}
            >
              <span>{e.nombre}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {e.grupo && <span className="item-lista__grupo">{e.grupo}</span>}
                <button
                  className="boton boton--peligro"
                  onClick={(ev) => { ev.stopPropagation(); quitarInscripcion(e.id, e.nombre); }}
                >
                  Quitar
                </button>
              </span>
            </div>
          ))}
        </div>

        {/* ---- Columna derecha: roster del equipo seleccionado ---- */}
        <div className="tarjeta-lista">
          <div className="tarjeta-lista__cabecera">
            <h3>{equipoActual ? `Roster — ${equipoActual.nombre}` : 'Selecciona un equipo'}</h3>
            {equipoActual && (
              <button className="boton boton--dorado boton--chico" onClick={() => setModalJugador(true)}>
                + Jugador
              </button>
            )}
          </div>

          {!equipoActual && <div className="vacio">Elige un equipo de la izquierda para ver su plantilla.</div>}

          {equipoActual && cargandoRoster && <div className="vacio">Cargando…</div>}

          {equipoActual && !cargandoRoster && roster.length === 0 && (
            <div className="vacio">Este equipo todavía no tiene jugadores en el roster.</div>
          )}

          {equipoActual && !cargandoRoster && roster.length > 0 && (
            <table className="tabla tabla-editable">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>#</th>
                  <th style={{ textAlign: 'left' }}>Jugador</th>
                  <th style={{ width: 90 }}>Posición</th>
                  <th style={{ width: 70 }}>Activo</th>
                  <th style={{ width: 150 }}></th>
                </tr>
              </thead>
              <tbody>
                {roster.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <input
                        type="number"
                        defaultValue={r.numero_camiseta ?? ''}
                        style={{ width: 64 }}
                        onBlur={(e) => actualizarRoster(r.id, 'numero_camiseta', Number(e.target.value) || null)}
                      />
                    </td>
                    <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                      {r.nombres} {r.apellidos}
                    </td>
                    <td>
                      <select
                        defaultValue={r.posicion_principal ?? ''}
                        onChange={(e) => actualizarRoster(r.id, 'posicion_principal', e.target.value)}
                      >
                        <option value="">—</option>
                        {POSICIONES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        defaultChecked={!!r.activo}
                        onChange={(e) => actualizarRoster(r.id, 'activo', e.target.checked)}
                      />
                    </td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="boton boton--fantasma boton--chico" onClick={() => setJugadorEditar(r)}>
                        Contacto
                      </button>
                      <button
                        className="boton boton--peligro"
                        onClick={() => quitarDelRoster(r.id, `${r.nombres} ${r.apellidos}`)}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {jugadorEditar && (
        <ModalEditarContacto
          jugadorId={jugadorEditar.jugador_id}
          nombreCompleto={`${jugadorEditar.nombres} ${jugadorEditar.apellidos}`}
          onCerrar={() => setJugadorEditar(null)}
          onGuardado={() => { setJugadorEditar(null); notificar('Datos de contacto actualizados', 'exito'); }}
        />
      )}

      <ModalInscribirEquipo
        abierto={modalInscribir}
        onCerrar={() => setModalInscribir(false)}
        temporadaCategoriaId={temporadaCategoriaId}
        onCreado={() => { setModalInscribir(false); cargarInscritos(); notificar('Equipo inscrito', 'exito'); }}
      />

      {equipoActual && (
        <ModalAgregarJugador
          abierto={modalJugador}
          onCerrar={() => setModalJugador(false)}
          equipoInscritoId={equipoActual.id}
          onCreado={() => { setModalJugador(false); cargarRoster(); notificar('Jugador agregado al roster', 'exito'); }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Modal: inscribir un equipo (nuevo o del catálogo) en la temporada+categoría
// ---------------------------------------------------------------------
function ModalInscribirEquipo({ abierto, onCerrar, temporadaCategoriaId, onCreado }) {
  const { notificar } = useToast();
  const [catalogo, setCatalogo] = useState([]);
  const [modo, setModo] = useState('existente'); // 'existente' | 'nuevo'
  const [equipoId, setEquipoId] = useState('');
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [logoNuevo, setLogoNuevo] = useState('');
  const [grupo, setGrupo] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (abierto) api.get('/equipos').then(setCatalogo);
  }, [abierto]);

  async function alEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      let idEquipo = equipoId;
      if (modo === 'nuevo') {
        const nuevo = await api.post('/equipos', { nombre: nombreNuevo, logo_url: logoNuevo || null });
        idEquipo = nuevo.id;
      }
      await api.post('/equipos/inscritos', {
        equipo_id: idEquipo,
        temporada_categoria_id: temporadaCategoriaId,
        grupo: grupo || null,
      });
      setNombreNuevo(''); setLogoNuevo(''); setEquipoId(''); setGrupo('');
      onCreado();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo="Inscribir equipo" abierto={abierto} onCerrar={onCerrar}>
      <form onSubmit={alEnviar}>
        <div className="campo--fila" style={{ marginBottom: 'var(--space-4)' }}>
          <button type="button" className={`boton ${modo === 'existente' ? 'boton--primario' : 'boton--fantasma'}`} onClick={() => setModo('existente')}>
            Del catálogo
          </button>
          <button type="button" className={`boton ${modo === 'nuevo' ? 'boton--primario' : 'boton--fantasma'}`} onClick={() => setModo('nuevo')}>
            Equipo nuevo
          </button>
        </div>

        {modo === 'existente' ? (
          <div className="campo">
            <label>Equipo</label>
            <select required value={equipoId} onChange={(e) => setEquipoId(e.target.value)}>
              <option value="">Selecciona…</option>
              {catalogo.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
        ) : (
          <>
            <div className="campo">
              <label>Nombre del equipo</label>
              <input required value={nombreNuevo} onChange={(e) => setNombreNuevo(e.target.value)} placeholder="Ej. Tigres" />
            </div>
            <div className="campo">
              <label>Logo (opcional)</label>
              <CampoImagen endpoint="/uploads/logo-equipo" valor={logoNuevo} onCambiar={setLogoNuevo} />
            </div>
          </>
        )}

        <div className="campo">
          <label>Grupo (opcional)</label>
          <input value={grupo} onChange={(e) => setGrupo(e.target.value)} placeholder="A, B…" maxLength={5} />
        </div>

        <div className="formulario__acciones">
          <button type="button" className="boton boton--fantasma" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="boton boton--primario" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Inscribir'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------
// Modal: agregar jugador al roster (nuevo o del catálogo de jugadores)
// ---------------------------------------------------------------------
function ModalAgregarJugador({ abierto, onCerrar, equipoInscritoId, onCreado }) {
  const { notificar } = useToast();
  const [catalogo, setCatalogo] = useState([]);
  const [modo, setModo] = useState('nuevo'); // 'nuevo' | 'existente'
  const [jugadorId, setJugadorId] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [foto, setFoto] = useState('');
  const [numero, setNumero] = useState('');
  const [posicion, setPosicion] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (abierto) api.get('/jugadores').then(setCatalogo);
  }, [abierto]);

  async function alEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      let idJugador = jugadorId;
      if (modo === 'nuevo') {
        const nuevo = await api.post('/jugadores', {
          nombres, apellidos,
          fecha_nacimiento: fechaNacimiento || null,
          email: email || null,
          telefono: telefono || null,
          foto_url: foto || null,
        });
        idJugador = nuevo.id;
      }
      await api.post('/jugadores/roster', {
        jugador_id: idJugador,
        equipo_inscrito_id: equipoInscritoId,
        numero_camiseta: numero ? Number(numero) : null,
        posicion_principal: posicion || null,
      });
      setNombres(''); setApellidos(''); setFechaNacimiento(''); setEmail(''); setTelefono(''); setFoto('');
      setJugadorId(''); setNumero(''); setPosicion('');
      onCreado();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo="Agregar jugador al roster" abierto={abierto} onCerrar={onCerrar} ancho={560}>
      <form onSubmit={alEnviar}>
        <div className="campo--fila" style={{ marginBottom: 'var(--space-4)' }}>
          <button type="button" className={`boton ${modo === 'nuevo' ? 'boton--primario' : 'boton--fantasma'}`} onClick={() => setModo('nuevo')}>
            Jugador nuevo
          </button>
          <button type="button" className={`boton ${modo === 'existente' ? 'boton--primario' : 'boton--fantasma'}`} onClick={() => setModo('existente')}>
            Del catálogo
          </button>
        </div>

        {modo === 'nuevo' ? (
          <>
            <div className="campo--fila">
              <div className="campo">
                <label>Nombres</label>
                <input required value={nombres} onChange={(e) => setNombres(e.target.value)} />
              </div>
              <div className="campo">
                <label>Apellidos</label>
                <input required value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
              </div>
            </div>
            <div className="campo--fila">
              <div className="campo">
                <label>Fecha de nacimiento</label>
                <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />
              </div>
              <div className="campo">
                <label>Correo (opcional)</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="campo">
                <label>Teléfono (opcional)</label>
                <input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              </div>
            </div>
            <div className="campo">
              <label>Foto (opcional)</label>
              <CampoImagen endpoint="/uploads/foto-jugador" valor={foto} onCambiar={setFoto} />
            </div>
          </>
        ) : (
          <div className="campo">
            <label>Jugador</label>
            <select required value={jugadorId} onChange={(e) => setJugadorId(e.target.value)}>
              <option value="">Selecciona…</option>
              {catalogo.map((j) => (
                <option key={j.id} value={j.id}>{j.nombres} {j.apellidos}</option>
              ))}
            </select>
          </div>
        )}

        <div className="campo--fila">
          <div className="campo">
            <label>Número de camiseta</label>
            <input type="number" value={numero} onChange={(e) => setNumero(e.target.value)} />
          </div>
          <div className="campo">
            <label>Posición principal</label>
            <select value={posicion} onChange={(e) => setPosicion(e.target.value)}>
              <option value="">—</option>
              {POSICIONES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="formulario__acciones">
          <button type="button" className="boton boton--fantasma" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="boton boton--primario" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Agregar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------
// Modal: editar datos de contacto (fecha de nacimiento, correo, teléfono)
// de un jugador ya existente en el roster.
// ---------------------------------------------------------------------
function ModalEditarContacto({ jugadorId, nombreCompleto, onCerrar, onGuardado }) {
  const { notificar } = useToast();
  const [form, setForm] = useState(null); // null mientras carga
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api.get(`/jugadores/${jugadorId}`).then((j) => setForm({
      nombres: j.nombres,
      apellidos: j.apellidos,
      fecha_nacimiento: j.fecha_nacimiento || '',
      email: j.email || '',
      telefono: j.telefono || '',
      foto_url: j.foto_url || '',
    }));
  }, [jugadorId]);

  function set(campo, valor) { setForm((f) => ({ ...f, [campo]: valor })); }

  async function alEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.put(`/jugadores/${jugadorId}`, form);
      onGuardado();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={`Contacto y foto — ${nombreCompleto}`} abierto onCerrar={onCerrar}>
      {!form && <div className="vacio">Cargando…</div>}
      {form && (
        <form onSubmit={alEnviar}>
          <div className="campo">
            <label>Fecha de nacimiento</label>
            <input type="date" value={form.fecha_nacimiento} onChange={(e) => set('fecha_nacimiento', e.target.value)} />
          </div>
          <div className="campo">
            <label>Correo (opcional)</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div className="campo">
            <label>Teléfono (opcional)</label>
            <input value={form.telefono} onChange={(e) => set('telefono', e.target.value)} />
          </div>
          <div className="campo">
            <label>Foto (opcional)</label>
            <CampoImagen endpoint="/uploads/foto-jugador" valor={form.foto_url} onCambiar={(url) => set('foto_url', url)} />
          </div>
          <div className="formulario__acciones">
            <button type="button" className="boton boton--fantasma" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className="boton boton--primario" disabled={enviando}>
              {enviando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
