import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api/client';

// El jugador ve su propia línea dentro de vw_bateo_acumulado, filtrando
// del lado del cliente por su jugador_id (guardado en el token).
// Para producción real conviene mover este filtro al backend
// (ej. GET /api/jugadores/mi-estadistica) — se deja así para el MVP.
export default function MiEstadisticaPage() {
  const { usuario, logout } = useAuth();
  const [temporadas, setTemporadas] = useState([]);

  useEffect(() => {
    api.get('/temporadas').then(setTemporadas);
  }, []);

  return (
    <div className="contenedor" style={{ paddingTop: 'var(--space-6)' }}>
      <h1 style={{ fontSize: 26 }}>Mi estadística</h1>
      <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-ink-soft)' }}>
        Sesión de jugador: {usuario?.email}
      </p>
      <p style={{ fontFamily: 'var(--font-body)' }}>
        Pendiente de construir: consumir <code>/api/lideres/bateo</code> filtrando por tu propio
        <code> roster_id</code>, o agregar un endpoint dedicado en el backend
        (<code>GET /api/jugadores/mi-estadistica</code>) que use el <code>jugador_id</code> del token.
      </p>
      <button onClick={logout}>Cerrar sesión</button>
    </div>
  );
}
