import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const ENLACES_ADMIN = [
  { to: '/admin', label: 'Resumen', fin: true },
  { to: '/admin/temporadas', label: 'Temporadas' },
  { to: '/admin/categorias', label: 'Categorías' },
  { to: '/admin/equipos', label: 'Equipos y roster' },
  { to: '/admin/juegos', label: 'Calendario y juegos' },
  { to: '/admin/estadisticas', label: 'Estadísticas por juego' },
  { to: '/admin/control-lanzadores', label: 'Control de lanzadores' },
  { to: '/admin/fotos', label: 'Fotos del inicio' },
  { to: '/admin/contenido', label: 'Nosotros / Contacto' },
  { to: '/admin/pagos', label: 'Pagos de mensualidad' },
];

const ENLACES_ANOTADOR = [
  { to: '/admin/juegos', label: 'Calendario y juegos' },
  { to: '/admin/estadisticas', label: 'Cargar estadísticas' },
  { to: '/admin/control-lanzadores', label: 'Control de lanzadores' },
];

export function AdminShell() {
  const { usuario, logout } = useAuth();
  const esAnotador = usuario?.rol === 'anotador';
  const enlaces = esAnotador ? ENLACES_ANOTADOR : ENLACES_ADMIN;

  return (
    <div className="admin">
      <aside className="admin__sidebar">
        <div className="admin__marca">
          <img src="/logo-labsmi.jpg" alt="LABSMI" className="admin__logo" />
          <div>
            <div className="admin__marca-titulo">LABSMI</div>
            <div className="admin__marca-sub">{esAnotador ? 'Anotador' : 'Panel admin'}</div>
          </div>
        </div>
        <nav className="admin__nav">
          {enlaces.map((e) => (
            <NavLink key={e.to} to={e.to} end={e.fin}
              className={({ isActive }) => `admin__nav-link ${isActive ? 'admin__nav-link--activo' : ''}`}>
              {e.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin__pie">
          <NavLink to="/" className="admin__nav-link">← Ver sitio público</NavLink>
        </div>
      </aside>
      <div className="admin__main">
        <header className="admin__topbar">
          <span className="admin__usuario">
            {usuario?.email}
            <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.7, textTransform: 'uppercase' }}>({usuario?.rol})</span>
          </span>
          <button className="admin__salir" onClick={logout}>Cerrar sesión</button>
        </header>
        <div className="admin__contenido"><Outlet /></div>
      </div>
    </div>
  );
}
