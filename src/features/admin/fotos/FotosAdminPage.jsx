import { useEffect, useState } from 'react';
import { api } from '../../../api/client';
import { useToast } from '../../../components/Toast';

export default function FotosAdminPage() {
  const { notificar } = useToast();
  const [fotos, setFotos] = useState([]);
  const [url, setUrl] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [orden, setOrden] = useState(0);
  const [enviando, setEnviando] = useState(false);

  function cargar() {
    api.get('/fotos').then(setFotos);
  }

  useEffect(cargar, []);

  async function agregar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.post('/fotos', { url, descripcion, orden: Number(orden) || 0 });
      setUrl(''); setDescripcion(''); setOrden(0);
      cargar();
      notificar('Foto agregada', 'exito');
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Quitar esta foto del carrusel?')) return;
    try {
      await api.delete(`/fotos/${id}`);
      cargar();
      notificar('Foto eliminada', 'exito');
    } catch (err) {
      notificar(err.message, 'error');
    }
  }

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Fotos del inicio</h1>
          <p>Pega el link de una imagen ya subida (Drive, Imgur, etc.) — no hay subida de archivo directa todavía.</p>
        </div>
      </div>

      <form onSubmit={agregar} className="tarjeta-lista" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        <div className="campo--fila">
          <div className="campo" style={{ flex: 2 }}>
            <label>URL de la imagen</label>
            <input required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="campo" style={{ flex: 2 }}>
            <label>Descripción (opcional)</label>
            <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Final Infantil AA, 10 ago" />
          </div>
          <div className="campo">
            <label>Orden</label>
            <input type="number" value={orden} onChange={(e) => setOrden(e.target.value)} style={{ width: 70 }} />
          </div>
        </div>
        <div className="formulario__acciones" style={{ marginTop: 0 }}>
          <button type="submit" className="boton boton--primario" disabled={enviando}>
            {enviando ? 'Agregando…' : '+ Agregar foto'}
          </button>
        </div>
      </form>

      <div className="tarjeta-lista">
        {fotos.length === 0 && <div className="vacio">No hay fotos todavía.</div>}
        {fotos.map((f) => (
          <div key={f.id} className="item-lista">
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={f.url} alt="" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }} />
              {f.descripcion || <em style={{ color: 'var(--color-ink-soft)' }}>Sin descripción</em>}
            </span>
            <button className="boton boton--peligro" onClick={() => eliminar(f.id)}>Quitar</button>
          </div>
        ))}
      </div>
    </div>
  );
}
