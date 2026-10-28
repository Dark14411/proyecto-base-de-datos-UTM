// ═══════════════════════════════════════════════════════════════
// pages/AnaliticaPage.jsx — Panel de Estadísticas y Analítica Directiva
// Muestra la eficiencia operativa por edificio y las 10 fallas más recurrentes
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
import { BarChart3, Clock, TrendingUp, Tag, Building2, CheckCircle2, RefreshCw } from 'lucide-react';

const COLORES = ['#315a4d', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];

const etiquetaLegible = (valor) =>
  typeof valor === 'string' ? valor.replace(/_/g, ' ') : valor;

const AnaliticaPage = () => {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    setCargando(true);
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
    academico: 'Servicios Académicos',
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
        <p>Calculando indicadores estadísticos del campus...</p>
      </div>
    );
  }

  // Métrica 1: Eficiencia operativa por edificio
  const datosEdificio =
    datos?.por_edificio?.map((item) => ({
      edificio: item._id || 'Sin edificio',
      promedio_horas: Number((item.promedio_horas || 0).toFixed(2)),
      total_horas: Number((item.total_horas || 0).toFixed(2)),
      conteo: item.conteo || 0,
    })) || [];

  // Métrica 2: Ranking de las 10 etiquetas y fallas más frecuentes
  const datosTags =
    datos?.top_tags?.map((item, idx) => ({
      posicion: idx + 1,
      tag: etiquetaLegible(item._id),
      frecuencia: item.total || item.conteo || 0,
    })) || [];

  // Categorías
  const datosCategoria =
    datos?.por_categoria?.map((item) => ({
      name: categoriaLabels[item._id] || etiquetaLegible(item._id),
      value: item.total,
    })) || [];

  // Estados
  const datosEstado =
    datos?.por_estado?.map((item) => ({
      name: estadoLabels[item._id] || etiquetaLegible(item._id),
      value: item.total,
    })) || [];

  const totalResueltas = datosEdificio.reduce((acc, curr) => acc + curr.conteo, 0);
  const totalHorasCampus = datosEdificio.reduce((acc, curr) => acc + curr.total_horas, 0);
  const promedioGeneral = totalResueltas > 0 ? (totalHorasCampus / totalResueltas).toFixed(2) : '0.00';

  return (
    <div className="page">
      <div className="page__header flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="page__title flex items-center gap-2">
            <BarChart3 size={28} className="text-emerald-700 dark:text-emerald-400" />
            Estadísticas y Analítica Directiva
          </h1>
          <p className="page__subtitle">
            Indicadores de tiempos de respuesta, eficiencia por edificio y fallas recurrentes del campus
          </p>
        </div>
        <button
          type="button"
          className="btn btn--secondary flex items-center gap-1.5"
          onClick={cargarEstadisticas}
        >
          <RefreshCw size={16} />
          <span>Actualizar estadísticas</span>
        </button>
      </div>

      {/* Tarjetas KPI */}
      <div className="stats-grid stats-grid--3 my-4">
        <div className="stat-card stat-card--primary">
          <div className="stat-card__icon">
            <Clock size={24} />
          </div>
          <div className="stat-card__content">
            <p className="stat-card__label">Promedio General de Resolución</p>
            <h2 className="stat-card__value">{promedioGeneral} hrs</h2>
          </div>
        </div>

        <div className="stat-card stat-card--success">
          <div className="stat-card__icon">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-card__content">
            <p className="stat-card__label">Incidencias Resueltas y Cerradas</p>
            <h2 className="stat-card__value">{totalResueltas} casos</h2>
          </div>
        </div>

        <div className="stat-card stat-card--warning">
          <div className="stat-card__icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-card__content">
            <p className="stat-card__label">Total de Horas Dedicadas</p>
            <h2 className="stat-card__value">{totalHorasCampus.toFixed(1)} hrs</h2>
          </div>
        </div>
      </div>

      {/* Gráficas Principales */}
      <div className="charts-grid">
        {/* Eficiencia operativa por edificio */}
        <div className="card">
          <div className="card__header flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="card__title flex items-center gap-2">
                <Building2 size={20} className="text-[var(--color-primary)]" />
                Eficiencia Operativa por Edificio
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Comparativa de horas invertidas, tiempo promedio y casos resueltos en cada edificio
              </p>
            </div>
            <span className="badge badge--info text-xs">Casos resueltos</span>
          </div>
          <div className="card__body chart-container">
            {datosEdificio.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={datosEdificio} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                    <XAxis
                      dataKey="edificio"
                      tick={{ fill: 'currentColor', fontSize: 12 }}
                      className="text-[var(--color-text-muted)]"
                    />
                    <YAxis
                      tick={{ fill: 'currentColor', fontSize: 12 }}
                      className="text-[var(--color-text-muted)]"
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        color: 'var(--color-text)',
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="promedio_horas"
                      name="Promedio de horas"
                      fill="#315a4d"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="total_horas"
                      name="Total de horas invertidas"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="conteo"
                      name="Cantidad de incidencias resueltas"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>

                <div className="table-responsive mt-3 border-t border-[var(--color-border)] pt-3">
                  <table className="table text-xs">
                    <thead>
                      <tr>
                        <th>Edificio</th>
                        <th className="text-center">Incidencias Resueltas</th>
                        <th className="text-center">Promedio de Horas</th>
                        <th className="text-right">Total de Horas Invertidas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datosEdificio.map((d) => (
                        <tr key={d.edificio}>
                          <td className="font-semibold">{d.edificio}</td>
                          <td className="text-center">
                            <span className="badge badge--success">{d.conteo}</span>
                          </td>
                          <td className="text-center font-medium">{d.promedio_horas} hrs</td>
                          <td className="text-right font-bold text-emerald-700 dark:text-emerald-400">
                            {d.total_horas} hrs
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="empty-state__text">
                No hay suficientes incidencias resueltas para calcular métricas por edificio.
              </p>
            )}
          </div>
        </div>

        {/* Ranking Top 10 de etiquetas y fallas crónicas */}
        <div className="card">
          <div className="card__header flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="card__title flex items-center gap-2">
                <Tag size={20} className="text-amber-500" />
                Principales Etiquetas y Fallas Recurrentes
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Las 10 categorías temáticas con mayor número de reportes en el campus
              </p>
            </div>
            <span className="badge badge--warning text-xs">Top 10 más frecuentes</span>
          </div>
          <div className="card__body chart-container">
            {datosTags.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={datosTags}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 45, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fill: 'currentColor', fontSize: 12 }}
                      className="text-[var(--color-text-muted)]"
                    />
                    <YAxis
                      type="category"
                      dataKey="tag"
                      tick={{ fill: 'currentColor', fontSize: 11 }}
                      className="text-[var(--color-text-muted)] capitalize"
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        color: 'var(--color-text)',
                      }}
                    />
                    <Bar
                      dataKey="frecuencia"
                      name="Reportes asociados"
                      fill="#f59e0b"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>

                <div className="table-responsive mt-3 border-t border-[var(--color-border)] pt-3">
                  <table className="table text-xs">
                    <thead>
                      <tr>
                        <th>Posición</th>
                        <th>Etiqueta de clasificación</th>
                        <th className="text-right">Incidencias asociadas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datosTags.map((t) => (
                        <tr key={t.tag}>
                          <td className="font-semibold text-slate-500">{t.posicion}°</td>
                          <td>
                            <span className="badge badge--primary capitalize">{t.tag}</span>
                          </td>
                          <td className="text-right font-bold">{t.frecuencia} reporte(s)</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
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
