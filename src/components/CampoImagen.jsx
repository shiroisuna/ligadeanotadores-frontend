import { useState } from 'react';
import { api } from '../api/client';
import { useToast } from './Toast';

// Uso: <CampoImagen endpoint="/uploads/logo-equipo" valor={logo} onCambiar={setLogo} />
// El input solo acepta imágenes (filtro del navegador); el backend también
// valida tipo y tamaño (5MB) por si alguien lo evade.
export function CampoImagen({ endpoint, valor, onCambiar, tamano = 64 }) {
  const { notificar } = useToast();
  const [subiendo, setSubiendo] = useState(false);

  async function alSeleccionar(e) {
    const archivo = e.target.files[0];
    if (!archivo) return;
    setSubiendo(true);
    try {
      const { url } = await api.subirImagen(endpoint, archivo);
      onCambiar(url);
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setSubiendo(false);
      e.target.value = ''; // permite volver a seleccionar el mismo archivo si hace falta
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {valor && (
        <img
          src={valor}
          alt=""
          style={{ width: tamano, height: tamano, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        />
      )}
      <div>
        <input type="file" accept="image/*" onChange={alSeleccionar} disabled={subiendo} />
        {subiendo && (
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-ink-soft)', marginTop: 4 }}>
            Subiendo…
          </div>
        )}
      </div>
    </div>
  );
}
