// ═══════════════════════════════════════════════════════════════
// pages/LoginPage.jsx — Inicio de Sesión Moderno con Selección por Recuadro
// Sincronizado con los usuarios reales de usuarios_campus en MongoDB Atlas
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ui/ThemeToggle';
import {
  Shield,
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  ArrowRight,
  Sparkles,
  UserPlus,
  X,
  CheckCircle2,
  Building,
  GraduationCap,
  Wrench,
  UserCheck,
  ChevronDown,
  KeyRound,
  IdCard,
  School,
} from 'lucide-react';

const LoginPage = () => {
  const { login, registro, switchUsuario, usuariosCampus, recargarPerfiles } = useAuth();
  const navigate = useNavigate();

  // Estados de inicio de sesión manual
  const [form, setForm] = useState({ correo: '', password: '' });
  const [mostrarManual, setMostrarManual] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [usuarioIngresando, setUsuarioIngresando] = useState('');

  // Filtro de roles para los recuadros
  const [filtroCategoria, setFiltroCategoria] = useState('todos');

  // Estado del Modal de Crear Cuenta
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false);
  const [formRegistro, setFormRegistro] = useState({
    nombre_completo: '',
    correo: '',
    password: '',
    confirmarPassword: '',
    rol: 'reportante',
    departamento: '',
    matricula_o_numero_empleado: '',
  });
  const [errorRegistro, setErrorRegistro] = useState('');
  const [cargandoRegistro, setCargandoRegistro] = useState(false);
  const [exitoRegistro, setExitoRegistro] = useState(false);

  useEffect(() => {
    recargarPerfiles();
  }, [recargarPerfiles]);

  // Perfiles base preconfigurados
  const usuariosBase = [
    {
      id: 'admin',
      categoria: 'gestion',
      nombre: 'Admin UTM Desk',
      tituloRol: 'Administrador del Sistema',
      correo: 'admin@utm.mx',
      pass: 'admin123',
      rol: 'administrador',
      rolBadge: 'ADMIN',
      departamento: 'Dirección de TI',
      descripcion: 'Administración de cuentas institucionales y edificios del campus.',
      colorCard: 'user-box--admin',
      avatarGradient: 'from-rose-500 to-red-600',
      icono: Shield,
    },
    {
      id: 'coord',
      categoria: 'gestion',
      nombre: 'Ing. Sofía Morales',
      tituloRol: 'Coordinadora de Soporte',
      correo: 'coordinador@utm.mx',
      pass: 'coord123',
      rol: 'coordinador',
      rolBadge: 'COORDINADOR',
      departamento: 'Coordinación de Soporte y Redes',
      descripcion: 'Asignación de cuadrillas técnicas, seguimiento global y analítica.',
      colorCard: 'user-box--coord',
      avatarGradient: 'from-emerald-600 to-teal-700',
      icono: UserCheck,
    },
    {
      id: 'tec_redes',
      categoria: 'tecnico',
      nombre: 'Téc. Mario Chan',
      tituloRol: 'Técnico Especialista en Redes',
      correo: 'mario.chan@utmetropolitana.edu.mx',
      pass: 'tecnico123',
      rol: 'tecnico',
      rolBadge: 'TÉCNICO',
      departamento: 'Dirección de Tecnologías de la Información',
      descripcion: 'Atención de incidencias asignadas, actualización atómica y tags.',
      colorCard: 'user-box--tecnico-redes',
      avatarGradient: 'from-emerald-500 to-teal-600',
      icono: Wrench,
    },
    {
      id: 'tec_infra',
      categoria: 'tecnico',
      nombre: 'Téc. Luis Pech',
      tituloRol: 'Técnico en Infraestructura',
      correo: 'luis.pech@utmetropolitana.edu.mx',
      pass: 'tecnico123',
      rol: 'tecnico',
      rolBadge: 'TÉCNICO',
      departamento: 'Mantenimiento e Infraestructura',
      descripcion: 'Reparación de iluminación, mobiliario y climatización.',
      colorCard: 'user-box--tecnico-infra',
      avatarGradient: 'from-teal-500 to-cyan-600',
      icono: Building,
    },
    {
      id: 'directivo',
      categoria: 'gestion',
      nombre: 'Dr. Reyes Carrillo Lizandro',
      tituloRol: 'Directivo Académico',
      correo: 'directivo@utm.mx',
      pass: 'directivo123',
      rol: 'directivo',
      rolBadge: 'DIRECTIVO',
      departamento: 'Dirección Académica',
      descripcion: 'Supervisión de analítica y consulta en modo de solo lectura.',
      colorCard: 'user-box--directivo',
      avatarGradient: 'from-amber-500 to-yellow-600',
      icono: GraduationCap,
    },
    {
      id: 'docente',
      categoria: 'comunidad',
      nombre: 'Mtro. Roberto Méndez',
      tituloRol: 'Docente en Redes',
      correo: 'roberto.mendez@utmetropolitana.edu.mx',
      pass: 'utm123',
      rol: 'reportante',
      rolBadge: 'REPORTANTE',
      departamento: 'Docencia en Redes',
      descripcion: 'Reporta fallas en laboratorios y consulta sus propios reportes.',
      colorCard: 'user-box--docente',
      avatarGradient: 'from-sky-500 to-blue-600',
      icono: GraduationCap,
    },
    {
      id: 'alumno',
      categoria: 'comunidad',
      nombre: 'Carlos Santiago Euan Ayala',
      tituloRol: 'Estudiante UTM',
      correo: 'alumno@utm.mx',
      pass: 'utm123',
      rol: 'reportante',
      rolBadge: 'REPORTANTE',
      departamento: 'Tecnologías de la Información',
      descripcion: 'Levanta reportes de aulas, proyectores y áreas comunes.',
      colorCard: 'user-box--alumno',
      avatarGradient: 'from-violet-500 to-fuchsia-600',
      icono: GraduationCap,
    },
  ];

  // Incorporar dinámicamente cualquier usuario adicional creado en usuarios_campus
  const correosBase = new Set(usuariosBase.map((u) => u.correo.toLowerCase()));
  const usuariosDinamicos = (usuariosCampus || [])
    .filter((u) => u.correo && !correosBase.has(u.correo.toLowerCase()) && u.activo !== false)
    .map((u) => {
      const rolMin = (u.rol || u.rol_sistema || 'reportante').toLowerCase();
      const mapCat = {
        administrador: 'gestion',
        coordinador: 'gestion',
        directivo: 'gestion',
        tecnico: 'tecnico',
        reportante: 'comunidad',
      };
      const mapIcono = {
        administrador: Shield,
        coordinador: UserCheck,
        directivo: GraduationCap,
        tecnico: Wrench,
        reportante: GraduationCap,
      };
      return {
        id: u._id || u.correo,
        categoria: mapCat[rolMin] || 'comunidad',
        nombre: u.nombre || u.nombre_completo,
        tituloRol: u.perfil_operativo?.cargo || u.rol_sistema || 'Usuario del Campus',
        correo: u.correo,
        pass: null, // Usa switchUsuario directo desde MongoDB Atlas
        rol: rolMin,
        rolBadge: (u.rol_sistema || rolMin).toUpperCase(),
        departamento: u.perfil_operativo?.departamento || u.departamento || 'Campus UTM',
        descripcion: 'Usuario registrado en la colección usuarios_campus de MongoDB Atlas.',
        colorCard: 'user-box--coord',
        avatarGradient: 'from-emerald-600 to-teal-700',
        icono: mapIcono[rolMin] || GraduationCap,
      };
    });

  // Actualizar también nombres/roles de usuariosBase si fueron editados en MongoDB Atlas
  const usuariosBaseSincronizados = usuariosBase.map((base) => {
    const enBD = (usuariosCampus || []).find(
      (u) => u.correo?.toLowerCase() === base.correo.toLowerCase()
    );
    if (!enBD) return base;
    return {
      ...base,
      nombre: enBD.nombre || enBD.nombre_completo || base.nombre,
      departamento: enBD.perfil_operativo?.departamento || enBD.departamento || base.departamento,
    };
  });

  const todosLosPerfiles = [...usuariosBaseSincronizados, ...usuariosDinamicos];

  // Filtrar según categoría seleccionada
  const usuariosFiltrados = todosLosPerfiles.filter((u) => {
    if (filtroCategoria === 'todos') return true;
    return u.categoria === filtroCategoria;
  });

  // Iniciar sesión y entrar inmediatamente con 1 clic
  const ingresarDirecto = async (u) => {
    setError('');
    setCargando(true);
    setUsuarioIngresando(u.correo);

    try {
      let resultado;
      if (u.pass) {
        try {
          resultado = await login(u.correo, u.pass);
        } catch {
          resultado = await switchUsuario(u.correo);
        }
      } else {
        resultado = await switchUsuario(u.correo);
      }

      if (resultado?.exito) {
        navigate('/dashboard');
      } else {
        setError(resultado?.mensaje || 'Error al autenticar.');
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error de conexión con el servidor API.');
    } finally {
      setCargando(false);
      setUsuarioIngresando('');
    }
  };

  // Iniciar sesión manual con formulario
  const handleSubmitManual = async (e) => {
    e.preventDefault();
    if (!form.correo || !form.password) {
      setError('Por favor ingresa tu correo y contraseña.');
      return;
    }
    setError('');
    setCargando(true);

    try {
      const resultado = await login(form.correo, form.password);
      if (resultado.exito) {
        navigate('/dashboard');
      } else {
        setError(resultado.mensaje || 'Credenciales inválidas.');
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error de conexión al servidor.');
    } finally {
      setCargando(false);
    }
  };

  // Enviar registro de nueva cuenta
  const handleRegistroSubmit = async (e) => {
    e.preventDefault();
    setErrorRegistro('');

    if (!formRegistro.nombre_completo.trim()) {
      setErrorRegistro('El nombre completo es obligatorio.');
      return;
    }
    if (!formRegistro.correo.trim()) {
      setErrorRegistro('El correo institucional es obligatorio.');
      return;
    }
    if (formRegistro.password.length < 6) {
      setErrorRegistro('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (formRegistro.password !== formRegistro.confirmarPassword) {
      setErrorRegistro('Las contraseñas no coinciden.');
      return;
    }

    setCargandoRegistro(true);

    try {
      const datosParaEnviar = {
        nombre: formRegistro.nombre_completo.trim(),
        nombre_completo: formRegistro.nombre_completo.trim(),
        correo: formRegistro.correo.trim().toLowerCase(),
        password: formRegistro.password,
        rol: formRegistro.rol,
        departamento: formRegistro.departamento.trim() || 'Comunidad Universitaria',
        matricula_o_clave: formRegistro.matricula_o_numero_empleado.trim() || undefined,
      };

      const respuesta = await registro(datosParaEnviar);
      if (respuesta.exito) {
        setExitoRegistro(true);
        setTimeout(() => {
          setModalRegistroAbierto(false);
          navigate('/dashboard');
        }, 1000);
      } else {
        setErrorRegistro(respuesta.mensaje || 'No se pudo completar el registro.');
      }
    } catch (err) {
      const msj =
        err.response?.data?.mensaje ||
        err.response?.data?.errores?.[0]?.mensaje ||
        'Error al conectar con el servidor para el registro.';
      setErrorRegistro(msj);
    } finally {
      setCargandoRegistro(false);
    }
  };

  return (
    <div className="login-page">
      {/* Fondos y efectos dinámicos */}
      <div className="login-page__bg-effects">
        <div className="login-page__orb login-page__orb--1" />
        <div className="login-page__orb login-page__orb--2" />
        <div className="login-page__orb login-page__orb--3" />
      </div>

      {/* Barra superior flotante con Botón de Modo Oscuro/Claro */}
      <header className="login-top-bar">
        <div className="login-top-bar__brand">
          <div className="campus-sidebar__logo-badge">
            <School size={20} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="campus-sidebar__title">campus</span>
            <span className="campus-sidebar__subtitle">GESTIÓN DE INCIDENCIAS</span>
          </div>
        </div>
        <div className="login-top-bar__actions">
          <ThemeToggle showLabel={true} />
        </div>
      </header>

      {/* Contenedor Principal Expandido y Elegante */}
      <main className="login-container">
        {/* Cabecera Principal */}
        <section className="login-header-section">
          <div className="login-header-badge">
            <Sparkles size={14} className="text-emerald-600" />
            <span>Mesa de Ayuda Universitaria • Campus UTM</span>
          </div>

          <h1 className="login-header-title">
            Portal de Acceso y Gestión de Incidencias
          </h1>
          <p className="login-header-subtitle">
            Selecciona tu perfil institucional para ingresar con un clic o inicia sesión con tus credenciales.
          </p>

          {/* Barra de Acciones: Botón Crear Cuenta y Botón Modo Manual */}
          <div className="login-actions-row">
            <button
              type="button"
              id="btn-crear-cuenta"
              onClick={() => {
                setErrorRegistro('');
                setModalRegistroAbierto(true);
              }}
              className="btn btn--primary login-action-btn shadow-md"
            >
              <UserPlus size={18} />
              <span>Crear una cuenta nueva</span>
            </button>

            <button
              type="button"
              id="btn-toggle-manual"
              onClick={() => setMostrarManual(!mostrarManual)}
              className="btn btn--secondary login-action-btn"
            >
              <KeyRound size={17} />
              <span>{mostrarManual ? 'Ocultar login manual' : 'Ingreso con contraseña manual'}</span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${mostrarManual ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </section>

        {/* Mensaje de Error Global si existe */}
        {error && (
          <div className="login-card__error max-w-2xl mx-auto mb-6" role="alert">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario de Login Manual Colapsable */}
        {mostrarManual && (
          <section className="manual-login-card mb-8">
            <div className="manual-login-card__header">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Lock size={16} className="text-emerald-600" />
                Ingresar con Correo y Contraseña
              </h2>
              <span className="text-xs text-muted">Acceso seguro institucional</span>
            </div>

            <form onSubmit={handleSubmitManual} className="manual-login-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="manual-correo" className="form-label">
                    <Mail size={15} />
                    Correo institucional
                  </label>
                  <input
                    id="manual-correo"
                    type="email"
                    required
                    className="form-input"
                    placeholder="ejemplo@utm.mx"
                    value={form.correo}
                    onChange={(e) => setForm({ ...form, correo: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="manual-pass" className="form-label">
                    <Lock size={15} />
                    Contraseña
                  </label>
                  <input
                    id="manual-pass"
                    type="password"
                    required
                    className="form-input"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setMostrarManual(false)}
                  className="btn btn--ghost btn--sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="btn btn--primary btn--sm"
                >
                  {cargando && !usuarioIngresando ? (
                    <span className="btn__loading">Verificando...</span>
                  ) : (
                    <>
                      <LogIn size={16} />
                      <span>Iniciar Sesión</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Sección de Recuadros de Usuario Organizados */}
        <section className="user-boxes-section">
          {/* Barra de Filtros por Categoría */}
          <div className="user-boxes-filters">
            <div className="user-boxes-filters__label">
              <span>Perfiles del campus:</span>
            </div>
            <div className="user-boxes-filters__tabs">
              <button
                type="button"
                className={`filter-tab ${filtroCategoria === 'todos' ? 'filter-tab--active' : ''}`}
                onClick={() => setFiltroCategoria('todos')}
              >
                Todos ({todosLosPerfiles.length})
              </button>
              <button
                type="button"
                className={`filter-tab ${filtroCategoria === 'gestion' ? 'filter-tab--active' : ''}`}
                onClick={() => setFiltroCategoria('gestion')}
              >
                Directivos, Coord & Admin
              </button>
              <button
                type="button"
                className={`filter-tab ${filtroCategoria === 'tecnico' ? 'filter-tab--active' : ''}`}
                onClick={() => setFiltroCategoria('tecnico')}
              >
                Cuadrilla Técnica
              </button>
              <button
                type="button"
                className={`filter-tab ${filtroCategoria === 'comunidad' ? 'filter-tab--active' : ''}`}
                onClick={() => setFiltroCategoria('comunidad')}
              >
                Reportantes (Docentes & Alumnos)
              </button>
            </div>
          </div>

          {/* Grid de Recuadros Interactivos */}
          <div className="user-boxes-grid">
            {usuariosFiltrados.map((u) => {
              const estaIngresando = cargando && usuarioIngresando === u.correo;
              const IconoRol = u.icono;

              return (
                <div
                  key={u.id}
                  onClick={() => !cargando && ingresarDirecto(u)}
                  className={`user-box ${u.colorCard} ${estaIngresando ? 'user-box--loading' : ''}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (!cargando) ingresarDirecto(u);
                    }
                  }}
                  title={`Clic para ingresar como ${u.nombre}`}
                >
                  <div className="user-box__top">
                    <div className={`user-box__avatar bg-gradient-to-br ${u.avatarGradient}`}>
                      <IconoRol size={20} className="text-white" />
                    </div>
                    <span className="user-box__badge">{u.rolBadge}</span>
                  </div>

                  <div className="user-box__body">
                    <h2 className="user-box__name">{u.nombre}</h2>
                    <p className="user-box__role-title">{u.tituloRol}</p>

                    <div className="user-box__email-pill">
                      <Mail size={13} className="shrink-0 text-muted" />
                      <span className="user-box__email-text">{u.correo}</span>
                    </div>

                    <p className="user-box__dept">
                      <Building size={12} className="shrink-0 text-muted" />
                      <span>{u.departamento}</span>
                    </p>
                  </div>

                  <div className="user-box__footer">
                    {estaIngresando ? (
                      <div className="user-box__loading-state">
                        <div className="loading-spinner loading-spinner--sm" />
                        <span>Entrando al sistema...</span>
                      </div>
                    ) : (
                      <div className="user-box__action-prompt">
                        <span>Entrar a este perfil</span>
                        <ArrowRight size={15} className="user-box__arrow" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer institucional */}
        <footer className="login-footer">
          <p>
            Universidad Tecnológica • Sistema NoSQL Cloud de Gestión de Incidencias
          </p>
          <span className="text-muted text-xs">Desarrollado por el equipo #5</span>
        </footer>
      </main>

      {/* Modal Crear Cuenta Nueva */}
      {modalRegistroAbierto && (
        <div
          className="modal-overlay"
          onClick={() => !cargandoRegistro && setModalRegistroAbierto(false)}
        >
          <div
            className="modal modal--registro"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal__header">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-600">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h2 className="modal__title">Crear Cuenta Institucional</h2>
                  <p className="text-xs text-muted">
                    Registra tus datos para acceder a la mesa de ayuda del campus
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setModalRegistroAbierto(false)}
                disabled={cargandoRegistro}
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            {errorRegistro && (
              <div className="modal__error flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorRegistro}</span>
              </div>
            )}

            {exitoRegistro ? (
              <div className="modal__body text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-lg font-bold text-[var(--color-text)]">
                  ¡Cuenta Creada Exitosamente!
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] mt-2">
                  Iniciando tu sesión y redirigiendo al dashboard...
                </p>
                <div className="loading-spinner mx-auto mt-4" />
              </div>
            ) : (
              <form onSubmit={handleRegistroSubmit} className="modal__form">
                <div className="modal__body modal__body--scroll">
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-nombre">
                      <IdCard size={15} />
                      Nombre completo *
                    </label>
                    <input
                      id="reg-nombre"
                      type="text"
                      required
                      className="form-input"
                      placeholder="Ej. Juan Pérez López"
                      value={formRegistro.nombre_completo}
                      onChange={(e) =>
                        setFormRegistro({ ...formRegistro, nombre_completo: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-correo">
                      <Mail size={15} />
                      Correo institucional *
                    </label>
                    <input
                      id="reg-correo"
                      type="email"
                      required
                      className="form-input"
                      placeholder="ejemplo@utmetropolitana.edu.mx"
                      value={formRegistro.correo}
                      onChange={(e) =>
                        setFormRegistro({ ...formRegistro, correo: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="reg-password">
                        <Lock size={15} />
                        Contraseña *
                      </label>
                      <input
                        id="reg-password"
                        type="password"
                        required
                        minLength={6}
                        className="form-input"
                        placeholder="Mínimo 6 caracteres"
                        value={formRegistro.password}
                        onChange={(e) =>
                          setFormRegistro({ ...formRegistro, password: e.target.value })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="reg-confirm">
                        <Lock size={15} />
                        Confirmar contraseña *
                      </label>
                      <input
                        id="reg-confirm"
                        type="password"
                        required
                        minLength={6}
                        className="form-input"
                        placeholder="Repetir contraseña"
                        value={formRegistro.confirmarPassword}
                        onChange={(e) =>
                          setFormRegistro({ ...formRegistro, confirmarPassword: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="reg-rol">
                        <GraduationCap size={15} />
                        Perfil en el campus *
                      </label>
                      <select
                        id="reg-rol"
                        className="form-select"
                        value={formRegistro.rol}
                        onChange={(e) =>
                          setFormRegistro({ ...formRegistro, rol: e.target.value })
                        }
                      >
                        <option value="reportante">Reportante (Estudiante / Docente)</option>
                        <option value="tecnico">Técnico de Soporte</option>
                        <option value="coordinador">Coordinador de Área</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="reg-matricula">
                        <IdCard size={15} />
                        Matrícula / Clave de empleado
                      </label>
                      <input
                        id="reg-matricula"
                        type="text"
                        className="form-input"
                        placeholder="Ej. 2026-TI-089 o EMP-045"
                        value={formRegistro.matricula_o_numero_empleado}
                        onChange={(e) =>
                          setFormRegistro({
                            ...formRegistro,
                            matricula_o_numero_empleado: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-depto">
                      <Building size={15} />
                      Departamento o Carrera (opcional)
                    </label>
                    <input
                      id="reg-depto"
                      type="text"
                      className="form-input"
                      placeholder="Ej. Ingeniería en Software / Servicios Escolares"
                      value={formRegistro.departamento}
                      onChange={(e) =>
                        setFormRegistro({ ...formRegistro, departamento: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="modal__footer">
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => setModalRegistroAbierto(false)}
                    disabled={cargandoRegistro}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={cargandoRegistro}
                  >
                    {cargandoRegistro ? (
                      <span className="btn__loading">Creando cuenta...</span>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        <span>Completar Registro e Ingresar</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
