import { useEffect, useState } from 'react';
import { api } from '../../../api/client';
import { useAuth } from '../../../auth/AuthContext';
import { useToast } from '../../../components/Toast';
import { Modal } from '../../../components/Modal';
import { useTemporadaCategoria } from '../../../hooks/useTemporadaCategoria';

const ROLES = [
  { id: 'administrador', label: 'Administrador' },
  { id: 'anotador',      label: 'Anotador' },
  { id: 'jugador',       label: 'Jugador' },
];

function generarClave() {
  const letras = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = '';
  const buf = new Uint32Array(10);
  crypto.getRandomValues(buf);
  buf.forEach((n) => { c += letras[n % letras.length]; });
  return c;
}

export default function UsuariosAdminPage() {
  const { notificar } = useToast();
  const { usuario: yo } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtroRol, setFiltroRol] = useState('');
  const [modalForm, setModalForm] = useState(null);   // null | {} (nuevo) | usuario (editar)
  const [modalClave, setModalClave] = useState(null); // usuario

  function cargar() {
    setCargando(true);
    api.getAuth('/usuarios').then(setUsuarios).catch((e) => notificar(e.message, 'error')).finally(() => setCargando(false));
  }
  useEffect(cargar, []);

  async function alternarActivo(u) {
    try {
      if (u.activo) {
        if (!confirm(`¿Desactivar a ${u.email}? Ya no podrá iniciar sesión.`)) return;
        await api.delete(`/usuarios/${u.id}`);
        notificar('Usuario desactivado', 'exito');
      } else {
        await api.post(`/usuarios/${u.id}/reactivar`);
        notificar('Usuario reactivado', 'exito');
      }
      cargar();
    } catch (err) {
      notificar(err.message, 'error');
    }
  }

  const visibles = usuarios.filter((u) => !filtroRol || u.rol === filtroRol);

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Usuarios</h1>
          <p>Crea administradores, anotadores y jugadores; restablece claves y activa o desactiva accesos.</p>
        </div>
        <button className="boton boton--dorado" onClick={() => setModalForm({})}>+ Nuevo usuario</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-3)' }}>
        <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
          <option value="">Todos los roles</option>
          {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
      </div>

      {cargando && <div className="vacio">Cargando…</div>}
      {!cargando && visibles.length === 0 && <div className="vacio">Sin usuarios.</div>}

      {!cargando && visibles.length > 0 && (
        <table className="tabla" style={{ background: '#fff' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Correo</th>
              <th style={{ textAlign: 'left' }}>Rol</th>
              <th style={{ textAlign: 'left' }}>Equipo</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((u) => (
              <tr key={u.id}>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                  {u.email}{Number(u.id) === Number(yo?.id) && <b style={{ marginLeft: 6, fontSize: 11 }}>(tú)</b>}
                </td>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)', textTransform: 'capitalize' }}>{u.rol}</td>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)', fontSize: 12 }}>
                  {u.equipo ? `${u.equipo}${u.categoria_nombre ? ` — ${u.categoria_nombre}` : ''}` : '—'}
                </td>
                <td>
                  <span style={{
                    padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                    background: u.activo ? 'rgba(62,142,90,0.12)' : 'rgba(192,57,43,0.10)',
                    color: u.activo ? 'var(--color-win)' : '#b91c1c',
                  }}>{u.activo ? 'Activo' : 'Desactivado'}</span>
                </td>
                <td style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button className="boton boton--fantasma boton--chico" onClick={() => setModalForm(u)}>Editar</button>
                  <button className="boton boton--fantasma boton--chico" onClick={() => setModalClave(u)}>Clave</button>
                  {Number(u.id) !== Number(yo?.id) && (
                    <button className={`boton boton--chico ${u.activo ? 'boton--peligro' : 'boton--primario'}`} onClick={() => alternarActivo(u)}>
                      {u.activo ? 'Desactivar' : 'Reactivar'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalForm && (
        <ModalUsuario
          usuario={modalForm}
          onCerrar={() => setModalForm(null)}
          onGuardado={() => { setModalForm(null); cargar(); notificar('Usuario guardado', 'exito'); }}
        />
      )}
      {modalClave && (
        <ModalClave
          usuario={modalClave}
          onCerrar={() => setModalClave(null)}
          onListo={() => { setModalClave(null); notificar('Clave restablecida', 'exito'); }}
        />
      )}
    </div>
  );
}

function ModalUsuario({ usuario, onCerrar, onGuardado }) {
  const { notificar } = useToast();
  const editando = !!usuario.id;
  const { temporadas, categorias, temporadaId, setTemporadaId, temporadaCategoriaId, setTemporadaCategoriaId } = useTemporadaCategoria();

  const [email, setEmail] = useState(usuario.email || '');
  const [rol, setRol] = useState(usuario.rol || 'anotador');
  const [password, setPassword] = useState('');
  const [inscritos, setInscritos] = useState([]);
  const [equipoId, setEquipoId] = useState(usuario.equipo_inscrito_id ? String(usuario.equipo_inscrito_id) : '');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (rol !== 'anotador' || !temporadaCategoriaId) return;
    api.get(`/equipos/inscritos?temporada_categoria_id=${temporadaCategoriaId}`).then(setInscritos);
  }, [rol, temporadaCategoriaId]);

  async function alEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const cuerpo = { email, rol, equipo_inscrito_id: rol === 'anotador' ? Number(equipoId) || null : null };
      if (editando) await api.put(`/usuarios/${usuario.id}`, cuerpo);
      else await api.post('/usuarios', { ...cuerpo, password });
      onGuardado();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={editando ? 'Editar usuario' : 'Nuevo usuario'} abierto onCerrar={onCerrar} ancho={480}>
      <form onSubmit={alEnviar}>
        <div className="campo">
          <label>Correo</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="campo">
          <label>Rol</label>
          <select value={rol} onChange={(e) => setRol(e.target.value)}>
            {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </div>
        {!editando && (
          <div className="campo">
            <label>Contraseña inicial</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input type="text" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} style={{ flex: 1 }} />
              <button type="button" className="boton boton--fantasma boton--chico" onClick={() => setPassword(generarClave())}>Generar</button>
            </div>
          </div>
        )}
        {rol === 'anotador' && (
          <>
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
            <div className="campo">
              <label>Equipo al que queda atado</label>
              <select required value={equipoId} onChange={(e) => setEquipoId(e.target.value)}>
                <option value="">Selecciona…</option>
                {editando && usuario.equipo_inscrito_id && !inscritos.some((i) => Number(i.id) === Number(usuario.equipo_inscrito_id)) && (
                  <option value={usuario.equipo_inscrito_id}>Actual: {usuario.equipo}</option>
                )}
                {inscritos.map((i) => <option key={i.id} value={i.id}>{i.nombre}</option>)}
              </select>
            </div>
          </>
        )}
        <div className="formulario__acciones">
          <button type="button" className="boton boton--fantasma" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="boton boton--primario" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </Modal>
  );
}

function ModalClave({ usuario, onCerrar, onListo }) {
  const { notificar } = useToast();
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function alEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.put(`/usuarios/${usuario.id}/password`, { password });
      onListo();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={`Restablecer clave — ${usuario.email}`} abierto onCerrar={onCerrar} ancho={440}>
      <form onSubmit={alEnviar}>
        <div className="campo">
          <label>Nueva contraseña</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input type="text" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} style={{ flex: 1 }} />
            <button type="button" className="boton boton--fantasma boton--chico" onClick={() => setPassword(generarClave())}>Generar</button>
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-ink-soft)', fontFamily: 'var(--font-body)' }}>
          Anota la clave y entrégasela al usuario; después no se puede volver a ver.
        </p>
        <div className="formulario__acciones">
          <button type="button" className="boton boton--fantasma" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="boton boton--primario" disabled={enviando}>{enviando ? 'Guardando…' : 'Restablecer'}</button>
        </div>
      </form>
    </Modal>
  );
}