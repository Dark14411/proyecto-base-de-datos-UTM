// ═══════════════════════════════════════════════════════════════
// pages/AnaliticaPage.jsx — Dashboard de Analítica Directiva (RF-06)
// Implementa exactamente los 2 pipelines oficiales de agregación:
// Pipeline 1: Horas transcurridas y conteo por edificio ($avg, $sum)
// Pipeline 2: Top 10 etiquetas más frecuentes ($unwind, $group, $sort, $limit)
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BarChart3, Clock, TrendingUp, Tag, Building2, CheckCircle2 } from 'lucide-react';

const COLORES = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#38bdf8', '#06b6d4'];

const AnaliticaPage = () => {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const { data } = await api.get('/incidencias/analitica');
      setDatos(data.datos);
    } catch (error) {
      console.error('Error cargando analítica:', error);
    } finally {
      setCargando(false);
    }
  };

  const categoriaLabels = {
    computo_redes: 'Cómputo y Redes',
    infraestructura: 'Infraestructura',
    academico: 'Sistemas Académicos',
  };

  const estadoLabels = {
    abierta: 'Abierta',
    en_proceso: 'En Proceso',
    en_espera: 'En Espera',
    resuelta: 'Resuelta',
    cerrada: 'Cerrada',
  };

  if (cargando) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Procesando pipelines de agregación en MongoDB Atlas...</p>
      </div>
    );
  }

  // Pipeline 1: Edificios
  const datosEdificio = datos?.por_edificio?.map((item) => ({
    edificio: item._id || 'Sin edificio',
    promedio_horas: Number((item.promedio_horas || 0).toFixed(1)),
    total_horas: Number((item.total_horas || 0).toFixed(1)),
    conteo: item.conteo || 0,
  })) || [];

  // Pipeline 2: Top 10 Etiquetas ($unwind)
  const datosTags = datos?.top_tags?.map((item) => ({
    tag: item._id,
    frecuencia: item.total || item.conteo || 0,
  })) || [];

  // Categorías
  const datosCategoria = datos?.por_categoria?.map((item) => ({
    name: categoriaLabels[item._id] || item._id,
    value: item.total,
  })) || [];

  // Estados
  const datosEstado = datos?.por_estado?.map((item) => ({
    name: estadoLabels[item._id] || item._id,
    value: item.total,
  })) || [];

  const totalResueltas = datosEdificio.reduce((acc, curr) => acc + curr.conteo, 0);
  const totalHorasCampus = datosEdificio.reduce((acc, curr) => acc + curr.total_horas, 0);
  const promedioGeneral = totalResueltas > 0 ? (totalHorasCampus / totalResueltas).toFixed(1) : '0';

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title flex items-center gap-2">
            <BarChart3 size={28} className="text-indigo-400" />
            Analítica Directiva de Incidencias en Campus
          </h1>
          <p className="page__subtitle">
            Pipelines de agregación computados en MongoDB Atlas M0 (RF-06)
          </p>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="stats-grid stats-grid--3 my-4">
        <div className="stat-card stat-card--primary">
          <div className="stat-card__icon">
            <Clock size={24} />
          </div>
          <div className="stat-card__content">
            <p className="stat-card__label">Tiempo Medio de Resolución (MTTR)</p>
            <h2 className="stat-card__value">{promedioGeneral} hrs</h2>
          </div>
        </div>

        <div className="stat-card stat-card--success">
          <div className="stat-card__icon">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-card__content">
            <p className="stat-card__label">Total Resueltas y Cerradas</p>
            <h2 className="stat-card__value">{totalResueltas} casos</h2>
          </div>
        </div>

        <div className="stat-card stat-card--warning">
          <div className="stat-card__icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-card__content">
            <p className="stat-card__label">Horas Totales Invertidas</p>
            <h2 className="stat-card__value">{totalHorasCampus.toFixed(1)} hrs</h2>
          </div>
        </div>
      </div>

      {/* Gráficas Principales */}
      <div className="charts-grid">
        {/* Pipeline 1: Promedio de horas y conteo por edificio */}
        <div className="card">
          <div className="card__header flex items-center justify-between">
            <h2 className="card__title flex items-center gap-2">
              <Building2 size={20} className="text-indigo-400" />
              Pipeline 1: Promedio de Horas por Edificio
            </h2>
            <span className="badge badge--info text-xs">$group por edificio ($avg, $sum)</span>
          </div>
          <div className="card__body chart-container">
            {datosEdificio.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={datosEdificio} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                  <XAxis dataKey="edificio" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8' }} unit=" h" />
                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="promedio_horas" name="Promedio de Horas" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="conteo" name="Total Incidencias Resueltas" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="empty-state__text">No hay suficientes incidencias resueltas para calcular métricas por edificio.</p>
            )}
          </div>
        </div>

        {/* Pipeline 2: Top 10 Etiquetas ($unwind) */}
        <div className="card">
          <div className="card__header flex items-center justify-between">
            <h2 className="card__title flex items-center gap-2">
              <Tag size={20} className="text-amber-400" />
              Pipeline 2: Top 10 Etiquetas Frecuentes
            </h2>
            <span className="badge badge--warning text-xs">$unwind + $group + $sort + $limit(10)</span>
          </div>
          <div className="card__body chart-container">
            {datosTags.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={datosTags} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                  <XAxis type="number" tick={{ fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="tag" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                    }}
                  />
                  <Bar dataKey="frecuencia" name="Ocurrencias" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="empty-state__text">Sin etiquetas registradas.</p>
            )}
          </div>
        </div>

        {/* Distribución por Categoría */}
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Distribución por Categoría</h2>
          </div>
          <div className="card__body chart-container">
            {datosCategoria.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={datosCategoria}
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    innerRadius={45}
                    dataKey="value"
                    paddingAngle={5}
                    label={({ name, value }) => `${name} (${value})`}
                  >
                    {datosCategoria.map((_, i) => (
                      <Cell key={i} fill={COLORES[i % COLORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="empty-state__text">Sin datos</p>
            )}
          </div>
        </div>

        {/* Distribución por Estado */}
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Estado Actual de Casos</h2>
          </div>
          <div className="card__body chart-container">
            {datosEstado.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={datosEstado}
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    innerRadius={45}
                    dataKey="value"
                    paddingAngle={5}
                    label={({ name, value }) => `${name} (${value})`}
                  >
                    {datosEstado.map((_, i) => (
                      <Cell key={i} fill={COLORES[(i + 2) % COLORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="empty-state__text">Sin datos</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnaliticaPage;
