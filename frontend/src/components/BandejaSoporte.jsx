import { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, Headset, Clock, MapPin, User, Loader2,
  Tag, X, FileText, MessageSquarePlus, Plus, Minus, AlertTriangle,
  CheckCircle2, Eye, Paperclip, Send, Building2,
  Wifi, GraduationCap, ChevronRight, Hash, Sparkles, RefreshCw,
  Trash2, Shield, Code2, ArrowUpDown
} from 'lucide-react';
import {
  listarIncidencias,
  buscarIncidencias,
  obtenerIncidencia,
  actualizarSeguimiento,
  gestionarTags,
  subirEvidencia,
  subirEvidenciaSimulada,
  eliminarIncidencia
} from '../services/api';

const ESTADOS = [
  { value: '', label: 'Todos los estados' },
  { value: 'abierta', label: 'Abierta', color: '#f87171', bg: 'rgba(239, 68, 68, 0.1)' },
  { value: 'en proceso', label: 'En Proceso', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.1)' },
  { value: 'en espera', label: 'En Espera', color: '#a5b4fc', bg: 'rgba(99, 102, 241, 0.1)' },
  { value: 'resuelta', label: 'Resuelta', color: '#4ade80', bg: 'rgba(34, 197, 94, 0.1)' },
  { value: 'cerrada', label: 'Cerrada', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' },
];

const CATEGORIAS = [
  { value: '', label: 'Todas las categorías' },
  { value: 'computo_redes', label: 'Cómputo y Redes', icon: <Wifi size={14} />, color: '#38bdf8' },
  { value: 'infraestructura', label: 'Infraestructura', icon: <Building2 size={14} />, color: '#fb923c' },
  { value: 'academico', label: 'Académico', icon: <GraduationCap size={14} />, color: '#c084fc' },
];

const PRIORIDADES = [
  { value: 'baja', label: 'Baja', color: '#4ade80' },
  { value: 'media', label: 'Media', color: '#fbbf24' },
  { value: 'alta', label: 'Alta', color: '#fb923c' },
  { value: 'critica', label: 'Crítica', color: '#f87171' },
];

const EDIFICIOS = ['', 'Edificio A', 'Edificio B', 'Edificio K', 'Biblioteca'];

export default function BandejaSoporte() {
  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ categoria: '', estado: '', edificio: '' });
  const [busqueda, setBusqueda] = useState('');
  const [modoBusquedaFullText, setModoBusquedaFullText] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [drawerTab, setDrawerTab] = useState('seguimiento'); // 'seguimiento' | 'polimorfismo' | 'evidencias' | 'tags' | 'bson'

  // Forms inside drawer
  const [seguimientoForm, setSeguimientoForm] = useState({
    autor: 'Técnico de Guardia',
    estado_asignado: 'en proceso',
    comentario: '',
    horas_agregadas: 1,
  });
  const [nuevoTag, setNuevoTag] = useState('');
  const [archivoEvidencia, setArchivoEvidencia] = useState(null);
  const [descripcionEvidencia, setDescripcionEvidencia] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Load Incidencias
  const cargarIncidencias = useCallback(async () => {
    setLoading(true);
    try {
      if (busqueda.trim() && modoBusquedaFullText) {
        const res = await buscarIncidencias(busqueda.trim());
        setIncidencias(res.data || []);
      } else {
        const res = await listarIncidencias(filtros);
        setIncidencias(res.data?.incidencias || res.data || []);
      }
    } catch (err) {
      console.error('Error al cargar incidencias:', err);
    } finally {
      setLoading(false);
    }
  }, [filtros, busqueda, modoBusquedaFullText]);

  useEffect(() => {
    cargarIncidencias();
  }, [cargarIncidencias]);

  // Load Single Incident Detail
  const abrirDetalle = async (id) => {
    setSelectedId(id);
    setLoadingDetalle(true);
    setFeedbackMsg(null);
    try {
      const res = await obtenerIncidencia(id);
      setDetalle(res.data);
      setSeguimientoForm(prev => ({
        ...prev,
        estado_asignado: res.data.estado || 'en proceso'
      }));
    } catch (err) {
      console.error('Error al obtener detalle:', err);
    } finally {
      setLoadingDetalle(false);
    }
  };

  // Submit Seguimiento (CU-03)
  const handleSeguimiento = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await actualizarSeguimiento(selectedId, {
        autor: seguimientoForm.autor,
        estado_asignado: seguimientoForm.estado_asignado,
        comentario: seguimientoForm.comentario,
        horas_agregadas: Number(seguimientoForm.horas_agregadas) || 0,
      });
      setFeedbackMsg({ type: 'success', text: 'Bitácora actualizada y horas acumuladas con $push y $inc' });
      setSeguimientoForm(prev => ({ ...prev, comentario: '' }));
      // Reload both
      abrirDetalle(selectedId);
      cargarIncidencias();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.response?.data?.error || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Add Tag (CU-04)
  const handleAddTag = async () => {
    if (!nuevoTag.trim()) return;
    setActionLoading(true);
    try {
      await gestionarTags(selectedId, { accion: 'agregar', tag: nuevoTag.trim().toLowerCase() });
      setNuevoTag('');
      abrirDetalle(selectedId);
      cargarIncidencias();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Remove Tag (CU-04)
  const handleRemoveTag = async (tag) => {
    setActionLoading(true);
    try {
      await gestionarTags(selectedId, { accion: 'eliminar', tag });
      abrirDetalle(selectedId);
      cargarIncidencias();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Subir Evidencia (CU-02)
  const handleSubirEvidencia = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (archivoEvidencia) {
        const formData = new FormData();
        formData.append('evidencia', archivoEvidencia);
        formData.append('descripcion', descripcionEvidencia);
        await subirEvidencia(selectedId, formData);
      } else {
        // Simulada
        await subirEvidenciaSimulada(selectedId, {
          nombre_archivo: `log_evidencia_${Date.now()}.txt`,
          tipo_mime: 'text/plain',
          peso_kb: 45,
          url_storage: `https://storage.cloud.utm.mx/evidencias/${Date.now()}.txt`
        });
      }
      setFeedbackMsg({ type: 'success', text: 'Evidencia adjuntada exitosamente a evidencias_adjuntas' });
      setArchivoEvidencia(null);
      setDescripcionEvidencia('');
      abrirDetalle(selectedId);
      cargarIncidencias();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Eliminar Incidencia
  const handleEliminar = async () => {
    if (!window.confirm('¿Está seguro de eliminar esta incidencia permanentemente de MongoDB?')) return;
    setActionLoading(true);
    try {
      await eliminarIncidencia(selectedId);
      setSelectedId(null);
      setDetalle(null);
      cargarIncidencias();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Metric summaries
  const total = incidencias.length;
  const abiertas = incidencias.filter(i => i.estado === 'abierta').length;
  const enProceso = incidencias.filter(i => i.estado === 'en proceso').length;
  const resueltas = incidencias.filter(i => i.estado === 'resuelta' || i.estado === 'cerrada').length;
  const horasTotales = incidencias.reduce((acc, curr) => acc + (curr.horas_invertidas || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ── Top Header & Stats ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Bandeja de Soporte Técnico</h1>
            <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-primary-500/15 text-primary-300 font-mono font-bold border border-primary-500/20">
              CU-02 · CU-03 · CU-04 · CU-07
            </span>
          </div>
          <p className="text-surface-200/50 text-xs mt-0.5">
            Gestión en tiempo real del ciclo de vida, bitácoras de trabajo, evidencias y subdocumentos polimórficos
          </p>
        </div>

        <button
          onClick={cargarIncidencias}
          disabled={loading}
          className="btn-secondary flex items-center gap-2 py-2 px-3 text-xs self-start md:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-primary-400' : ''} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Stats Quick Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-surface-900/60 border border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-500/15 flex items-center justify-center text-primary-400 font-bold text-xs">
            {total}
          </div>
          <div>
            <p className="text-[0.65rem] text-surface-200/40 uppercase font-bold">Total Listadas</p>
            <p className="text-xs font-bold text-white">Incidencias</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-900/60 border border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-danger-500/15 flex items-center justify-center text-danger-400 font-bold text-xs">
            {abiertas}
          </div>
          <div>
            <p className="text-[0.65rem] text-surface-200/40 uppercase font-bold">Abiertas</p>
            <p className="text-xs font-bold text-white">Pendientes</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-900/60 border border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-warning-500/15 flex items-center justify-center text-warning-400 font-bold text-xs">
            {enProceso}
          </div>
          <div>
            <p className="text-[0.65rem] text-surface-200/40 uppercase font-bold">En Proceso</p>
            <p className="text-xs font-bold text-white">En Atención</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-900/60 border border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-success-500/15 flex items-center justify-center text-success-400 font-bold text-xs">
            {resueltas}
          </div>
          <div>
            <p className="text-[0.65rem] text-surface-200/40 uppercase font-bold">Resueltas</p>
            <p className="text-xs font-bold text-white">Cerradas</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-900/60 border border-white/5 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-8 h-8 rounded-lg bg-sky-500/15 flex items-center justify-center text-sky-400 font-bold text-xs">
            <Clock size={15} />
          </div>
          <div>
            <p className="text-[0.65rem] text-surface-200/40 uppercase font-bold">Horas de Trabajo</p>
            <p className="text-xs font-bold text-white font-mono">{horasTotales} hrs</p>
          </div>
        </div>
      </div>

      {/* ── Search Bar & Filters ── */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-200/40" />
            <input
              className="input-field pl-10 text-xs"
              placeholder={modoBusquedaFullText ? "Búsqueda Full-Text ($text index en español): switch, red, fuga, moodle..." : "Filtrar por texto en títulos o tags..."}
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && cargarIncidencias()}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setModoBusquedaFullText(!modoBusquedaFullText);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                modoBusquedaFullText
                  ? 'bg-primary-500/20 text-primary-200 border-primary-500/40 shadow-sm'
                  : 'bg-white/[0.03] text-surface-200/50 border-white/10 hover:text-white'
              }`}
            >
              <Sparkles size={13} className={modoBusquedaFullText ? 'text-primary-400' : ''} />
              <span>Full-Text Search (CU-05)</span>
            </button>

            <button
              type="button"
              onClick={cargarIncidencias}
              className="btn-primary py-2 px-4 text-xs font-semibold whitespace-nowrap"
            >
              Buscar
            </button>
          </div>
        </div>

        {/* Dropdown Filters (when not in fulltext mode) */}
        {!modoBusquedaFullText && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-white/5">
            <select
              className="select-field text-xs py-2"
              value={filtros.categoria}
              onChange={e => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}
            >
              {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>

            <select
              className="select-field text-xs py-2"
              value={filtros.estado}
              onChange={e => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
            >
              {ESTADOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>

            <select
              className="select-field text-xs py-2"
              value={filtros.edificio}
              onChange={e => setFiltros(prev => ({ ...prev, edificio: e.target.value }))}
            >
              <option value="">Todos los edificios</option>
              {EDIFICIOS.filter(Boolean).map(ed => <option key={ed} value={ed}>{ed}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* ── Main Content Grid: Tickets List + Detail Drawer ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Ticket List (Takes 7 or 12 cols depending on drawer) */}
        <div className={`${selectedId ? 'lg:col-span-6 xl:col-span-7' : 'lg:col-span-12'} space-y-3`}>
          {loading ? (
            <div className="py-20 text-center glass-card">
              <Loader2 size={32} className="animate-spin mx-auto text-primary-400 mb-2" />
              <p className="text-xs text-surface-200/50">Consultando MongoDB Atlas...</p>
            </div>
          ) : incidencias.length === 0 ? (
            <div className="py-16 text-center glass-card space-y-2">
              <Headset size={36} className="mx-auto text-surface-200/20" />
              <p className="text-sm font-semibold text-white">No se encontraron incidencias</p>
              <p className="text-xs text-surface-200/40">Intenta ajustar los filtros de búsqueda o registra una nueva incidencia.</p>
            </div>
          ) : (
            incidencias.map((inc) => {
              const isSelected = selectedId === inc._id;
              const catInfo = CATEGORIAS.find(c => c.value === inc.categoria);
              const estInfo = ESTADOS.find(s => s.value === inc.estado);
              const prioInfo = PRIORIDADES.find(p => p.value === inc.prioridad);

              return (
                <div
                  key={inc._id}
                  onClick={() => abrirDetalle(inc._id)}
                  className={`glass-card p-4 sm:p-5 transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'border-primary-500 shadow-lg shadow-primary-500/15 bg-primary-500/[0.05]'
                      : 'hover:border-white/20 hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-white bg-white/10 px-2 py-0.5 rounded border border-white/10">
                        {inc.codigo_incidencia}
                      </span>
                      <span
                        className="text-[0.68rem] px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1"
                        style={{ color: catInfo?.color, backgroundColor: `${catInfo?.color}15` }}
                      >
                        {catInfo?.icon}
                        {catInfo?.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span
                        className="text-[0.68rem] px-2 py-0.5 rounded-full font-bold uppercase"
                        style={{ color: prioInfo?.color, backgroundColor: `${prioInfo?.color}15` }}
                      >
                        {prioInfo?.label}
                      </span>
                      <span
                        className="text-[0.68rem] px-2.5 py-0.5 rounded-full font-semibold border capitalize"
                        style={{ color: estInfo?.color, backgroundColor: estInfo?.bg, borderColor: `${estInfo?.color}30` }}
                      >
                        {inc.estado}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-sm text-white group-hover:text-primary-300 transition-colors line-clamp-1">
                    {inc.titulo}
                  </h3>
                  <p className="text-xs text-surface-200/60 line-clamp-2 mt-1 leading-relaxed">
                    {inc.descripcion}
                  </p>

                  {/* Polymorphic Summary Pill */}
                  {inc.detalle_especifico && (
                    <div className="mt-3 py-1.5 px-2.5 rounded-lg bg-surface-950/70 border border-white/5 text-[0.7rem] font-mono text-surface-200/70 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {inc.categoria === 'computo_redes' && (
                        <>
                          <span>IP: <strong className="text-sky-300">{inc.detalle_especifico.direccion_ip}</strong></span>
                          <span>VLAN: <strong className="text-sky-300">{inc.detalle_especifico.vlan}</strong></span>
                          <span>Equipos: <strong className="text-sky-300">{inc.detalle_especifico.equipos_afectados}</strong></span>
                        </>
                      )}
                      {inc.categoria === 'infraestructura' && (
                        <>
                          <span>Daño: <strong className="text-orange-300">{inc.detalle_especifico.tipo_dano}</strong></span>
                          <span>Contratista: <strong className="text-orange-300">{inc.detalle_especifico.requiere_contratista ? 'Sí' : 'No'}</strong></span>
                        </>
                      )}
                      {inc.categoria === 'academico' && (
                        <>
                          <span>Plat: <strong className="text-purple-300">{inc.detalle_especifico.plataforma}</strong></span>
                          <span>Curso: <strong className="text-purple-300">{inc.detalle_especifico.codigo_curso}</strong></span>
                          <span>Impacto: <strong className="text-purple-300">{inc.detalle_especifico.estudiantes_impactados}</strong></span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Card Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-white/5 text-[0.7rem] text-surface-200/40">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-surface-200/40" />
                        {inc.ubicacion?.edificio} · {inc.ubicacion?.aula_espacio}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={12} className="text-surface-200/40" />
                        {inc.reportante?.nombre}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-surface-200/60 flex items-center gap-1">
                        <Clock size={11} />
                        {inc.horas_invertidas || 0}h
                      </span>
                      <ChevronRight size={14} className="text-surface-200/30 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Slide-over Detail & Operations Panel ── */}
        {selectedId && (
          <div className="lg:col-span-6 xl:col-span-5 glass-card p-5 space-y-5 sticky top-6 animate-fadeIn">
            {loadingDetalle ? (
              <div className="py-20 text-center">
                <Loader2 size={28} className="animate-spin mx-auto text-primary-400 mb-2" />
                <p className="text-xs text-surface-200/50">Cargando documento BSON...</p>
              </div>
            ) : detalle ? (
              <>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-extrabold text-white bg-primary-500/20 px-2 py-0.5 rounded border border-primary-500/30">
                        {detalle.codigo_incidencia}
                      </span>
                      <span className="text-[0.65rem] text-surface-200/40 font-mono">
                        _id: {detalle._id}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-white mt-1.5">{detalle.titulo}</h2>
                  </div>
                  <button
                    onClick={() => { setSelectedId(null); setDetalle(null); }}
                    className="p-1.5 text-surface-200/40 hover:text-white rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Feedback alert */}
                {feedbackMsg && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-fadeIn ${
                    feedbackMsg.type === 'success' ? 'bg-success-500/10 text-success-300 border border-success-500/20' : 'bg-danger-500/10 text-danger-300 border border-danger-500/20'
                  }`}>
                    {feedbackMsg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                    <span>{feedbackMsg.text}</span>
                  </div>
                )}

                {/* Tabs */}
                <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-surface-950/70 border border-white/5">
                  {[
                    { id: 'seguimiento', label: 'Seguimiento (CU-03)' },
                    { id: 'polimorfismo', label: 'Polimorfismo' },
                    { id: 'tags', label: 'Tags (CU-04)' },
                    { id: 'evidencias', label: 'Evidencias (CU-02)' },
                    { id: 'bson', label: 'BSON Crudo' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setDrawerTab(tab.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        drawerTab === tab.id
                          ? 'bg-primary-500 text-white shadow-sm'
                          : 'text-surface-200/50 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* ── Tab: Seguimiento (CU-03) ── */}
                {drawerTab === 'seguimiento' && (
                  <div className="space-y-4">
                    <form onSubmit={handleSeguimiento} className="p-4 rounded-xl bg-surface-950/50 border border-white/5 space-y-3">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquarePlus size={14} className="text-primary-400" />
                        Registrar Avance & Cambio de Estado
                      </h4>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[0.7rem] text-surface-200/50 mb-1 block">Nuevo Estado</label>
                          <select
                            className="select-field text-xs py-1.5"
                            value={seguimientoForm.estado_asignado}
                            onChange={e => setSeguimientoForm(prev => ({ ...prev, estado_asignado: e.target.value }))}
                          >
                            {ESTADOS.filter(s => s.value).map(s => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[0.7rem] text-surface-200/50 mb-1 block">Sumar Horas ($inc)</label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            className="input-field text-xs py-1.5 font-mono"
                            value={seguimientoForm.horas_agregadas}
                            onChange={e => setSeguimientoForm(prev => ({ ...prev, horas_agregadas: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[0.7rem] text-surface-200/50 mb-1 block">Técnico / Autor</label>
                        <input
                          className="input-field text-xs py-1.5"
                          value={seguimientoForm.autor}
                          onChange={e => setSeguimientoForm(prev => ({ ...prev, autor: e.target.value }))}
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[0.7rem] text-surface-200/50 mb-1 block">Comentario de la Intervención</label>
                        <textarea
                          rows={2}
                          className="textarea-field text-xs py-1.5"
                          placeholder="Detalle de actividades realizadas..."
                          value={seguimientoForm.comentario}
                          onChange={e => setSeguimientoForm(prev => ({ ...prev, comentario: e.target.value }))}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="btn-primary w-full py-2 text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                        <span>Actualizar en MongoDB ($push + $inc)</span>
                      </button>
                    </form>

                    {/* Timeline History */}
                    <div>
                      <h4 className="text-xs font-bold text-surface-200/50 uppercase tracking-wider mb-2">
                        Historial de Seguimiento ({detalle.historial_seguimiento?.length || 0})
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {(detalle.historial_seguimiento || []).map((h, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-surface-950/70 border border-white/5 text-xs space-y-1">
                            <div className="flex items-center justify-between text-[0.68rem] text-surface-200/40">
                              <span className="font-bold text-white">{h.autor}</span>
                              <span className="font-mono">
                                {new Date(h.fecha).toLocaleDateString()} {new Date(h.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-surface-200/80 text-[0.75rem]">{h.comentario}</p>
                            <div className="flex items-center gap-2 pt-1 text-[0.68rem]">
                              <span className="px-1.5 py-0.2 rounded bg-primary-500/10 text-primary-300 font-medium capitalize">
                                {h.estado_asignado}
                              </span>
                              {h.horas_agregadas > 0 && (
                                <span className="font-mono text-surface-200/40">+{h.horas_agregadas}h</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Tab: Polimorfismo ── */}
                {drawerTab === 'polimorfismo' && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-surface-950/60 border border-primary-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary-300 uppercase">
                          Subdocumento Polimórfico (detalle_especifico)
                        </span>
                        <span className="text-[0.65rem] px-2 py-0.5 rounded bg-primary-500/10 text-primary-300 font-mono">
                          {detalle.categoria}
                        </span>
                      </div>
                      <pre className="p-3 rounded-lg bg-surface-900 text-sky-300 font-mono text-[0.72rem] overflow-x-auto border border-white/5">
                        {JSON.stringify(detalle.detalle_especifico, null, 2)}
                      </pre>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 rounded-xl bg-surface-950/50 border border-white/5">
                        <span className="text-[0.68rem] text-surface-200/40 uppercase block mb-1">Reportante</span>
                        <p className="font-bold text-white">{detalle.reportante?.nombre}</p>
                        <p className="text-surface-200/60 text-[0.72rem]">{detalle.reportante?.rol}</p>
                        <p className="text-primary-300 text-[0.68rem] font-mono truncate">{detalle.reportante?.correo}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-surface-950/50 border border-white/5">
                        <span className="text-[0.68rem] text-surface-200/40 uppercase block mb-1">Ubicación</span>
                        <p className="font-bold text-white">{detalle.ubicacion?.edificio}</p>
                        <p className="text-surface-200/60 text-[0.72rem]">{detalle.ubicacion?.aula_espacio}</p>
                        <p className="text-surface-200/40 text-[0.68rem]">Horas acumuladas: {detalle.horas_invertidas}h</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Tab: Tags (CU-04) ── */}
                {drawerTab === 'tags' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-surface-950/50 border border-white/5 space-y-3">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Tag size={14} className="text-primary-400" />
                        Gestión de Tags con $addToSet y $pull
                      </h4>

                      <div className="flex gap-2">
                        <input
                          className="input-field text-xs py-1.5 flex-1"
                          placeholder="Nuevo tag (ej: cisco, red-wifi)..."
                          value={nuevoTag}
                          onChange={e => setNuevoTag(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        />
                        <button
                          type="button"
                          onClick={handleAddTag}
                          disabled={actionLoading}
                          className="btn-primary py-1.5 px-3 text-xs font-bold"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        {(detalle.tags || []).map(tag => (
                          <span key={tag} className="tag text-xs py-1 px-2.5">
                            #{tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              disabled={actionLoading}
                              className="ml-1 text-surface-200/40 hover:text-danger-400 transition-colors"
                              title="Remover con $pull"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Tab: Evidencias (CU-02) ── */}
                {drawerTab === 'evidencias' && (
                  <div className="space-y-4">
                    <form onSubmit={handleSubirEvidencia} className="p-4 rounded-xl bg-surface-950/50 border border-white/5 space-y-3">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Paperclip size={14} className="text-primary-400" />
                        Adjuntar Evidencia Multimedia (CU-02)
                      </h4>

                      <div>
                        <label className="text-[0.7rem] text-surface-200/50 mb-1 block">Seleccionar archivo (o simular subida)</label>
                        <input
                          type="file"
                          onChange={e => setArchivoEvidencia(e.target.files[0])}
                          className="text-xs text-surface-200/70 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-500/20 file:text-primary-300 hover:file:bg-primary-500/30 cursor-pointer"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="btn-secondary w-full py-2 text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <Paperclip size={13} />}
                        <span>{archivoEvidencia ? 'Subir Archivo Real' : 'Simular Carga de Evidencia'}</span>
                      </button>
                    </form>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {(detalle.evidencias_adjuntas || []).map((ev, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-surface-950/70 border border-white/5 text-xs flex items-center justify-between">
                          <div>
                            <p className="font-bold text-white truncate max-w-xs">{ev.nombre_archivo}</p>
                            <p className="text-[0.68rem] text-surface-200/40 font-mono">
                              {ev.tipo_mime} · {ev.peso_kb} KB
                            </p>
                          </div>
                          <span className="text-[0.65rem] px-2 py-0.5 rounded bg-white/5 font-mono text-surface-200/50">
                            {new Date(ev.fecha_carga).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Tab: BSON Crudo ── */}
                {drawerTab === 'bson' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[0.68rem] text-surface-200/40 uppercase font-mono font-bold">
                        BSON Document Output
                      </span>
                    </div>
                    <pre className="p-3 rounded-xl bg-surface-950 text-emerald-300 font-mono text-[0.72rem] overflow-x-auto max-h-80 border border-white/5">
                      {JSON.stringify(detalle, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Danger zone / Delete */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[0.68rem] text-surface-200/30">Operación CRUD</span>
                  <button
                    type="button"
                    onClick={handleEliminar}
                    disabled={actionLoading}
                    className="text-xs text-danger-400 hover:text-danger-300 flex items-center gap-1.5 transition-colors p-1"
                  >
                    <Trash2 size={13} />
                    <span>Eliminar Registro</span>
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
