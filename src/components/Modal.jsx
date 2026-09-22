import { useEffect } from 'react';

export function Modal({
  titulo, subtitulo, abierto, onCerrar, children, ancho = 480,
  estiloCabecera, claseCabecera = '',
}) {
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
        aria-label={typeof titulo === 'string' ? titulo : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`modal__cabecera ${claseCabecera}`} style={estiloCabecera}>
          <div>
            <h3 className="modal__titulo" style={{ color: estiloCabecera?.color }}>{titulo}</h3>
            {subtitulo && <div className="modal__subtitulo">{subtitulo}</div>}
          </div>
          <button className="modal__cerrar" onClick={onCerrar} aria-label="Cerrar" style={{ color: estiloCabecera?.color }}>×</button>
        </div>
        <div className="modal__cuerpo">{children}</div>
      </div>
    </div>
  );
}