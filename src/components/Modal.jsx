import { useEffect } from 'react';

export function Modal({ titulo, abierto, onCerrar, children, ancho = 480 }) {
  useEffect(() => {
    if (!abierto) return;
    function alTeclear(e) {
      if (e.key === 'Escape') onCerrar();
    }
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div className="modal__fondo" onClick={onCerrar}>
      <div
        className="modal__caja"
        style={{ maxWidth: ancho }}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__cabecera">
          <h3 className="modal__titulo">{titulo}</h3>
          <button className="modal__cerrar" onClick={onCerrar} aria-label="Cerrar">×</button>
        </div>
        <div className="modal__cuerpo">{children}</div>
      </div>
    </div>
  );
}
