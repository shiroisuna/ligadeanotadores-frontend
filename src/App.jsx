import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { RequireRole } from './auth/RequireRole';
import { ToastProvider } from './components/Toast';
import { PlayerModalProvider } from './components/PlayerModalProvider';
import { AdminShell } from './components/AdminShell';

import InicioPage from './features/publico/inicio/InicioPage';
import PosicionesPage from './features/publico/posiciones/PosicionesPage';
import LideresPage from './features/publico/lideres/LideresPage';
import ResultadosPage from './features/publico/resultados/ResultadosPage';
import EquipoStatsPage from './features/publico/equipo-stats/EquipoStatsPage';
import JuegosPorEquipoPage from './features/publico/juegos-por-equipo/JuegosPorEquipoPage';
import LoginPage from './features/auth/LoginPage';

import AdminDashboard from './features/admin/AdminDashboard';
import EquiposAdminPage from './features/admin/equipos/EquiposAdminPage';
import JuegosAdminPage from './features/admin/juegos/JuegosAdminPage';
import BoxScoreAdminPage from './features/admin/boxscore/BoxScoreAdminPage';
import FotosAdminPage from './features/admin/fotos/FotosAdminPage';
import CategoriasAdminPage from './features/admin/categorias/CategoriasAdminPage';
import TemporadasAdminPage from './features/admin/temporadas/TemporadasAdminPage';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <PlayerModalProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<InicioPage />} />
              <Route path="/resultados" element={<ResultadosPage />} />
              <Route path="/posiciones" element={<PosicionesPage />} />
              <Route path="/lideres" element={<LideresPage />} />
              <Route path="/estadisticas-equipo" element={<EquipoStatsPage />} />
              <Route path="/juegos-por-equipo" element={<JuegosPorEquipoPage />} />
              <Route path="/login" element={<LoginPage />} />

              <Route
                path="/admin"
                element={
                  <RequireRole roles={['administrador']}>
                    <AdminShell />
                  </RequireRole>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="temporadas" element={<TemporadasAdminPage />} />
                <Route path="categorias" element={<CategoriasAdminPage />} />
                <Route path="equipos" element={<EquiposAdminPage />} />
                <Route path="juegos" element={<JuegosAdminPage />} />
                <Route path="boxscore/:juegoId" element={<BoxScoreAdminPage />} />
                <Route path="fotos" element={<FotosAdminPage />} />
                {/* control-lanzadores se agrega aquí mismo, como
                    <Route path="..." element={...} /> */}
              </Route>

              {/* El perfil de cualquier jugador (clic en un nombre) y "Mi tarjeta"
                  (usuario jugador logueado) son ambos modales — ver
                  components/PlayerModalProvider.jsx y components/PlayerCardModal.jsx.
                  Ya no son rutas separadas. */}

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </PlayerModalProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
