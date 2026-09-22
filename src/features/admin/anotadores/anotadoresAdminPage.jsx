import { useEffect, useState } from 'react';
import { api } from '../../../api/client';
import { useToast } from '../../../components/Toast';
import { Modal } from '../../../components/Modal';
import { useTemporadaCategoria } from '../../../hooks/useTemporadaCategoria';

export default function AnotadoresAdminPage() {
  const { notificar } = useToast();
  const [anotadores, setAnotadores] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  function cargar() {
    setCargando(true);
    api.getAuth('/usuarios/anotadores').then(setAnotadores).finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  async function desactivar(id, email) {
    if (!confirm(`¿Desactivar el acceso de ${email}? Ya no podrá iniciar sesión.`)) return;
    try {
      await api.delete(`/usuarios/anotadores/${id}`);
      notificar('Anotador desactivado', 'exito');
      cargar();
    } catch (err) {
      notificar(err.message, 'error');
    }
  }

  async function reactivar(id, email) {
    try {
      await api.post(`/usuarios/anotadores/${id}/reactivar`);
      notificar(`${email} reactivado`, 'exito');
      cargar();
    } catch (err) {
      notificar(err.message, 'error');
    }
  }

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Anotadores</h1>
          <p>Cada anotador queda atado a un solo equipo: solo puede cargar resultados y estadísticas de ese equipo.</p>
        </div>
        <button className="boton boton--dorado" onClick={() => setModalAbierto(true)}>+ Nuevo anotador</button>
      </div>

      {cargando && <div className="vacio">Cargando…</div>}
      {!cargando && anotadores.length === 0 && <div className="vacio">Sin anotadores registrados todavía.</div>}

      {!cargando && anotadores.length > 0 && (
        <table className="tabla" style={{ background: '#fff' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Email</th>
              <th style={{ textAlign: 'left' }}>Equipo</th>
              <th style={{ textAlign: 'left' }}>Categoría</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {anotadores.map((a) => (
              <tr key={a.id}>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{a.email}</td>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{a.equipo || '—'}</td>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)', fontSize: 12 }}>{a.categoria_nombre || '—'}</td>
                <td>
                  <span style={{
                    padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                    background: a.activo ? 'rgba(62,142,90,0.12)' : 'rgba(192,57,43,0.10)',
                    color: a.activo ? 'var(--color-win)' : '#b91c1c',
                  }}>
                    {a.activo ? 'Activo' : 'Desactivado'}
                  </span>
                </td>
                <td>
                  {a.activo ? (
                    <button className="boton boton--peligro boton--chico" onClick={() => desactivar(a.id, a.email)}>
                      Desactivar
                    </button>
                  ) : (
                    <button className="boton boton--primario boton--chico" onClick={() => reactivar(a.id, a.email)}>
                      Reactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ModalCrearAnotador
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onCreado={() => { setModalAbierto(false); cargar(); notificar('Anotador creado', 'exito'); }}
      />
    </div>
  );
}

function ModalCrearAnotador({ abierto, onCerrar, onCreado }) {
  const { notificar } = useToast();
  const {
    temporadas, categorias,
    temporadaId, setTemporadaId,
    temporadaCategoriaId, setTemporadaCategoriaId,
  } = useTemporadaCategoria();

  const [inscritos, setInscritos] = useState([]);
  const [equipoInscritoId, setEquipoInscritoId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto || !temporadaCategoriaId) return;
    api.get(`/equipos/inscritos?temporada_categoria_id=${temporadaCategoriaId}`).then((data) => {
      setInscritos(data);
      setEquipoInscritoId(data[0]?.id ?? '');
    });
  }, [abierto, temporadaCategoriaId]);

  async function alEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.post('/usuarios/anotadores', { email, password, equipo_inscrito_id: equipoInscritoId });
      setEmail(''); setPassword('');
      onCreado();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo="Nuevo anotador" abierto={abierto} onCerrar={onCerrar} ancho={480}>
      <form onSubmit={alEnviar}>
        <div className="campo">
          <label>Correo</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="campo">
          <label>Contraseña</label>
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
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
        <div className="campo">
          <label>Equipo (a este queda atado el anotador)</label>
          <select required value={equipoInscritoId} onChange={(e) => setEquipoInscritoId(e.target.value)}>
            <option value="">Selecciona…</option>
            {inscritos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <div className="formulario__acciones">
          <button type="button" className="boton boton--fantasma" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="boton boton--primario" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Crear anotador'}
          </button>
        </div>
      </form>
    </Modal>
  );
}