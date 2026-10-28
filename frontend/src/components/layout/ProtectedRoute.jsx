// ═══════════════════════════════════════════════════════════════
// components/layout/ProtectedRoute.jsx — Ruta protegida RBAC
// ═══════════════════════════════════════════════════════════════
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, rolesPermitidos }) => {
  const { estaAutenticado, cargando, usuario } = useAuth();

  if (cargando) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Cargando...</p>
      </div>
    );
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  if (rolesPermitidos) {
    const rolUsuario = (usuario?.rol || usuario?.rol_sistema || '').toLowerCase();
    const permitidos = rolesPermitidos.map((r) => r.toLowerCase());
    if (!permitidos.includes(rolUsuario)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
