// ═══════════════════════════════════════════════════════════════
// pages/DashboardPage.jsx — Panel de Control Institucional Campus
// Todos los indicadores se calculan dinámicamente en tiempo real
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Monitor,
  Building,
  GraduationCap,
  ExternalLink,
  Users,
  Plus,
  RefreshCw,
  MapPin,
  UserCheck,
  TrendingUp,
  Activity,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import DetalleIncidenciaModal from '../components/incidencias/DetalleIncidenciaModal';
import CrearIncidenciaModal from '../components/incidencias/CrearIncidenciaModal';

const formatearNumeroReporte = (codigo) => {
  if (!codigo || typeof codigo !== 'string') return 'Reporte';
  const partes = codigo.split('-');
  const num = partes[partes.length - 1];
  return num ? `Reporte #${num}` : 'Reporte';
};

const formatearFechaCorta = (fecha) => {
  if (!fecha) return 'Reciente';
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  });
};

const DashboardPage = () => {
  const { usuario, tieneRol } = useAuth();
  const navigate = useNavigate();

  const [incidencias, setIncidencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroTab, setFiltroTab] = useState('todas');
  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState(null);
  const [mostrarCrear, setMostrarCrear] = useState(false);

  const esAdmin = tieneRol('administrador');
  const puedeCrear = tieneRol('reportante', 'coordinador');

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/incidencias', { params: { limite: 500 } });
      const listaTodas = data.datos?.incidencias || [];
      setIncidencias(listaTodas);

      // Sincronizar el contador de "Bandeja de incidencias" en el menú lateral
      window.dispatchEvent(
        new CustomEvent('incidencias-updated', { detail: { total: listaTodas.length } })
      );
    } catch (error) {
      console.warn('Error al cargar datos del panel:', error);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos, usuario]);

  // ─── Cálculos dinámicos y consistentes ─────────────────────────
  const metricas = useMemo(() => {
    const abiertas = incidencias.filter((i) => i.estado === 'abierta').length;
    const enSeguimiento = incidencias.filter(
      (i) => i.estado === 'en_proceso' || i.estado === 'en_progreso' || i.estado === 'en_espera'
    ).length;
    const resueltasCerradas = incidencias.filter(
      (i) => i.estado === 'resuelta' || i.estado === 'cerrada'
    ).length;
    const altaCritica = incidencias.filter(
      (i) => i.prioridad === 'alta' || i.prioridad === 'critica'
    ).length;

    let computo = 0;
    let infraestructura = 0;
    let academico = 0;
    let totalHoras = 0;
    let asignadas = 0;

    const mapaEdificios = {};
    const movimientosRecientes = [];

    incidencias.forEach((inc) => {
      const cat = (inc.categoria || '').toLowerCase();
      if (cat === 'computo_redes') computo++;
      else if (cat === 'infraestructura') infraestructura++;
      else academico++;

      totalHoras += Number(inc.horas_invertidas) || 0;

      const tieneTec =
        (typeof inc.tecnico_asignado === 'string' && inc.tecnico_asignado.trim()) ||
        inc.tecnico_asignado?.nombre ||
        inc.tecnico_asignado?.nombre_completo;
      if (tieneTec) asignadas++;

      const ed = inc.ubicacion?.edificio || 'Campus General';
      if (!mapaEdificios[ed]) {
        mapaEdificios[ed] = { nombre: ed, total: 0, resueltas: 0, abiertas: 0 };
      }
      mapaEdificios[ed].total++;
      if (inc.estado === 'resuelta' || inc.estado === 'cerrada') {
        mapaEdificios[ed].resueltas++;
      } else {
        mapaEdificios[ed].abiertas++;
      }

      if (Array.isArray(inc.historial_seguimiento)) {
        inc.historial_seguimiento.forEach((h) => {
          movimientosRecientes.push({
            id: `${inc._id}-${h.fecha}`,
            incidencia: inc,
            tituloIncidencia: inc.titulo,
            autor: h.autor || 'Equipo de soporte',
            comentario: h.comentario,
            estado: h.estado_asignado || inc.estado,
            fecha: h.fecha,
          });
        });
      }
    });

    const total = computo + infraestructura + academico;
    const tasaResolucion = total > 0 ? Math.round((resueltasCerradas / total) * 100) : 0;
    const promedioHoras =
      resueltasCerradas > 0 ? (totalHoras / resueltasCerradas).toFixed(1) : '0.0';

    const porEdificio = Object.values(mapaEdificios).sort((a, b) => b.total - a.total);
    movimientosRecientes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    return {
      total,
      abiertas,
      enSeguimiento,
      resueltasCerradas,
      altaCritica,
      computo,
      infraestructura,
      academico,
      totalHoras: Number(totalHoras.toFixed(1)),
      promedioHoras,
      tasaResolucion,
      asignadas,
      sinAsignar: Math.max(0, total - asignadas),
      porEdificio: porEdificio.slice(0, 5),
      edificiosActivos: porEdificio.length,
      bitacoraReciente: movimientosRecientes.slice(0, 4),
    };
  }, [incidencias]);

  // Lista filtrada para la tarjeta interactiva de Incidencias recientes
  const incidenciasFiltradas = useMemo(() => {
    let lista = incidencias;
    if (filtroTab === 'abiertas') {
      lista = incidencias.filter((i) => i.estado === 'abierta');
    } else if (filtroTab === 'seguimiento') {
      lista = incidencias.filter(
        (i) => i.estado === 'en_proceso' || i.estado === 'en_progreso' || i.estado === 'en_espera'
      );
    } else if (filtroTab === 'resueltas') {
      lista = incidencias.filter((i) => i.estado === 'resuelta' || i.estado === 'cerrada');
    } else if (filtroTab === 'urgentes') {
      lista = incidencias.filter((i) => i.prioridad === 'alta' || i.prioridad === 'critica');
    }
    return lista.slice(0, 6);
  }, [incidencias, filtroTab]);

  // Helper de icono por categoría
  const getIconoCategoria = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c === 'computo_redes') {
      return <Monitor size={17} className="text-emerald-700 dark:text-emerald-300" />;
    }
    if (c === 'infraestructura') {
      return <Building size={17} className="text-amber-700 dark:text-amber-300" />;
    }
    return <GraduationCap size={17} className="text-blue-700 dark:text-blue-300" />;
  };

  // Helper de badge de estado
  const renderBadgeEstado = (estado) => {
    const est = (estado || '').toLowerCase();
    if (est === 'en_proceso' || est === 'en_progreso' || est === 'en_espera') {
      return (
        <span className="campus-badge campus-badge--proceso">
          <span className="campus-badge__dot bg-blue-500" />
          {est === 'en_espera' ? 'En espera' : 'En proceso'}
        </span>
      );
    }
    if (est === 'abierta') {
      return (
        <span className="campus-badge campus-badge--abierta">
          <span className="campus-badge__dot bg-amber-500" />
          Abierta
        </span>
      );
    }
    return (
      <span className="campus-badge campus-badge--resuelta">
        <span className="campus-badge__dot bg-emerald-500" />
        {est === 'cerrada' ? 'Cerrada' : 'Resuelta'}
      </span>
    );
  };

  const renderBadgePrioridad = (prioridad) => {
    const p = (prioridad || 'media').toLowerCase();
    const estilos = {
      critica: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      alta: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      media: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
      baja: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    };
    const nombres = { critica: 'Crítica', alta: 'Alta', media: 'Media', baja: 'Baja' };
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
          estilos[p] || estilos.media
        }`}
      >
        {nombres[p] || 'Media'}
      </span>
    );
  };

  const nombreMostrar =
    usuario?.nombre?.split(' ')[0] ||
    usuario?.nombre_completo?.split(' ')[0] ||
    'Usuario';

  const totalCat = metricas.total;
  const pctComputo = totalCat > 0 ? Math.round((metricas.computo / totalCat) * 100) : 0;
  const pctInfra = totalCat > 0 ? Math.round((metricas.infraestructura / totalCat) * 100) : 0;
  const pctAcad = totalCat > 0 ? Math.max(0, 100 - pctComputo - pctInfra) : 0;

  const pctAbiertas = totalCat > 0 ? Math.round((metricas.abiertas / totalCat) * 100) : 0;
  const pctSeguimiento = totalCat > 0 ? Math.round((metricas.enSeguimiento / totalCat) * 100) : 0;
  const pctResueltas = totalCat > 0 ? Math.round((metricas.resueltasCerradas / totalCat) * 100) : 0;
  const pctUrgentes = totalCat > 0 ? Math.round((metricas.altaCritica / totalCat) * 100) : 0;

  const fechaHoy = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="campus-page">
      {/* ─── Cabecera Superior con Acciones Rápidas ──────────────── */}
      <div className="campus-header flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="campus-header__top">
            <span className="campus-header__tag">RESUMEN OPERATIVO</span>
            <span className="campus-header__period capitalize">{fechaHoy}</span>
          </div>
          <h1 className="campus-header__title">Hola, {nombreMostrar}</h1>
          <p className="campus-header__subtitle">
            Consulta el estado actual de las instalaciones, servicios y reportes del campus.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={cargarDatos}
            className="btn btn--secondary flex items-center gap-1.5"
            title="Actualizar información"
          >
            <RefreshCw size={15} className={cargando ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>

          {puedeCrear && (
            <button
              type="button"
              onClick={() => setMostrarCrear(true)}
              className="btn btn--primary flex items-center gap-1.5"
            >
              <Plus size={16} />
              <span>Nueva incidencia</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Hero Banner Institucional + Franja de Indicadores ───── */}
      <section className="campus-hero-banner">
        <div className="campus-hero-banner__content">
          <span className="campus-hero-banner__pill">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block mr-1.5" />
            MESA DE AYUDA UNIVERSITARIA
          </span>
          <h2 className="campus-hero-banner__heading">
            Mejores espacios.
            <br />
            Una comunidad conectada.
          </h2>
          <p className="campus-hero-banner__desc">
            Reporta desperfectos, da seguimiento en tiempo real y colabora en el cuidado de nuestra universidad.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {esAdmin ? (
              <button
                type="button"
                onClick={() => navigate('/usuarios')}
                className="campus-hero-banner__cta"
              >
                <Users size={15} />
                <span>Administrar directorio de usuarios</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/incidencias')}
                className="campus-hero-banner__cta"
              >
                <span>Explorar bandeja de incidencias</span>
                <ArrowRight size={15} />
              </button>
            )}

            {tieneRol('coordinador', 'directivo') && (
              <button
                type="button"
                onClick={() => navigate('/analitica')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-white/80 hover:bg-white text-[var(--color-primary)] border border-[var(--color-primary-border)] transition shadow-sm"
              >
                <TrendingUp size={14} />
                <span>Ver estadísticas directivas</span>
              </button>
            )}
          </div>
        </div>

        {/* Ilustración Vectorial de Campus */}
        <div className="campus-hero-banner__illustration" aria-hidden="true">
          <svg
            viewBox="0 0 320 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="campus-hero-banner__svg"
          >
            <circle cx="50" cy="120" r="28" fill="#cbe3d3" opacity="0.8" />
            <circle cx="68" cy="130" r="20" fill="#b7d7c1" opacity="0.9" />
            <circle cx="270" cy="120" r="28" fill="#cbe3d3" opacity="0.8" />
            <circle cx="252" cy="130" r="20" fill="#b7d7c1" opacity="0.9" />
            <line
              x1="20"
              y1="155"
              x2="300"
              y2="155"
              stroke="#487867"
              strokeWidth="2"
              strokeDasharray="3 3"
              opacity="0.4"
            />
            <path
              d="M100 155V75L160 45L220 75V155H100Z"
              fill="#ffffff"
              stroke="#315a4d"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <polygon
              points="100,75 160,45 220,75"
              fill="#eaf2ec"
              stroke="#315a4d"
              strokeWidth="2.5"
            />
            <circle cx="160" cy="62" r="7" fill="#ffffff" stroke="#315a4d" strokeWidth="1.5" />
            <line
              x1="160"
              y1="62"
              x2="160"
              y2="58"
              stroke="#315a4d"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="160"
              y1="62"
              x2="163"
              y2="62"
              stroke="#315a4d"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <rect
              x="120"
              y="85"
              width="20"
              height="15"
              rx="2"
              fill="#e2ede5"
              stroke="#315a4d"
              strokeWidth="1.5"
            />
            <rect
              x="180"
              y="85"
              width="20"
              height="15"
              rx="2"
              fill="#e2ede5"
              stroke="#315a4d"
              strokeWidth="1.5"
            />
            <rect x="145" y="115" width="30" height="40" rx="3" fill="#315a4d" />
            <line x1="160" y1="115" x2="160" y2="155" stroke="#eaf2ec" strokeWidth="1" />
            <rect x="149" y="120" width="8" height="14" fill="#a4cfb7" opacity="0.7" />
            <rect x="163" y="120" width="8" height="14" fill="#a4cfb7" opacity="0.7" />
            <line x1="112" y1="75" x2="112" y2="155" stroke="#315a4d" strokeWidth="1.5" />
            <line x1="208" y1="75" x2="208" y2="155" stroke="#315a4d" strokeWidth="1.5" />
          </svg>
        </div>
      </section>

      {/* ─── 4 Tarjetas de Indicadores Clave con Barra de Progreso ─ */}
      <section className="campus-metrics-grid">
        {/* Card 1: Incidencias abiertas */}
        <div
          onClick={() => setFiltroTab('abiertas')}
          className="campus-metric-card cursor-pointer hover:border-amber-400/60 transition"
          title="Filtrar incidencias abiertas"
        >
          <div className="campus-metric-card__header">
            <span className="campus-metric-card__title">Incidencias abiertas</span>
            <div className="campus-metric-card__icon-wrapper campus-metric-card__icon-wrapper--open">
              <Mail size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <div className="campus-metric-card__number">
              {String(metricas.abiertas).padStart(2, '0')}
            </div>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
              {pctAbiertas}% del total
            </span>
          </div>
          <p className="campus-metric-card__caption">Pendientes de iniciar atención</p>
          <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${pctAbiertas}%` }}
            />
          </div>
        </div>

        {/* Card 2: En seguimiento */}
        <div
          onClick={() => setFiltroTab('seguimiento')}
          className="campus-metric-card cursor-pointer hover:border-blue-400/60 transition"
          title="Filtrar incidencias en seguimiento"
        >
          <div className="campus-metric-card__header">
            <span className="campus-metric-card__title">En seguimiento</span>
            <div className="campus-metric-card__icon-wrapper campus-metric-card__icon-wrapper--pending">
              <Clock size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <div className="campus-metric-card__number">
              {String(metricas.enSeguimiento).padStart(2, '0')}
            </div>
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full">
              {pctSeguimiento}% del total
            </span>
          </div>
          <p className="campus-metric-card__caption">En revisión por personal técnico</p>
          <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${pctSeguimiento}%` }}
            />
          </div>
        </div>

        {/* Card 3: Resueltas y cerradas */}
        <div
          onClick={() => setFiltroTab('resueltas')}
          className="campus-metric-card cursor-pointer hover:border-emerald-400/60 transition"
          title="Filtrar incidencias resueltas"
        >
          <div className="campus-metric-card__header">
            <span className="campus-metric-card__title">Resueltas y cerradas</span>
            <div className="campus-metric-card__icon-wrapper campus-metric-card__icon-wrapper--resolved">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <div className="campus-metric-card__number">
              {String(metricas.resueltasCerradas).padStart(2, '0')}
            </div>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
              {pctResueltas}% completado
            </span>
          </div>
          <p className="campus-metric-card__caption">Atención finalizada satisfactoriamente</p>
          <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${pctResueltas}%` }}
            />
          </div>
        </div>

        {/* Card 4: Prioridad alta o crítica */}
        <div
          onClick={() => setFiltroTab('urgentes')}
          className="campus-metric-card cursor-pointer hover:border-rose-400/60 transition"
          title="Filtrar incidencias prioritarias"
        >
          <div className="campus-metric-card__header">
            <span className="campus-metric-card__title">Prioridad alta o crítica</span>
            <div className="campus-metric-card__icon-wrapper campus-metric-card__icon-wrapper--critical">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <div className="campus-metric-card__number">
              {String(metricas.altaCritica).padStart(2, '0')}
            </div>
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full">
              {pctUrgentes}% urgente
            </span>
          </div>
          <p className="campus-metric-card__caption">Requieren atención prioritaria</p>
          <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${pctUrgentes}%` }}
            />
          </div>
        </div>
      </section>

      {/* ─── Franja de Indicadores de Desempeño del Campus ────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <span className="block text-[11px] text-[var(--color-text-muted)] font-medium">
              Efectividad de resolución
            </span>
            <strong className="text-sm font-bold text-[var(--color-text)]">
              {metricas.tasaResolucion}% de reportes resueltos
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
            <Clock size={18} />
          </div>
          <div>
            <span className="block text-[11px] text-[var(--color-text-muted)] font-medium">
              Tiempo invertido en soporte
            </span>
            <strong className="text-sm font-bold text-[var(--color-text)]">
              {metricas.totalHoras} horas ({metricas.promedioHoras} h prom.)
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <UserCheck size={18} />
          </div>
          <div>
            <span className="block text-[11px] text-[var(--color-text-muted)] font-medium">
              Cobertura de especialistas
            </span>
            <strong className="text-sm font-bold text-[var(--color-text)]">
              {metricas.asignadas} asignadas · {metricas.sinAsignar} por asignar
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
            <Layers size={18} />
          </div>
          <div>
            <span className="block text-[11px] text-[var(--color-text-muted)] font-medium">
              Alcance en instalaciones
            </span>
            <strong className="text-sm font-bold text-[var(--color-text)]">
              {metricas.edificiosActivos} edificios con reportes
            </strong>
          </div>
        </div>
      </section>

      {/* ─── Contenido Principal en 2 Columnas Balanceadas ────────── */}
      <div className="campus-split-grid items-start">
        {/* COLUMNA IZQUIERDA: Incidencias recientes + Actividad de atención */}
        <div className="space-y-6">
          {/* Tarjeta 1: Incidencias recientes con pestañas rápidas */}
          <section className="campus-card campus-recent-card">
            <div className="campus-card__header">
              <div>
                <h3 className="campus-card__title">Incidencias recientes</h3>
                <p className="campus-card__subtitle">
                  Selecciona cualquier reporte para consultar su expediente completo
                </p>
              </div>
              {!esAdmin && (
                <button
                  type="button"
                  onClick={() => navigate('/incidencias')}
                  className="campus-card__action-link"
                >
                  <span>Ver todas ({metricas.total})</span>
                  <ExternalLink size={13} />
                </button>
              )}
            </div>

            {/* Pestañas de filtrado rápido */}
            <div className="px-5 pb-3 flex items-center gap-1.5 flex-wrap border-b border-[var(--color-border-subtle)]">
              {[
                { id: 'todas', label: `Todas (${metricas.total})` },
                { id: 'abiertas', label: `Abiertas (${metricas.abiertas})` },
                { id: 'seguimiento', label: `En seguimiento (${metricas.enSeguimiento})` },
                { id: 'resueltas', label: `Resueltas (${metricas.resueltasCerradas})` },
                { id: 'urgentes', label: `Prioritarias (${metricas.altaCritica})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFiltroTab(tab.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    filtroTab === tab.id
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="campus-recent-list">
              {incidenciasFiltradas.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    No hay incidencias en esta vista
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Prueba seleccionando otra pestaña o registra un nuevo reporte.
                  </p>
                </div>
              ) : (
                incidenciasFiltradas.map((inc) => {
                  const nombreTec =
                    typeof inc.tecnico_asignado === 'string' && inc.tecnico_asignado
                      ? inc.tecnico_asignado
                      : inc.tecnico_asignado?.nombre ||
                        inc.tecnico_asignado?.nombre_completo ||
                        'Sin técnico asignado';

                  return (
                    <div
                      key={inc._id}
                      onClick={() => !esAdmin && setIncidenciaSeleccionada(inc)}
                      className={`campus-recent-item ${esAdmin ? 'cursor-default' : ''}`}
                    >
                      {/* Icono de categoría */}
                      <div className="campus-recent-item__icon">
                        {getIconoCategoria(inc.categoria)}
                      </div>

                      {/* Título y Ubicación */}
                      <div className="campus-recent-item__main">
                        <h4 className="campus-recent-item__title">{inc.titulo}</h4>
                        <p className="campus-recent-item__meta flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className="font-semibold text-[var(--color-primary)]">
                            {formatearNumeroReporte(inc.codigo_incidencia)}
                          </span>
                          <span>·</span>
                          <span>{inc.ubicacion?.edificio || 'Campus'}</span>
                          {inc.ubicacion?.aula_espacio && (
                            <>
                              <span>·</span>
                              <span>{inc.ubicacion.aula_espacio}</span>
                            </>
                          )}
                          <span>·</span>
                          <span className="text-[11px]">{ nombreTec }</span>
                        </p>
                      </div>

                      {/* Estado */}
                      <div className="campus-recent-item__status">
                        {renderBadgeEstado(inc.estado)}
                      </div>

                      {/* Prioridad y Fecha */}
                      <div className="campus-recent-item__priority flex flex-col items-end gap-1">
                        {renderBadgePrioridad(inc.prioridad)}
                        <span className="text-[10px] text-[var(--color-text-muted)]">
                          {formatearFechaCorta(inc.fecha_creacion || inc.fecha_reporte)}
                        </span>
                      </div>

                      {/* Flecha */}
                      {!esAdmin && (
                        <div className="campus-recent-item__chevron">
                          <ChevronRight size={15} />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Tarjeta 2: Últimos movimientos de seguimiento en el campus */}
          <section className="campus-card">
            <div className="campus-card__header">
              <div>
                <h3 className="campus-card__title flex items-center gap-2">
                  <Activity size={16} className="text-[var(--color-primary)]" />
                  Actividad reciente de atención
                </h3>
                <p className="campus-card__subtitle">
                  Últimas notas y actualizaciones registradas por el personal de soporte
                </p>
              </div>
            </div>

            <div className="px-5 pb-5 pt-2">
              {metricas.bitacoraReciente.length === 0 ? (
                <p className="text-xs text-[var(--color-text-muted)] py-4 text-center">
                  Aún no hay movimientos de seguimiento registrados.
                </p>
              ) : (
                <div className="space-y-3">
                  {metricas.bitacoraReciente.map((mov) => (
                    <div
                      key={mov.id}
                      onClick={() => !esAdmin && setIncidenciaSeleccionada(mov.incidencia)}
                      className={`p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] flex items-start justify-between gap-3 transition ${
                        !esAdmin ? 'cursor-pointer hover:border-[var(--color-primary)]/40' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[var(--color-text)]">
                            {mov.autor}
                          </span>
                          <span className="text-[11px] text-[var(--color-text-muted)]">
                            en <strong className="text-[var(--color-text)]">{mov.tituloIncidencia}</strong>
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                          {mov.comentario}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {renderBadgeEstado(mov.estado)}
                        <span className="text-[10px] text-[var(--color-text-muted)]">
                          {formatearFechaCorta(mov.fecha)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA: Por Categoría + Resumen por Edificio */}
        <div className="space-y-6">
          {/* Tarjeta 1: Distribución por categoría */}
          <section className="campus-card campus-category-card">
            <div className="campus-card__header">
              <div>
                <h3 className="campus-card__title">Por categoría</h3>
                <p className="campus-card__subtitle">Distribución de reportes por área de atención</p>
              </div>
            </div>

            <div className="campus-category-card__body">
              <div className="campus-category-total">
                <span className="campus-category-total__number">{metricas.total}</span>
                <span className="campus-category-total__label">incidencias registradas</span>
              </div>

              {/* Barra de Distribución Segmentada */}
              <div className="campus-distribution-bar">
                <div
                  className="campus-distribution-bar__segment bg-emerald-700"
                  style={{ width: `${pctComputo}%` }}
                  title={`Cómputo y redes: ${metricas.computo} (${pctComputo}%)`}
                />
                <div
                  className="campus-distribution-bar__segment bg-amber-600"
                  style={{ width: `${pctInfra}%` }}
                  title={`Infraestructura: ${metricas.infraestructura} (${pctInfra}%)`}
                />
                <div
                  className="campus-distribution-bar__segment bg-blue-500"
                  style={{ width: `${pctAcad}%` }}
                  title={`Servicios académicos: ${metricas.academico} (${pctAcad}%)`}
                />
              </div>

              {/* Lista detallada de Categorías */}
              <div className="campus-category-list">
                <div className="campus-category-row">
                  <div className="flex items-center gap-2.5">
                    <div className="campus-category-row__icon-box bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700">
                      <Monitor size={15} />
                    </div>
                    <div>
                      <span className="campus-category-row__name block">Cómputo y redes</span>
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        Conectividad, laboratorios y equipos ({pctComputo}%)
                      </span>
                    </div>
                  </div>
                  <span className="campus-category-row__count">{metricas.computo}</span>
                </div>

                <div className="campus-category-row">
                  <div className="flex items-center gap-2.5">
                    <div className="campus-category-row__icon-box bg-amber-50 dark:bg-amber-950/40 text-amber-700">
                      <Building size={15} />
                    </div>
                    <div>
                      <span className="campus-category-row__name block">Infraestructura</span>
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        Climatización, mobiliario y mantenimiento ({pctInfra}%)
                      </span>
                    </div>
                  </div>
                  <span className="campus-category-row__count">{metricas.infraestructura}</span>
                </div>

                <div className="campus-category-row">
                  <div className="flex items-center gap-2.5">
                    <div className="campus-category-row__icon-box bg-blue-50 dark:bg-blue-950/40 text-blue-700">
                      <GraduationCap size={15} />
                    </div>
                    <div>
                      <span className="campus-category-row__name block">Servicios académicos</span>
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        Plataformas educativas y control escolar ({pctAcad}%)
                      </span>
                    </div>
                  </div>
                  <span className="campus-category-row__count">{metricas.academico}</span>
                </div>
              </div>

              {/* Balance verificado */}
              <div className="campus-category-callout">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Balance general: {metricas.abiertas} abiertas, {metricas.enSeguimiento} en seguimiento y{' '}
                  {metricas.resueltasCerradas} resueltas.
                </p>
              </div>
            </div>
          </section>

          {/* Tarjeta 2: Incidencias por Edificio del Campus */}
          <section className="campus-card">
            <div className="campus-card__header">
              <div>
                <h3 className="campus-card__title flex items-center gap-2">
                  <MapPin size={16} className="text-[var(--color-primary)]" />
                  Incidencias por edificio
                </h3>
                <p className="campus-card__subtitle">
                  Ubicaciones con mayor actividad y avance de atención
                </p>
              </div>
            </div>

            <div className="px-5 pb-5 pt-2 space-y-3.5">
              {metricas.porEdificio.length === 0 ? (
                <p className="text-xs text-[var(--color-text-muted)] py-4 text-center">
                  Sin datos de edificios registrados.
                </p>
              ) : (
                metricas.porEdificio.map((ed) => {
                  const pctEd = ed.total > 0 ? Math.round((ed.resueltas / ed.total) * 100) : 0;
                  return (
                    <div key={ed.nombre} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--color-text)] truncate pr-2">
                          {ed.nombre}
                        </span>
                        <span className="text-[var(--color-text-muted)] shrink-0">
                          <strong className="text-[var(--color-text)]">{ed.total}</strong> reporte(s) ·{' '}
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                            {ed.resueltas} resuelta(s)
                          </span>
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[var(--color-bg)] rounded-full overflow-hidden border border-[var(--color-border-subtle)]">
                        <div
                          className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500"
                          style={{ width: `${ Math.max(pctEd, ed.total > 0 ? 12 : 0) }%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ─── Banner Inferior de Atención Oportuna ──────────────── */}
      <section className="campus-alert-banner">
        <div className="campus-alert-banner__left">
          <div className="campus-alert-banner__icon">
            <Clock size={18} />
          </div>
          <div>
            <h4 className="campus-alert-banner__title">La atención oportuna empieza aquí</h4>
            <p className="campus-alert-banner__desc">
              Actualmente hay {metricas.altaCritica} incidencias con prioridad alta o crítica. Revisa su
              estado y avances de solución.
            </p>
          </div>
        </div>

        {tieneRol('coordinador', 'directivo') ? (
          <button
            type="button"
            onClick={() => navigate('/analitica')}
            className="campus-alert-banner__link"
          >
            <span>Explorar analítica</span>
            <ArrowRight size={14} />
          </button>
        ) : !esAdmin ? (
          <button
            type="button"
            onClick={() => navigate('/incidencias')}
            className="campus-alert-banner__link"
          >
            <span>Ir a la bandeja</span>
            <ArrowRight size={14} />
          </button>
        ) : null}
      </section>

      {/* ─── Footer Institucional de Página ────────────────────── */}
      <footer className="campus-page-footer">
        <p>Mesa de Ayuda Universitaria · Sistema Integral de Gestión de Incidencias del Campus</p>
      </footer>

      {/* Modal de Crear Incidencia */}
      {mostrarCrear && (
        <CrearIncidenciaModal
          onClose={() => setMostrarCrear(false)}
          onCreated={() => {
            setMostrarCrear(false);
            cargarDatos();
          }}
        />
      )}

      {/* Modal de Detalle */}
      {incidenciaSeleccionada && (
        <DetalleIncidenciaModal
          incidencia={incidenciaSeleccionada}
          onClose={() => setIncidenciaSeleccionada(null)}
          onUpdated={cargarDatos}
        />
      )}
    </div>
  );
};

export default DashboardPage;
