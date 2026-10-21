import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { useToast } from './Toast';
import { Modal } from './Modal';

const ENLACES_ADMIN = [
  { to: '/admin',                    label: 'Resumen',                  fin: true },
  { to: '/admin/temporadas',         label: 'Temporadas' },
  { to: '/admin/categorias',         label: 'Categorías' },
  { to: '/admin/equipos',            label: 'Equipos y roster' },
  { to: '/admin/juegos',             label: 'Calendario y juegos' },
  { to: '/admin/estadisticas',       label: 'Estadísticas por juego' },
  { to: '/admin/incidencias',        label: 'Incidencias' },
  { to: '/admin/usuarios',           label: 'Usuarios y accesos' },
  { to: '/admin/anotadores',         label: 'Anotadores' },
  { to: '/admin/estadios',           label: 'Estadios' },
  { to: '/admin/arbitros',           label: 'Árbitros' },
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
  const [modalClave, setModalClave] = useState(false);

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
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="admin__salir" onClick={() => setModalClave(true)}>Cambiar mi clave</button>
            <button className="admin__salir" onClick={logout}>Cerrar sesión</button>
          </div>
        </header>
        <div className="admin__contenido">
          <Outlet />
        </div>
      </div>
      {modalClave && <ModalMiClave onCerrar={() => setModalClave(false)} />}
    </div>
  );
}

function ModalMiClave({ onCerrar }) {
  const { notificar } = useToast();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetir, setRepetir] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function alEnviar(e) {
    e.preventDefault();
    if (nueva !== repetir) { notificar('Las contraseñas nuevas no coinciden', 'error'); return; }
    setEnviando(true);
    try {
      await api.put('/usuarios/mi-password', { password_actual: actual, password_nueva: nueva });
      notificar('Clave actualizada', 'exito');
      onCerrar();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo="Cambiar mi clave" abierto onCerrar={onCerrar} ancho={420}>
      <form onSubmit={alEnviar}>
        <div className="campo"><label>Clave actual</label>
          <input type="password" required value={actual} onChange={(e) => setActual(e.target.value)} /></div>
        <div className="campo"><label>Clave nueva (mín. 6)</label>
          <input type="password" required minLength={6} value={nueva} onChange={(e) => setNueva(e.target.value)} /></div>
        <div className="campo"><label>Repetir clave nueva</label>
          <input type="password" required minLength={6} value={repetir} onChange={(e) => setRepetir(e.target.value)} /></div>
        <div className="formulario__acciones">
          <button type="button" className="boton boton--fantasma" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="boton boton--primario" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </Modal>
  );
}