import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useRama } from '../hooks/useRama';
import './Header.css';

const RAMAS = [
  { id: 'menor',  label: 'Béisbol Menor' },
  { id: 'softbol', label: 'Softbol' },
  { id: 'mayor',  label: 'Béisbol Mayor' },
];

const NAV = [
  { to: '/',                  label: 'Inicio' },
  { to: '/resultados',        label: 'Resultados' },
  { to: '/calendario',        label: 'Calendario' },
  { to: '/posiciones',        label: 'Posiciones' },
  { to: '/lideres',           label: 'Líderes' },
  { to: '/estadisticas-equipo', label: 'Por equipo' },
  { to: '/juegos-por-equipo', label: 'Cruces' },
  { to: '/nosotros',          label: 'Nosotros' },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const {
    rama, setRama,
    categorias, categoria,
    temporadas, temporadaId, setTemporadaId,
    temporadaCategoriaId, setTemporadaCategoriaId,
  } = useRama();

  function alCerrarSesion() {
    logout();
    navigate('/');
  }

  return (
    <header className="hdr">
      {/* ── Franja superior: logo + título + usuario ── */}
      <div className="hdr__top contenedor">
        <Link to="/" className="hdr__marca">
          <div className="hdr__labs">LABS</div>
          <div>
            <div className="hdr__titulo">LIGA DE ANOTADORES DE BÉISBOL Y SOFTBOL</div>
            <div className="hdr__sub">MUNICIPIO INDEPENDENCIA — SANTA TERESA DEL TUY</div>
          </div>
        </Link>

        {/* Auth widget */}
        <div className="hdr__auth">
          {!usuario && (
            <Link to="/login" className="hdr__auth-btn">Entrar</Link>
          )}
          {usuario?.rol === 'administrador' && (
            <>
              <span className="hdr__auth-email">{usuario.email}</span>
              <Link to="/admin" className="hdr__auth-btn hdr__auth-btn--gold">Panel admin</Link>
              <button className="hdr__auth-salir" onClick={alCerrarSesion}>Salir</button>
            </>
          )}
          {usuario?.rol === 'anotador' && (
            <>
              <span className="hdr__auth-email">{usuario.email}</span>
              <Link to="/admin/estadisticas" className="hdr__auth-btn hdr__auth-btn--gold">Cargar stats</Link>
              <button className="hdr__auth-salir" onClick={alCerrarSesion}>Salir</button>
            </>
          )}
          {usuario?.rol === 'jugador' && (
            <>
              <span className="hdr__auth-email">{usuario.email}</span>
              <button className="hdr__auth-btn hdr__auth-btn--gold" id="mi-tarjeta-btn">Mi tarjeta</button>
              <button className="hdr__auth-salir" onClick={alCerrarSesion}>Salir</button>
            </>
          )}
        </div>
      </div>

      {/* ── Franja de ramas + selectors ── */}
      <div className="hdr__ramas-wrap">
        <div className="hdr__ramas contenedor">
          <div className="hdr__tabs">
            {RAMAS.map((r) => (
              <button
                key={r.id}
                className={`hdr__tab ${rama === r.id ? 'hdr__tab--activo' : ''}`}
                onClick={() => setRama(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="hdr__selects">
            <div className="hdr__sel-group">
              <label className="hdr__sel-label">Temporada</label>
              <select
                className="hdr__select"
                value={temporadaId}
                onChange={(e) => setTemporadaId(e.target.value)}
              >
                {temporadas.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>
            <div className="hdr__sel-group">
              <label className="hdr__sel-label">Categoría</label>
              <select
                className="hdr__select"
                value={temporadaCategoriaId}
                onChange={(e) => setTemporadaCategoriaId(e.target.value)}
              >
                {categorias[rama].map((c) => (
                  <option key={c.id} value={c.id}>{c.categoria_nombre}</option>
                ))}
                {categorias[rama].length === 0 && (
                  <option value="">Sin categorías</option>
                )}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Navegación principal ── */}
      <nav className="hdr__nav contenedor">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className={`hdr__nav-link ${location.pathname === n.to ? 'hdr__nav-link--activo' : ''}`}
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
