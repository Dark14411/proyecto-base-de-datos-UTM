import { useState } from 'react';
import {
  Send, Wifi, Building2, GraduationCap, AlertTriangle, CheckCircle2,
  User, Mail, Briefcase, MapPin, Tag, Loader2, X, Plus, FileText,
  Zap, Shield, Hash, Sparkles, Code2, ArrowRight, Eye, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { crearIncidencia } from '../services/api';

const CATEGORIAS = [
  { value: 'computo_redes', label: 'Cómputo y Redes', desc: 'Equipos, red, switches, IP/VLAN', icon: <Wifi size={20} />, gradient: 'from-sky-500 to-blue-600', color: '#38bdf8' },
  { value: 'infraestructura', label: 'Infraestructura', desc: 'Edificios, filtraciones, riesgos', icon: <Building2 size={20} />, gradient: 'from-orange-500 to-red-600', color: '#fb923c' },
  { value: 'academico', label: 'Académico', desc: 'Moodle, plataformas, cursos', icon: <GraduationCap size={20} />, gradient: 'from-violet-500 to-purple-600', color: '#c084fc' },
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
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [tagInput, setTagInput] = useState('');
  const [insumoInput, setInsumoInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);

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

  const addInsumo = () => {
    const item = insumoInput.trim();
    if (item) {
      const actuales = form.detalle_especifico.insumos_requeridos || [];
      if (!actuales.includes(item)) {
        updateDetalle('insumos_requeridos', [...actuales, item]);
        setInsumoInput('');
      }
    }
  };

  const removeInsumo = (item) => {
    const actuales = form.detalle_especifico.insumos_requeridos || [];
    updateDetalle('insumos_requeridos', actuales.filter(i => i !== item));
  };

  // ── Presets de Prueba Exacta para Presentaciones ──
  const cargarPreset = (tipo) => {
    setError(null);
    setResultado(null);

    if (tipo === 'computo') {
      setForm({
        titulo: 'Fallo crítico en switch core del Edificio A',
        descripcion: 'El switch Cisco Gigabit presenta pérdida de enlaces y reinicios continuos afectando a los laboratorios de cómputo.',
        categoria: 'computo_redes',
        prioridad: 'critica',
        reportante: {
          nombre: 'Ing. Roberto Méndez',
          rol: 'Coordinador de TI',
          correo: 'roberto.mendez@utm.mx'
        },
        ubicacion: {
          edificio: 'Edificio A',
          aula_espacio: 'Cuarto de Telecomunicaciones P2'
        },
        tags: ['red', 'switch', 'cisco', 'urgente'],
        detalle_especifico: {
          direccion_ip: '10.0.1.1',
          vlan: 'VLAN-100',
          puerto_uplink: 'GigabitEthernet1/0/1',
          equipos_afectados: 24
        }
      });
    } else if (tipo === 'infraestructura') {
      setForm({
        titulo: 'Fuga de agua en tubería principal de sanitarios',
        descripcion: 'Filtración activa hacia el suelo del laboratorio contiguo con riesgo de contacto con canaletas de datos y electricidad.',
        categoria: 'infraestructura',
        prioridad: 'alta',
        reportante: {
          nombre: 'Arq. Diana Morales',
          rol: 'Coordinadora de Infraestructura',
          correo: 'diana.morales@utm.mx'
        },
        ubicacion: {
          edificio: 'Edificio K',
          aula_espacio: 'Laboratorio de Cómputo 3'
        },
        tags: ['fuga', 'fontaneria', 'riesgo-electrico'],
        detalle_especifico: {
          tipo_dano: 'Fuga hidráulica en unión PVC',
          riesgo_seguridad: 'Medio - Proximidad a cableado subterráneo',
          insumos_requeridos: ['Bomba de achique', 'Cople PVC 2 pulgadas', 'Sellador industrial'],
          requiere_contratista: true
        }
      });
    } else if (tipo === 'academico') {
      setForm({
        titulo: 'Error 500 en Moodle durante entrega de proyecto',
        descripcion: 'La plataforma virtual del campus no acepta archivos ni carga las rúbricas para los cursos de programación.',
        categoria: 'academico',
        prioridad: 'critica',
        reportante: {
          nombre: 'Dra. Carmen Salinas',
          rol: 'Directora Académica',
          correo: 'carmen.salinas@utm.mx'
        },
        ubicacion: {
          edificio: 'Biblioteca',
          aula_espacio: 'Sala de Cómputo y Exámenes'
        },
        tags: ['moodle', 'plataforma', 'examen-final'],
        detalle_especifico: {
          plataforma: 'Moodle UTM Cloud',
          codigo_curso: 'BD-2026-II',
          periodo_escolar: '2026-A',
          estudiantes_impactados: 180
        }
      });
    } else if (tipo === 'invalido') {
      // Intentionally invalid document to test MongoDB $jsonSchema rejection
      setForm({
        titulo: 'Fallo', // Menor a 5 caracteres
        descripcion: 'Corto', // Menor a 10 caracteres
        categoria: 'computo_redes',
        prioridad: 'baja',
        reportante: { nombre: '', rol: '', correo: 'invalido' },
        ubicacion: { edificio: '', aula_espacio: '' },
        tags: [],
        detalle_especifico: {
          // Faltan vlan, puerto_uplink, etc. requeridos por computo_redes
          direccion_ip: '192.168.1.1'
        }
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResultado(null);
    const start = performance.now();

    try {
      const payload = JSON.parse(JSON.stringify(form));

      // Conversión numérica estricta según schema
      if (form.categoria === 'computo_redes' && payload.detalle_especifico.equipos_afectados) {
        payload.detalle_especifico.equipos_afectados = parseInt(payload.detalle_especifico.equipos_afectados, 10);
      }
      if (form.categoria === 'academico' && payload.detalle_especifico.estudiantes_impactados) {
        payload.detalle_especifico.estudiantes_impactados = parseInt(payload.detalle_especifico.estudiantes_impactados, 10);
      }

      const res = await crearIncidencia(payload);
      const elapsed = Math.round(performance.now() - start);
      setExecutionTime(elapsed);
      setResultado(res.data);
      setForm(initialForm);
    } catch (err) {
      const elapsed = Math.round(performance.now() - start);
      setExecutionTime(elapsed);
      setError(err.response?.data || { error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const categoriaSeleccionada = CATEGORIAS.find(c => c.value === form.categoria);

  return (
    <div className="form-page max-w-4xl mx-auto animate-fadeIn space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-indigo-700 flex items-center justify-center shadow-xl shadow-primary-500/25">
            <Plus size={24} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Registrar Nueva Incidencia</h1>
              <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-primary-500/15 text-primary-300 font-mono font-bold border border-primary-500/20">
                CU-01
              </span>
            </div>
            <p className="text-surface-200/50 text-xs mt-0.5">
              Formulario polimórfico validado por MongoDB Atlas + Folio único atómico emitido por Redis INCR
            </p>
          </div>
        </div>

        {/* Live Payload Toggle */}
        <button
          type="button"
          onClick={() => setShowJsonPreview(!showJsonPreview)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
            showJsonPreview
              ? 'bg-primary-500/20 text-primary-200 border-primary-500/40 shadow-sm'
              : 'bg-white/[0.03] text-surface-200/60 border-white/10 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <Code2 size={15} />
          {showJsonPreview ? 'Ocultar JSON BSON' : 'Inspeccionar JSON BSON'}
        </button>
      </div>

      {/* ── Banco de Pruebas Rápidas para Demostración ── */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-surface-900/90 via-surface-950/90 to-primary-950/40 border border-primary-500/15 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Banco de Pruebas Rápidas (Carga de Escenarios)
            </span>
          </div>
          <span className="text-[0.65rem] text-surface-200/40 font-mono">1-Click Test Presets</span>
        </div>
        <p className="text-xs text-surface-200/50 mb-3">
          Selecciona un escenario predefinido para rellenar automáticamente todos los campos y probar la inserción polimórfica exacta:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => cargarPreset('computo')}
            className="p-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-300 text-left transition-all hover:scale-[1.02] cursor-pointer"
          >
            <div className="flex items-center gap-1.5 font-bold text-xs mb-0.5">
              <Wifi size={13} />
              <span>Cómputo & Red</span>
            </div>
            <p className="text-[0.65rem] text-sky-300/70 truncate">Switch Core + VLAN</p>
          </button>

          <button
            type="button"
            onClick={() => cargarPreset('infraestructura')}
            className="p-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-300 text-left transition-all hover:scale-[1.02] cursor-pointer"
          >
            <div className="flex items-center gap-1.5 font-bold text-xs mb-0.5">
              <Building2 size={13} />
              <span>Infraestructura</span>
            </div>
            <p className="text-[0.65rem] text-orange-300/70 truncate">Fuga Lab K + Contratista</p>
          </button>

          <button
            type="button"
            onClick={() => cargarPreset('academico')}
            className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 text-left transition-all hover:scale-[1.02] cursor-pointer"
          >
            <div className="flex items-center gap-1.5 font-bold text-xs mb-0.5">
              <GraduationCap size={13} />
              <span>Académico</span>
            </div>
            <p className="text-[0.65rem] text-purple-300/70 truncate">Moodle UTM + 180 alumnos</p>
          </button>

          <button
            type="button"
            onClick={() => cargarPreset('invalido')}
            className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-left transition-all hover:scale-[1.02] cursor-pointer"
          >
            <div className="flex items-center gap-1.5 font-bold text-xs mb-0.5">
              <AlertTriangle size={13} />
              <span>Test Rechazo</span>
            </div>
            <p className="text-[0.65rem] text-rose-300/70 truncate">Violar $jsonSchema</p>
          </button>
        </div>
      </div>

      {/* ── Alertas de Éxito o Error de Validación ── */}
      {resultado && (
        <div className="p-5 rounded-2xl bg-success-500/10 border border-success-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-scaleIn">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-success-500/20 flex items-center justify-center shrink-0 text-success-400">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-success-400 font-bold text-sm">¡Incidencia Registrada en MongoDB Atlas!</p>
                {executionTime !== null && (
                  <span className="text-[0.65rem] font-mono font-bold px-2 py-0.5 rounded bg-success-500/20 text-success-300">
                    {executionTime} ms
                  </span>
                )}
              </div>
              <p className="text-surface-200/70 text-xs mt-1">
                Folio emitido por Redis: <span className="font-mono font-extrabold text-white bg-white/10 px-2 py-0.5 rounded ml-1">{resultado.incidencia?.codigo_incidencia}</span>
              </p>
              <p className="text-surface-200/40 text-[0.68rem] font-mono mt-1">
                MongoDB ObjectId: {resultado.incidencia?._id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => navigate('/bandeja')}
              className="px-3.5 py-2 rounded-xl bg-success-500 text-black font-bold text-xs flex items-center gap-1.5 hover:bg-success-400 transition-colors shadow-lg shadow-success-500/20"
            >
              <span>Ver en Bandeja</span>
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => setResultado(null)}
              className="p-2 text-surface-200/40 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-5 rounded-2xl bg-danger-500/10 border border-danger-500/25 flex items-start justify-between gap-4 animate-scaleIn">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-danger-500/20 flex items-center justify-center shrink-0 text-danger-400">
              <AlertTriangle size={22} />
            </div>
            <div>
              <p className="text-danger-400 font-bold text-sm">Rechazo de Validación por MongoDB ($jsonSchema)</p>
              <p className="text-danger-300/80 text-xs mt-1">
                El documento enviado no cumplió con las reglas estrictas de polimorfismo o longitud mínima.
              </p>
              <pre className="mt-2.5 p-3 rounded-xl bg-surface-950 text-danger-300 font-mono text-[0.72rem] overflow-x-auto max-w-2xl border border-danger-500/15">
                {JSON.stringify(error.detalle || error.error || error, null, 2)}
              </pre>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="p-2 text-danger-400/50 hover:text-danger-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Live BSON Payload Inspector Drawer ── */}
      {showJsonPreview && (
        <div className="glass-card p-5 border border-primary-500/30 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Code2 size={16} className="text-primary-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Documento BSON en Tiempo Real (A ser validado por $jsonSchema)
              </span>
            </div>
            <span className="text-[0.65rem] font-mono text-primary-300">Live State Preview</span>
          </div>
          <pre className="p-3.5 rounded-xl bg-surface-950 text-sky-300 font-mono text-[0.75rem] overflow-x-auto max-h-72 border border-white/5">
            {JSON.stringify(form, null, 2)}
          </pre>
        </div>
      )}

      {/* ── Main Form ── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selector de Categoría Polimórfica */}
        <div className="glass-card p-6">
          <label className="text-xs font-bold text-surface-200/50 uppercase tracking-wider mb-4 block">
            Paso 1: Categoría de Incidencia (Determina el Esquema Polimórfico) *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CATEGORIAS.map(cat => {
              const selected = form.categoria === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => {
                    updateField('categoria', cat.value);
                    updateField('detalle_especifico', {});
                  }}
                  className={`relative p-5 rounded-2xl border text-left transition-all duration-300 flex flex-col gap-2 cursor-pointer overflow-hidden ${
                    selected
                      ? 'border-primary-400 shadow-xl shadow-primary-500/15 bg-primary-500/[0.08]'
                      : 'border-white/5 bg-white/[0.015] hover:border-white/15 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
                      style={{ background: cat.color }}
                    >
                      {cat.icon}
                    </div>
                    {selected && (
                      <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center text-[0.65rem]">
                        ✓
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{cat.label}</h3>
                    <p className="text-[0.72rem] text-surface-200/50 mt-0.5">{cat.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Datos Generales */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-xs font-bold text-surface-200/50 uppercase tracking-wider">
            Paso 2: Datos Generales de la Falla
          </h3>

          <div>
            <label className="text-xs text-surface-200/60 mb-1.5 block font-medium">Título de la Incidencia * (Mín. 5 caracteres)</label>
            <input
              className="input-field"
              placeholder="Ej: Interrupción de conexión en switch de distribución"
              value={form.titulo}
              onChange={e => updateField('titulo', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs text-surface-200/60 mb-1.5 block font-medium">Descripción detallada * (Mín. 10 caracteres)</label>
            <textarea
              className="textarea-field"
              placeholder="Describa el comportamiento anómalo o falla con el mayor nivel de detalle posible..."
              rows={3}
              value={form.descripcion}
              onChange={e => updateField('descripcion', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs text-surface-200/60 mb-2 block font-medium">Nivel de Prioridad *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRIORIDADES.map(p => {
                const selected = form.prioridad === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => updateField('prioridad', p.value)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                      selected ? 'shadow-md scale-[1.02]' : 'border-white/5 bg-white/[0.02] text-surface-200/40 hover:bg-white/[0.04]'
                    }`}
                    style={selected ? {
                      color: p.color,
                      backgroundColor: p.bgColor,
                      borderColor: `${p.color}60`,
                    } : {}}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Subdocumento Polimórfico Específico ── */}
        {form.categoria && (
          <div className="glass-card p-6 border-l-4 border-l-primary-500 animate-fadeIn space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} className="text-primary-400" />
              <h3 className="text-sm font-bold text-white">
                Paso 3: Atributos Polimórficos de {categoriaSeleccionada?.label}
              </h3>
            </div>
            <p className="text-xs text-surface-200/50">
              Estos campos se mapean directamente al subdocumento <code className="text-primary-300">detalle_especifico</code> evaluado por la cláusula <code className="text-primary-300">oneOf</code> de MongoDB.
            </p>

            {/* Caso Cómputo y Redes */}
            {form.categoria === 'computo_redes' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs text-surface-200/60 mb-1.5 block font-medium">Dirección IP *</label>
                  <input className="input-field font-mono" placeholder="Ej: 10.0.1.1"
                    value={form.detalle_especifico.direccion_ip || ''}
                    onChange={e => updateDetalle('direccion_ip', e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs text-surface-200/60 mb-1.5 block font-medium">Identificador de VLAN *</label>
                  <input className="input-field font-mono" placeholder="Ej: VLAN-100"
                    value={form.detalle_especifico.vlan || ''}
                    onChange={e => updateDetalle('vlan', e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs text-surface-200/60 mb-1.5 block font-medium">Puerto Uplink *</label>
                  <input className="input-field font-mono" placeholder="Ej: GigabitEthernet1/0/1"
                    value={form.detalle_especifico.puerto_uplink || ''}
                    onChange={e => updateDetalle('puerto_uplink', e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs text-surface-200/60 mb-1.5 block font-medium">Equipos Afectados *</label>
                  <input className="input-field font-mono" type="number" min="1" placeholder="Ej: 15"
                    value={form.detalle_especifico.equipos_afectados || ''}
                    onChange={e => updateDetalle('equipos_afectados', e.target.value)} required />
                </div>
              </div>
            )}

            {/* Caso Infraestructura */}
            {form.categoria === 'infraestructura' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs text-surface-200/60 mb-1.5 block font-medium">Tipo de Daño *</label>
                  <input className="input-field" placeholder="Ej: Fuga hidráulica, luminaria rota..."
                    value={form.detalle_especifico.tipo_dano || ''}
                    onChange={e => updateDetalle('tipo_dano', e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs text-surface-200/60 mb-1.5 block font-medium">Nivel de Riesgo de Seguridad *</label>
                  <input className="input-field" placeholder="Ej: Alto - Posible corto circuito"
                    value={form.detalle_especifico.riesgo_seguridad || ''}
                    onChange={e => updateDetalle('riesgo_seguridad', e.target.value)} required />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-surface-200/60 mb-1.5 block font-medium">Insumos Requeridos * (Arreglo de materiales)</label>
                  <div className="flex gap-2 mb-2">
                    <input className="input-field flex-1" placeholder="Agregar insumo (ej: Bomba de achique)..."
                      value={insumoInput}
                      onChange={e => setInsumoInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addInsumo())} />
                    <button type="button" onClick={addInsumo} className="btn-secondary py-2 px-3 text-xs">
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(form.detalle_especifico.insumos_requeridos || []).map(item => (
                      <span key={item} className="tag">
                        {item}
                        <button type="button" onClick={() => removeInsumo(item)} className="ml-1 text-surface-200/50 hover:text-white">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2 flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <input
                    type="checkbox"
                    id="requiere_contratista"
                    checked={form.detalle_especifico.requiere_contratista || false}
                    onChange={e => updateDetalle('requiere_contratista', e.target.checked)}
                    className="w-4 h-4 accent-primary-500 rounded cursor-pointer"
                  />
                  <label htmlFor="requiere_contratista" className="text-xs text-surface-200/80 cursor-pointer font-medium">
                    ¿Requiere contratación de personal externo / contratista especializado?
                  </label>
                </div>
              </div>
            )}

            {/* Caso Académico */}
            {form.categoria === 'academico' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs text-surface-200/60 mb-1.5 block font-medium">Plataforma Educativa *</label>
                  <input className="input-field" placeholder="Ej: Moodle UTM, Teams, Correo Institucional"
                    value={form.detalle_especifico.plataforma || ''}
                    onChange={e => updateDetalle('plataforma', e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs text-surface-200/60 mb-1.5 block font-medium">Código del Curso *</label>
                  <input className="input-field font-mono" placeholder="Ej: BD-2026-II"
                    value={form.detalle_especifico.codigo_curso || ''}
                    onChange={e => updateDetalle('codigo_curso', e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs text-surface-200/60 mb-1.5 block font-medium">Periodo Escolar *</label>
                  <input className="input-field font-mono" placeholder="Ej: 2026-A"
                    value={form.detalle_especifico.periodo_escolar || ''}
                    onChange={e => updateDetalle('periodo_escolar', e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs text-surface-200/60 mb-1.5 block font-medium">Estudiantes Impactados *</label>
                  <input className="input-field font-mono" type="number" min="1" placeholder="Ej: 120"
                    value={form.detalle_especifico.estudiantes_impactados || ''}
                    onChange={e => updateDetalle('estudiantes_impactados', e.target.value)} required />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Reportante y Ubicación ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="glass-card p-6 space-y-3">
            <h3 className="text-xs font-bold text-surface-200/50 uppercase tracking-wider flex items-center gap-2">
              <User size={14} className="text-primary-400" />
              Paso 4: Datos del Reportante
            </h3>
            <div>
              <label className="text-xs text-surface-200/60 mb-1 block font-medium">Nombre Completo *</label>
              <input className="input-field" placeholder="Ej: Ing. Roberto Méndez"
                value={form.reportante.nombre}
                onChange={e => updateNested('reportante', 'nombre', e.target.value)} required />
            </div>
            <div>
              <label className="text-xs text-surface-200/60 mb-1 block font-medium">Rol Institucional *</label>
              <input className="input-field" placeholder="Ej: Coordinador de TI, Profesor, Alumno..."
                value={form.reportante.rol}
                onChange={e => updateNested('reportante', 'rol', e.target.value)} required />
            </div>
            <div>
              <label className="text-xs text-surface-200/60 mb-1 block font-medium">Correo Electrónico *</label>
              <input className="input-field" type="email" placeholder="correo@utm.mx"
                value={form.reportante.correo}
                onChange={e => updateNested('reportante', 'correo', e.target.value)} required />
            </div>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h3 className="text-xs font-bold text-surface-200/50 uppercase tracking-wider flex items-center gap-2">
              <MapPin size={14} className="text-primary-400" />
              Paso 5: Ubicación Física en Campus
            </h3>
            <div>
              <label className="text-xs text-surface-200/60 mb-1 block font-medium">Edificio del Campus *</label>
              <select className="select-field"
                value={form.ubicacion.edificio}
                onChange={e => updateNested('ubicacion', 'edificio', e.target.value)} required>
                <option value="">Seleccionar edificio...</option>
                {EDIFICIOS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-surface-200/60 mb-1 block font-medium">Aula o Espacio Específico *</label>
              <input className="input-field" placeholder="Ej: Sala de Cómputo 2, Laboratorio K"
                value={form.ubicacion.aula_espacio}
                onChange={e => updateNested('ubicacion', 'aula_espacio', e.target.value)} required />
            </div>

            <div className="pt-2">
              <label className="text-xs text-surface-200/60 mb-1 block font-medium">Etiquetas (Búsqueda Full-Text)</label>
              <div className="flex gap-2">
                <input className="input-field flex-1" placeholder="Agregar tag (ej: red, switch)..."
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                <button type="button" onClick={addTag} className="btn-secondary py-2 px-3 text-xs">
                  <Tag size={13} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map(tag => (
                  <span key={tag} className="tag">
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-surface-200/50 hover:text-white">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Botón de Envío */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading || !form.categoria}
            className="btn-primary py-3.5 px-8 text-sm font-bold flex items-center gap-2.5 shadow-xl shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Generando Folio en Redis & Insertando BSON...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Registrar Incidencia Polimórfica (CU-01)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
