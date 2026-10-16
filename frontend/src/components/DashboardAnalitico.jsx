import { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, Building2, Tag, Clock, AlertTriangle,
  Loader2, RefreshCw, Zap, Hash,
  CheckCircle2, Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { obtenerAnalitica } from '../services/api';

const COLORS = ['#6366f1', '#0ea5e9', '#f59e0b', '#ef4444', '#22c55e', '#a855f7', '#f97316', '#06b6d4', '#ec4899', '#84cc16'];

const ESTADO_COLORS = {
  abierta: '#60a5fa',
  'en proceso': '#fbbf24',
  'en espera': '#c084fc',
  resuelta: '#4ade80',
  cerrada: '#94a3b8',
};

const CATEGORIA_LABELS = {
  computo_redes: 'Cómputo y Redes',
  infraestructura: 'Infraestructura',
  academico: 'Académico',
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card-static p-3 text-xs border border-primary-500/15">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || entry.fill || '#a5b4fc' }}>
          {entry.name}: <span className="font-bold">{typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function DashboardAnalitico() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await obtenerAnalitica();
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-surface-200/30 text-sm">Cargando analítica...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Preparar datos para gráficos
  const eficienciaData = (data.eficiencia_por_edificio || []).map(e => ({
    edificio: e._id,
    promedio_horas: parseFloat(e.promedio_horas?.toFixed(1)),
    total_horas: e.total_horas,
    tickets: e.total_tickets,
  }));

  const topTagsData = (data.top_tags || []).map((t, i) => ({
    tag: `#${t._id}`,
    frecuencia: t.frecuencia,
    fill: COLORS[i % COLORS.length],
  }));

  const categoriaData = (data.distribucion_categoria || []).map((c, i) => ({
    name: CATEGORIA_LABELS[c._id] || c._id,
    total: c.total,
    resueltas: c.resueltas,
    promedio_horas: parseFloat(c.promedio_horas?.toFixed(1)),
    fill: COLORS[i],
  }));

  const prioridadData = (data.distribucion_prioridad || []).map(p => ({
    name: p._id,
    value: p.total,
  }));

  const estadoData = (data.distribucion_estado || []).map(e => ({
    name: e._id,
    value: e.total,
    fill: ESTADO_COLORS[e._id] || '#6366f1',
  }));

  // KPIs
  const totalTickets = categoriaData.reduce((s, c) => s + c.total, 0);
  const totalResueltas = categoriaData.reduce((s, c) => s + c.resueltas, 0);
  const tasaResolucion = totalTickets > 0 ? ((totalResueltas / totalTickets) * 100).toFixed(0) : 0;
  const promedioHorasGlobal = eficienciaData.length > 0
    ? (eficienciaData.reduce((s, e) => s + e.total_horas, 0) / eficienciaData.reduce((s, e) => s + e.tickets, 0)).toFixed(1)
    : 0;

  return (
    <div className="dashboard-page animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <BarChart3 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard Analítico Directivo</h1>
            <p className="text-surface-200/40 text-xs mt-0.5">
              Pipelines de Agregación MongoDB · Datos en tiempo real
            </p>
          </div>
        </div>
        <button onClick={fetchData} className="btn-secondary text-xs">
          <RefreshCw size={13} /> Actualizar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          icon={<Activity size={18} />}
          label="Total Incidencias"
          value={totalTickets}
          gradient="from-primary-500 to-primary-700"
        />
        <KPICard
          icon={<CheckCircle2 size={18} />}
          label="Tasa de Resolución"
          value={`${tasaResolucion}%`}
          subtext={`${totalResueltas} resueltas`}
          gradient="from-emerald-500 to-green-700"
        />
        <KPICard
          icon={<Clock size={18} />}
          label="Promedio Horas/Ticket"
          value={`${promedioHorasGlobal}h`}
          gradient="from-amber-500 to-orange-700"
        />
        <KPICard
          icon={<Zap size={18} />}
          label="Tags Únicos"
          value={topTagsData.length}
          subtext="en Top 10"
          gradient="from-violet-500 to-purple-700"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Pipeline 1: Eficiencia por Edificio */}
        <div className="glass-card-static p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-primary-500/15 flex items-center justify-center">
                  <Building2 size={12} className="text-primary-400" />
                </div>
                Eficiencia por Edificio
              </h3>
              <p className="text-[0.58rem] text-surface-200/25 mt-1 ml-8">
                Pipeline 1: $match → $group ($avg, $sum) → $sort
              </p>
            </div>
            <span className="text-[0.55rem] bg-primary-500/10 text-primary-300/60 px-2 py-0.5 rounded-full font-mono border border-primary-500/8">
              CU-06
            </span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={eficienciaData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
              <XAxis dataKey="edificio" tick={{ fill: '#475569', fontSize: 11 }} axisLine={{ stroke: 'rgba(99,102,241,0.06)' }} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={{ stroke: 'rgba(99,102,241,0.06)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              <Bar dataKey="promedio_horas" name="Promedio Horas" fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="tickets" name="Total Tickets" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline 2: Top 10 Tags */}
        <div className="glass-card-static p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-primary-500/15 flex items-center justify-center">
                  <Hash size={12} className="text-primary-400" />
                </div>
                Top 10 Tags Recurrentes
              </h3>
              <p className="text-[0.58rem] text-surface-200/25 mt-1 ml-8">
                Pipeline 2: $unwind → $group → $sort → $limit
              </p>
            </div>
            <span className="text-[0.55rem] bg-primary-500/10 text-primary-300/60 px-2 py-0.5 rounded-full font-mono border border-primary-500/8">
              CU-06
            </span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topTagsData} layout="vertical" barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
              <XAxis type="number" tick={{ fill: '#475569', fontSize: 11 }} axisLine={{ stroke: 'rgba(99,102,241,0.06)' }} />
              <YAxis type="category" dataKey="tag" tick={{ fill: '#a5b4fc', fontSize: 10 }} width={110} axisLine={{ stroke: 'rgba(99,102,241,0.06)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="frecuencia" name="Frecuencia" radius={[0, 6, 6, 0]}>
                {topTagsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Distribución por Estado */}
        <div className="glass-card-static p-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-primary-500/15 flex items-center justify-center">
              <Activity size={12} className="text-primary-400" />
            </div>
            Por Estado
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={estadoData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {estadoData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
            {estadoData.map((e, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[0.58rem] text-surface-200/40">
                <div className="w-2 h-2 rounded-full" style={{ background: e.fill }}></div>
                {e.name} ({e.value})
              </div>
            ))}
          </div>
        </div>

        {/* Distribución por Categoría */}
        <div className="glass-card-static p-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-primary-500/15 flex items-center justify-center">
              <TrendingUp size={12} className="text-primary-400" />
            </div>
            Categorías
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoriaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
              <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 9 }} axisLine={{ stroke: 'rgba(99,102,241,0.06)' }} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={{ stroke: 'rgba(99,102,241,0.06)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Total" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resueltas" name="Resueltas" fill="#4ade80" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución por Prioridad */}
        <div className="glass-card-static p-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-primary-500/15 flex items-center justify-center">
              <AlertTriangle size={12} className="text-primary-400" />
            </div>
            Prioridades
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={prioridadData}
                cx="50%"
                cy="50%"
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name} (${value})`}
              >
                {prioridadData.map((_, i) => (
                  <Cell key={i} fill={
                    prioridadData[i]?.name === 'baja' ? '#4ade80'
                    : prioridadData[i]?.name === 'media' ? '#fbbf24'
                    : prioridadData[i]?.name === 'alta' ? '#fb923c'
                    : '#f87171'
                  } />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tabla Eficiencia */}
        <div className="glass-card-static p-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-primary-500/15 flex items-center justify-center">
              <Building2 size={12} className="text-primary-400" />
            </div>
            Detalle de Eficiencia por Edificio
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-surface-200/35 border-b border-white/5">
                  <th className="text-left py-2.5 font-medium">Edificio</th>
                  <th className="text-right py-2.5 font-medium">Tickets</th>
                  <th className="text-right py-2.5 font-medium">Prom. Horas</th>
                  <th className="text-right py-2.5 font-medium">Total Horas</th>
                </tr>
              </thead>
              <tbody>
                {eficienciaData.map((e, i) => (
                  <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 text-surface-200/70 font-medium">{e.edificio}</td>
                    <td className="py-2.5 text-right text-primary-300/80 font-semibold">{e.tickets}</td>
                    <td className="py-2.5 text-right text-surface-200/50">{e.promedio_horas}h</td>
                    <td className="py-2.5 text-right text-surface-200/50">{e.total_horas}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla Top Tags */}
        <div className="glass-card-static p-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-primary-500/15 flex items-center justify-center">
              <Tag size={12} className="text-primary-400" />
            </div>
            Ranking de Tags
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-surface-200/35 border-b border-white/5">
                  <th className="text-left py-2.5 font-medium w-8">#</th>
                  <th className="text-left py-2.5 font-medium">Tag</th>
                  <th className="text-right py-2.5 font-medium">Frecuencia</th>
                  <th className="text-right py-2.5 font-medium w-24">Barra</th>
                </tr>
              </thead>
              <tbody>
                {topTagsData.map((t, i) => (
                  <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 text-surface-200/25 font-mono">{i + 1}</td>
                    <td className="py-2.5">
                      <span className="tag">{t.tag}</span>
                    </td>
                    <td className="py-2.5 text-right text-primary-300/80 font-semibold">{t.frecuencia}</td>
                    <td className="py-2.5 text-right">
                      <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{
                          width: `${(t.frecuencia / (topTagsData[0]?.frecuencia || 1)) * 100}%`,
                          background: t.fill,
                        }}></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, subtext, gradient }) {
  return (
    <div className="glass-card p-5 stagger-item group">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-white mt-3 tracking-tight">{value}</p>
      <p className="text-xs text-surface-200/40 mt-0.5">{label}</p>
      {subtext && <p className="text-[0.58rem] text-surface-200/20 mt-0.5">{subtext}</p>}
    </div>
  );
}
