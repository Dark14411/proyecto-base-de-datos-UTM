import { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, Headset, Clock, MapPin, User, Loader2,
  Tag, X, FileText, MessageSquarePlus, Plus, Minus, AlertTriangle,
  CheckCircle2, Eye, Paperclip, Send, Building2,
  Wifi, GraduationCap
} from 'lucide-react';
import {
  listarIncidencias, buscarIncidencias, obtenerIncidencia,
  actualizarSeguimiento, gestionarTags, subirEvidenciaSimulada,
  actualizarIncidencia, eliminarIncidencia
} from '../services/api';

const ESTADOS = ['abierta', 'en proceso', 'en espera', 'resuelta', 'cerrada'];
const CATEGORIAS = ['computo_redes', 'infraestructura', 'academico'];
const EDIFICIOS = ['Edificio A', 'Edificio B', 'Edificio K', 'Biblioteca'];

const ESTADO_LABELS = {
  abierta: 'Abierta',
  'en proceso': 'En Proceso',
  'en espera': 'En Espera',
  resuelta: 'Resuelta',
  cerrada: 'Cerrada',
};

const CATEGORIA_INFO = {
  computo_redes: { label: 'Cómputo y Redes', icon: <Wifi size={13} />, badge: 'badge-computo_redes' },
  infraestructura: { label: 'Infraestructura', icon: <Building2 size={13} />, badge: 'badge-infraestructura' },
  academico: { label: 'Académico', icon: <GraduationCap size={13} />, badge: 'badge-academico' },
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function BandejaSoporte() {
  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtros, setFiltros] = useState({ categoria: '', estado: '', edificio: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);

  // Panel de acciones
  const [showSeguimiento, setShowSeguimiento] = useState(false);
  const [showTagPanel, setShowTagPanel] = useState(false);
  const [showEvidenciaPanel, setShowEvidenciaPanel] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [editForm, setEditForm] = useState(null);

  // Forms
  const [segForm, setSegForm] = useState({ estado: '', horas_invertidas: 0, comentario: '', autor: '' });
  const [tagForm, setTagForm] = useState({ accion: 'agregar', tag: '' });
  const [evidForm, setEvidForm] = useState({ nombre_archivo: '', tipo_mime: 'image/png', peso_kb: 500 });

  const fetchIncidencias = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listarIncidencias(filtros);
      setIncidencias(res.data.incidencias || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => { fetchIncidencias(); }, [fetchIncidencias]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return fetchIncidencias();
    setLoading(true);
    try {
      const res = await buscarIncidencias(searchQuery);
      setIncidencias(res.data.resultados || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openDetalle = async (id) => {
    setSelectedId(id);
    setDetalleLoading(true);
    setShowSeguimiento(false);
    setShowTagPanel(false);
    setShowEvidenciaPanel(false);
    setShowEditPanel(false);
    setActionMsg(null);
    try {
      const res = await obtenerIncidencia(id);
      setDetalle(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetalleLoading(false);
    }
  };

  const refreshDetalle = () => detalle && openDetalle(detalle._id);

  const handleSeguimiento = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await actualizarSeguimiento(detalle._id, segForm);
      setActionMsg({ type: 'success', text: 'Seguimiento actualizado correctamente.' });
      setShowSeguimiento(false);
      setSegForm({ estado: '', horas_invertidas: 0, comentario: '', autor: '' });
      refreshDetalle();
      fetchIncidencias();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.error || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTag = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await gestionarTags(detalle._id, tagForm);
      setActionMsg({ type: 'success', text: `Tag "${tagForm.tag}" ${tagForm.accion === 'agregar' ? 'agregado' : 'eliminado'}.` });
      setTagForm({ accion: 'agregar', tag: '' });
      refreshDetalle();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.error || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEvidencia = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await subirEvidenciaSimulada(detalle._id, evidForm);
      setActionMsg({ type: 'success', text: 'Evidencia adjuntada correctamente.' });
      setShowEvidenciaPanel(false);
      setEvidForm({ nombre_archivo: '', tipo_mime: 'image/png', peso_kb: 500 });
      refreshDetalle();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.error || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const startEdit = () => {
    setEditForm({
      titulo: detalle.titulo || '',
      descripcion: detalle.descripcion || '',
      prioridad: detalle.prioridad || 'media',
      reportante: { ...detalle.reportante },
      ubicacion: { ...detalle.ubicacion },
    });
    setShowEditPanel(true);
    setShowSeguimiento(false);
    setShowTagPanel(false);
    setShowEvidenciaPanel(false);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await actualizarIncidencia(detalle._id, editForm);
      setActionMsg({ type: 'success', text: 'Incidencia actualizada correctamente.' });
      setShowEditPanel(false);
      await openDetalle(detalle._id);
      await fetchIncidencias();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.detalle || err.response?.data?.error || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar la incidencia ${detalle.codigo_incidencia}? Esta acción no se puede deshacer.`)) return;
    setActionLoading(true);
    try {
      await eliminarIncidencia(detalle._id);
      setSelectedId(null);
      setDetalle(null);
      setActionMsg(null);
      await fetchIncidencias();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.error || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const closeAllPanels = () => {
    setShowSeguimiento(false);
    setShowTagPanel(false);
    setShowEvidenciaPanel(false);
    setShowEditPanel(false);
  };

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-primary-600 flex items-center justify-center shadow-lg shadow-accent-500/20">
            <Headset size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Bandeja de Soporte Técnico</h1>
            <p className="text-surface-200/40 text-xs mt-0.5">
              {incidencias.length} incidencia{incidencias.length !== 1 ? 's' : ''} encontrada{incidencias.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-5">
        {/* ══════ Panel Izquierdo: Lista ══════ */}
        <div className="w-full xl:w-[400px] xl:shrink-0 flex flex-col gap-3">
          {/* Buscador */}
          <div className="glass-card-static p-3 flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-200/25" />
              <input className="input-field pl-9 text-sm" placeholder="Buscar (full-text)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()} />
            </div>
            <button onClick={handleSearch} className="btn-primary py-2 px-3">
              <Search size={14} />
            </button>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary py-2 px-3 ${showFilters ? 'border-primary-500/40 text-primary-400' : ''}`}>
              <Filter size={14} />
            </button>
          </div>

          {/* Filtros */}
          {showFilters && (
            <div className="glass-card-static p-3 grid grid-cols-3 gap-2 animate-scaleIn">
              <select className="select-field text-xs" value={filtros.categoria}
                onChange={e => setFiltros(p => ({ ...p, categoria: e.target.value }))}>
                <option value="">Categoría</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{CATEGORIA_INFO[c].label}</option>)}
              </select>
              <select className="select-field text-xs" value={filtros.estado}
                onChange={e => setFiltros(p => ({ ...p, estado: e.target.value }))}>
                <option value="">Estado</option>
                {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_LABELS[e]}</option>)}
              </select>
              <select className="select-field text-xs" value={filtros.edificio}
                onChange={e => setFiltros(p => ({ ...p, edificio: e.target.value }))}>
                <option value="">Edificio</option>
                {EDIFICIOS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          )}

          {/* Lista de incidencias */}
          <div className="flex flex-col gap-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {loading ? (
              <div className="flex justify-center py-16"><div className="spinner"></div></div>
            ) : incidencias.length === 0 ? (
              <div className="text-center py-16 text-surface-200/20">
                <Search size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No se encontraron incidencias</p>
              </div>
            ) : (
              incidencias.map((inc) => (
                <button key={inc._id} onClick={() => openDetalle(inc._id)}
                  className={`stagger-item glass-card text-left p-4 w-full transition-all cursor-pointer group ${
                    selectedId === inc._id ? 'border-primary-500/40 bg-primary-500/[0.04]' : ''
                  }`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[0.62rem] font-mono text-primary-300/60 tracking-wider">{inc.codigo_incidencia}</span>
                    <span className={`badge badge-${inc.estado.replace(' ', '-')}`}>
                      {ESTADO_LABELS[inc.estado]}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-surface-200/90 mb-2 line-clamp-2 group-hover:text-white transition-colors leading-snug">
                    {inc.titulo}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge text-[0.58rem] py-0 ${CATEGORIA_INFO[inc.categoria]?.badge}`}>
                      {CATEGORIA_INFO[inc.categoria]?.icon}
                      <span className="ml-0.5">{CATEGORIA_INFO[inc.categoria]?.label}</span>
                    </span>
                    <span className="flex items-center gap-1 text-[0.62rem] text-surface-200/30">
                      <MapPin size={9} />{inc.ubicacion?.edificio}
                    </span>
                    <span className={`badge text-[0.58rem] py-0 badge-${inc.prioridad}`}>{inc.prioridad}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ══════ Panel Derecho: Detalle ══════ */}
        <div className="flex-1 min-w-0">
          {!selectedId ? (
            <div className="glass-card-static flex flex-col items-center justify-center py-24 text-surface-200/15">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4 border border-white/5">
                <Eye size={28} />
              </div>
              <p className="text-sm font-medium text-surface-200/25">Selecciona una incidencia</p>
              <p className="text-xs text-surface-200/15 mt-1">para ver su detalle completo</p>
            </div>
          ) : detalleLoading ? (
            <div className="glass-card-static flex items-center justify-center py-24">
              <div className="spinner"></div>
            </div>
          ) : detalle ? (
            <div className="animate-slideIn space-y-4">
              {/* Action Message */}
              {actionMsg && (
                <div className={`p-3 rounded-xl flex items-center gap-2 text-sm animate-scaleIn ${
                  actionMsg.type === 'success'
                    ? 'bg-success-500/8 border border-success-500/20 text-success-400'
                    : 'bg-danger-500/8 border border-danger-500/20 text-danger-400'
                }`}>
                  {actionMsg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                  <span className="text-xs">{actionMsg.text}</span>
                  <button className="ml-auto opacity-40 hover:opacity-100 transition-opacity" onClick={() => setActionMsg(null)}><X size={14} /></button>
                </div>
              )}

              {/* Header del detalle */}
              <div className="glass-card-static p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0 flex-1 mr-3">
                    <span className="text-[0.62rem] font-mono text-primary-300/60 tracking-wider">{detalle.codigo_incidencia}</span>
                    <h2 className="text-lg font-bold text-white mt-1 leading-snug">{detalle.titulo}</h2>
                  </div>
                  <div className="flex gap-1.5 flex-wrap justify-end shrink-0">
                    <span className={`badge badge-${detalle.estado.replace(' ', '-')}`}>{ESTADO_LABELS[detalle.estado]}</span>
                    <span className={`badge badge-${detalle.prioridad}`}>{detalle.prioridad}</span>
                  </div>
                </div>
                <p className="text-sm text-surface-200/50 mb-5 leading-relaxed">{detalle.descripcion}</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <InfoBlock icon={<User size={13} />} title={detalle.reportante?.nombre} subtitle={detalle.reportante?.rol} />
                  <InfoBlock icon={<MapPin size={13} />} title={detalle.ubicacion?.edificio} subtitle={detalle.ubicacion?.aula_espacio} />
                  <InfoBlock icon={<Clock size={13} />} title={`${detalle.horas_invertidas}h invertidas`} subtitle={formatDate(detalle.fecha_creacion)} />
                </div>

                {/* Tags */}
                {detalle.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-white/5">
                    {detalle.tags.map(t => <span key={t} className="tag">#{t}</span>)}
                  </div>
                )}

                {/* Detalle Específico */}
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-[0.62rem] text-primary-300/40 uppercase tracking-wider font-semibold mb-2.5">
                    Detalle Específico ({CATEGORIA_INFO[detalle.categoria]?.label})
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(detalle.detalle_especifico || {}).map(([k, v]) => (
                      <div key={k} className="bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.03]">
                        <span className="text-surface-200/30 text-[0.58rem] block mb-0.5">{k.replace(/_/g, ' ')}</span>
                        <p className="text-surface-200/70 font-medium text-xs font-mono">
                          {Array.isArray(v) ? v.join(', ') : typeof v === 'boolean' ? (v ? 'Sí' : 'No') : String(v)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-2 flex-wrap">
                <button onClick={startEdit} className="btn-secondary text-xs">
                  <FileText size={13} /> Editar
                </button>
                <button onClick={handleDelete} disabled={actionLoading} className="btn-danger text-xs">
                  <X size={13} /> Eliminar
                </button>
                <button onClick={() => { closeAllPanels(); setShowSeguimiento(!showSeguimiento); }}
                  className={`btn-secondary text-xs ${showSeguimiento ? 'border-primary-500/40 text-primary-400' : ''}`}>
                  <MessageSquarePlus size={13} /> Seguimiento
                </button>
                <button onClick={() => { closeAllPanels(); setShowTagPanel(!showTagPanel); }}
                  className={`btn-secondary text-xs ${showTagPanel ? 'border-primary-500/40 text-primary-400' : ''}`}>
                  <Tag size={13} /> Tags
                </button>
                <button onClick={() => { closeAllPanels(); setShowEvidenciaPanel(!showEvidenciaPanel); }}
                  className={`btn-secondary text-xs ${showEvidenciaPanel ? 'border-primary-500/40 text-primary-400' : ''}`}>
                  <Paperclip size={13} /> Evidencia
                </button>
              </div>

              {showEditPanel && editForm && (
                <form onSubmit={handleEdit} className="glass-card p-5 animate-scaleIn space-y-3">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <FileText size={15} className="text-primary-400" /> Editar incidencia
                  </h4>
                  <div>
                    <label className="text-xs text-surface-200/40 mb-1 block font-medium">Título *</label>
                    <input className="input-field text-sm" value={editForm.titulo}
                      onChange={e => setEditForm(p => ({ ...p, titulo: e.target.value }))} minLength="5" required />
                  </div>
                  <div>
                    <label className="text-xs text-surface-200/40 mb-1 block font-medium">Descripción *</label>
                    <textarea className="textarea-field text-sm" rows={3} value={editForm.descripcion}
                      onChange={e => setEditForm(p => ({ ...p, descripcion: e.target.value }))} minLength="10" required />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select className="select-field text-sm" value={editForm.prioridad}
                      onChange={e => setEditForm(p => ({ ...p, prioridad: e.target.value }))}>
                      {['baja', 'media', 'alta', 'critica'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <input className="input-field text-sm" value={editForm.ubicacion.aula_espacio || ''} placeholder="Aula / espacio"
                      onChange={e => setEditForm(p => ({ ...p, ubicacion: { ...p.ubicacion, aula_espacio: e.target.value } }))} required />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input className="input-field text-sm" value={editForm.reportante.nombre || ''} placeholder="Nombre del reportante"
                      onChange={e => setEditForm(p => ({ ...p, reportante: { ...p.reportante, nombre: e.target.value } }))} required />
                    <input className="input-field text-sm" type="email" value={editForm.reportante.correo || ''} placeholder="Correo"
                      onChange={e => setEditForm(p => ({ ...p, reportante: { ...p.reportante, correo: e.target.value } }))} required />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button type="button" className="btn-secondary text-xs" onClick={() => setShowEditPanel(false)}>Cancelar</button>
                    <button type="submit" disabled={actionLoading} className="btn-primary text-xs">
                      {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Guardar cambios
                    </button>
                  </div>
                </form>
              )}

              {/* Panel Seguimiento CU-03 */}
              {showSeguimiento && (
                <form onSubmit={handleSeguimiento} className="glass-card p-5 animate-scaleIn space-y-3">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <MessageSquarePlus size={15} className="text-primary-400" />
                    Actualizar Seguimiento
                    <span className="text-[0.55rem] bg-primary-500/12 text-primary-300/70 px-1.5 py-0.5 rounded-full font-mono ml-auto border border-primary-500/10">CU-03</span>
                  </h4>
                  <p className="text-[0.6rem] text-surface-200/30">Usa $set + $push + $inc atómicamente en una sola operación updateOne</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-surface-200/40 mb-1 block font-medium">Nuevo Estado *</label>
                      <select className="select-field text-sm" value={segForm.estado}
                        onChange={e => setSegForm(p => ({ ...p, estado: e.target.value }))} required>
                        <option value="">Seleccionar...</option>
                        {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_LABELS[e]}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-surface-200/40 mb-1 block font-medium">Horas Invertidas</label>
                      <input className="input-field text-sm" type="number" min="0" step="0.5"
                        value={segForm.horas_invertidas}
                        onChange={e => setSegForm(p => ({ ...p, horas_invertidas: Number(e.target.value) }))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-surface-200/40 mb-1 block font-medium">Autor *</label>
                    <input className="input-field text-sm" placeholder="Nombre del técnico / responsable"
                      value={segForm.autor} onChange={e => setSegForm(p => ({ ...p, autor: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="text-xs text-surface-200/40 mb-1 block font-medium">Comentario *</label>
                    <textarea className="textarea-field text-sm" rows={2} placeholder="Descripción de la acción realizada..."
                      value={segForm.comentario} onChange={e => setSegForm(p => ({ ...p, comentario: e.target.value }))} required />
                  </div>
                  <button type="submit" disabled={actionLoading} className="btn-primary text-xs">
                    {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Enviar Seguimiento
                  </button>
                </form>
              )}

              {/* Panel Tags CU-04 */}
              {showTagPanel && (
                <form onSubmit={handleTag} className="glass-card p-5 animate-scaleIn space-y-3">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Tag size={15} className="text-primary-400" />
                    Gestionar Tags
                    <span className="text-[0.55rem] bg-primary-500/12 text-primary-300/70 px-1.5 py-0.5 rounded-full font-mono ml-auto border border-primary-500/10">CU-04</span>
                  </h4>
                  <p className="text-[0.6rem] text-surface-200/30">Usa $addToSet para agregar y $pull para eliminar</p>
                  <div className="flex gap-2">
                    <select className="select-field text-sm w-36" value={tagForm.accion}
                      onChange={e => setTagForm(p => ({ ...p, accion: e.target.value }))}>
                      <option value="agregar">Agregar</option>
                      <option value="eliminar">Eliminar</option>
                    </select>
                    <input className="input-field text-sm flex-1" placeholder="Nombre del tag"
                      value={tagForm.tag} onChange={e => setTagForm(p => ({ ...p, tag: e.target.value }))} required />
                    <button type="submit" disabled={actionLoading} className="btn-primary text-xs px-3">
                      {tagForm.accion === 'agregar' ? <Plus size={14} /> : <Minus size={14} />}
                    </button>
                  </div>
                </form>
              )}

              {/* Panel Evidencia CU-02 */}
              {showEvidenciaPanel && (
                <form onSubmit={handleEvidencia} className="glass-card p-5 animate-scaleIn space-y-3">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Paperclip size={15} className="text-primary-400" />
                    Adjuntar Evidencia
                    <span className="text-[0.55rem] bg-primary-500/12 text-primary-300/70 px-1.5 py-0.5 rounded-full font-mono ml-auto border border-primary-500/10">CU-02</span>
                  </h4>
                  <p className="text-[0.6rem] text-surface-200/30">Usa $push sobre evidencias_adjuntas con URL simulada de Cloud Storage</p>
                  <div className="grid grid-cols-3 gap-2">
                    <input className="input-field text-sm" placeholder="nombre_archivo.png"
                      value={evidForm.nombre_archivo} onChange={e => setEvidForm(p => ({ ...p, nombre_archivo: e.target.value }))} required />
                    <select className="select-field text-sm" value={evidForm.tipo_mime}
                      onChange={e => setEvidForm(p => ({ ...p, tipo_mime: e.target.value }))}>
                      <option value="image/png">image/png</option>
                      <option value="image/jpeg">image/jpeg</option>
                      <option value="application/pdf">application/pdf</option>
                      <option value="text/plain">text/plain</option>
                      <option value="video/mp4">video/mp4</option>
                    </select>
                    <input className="input-field text-sm" type="number" placeholder="Peso KB"
                      value={evidForm.peso_kb} onChange={e => setEvidForm(p => ({ ...p, peso_kb: Number(e.target.value) }))} />
                  </div>
                  <button type="submit" disabled={actionLoading} className="btn-primary text-xs">
                    {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />} Adjuntar
                  </button>
                </form>
              )}

              {/* Historial de Seguimiento */}
              <div className="glass-card-static p-5">
                <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-primary-500/15 flex items-center justify-center">
                    <Clock size={12} className="text-primary-400" />
                  </div>
                  Historial de Seguimiento ({detalle.historial_seguimiento?.length || 0})
                </h4>
                {(detalle.historial_seguimiento || []).length === 0 ? (
                  <p className="text-xs text-surface-200/20 text-center py-4">Sin registros de seguimiento</p>
                ) : (
                  <div className="space-y-0">
                    {(detalle.historial_seguimiento || []).map((h, i) => (
                      <div key={i} className="timeline-item">
                        <div className="timeline-dot" style={{
                          background: h.estado_asignado === 'resuelta' ? '#4ade80'
                            : h.estado_asignado === 'cerrada' ? '#94a3b8'
                            : h.estado_asignado === 'en proceso' ? '#fbbf24'
                            : '#6366f1'
                        }} />
                        <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.03]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-surface-200/70">{h.autor}</span>
                            <span className="text-[0.58rem] text-surface-200/25">{formatDate(h.fecha)}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`badge text-[0.55rem] py-0 badge-${h.estado_asignado?.replace(' ', '-')}`}>
                              {ESTADO_LABELS[h.estado_asignado] || h.estado_asignado}
                            </span>
                            {h.horas_agregadas > 0 && (
                              <span className="text-[0.58rem] text-primary-300/40">+{h.horas_agregadas}h</span>
                            )}
                          </div>
                          <p className="text-xs text-surface-200/40 mt-1">{h.comentario}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Evidencias */}
              {detalle.evidencias_adjuntas?.length > 0 && (
                <div className="glass-card-static p-5">
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-primary-500/15 flex items-center justify-center">
                      <Paperclip size={12} className="text-primary-400" />
                    </div>
                    Evidencias ({detalle.evidencias_adjuntas.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {detalle.evidencias_adjuntas.map((ev, i) => (
                      <div key={i} className="bg-white/[0.02] rounded-lg p-3 flex items-center gap-3 border border-white/[0.03]">
                        <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
                          <FileText size={13} className="text-primary-400/70" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-surface-200/70 font-medium truncate">{ev.nombre_archivo}</p>
                          <p className="text-[0.58rem] text-surface-200/25">{ev.tipo_mime} · {ev.peso_kb} KB</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* Small helper component */
function InfoBlock({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-2.5 text-xs">
      <div className="w-7 h-7 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
        <span className="text-primary-400/70">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-surface-200/70 font-medium truncate">{title}</p>
        <p className="text-[0.58rem] text-surface-200/30 truncate">{subtitle}</p>
      </div>
    </div>
  );
}
