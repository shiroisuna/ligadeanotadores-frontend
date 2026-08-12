import { useEffect, useState } from 'react';

export function Carrusel({ fotos }) {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    if (fotos.length <= 1) return;
    const t = setInterval(() => setIndice((i) => (i + 1) % fotos.length), 5000);
    return () => clearInterval(t);
  }, [fotos.length]);

  if (!fotos.length) return null;
  const foto = fotos[indice];

  return (
    <div className="carrusel">
      <div className="carrusel__imagen" style={{ backgroundImage: `url(${foto.url})` }}>
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
  );
}
