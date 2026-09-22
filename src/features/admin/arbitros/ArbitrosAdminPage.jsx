import { useEffect, useState } from 'react';
import { api } from '../../../api/client';
import { useToast } from '../../../components/Toast';
import { Modal } from '../../../components/Modal';

export default function ArbitrosAdminPage() {
  const { notificar } = useToast();
  const [arbitros, setArbitros] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);

  function cargar() {
    setCargando(true);
    api.get('/arbitros').then(setArbitros).finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  async function desactivar(id, nombre) {
    if (!confirm(`¿Desactivar a ${nombre}? Ya no aparecerá para asignar en nuevos juegos.`)) return;
    try {
      await api.delete(`/arbitros/${id}`);
      notificar('Árbitro desactivado', 'exito');
      cargar();
    } catch (err) {
      notificar(err.message, 'error');
    }
  }

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Árbitros</h1>
          <p>Catálogo de árbitros disponibles para asignar a los juegos.</p>
        </div>
        <button className="boton boton--dorado" onClick={() => { setEditando(null); setModalAbierto(true); }}>
          + Nuevo árbitro
        </button>
      </div>

      {cargando && <div className="vacio">Cargando…</div>}
      {!cargando && arbitros.length === 0 && <div className="vacio">Sin árbitros registrados todavía.</div>}

      {!cargando && arbitros.length > 0 && (
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
            {arbitros.map((a) => (
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

      <ModalArbitro
        abierto={modalAbierto}
        arbitro={editando}
        onCerrar={() => setModalAbierto(false)}
        onGuardado={() => { setModalAbierto(false); cargar(); notificar('Guardado', 'exito'); }}
      />
    </div>
  );
}

function ModalArbitro({ abierto, arbitro, onCerrar, onGuardado }) {
  const { notificar } = useToast();
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setNombres(arbitro?.nombres || '');
    setApellidos(arbitro?.apellidos || '');
    setCedula(arbitro?.cedula || '');
    setTelefono(arbitro?.telefono || '');
  }, [abierto, arbitro]);

  async function alEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const datos = { nombres, apellidos, cedula, telefono };
      if (arbitro) {
        await api.put(`/arbitros/${arbitro.id}`, datos);
      } else {
        await api.post('/arbitros', datos);
      }
      onGuardado();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={arbitro ? 'Editar árbitro' : 'Nuevo árbitro'} abierto={abierto} onCerrar={onCerrar} ancho={440}>
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