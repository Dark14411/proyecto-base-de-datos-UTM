import { useState } from 'react';
import {
  Send, Wifi, Building2, GraduationCap, AlertTriangle, CheckCircle2,
  User, Mail, Briefcase, MapPin, Tag, Loader2, X, Plus, FileText,
  Zap, Shield, Hash
} from 'lucide-react';
import { crearIncidencia } from '../services/api';

const CATEGORIAS = [
  { value: 'computo_redes', label: 'Cómputo y Redes', desc: 'Equipos, red, software', icon: <Wifi size={20} />, gradient: 'from-sky-500 to-blue-600' },
  { value: 'infraestructura', label: 'Infraestructura', desc: 'Edificios, instalaciones', icon: <Building2 size={20} />, gradient: 'from-orange-500 to-red-600' },
  { value: 'academico', label: 'Académico', desc: 'Plataformas, cursos', icon: <GraduationCap size={20} />, gradient: 'from-violet-500 to-purple-600' },
];

const PRIORIDADES = [
  { value: 'baja', label: 'Baja', color: '#4ade80', bgColor: 'rgba(34, 197, 94, 0.08)' },
  { value: 'media', label: 'Media', color: '#fbbf24', bgColor: 'rgba(245, 158, 11, 0.08)' },
  { value: 'alta', label: 'Alta', color: '#fb923c', bgColor: 'rgba(249, 115, 22, 0.08)' },
  { value: 'critica', label: 'Crítica', color: '#f87171', bgColor: 'rgba(239, 68, 68, 0.1)' },
];

const EDIFICIOS = ['Edificio A', 'Edificio B', 'Edificio K', 'Biblioteca'];

const initialForm = {
  titulo: '',
  descripcion: '',
  categoria: '',
  prioridad: 'media',
  reportante: { nombre: '', rol: '', correo: '' },
  ubicacion: { edificio: '', aula_espacio: '' },
  tags: [],
  detalle_especifico: {},
};

