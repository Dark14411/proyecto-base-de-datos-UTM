// ═══════════════════════════════════════════════════════════════
// components/layout/Sidebar.jsx — Barra lateral de navegación
// ═══════════════════════════════════════════════════════════════
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  BarChart3,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import ThemeToggle from '../ui/ThemeToggle';

const Sidebar = () => {
  const { usuario, logout, tieneRol } = useAuth();
  const [colapsado, setColapsado] = useState(false);

  const enlacesNavegacion = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['reportante', 'tecnico', 'coordinador', 'directivo', 'administrador'],
    },
    {
      to: '/incidencias',
      label: 'Incidencias',
      icon: FileText,
      roles: ['reportante', 'tecnico', 'coordinador', 'directivo', 'administrador'],
    },
    {
      to: '/analitica',
      label: 'Analítica',
      icon: BarChart3,
      roles: ['coordinador', 'directivo', 'administrador'],
    },
    {
      to: '/usuarios',
      label: 'Usuarios',
      icon: Users,
      roles: ['coordinador', 'administrador'],
    },
    {
      to: '/edificios',
      label: 'Edificios',
      icon: Building2,
      roles: ['coordinador', 'directivo', 'administrador'],
    },
  ];

  const enlacesFiltrados = enlacesNavegacion.filter((enlace) =>
    enlace.roles.some((rol) => tieneRol(rol))
  );

  const rolLabels = {
    reportante: 'Reportante',
    tecnico: 'Técnico',
    coordinador: 'Coordinador',
    directivo: 'Directivo',
    administrador: 'Admin',
  };

  return (
    <aside className={`sidebar ${colapsado ? 'sidebar--collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar__header">
        <div className="sidebar__brand">
          <Shield className="sidebar__logo-icon" />
          {!colapsado && (
            <div className="sidebar__brand-text">
              <h1 className="sidebar__title">UTM Desk</h1>
              <span className="sidebar__subtitle">NoSQL Cloud</span>
            </div>
          )}
        </div>
        <button
          className="sidebar__toggle"
          onClick={() => setColapsado(!colapsado)}
          aria-label="Toggle sidebar"
        >
          {colapsado ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {enlacesFiltrados.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            <Icon size={20} />
            {!colapsado && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User info & logout */}
      <div className="sidebar__footer">
        {!colapsado && (
          <div className="sidebar__user-info">
            <div className="sidebar__avatar">
              {usuario?.nombre_completo?.charAt(0)?.toUpperCase()}
            </div>
            <div className="sidebar__user-details">
              <p className="sidebar__user-name">{usuario?.nombre_completo}</p>
              <span className="sidebar__user-role">
                {rolLabels[usuario?.rol] || usuario?.rol}
              </span>
            </div>
          </div>
        )}
        {/* Alternador de tema en sidebar */}
        <div className="sidebar__theme-wrapper mb-2">
          <ThemeToggle showLabel={!colapsado} className="w-full justify-start" />
        </div>

        <button className="sidebar__logout" onClick={logout}>
          <LogOut size={20} />
          {!colapsado && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
