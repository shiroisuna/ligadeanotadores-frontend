import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';

const ENLACES_ADMIN = [
  { to: '/admin',                    label: 'Resumen',                  fin: true },
  { to: '/admin/temporadas',         label: 'Temporadas' },
  { to: '/admin/categorias',         label: 'Categorías' },
  { to: '/admin/equipos',            label: 'Equipos y roster' },
  { to: '/admin/juegos',             label: 'Calendario y juegos' },
  { to: '/admin/estadisticas',       label: 'Estadísticas por juego' },
  { to: '/admin/incidencias',        label: 'Incidencias' },
  { to: '/admin/anotadores',         label: 'Anotadores' },
  { to: '/admin/control-lanzadores', label: 'Control de lanzadores' },
  { to: '/admin/torneos',            label: 'Torneos' },
  { to: '/admin/aprobaciones',       label: 'Aprobaciones',             badge: true },
  { to: '/admin/fotos',              label: 'Fotos del inicio' },
  { to: '/admin/contenido',          label: 'Nosotros / Contacto' },
  { to: '/admin/pagos',              label: 'Pagos de mensualidad' },
];

const ENLACES_ANOTADOR = [
  { to: '/admin/juegos',             label: 'Calendario y juegos' },
  { to: '/admin/estadisticas',       label: 'Cargar estadísticas' },
  { to: '/admin/incidencias',        label: 'Incidencias' },
  { to: '/admin/control-lanzadores', label: 'Control de lanzadores' },
];

export function AdminShell() {
  const { usuario, logout } = useAuth();
  const esAnotador = usuario?.rol === 'anotador';
  const enlaces    = esAnotador ? ENLACES_ANOTADOR : ENLACES_ADMIN;
  const [pendientes, setPendientes] = useState(0);

  useEffect(() => {
    if (esAnotador) return;
    function fetchPendientes() {
      api.get('/aprobaciones/pendientes/count')
        .then((data) => setPendientes(data.total || 0))
        .catch(() => {});
    }
    fetchPendientes();
    const interval = setInterval(fetchPendientes, 30000);
    return () => clearInterval(interval);
  }, [esAnotador]);

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
              className={({ isActive }) =>
                `admin__nav-link ${isActive ? 'admin__nav-link--activo' : ''}`
              }
            >
              <span style={{ flex: 1 }}>{e.label}</span>
              {e.badge && pendientes > 0 && (
                <span style={{
                  background: '#dc2626', color: '#fff',
                  borderRadius: 999, padding: '1px 7px',
                  fontSize: 11, fontWeight: 700, marginLeft: 6,
                }}>
                  {pendientes}
                </span>
              )}
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
            <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.7, textTransform: 'uppercase' }}>
              ({usuario?.rol})
            </span>
          </span>
          <button className="admin__salir" onClick={logout}>Cerrar sesión</button>
        </header>
        <div className="admin__contenido">
          <Outlet />
        </div>
      </div>
    </div>
  );
}