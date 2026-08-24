import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { RequireRole } from './auth/RequireRole';
import { ToastProvider } from './components/Toast';
import { PlayerModalProvider } from './components/PlayerModalProvider';
import { RamaProvider } from './hooks/useRama';
import { AdminShell } from './components/AdminShell';
import { PublicoLayout } from './components/PublicoLayout';

import InicioPage from './features/publico/inicio/InicioPage';
import PosicionesPage from './features/publico/posiciones/PosicionesPage';
import LideresPage from './features/publico/lideres/LideresPage';
import ResultadosPage from './features/publico/resultados/ResultadosPage';
import CalendarioPage from './features/publico/calendario/CalendarioPage';
import EquipoStatsPage from './features/publico/equipo-stats/EquipoStatsPage';
import JuegosPorEquipoPage from './features/publico/juegos-por-equipo/JuegosPorEquipoPage';
import NosotrosPage from './features/publico/nosotros/NosotrosPage';
import LoginPage from './features/auth/LoginPage';

import AdminDashboard from './features/admin/AdminDashboard';
import EquiposAdminPage from './features/admin/equipos/EquiposAdminPage';
import JuegosAdminPage from './features/admin/juegos/JuegosAdminPage';
import FotosAdminPage from './features/admin/fotos/FotosAdminPage';
import CategoriasAdminPage from './features/admin/categorias/CategoriasAdminPage';
import TemporadasAdminPage from './features/admin/temporadas/TemporadasAdminPage';
import ContenidoAdminPage from './features/admin/contenido/ContenidoAdminPage';
import PagosAdminPage from './features/admin/pagos/PagosAdminPage';
import EstadisticasListaPage from './features/admin/estadisticas/EstadisticasListaPage';
import EstadisticasCargaPage from './features/admin/estadisticas/EstadisticasCargaPage';
import ControlLanzadoresAdminPage from './features/admin/control-lanzadores/ControlLanzadoresAdminPage';

import './styles/tokens.css';
import './styles/global.css';
import './styles/admin.css';
import './styles/admin.css';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RamaProvider>
          <PlayerModalProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<PublicoLayout />}>
                  <Route path="/" element={<InicioPage />} />
                  <Route path="/resultados" element={<ResultadosPage />} />
                  <Route path="/calendario" element={<CalendarioPage />} />
                  <Route path="/posiciones" element={<PosicionesPage />} />
                  <Route path="/lideres" element={<LideresPage />} />
                  <Route path="/estadisticas-equipo" element={<EquipoStatsPage />} />
                  <Route path="/juegos-por-equipo" element={<JuegosPorEquipoPage />} />
                  <Route path="/nosotros" element={<NosotrosPage />} />
                </Route>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/admin" element={<RequireRole roles={['administrador','anotador']}><AdminShell /></RequireRole>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="temporadas" element={<TemporadasAdminPage />} />
                  <Route path="categorias" element={<CategoriasAdminPage />} />
                  <Route path="equipos" element={<EquiposAdminPage />} />
                  <Route path="juegos" element={<JuegosAdminPage />} />
                  <Route path="estadisticas" element={<EstadisticasListaPage />} />
                  <Route path="estadisticas/:juegoId" element={<EstadisticasCargaPage />} />
                  <Route path="control-lanzadores" element={<ControlLanzadoresAdminPage />} />
                  <Route path="fotos" element={<FotosAdminPage />} />
                  <Route path="contenido" element={<ContenidoAdminPage />} />
                  <Route path="pagos" element={<PagosAdminPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </PlayerModalProvider>
        </RamaProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
