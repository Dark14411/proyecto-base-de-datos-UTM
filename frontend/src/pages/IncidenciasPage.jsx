// ═══════════════════════════════════════════════════════════════
// pages/IncidenciasPage.jsx — Bandeja de Incidencias (RF-05, RF-08, RNF-04)
// Filtros del Índice Compuesto { categoria: 1, estado: 1, "ubicacion.edificio": 1 }
// y Búsqueda Textual Ponderada ($text con textScore en español)
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  Plus,
  Search,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import CrearIncidenciaModal from '../components/incidencias/CrearIncidenciaModal';
import DetalleIncidenciaModal from '../components/incidencias/DetalleIncidenciaModal';

const IncidenciasPage = () => {
  const { usuario, tieneRol } = useAuth();
  const [incidencias, setIncidencias] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [paginacion, setPaginacion] = useState({});
  const [cargando, setCargando] = useState(true);
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState(null);
  const [textoInput, setTextoInput] = useState('');

  // Filtros que mapean directamente al Índice Compuesto { categoria: 1, estado: 1, "ubicacion.edificio": 1 }
  const [filtros, setFiltros] = useState({
    categoria: '',
    estado: '',
    edificio: '',
    prioridad: '',
    busqueda: '',
    pagina: 1,
  });

  useEffect(() => {
    // Cargar catálogo de edificios desde edificios_campus para el filtro del índice compuesto
    api
      .get('/edificios')
      .then(({ data }) => setEdificios(data.datos || []))
      .catch((err) => console.error('Error cargando edificios:', err));
  }, []);

  const cargarIncidencias = useCallback(async () => {
    setCargando(true);
    try {
      const params = { ...filtros, limite: 15 };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);

      const { data } = await api.get('/incidencias', { params });
      const lista = data.datos?.incidencias || [];
      const pag = data.datos?.paginacion || {};
      setIncidencias(lista);
      setPaginacion(pag);

      // Si no hay filtros activos, sincronizar badge del sidebar con el total de la bandeja
      if (!filtros.categoria && !filtros.estado && !filtros.edificio && !filtros.prioridad && !filtros.busqueda) {
        window.dispatchEvent(
          new CustomEvent('incidencias-updated', { detail: { total: pag.total ?? lista.length } })
        );
      }
    } catch (error) {
      console.error('Error cargando incidencias:', error);
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  useEffect(() => {
    cargarIncidencias();
  }, [cargarIncidencias, usuario]);

  const handleBuscar = (e) => {
    e.preventDefault();
    setFiltros((prev) => ({
      ...prev,
      busqueda: textoInput.trim(),
      pagina: 1,
    }));
  };

  const limpiarFiltros = () => {
    setTextoInput('');
    setFiltros({
      categoria: '',
      estado: '',
      edificio: '',
      prioridad: '',
      busqueda: '',
      pagina: 1,
    });
  };

  const estadoColor = {
    abierta: 'badge--danger',
    en_proceso: 'badge--warning',
    en_progreso: 'badge--warning',
    en_espera: 'badge--info',
    resuelta: 'badge--success',
    cerrada: 'badge--secondary',
  };

  const prioridadColor = {
    baja: 'badge--secondary',
    media: 'badge--info',
    alta: 'badge--warning',
    critica: 'badge--danger',
  };

  const categoriaLabels = {
    computo_redes: 'Cómputo y redes',
    infraestructura: 'Infraestructura',
    academico: 'Servicios académicos',
    sistemas_academicos: 'Servicios académicos',
  };

  const hayFiltrosActivos = Boolean(
    filtros.categoria || filtros.estado || filtros.edificio || filtros.prioridad || filtros.busqueda || textoInput
  );

  const esDirectivo = tieneRol('directivo');

  const formatearFolio = (codigo) => {
    if (!codigo || typeof codigo !== 'string') return 'Reporte';
    const partes = codigo.split('-');
    const num = partes[partes.length - 1];
    return num ? `#${num}` : codigo;
  };

  return (
    <div className="page">
      <div className="page__header flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="page__title">Bandeja de incidencias</h1>
            {esDirectivo && (
              <span className="badge badge--warning text-xs">Vista de Supervisión (Solo Lectura)</span>
            )}
          </div>
          <p className="page__subtitle">
            Consulta, filtra por categoría, estado y edificio, o busca reportes por palabras clave
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn--secondary flex items-center gap-1.5"
            onClick={cargarIncidencias}
            title="Recargar datos"
          >
            <RefreshCw size={16} />
            <span>Actualizar</span>
          </button>
          {/* RF-01 y Matriz de Roles: Reportante (y Coordinador) pueden registrar nuevas incidencias */}
          {tieneRol('reportante', 'coordinador') && (
            <button
              className="btn btn--primary flex items-center gap-1.5"
              onClick={() => setMostrarCrear(true)}
            >
              <Plus size={18} />
              <span>Nueva incidencia</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Búsqueda Ponderada y Filtros de Índice Compuesto (RF-05 / RF-08 / RNF-04) */}
      <div className="card my-3">
        <div className="card__body">
          <form className="filters-bar flex flex-wrap items-center gap-3" onSubmit={handleBuscar}>
            {/* Buscador Ponderado sobre titulo (peso 10) y descripcion (peso 5) en español */}
            <div className="filters-bar__search flex-1 min-w-[240px] relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                className="form-input pl-9"
                placeholder="Buscar por título o descripción del reporte..."
                value={textoInput}
                onChange={(e) => setTextoInput(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn--primary flex items-center gap-1.5">
              <Search size={15} />
              <span>Buscar</span>
            </button>

            {/* Selector 1 del Índice Compuesto: categoria */}
            <select
              className="form-select w-auto min-w-[165px]"
              value={filtros.categoria}
              onChange={(e) =>
                setFiltros({ ...filtros, categoria: e.target.value, pagina: 1 })
              }
              aria-label="Filtrar por categoría"
            >
              <option value="">Todas las categorías</option>
              <option value="computo_redes">Cómputo y redes</option>
              <option value="infraestructura">Infraestructura</option>
              <option value="academico">Servicios académicos</option>
            </select>

            {/* Selector 2 del Índice Compuesto: estado */}
            <select
              className="form-select w-auto min-w-[150px]"
              value={filtros.estado}
              onChange={(e) =>
                setFiltros({ ...filtros, estado: e.target.value, pagina: 1 })
              }
              aria-label="Filtrar por estado"
            >
              <option value="">Todos los estados</option>
              <option value="abierta">Abierta</option>
              <option value="en_proceso">En proceso</option>
              <option value="en_espera">En espera</option>
              <option value="resuelta">Resuelta</option>
              <option value="cerrada">Cerrada</option>
            </select>

            {/* Selector 3 del Índice Compuesto: "ubicacion.edificio" (edificios_campus) */}
            <select
              className="form-select w-auto min-w-[165px]"
              value={filtros.edificio}
              onChange={(e) =>
                setFiltros({ ...filtros, edificio: e.target.value, pagina: 1 })
              }
              aria-label="Filtrar por edificio"
            >
              <option value="">Todos los edificios</option>
              {edificios.map((ed) => (
                <option key={ed._id || ed.clave} value={ed.nombre}>
                  {ed.nombre} {ed.clave ? `(${ed.clave})` : ''}
                </option>
              ))}
            </select>

            {/* Selector adicional: Prioridad */}
            <select
              className="form-select w-auto min-w-[150px]"
              value={filtros.prioridad}
              onChange={(e) =>
                setFiltros({ ...filtros, prioridad: e.target.value, pagina: 1 })
              }
              aria-label="Filtrar por prioridad"
            >
              <option value="">Todas las prioridades</option>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>

            {hayFiltrosActivos && (
              <button
                type="button"
                className="btn btn--ghost text-xs"
                onClick={limpiarFiltros}
              >
                Limpiar filtros
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Tabla de Incidencias */}
      <div className="card">
        <div className="card__body">
          {cargando ? (
            <div className="loading-screen py-8 text-center">
              <div className="loading-spinner mb-2" />
              <p className="text-sm text-gray-500">Cargando incidencias del campus...</p>
            </div>
          ) : incidencias.length === 0 ? (
            <div className="empty-state py-8 text-center">
              <FileText size={48} className="mx-auto text-[var(--color-text-muted)] mb-2 opacity-50" />
              <h3 className="font-semibold text-[var(--color-text)]">No se encontraron incidencias</h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                Ajusta los filtros de búsqueda o registra un nuevo reporte.
              </p>
              {hayFiltrosActivos && (
                <button className="btn btn--secondary text-xs" onClick={limpiarFiltros}>
                  Restablecer Filtros
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Folio</th>
                      <th>Título y Relevancia</th>
                      <th>Categoría</th>
                      <th>Prioridad</th>
                      <th>Estado</th>
                      <th>Edificio / Espacio</th>
                      <th>Técnico Asignado</th>
                      <th>Fecha</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidencias.map((inc) => {
                      const nombreTec =
                        typeof inc.tecnico_asignado === 'string' && inc.tecnico_asignado
                          ? inc.tecnico_asignado
                          : inc.tecnico_asignado?.nombre ||
                            inc.tecnico_asignado?.nombre_completo ||
                            'Sin asignar';

                      return (
                        <tr
                          key={inc._id}
                          className="cursor-pointer"
                          onClick={() => setIncidenciaSeleccionada(inc)}
                        >
                          <td>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary-border)]">
                              Reporte {formatearFolio(inc.codigo_incidencia)}
                            </span>
                          </td>
                          <td className="table__title-cell font-medium">
                            <div className="flex flex-col gap-1">
                              <span className="text-[var(--color-text)] font-semibold">{inc.titulo}</span>
                              {inc.score !== undefined && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 w-fit">
                                  <Sparkles size={11} className="text-emerald-600" />
                                  Relevancia: {Number(inc.score).toFixed(2)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="text-xs">{categoriaLabels[inc.categoria] || inc.categoria}</td>
                          <td>
                            <span className={`badge ${prioridadColor[inc.prioridad]}`}>
                              {inc.prioridad?.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${estadoColor[inc.estado] || 'badge--secondary'}`}>
                              {inc.estado?.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="text-xs text-[var(--color-text-muted)]">
                            {inc.ubicacion?.edificio} • {inc.ubicacion?.aula_espacio || inc.ubicacion?.aula_o_zona}
                          </td>
                          <td className="text-xs">
                            <span
                              className={
                                nombreTec === 'Sin asignar'
                                  ? 'text-amber-600 dark:text-amber-400 font-medium'
                                  : 'text-emerald-700 dark:text-emerald-400 font-semibold'
                              }
                            >
                              {nombreTec}
                            </span>
                          </td>
                          <td className="text-xs text-[var(--color-text-muted)]">
                            {new Date(inc.fecha_creacion || inc.fecha_reporte || Date.now()).toLocaleDateString(
                              'es-MX'
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btn--ghost btn--sm p-1.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIncidenciaSeleccionada(inc);
                              }}
                              title="Ver expediente completo"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {paginacion.paginas > 1 && (
                <div className="pagination mt-4 flex items-center justify-between">
                  <button
                    className="btn btn--ghost btn--sm"
                    disabled={paginacion.pagina <= 1}
                    onClick={() => setFiltros({ ...filtros, pagina: filtros.pagina - 1 })}
                  >
                    <ChevronLeft size={16} /> Anterior
                  </button>
                  <span className="pagination__info text-xs text-slate-400">
                    Página {paginacion.pagina} de {paginacion.paginas} ({paginacion.total} expedientes)
                  </span>
                  <button
                    className="btn btn--ghost btn--sm"
                    disabled={paginacion.pagina >= paginacion.paginas}
                    onClick={() => setFiltros({ ...filtros, pagina: filtros.pagina + 1 })}
                  >
                    Siguiente <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modales */}
      {mostrarCrear && (
        <CrearIncidenciaModal
          onClose={() => setMostrarCrear(false)}
          onCreated={() => {
            setMostrarCrear(false);
            cargarIncidencias();
            window.dispatchEvent(new CustomEvent('incidencias-updated'));
          }}
        />
      )}

      {incidenciaSeleccionada && (
        <DetalleIncidenciaModal
          incidencia={incidenciaSeleccionada}
          onClose={() => setIncidenciaSeleccionada(null)}
          onUpdated={cargarIncidencias}
        />
      )}
    </div>
  );
};

export default IncidenciasPage;
