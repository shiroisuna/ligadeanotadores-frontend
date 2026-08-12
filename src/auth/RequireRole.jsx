import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Uso: <RequireRole roles={['administrador']}><PanelAdmin /></RequireRole>
export function RequireRole({ roles, children }) {
  const { usuario, cargando } = useAuth();

  if (cargando) return null;
  if (!usuario) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/" replace />;

  return children;
}
