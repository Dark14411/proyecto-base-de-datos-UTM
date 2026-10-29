// ═══════════════════════════════════════════════════════════════
// components/layout/Sidebar.jsx — Barra lateral de navegación Campus
// Matriz de Roles RBAC estricta (Tabla 2 y Tabla 3 — RF-10)
// ═══════════════════════════════════════════════════════════════
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutGrid,
  Inbox,
  TrendingUp,
  Users,
  Building2,
  BookOpen,
  ArrowRight,
  LogOut,
  ChevronLeft,
  ChevronRight,
  School,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';

const Sidebar = () => {
  const { usuario, logout, tieneRol } = useAuth();
  const location = useLocation();
  const [colapsado, setColapsado] = useState(false);
  const [conteoBandeja, setConteoBandeja] = useState(0);

  // Obtener el conteo real de incidencias visibles en la bandeja para el rol actual
  const fetchBadge = useCallback(async () => {
    if (!usuario || tieneRol('administrador')) {
      setConteoBandeja(0);
      return;
    }
    try {
      const res = await api.get('/incidencias', { params: { limite: 1 } });
      const total = res.data.datos?.paginacion?.total ?? 0;
      setConteoBandeja(total);
    } catch {
      setConteoBandeja(0);
    }
  }, [usuario, tieneRol]);

  useEffect(() => {
    fetchBadge();
  }, [fetchBadge, location.pathname]);

  // Escuchar actualizaciones en tiempo real cuando se crean o filtran incidencias
  useEffect(() => {
    const onUpdate = (e) => {
      if (e.detail && typeof e.detail.total === 'number') {
        setConteoBandeja(e.detail.total);
      } else {
        fetchBadge();
      }
    };
    window.addEventListener('incidencias-updated', onUpdate);
    return () => window.removeEventListener('incidencias-updated', onUpdate);
  }, [fetchBadge]);

  // Matriz de permisos de navegación estricta (Tabla 2 y Tabla 3 de la ERS)
  // - Reportante: Resumen, Bandeja de incidencias (solo propias)
  // - Tecnico: Resumen, Bandeja de incidencias (solo asignadas, sin Analítica)
  // - Coordinador: Resumen, Bandeja de incidencias (todas), Analítica
  // - Directivo: Resumen, Bandeja de incidencias (todas, solo lectura), Analítica
  // - Administrador: Resumen, Usuarios (usuarios_campus), Edificios (edificios_campus) — NO bandeja
  const enlacesNavegacion = [
    {
      to: '/dashboard',
      label: 'Resumen',
      icon: LayoutGrid,
      roles: ['reportante', 'tecnico', 'coordinador', 'directivo', 'administrador'],
    },
    {
      to: '/incidencias',
      label: 'Bandeja de incidencias',
      icon: Inbox,
      badge: conteoBandeja,
      roles: ['reportante', 'tecnico', 'coordinador', 'directivo'],
    },
    {
      to: '/analitica',
      label: 'Analítica',
      icon: TrendingUp,
      roles: ['coordinador', 'directivo'],
    },
    {
      to: '/usuarios',
      label: 'Usuarios',
      icon: Users,
      roles: ['administrador'],
    },
    {
      to: '/edificios',
      label: 'Edificios',
      icon: Building2,
      roles: ['administrador'],
    },
  ];

  const enlacesFiltrados = enlacesNavegacion.filter((enlace) =>
    enlace.roles.some((rol) => tieneRol(rol))
  );

  return (
    <aside className={`campus-sidebar ${colapsado ? 'campus-sidebar--collapsed' : ''}`}>
      {/* ─── Brand / Header ────────────────────────────────────── */}
      <div className="campus-sidebar__header">
        <div className="campus-sidebar__brand">
          <div className="campus-sidebar__logo-badge">
            <School size={22} className="campus-sidebar__logo-icon" />
          </div>
          {!colapsado && (
            <div className="campus-sidebar__brand-text">
              <span className="campus-sidebar__title">campus</span>
              <span className="campus-sidebar__subtitle">GESTIÓN DE INCIDENCIAS</span>
            </div>
          )}
        </div>
        <button
          className="campus-sidebar__toggle"
          onClick={() => setColapsado(!colapsado)}
          aria-label="Toggle sidebar"
          title={colapsado ? 'Expandir menú' : 'Colapsar menú'}
        >
          {colapsado ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* ─── Tarjeta de Institución / Campus ───────────────────── */}
      {!colapsado && (
        <div className="campus-sidebar__institution-card">
          <div className="campus-sidebar__inst-avatar">U</div>
          <div className="campus-sidebar__inst-info">
            <p className="campus-sidebar__inst-name">Universidad Tecnológica</p>
            <p className="campus-sidebar__inst-campus">Campus Metropolitano</p>
          </div>
        </div>
      )}

      {/* ─── Sección de Navegación ─────────────────────────────── */}
      <div className="campus-sidebar__nav-section">
        {!colapsado && (
          <span className="campus-sidebar__section-label">ESPACIO DE TRABAJO</span>
        )}

        <nav className="campus-sidebar__nav">
          {enlacesFiltrados.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `campus-sidebar__link ${isActive ? 'campus-sidebar__link--active' : ''}`
              }
            >
              <Icon size={19} className="campus-sidebar__link-icon" />
              {!colapsado && (
                <>
                  <span className="campus-sidebar__link-text">{label}</span>
                  {badge !== undefined && (
                    <span className="campus-sidebar__link-badge">{badge}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ─── Widget Inferior ───────────────────────────────────── */}
      {!colapsado && (
        <div className="campus-sidebar__help-card">
          <div className="campus-sidebar__help-icon">
            <BookOpen size={16} />
          </div>
          <h4 className="campus-sidebar__help-title">Un campus que funciona</h4>
          <p className="campus-sidebar__help-text">
            Cada reporte nos ayuda a mejorar nuestros espacios.
          </p>
          <a
            href="#como-funciona"
            onClick={(e) => {
              e.preventDefault();
              alert(
                'UTM Desk NoSQL Cloud: Sistema integral para reportar desperfectos polimórficos, dar seguimiento atómico con cuadrillas técnicas y consultar analítica institucional en MongoDB Atlas.'
              );
            }}
            className="campus-sidebar__help-link"
          >
            <span>Cómo funciona</span>
            <ArrowRight size={12} />
          </a>
        </div>
      )}

      {/* ─── Footer Institucional / Académico ──────────────────── */}
      <div className="campus-sidebar__footer">
        {!colapsado ? (
          <div className="campus-sidebar__academic-meta">
            <p className="campus-sidebar__academic-tag">PROYECTO ACADÉMICO</p>
            <p className="campus-sidebar__academic-team">Equipo 5 · 2026</p>
          </div>
        ) : (
          <button
            onClick={logout}
            className="p-2 text-gray-500 hover:text-red-500 rounded"
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
