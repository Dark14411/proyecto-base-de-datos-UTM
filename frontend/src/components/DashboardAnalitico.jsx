import { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, Building2, Tag, Clock, AlertTriangle,
  Loader2, RefreshCw, Zap, Hash, CheckCircle2, Activity,
  PieChart as PieIcon, Code2, ChevronDown, ChevronUp, Layers, Sparkles
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { obtenerAnalitica } from '../services/api';

const COLORS = ['#6366f1', '#38bdf8', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

export default function DashboardAnalitico() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [latency, setLatency] = useState(null);
  const [showPipelines, setShowPipelines] = useState(false);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    const start = performance.now();
    try {
      const res = await obtenerAnalitica();
      setLatency(Math.round(performance.now() - start));
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  if (loading && !data) {
    return (
      <div className="py-24 text-center glass-card max-w-4xl mx-auto space-y-3">
        <Loader2 size={36} className="animate-spin mx-auto text-primary-400" />
        <p className="text-sm font-semibold text-white">Ejecutando Agregaciones en MongoDB Atlas...</p>
        <p className="text-xs text-surface-200/40">Procesando etapas $facet, $group, $unwind y $sort</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 rounded-2xl bg-danger-500/10 border border-danger-500/20 max-w-2xl mx-auto text-center space-y-3">
        <AlertTriangle size={36} className="mx-auto text-danger-400" />
        <p className="text-sm font-bold text-danger-400">Error al ejecutar analítica</p>
        <p className="text-xs text-danger-300/70 font-mono">{error}</p>
        <button onClick={cargarDatos} className="btn-secondary py-2 px-4 text-xs mx-auto">
          Reintentar
        </button>
      </div>
    );
  }

  // Cálculos de Resumen
  const totalIncidencias = (data?.distribucion_estado || []).reduce((acc, c) => acc + (c.total || 0), 0);
  const totalHoras = (data?.eficiencia_por_edificio || []).reduce((acc, e) => acc + (e.total_horas || 0), 0);
  const resueltas = (data?.distribucion_estado || []).find(e => e._id === 'resuelta' || e._id === 'cerrada')?.total || 0;
  const tasaResolucion = totalIncidencias > 0 ? Math.round((resueltas / totalIncidencias) * 100) : 0;

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-xl bg-surface-950/90 border border-primary-500/30 backdrop-blur-xl shadow-xl text-xs space-y-1 font-sans">
          <p className="font-bold text-white mb-1">{label || payload[0]?.name}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="font-mono text-[0.72rem]">
              {entry.name}: <strong className="font-bold">{entry.value}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Dashboard Analítico del Campus</h1>
            <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-primary-500/15 text-primary-300 font-mono font-bold border border-primary-500/20">
              CU-06 · Aggregation Pipelines
            </span>
          </div>
          <p className="text-surface-200/50 text-xs mt-0.5">
            Métricas consolidadas de rendimiento operativo generadas en tiempo real mediante pipelines en MongoDB Atlas
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {latency !== null && (
            <span className="text-[0.68rem] px-2.5 py-1 rounded-lg bg-surface-900 border border-white/5 font-mono text-primary-300">
              Pipeline: {latency} ms
            </span>
          )}

          <button
            onClick={() => setShowPipelines(!showPipelines)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              showPipelines
                ? 'bg-primary-500/20 text-primary-200 border-primary-500/40 shadow-sm'
                : 'bg-white/[0.03] text-surface-200/50 border-white/10 hover:text-white'
            }`}
          >
            <Code2 size={13} />
            <span>{showPipelines ? 'Ocultar Pipelines' : 'Ver Pipelines MongoDB'}</span>
          </button>

          <button
            onClick={cargarDatos}
            disabled={loading}
            className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-primary-400' : ''} />
            <span>Refrescar</span>
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="glass-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.68rem] uppercase font-bold tracking-wider text-surface-200/50">Total Incidencias</span>
            <div className="w-8 h-8 rounded-lg bg-primary-500/15 flex items-center justify-center text-primary-400">
              <Hash size={16} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white font-mono">{totalIncidencias}</p>
          <p className="text-[0.7rem] text-surface-200/40 mt-1">Registros en colección activa</p>
        </div>

        {/* KPI 2 */}
        <div className="glass-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.68rem] uppercase font-bold tracking-wider text-surface-200/50">Tasa de Resolución</span>
            <div className="w-8 h-8 rounded-lg bg-success-500/15 flex items-center justify-center text-success-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white font-mono">{tasaResolucion}%</p>
          <p className="text-[0.7rem] text-surface-200/40 mt-1">{resueltas} cerradas o resueltas</p>
        </div>

        {/* KPI 3 */}
        <div className="glass-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.68rem] uppercase font-bold tracking-wider text-surface-200/50">Horas Invertidas</span>
            <div className="w-8 h-8 rounded-lg bg-warning-500/15 flex items-center justify-center text-warning-400">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white font-mono">{totalHoras} <span className="text-sm font-sans font-normal text-surface-200/50">hrs</span></p>
          <p className="text-[0.7rem] text-surface-200/40 mt-1">Suma acumulada vía $inc</p>
        </div>

        {/* KPI 4 */}
        <div className="glass-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.68rem] uppercase font-bold tracking-wider text-surface-200/50">Edificios Monitoreados</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 flex items-center justify-center text-sky-400">
              <Building2 size={16} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white font-mono">{data?.eficiencia_por_edificio?.length || 0}</p>
          <p className="text-[0.7rem] text-surface-200/40 mt-1">Edificios con actividad</p>
        </div>
      </div>

      {/* ── Collapsible Pipeline Explanations ── */}
      {showPipelines && (
        <div className="glass-card p-5 border border-primary-500/30 animate-fadeIn space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Code2 size={16} className="text-primary-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Pipeline de Agregación Real Ejecutado en MongoDB Atlas
              </span>
            </div>
            <span className="text-[0.65rem] font-mono text-emerald-400">db.incidencias_campus.aggregate([...])</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <p className="text-[0.68rem] text-surface-200/40 uppercase mb-1 font-bold">1. Etapa $facet (Métricas Paralelas)</p>
              <pre className="p-3 rounded-lg bg-surface-950 text-sky-300 text-[0.72rem] overflow-x-auto border border-white/5">
{`{
  $facet: {
    eficiencia_por_edificio: [
      { $group: {
          _id: "$ubicacion.edificio",
          total: { $sum: 1 },
          total_horas: { $sum: "$horas_invertidas" },
          resueltas: { $sum: { $cond: [{ $in: ["$estado", ["resuelta", "cerrada"]] }, 1, 0] } }
      }},
      { $sort: { total: -1 } }
    ],
    distribucion_categoria: [
      { $group: { _id: "$categoria", total: { $sum: 1 } } }
    ]
  }
}`}
              </pre>
            </div>

            <div>
              <p className="text-[0.68rem] text-surface-200/40 uppercase mb-1 font-bold">2. Etapa $unwind (Extracción de Tags)</p>
              <pre className="p-3 rounded-lg bg-surface-950 text-amber-300 text-[0.72rem] overflow-x-auto border border-white/5">
{`{
  top_tags: [
    { $unwind: "$tags" },
    { $group: { _id: "$tags", total: { $sum: 1 } } },
    { $sort: { total: -1 } },
    { $limit: 10 }
  ],
  distribucion_prioridad: [
    { $group: { _id: "$prioridad", total: { $sum: 1 } } }
  ]
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Charts Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica 1: Eficiencia por Edificio */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 size={16} className="text-primary-400" />
                Incidencias y Horas Invertidas por Edificio
              </h3>
              <p className="text-[0.7rem] text-surface-200/40 mt-0.5">
                $group por <code className="text-primary-300 font-mono">ubicacion.edificio</code>
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.eficiencia_por_edificio || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="_id" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }} />
                <Bar dataKey="total" name="Total Incidencias" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total_horas" name="Horas Invertidas" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfica 2: Distribución por Categoría Polimórfica */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieIcon size={16} className="text-accent-400" />
                Distribución por Categoría Polimórfica
              </h3>
              <p className="text-[0.7rem] text-surface-200/40 mt-0.5">
                $group por <code className="text-accent-300 font-mono">categoria</code> (computo_redes, infraestructura, academico)
              </p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.distribucion_categoria || []}
                  dataKey="total"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={5}
                >
                  {(data?.distribucion_categoria || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfica 3: Severidad / Prioridad */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle size={16} className="text-warning-400" />
                Incidencias por Severidad / Prioridad
              </h3>
              <p className="text-[0.7rem] text-surface-200/40 mt-0.5">
                $group por <code className="text-warning-300 font-mono">prioridad</code> (baja, media, alta, critica)
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.distribucion_prioridad || []} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                <YAxis dataKey="_id" type="category" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Total Incidencias" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfica 4: Top Tags / Palabras Clave */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag size={16} className="text-emerald-400" />
                Top Etiquetas del Campus (Desenrolladas con $unwind)
              </h3>
              <p className="text-[0.7rem] text-surface-200/40 mt-0.5">
                Descompone el array de tags para calcular frecuencia
              </p>
            </div>
          </div>

          <div className="h-64 flex flex-wrap content-start gap-2 overflow-y-auto p-2">
            {(data?.top_tags || []).map((tag, idx) => (
              <div
                key={tag._id}
                className="p-2.5 rounded-xl bg-surface-900 border border-white/5 flex items-center gap-2 hover:border-emerald-500/30 transition-colors"
              >
                <span className="text-xs font-mono font-bold text-emerald-300">#{tag._id}</span>
                <span className="text-[0.68rem] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono font-bold">
                  {tag.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
