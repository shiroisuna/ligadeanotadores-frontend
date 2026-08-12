// Genera un color determinístico a partir del nombre del equipo, para que
// el mismo equipo siempre tenga el mismo "escudo" aunque no tenga logo real.
function colorDesdeNombre(nombre) {
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 48%, 34%)`;
}

function iniciales(nombre) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export function TeamBadge({ nombre, logoUrl, tamano = 32 }) {
  if (!nombre) return null;

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={nombre}
        title={nombre}
        style={{ width: tamano, height: tamano, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }

  return (
    <span
      className="escudo"
      style={{
        width: tamano,
        height: tamano,
        fontSize: tamano * 0.38,
        background: colorDesdeNombre(nombre),
      }}
      title={nombre}
    >
      {iniciales(nombre)}
    </span>
  );
}
