import { useEffect, useState } from 'react';
import { api } from '../../api/client';

// Resumen del panel — cuenta lo que hay cargado hasta ahora, para que el
// administrador tenga una foto rápida del estado del sistema al entrar.
export default function AdminDashboard() {
  const [conteos, setConteos] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/categorias'),
      api.get('/equipos'),
      api.get('/jugadores'),
      api.get('/juegos'),
    ]).then(([categorias, equipos, jugadores, juegos]) => {
      setConteos({
        categorias: categorias.length,
        equipos: equipos.length,
        jugadores: jugadores.length,
        juegos: juegos.length,
        juegosJugados: juegos.filter((j) => j.estado === 'jugado').length,
      });
    });
  }, []);

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Resumen</h1>
          <p>Estado actual de la base de datos de la liga.</p>
        </div>
      </div>

      {!conteos && <div className="vacio">Cargando…</div>}

      {conteos && (
        <div className="tarjetas">
          <div className="tarjeta">
            <div className="tarjeta__numero">{conteos.categorias}</div>
            <div className="tarjeta__label">Categorías</div>
          </div>
          <div className="tarjeta">
            <div className="tarjeta__numero">{conteos.equipos}</div>
            <div className="tarjeta__label">Equipos</div>
          </div>
          <div className="tarjeta">
            <div className="tarjeta__numero">{conteos.jugadores}</div>
            <div className="tarjeta__label">Jugadores</div>
          </div>
          <div className="tarjeta">
            <div className="tarjeta__numero">{conteos.juegosJugados}/{conteos.juegos}</div>
            <div className="tarjeta__label">Juegos jugados</div>
          </div>
        </div>
      )}
    </div>
  );
}
