// ═══════════════════════════════════════════════════════════════
// pages/UsuariosPage.jsx — Gestión y Alta de Usuarios del Campus (Admin)
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
} from 'lucide-react';

const UsuariosPage = () => {
  const { tieneRol } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroRol, setFiltroRol] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Modal Crear Usuario
  const [modalAbierto, setModalAbierto] = useState(false);
  const [creando, setCreando] = useState(false);
  const [errorCrear, setErrorCrear] = useState('');
  const [exitoCrear, setExitoCrear] = useState('');

  const [form, setForm] = useState({
    nombre_completo: '',
    correo: '',
    password: '',
    rol: 'reportante',
    matricula_o_numero_empleado: '',
    departamento: '',
    telefono: '',
    especialidades: [],
  });

  useEffect(() => {
    cargarUsuarios();
  }, [filtroRol]);

  const cargarUsuarios = async () => {
    setCargando(true);
    try {
      const params = {};
      if (filtroRol) params.rol = filtroRol;
      if (busqueda.trim()) params.busqueda = busqueda.trim();

      const { data } = await api.get('/usuarios', { params });
      setUsuarios(data.datos.usuarios || []);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarUsuarios();
  };

  const alternarEstadoUsuario = async (u) => {
    const accion = u.cuenta_activa ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Seguro que deseas ${accion} la cuenta de ${u.nombre_completo}?`)) return;

    try {
      if (u.cuenta_activa) {
        await api.delete(`/usuarios/${u._id}`);
      } else {
        await api.put(`/usuarios/${u._id}`, { cuenta_activa: true });
      }
      cargarUsuarios();
    } catch (error) {
      alert(error.response?.data?.mensaje || `Error al ${accion} la cuenta.`);
    }
  };

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setErrorCrear('');
    setExitoCrear('');

    if (!form.nombre_completo.trim() || !form.correo.trim() || !form.password) {
      setErrorCrear('Por favor completa todos los campos obligatorios (*).');
      return;
    }

    if (form.password.length < 6) {
      setErrorCrear('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setCreando(true);
      const payload = {
        nombre_completo: form.nombre_completo.trim(),
        correo: form.correo.trim().toLowerCase(),
        password: form.password,
        rol: form.rol,
        matricula_o_numero_empleado: form.matricula_o_numero_empleado.trim() || undefined,
        departamento: form.departamento.trim() || 'Comunidad Universitaria',
        telefono: form.telefono.trim() || undefined,
        especialidades: form.rol === 'tecnico' ? form.especialidades : [],
      };

      const { data } = await api.post('/usuarios', payload);
      if (data.exito) {
        setExitoCrear(`Usuario ${data.datos.nombre_completo} creado exitosamente.`);
        setTimeout(() => {
          setModalAbierto(false);
          setExitoCrear('');
          setForm({
            nombre_completo: '',
            correo: '',
            password: '',
            rol: 'reportante',
            matricula_o_numero_empleado: '',
            departamento: '',
            telefono: '',
            especialidades: [],
          });
          cargarUsuarios();
        }, 1200);
      }
    } catch (err) {
      setErrorCrear(
        err.response?.data?.mensaje ||
        err.response?.data?.errores?.[0]?.mensaje ||
        'Error al crear usuario.'
      );
    } finally {
      setCreando(false);
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

  const totalActivos = usuarios.filter((u) => u.cuenta_activa !== false).length;

  return (
    <div className="page">
      {/* Header */}
      <div className="page__header flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="page__title flex items-center gap-2.5">
            <Users size={28} className="text-indigo-400" />
            Gestión y Control de Usuarios
          </h1>
          <p className="page__subtitle">
            Administración de cuentas, roles RBAC y permisos en UTM Desk ({usuarios.length} registrados, {totalActivos} activos)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn--secondary flex items-center gap-1.5"
            onClick={cargarUsuarios}
            title="Recargar lista"
          >
            <RefreshCw size={16} />
            <span>Actualizar</span>
          </button>
          {tieneRol('administrador') && (
            <button
              className="btn btn--primary flex items-center gap-1.5"
              onClick={() => setModalAbierto(true)}
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
                placeholder="Buscar por nombre o correo institucional..."
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
              <p className="mt-2 text-sm text-slate-400">Cargando directorio de usuarios...</p>
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
                    <th>Nombre Completo</th>
                    <th>Correo Electrónico</th>
                    <th>Rol en Campus</th>
                    <th>Departamento / Carrera</th>
                    <th>Estado</th>
                    {tieneRol('administrador') && <th className="text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => {
                    const activa = u.cuenta_activa !== false;
                    return (
                      <tr key={u._id} className={!activa ? 'opacity-60' : ''}>
                        <td className="table__title-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                              {u.nombre_completo?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <span className="font-medium text-slate-200 block">
                                {u.nombre_completo}
                              </span>
                              {u.matricula_o_numero_empleado && (
                                <span className="text-[11px] text-slate-400">
                                  ID: {u.matricula_o_numero_empleado}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="font-mono text-xs">{u.correo}</td>
                        <td>
                          <span className={`badge ${rolBadge[u.rol] || 'badge--secondary'}`}>
                            {u.rol?.toUpperCase()}
                          </span>
                          {u.especialidades?.length > 0 && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {u.especialidades.join(', ')}
                            </div>
                          )}
                        </td>
                        <td>{u.departamento || 'Comunidad Universitaria'}</td>
                        <td>
                          <span
                            className={`badge ${activa ? 'badge--success' : 'badge--danger'}`}
                          >
                            {activa ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        {tieneRol('administrador') && (
                          <td className="text-right">
                            <button
                              className={`btn btn--ghost btn--sm ${
                                activa ? 'text-rose-400 hover:bg-rose-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'
                              }`}
                              onClick={() => alternarEstadoUsuario(u)}
                              title={activa ? 'Desactivar cuenta' : 'Reactivar cuenta'}
                            >
                              {activa ? <UserX size={16} /> : <UserCheck size={16} />}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear Usuario */}
      {modalAbierto && (
        <div className="modal-overlay" onClick={() => setModalAbierto(false)}>
          <div className="modal max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <UserPlus size={22} />
                </div>
                <div>
                  <h2 className="modal__title">Crear Nuevo Usuario</h2>
                  <p className="text-xs text-slate-400">Registro administrativo con asignación de rol y especialidades</p>
                </div>
              </div>
              <button className="btn btn--ghost" onClick={() => setModalAbierto(false)}>
                <X size={20} />
              </button>
            </div>

            {errorCrear && (
              <div className="p-3 mx-6 mt-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                {errorCrear}
              </div>
            )}

            {exitoCrear && (
              <div className="p-3 mx-6 mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                {exitoCrear}
              </div>
            )}

            <form onSubmit={handleCrearUsuario}>
              <div className="modal__body space-y-4">
                <div className="form-group">
                  <label className="form-label" htmlFor="user-nombre">
                    Nombre completo *
                  </label>
                  <input
                    id="user-nombre"
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej. Ing. Carlos Mendoza Torres"
                    value={form.nombre_completo}
                    onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })}
                  />
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
                      Contraseña inicial *
                    </label>
                    <input
                      id="user-pass"
                      type="password"
                      required
                      minLength={6}
                      className="form-input"
                      placeholder="Mínimo 6 caracteres"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label" htmlFor="user-rol">
                      <Shield size={14} className="inline mr-1" />
                      Rol en el campus *
                    </label>
                    <select
                      id="user-rol"
                      className="form-select"
                      value={form.rol}
                      onChange={(e) => setForm({ ...form, rol: e.target.value })}
                    >
                      <option value="reportante">Reportante (Docente / Alumno)</option>
                      <option value="tecnico">Técnico Operativo</option>
                      <option value="coordinador">Coordinador de Soporte</option>
                      <option value="directivo">Directivo del Campus</option>
                      <option value="administrador">Administrador del Sistema</option>
                    </select>
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
                      placeholder="Ej. EMP-089 o 2026-TI-012"
                      value={form.matricula_o_numero_empleado}
                      onChange={(e) => setForm({ ...form, matricula_o_numero_empleado: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label" htmlFor="user-depto">
                      <Building size={14} className="inline mr-1" />
                      Departamento / Carrera
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

                {form.rol === 'tecnico' && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <label className="form-label text-amber-300 font-semibold mb-2 block">
                      <Wrench size={14} className="inline mr-1" />
                      Especialidades del Técnico:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'computo_redes', label: 'Cómputo y Redes' },
                        { id: 'infraestructura', label: 'Infraestructura' },
                        { id: 'academico', label: 'Sistemas Académicos' },
                      ].map((esp) => {
                        const seleccionada = form.especialidades.includes(esp.id);
                        return (
                          <button
                            key={esp.id}
                            type="button"
                            className={`badge cursor-pointer transition-all ${
                              seleccionada ? 'badge--primary ring-2 ring-indigo-400' : 'badge--secondary opacity-60'
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
                  disabled={creando}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn--primary" disabled={creando}>
                  {creando ? 'Creando...' : 'Crear Usuario'}
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
