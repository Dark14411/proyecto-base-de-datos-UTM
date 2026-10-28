// ═══════════════════════════════════════════════════════════════
// components/incidencias/DetalleIncidenciaModal.jsx
// Vista de detalle de incidencia con gestión unificada, detalle técnico,
// asignación de especialista, evidencias e historial cronológico.
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react';
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
  Monitor,
  Building,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  FileText,
  ShieldCheck,
} from 'lucide-react';

// ─── Catálogos de presentación ─────────────────────────────────
const ESTADOS = {
  abierta: { label: 'Abierta', clase: 'campus-badge--abierta', dot: 'bg-amber-500' },
  en_proceso: { label: 'En proceso', clase: 'campus-badge--proceso', dot: 'bg-blue-500' },
  en_espera: { label: 'En espera', clase: 'campus-badge--espera', dot: 'bg-gray-400' },
  resuelta: { label: 'Resuelta', clase: 'campus-badge--resuelta', dot: 'bg-emerald-500' },
  cerrada: { label: 'Cerrada', clase: 'campus-badge--cerrada', dot: 'bg-gray-500' },
};

const PRIORIDADES = {
  baja: 'badge--secondary',
  media: 'badge--info',
  alta: 'badge--warning',
  critica: 'badge--danger',
};

const CATEGORIAS = {
  computo_redes: 'Cómputo y redes',
  infraestructura: 'Infraestructura',
  academico: 'Servicios académicos',
};

const formatearFecha = (valor, conHora = true) => {
  if (!valor) return '—';
  const opciones = { year: 'numeric', month: 'short', day: 'numeric' };
  if (conHora) Object.assign(opciones, { hour: '2-digit', minute: '2-digit' });
  return new Date(valor).toLocaleString('es-MX', opciones);
};

const etiquetaLegible = (valor) =>
  typeof valor === 'string' ? valor.replace(/_/g, ' ') : valor;

const formatearNumeroReporte = (codigo) => {
  if (!codigo || typeof codigo !== 'string') return 'Reporte registrado';
  const partes = codigo.split('-');
  const num = partes[partes.length - 1];
  return num ? `Reporte #${num}` : 'Reporte registrado';
};

// ─── Sub-componentes de presentación ───────────────────────────
const Seccion = ({ icono: Icono, titulo, accion, children }) => (
  <section className="pt-5 mt-5 border-t border-[var(--color-border-subtle)] first:mt-0 first:pt-0 first:border-t-0">
    <div className="flex items-center justify-between gap-3 mb-3">
      <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
        <Icono size={14} /> {titulo}
      </h3>
      {accion}
    </div>
    {children}
  </section>
);

