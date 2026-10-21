import { useEffect, useState } from 'react';
import { api } from '../../../api/client';
import { useToast } from '../../../components/Toast';
import { Modal } from '../../../components/Modal';

export default function EstadiosAdminPage() {
  const { notificar } = useToast();
  const [estadios, setEstadios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);

  function cargar() {
    setCargando(true);
    api.get('/estadios').then(setEstadios).finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  async function eliminar(id, nombre) {
    if (!confirm(`¿Eliminar el estadio "${nombre}"?`)) return;
    try {
      await api.delete(`/estadios/${id}`);
      notificar('Estadio eliminado', 'exito');
      cargar();
    } catch (err) {
      notificar(err.message, 'error');
    }
  }

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Estadios</h1>
          <p>Catálogo de estadios/sedes disponibles para asignar a los juegos.</p>
        </div>
        <button className="boton boton--dorado" onClick={() => { setEditando(null); setModalAbierto(true); }}>
          + Nuevo estadio
        </button>
      </div>

      {cargando && <div className="vacio">Cargando…</div>}
      {!cargando && estadios.length === 0 && <div className="vacio">Sin estadios registrados todavía.</div>}

      {!cargando && estadios.length > 0 && (
        <table className="tabla" style={{ background: '#fff' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Nombre</th>
              <th style={{ textAlign: 'left' }}>Dirección</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {estadios.map((e) => (
              <tr key={e.id}>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{e.nombre}</td>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{e.direccion || '—'}</td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="boton boton--fantasma boton--chico" onClick={() => { setEditando(e); setModalAbierto(true); }}>
                    Editar
                  </button>
                  <button className="boton boton--peligro boton--chico" onClick={() => eliminar(e.id, e.nombre)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ModalEstadio
        abierto={modalAbierto}
        estadio={editando}
        onCerrar={() => setModalAbierto(false)}
        onGuardado={() => { setModalAbierto(false); cargar(); notificar('Guardado', 'exito'); }}
      />
    </div>
  );
}

function ModalEstadio({ abierto, estadio, onCerrar, onGuardado }) {
  const { notificar } = useToast();
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setNombre(estadio?.nombre || '');
    setDireccion(estadio?.direccion || '');
  }, [abierto, estadio]);

  async function alEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const datos = { nombre, direccion };
      if (estadio) {
        await api.put(`/estadios/${estadio.id}`, datos);
      } else {
        await api.post('/estadios', datos);
      }
      onGuardado();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={estadio ? 'Editar estadio' : 'Nuevo estadio'} abierto={abierto} onCerrar={onCerrar} ancho={440}>
      <form onSubmit={alEnviar}>
        <div className="campo">
          <label>Nombre</label>
          <input required value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="campo">
          <label>Dirección (opcional)</label>
          <input value={direccion} onChange={(e) => setDireccion(e.target.value)} />
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