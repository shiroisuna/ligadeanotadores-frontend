import { useEffect, useState } from 'react';
import { api } from '../../../api/client';
import { useToast } from '../../../components/Toast';

export default function ContenidoAdminPage() {
  const { notificar } = useToast();
  const [form, setForm] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.get('/contenido').then(setForm);
  }, []);

  function set(campo, valor) { setForm((f) => ({ ...f, [campo]: valor })); }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      await api.put('/contenido', form);
      notificar('Contenido actualizado', 'exito');
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  }

  if (!form) return <div className="vacio">Cargando…</div>;

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Nosotros</h1>
          <p>Visión, misión y datos de contacto que se muestran en la página pública "Nosotros".</p>
        </div>
      </div>

      <form onSubmit={guardar} style={{ maxWidth: 640 }}>
        <div className="campo">
          <label>Visión</label>
          <textarea
            rows={4}
            value={form.vision || ''}
            onChange={(e) => set('vision', e.target.value)}
            style={{ fontFamily: 'var(--font-body)', padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-sm)' }}
          />
        </div>
        <div className="campo">
          <label>Misión</label>
          <textarea
            rows={4}
            value={form.mision || ''}
            onChange={(e) => set('mision', e.target.value)}
            style={{ fontFamily: 'var(--font-body)', padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-sm)' }}
          />
        </div>

        <h3 style={{ fontSize: 15, margin: 'var(--space-5) 0 var(--space-3)' }}>Contacto</h3>

        <div className="campo--fila">
          <div className="campo">
            <label>Dirección</label>
            <input value={form.contacto_direccion || ''} onChange={(e) => set('contacto_direccion', e.target.value)} />
          </div>
          <div className="campo">
            <label>Teléfono</label>
            <input value={form.contacto_telefono || ''} onChange={(e) => set('contacto_telefono', e.target.value)} />
          </div>
        </div>
        <div className="campo--fila">
          <div className="campo">
            <label>Correo</label>
            <input type="email" value={form.contacto_email || ''} onChange={(e) => set('contacto_email', e.target.value)} />
          </div>
          <div className="campo">
            <label>WhatsApp (con código de país, solo números)</label>
            <input value={form.contacto_whatsapp || ''} onChange={(e) => set('contacto_whatsapp', e.target.value)} placeholder="584121234567" />
          </div>
        </div>
        <div className="campo--fila">
          <div className="campo">
            <label>Facebook (link completo)</label>
            <input value={form.contacto_facebook || ''} onChange={(e) => set('contacto_facebook', e.target.value)} placeholder="https://facebook.com/..." />
          </div>
          <div className="campo">
            <label>Instagram (link completo)</label>
            <input value={form.contacto_instagram || ''} onChange={(e) => set('contacto_instagram', e.target.value)} placeholder="https://instagram.com/..." />
          </div>
        </div>

        <h3 style={{ fontSize: 15, margin: 'var(--space-5) 0 var(--space-3)' }}>Mensualidad y pago móvil</h3>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-ink-soft)', marginTop: -8, marginBottom: 'var(--space-3)' }}>
          Esto es lo que ve el jugador cuando le toca pagar la mensualidad para desbloquear su ficha.
        </p>
        <div className="campo--fila">
          <div className="campo">
            <label>Monto mensual</label>
            <input type="number" step="0.01" value={form.mensualidad_monto || ''} onChange={(e) => set('mensualidad_monto', e.target.value)} placeholder="5.00" />
          </div>
          <div className="campo">
            <label>Banco</label>
            <input value={form.pago_movil_banco || ''} onChange={(e) => set('pago_movil_banco', e.target.value)} placeholder="Banco de Venezuela" />
          </div>
        </div>
        <div className="campo--fila">
          <div className="campo">
            <label>Cédula / RIF</label>
            <input value={form.pago_movil_cedula || ''} onChange={(e) => set('pago_movil_cedula', e.target.value)} placeholder="V-12345678" />
          </div>
          <div className="campo">
            <label>Teléfono del pago móvil</label>
            <input value={form.pago_movil_telefono || ''} onChange={(e) => set('pago_movil_telefono', e.target.value)} placeholder="0412-1234567" />
          </div>
        </div>

        <div className="formulario__acciones" style={{ justifyContent: 'flex-start' }}>
          <button type="submit" className="boton boton--primario" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
