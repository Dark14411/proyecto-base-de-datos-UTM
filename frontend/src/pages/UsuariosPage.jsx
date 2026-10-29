// ═══════════════════════════════════════════════════════════════
// pages/UsuariosPage.jsx — Gestión y Alta de Usuarios del Campus (usuarios_campus)
// Conectado en tiempo real a MongoDB Atlas (GET, POST, PATCH)
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  UserX,
  UserCheck,
  Search,
  X,
  Shield,
  Mail,
  Lock,
  Building,
  IdCard,
  Phone,
  RefreshCw,
  Wrench,
  Edit3,
  Briefcase,
} from 'lucide-react';

const FORM_INICIAL = {
  nombre: '',
  correo: '',
  password: '',
  rol_sistema: 'Reportante',
  rol: 'reportante',
  matricula_o_clave: '',
  departamento: '',
  cargo: '',
  telefono: '',
  especialidades: [],
  activo: true,
};

const MAP_ROL_SISTEMA = {
  reportante: 'Reportante',
  tecnico: 'Tecnico',
  coordinador: 'Coordinador',
  directivo: 'Directivo',
  administrador: 'Administrador',
};

const UsuariosPage = () => {
  const { tieneRol, recargarPerfiles, actualizarSesionSiCoincide } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroRol, setFiltroRol] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Modal Crear / Editar Usuario
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [exitoForm, setExitoForm] = useState('');
  const [form, setForm] = useState(FORM_INICIAL);

  useEffect(() => {
    cargarUsuarios();
  }, [filtroRol]);

  const cargarUsuarios = async () => {
    setCargando(true);
    try {
      const params = { limite: 100 };
      if (filtroRol) params.rol = filtroRol;
      if (busqueda.trim()) params.busqueda = busqueda.trim();

      const { data } = await api.get('/usuarios', { params });
      const lista = data.datos?.usuarios || [];
      setUsuarios(lista);
      localStorage.setItem('utm_desk_usuarios_campus', JSON.stringify(lista));
      recargarPerfiles();
    } catch (error) {
      console.error('Error cargando usuarios de MongoDB Atlas:', error);
      // Respaldo con localStorage únicamente si el backend estuviese apagado
      try {
        const respaldo = localStorage.getItem('utm_desk_usuarios_campus');
        if (respaldo) setUsuarios(JSON.parse(respaldo));
      } catch {
        // ignore
      }
    } finally {
      setCargando(false);
    }
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarUsuarios();
  };

  const abrirModalCrear = () => {
    setUsuarioEditando(null);
    setErrorForm('');
    setExitoForm('');
    setForm(FORM_INICIAL);
    setModalAbierto(true);
  };

  const abrirModalEditar = (u) => {
    setUsuarioEditando(u);
    setErrorForm('');
    setExitoForm('');
    const rolMin = (u.rol || u.rol_sistema || 'reportante').toLowerCase();
    setForm({
      nombre: u.nombre || u.nombre_completo || '',
      correo: u.correo || '',
      password: '',
      rol: rolMin,
      rol_sistema: u.rol_sistema || MAP_ROL_SISTEMA[rolMin] || 'Reportante',
      matricula_o_clave: u.matricula_o_clave || u.matricula_o_numero_empleado || '',
      departamento: u.perfil_operativo?.departamento || u.departamento || '',
      cargo: u.perfil_operativo?.cargo || u.rol_sistema || '',
      telefono: u.telefono || '',
      especialidades: u.perfil_operativo?.especialidades?.length
        ? u.perfil_operativo.especialidades
        : (u.especialidades || []),
      activo: u.activo !== false && u.cuenta_activa !== false,
    });
    setModalAbierto(true);
  };

  const alternarEstadoUsuario = async (u) => {
    const activa = u.activo !== false && u.cuenta_activa !== false;
    const accion = activa ? 'desactivar' : 'activar';
    const nombre = u.nombre || u.nombre_completo;
    if (!window.confirm(`¿Seguro que deseas ${accion} la cuenta de ${nombre}?`)) return;

    try {
      const nuevoEstado = !activa;
      const { data } = await api.patch(`/usuarios/${u._id}`, {
        activo: nuevoEstado,
        cuenta_activa: nuevoEstado,
      });
      if (data.exito && data.datos) {
        setUsuarios((prev) => prev.map((item) => (item._id === u._id ? data.datos : item)));
        actualizarSesionSiCoincide(data.datos);
      }
      await cargarUsuarios();
    } catch (error) {
      alert(error.response?.data?.mensaje || `Error al ${accion} la cuenta.`);
    }
  };

  const handleGuardarUsuario = async (e) => {
    e.preventDefault();
    setErrorForm('');
    setExitoForm('');

    if (!form.nombre.trim() || !form.correo.trim()) {
      setErrorForm('Por favor completa el nombre y el correo electrónico (*).');
      return;
    }

    if (!usuarioEditando && (!form.password || form.password.length < 6)) {
      setErrorForm('La contraseña inicial es obligatoria y debe tener al menos 6 caracteres.');
      return;
    }

    if (usuarioEditando && form.password && form.password.length < 6) {
      setErrorForm('Si deseas cambiar la contraseña, debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setGuardando(true);
      const rolMin = form.rol.toLowerCase();
      const rolSistema = MAP_ROL_SISTEMA[rolMin] || 'Reportante';
      const depto = form.departamento.trim() || 'Comunidad Universitaria';
      const cargo = form.cargo.trim() || rolSistema;
      const esp = rolMin === 'tecnico' || rolMin === 'coordinador' ? form.especialidades : [];

      const payload = {
        matricula_o_clave: form.matricula_o_clave.trim() || undefined,
        matricula_o_numero_empleado: form.matricula_o_clave.trim() || undefined,
        nombre: form.nombre.trim(),
        nombre_completo: form.nombre.trim(),
        correo: form.correo.trim().toLowerCase(),
        rol: rolMin,
        rol_sistema: rolSistema,
        activo: Boolean(form.activo),
        cuenta_activa: Boolean(form.activo),
        departamento: depto,
        telefono: form.telefono.trim() || undefined,
        especialidades: esp,
        perfil_operativo: {
          departamento: depto,
          especialidades: esp,
          cargo,
        },
      };

      if (form.password && form.password.trim().length >= 6) {
        payload.password = form.password.trim();
      }

      if (usuarioEditando) {
        // PATCH /api/usuarios/:id
        const { data } = await api.patch(`/usuarios/${usuarioEditando._id}`, payload);
        if (data.exito) {
          setExitoForm(`Usuario ${data.datos?.nombre || form.nombre} actualizado en MongoDB Atlas.`);
          setUsuarios((prev) =>
            prev.map((u) => (u._id === usuarioEditando._id ? data.datos : u))
          );
          actualizarSesionSiCoincide(data.datos);
          await cargarUsuarios();
          setTimeout(() => {
            setModalAbierto(false);
            setExitoForm('');
          }, 800);
        }
      } else {
        // POST /api/usuarios (201 Created)
        const { data } = await api.post('/usuarios', payload);
        if (data.exito) {
          const nombreCreado = data.datos?.nombre || form.nombre;
          setExitoForm(`Usuario ${nombreCreado} creado exitosamente en MongoDB Atlas.`);
          setUsuarios((prev) => [data.datos, ...prev]);
          await cargarUsuarios();
          setTimeout(() => {
            setModalAbierto(false);
            setExitoForm('');
            setForm(FORM_INICIAL);
          }, 800);
        }
      }
    } catch (err) {
      setErrorForm(
        err.response?.data?.mensaje ||
          err.response?.data?.errores?.[0]?.mensaje ||
          'Error al guardar usuario en MongoDB Atlas.'
      );
    } finally {
      setGuardando(false);
    }
  };

  const toggleEspecialidad = (esp) => {
    setForm((prev) => {
      const existe = prev.especialidades.includes(esp);
      return {
        ...prev,
        especialidades: existe
          ? prev.especialidades.filter((e) => e !== esp)
          : [...prev.especialidades, esp],
      };
    });
  };

  const rolBadge = {
    reportante: 'badge--info',
    tecnico: 'badge--warning',
    coordinador: 'badge--primary',
    directivo: 'badge--success',
    administrador: 'badge--danger',
  };

  const totalActivos = usuarios.filter((u) => u.activo !== false && u.cuenta_activa !== false).length;

  return (
    <div className="page">
      {/* Header */}
      <div className="page__header flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="page__title flex items-center gap-2.5">
            <Users size={28} className="text-emerald-700 dark:text-emerald-400" />
            Directorio de Usuarios del Campus
          </h1>
          <p className="page__subtitle">
            Administración de cuentas institucionales, roles y perfiles operativos ({usuarios.length} registrados, {totalActivos} activos)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn--secondary flex items-center gap-1.5"
            onClick={cargarUsuarios}
            title="Recargar desde MongoDB Atlas"
          >
            <RefreshCw size={16} />
            <span>Actualizar</span>
          </button>
          {tieneRol('administrador') && (
            <button
              className="btn btn--primary flex items-center gap-1.5"
              onClick={abrirModalCrear}
            >
              <UserPlus size={18} />
              <span>Nuevo Usuario</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="card">
        <div className="card__body">
          <form onSubmit={handleBuscar} className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px] relative">
              <input
                type="text"
                className="form-input pl-9"
                placeholder="Buscar por nombre, correo o matrícula/clave..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            <select
              className="form-select w-auto min-w-[180px]"
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
            >
              <option value="">Todos los roles</option>
              <option value="reportante">Reportante (Docente / Alumno)</option>
              <option value="tecnico">Técnico Operativo</option>
              <option value="coordinador">Coordinador de Soporte</option>
              <option value="directivo">Directivo</option>
              <option value="administrador">Administrador del Sistema</option>
            </select>

            <button type="submit" className="btn btn--secondary flex items-center gap-1.5">
              <Search size={16} />
              <span>Buscar</span>
            </button>

            {busqueda && (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setBusqueda('');
                  setTimeout(cargarUsuarios, 50);
                }}
              >
                Limpiar
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="card">
        <div className="card__body">
          {cargando ? (
            <div className="loading-screen">
              <div className="loading-spinner" />
              <p className="mt-2 text-sm text-slate-400">Cargando directorio de usuarios del campus...</p>
            </div>
          ) : usuarios.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Users size={48} className="mx-auto mb-3 opacity-30" />
              <p>No se encontraron usuarios con los criterios seleccionados.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nombre y Matrícula</th>
                    <th>Correo Institucional</th>
                    <th>Rol del Sistema</th>
                    <th>Perfil Operativo</th>
                    <th>Estado</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => {
                    const activa = u.activo !== false && u.cuenta_activa !== false;
                    const nombreMostrar = u.nombre || u.nombre_completo || 'Usuario';
                    const matricula = u.matricula_o_clave || u.matricula_o_numero_empleado;
                    const rolMin = (u.rol || u.rol_sistema || 'reportante').toLowerCase();
                    const depto = u.perfil_operativo?.departamento || u.departamento || 'Comunidad Universitaria';
                    const cargo = u.perfil_operativo?.cargo || u.rol_sistema || 'General';
                    const especialidades = u.perfil_operativo?.especialidades?.length
                      ? u.perfil_operativo.especialidades
                      : (u.especialidades || []);

                    return (
                      <tr key={u._id} className={!activa ? 'opacity-60' : ''}>
                        <td className="table__title-cell">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {nombreMostrar.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-[var(--color-text)] block truncate">
                                {nombreMostrar}
                              </span>
                              {matricula && (
                                <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                                  Clave: {matricula}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="font-mono text-xs">{u.correo}</td>
                        <td>
                          <span className={`badge ${rolBadge[rolMin] || 'badge--secondary'}`}>
                            {u.rol_sistema || rolMin.toUpperCase()}
                          </span>
                          {especialidades.length > 0 && (
                            <div className="text-[10px] text-[var(--color-text-muted)] mt-1 flex flex-wrap gap-1">
                              {especialidades.map((esp) => (
                                <span key={esp} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 capitalize">
                                  {esp.replace(/_/g, ' ')}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="block text-xs font-medium text-[var(--color-text)]">{depto}</span>
                          <span className="block text-[11px] text-[var(--color-text-muted)]">Cargo: {cargo}</span>
                        </td>
                        <td>
                          <span className={`badge ${activa ? 'badge--success' : 'badge--danger'}`}>
                            {activa ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                              onClick={() => abrirModalEditar(u)}
                              title="Editar usuario"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              type="button"
                              className={`btn btn--ghost btn--sm ${
                                activa
                                  ? 'text-rose-500 hover:bg-rose-500/10'
                                  : 'text-emerald-600 hover:bg-emerald-500/10'
                              }`}
                              onClick={() => alternarEstadoUsuario(u)}
                              title={activa ? 'Desactivar cuenta' : 'Reactivar cuenta'}
                            >
                              {activa ? <UserX size={16} /> : <UserCheck size={16} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear / Editar Usuario */}
      {modalAbierto && (
        <div className="modal-overlay" onClick={() => !guardando && setModalAbierto(false)}>
          <div className="modal max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  {usuarioEditando ? <Edit3 size={22} /> : <UserPlus size={22} />}
                </div>
                <div>
                  <h2 className="modal__title">
                    {usuarioEditando ? `Editar Usuario: ${usuarioEditando.nombre}` : 'Crear Nuevo Usuario'}
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Completa la información de la cuenta institucional
                  </p>
                </div>
              </div>
              <button className="btn btn--ghost" onClick={() => setModalAbierto(false)}>
                <X size={20} />
              </button>
            </div>

            {errorForm && (
              <div className="p-3 mx-6 mt-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
                {errorForm}
              </div>
            )}

            {exitoForm && (
              <div className="p-3 mx-6 mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                {exitoForm}
              </div>
            )}

            <form onSubmit={handleGuardarUsuario}>
              <div className="modal__body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-group md:col-span-2">
                    <label className="form-label" htmlFor="user-nombre">
                      Nombre completo *
                    </label>
                    <input
                      id="user-nombre"
                      type="text"
                      required
                      className="form-input"
                      placeholder="Ej. Ing. Carlos Mendoza Torres"
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="user-matricula">
                      <IdCard size={14} className="inline mr-1" />
                      Matrícula / Clave
                    </label>
                    <input
                      id="user-matricula"
                      type="text"
                      className="form-input"
                      placeholder="Ej. EMP-UTM-050"
                      value={form.matricula_o_clave}
                      onChange={(e) => setForm({ ...form, matricula_o_clave: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label" htmlFor="user-correo">
                      <Mail size={14} className="inline mr-1" />
                      Correo institucional *
                    </label>
                    <input
                      id="user-correo"
                      type="email"
                      required
                      className="form-input"
                      placeholder="usuario@utmetropolitana.edu.mx"
                      value={form.correo}
                      onChange={(e) => setForm({ ...form, correo: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="user-pass">
                      <Lock size={14} className="inline mr-1" />
                      {usuarioEditando ? 'Nueva contraseña (opcional)' : 'Contraseña inicial *'}
                    </label>
                    <input
                      id="user-pass"
                      type="password"
                      required={!usuarioEditando}
                      minLength={6}
                      className="form-input"
                      placeholder={usuarioEditando ? 'Dejar en blanco para conservar' : 'Mínimo 6 caracteres'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label" htmlFor="user-rol">
                      <Shield size={14} className="inline mr-1" />
                      Rol en el sistema *
                    </label>
                    <select
                      id="user-rol"
                      className="form-select"
                      value={form.rol}
                      onChange={(e) => {
                        const nuevoRol = e.target.value;
                        setForm({
                          ...form,
                          rol: nuevoRol,
                          rol_sistema: MAP_ROL_SISTEMA[nuevoRol] || 'Reportante',
                        });
                      }}
                    >
                      <option value="reportante">Reportante (Docente / Alumno / Administrativo)</option>
                      <option value="tecnico">Técnico (Cuadrilla Operativa)</option>
                      <option value="coordinador">Coordinador (Mesa de Ayuda)</option>
                      <option value="directivo">Directivo (Consulta y Analítica)</option>
                      <option value="administrador">Administrador (Gestión del Sistema)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="user-cargo">
                      <Briefcase size={14} className="inline mr-1" />
                      Cargo o puesto
                    </label>
                    <input
                      id="user-cargo"
                      type="text"
                      className="form-input"
                      placeholder="Ej. Docente, Estudiante, Técnico de Redes"
                      value={form.cargo}
                      onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label" htmlFor="user-depto">
                      <Building size={14} className="inline mr-1" />
                      Departamento o área
                    </label>
                    <input
                      id="user-depto"
                      type="text"
                      className="form-input"
                      placeholder="Ej. Tecnologías de la Información"
                      value={form.departamento}
                      onChange={(e) => setForm({ ...form, departamento: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="user-tel">
                      <Phone size={14} className="inline mr-1" />
                      Teléfono / Extensión
                    </label>
                    <input
                      id="user-tel"
                      type="text"
                      className="form-input"
                      placeholder="Ej. 999-123-4567 Ext. 104"
                      value={form.telefono}
                      onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    />
                  </div>
                </div>

                {(form.rol === 'tecnico' || form.rol === 'coordinador') && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <label className="form-label text-emerald-800 dark:text-emerald-300 font-semibold mb-2 block">
                      <Wrench size={14} className="inline mr-1" />
                      Especialidades de atención:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'computo_redes', label: 'Cómputo y Redes' },
                        { id: 'infraestructura', label: 'Infraestructura y Mantenimiento' },
                        { id: 'academico', label: 'Servicios Académicos' },
                      ].map((esp) => {
                        const seleccionada = form.especialidades.includes(esp.id);
                        return (
                          <button
                            key={esp.id}
                            type="button"
                            className={`badge cursor-pointer transition-all ${
                              seleccionada
                                ? 'badge--primary ring-2 ring-emerald-500'
                                : 'badge--secondary opacity-60'
                            }`}
                            onClick={() => toggleEspecialidad(esp.id)}
                          >
                            {esp.label} {seleccionada && '✓'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal__footer">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setModalAbierto(false)}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn--primary" disabled={guardando}>
                  {guardando
                    ? 'Guardando en Atlas...'
                    : usuarioEditando
                    ? 'Guardar Cambios'
                    : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosPage;
