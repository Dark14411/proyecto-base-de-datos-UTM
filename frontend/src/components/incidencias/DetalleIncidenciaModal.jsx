// ═══════════════════════════════════════════════════════════════
// components/incidencias/DetalleIncidenciaModal.jsx
// Vista de detalle completa con historial, evidencias y acciones RBAC
// Compatible al 100% con Figuras 2, 4, 5 y 6
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
  X,
  Clock,
  User,
  MapPin,
  Tag,
  Paperclip,
  MessageSquare,
  Upload,
  UserCheck,
  Send,
  Plus,
  Trash2,
  Cpu,
  Wrench,
  GraduationCap,
} from 'lucide-react';

const DetalleIncidenciaModal = ({ incidencia: incInicial, onClose, onUpdated }) => {
  const { usuario, tieneRol } = useAuth();
  const [inc, setInc] = useState(incInicial);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [horasInput, setHorasInput] = useState(0);
  const [nota, setNota] = useState('');
  const [tecnicos, setTecnicos] = useState([]);
  const [tecnicoId, setTecnicoId] = useState('');
  const [nuevoTag, setNuevoTag] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarDetalle();
    if (tieneRol('coordinador', 'administrador')) {
      api.get('/usuarios/tecnicos')
        .then(({ data }) => setTecnicos(data.datos || []))
        .catch(() => {});
    }
  }, []);

  const cargarDetalle = async () => {
    try {
      const { data } = await api.get(`/incidencias/${inc._id}`);
      setInc(data.datos);
    } catch (e) {
      console.error('Error cargando detalle:', e);
    }
  };

  const cambiarEstado = async () => {
    if (!nuevoEstado) return;
    try {
      setCargando(true);
      await api.patch(`/incidencias/${inc._id}/estado`, {
        estado: nuevoEstado,
        descripcion: `Estado actualizado a ${nuevoEstado}`,
        horas: Number(horasInput) || 0,
      });
      await cargarDetalle();
      setNuevoEstado('');
      setHorasInput(0);
      onUpdated();
    } catch (error) {
      alert(error.response?.data?.mensaje || 'Error al cambiar estado.');
    } finally {
      setCargando(false);
    }
  };

  const asignarTecnicoAction = async () => {
    if (!tecnicoId) return;
    try {
      setCargando(true);
      const tecSeleccionado = tecnicos.find(t => t._id === tecnicoId);
      await api.patch(`/incidencias/${inc._id}/tecnico`, {
        tecnico_id: tecnicoId,
        nombre_tecnico: tecSeleccionado ? (tecSeleccionado.nombre || tecSeleccionado.nombre_completo) : '',
      });
      await cargarDetalle();
      setTecnicoId('');
      onUpdated();
    } catch (error) {
      alert(error.response?.data?.mensaje || 'Error al asignar técnico.');
    } finally {
      setCargando(false);
    }
  };

  const agregarNota = async (e) => {
    e.preventDefault();
    if (!nota.trim()) return;
    try {
      await api.post(`/incidencias/${inc._id}/notas`, {
        descripcion: nota.trim(),
        horas: Number(horasInput) || 0,
        estado: inc.estado,
      });
      await cargarDetalle();
      setNota('');
      setHorasInput(0);
      onUpdated();
    } catch (error) {
      alert(error.response?.data?.mensaje || 'Error al agregar nota.');
    }
  };

  const agregarEtiqueta = async (e) => {
    e.preventDefault();
    if (!nuevoTag.trim()) return;
    try {
      await api.patch(`/incidencias/${inc._id}/tags`, { tags: [nuevoTag.trim().toLowerCase()] });
      await cargarDetalle();
      setNuevoTag('');
      onUpdated();
    } catch (error) {
      alert('Error al agregar tag.');
    }
  };

  const eliminarEtiqueta = async (tag) => {
    try {
      await api.patch(`/incidencias/${inc._id}/tags/eliminar`, { tag });
      await cargarDetalle();
      onUpdated();
    } catch (error) {
      alert('Error al eliminar tag.');
    }
  };

  const subirArchivo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo no debe exceder los 5 MB (RNF-02).');
      return;
    }

    const formData = new FormData();
    formData.append('archivo', file);

    try {
      setCargando(true);
      await api.post(`/incidencias/${inc._id}/evidencias`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await cargarDetalle();
      onUpdated();
    } catch (error) {
      alert(error.response?.data?.mensaje || 'Error al subir evidencia.');
    } finally {
      setCargando(false);
    }
  };

  const estadoColor = {
    abierta: 'badge--danger',
    en_proceso: 'badge--warning',
    en_progreso: 'badge--warning',
    en_espera: 'badge--info',
    resuelta: 'badge--success',
    cerrada: 'badge--secondary',
  };

  const renderDetalleEspecifico = () => {
    const d = inc.detalle_especifico || {};
    if (inc.categoria === 'computo_redes') {
      return (
        <div className="card bg-slate-900/50 p-3 rounded-lg border border-indigo-500/20 my-3">
          <h4 className="text-sm font-semibold text-indigo-400 flex items-center gap-1.5 mb-2">
            <Cpu size={16} /> Parámetros de Red y Cómputo
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div><span className="text-slate-400 block">Dirección IP:</span> <strong className="text-slate-200">{d.direccion_ip || 'N/A'}</strong></div>
            <div><span className="text-slate-400 block">VLAN:</span> <strong className="text-slate-200">{d.vlan || 'N/A'}</strong></div>
            <div><span className="text-slate-400 block">Puerto Uplink:</span> <strong className="text-slate-200">{d.puerto_uplink || 'N/A'}</strong></div>
            <div><span className="text-slate-400 block">Equipos afectados:</span> <strong className="text-slate-200">{d.equipos_afectados ?? 0}</strong></div>
          </div>
        </div>
      );
    }
    if (inc.categoria === 'infraestructura') {
      return (
        <div className="card bg-slate-900/50 p-3 rounded-lg border border-amber-500/20 my-3">
          <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-1.5 mb-2">
            <Wrench size={16} /> Parámetros de Infraestructura Física
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div><span className="text-slate-400 block">Tipo de Daño:</span> <strong className="text-slate-200">{d.tipo_dano || 'N/A'}</strong></div>
            <div><span className="text-slate-400 block">Nivel de Riesgo:</span> <strong className="text-slate-200 uppercase">{d.nivel_riesgo || 'medio'}</strong></div>
            <div><span className="text-slate-400 block">Contratista:</span> <strong className="text-slate-200">{d.requiere_contratista ? 'Sí requiere' : 'No requiere'}</strong></div>
            <div><span className="text-slate-400 block">Insumos:</span> <strong className="text-slate-200">{Array.isArray(d.insumos_requeridos) ? d.insumos_requeridos.join(', ') : d.insumos_requeridos}</strong></div>
          </div>
        </div>
      );
    }
    return (
      <div className="card bg-slate-900/50 p-3 rounded-lg border border-emerald-500/20 my-3">
        <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 mb-2">
          <GraduationCap size={16} /> Parámetros de Sistemas Académicos
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div><span className="text-slate-400 block">Plataforma:</span> <strong className="text-slate-200">{d.plataforma || 'N/A'}</strong></div>
          <div><span className="text-slate-400 block">Código Curso:</span> <strong className="text-slate-200">{d.codigo_curso || 'N/A'}</strong></div>
          <div><span className="text-slate-400 block">Periodo Escolar:</span> <strong className="text-slate-200">{d.periodo_escolar || d.periodo_academico || 'N/A'}</strong></div>
          <div><span className="text-slate-400 block">Estudiantes:</span> <strong className="text-slate-200">{d.estudiantes_afectados ?? d.alumnos_afectados ?? 0}</strong></div>
        </div>
      </div>
    );
  };

  const nombreReportante = inc.reportante?.nombre || inc.reportante?.nombre_completo || 'Usuario';
  const nombreTecnico = typeof inc.tecnico_asignado === 'string'
    ? inc.tecnico_asignado
    : (inc.tecnico_asignado?.nombre || inc.tecnico_asignado?.nombre_completo || 'Sin asignar');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <div>
            <code className="folio-badge folio-badge--lg">{inc.codigo_incidencia}</code>
            <h2 className="modal__title">{inc.titulo}</h2>
          </div>
          <button className="btn btn--ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal__body modal__body--scroll">
          {/* Insignias de Estado y Prioridad */}
          <div className="detail-badges">
            <span className={`badge ${estadoColor[inc.estado] || 'badge--secondary'}`}>
              {inc.estado?.replace('_', ' ').toUpperCase()}
            </span>
            <span className="badge badge--outline">Prioridad: {inc.prioridad?.toUpperCase()}</span>
            <span className="badge badge--outline">Categoría: {inc.categoria?.replace(/_/g, ' ').toUpperCase()}</span>
          </div>

          {/* Descripción */}
          <div className="detail-section">
            <h3 className="detail-section__title">Descripción</h3>
            <p className="detail-section__text">{inc.descripcion}</p>
          </div>

          {/* Detalle Polimórfico */}
          {renderDetalleEspecifico()}

          {/* Datos Operativos */}
          <div className="detail-grid">
            <div className="detail-item">
              <User size={16} />
              <div>
                <strong>Reportante ({inc.reportante?.rol || 'Docente'})</strong>
                <p>{nombreReportante}</p>
                <small>{inc.reportante?.correo}</small>
              </div>
            </div>
            <div className="detail-item">
              <MapPin size={16} />
              <div>
                <strong>Ubicación Estandarizada</strong>
                <p>{inc.ubicacion?.edificio}</p>
                <small>{inc.ubicacion?.aula_espacio || inc.ubicacion?.aula_o_zona}</small>
              </div>
            </div>
            <div className="detail-item">
              <UserCheck size={16} />
              <div>
                <strong>Técnico Asignado</strong>
                <p className={nombreTecnico === 'Sin asignar' ? 'text-amber-400' : 'text-emerald-400 font-semibold'}>
                  {nombreTecnico}
                </p>
              </div>
            </div>
            <div className="detail-item">
              <Clock size={16} />
              <div>
                <strong>Tiempos de Atención</strong>
                <p>{new Date(inc.fecha_creacion || inc.fecha_reporte || Date.now()).toLocaleString('es-MX')}</p>
                <small className="text-indigo-300 font-medium">{inc.horas_invertidas || 0} hrs invertidas</small>
              </div>
            </div>
          </div>

          {/* Acciones de Coordinador: Asignar Técnico (RF-09) */}
          {tieneRol('coordinador', 'administrador') && (
            <div className="card p-3 my-3 bg-indigo-950/20 border border-indigo-500/30 rounded-lg">
              <h4 className="text-sm font-semibold text-indigo-300 mb-2 flex items-center gap-1.5">
                <UserCheck size={16} /> Asignar / Reasignar Técnico (RF-09)
              </h4>
              <div className="flex gap-2">
                <select
                  className="form-select text-sm py-1"
                  value={tecnicoId}
                  onChange={(e) => setTecnicoId(e.target.value)}
                >
                  <option value="">Seleccionar técnico disponible...</option>
                  {tecnicos.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.nombre || t.nombre_completo} ({t.especialidades?.join(', ') || 'General'})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn--primary text-sm whitespace-nowrap"
                  disabled={!tecnicoId || cargando}
                  onClick={asignarTecnicoAction}
                >
                  Asignar
                </button>
              </div>
            </div>
          )}

          {/* Acciones de Técnico/Coordinador: Actualizar Estado Atómico (RF-03) */}
          {tieneRol('tecnico', 'coordinador', 'administrador') && (
            <div className="card p-3 my-3 bg-slate-900/60 border border-slate-700 rounded-lg">
              <h4 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                <Clock size={16} /> Actualización Atómica de Estado y Horas (RF-03)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <select
                  className="form-select text-sm py-1"
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                >
                  <option value="">Cambiar estado a...</option>
                  <option value="abierta">Abierta</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="en_espera">En Espera</option>
                  <option value="resuelta">Resuelta</option>
                  <option value="cerrada">Cerrada</option>
                </select>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  className="form-input text-sm py-1"
                  placeholder="Horas dedicadas"
                  value={horasInput || ''}
                  onChange={(e) => setHorasInput(parseFloat(e.target.value) || 0)}
                />
                <button
                  type="button"
                  className="btn btn--secondary text-sm"
                  disabled={!nuevoEstado || cargando}
                  onClick={cambiarEstado}
                >
                  Actualizar ($set + $inc)
                </button>
              </div>
            </div>
          )}

          {/* Gestión de Etiquetas con $addToSet y $pull (RF-04) */}
          <div className="detail-section">
            <h3 className="detail-section__title flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Tag size={16} /> Etiquetas ($addToSet / $pull)</span>
            </h3>
            <div className="tags-list flex flex-wrap gap-1.5 mb-2">
              {inc.tags?.map((tag, i) => (
                <span key={i} className="badge badge--secondary flex items-center gap-1 text-xs">
                  {tag}
                  {tieneRol('tecnico', 'coordinador', 'administrador') && (
                    <button
                      type="button"
                      className="hover:text-red-400 ml-1 text-slate-400"
                      onClick={() => eliminarEtiqueta(tag)}
                      title="Eliminar etiqueta"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
            {tieneRol('tecnico', 'coordinador', 'administrador') && (
              <form onSubmit={agregarEtiqueta} className="flex gap-2 max-w-sm">
                <input
                  className="form-input text-xs py-1"
                  placeholder="Nueva etiqueta..."
                  value={nuevoTag}
                  onChange={(e) => setNuevoTag(e.target.value)}
                />
                <button type="submit" className="btn btn--secondary text-xs px-2.5">
                  <Plus size={14} /> Añadir
                </button>
              </form>
            )}
          </div>

          {/* Carga y Lista de Evidencias (RF-02) */}
          <div className="detail-section">
            <h3 className="detail-section__title flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Paperclip size={16} /> Evidencias Adjuntas (RF-02)</span>
              {tieneRol('reportante', 'tecnico', 'coordinador', 'administrador') && (
                <label className="btn btn--secondary btn--sm cursor-pointer text-xs">
                  <Upload size={14} />
                  <span>Subir archivo</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={subirArchivo}
                    accept="image/*,.pdf,video/*"
                  />
                </label>
              )}
            </h3>

            {inc.evidencias_adjuntas?.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No hay evidencias adjuntas en esta incidencia.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {inc.evidencias_adjuntas.map((ev, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 text-xs">
                    <div className="truncate mr-2">
                      <a
                        href={ev.url_storage}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:underline font-medium truncate block"
                      >
                        {ev.nombre_archivo}
                      </a>
                      <span className="text-slate-500 text-[10px]">{ev.tipo_mime} • {ev.peso_kb} KB</span>
                    </div>
                    <a
                      href={ev.url_storage}
                      target="_blank"
                      rel="noreferrer"
                      className="badge badge--info text-[10px]"
                    >
                      Ver
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historial de Seguimiento (Timeline) */}
          <div className="detail-section">
            <h3 className="detail-section__title flex items-center gap-1.5">
              <MessageSquare size={16} /> Historial de Seguimiento
            </h3>
            <div className="timeline">
              {inc.historial_seguimiento?.map((entry, i) => {
                const autorStr = typeof entry.autor === 'string'
                  ? entry.autor
                  : (entry.autor?.nombre_completo || entry.autor?.nombre || 'Usuario');
                return (
                  <div key={i} className="timeline__item">
                    <div className="timeline__dot" />
                    <div className="timeline__content">
                      <div className="timeline__header">
                        <strong>{autorStr}</strong>
                        <span className="badge badge--outline badge--sm">
                          {entry.estado_asignado?.toUpperCase() || 'NOTA'}
                        </span>
                        <time>{new Date(entry.fecha).toLocaleString('es-MX')}</time>
                      </div>
                      <p>{entry.comentario || entry.descripcion}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Agregar Nota Técnica */}
            {tieneRol('tecnico', 'coordinador', 'administrador') && (
              <form onSubmit={agregarNota} className="mt-4 flex gap-2">
                <input
                  className="form-input text-xs"
                  placeholder="Escriba un comentario o nota técnica..."
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                />
                <button type="submit" className="btn btn--primary text-xs flex items-center gap-1">
                  <Send size={14} /> Registrar
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="modal__footer">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetalleIncidenciaModal;
