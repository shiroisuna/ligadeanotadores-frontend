import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const ENLACES = [
  { to: '/admin', label: 'Resumen', fin: true },
  { to: '/admin/temporadas', label: 'Temporadas' },
  { to: '/admin/categorias', label: 'Categorías' },
  { to: '/admin/equipos', label: 'Equipos y roster' },
  { to: '/admin/juegos', label: 'Calendario y juegos' },
  { to: '/admin/fotos', label: 'Fotos del inicio' },
  { to: '/admin/control-lanzadores', label: 'Control de lanzadores' },
];

export function AdminShell() {
  const { usuario, logout } = useAuth();

  return (
    <div className="admin">
      <aside className="admin__sidebar">
        <div className="admin__marca">
          <img src="/logo-labsmi.jpg" alt="LABSMI" className="admin__logo" />
          <div>
            <div className="admin__marca-titulo">LABSMI</div>
            <div className="admin__marca-sub">Panel admin</div>
          </div>
        </div>

        <nav className="admin__nav">
          {ENLACES.map((e) => (
            <NavLink
              key={e.to}
              to={e.to}
              end={e.fin}
              className={({ isActive }) => `admin__nav-link ${isActive ? 'admin__nav-link--activo' : ''}`}
            >
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
          <span className="admin__usuario">{usuario?.email}</span>
          <button className="admin__salir" onClick={logout}>Cerrar sesión</button>
        </header>
        <div className="admin__contenido">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
