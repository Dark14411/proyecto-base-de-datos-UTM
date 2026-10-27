// ═══════════════════════════════════════════════════════════════
// App.jsx — Punto de entrada con React Router
// ═══════════════════════════════════════════════════════════════
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import IncidenciasPage from './pages/IncidenciasPage';
import AnaliticaPage from './pages/AnaliticaPage';
import UsuariosPage from './pages/UsuariosPage';
import EdificiosPage from './pages/EdificiosPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas protegidas dentro del layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/incidencias" element={<IncidenciasPage />} />
            <Route
              path="/analitica"
              element={
                <ProtectedRoute rolesPermitidos={['coordinador', 'directivo', 'administrador']}>
                  <AnaliticaPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/usuarios"
              element={
                <ProtectedRoute rolesPermitidos={['coordinador', 'administrador']}>
                  <UsuariosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edificios"
              element={
                <ProtectedRoute rolesPermitidos={['coordinador', 'directivo', 'administrador']}>
                  <EdificiosPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Redirect por defecto */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