const InfoCard = ({ icono: Icono, tono, titulo, children }) => (
  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tono}`}>
      <Icono size={17} />
    </div>
    <div className="min-w-0 flex-1">
      <span className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-0.5">
        {titulo}
      </span>
      {children}
    </div>
  </div>
);

const Dato = ({ etiqueta, valor }) => {
  if (valor === undefined || valor === null || valor === '') return null;
  return (
    <div className="min-w-0">
      <span className="block text-[11px] text-[var(--color-text-muted)] mb-0.5">{etiqueta}</span>
      <strong className="block text-[13px] font-semibold text-[var(--color-text)] capitalize break-words">
        {valor}
      </strong>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
const DetalleIncidenciaModal = ({ incidencia: incInicial, onClose, onUpdated }) => {
  const { usuario } = useAuth();
  const [inc, setInc] = useState(incInicial);
  const [nuevoEstado, setNuevoEstado] = useState(incInicial?.estado || 'en_proceso');
  const [horasInput, setHorasInput] = useState('');
  const [notaSeguimiento, setNotaSeguimiento] = useState('');
  const [tecnicos, setTecnicos] = useState([]);
  const [tecnicoId, setTecnicoId] = useState('');
  const [nuevoTag, setNuevoTag] = useState('');
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState(null);

  const rolActual = (usuario?.rol || usuario?.rol_sistema || '').toLowerCase();
  const esDirectivo = rolActual === 'directivo';
  const esCoordinador = rolActual === 'coordinador';
  const esTecnico = rolActual === 'tecnico';
  const esReportante = rolActual === 'reportante';

  const puedeEditarSeguimiento = !esDirectivo && (esTecnico || esCoordinador);
  const puedeAsignarTecnico = !esDirectivo && esCoordinador;
  const puedeGestionarTags = !esDirectivo && (esTecnico || esCoordinador);
  const puedeSubirEvidencia =
    !esDirectivo &&
    (esTecnico ||
      esCoordinador ||
      (esReportante && inc.reportante?.correo?.toLowerCase() === usuario?.correo?.toLowerCase()));

  const cargarDetalle = useCallback(async () => {
    try {
      const { data } = await api.get(`/incidencias/${incInicial._id}`);
      if (data.datos) {
        setInc(data.datos);
        setNuevoEstado(data.datos.estado || 'en_proceso');
      }
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.response?.data?.mensaje || 'No se pudo cargar el detalle.' });
    }
  }, [incInicial._id]);

  useEffect(() => {
    cargarDetalle();
    if (puedeAsignarTecnico) {
      api
        .get('/usuarios/tecnicos')
        .then(({ data }) => setTecnicos(data.datos || []))
        .catch(() => setTecnicos([]));
    }
  }, [cargarDetalle, puedeAsignarTecnico]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const ejecutar = async (accion, mensajeOk) => {
    try {
      setCargando(true);
      setAviso(null);
      await accion();
      await cargarDetalle();
      onUpdated?.();
      window.dispatchEvent(new CustomEvent('incidencias-updated'));
      if (mensajeOk) setAviso({ tipo: 'ok', texto: mensajeOk });
      return true;
    } catch (error) {
      const d = error.response?.data;
      setAviso({
        tipo: 'error',
        texto: d?.mensaje || d?.errores?.[0]?.mensaje || 'Ocurrió un error al procesar la solicitud.',
      });
      return false;
    } finally {
      setCargando(false);
    }
  };

  // Guardar seguimiento unificado (Estado + Horas + Nota)
  const handleGuardarSeguimiento = async (e) => {
    e.preventDefault();
    const estadoAEnviar = nuevoEstado || inc.estado || 'en_proceso';
    const horasNum = Number(horasInput) || 0;
    const textoNota = notaSeguimiento.trim();

    if (estadoAEnviar === inc.estado && horasNum <= 0 && !textoNota) {
      setAviso({
        tipo: 'error',
        texto: 'Selecciona un nuevo estado, ingresa horas dedicadas o escribe una nota de seguimiento.',
      });
      return;
    }

    const comentarioFinal =
      textoNota ||
      `Actualización de estado a ${ESTADOS[estadoAEnviar]?.label || estadoAEnviar}${
        horasNum > 0 ? ` (+${horasNum} h)` : ''
      }`;

    const payload = {
      estado: estadoAEnviar,
      horas: horasNum,
      horas_invertidas: horasNum,
      comentario: comentarioFinal,
      descripcion: comentarioFinal,
    };

    const ok = await ejecutar(
      () => api.patch(`/incidencias/${inc._id}/estado`, payload),
      'Seguimiento guardado correctamente.'
    );

    if (ok) {
      setHorasInput('');
      setNotaSeguimiento('');
    }
  };

  // Asignar o reasignar técnico
  const handleAsignarTecnico = async (idSeleccionado) => {
    if (!idSeleccionado) return;
    const tec = tecnicos.find((t) => t._id === idSeleccionado);
    const ok = await ejecutar(
      () =>
        api.patch(`/incidencias/${inc._id}/tecnico`, {
          tecnico_id: idSeleccionado,
          nombre_tecnico: tec ? tec.nombre || tec.nombre_completo : '',
        }),
      'Técnico asignado correctamente.'
    );
    if (ok) setTecnicoId('');
  };

  // Gestión de etiquetas
  const agregarEtiqueta = async (e) => {
    e.preventDefault();
    const tag = nuevoTag.trim().toLowerCase().replace(/^#+/, '');
    if (!tag) return;
    if (inc.tags?.includes(tag)) {
      setAviso({ tipo: 'error', texto: `La etiqueta "${tag}" ya está registrada.` });
      return;
    }
    const ok = await ejecutar(() => api.patch(`/incidencias/${inc._id}/tags`, { tags: [tag] }));
    if (ok) setNuevoTag('');
  };

  const eliminarEtiqueta = (tag) =>
    ejecutar(() => api.patch(`/incidencias/${inc._id}/tags/eliminar`, { tag }));

  // Subir evidencia
  const subirArchivo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setAviso({ tipo: 'error', texto: 'El archivo supera el límite de 5 MB.' });
      return;
    }
    const formData = new FormData();
    formData.append('archivo', file);
    await ejecutar(
      () =>
        api.post(`/incidencias/${inc._id}/evidencias`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }),
      'Evidencia adjuntada correctamente.'
    );
  };

  // ─── Detalle Técnico Específico según categoría ──────────────
  const renderDetalleEspecifico = () => {
    const d = inc.detalle_especifico || {};

    if (inc.categoria === 'computo_redes') {
      return (
        <div className="mt-4 p-4 rounded-xl border bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200">
          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3 text-emerald-800 dark:text-emerald-300">
            <Monitor size={15} /> Especificaciones de Cómputo y Redes
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Dato etiqueta="Dirección IP" valor={d.direccion_ip} />
            <Dato etiqueta="Red / VLAN" valor={d.vlan} />
            <Dato etiqueta="Puerto de conexión" valor={d.puerto_uplink} />
            <Dato
              etiqueta="Equipos afectados"
              valor={d.equipos_afectados !== undefined && d.equipos_afectados !== null ? `${d.equipos_afectados} equipo(s)` : null}
            />
          </div>
        </div>
      );
    }

    if (inc.categoria === 'infraestructura') {
      const insumos = Array.isArray(d.insumos_requeridos)
        ? d.insumos_requeridos.filter(Boolean)
        : d.insumos_requeridos
        ? [d.insumos_requeridos]
        : [];

      return (
        <div className="mt-4 p-4 rounded-xl border bg-amber-50/70 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200">
          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3 text-amber-800 dark:text-amber-300">
            <Building size={15} /> Especificaciones de Infraestructura y Mantenimiento
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Dato etiqueta="Tipo de desperfecto" valor={etiquetaLegible(d.tipo_dano)} />
            <Dato etiqueta="Nivel de riesgo" valor={d.nivel_riesgo || d.riesgo_seguridad} />
            <Dato
              etiqueta="Apoyo externo / Contratista"
              valor={d.requiere_contratista !== undefined && d.requiere_contratista !== null ? (d.requiere_contratista ? 'Sí requiere' : 'No requiere') : null}
            />
            {insumos.length > 0 && (
              <div className="min-w-0">
                <span className="block text-[11px] text-[var(--color-text-muted)] mb-1">
                  Materiales e insumos
                </span>
                <div className="flex flex-wrap gap-1">
                  {insumos.map((ins, idx) => (
                    <span key={idx} className="badge badge--secondary text-[11px] py-0.5 px-2 capitalize">
                      {etiquetaLegible(ins)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (inc.categoria === 'academico') {
      const estAfectados = d.estudiantes_afectados ?? d.estudiantes_impactados ?? d.alumnos_afectados;
      return (
        <div className="mt-4 p-4 rounded-xl border bg-blue-50/70 border-blue-200 text-blue-900 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-200">
          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3 text-blue-800 dark:text-blue-300">
            <GraduationCap size={15} /> Especificaciones del Servicio Académico
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Dato etiqueta="Plataforma o sistema" valor={d.plataforma} />
            <Dato etiqueta="Clave de materia" valor={d.codigo_curso} />
            <Dato etiqueta="Periodo escolar" valor={d.periodo_escolar || d.periodo_academico} />
            <Dato
              etiqueta="Estudiantes afectados"
              valor={estAfectados !== undefined && estAfectados !== null ? `${estAfectados} alumno(s)` : null}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  const estado = ESTADOS[inc.estado] || { label: inc.estado, clase: 'campus-badge--espera', dot: 'bg-gray-400' };
  const nombreReportante = inc.reportante?.nombre || inc.reportante?.nombre_completo || 'Usuario del campus';
  const nombreTecnico =
    typeof inc.tecnico_asignado === 'string' && inc.tecnico_asignado
      ? inc.tecnico_asignado
      : inc.tecnico_asignado?.nombre || inc.tecnico_asignado?.nombre_completo || null;
  const evidencias = inc.evidencias_adjuntas || [];
  const historial = [...(inc.historial_seguimiento || [])].sort(
    (a, b) => new Date(b.fecha) - new Date(a.fecha)
  );

  const tieneResolucion = Boolean(inc.fecha_resolucion || inc.estado === 'resuelta' || inc.estado === 'cerrada');

  const tecnicosEspecialistas = tecnicos.filter((t) => {
    const esp = t.perfil_operativo?.especialidades?.length
      ? t.perfil_operativo.especialidades
      : t.especialidades || [];
    return esp.includes(inc.categoria);
  });
  const tecnicosOtros = tecnicos.filter((t) => !tecnicosEspecialistas.some((e) => e._id === t._id));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal--lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-incidencia-titulo"
      >
        {/* ─── Header ─────────────────────────────────────────── */}
        <div className="modal__header items-start gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-primary-light)] border border-[var(--color-primary-border)] px-2.5 py-0.5 rounded-md">
                {formatearNumeroReporte(inc.codigo_incidencia)} · {inc.ubicacion?.edificio || 'Campus'}
              </span>
              {esDirectivo && (
                <span className="badge badge--warning text-[11px] font-semibold">
                  Vista de supervisión (Solo lectura)
                </span>
              )}
            </div>
            <h2 id="detalle-incidencia-titulo" className="modal__title mt-2">
              {inc.titulo}
            </h2>
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span className={`campus-badge ${estado.clase}`}>
                <span className={`campus-badge__dot ${estado.dot}`} />
                {estado.label}
              </span>
              <span className={`badge ${PRIORIDADES[inc.prioridad] || 'badge--secondary'} capitalize`}>
                Prioridad {inc.prioridad}
              </span>
              <span className="badge badge--secondary">
                {CATEGORIAS[inc.categoria] || etiquetaLegible(inc.categoria)}
              </span>
            </div>
          </div>
          <button className="modal-close shrink-0" onClick={onClose} aria-label="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        {/* ─── Body ───────────────────────────────────────────── */}
        <div className="modal__body">
          {aviso && (
            <div
              className={`flex items-center gap-2 mb-4 px-3.5 py-2.5 rounded-lg text-xs font-medium border ${
                aviso.tipo === 'ok'
                  ? 'bg-[var(--color-success-bg)] text-[var(--color-success)] border-[var(--color-success)]/30'
                  : 'bg-[var(--color-danger-bg)] text-[var(--color-danger)] border-[var(--color-danger)]/30'
              }`}
              role="status"
            >
              {aviso.tipo === 'ok' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              <span className="flex-1">{aviso.texto}</span>
              <button type="button" onClick={() => setAviso(null)} aria-label="Cerrar aviso">
                <X size={13} />
              </button>
            </div>
          )}

          {/* Descripción y Detalle Técnico Específico */}
          <Seccion icono={FileText} titulo="Descripción y Detalle Técnico Específico">
            <div className="bg-[var(--color-bg)] p-4 rounded-xl border border-[var(--color-border)]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block mb-1">
                Descripción del reporte
              </span>
              <p className="text-sm leading-relaxed text-[var(--color-text)]">
                {inc.descripcion || 'Sin descripción detallada.'}
              </p>
            </div>
            {renderDetalleEspecifico()}
          </Seccion>

          {/* Información operativa */}
          <Seccion icono={User} titulo="Información de Ubicación y Atención">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Reportante */}
              <InfoCard
                icono={User}
                tono="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                titulo={`Reportado por · ${inc.reportante?.rol || 'Comunidad'}`}
              >
                <p className="text-sm font-semibold text-[var(--color-text)] truncate">
                  {nombreReportante}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] truncate">
                  {inc.reportante?.correo || 'Sin correo registrado'}
                </p>
              </InfoCard>

              {/* Ubicación */}
              <InfoCard
                icono={MapPin}
                tono="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                titulo="Ubicación en el campus"
              >
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  {inc.ubicacion?.edificio || 'Campus'}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Espacio: <strong>{inc.ubicacion?.aula_espacio || inc.ubicacion?.aula_o_zona || 'Área general'}</strong>
                </p>
              </InfoCard>

              {/* Técnico asignado */}
              <InfoCard
                icono={UserCheck}
                tono="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                titulo="Responsable técnico asignado"
              >
                <p
                  className={`text-sm font-semibold ${
                    nombreTecnico ? 'text-[var(--color-text)]' : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {nombreTecnico || 'Pendiente de asignación'}
                </p>
                {puedeAsignarTecnico && (
                  <div className="mt-2">
                    <select
                      id="sel-tecnico-asignar"
                      className="form-select text-xs py-1 px-2 w-full"
                      value={tecnicoId}
                      onChange={(e) => {
                        setTecnicoId(e.target.value);
                        handleAsignarTecnico(e.target.value);
                      }}
                      disabled={cargando}
                    >
                      <option value="">
                        {nombreTecnico ? 'Cambiar técnico responsable...' : 'Seleccionar técnico especialista...'}
                      </option>
                      {tecnicosEspecialistas.length > 0 && (
                        <optgroup label={`Especialistas en ${CATEGORIAS[inc.categoria] || 'esta área'}`}>
                          {tecnicosEspecialistas.map((t) => (
                            <option key={t._id} value={t._id}>
                              {t.nombre || t.nombre_completo} · {t.perfil_operativo?.departamento || 'Soporte'}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {tecnicosOtros.length > 0 && (
                        <optgroup label="Otros técnicos disponibles">
                          {tecnicosOtros.map((t) => (
                            <option key={t._id} value={t._id}>
                              {t.nombre || t.nombre_completo} · {t.perfil_operativo?.departamento || 'General'}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                )}
              </InfoCard>

              {/* Registro y Atención + Indicador de Retención (60 días) */}
              <InfoCard
                icono={Clock}
                tono="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                titulo="Registro y Tiempo de Atención"
              >
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  Registrada el {formatearFecha(inc.fecha_creacion || inc.fecha_reporte)}
                </p>
                <p className="text-xs font-semibold text-[var(--color-success)] mt-0.5">
                  {inc.horas_invertidas || 0} horas dedicadas
                  {tieneResolucion &&
                    ` · Resuelta el ${formatearFecha(inc.fecha_resolucion || new Date(), false)}`}
                </p>
                {tieneResolucion && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-[11px] font-medium">
                    <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                    <span>Depuración automática programada a los 60 días de su resolución</span>
                  </div>
                )}
              </InfoCard>
            </div>
          </Seccion>

          {/* Bloque único de Gestión de la incidencia */}
          {puedeEditarSeguimiento && (
            <Seccion icono={Clock} titulo="Gestión de la Incidencia">
              <form
                onSubmit={handleGuardarSeguimiento}
                className="p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="sel-estado-unificado"
                      className="form-label text-xs font-semibold mb-1 block"
                    >
                      Cambiar estado a:
                    </label>
                    <select
                      id="sel-estado-unificado"
                      className="form-select text-sm"
                      value={nuevoEstado}
                      onChange={(e) => setNuevoEstado(e.target.value)}
                    >
                      {Object.entries(ESTADOS).map(([valor, { label }]) => (
                        <option key={valor} value={valor}>
                          {label} {valor === inc.estado ? '(Estado actual)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="input-horas-unificado"
                      className="form-label text-xs font-semibold mb-1 block"
                    >
                      Horas dedicadas a sumar:
                    </label>
                    <input
                      id="input-horas-unificado"
                      type="number"
                      step="0.5"
                      min="0"
                      className="form-input text-sm"
                      placeholder="Ej. 1.5 horas"
                      value={horasInput}
                      onChange={(e) => setHorasInput(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="input-comentario-unificado"
                    className="form-label text-xs font-semibold mb-1 block"
                  >
                    Nota o comentario de seguimiento:
                  </label>
                  <textarea
                    id="input-comentario-unificado"
                    className="form-textarea text-sm"
                    rows={2}
                    placeholder="Describe las acciones realizadas, diagnóstico o avances de atención..."
                    value={notaSeguimiento}
                    onChange={(e) => setNotaSeguimiento(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
                  <span className="text-xs text-[var(--color-text-muted)]">
                    Guarda simultáneamente el nuevo estado, las horas invertidas y la nota en el historial.
                  </span>
                  <button
                    id="btn-guardar-seguimiento"
                    type="submit"
                    className="btn btn--primary flex items-center gap-1.5 whitespace-nowrap"
                    disabled={cargando}
                  >
                    <Send size={14} />
                    <span>Guardar seguimiento</span>
                  </button>
                </div>
              </form>
            </Seccion>
          )}

          {/* Etiquetas */}
          <Seccion icono={Tag} titulo="Etiquetas de Clasificación">
            {inc.tags?.length ? (
              <div className="flex flex-wrap gap-2">
                {inc.tags.map((tag) => (
                  <span key={tag} className="badge badge--primary gap-1.5 py-1 px-3 capitalize">
                    {etiquetaLegible(tag)}
                    {puedeGestionarTags && (
                      <button
                        type="button"
                        className="opacity-60 hover:opacity-100 hover:text-red-500 transition ml-1"
                        onClick={() => eliminarEtiqueta(tag)}
                        disabled={cargando}
                        title={`Quitar etiqueta "${tag}"`}
                        aria-label={`Quitar etiqueta ${tag}`}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs italic text-[var(--color-text-muted)]">Sin etiquetas registradas.</p>
            )}
            {puedeGestionarTags && (
              <form onSubmit={agregarEtiqueta} className="flex gap-2 mt-3 max-w-sm">
                <input
                  id="input-nueva-etiqueta"
                  className="form-input"
                  placeholder="Agregar etiqueta descriptiva..."
                  value={nuevoTag}
                  onChange={(e) => setNuevoTag(e.target.value)}
                  maxLength={40}
                />
                <button
                  type="submit"
                  className="btn btn--secondary whitespace-nowrap"
                  disabled={!nuevoTag.trim() || cargando}
                >
                  <Plus size={14} /> Añadir
                </button>
              </form>
            )}
          </Seccion>

          {/* Evidencias adjuntas */}
          <Seccion
            icono={Paperclip}
            titulo={`Archivos y Evidencias (${evidencias.length})`}
            accion={
              puedeSubirEvidencia ? (
                <label
                  className={`btn btn--secondary btn--sm cursor-pointer ${
                    cargando ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <Upload size={13} />
                  <span>Adjuntar evidencia</span>
                  <input
                    id="input-evidencia"
                    type="file"
                    className="hidden"
                    onChange={subirArchivo}
                    accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/quicktime"
                  />
                </label>
              ) : null
            }
          >
            {evidencias.length === 0 ? (
              <p className="text-xs italic text-[var(--color-text-muted)]">
                No hay archivos adjuntos. Formatos admitidos: imágenes (JPG, PNG, WEBP), PDF y video MP4 (máx. 5 MB).
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {evidencias.map((ev, i) => (
                  <a
                    key={`${ev.ruta_storage}-${i}`}
                    href={ev.url_storage}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[var(--color-primary)] transition"
                  >
                    <Paperclip size={15} className="text-[var(--color-primary)] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold text-[var(--color-text)] truncate">
                        {ev.nombre_archivo}
                      </span>
                      <span className="block text-[10px] text-[var(--color-text-muted)]">
                        {ev.peso_kb} KB · {formatearFecha(ev.fecha_carga, false)}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </Seccion>

          {/* Historial de atención (Línea de tiempo de solo lectura) */}
          <Seccion icono={MessageSquare} titulo={`Historial de Atención (${historial.length})`}>
            {historial.length === 0 ? (
              <p className="text-xs italic text-[var(--color-text-muted)]">
                Sin movimientos registrados en el historial.
              </p>
            ) : (
              <ol className="relative border-l-2 border-[var(--color-border)] ml-2 space-y-4">
                {historial.map((h, i) => {
                  const est = ESTADOS[h.estado_asignado];
                  return (
                    <li key={`${h.fecha}-${i}`} className="ml-5">
                      <span
                        className={`absolute -left-[7px] mt-1.5 w-3 h-3 rounded-full ring-4 ring-[var(--color-surface)] ${
                          est?.dot || 'bg-gray-400'
                        }`}
                      />
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[var(--color-text-muted)]">
                        <span className="font-semibold text-[var(--color-text)]">
                          {h.autor || 'Sistema'}
                        </span>
                        <span>·</span>
                        <span>{formatearFecha(h.fecha)}</span>
                        {est && <span className={`campus-badge ${est.clase} py-0`}>{est.label}</span>}
                      </div>
                      <p className="text-[13px] text-[var(--color-text-secondary)] mt-1 bg-[var(--color-bg)] p-2.5 rounded-lg border border-[var(--color-border)]">
                        {h.comentario}
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}
          </Seccion>
        </div>

        {/* ─── Footer ─────────────────────────────────────────── */}
        <div className="modal__footer">
          <button
            id="btn-cerrar-detalle"
            type="button"
            className="btn btn--secondary"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetalleIncidenciaModal;
