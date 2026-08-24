import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTemporadaCategoria } from '../hooks/useTemporadaCategoria';
import { PlayerCardModal } from './PlayerCardModal';

export function Marcador({ onCambiarCategoria }) {
  const location = useLocation();
  const { usuario, logout } = useAuth();
  const [modalTarjeta, setModalTarjeta] = useState(false);
  const {
    temporadas, categorias, categoria, error,
    temporadaId, setTemporadaId,
    temporadaCategoriaId, setTemporadaCategoriaId,
  } = useTemporadaCategoria();

  useEffect(() => {
    if (temporadaCategoriaId) onCambiarCategoria?.(temporadaCategoriaId, categoria);
  }, [temporadaCategoriaId]); // eslint-disable-line react-hooks/exhaustive-deps

  const enlace = (to, texto) => (
    <Link to={to} className={`marcador__link ${location.pathname === to ? 'marcador__link--activo' : ''}`}>
      {texto}
    </Link>
  );

  return (
    <header className="marcador">
      {error && (
        <div className="marcador__error">
          No se pudo conectar con la API ({error}). Verifica que el backend esté corriendo en {import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}.
        </div>
      )}

      <div className="contenedor marcador__fila">
        <Link to="/" className="marcador__marca">
          <img src="/logo-labsmi.jpg" alt="LABSMI" className="marcador__logo" />
          LIGA DE ANOTADORES <span>·</span> INDEPENDENCIA
        </Link>

        <div className="marcador__selector">
          <label className="marcador__label" htmlFor="temporada">Temporada</label>
          <select id="temporada" className="marcador__select" value={temporadaId} onChange={(e) => setTemporadaId(e.target.value)}>
            {temporadas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </div>

        <div className="marcador__selector">
          <label className="marcador__label" htmlFor="categoria">Categoría</label>
          <select id="categoria" className="marcador__select" value={temporadaCategoriaId} onChange={(e) => setTemporadaCategoriaId(e.target.value)}>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.categoria_nombre}</option>)}
          </select>
        </div>

        <nav className="marcador__nav">
          {enlace('/resultados', 'Resultados')}
          {enlace('/calendario', 'Calendario')}
          {enlace('/posiciones', 'Posiciones')}
          {enlace('/lideres', 'Líderes')}
          {enlace('/estadisticas-equipo', 'Por equipo')}
          {enlace('/juegos-por-equipo', 'Cruces')}
          {enlace('/nosotros', 'Nosotros')}
        </nav>

        <div className="marcador__auth">
          {!usuario && <Link to="/login" className="marcador__auth-boton">Entrar</Link>}

          {usuario?.rol === 'administrador' && (
            <>
              <Link to="/admin" className="marcador__auth-boton marcador__auth-boton--dorado">Panel admin</Link>
              <button className="marcador__auth-salir" onClick={logout}>Salir</button>
            </>
          )}

          {usuario?.rol === 'jugador' && (
            <>
              <button className="marcador__auth-boton marcador__auth-boton--dorado" onClick={() => setModalTarjeta(true)}>
                Mi tarjeta
              </button>
              <button className="marcador__auth-salir" onClick={logout}>Salir</button>
            </>
          )}
        </div>
      </div>

      <PlayerCardModal abierto={modalTarjeta} onCerrar={() => setModalTarjeta(false)} />
    </header>
  );
}
