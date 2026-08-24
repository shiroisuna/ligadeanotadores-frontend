import { useEffect, useState } from 'react';
import { api } from '../../../api/client';
import { useToast } from '../../../components/Toast';

function periodoActual() {
  return new Date().toISOString().slice(0, 7);
}

export default function PagosAdminPage() {
  const { notificar } = useToast();
  const [periodo, setPeriodo] = useState(periodoActual());
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(false);

  function cargar() {
    setCargando(true);
    api.get(`/pagos?periodo=${periodo}`).then(setPagos).finally(() => setCargando(false));
  }

  useEffect(cargar, [periodo]); // eslint-disable-line react-hooks/exhaustive-deps

  async function eliminar(id, nombre) {
    if (!confirm(`¿Borrar el pago de ${nombre}? Esto vuelve a bloquear su ficha hasta que registre otro.`)) return;
    try {
      await api.delete(`/pagos/${id}`);
      notificar('Pago eliminado', 'exito');
      cargar();
    } catch (err) {
      notificar(err.message, 'error');
    }
  }

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Pagos de mensualidad</h1>
          <p>
            Auditoría de lo que los jugadores han autorreportado — cruza esto contra tu estado de cuenta
            de pago móvil real. Si algo no cuadra, bórralo: eso vuelve a bloquear la ficha del jugador.
          </p>
        </div>
        <div className="campo">
          <label>Periodo</label>
          <input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
        </div>
      </div>

      {cargando && <div className="vacio">Cargando…</div>}
      {!cargando && pagos.length === 0 && <div className="vacio">No hay pagos registrados para este periodo.</div>}

      {!cargando && pagos.length > 0 && (
        <table className="tabla" style={{ background: '#fff' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Jugador</th>
              <th style={{ textAlign: 'left' }}>Referencia</th>
              <th style={{ textAlign: 'left' }}>Teléfono origen</th>
              <th style={{ textAlign: 'left' }}>Fecha de pago</th>
              <th style={{ textAlign: 'left' }}>Registrado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pagos.map((p) => (
              <tr key={p.id}>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{p.nombres} {p.apellidos}</td>
                <td style={{ textAlign: 'left' }}>{p.referencia}</td>
                <td style={{ textAlign: 'left' }}>{p.telefono_origen}</td>
                <td style={{ textAlign: 'left' }}>{p.fecha_pago}</td>
                <td style={{ textAlign: 'left', fontSize: 12, color: 'var(--color-ink-soft)' }}>
                  {new Date(p.creado_en).toLocaleString('es-VE')}
                </td>
                <td>
                  <button className="boton boton--peligro" onClick={() => eliminar(p.id, `${p.nombres} ${p.apellidos}`)}>
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
