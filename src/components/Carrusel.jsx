import { useEffect, useState } from 'react';

export function Carrusel({ fotos }) {
  const [indice, setIndice] = useState(0);
  const [ampliada, setAmpliada] = useState(false);

  useEffect(() => {
    if (fotos.length <= 1 || ampliada) return;
    const t = setInterval(() => setIndice((i) => (i + 1) % fotos.length), 5000);
    return () => clearInterval(t);
  }, [fotos.length, ampliada]);

  useEffect(() => {
    if (!ampliada) return;
    function alTeclear(e) {
      if (e.key === 'Escape') setAmpliada(false);
      if (e.key === 'ArrowRight') setIndice((i) => (i + 1) % fotos.length);
      if (e.key === 'ArrowLeft') setIndice((i) => (i - 1 + fotos.length) % fotos.length);
    }
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [ampliada, fotos.length]);

  if (!fotos.length) return null;
  const foto = fotos[indice];

  return (
    <>
      <div className="carrusel">
        <div
          className="carrusel__imagen"
          style={{ backgroundImage: `url(${foto.url})`, cursor: 'zoom-in' }}
          onClick={() => setAmpliada(true)}
          role="button"
          tabIndex={0}
          aria-label="Ver imagen completa"
          onKeyDown={(e) => { if (e.key === 'Enter') setAmpliada(true); }}
        >
          {foto.descripcion && <div className="carrusel__pie">{foto.descripcion}</div>}
        </div>

        {fotos.length > 1 && (
          <>
            <button className="carrusel__flecha carrusel__flecha--izq" onClick={() => setIndice((i) => (i - 1 + fotos.length) % fotos.length)} aria-label="Anterior">‹</button>
            <button className="carrusel__flecha carrusel__flecha--der" onClick={() => setIndice((i) => (i + 1) % fotos.length)} aria-label="Siguiente">›</button>
            <div className="carrusel__puntos">
              {fotos.map((_, i) => (
                <button
                  key={i}
                  className={`carrusel__punto ${i === indice ? 'carrusel__punto--activo' : ''}`}
                  onClick={() => setIndice(i)}
                  aria-label={`Foto ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {ampliada && (
        <div className="lightbox" onClick={() => setAmpliada(false)}>
          <button className="lightbox__cerrar" onClick={() => setAmpliada(false)} aria-label="Cerrar">×</button>

          {fotos.length > 1 && (
            <button
              className="lightbox__flecha lightbox__flecha--izq"
              onClick={(e) => { e.stopPropagation(); setIndice((i) => (i - 1 + fotos.length) % fotos.length); }}
              aria-label="Anterior"
            >
              ‹
            </button>
          )}

          <img
            src={foto.url}
            alt={foto.descripcion || ''}
            className="lightbox__imagen"
            onClick={(e) => e.stopPropagation()}
          />

          {fotos.length > 1 && (
            <button
              className="lightbox__flecha lightbox__flecha--der"
              onClick={(e) => { e.stopPropagation(); setIndice((i) => (i + 1) % fotos.length); }}
              aria-label="Siguiente"
            >
              ›
            </button>
          )}

          {foto.descripcion && <div className="lightbox__pie">{foto.descripcion}</div>}
        </div>
      )}
    </>
  );
}