export default function FormularioIncidencia() {
  const [form, setForm] = useState(initialForm);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const updateNested = (parent, field, value) =>
    setForm(prev => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }));
  const updateDetalle = (field, value) =>
    setForm(prev => ({ ...prev, detalle_especifico: { ...prev.detalle_especifico, [field]: value } }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      updateField('tags', [...form.tags, t]);
      setTagInput('');
    }
  };

  const removeTag = (tag) => updateField('tags', form.tags.filter(t => t !== tag));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      const payload = { ...form };

      // Convertir campos numéricos del detalle_especifico
      if (form.categoria === 'computo_redes' && payload.detalle_especifico.equipos_afectados) {
        payload.detalle_especifico.equipos_afectados = parseInt(payload.detalle_especifico.equipos_afectados);
      }
      if (form.categoria === 'academico' && payload.detalle_especifico.estudiantes_impactados) {
        payload.detalle_especifico.estudiantes_impactados = parseInt(payload.detalle_especifico.estudiantes_impactados);
      }

      const res = await crearIncidencia(payload);
      setResultado(res.data);
      setForm(initialForm);
    } catch (err) {
      setError(err.response?.data || { error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const categoriaSeleccionada = CATEGORIAS.find(c => c.value === form.categoria);

  return (
    <div className="form-page max-w-4xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Plus size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Registrar Nueva Incidencia</h1>
            <p className="text-surface-200/40 text-xs mt-0.5">
              Formulario polimórfico · Los campos se adaptan según la categoría seleccionada
            </p>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {resultado && (
        <div className="mb-6 p-4 rounded-xl bg-success-500/8 border border-success-500/20 flex items-start gap-3 animate-scaleIn">
          <div className="w-8 h-8 rounded-lg bg-success-500/15 flex items-center justify-center shrink-0">
            <CheckCircle2 size={16} className="text-success-400" />
          </div>
          <div className="flex-1">
            <p className="text-success-400 font-semibold text-sm">¡Incidencia creada exitosamente!</p>
            <p className="text-success-400/60 text-xs mt-1">
              Folio: <span className="font-mono font-bold text-success-400">{resultado.incidencia?.codigo_incidencia}</span>
            </p>
          </div>
          <button onClick={() => setResultado(null)} className="text-success-400/40 hover:text-success-400 transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-danger-500/8 border border-danger-500/20 flex items-start gap-3 animate-scaleIn">
          <div className="w-8 h-8 rounded-lg bg-danger-500/15 flex items-center justify-center shrink-0">
            <AlertTriangle size={16} className="text-danger-400" />
          </div>
          <div className="flex-1">
            <p className="text-danger-400 font-semibold text-sm">Error de validación</p>
            <p className="text-danger-400/60 text-xs mt-1 font-mono">{JSON.stringify(error.detalle || error.error)}</p>
          </div>
          <button onClick={() => setError(null)} className="text-danger-400/40 hover:text-danger-400 transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Categoría ── */}
        <div className="glass-card p-6 glow-accent">
          <label className="text-xs font-semibold text-surface-200/40 uppercase tracking-wider mb-4 block">
            Categoría de Incidencia *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {CATEGORIAS.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => {
                  updateField('categoria', cat.value);
                  updateField('detalle_especifico', {});
                }}
                className={`relative p-5 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2.5 cursor-pointer overflow-hidden group ${
                  form.categoria === cat.value
                    ? 'border-primary-400/40 shadow-lg shadow-primary-500/10'
                    : 'border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                }`}
              >
                {/* Background gradient when selected */}
                {form.categoria === cat.value && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-10`}></div>
                )}
                <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  form.categoria === cat.value
                    ? `bg-gradient-to-br ${cat.gradient} text-white shadow-md`
                    : 'bg-white/5 text-surface-200/40 group-hover:text-surface-200/60 group-hover:bg-white/8'
                }`}>
                  {cat.icon}
                </div>
                <div className="relative text-center">
                  <span className={`text-xs font-semibold block transition-colors ${
                    form.categoria === cat.value ? 'text-white' : 'text-surface-200/50'
                  }`}>
                    {cat.label}
                  </span>
                  <span className={`text-[0.6rem] transition-colors ${
                    form.categoria === cat.value ? 'text-white/50' : 'text-surface-200/25'
                  }`}>
                    {cat.desc}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Información General ── */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary-500/15 flex items-center justify-center">
              <FileText size={13} className="text-primary-400" />
            </div>
            Información General
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-surface-200/40 mb-1.5 block font-medium">Título *</label>
              <input
                className="input-field"
                placeholder="Descripción breve del problema..."
                value={form.titulo}
                onChange={e => updateField('titulo', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs text-surface-200/40 mb-1.5 block font-medium">Descripción detallada *</label>
              <textarea
                className="textarea-field"
                placeholder="Explique el problema con el mayor detalle posible..."
                rows={4}
                value={form.descripcion}
                onChange={e => updateField('descripcion', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs text-surface-200/40 mb-2 block font-medium">Prioridad *</label>
              <div className="grid grid-cols-4 gap-2">
                {PRIORIDADES.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => updateField('prioridad', p.value)}
                    className={`py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                      form.prioridad === p.value
                        ? 'shadow-sm'
                        : 'border-white/5 bg-white/[0.02] text-surface-200/35 hover:bg-white/[0.04]'
                    }`}
                    style={form.prioridad === p.value ? {
                      color: p.color,
                      backgroundColor: p.bgColor,
                      borderColor: `${p.color}40`,
                    } : {}}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Reportante y Ubicación ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary-500/15 flex items-center justify-center">
                <User size={13} className="text-primary-400" />
              </div>
              Reportante
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-surface-200/40 mb-1.5 block font-medium">Nombre completo *</label>
                <input className="input-field" placeholder="Ej: Ing. Roberto Méndez"
                  value={form.reportante.nombre}
                  onChange={e => updateNested('reportante', 'nombre', e.target.value)} required />
              </div>
              <div>
                <label className="text-xs text-surface-200/40 mb-1.5 block font-medium">Rol *</label>
                <input className="input-field" placeholder="Ej: Coordinador de TI"
                  value={form.reportante.rol}
                  onChange={e => updateNested('reportante', 'rol', e.target.value)} required />
              </div>
              <div>
                <label className="text-xs text-surface-200/40 mb-1.5 block font-medium">Correo electrónico *</label>
                <input className="input-field" type="email" placeholder="correo@utm.mx"
                  value={form.reportante.correo}
                  onChange={e => updateNested('reportante', 'correo', e.target.value)} required />
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary-500/15 flex items-center justify-center">
                <MapPin size={13} className="text-primary-400" />
              </div>
              Ubicación
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-surface-200/40 mb-1.5 block font-medium">Edificio *</label>
                <select className="select-field"
                  value={form.ubicacion.edificio}
                  onChange={e => updateNested('ubicacion', 'edificio', e.target.value)} required>
                  <option value="">Seleccionar edificio...</option>
                  {EDIFICIOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-surface-200/40 mb-1.5 block font-medium">Aula / Espacio *</label>
                <input className="input-field" placeholder="Ej: Aula 201, Laboratorio 3"
                  value={form.ubicacion.aula_espacio}
                  onChange={e => updateNested('ubicacion', 'aula_espacio', e.target.value)} required />
              </div>
            </div>

            {/* Tags */}
            <div className="mt-5 pt-4 border-t border-white/5">
              <label className="text-xs text-surface-200/40 mb-1.5 block font-medium">Etiquetas</label>
              <div className="flex gap-2">
                <input className="input-field flex-1" placeholder="Agregar tag..."
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                <button type="button" onClick={addTag} className="btn-secondary py-2 px-3">
                  <Tag size={14} />
                </button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {form.tags.map(tag => (
                    <span key={tag} className="tag">
                      #{tag}
                      <button type="button" onClick={() => removeTag(tag)} className="ml-0.5">
                        <X size={10} className="opacity-40 hover:opacity-100 transition-opacity" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Detalle Específico (Polimórfico) ── */}
        {form.categoria && (
          <div className="glass-card p-6 animate-scaleIn glow-accent">
            <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
              <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${categoriaSeleccionada?.gradient} flex items-center justify-center`}>
                <Zap size={12} className="text-white" />
              </div>
              <span>Detalle Específico — {categoriaSeleccionada?.label}</span>
              <span className="text-[0.58rem] bg-primary-500/12 text-primary-300/80 px-2 py-0.5 rounded-full font-medium ml-auto border border-primary-500/10">
                Polimórfico
              </span>
            </h3>

            {form.categoria === 'computo_redes' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-surface-200/40 mb-1.5 block font-medium">Dirección IP *</label>
                  <input className="input-field font-mono" placeholder="10.0.1.1"
                    value={form.detalle_especifico.direccion_ip || ''}
                    onChange={e => updateDetalle('direccion_ip', e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs text-surface-200/40 mb-1.5 block font-medium">VLAN *</label>
                  <input className="input-field font-mono" placeholder="VLAN-100"
                    value={form.detalle_especifico.vlan || ''}
                    onChange={e => updateDetalle('vlan', e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs text-surface-200/40 mb-1.5 block font-medium">Puerto Uplink *</label>
                  <input className="input-field font-mono" placeholder="GigabitEthernet1/0/1"
                    value={form.detalle_especifico.puerto_uplink || ''}
                    onChange={e => updateDetalle('puerto_uplink', e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs text-surface-200/40 mb-1.5 block font-medium">Equipos Afectados *</label>
                  <input className="input-field" type="number" min="0" placeholder="15"
                    value={form.detalle_especifico.equipos_afectados || ''}
                    onChange={e => updateDetalle('equipos_afectados', e.target.value)} required />
                </div>
              </div>
            )}

            {form.categoria === 'infraestructura' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-surface-200/40 mb-1.5 block font-medium">Tipo de Daño *</label>
                  <input className="input-field" placeholder="Ej: Filtración, Bache, etc."
                    value={form.detalle_especifico.tipo_dano || ''}
                    onChange={e => updateDetalle('tipo_dano', e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs text-surface-200/40 mb-1.5 block font-medium">Riesgo de Seguridad *</label>
                  <select className="select-field"
                    value={form.detalle_especifico.riesgo_seguridad || ''}
                    onChange={e => updateDetalle('riesgo_seguridad', e.target.value)} required>
                    <option value="">Seleccionar...</option>
                    <option value="Bajo">Bajo</option>
                    <option value="Medio">Medio</option>
                    <option value="Alto">Alto</option>
                    <option value="Crítico">Crítico</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-surface-200/40 mb-1.5 block font-medium">Insumos Requeridos * (separados por coma)</label>
                  <input className="input-field" placeholder="Impermeabilizante, Sellador, Pintura"
                    value={(form.detalle_especifico.insumos_requeridos || []).join(', ')}
                    onChange={e => updateDetalle('insumos_requeridos', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} required />
                </div>
                <div>
                  <label className="text-xs text-surface-200/40 mb-2 block font-medium">¿Requiere Contratista?</label>
                  <div className="flex gap-2">
                    <button type="button"
                      onClick={() => updateDetalle('requiere_contratista', true)}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-all ${
                        form.detalle_especifico.requiere_contratista === true
                          ? 'bg-warning-500/10 border-warning-500/30 text-warning-400'
                          : 'border-white/5 text-surface-200/30 hover:bg-white/[0.03]'
                      }`}>Sí</button>
                    <button type="button"
                      onClick={() => updateDetalle('requiere_contratista', false)}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-all ${
                        form.detalle_especifico.requiere_contratista === false
                          ? 'bg-success-500/10 border-success-500/30 text-success-400'
                          : 'border-white/5 text-surface-200/30 hover:bg-white/[0.03]'
                      }`}>No</button>
                  </div>
                </div>
              </div>
            )}

            {form.categoria === 'academico' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-surface-200/40 mb-1.5 block font-medium">Plataforma *</label>
                  <input className="input-field" placeholder="Ej: Moodle 4.1, Zoom, Teams"
                    value={form.detalle_especifico.plataforma || ''}
                    onChange={e => updateDetalle('plataforma', e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs text-surface-200/40 mb-1.5 block font-medium">Código de Curso *</label>
                  <input className="input-field font-mono" placeholder="MAT-301"
                    value={form.detalle_especifico.codigo_curso || ''}
                    onChange={e => updateDetalle('codigo_curso', e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs text-surface-200/40 mb-1.5 block font-medium">Período Escolar *</label>
                  <input className="input-field" placeholder="2026-2"
                    value={form.detalle_especifico.periodo_escolar || ''}
                    onChange={e => updateDetalle('periodo_escolar', e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs text-surface-200/40 mb-1.5 block font-medium">Estudiantes Impactados *</label>
                  <input className="input-field" type="number" min="0" placeholder="35"
                    value={form.detalle_especifico.estudiantes_impactados || ''}
                    onChange={e => updateDetalle('estudiantes_impactados', e.target.value)} required />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Submit ── */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading || !form.categoria}
            className="btn-primary text-sm px-8 py-3"
          >
            {loading ? (
              <><Loader2 size={17} className="animate-spin" /> Enviando...</>
            ) : (
              <><Send size={17} /> Registrar Incidencia</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
