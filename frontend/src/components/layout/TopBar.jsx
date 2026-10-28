// ═══════════════════════════════════════════════════════════════
// components/layout/TopBar.jsx — Barra superior institucional Campus
// Permite alternar entre los 5 roles oficiales y cualquier usuario
// creado en usuarios_campus de MongoDB Atlas.
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ChevronDown, LogOut, Sun, Moon, Check, Users } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const PERFILES_BASE = [
  { rol: 'reportante', label: 'Reportante', correo: 'alumno@utm.mx', desc: 'Registra reportes y consulta sus propias solicitudes' },
  { rol: 'tecnico', label: 'Técnico (Redes)', correo: 'mario.chan@utmetropolitana.edu.mx', desc: 'Atiende incidencias asignadas y actualiza avances' },
  { rol: 'coordinador', label: 'Coordinador', correo: 'coordinador@utm.mx', desc: 'Supervisa la bandeja general, asigna técnicos y ve estadísticas' },
  { rol: 'directivo', label: 'Directivo', correo: 'directivo@utm.mx', desc: 'Consulta estadísticas directivas y reportes en solo lectura' },
  { rol: 'administrador', label: 'Administrador', correo: 'admin@utm.mx', desc: 'Administra usuarios y catálogo de edificios del campus' },
];

