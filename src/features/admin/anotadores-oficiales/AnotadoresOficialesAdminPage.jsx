import { useEffect, useState } from 'react';
import { api } from '../../../api/client';
import { useToast } from '../../../components/Toast';
import { Modal } from '../../../components/Modal';

export default function AnotadoresOficialesAdminPage() {
  const { notificar } = useToast();
  const [anotadores, setAnotadores] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);

  function cargar() {
    setCargando(true);
    api.get('/anotadores-oficiales').then(setAnotadores).finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  async function desactivar(id, nombre) {
    if (!confirm(`¿Desactivar a ${nombre}? Ya no aparecerá para asignar en nuevos juegos.`)) return;
    try {
      await api.delete(`/anotadores-oficiales/${id}`);
      notificar('Anotador oficial desactivado', 'exito');
      cargar();
    } catch (err) {
      notificar(err.message, 'error');
    }
  }

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Anotadores oficiales</h1>
          <p>Catálogo de anotadores oficiales disponibles para asignar a los juegos.</p>
        </div>
        <button className="boton boton--dorado" onClick={() => { setEditando(null); setModalAbierto(true); }}>
          + Nuevo anotador oficial
        </button>
      </div>

      {cargando && <div className="vacio">Cargando…</div>}
      {!cargando && anotadores.length === 0 && <div className="vacio">Sin anotadores oficiales registrados todavía.</div>}

      {!cargando && anotadores.length > 0 && (
        <table className="tabla" style={{ background: '#fff' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Nombre</th>
              <th style={{ textAlign: 'left' }}>Cédula</th>
              <th style={{ textAlign: 'left' }}>Teléfono</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {anotadores.map((a) => (
              <tr key={a.id}>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{a.nombres} {a.apellidos}</td>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{a.cedula || '—'}</td>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{a.telefono || '—'}</td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="boton boton--fantasma boton--chico" onClick={() => { setEditando(a); setModalAbierto(true); }}>
                    Editar
                  </button>
                  <button className="boton boton--peligro boton--chico" onClick={() => desactivar(a.id, `${a.nombres} ${a.apellidos}`)}>
                    Desactivar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ModalAnotador
        abierto={modalAbierto}
        anotador={editando}
        onCerrar={() => setModalAbierto(false)}
        onGuardado={() => { setModalAbierto(false); cargar(); notificar('Guardado', 'exito'); }}
      />
    </div>
  );
}

function ModalAnotador({ abierto, anotador, onCerrar, onGuardado }) {
  const { notificar } = useToast();
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setNombres(anotador?.nombres || '');
    setApellidos(anotador?.apellidos || '');
    setCedula(anotador?.cedula || '');
    setTelefono(anotador?.telefono || '');
  }, [abierto, anotador]);

  async function alEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const datos = { nombres, apellidos, cedula, telefono };
      if (anotador) {
        await api.put(`/anotadores-oficiales/${anotador.id}`, datos);
      } else {
        await api.post('/anotadores-oficiales', datos);
      }
      onGuardado();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={anotador ? 'Editar anotador oficial' : 'Nuevo anotador oficial'} abierto={abierto} onCerrar={onCerrar} ancho={440}>
      <form onSubmit={alEnviar}>
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
            <label>Cédula (opcional)</label>
            <input value={cedula} onChange={(e) => setCedula(e.target.value)} />
          </div>
          <div className="campo">
            <label>Teléfono (opcional)</label>
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </div>
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
