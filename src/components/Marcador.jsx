import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTemporadaCategoria } from '../hooks/useTemporadaCategoria';

const RAMAS = [
  { id: 'menor',   label: 'Béisbol Menor' },
  { id: 'softbol', label: 'Softbol' },
  { id: 'mayor',   label: 'Béisbol Mayor' },
];

const NAV = [
  { to: '/',                    label: 'Inicio' },
  { to: '/resultados',          label: 'Resultados' },
  { to: '/calendario',          label: 'Calendario' },
  { to: '/posiciones',          label: 'Posiciones' },
  { to: '/lideres',             label: 'Líderes' },
  { to: '/defensiva',           label: 'Defensiva' },
  //{ to: '/ofensiva',            label: 'Ofensiva' },
  { to: '/colectivo',           label: 'Colectivo' },
  //{ to: '/estadisticas-equipo', label: 'Por equipo' },
  
  
  { to: '/torneo',              label: 'Torneo' },
  { to: '/nosotros',            label: 'Nosotros' },
  { to: '/fichas-equipos',      label: 'Fichas de Equipos' },
  { to: '/reporte-equipo',      label: 'Reporte por Equipo' },
  { to: '/incidencias',         label: 'Incidencias' },
];

export function Marcador({ onCambiarCategoria }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const { usuario, logout } = useAuth();
  const {
    temporadas, categorias, categoria, conteoPorRama,
    temporadaId, setTemporadaId,
    temporadaCategoriaId, setTemporadaCategoriaId,
    rama, setRama,
  } = useTemporadaCategoria();

  // Notificar a la página cuando cambia la categoría seleccionada
  useEffect(() => {
    if (temporadaCategoriaId) onCambiarCategoria?.(temporadaCategoriaId, categoria);
  }, [temporadaCategoriaId]); // eslint-disable-line

  function alCerrarSesion() {
    logout();
    navigate('/');
  }

  return (
    <header className="marcador">
      {/* ── Franja superior: logo + título + auth ── */}
      <div className="contenedor marcador__fila">
        <Link to="/" className="marcador__marca">
          <img src="/logo-labsmi.jpg" alt="LABSMI" className="marcador__logo" />
          <span>LIGA DE ANOTADORES <span className="marcador__sep">·</span> INDEPENDENCIA</span>
        </Link>

        {/* Selectores de temporada y categoría */}
        <div className="marcador__selectores">
          <div className="marcador__selector">
            <label className="marcador__label">Liga</label>
            <select
              className="marcador__select"
              value={temporadaId}
              onChange={(e) => setTemporadaId(e.target.value)}
            >
              {temporadas.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </div>

          <div className="marcador__selector">
            <label className="marcador__label">Categoría</label>
            <select
              className="marcador__select"
              value={temporadaCategoriaId}
              onChange={(e) => setTemporadaCategoriaId(e.target.value)}
            >
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.categoria_nombre}</option>
              ))}
              {categorias.length === 0 && (
                <option value="">Sin categorías</option>
              )}
            </select>
          </div>
        </div>

        {/* Auth widget */}
        <div className="marcador__auth">
          {!usuario && (
            <Link to="/login" className="marcador__link">Entrar</Link>
          )}
          {usuario?.rol === 'administrador' && (
            <>
              <span className="marcador__email">{usuario.email}</span>
              <Link to="/admin" className="marcador__link marcador__link--panel">Panel admin</Link>
              <button className="marcador__link marcador__link--salir" onClick={alCerrarSesion}>Salir</button>
            </>
          )}
          {usuario?.rol === 'anotador' && (
            <>
              <span className="marcador__email">{usuario.email}</span>
              <Link to="/admin/estadisticas" className="marcador__link marcador__link--panel">Cargar stats</Link>
              <button className="marcador__link marcador__link--salir" onClick={alCerrarSesion}>Salir</button>
            </>
          )}
          {usuario?.rol === 'jugador' && (
            <>
              <span className="marcador__email">{usuario.email}</span>
              <button className="marcador__link marcador__link--panel" id="mi-tarjeta-btn">Mi tarjeta</button>
              <button className="marcador__link marcador__link--salir" onClick={alCerrarSesion}>Salir</button>
            </>
          )}
        </div>
      </div>

      {/* ── Pestañas de liga (solo si hay categorías en esa rama) ── */}
      <div className="marcador__ramas-wrap">
        <div className="contenedor marcador__ramas">
          <div className="marcador__tabs">
            {RAMAS.filter((r) => conteoPorRama[r.id] > 0).map((r) => (
              <button
                key={r.id}
                className={`marcador__tab ${rama === r.id ? 'marcador__tab--activo' : ''}`}
                onClick={() => setRama(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Barra de navegación ── */}
      <nav className="marcador__nav contenedor">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className={`marcador__navlink ${location.pathname === n.to ? 'marcador__navlink--activo' : ''}`}
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}