const TopBar = () => {
  const { usuario, usuariosCampus, logout, switchUsuario, recargarPerfiles } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cambiando, setCambiando] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const rolLabels = {
    reportante: 'Reportante',
    tecnico: 'Técnico Operativo',
    coordinador: 'Coordinador de Soporte',
    directivo: 'Directivo de Campus',
    administrador: 'Administrador del Sistema',
  };

  useEffect(() => {
    if (menuAbierto) {
      recargarPerfiles();
    }
  }, [menuAbierto, recargarPerfiles]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const redirigirSegunRol = (nuevoRol) => {
    const rol = (nuevoRol || '').toLowerCase();
    const ruta = location.pathname;

    if (rol === 'administrador') {
      if (ruta === '/incidencias' || ruta === '/analitica') {
        navigate('/usuarios');
      }
    } else if (rol === 'reportante' || rol === 'tecnico') {
      if (ruta === '/analitica' || ruta === '/usuarios' || ruta === '/edificios') {
        navigate('/incidencias');
      }
    } else if (rol === 'coordinador' || rol === 'directivo') {
      if (ruta === '/usuarios' || ruta === '/edificios') {
        navigate('/dashboard');
      }
    }
  };

  const handleCambiarRol = async (correo, nuevoRol) => {
    try {
      setCambiando(true);
      const res = await switchUsuario(correo);
      setMenuAbierto(false);
      const rolEfectivo = res?.datos?.usuario?.rol || nuevoRol;
      redirigirSegunRol(rolEfectivo);
    } catch (err) {
      console.error('Error al cambiar rol:', err);
    } finally {
      setCambiando(false);
    }
  };

  const rolActual = (usuario?.rol || usuario?.rol_sistema || 'coordinador').toLowerCase();
  const rolTexto = rolLabels[rolActual] || 'Coordinador de Soporte';
  const nombreUsuario = usuario?.nombre || usuario?.nombre_completo || 'Usuario';
  const iniciales = nombreUsuario
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'UT';

  // Usuarios adicionales registrados en usuarios_campus que no están en los 5 correos base
  const correosBase = new Set(PERFILES_BASE.map((p) => p.correo.toLowerCase()));
  const usuariosExtras = (usuariosCampus || []).filter(
    (u) => u.correo && !correosBase.has(u.correo.toLowerCase()) && u.activo !== false
  );

  return (
    <header className="topbar">
      {/* Breadcrumb institucional */}
      <div className="topbar__breadcrumb">
        <span className="topbar__crumb-root">Campus UTM</span>
        <span className="topbar__crumb-sep">&gt;</span>
        <span className="topbar__crumb-current">Mesa de Ayuda Universitaria</span>
      </div>

      {/* Acciones a la derecha */}
      <div className="topbar__actions">
        {/* Indicador de conexión */}
        <div className="topbar__status-badge" title="Servicio en línea">
          <span className="topbar__status-dot" />
          <span className="topbar__status-text">Sistema en línea</span>
        </div>

        {/* Separador */}
        <span className="topbar__divider" />

        {/* Selector de Tema */}
        <button
          type="button"
          onClick={toggleTheme}
          className="topbar__icon-btn"
          title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
          aria-label="Cambiar tema"
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {/* Perfil de usuario con dropdown y selector de rol/usuario */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            className="topbar__user-btn"
            onClick={() => setMenuAbierto(!menuAbierto)}
            title="Clic para cambiar de rol o usuario activo"
          >
            <span className="topbar__role-label font-medium">
              {nombreUsuario} · <span className="text-emerald-700 dark:text-emerald-400">{rolTexto}</span>
            </span>
            <ChevronDown size={14} className="text-gray-400" />
            <div className="topbar__avatar">{iniciales}</div>
          </button>

          {menuAbierto && (
            <div className="topbar__dropdown w-80 shadow-2xl max-h-[82vh] overflow-y-auto">
              <div className="topbar__dropdown-header">
                <p className="font-semibold text-sm text-[var(--color-text)] truncate">
                  {nombreUsuario}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] truncate">{usuario?.correo}</p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    {usuario?.rol_sistema || rolTexto}
                  </span>
                  {usuario?.matricula_o_clave && (
                    <span className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[var(--color-text-muted)]">
                      {usuario.matricula_o_clave}
                    </span>
                  )}
                </div>
              </div>

              {/* 5 Roles Oficiales */}
              <div className="p-2 border-b border-[var(--color-border)]">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] px-2 py-1">
                  Cambiar Perfil de Usuario
                </p>
                <div className="space-y-1 mt-1">
                  {PERFILES_BASE.map((p) => {
                    const usuarioEnBD = (usuariosCampus || []).find(
                      (u) => u.correo?.toLowerCase() === p.correo.toLowerCase()
                    );
                    const nombreMostrar = usuarioEnBD?.nombre || p.label;
                    const esActivo = usuario?.correo?.toLowerCase() === p.correo.toLowerCase();
                    return (
                      <button
                        key={p.rol}
                        type="button"
                        disabled={cambiando}
                        onClick={() => handleCambiarRol(p.correo, p.rol)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          esActivo
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/20'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--color-text)]'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <span className="block truncate font-medium">
                            {p.label} <span className="text-[10px] opacity-75">({nombreMostrar})</span>
                          </span>
                          <span className="block text-[10px] text-[var(--color-text-muted)] truncate">
                            {p.desc}
                          </span>
                        </div>
                        {esActivo && <Check size={14} className="text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Usuarios adicionales */}
              {usuariosExtras.length > 0 && (
                <div className="p-2 border-b border-[var(--color-border)]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] px-2 py-1 flex items-center gap-1">
                    <Users size={12} />
                    Otros Usuarios del Campus ({usuariosExtras.length})
                  </p>
                  <div className="space-y-1 mt-1 max-h-44 overflow-y-auto">
                    {usuariosExtras.map((u) => {
                      const esActivo = usuario?.correo?.toLowerCase() === u.correo?.toLowerCase();
                      const rolU = (u.rol_sistema || u.rol || 'Reportante');
                      return (
                        <button
                          key={u._id || u.correo}
                          type="button"
                          disabled={cambiando}
                          onClick={() => handleCambiarRol(u.correo, u.rol)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            esActivo
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/20'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--color-text)]'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <span className="block truncate font-medium">
                              {u.nombre || u.nombre_completo}
                            </span>
                            <span className="block text-[10px] text-[var(--color-text-muted)] truncate">
                              {rolU} · {u.correo}
                            </span>
                          </div>
                          {esActivo && <Check size={14} className="text-emerald-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="p-1">
                <button
                  type="button"
                  className="topbar__dropdown-item text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 w-full"
                  onClick={() => {
                    setMenuAbierto(false);
                    logout();
                  }}
                >
                  <LogOut size={15} />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
