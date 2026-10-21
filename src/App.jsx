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
import CalendarioPage from './features/publico/calendario/CalendarioPage';
import EquipoStatsPage from './features/publico/equipo-stats/EquipoStatsPage';
import JuegosPorEquipoPage from './features/publico/juegos-por-equipo/JuegosPorEquipoPage';
import ColectivoPage from './features/publico/colectivo/ColectivoPage';
import DefensivaPage from './features/publico/defensiva/DefensivaPage';
import OfensivaPage from './features/publico/ofensiva/OfensivaPage';
import BoxScorePage from './features/publico/boxscore/BoxScorePage';
import ReportePorEquipoPage from './features/publico/reporte-equipo/ReportePorEquipoPage';
import IncidenciasPublicaPage from './features/publico/incidencias-publico/IncidenciasPublicaPage';
import FichasEquiposPage from './features/publico/fichas-equipos/FichasEquiposPage';
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
import IncidenciasListaPage from './features/admin/incidencias/IncidenciasListaPage';
import IncidenciasCargaPage from './features/admin/incidencias/IncidenciasCargaPage';
import AnotadoresAdminPage from './features/admin/anotadores/AnotadoresAdminPage';
import UsuariosAdminPage from './features/admin/usuarios/UsuariosAdminPage';
import EstadiosAdminPage from './features/admin/estadios/EstadiosAdminPage';
import ArbitrosAdminPage from './features/admin/arbitros/ArbitrosAdminPage';


//Torneos
import TorneoPage from './features/publico/torneos/TorneoPage';
import TorneoAdminPage from './features/admin/torneos/TorneoAdminPage';
import AprobacionesAdminPage from './features/admin/aprobaciones/AprobacionesAdminPage';
import BoxScoreAdminPage from './features/admin/boxscore/BoxScoreAdminPage';



import './styles/tokens.css';
import './styles/global.css';
import './styles/admin.css';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <PlayerModalProvider>
          <BrowserRouter>
            <Routes>
              {/* ── Sitio público — cada página tiene su propio Marcador ── */}
              <Route path="/" element={<InicioPage />} />
              <Route path="/resultados" element={<ResultadosPage />} />
              <Route path="/calendario" element={<CalendarioPage />} />
              <Route path="/posiciones" element={<PosicionesPage />} />
              <Route path="/lideres" element={<LideresPage />} />
              <Route path="/estadisticas-equipo" element={<EquipoStatsPage />} />
              <Route path="/juegos-por-equipo" element={<JuegosPorEquipoPage />} />
              <Route path="/colectivo" element={<ColectivoPage />} />
              <Route path="/defensiva" element={<DefensivaPage />} />
              <Route path="/ofensiva" element={<OfensivaPage />} />
              <Route path="/boxscore" element={<BoxScorePage />} />
              <Route path="/reporte-equipo" element={<ReportePorEquipoPage />} />
              <Route path="/incidencias" element={<IncidenciasPublicaPage />} />
              <Route path="/fichas-equipos" element={<FichasEquiposPage />} />
              <Route path="/nosotros" element={<NosotrosPage />} />
              <Route path="/torneo" element={<TorneoPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* ── Admin + Anotador ── */}
              <Route
                path="/admin"
                element={
                  <RequireRole roles={['administrador', 'anotador']}>
                    <AdminShell />
                  </RequireRole>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="temporadas" element={<TemporadasAdminPage />} />
                <Route path="categorias" element={<CategoriasAdminPage />} />
                <Route path="equipos" element={<EquiposAdminPage />} />
                <Route path="juegos" element={<JuegosAdminPage />} />
                <Route path="estadisticas" element={<EstadisticasListaPage />} />
                <Route path="estadisticas/:juegoId" element={<EstadisticasCargaPage />} />
                <Route path="control-lanzadores" element={<ControlLanzadoresAdminPage />} />
                <Route path="incidencias" element={<IncidenciasListaPage />} />
                <Route path="incidencias/:juegoId" element={<IncidenciasCargaPage />} />
                <Route path="anotadores" element={<AnotadoresAdminPage />} />
                <Route path="usuarios" element={<RequireRole roles={['administrador']}><UsuariosAdminPage /></RequireRole>} />
                <Route path="estadios" element={<RequireRole roles={['administrador']}><EstadiosAdminPage /></RequireRole>} />
                <Route path="arbitros" element={<RequireRole roles={['administrador']}><ArbitrosAdminPage /></RequireRole>} />
                <Route path="fotos" element={<FotosAdminPage />} />
                <Route path="contenido" element={<ContenidoAdminPage />} />
                <Route path="pagos" element={<PagosAdminPage />} />
                <Route path="torneos" element={<TorneoAdminPage />} />
                <Route path="aprobaciones" element={<AprobacionesAdminPage />} />
                <Route path="boxscore/:juegoId" element={<BoxScoreAdminPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </PlayerModalProvider>
      </AuthProvider>
    </ToastProvider>
  );
}