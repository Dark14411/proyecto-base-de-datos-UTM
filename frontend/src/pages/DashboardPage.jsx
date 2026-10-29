// ═══════════════════════════════════════════════════════════════
// pages/DashboardPage.jsx — Panel de Control Minimalista y Elegante
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import ThemeToggle from '../components/ui/ThemeToggle';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  PlusCircle,
  Building2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import DetalleIncidenciaModal from '../components/incidencias/DetalleIncidenciaModal';

const DashboardPage = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ total: 0, abiertas: 0, en_proceso: 0, resueltas: 0 });
  const [recientes, setRecientes] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [cargando, setCargando] = useState(true);
  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [resRecientes, resTodas] = await Promise.all([
        api.get('/incidencias', { params: { limite: 8 } }),
        api.get('/incidencias', { params: { limite: 100 } }),
      ]);

      const listaRecientes = resRecientes.data.datos?.incidencias || [];
      const listaTodas = resTodas.data.datos?.incidencias || [];
      setRecientes(listaRecientes);

      const abiertas = listaTodas.filter((i) => i.estado === 'abierta').length;
      const enProceso = listaTodas.filter(
        (i) => i.estado === 'en_proceso' || i.estado === 'en_progreso' || i.estado === 'en_espera'
      ).length;
      const resueltas = listaTodas.filter((i) => i.estado === 'resuelta' || i.estado === 'cerrada').length;

      setStats({
        total: resRecientes.data.datos?.paginacion?.total || listaTodas.length,
        abiertas,
        en_proceso: enProceso,
        resueltas,
      });
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setCargando(false);
    }
  };

  const estadoBadgeClass = {
    abierta: 'minimal-badge minimal-badge--danger',
    en_proceso: 'minimal-badge minimal-badge--warning',
    en_progreso: 'minimal-badge minimal-badge--warning',
    en_espera: 'minimal-badge minimal-badge--info',
    resuelta: 'minimal-badge minimal-badge--success',
    cerrada: 'minimal-badge minimal-badge--muted',
  };

  const estadoTexto = {
    abierta: 'Abierta',
    en_proceso: 'En Atención',
    en_progreso: 'En Progreso',
    en_espera: 'En Espera',
    resuelta: 'Resuelta',
    cerrada: 'Cerrada',
  };

  const prioridadDot = {
    baja: 'bg-emerald-400',
    media: 'bg-sky-400',
    alta: 'bg-amber-400',
    critica: 'bg-rose-500 animate-pulse',
  };

  const categoriaIcono = {
    computo_redes: '💻',
    infraestructura: '🏗️',
    academico: '🎓',
    sistemas_academicos: '🎓',
  };

  // Filtrar incidencias recientes según la pestaña seleccionada
  const incidenciasFiltradas = recientes.filter((inc) => {
    if (filtroEstado === 'todas') return true;
    if (filtroEstado === 'abiertas') return inc.estado === 'abierta';
    if (filtroEstado === 'en_proceso') {
      return inc.estado === 'en_proceso' || inc.estado === 'en_progreso' || inc.estado === 'en_espera';
    }
    if (filtroEstado === 'resueltas') {
      return inc.estado === 'resuelta' || inc.estado === 'cerrada';
    }
    return true;
  });

  const nombreUsuario = usuario?.nombre || usuario?.nombre_completo || 'Usuario';
  const primerNombre = nombreUsuario.split(' ')[0];

  // Cálculo de porcentaje de resolución
  const porcentajeResueltas =
    stats.total > 0 ? Math.round((stats.resueltas / stats.total) * 100) : 0;

  // Formato de fecha actual
  const fechaHoy = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (cargando) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p className="text-sm font-medium">Cargando panel de control...</p>
      </div>
    );
  }

  return (
    <div className="page page--minimal">
      {/* ─── Encabezado Minimalista ─────────────────────────────── */}
      <header className="minimal-header">
        <div className="minimal-header__info">
          <div className="flex items-center gap-2 mb-1">
            <span className="minimal-header__greeting">Hola, {primerNombre} 👋</span>
            <span className="minimal-header__role-pill">{usuario?.rol || 'Usuario'}</span>
          </div>
          <p className="minimal-header__date capitalize flex items-center gap-1.5">
            <Calendar size={13} className="text-muted" />
            {fechaHoy} • Campus Universidad Tecnológica Metropolitana
          </p>
        </div>

        <div className="minimal-header__actions">
          <ThemeToggle className="theme-toggle--header" />

          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => navigate('/incidencias')}
          >
            <Layers size={15} />
            <span>Ver Catálogo</span>
          </button>

          <button
            type="button"
            className="btn btn--primary btn--sm shadow-sm"
            onClick={() => navigate('/incidencias')}
          >
            <PlusCircle size={15} />
            <span>Nueva Incidencia</span>
          </button>
        </div>
      </header>

      {/* ─── Tarjetas de Estadísticas Minimalistas ───────────────── */}
      <section className="minimal-stats-grid">
        {/* Total */}
        <div className="minimal-stat-card">
          <div className="minimal-stat-card__header">
            <span className="minimal-stat-card__label">Total Visibles</span>
            <div className="minimal-stat-card__icon minimal-stat-card__icon--indigo">
              <FileText size={18} />
            </div>
          </div>
          <div className="minimal-stat-card__body">
            <h2 className="minimal-stat-card__value">{stats.total}</h2>
            <div className="minimal-stat-card__progress">
              <div
                className="minimal-stat-card__progress-bar bg-indigo-500"
                style={{ width: '100%' }}
              />
            </div>
            <span className="minimal-stat-card__hint">Incidencias en la plataforma</span>
          </div>
        </div>

        {/* Abiertas */}
        <div className="minimal-stat-card">
          <div className="minimal-stat-card__header">
            <span className="minimal-stat-card__label">Pendientes</span>
            <div className="minimal-stat-card__icon minimal-stat-card__icon--danger">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="minimal-stat-card__body">
            <h2 className="minimal-stat-card__value">{stats.abiertas}</h2>
            <div className="minimal-stat-card__progress">
              <div
                className="minimal-stat-card__progress-bar bg-rose-500"
                style={{
                  width: `${stats.total > 0 ? (stats.abiertas / stats.total) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="minimal-stat-card__hint text-rose-400">Por atender o asignar</span>
          </div>
        </div>

        {/* En Atención */}
        <div className="minimal-stat-card">
          <div className="minimal-stat-card__header">
            <span className="minimal-stat-card__label">En Atención</span>
            <div className="minimal-stat-card__icon minimal-stat-card__icon--warning">
              <Clock size={18} />
            </div>
          </div>
          <div className="minimal-stat-card__body">
            <h2 className="minimal-stat-card__value">{stats.en_proceso}</h2>
            <div className="minimal-stat-card__progress">
              <div
                className="minimal-stat-card__progress-bar bg-amber-500"
                style={{
                  width: `${stats.total > 0 ? (stats.en_proceso / stats.total) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="minimal-stat-card__hint text-amber-400">Cuadrilla técnica en sitio</span>
          </div>
        </div>

        {/* Resueltas */}
        <div className="minimal-stat-card">
          <div className="minimal-stat-card__header">
            <span className="minimal-stat-card__label">Resueltas</span>
            <div className="minimal-stat-card__icon minimal-stat-card__icon--success">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="minimal-stat-card__body">
            <div className="flex items-baseline justify-between">
              <h2 className="minimal-stat-card__value">{stats.resueltas}</h2>
              <span className="text-xs font-semibold text-emerald-400">
                {porcentajeResueltas}% tasa éxito
              </span>
            </div>
            <div className="minimal-stat-card__progress">
              <div
                className="minimal-stat-card__progress-bar bg-emerald-500"
                style={{ width: `${porcentajeResueltas}%` }}
              />
            </div>
            <span className="minimal-stat-card__hint text-emerald-400">Atendidas con éxito</span>
          </div>
        </div>
      </section>

      {/* ─── Tabla Minimalista de Incidencias Recientes ───────────── */}
      <section className="minimal-table-card">
        {/* Cabecera de la sección con Filtros Minimalistas */}
        <div className="minimal-table-card__header">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-400" />
            <h2 className="minimal-table-card__title">Incidencias Recientes en el Campus</h2>
          </div>

          <div className="minimal-tabs">
            <button
              type="button"
              className={`minimal-tab ${filtroEstado === 'todas' ? 'minimal-tab--active' : ''}`}
              onClick={() => setFiltroEstado('todas')}
            >
              Todas ({recientes.length})
            </button>
            <button
              type="button"
              className={`minimal-tab ${filtroEstado === 'abiertas' ? 'minimal-tab--active' : ''}`}
              onClick={() => setFiltroEstado('abiertas')}
            >
              Abiertas
            </button>
            <button
              type="button"
              className={`minimal-tab ${filtroEstado === 'en_proceso' ? 'minimal-tab--active' : ''}`}
              onClick={() => setFiltroEstado('en_proceso')}
            >
              En Proceso
            </button>
            <button
              type="button"
              className={`minimal-tab ${filtroEstado === 'resueltas' ? 'minimal-tab--active' : ''}`}
              onClick={() => setFiltroEstado('resueltas')}
            >
              Resueltas
            </button>
          </div>
        </div>

        {/* Contenido / Listado */}
        <div className="minimal-table-card__body">
          {incidenciasFiltradas.length === 0 ? (
            <div className="empty-state py-12">
              <FileText size={40} className="text-muted mb-2 opacity-50" />
              <p className="text-sm font-medium text-slate-300">
                No hay incidencias que coincidan con este filtro.
              </p>
              <span className="text-xs text-muted">
                Todas las solicitudes del campus se actualizan en tiempo real.
              </span>
            </div>
          ) : (
            <div className="table-responsive custom-scrollbar">
              <table className="minimal-table">
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Incidencia</th>
                    <th>Prioridad</th>
                    <th>Estado</th>
                    <th>Ubicación</th>
                    <th>Fecha</th>
                    <th className="text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {incidenciasFiltradas.map((inc) => (
                    <tr
                      key={inc._id}
                      onClick={() => setIncidenciaSeleccionada(inc)}
                      className="minimal-table__row"
                    >
                      {/* Folio */}
                      <td>
                        <span className="minimal-folio">
                          {inc.codigo_incidencia || 'SIN-FOLIO'}
                        </span>
                      </td>

                      {/* Título y Categoría */}
                      <td className="max-w-xs">
                        <div className="minimal-incident-info">
                          <span className="minimal-incident-info__title truncate">
                            {inc.titulo}
                          </span>
                          <span className="minimal-incident-info__cat">
                            {categoriaIcono[inc.categoria] || '📌'} {inc.categoria}
                          </span>
                        </div>
                      </td>

                      {/* Prioridad con punto de color */}
                      <td>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              prioridadDot[inc.prioridad] || 'bg-slate-400'
                            }`}
                          />
                          <span className="text-xs capitalize font-medium">
                            {inc.prioridad || 'Media'}
                          </span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td>
                        <span className={estadoBadgeClass[inc.estado] || 'minimal-badge'}>
                          {estadoTexto[inc.estado] || inc.estado}
                        </span>
                      </td>

                      {/* Ubicación */}
                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-muted">
                          <Building2 size={13} className="shrink-0" />
                          <span className="truncate max-w-[150px]">
                            {inc.ubicacion?.edificio || 'Campus'} •{' '}
                            {inc.ubicacion?.aula_espacio || inc.ubicacion?.aula_o_zona || 'General'}
                          </span>
                        </div>
                      </td>

                      {/* Fecha */}
                      <td>
                        <span className="text-xs text-muted">
                          {new Date(
                            inc.fecha_creacion || inc.fecha_reporte || Date.now()
                          ).toLocaleDateString('es-MX', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </span>
                      </td>

                      {/* Ver Expediente */}
                      <td className="text-right">
                        <button
                          type="button"
                          className="minimal-row-btn"
                          aria-label="Ver detalles"
                        >
                          <span>Ver</span>
                          <ArrowRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Modal de Detalle al hacer clic en cualquier incidencia */}
      {incidenciaSeleccionada && (
        <DetalleIncidenciaModal
          incidencia={incidenciaSeleccionada}
          onClose={() => setIncidenciaSeleccionada(null)}
          onUpdated={() => {
            cargarDatos();
          }}
        />
      )}
    </div>
  );
};

export default DashboardPage;
