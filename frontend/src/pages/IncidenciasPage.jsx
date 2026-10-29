// ═══════════════════════════════════════════════════════════════
// pages/IncidenciasPage.jsx — Lista y gestión de incidencias (RF-08)
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  Plus,
  Search,
  Filter,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
} from 'lucide-react';
import CrearIncidenciaModal from '../components/incidencias/CrearIncidenciaModal';
import DetalleIncidenciaModal from '../components/incidencias/DetalleIncidenciaModal';

const IncidenciasPage = () => {
  const { usuario, tieneRol } = useAuth();
  const [incidencias, setIncidencias] = useState([]);
  const [paginacion, setPaginacion] = useState({});
  const [cargando, setCargando] = useState(true);
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState(null);

  // Filtros
  const [filtros, setFiltros] = useState({
    categoria: '',
    estado: '',
    prioridad: '',
    busqueda: '',
    pagina: 1,
  });

  useEffect(() => {
    cargarIncidencias();
  }, [filtros.pagina, filtros.categoria, filtros.estado, filtros.prioridad]);

  const cargarIncidencias = async () => {
    setCargando(true);
    try {
      const params = { ...filtros, limite: 10 };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);

      const { data } = await api.get('/incidencias', { params });
      setIncidencias(data.datos.incidencias || []);
      setPaginacion(data.datos.paginacion || {});
    } catch (error) {
      console.error('Error cargando incidencias:', error);
    } finally {
      setCargando(false);
    }
  };

  const buscar = (e) => {
    e.preventDefault();
    setFiltros({ ...filtros, pagina: 1 });
    cargarIncidencias();
  };

  const limpiarFiltros = () => {
    setFiltros({
      categoria: '',
      estado: '',
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
    computo_redes: '💻 Cómputo y Redes',
    infraestructura: '🏗️ Infraestructura',
    academico: '🎓 Sistemas Académicos',
    sistemas_academicos: '🎓 Sistemas Académicos',
  };

  return (
    <div className="page">
      <div className="page__header flex justify-between items-center">
        <div>
          <h1 className="page__title">Expediente de Incidencias</h1>
          <p className="page__subtitle">
            Bandeja unificada con control de acceso RBAC por rol
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
          {tieneRol('reportante', 'tecnico', 'coordinador', 'administrador') && (
            <button
              className="btn btn--primary flex items-center gap-1.5"
              onClick={() => setMostrarCrear(true)}
            >
              <Plus size={18} />
              <span>Nueva Incidencia</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="card my-3">
        <div className="card__body">
          <form className="filters-bar" onSubmit={buscar}>
            <div className="filters-bar__search flex-1">
              <Search size={18} />
              <input
                type="text"
                className="form-input"
                placeholder="Buscar por texto ponderado ($text)..."
                value={filtros.busqueda}
                onChange={(e) =>
                  setFiltros({ ...filtros, busqueda: e.target.value })
                }
              />
            </div>
            <select
              className="form-select"
              value={filtros.categoria}
              onChange={(e) =>
                setFiltros({ ...filtros, categoria: e.target.value, pagina: 1 })
              }
            >
              <option value="">Todas las categorías</option>
              <option value="computo_redes">Cómputo y Redes</option>
              <option value="infraestructura">Infraestructura</option>
              <option value="academico">Sistemas Académicos</option>
            </select>
            <select
              className="form-select"
              value={filtros.estado}
              onChange={(e) =>
                setFiltros({ ...filtros, estado: e.target.value, pagina: 1 })
              }
            >
              <option value="">Todos los estados</option>
              <option value="abierta">Abierta</option>
              <option value="en_proceso">En Proceso</option>
              <option value="en_espera">En Espera</option>
              <option value="resuelta">Resuelta</option>
              <option value="cerrada">Cerrada</option>
            </select>
            <select
              className="form-select"
              value={filtros.prioridad}
              onChange={(e) =>
                setFiltros({ ...filtros, prioridad: e.target.value, pagina: 1 })
              }
            >
              <option value="">Todas las prioridades</option>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
            <button type="submit" className="btn btn--secondary">
              <Filter size={16} />
              Buscar
            </button>
          </form>
        </div>
      </div>

      {/* Tabla de Incidencias */}
      <div className="card">
        <div className="card__body">
          {cargando ? (
            <div className="loading-screen">
              <div className="loading-spinner" />
              <p>Consultando incidencias_campus en MongoDB Atlas...</p>
            </div>
          ) : incidencias.length === 0 ? (
            <div className="empty-state py-8 text-center">
              <FileText size={48} className="mx-auto text-slate-600 mb-2" />
              <h3 className="font-semibold text-slate-300">No se encontraron incidencias</h3>
              <p className="text-sm text-slate-500 mb-4">Ajusta los filtros o crea una nueva incidencia.</p>
              <button className="btn btn--secondary text-xs" onClick={limpiarFiltros}>
                Restablecer Filtros
              </button>
            </div>
          ) : (
            <>
              <div className="table-responsive table-scrollable custom-scrollbar">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Folio</th>
                      <th>Título</th>
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
                      const nombreTec = typeof inc.tecnico_asignado === 'string'
                        ? inc.tecnico_asignado
                        : (inc.tecnico_asignado?.nombre || inc.tecnico_asignado?.nombre_completo || 'Sin asignar');

                      return (
                        <tr
                          key={inc._id}
                          className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                          onClick={() => setIncidenciaSeleccionada(inc)}
                        >
                          <td>
                            <code className="folio-badge">
                              {inc.codigo_incidencia}
                            </code>
                          </td>
                          <td className="table__title-cell font-medium">{inc.titulo}</td>
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
                          <td className="text-xs text-slate-400">
                            {inc.ubicacion?.edificio} • {inc.ubicacion?.aula_espacio || inc.ubicacion?.aula_o_zona}
                          </td>
                          <td className="text-xs">
                            <span className={nombreTec === 'Sin asignar' ? 'text-amber-400/80' : 'text-emerald-400 font-medium'}>
                              {nombreTec}
                            </span>
                          </td>
                          <td className="text-xs text-slate-400">
                            {new Date(inc.fecha_creacion || inc.fecha_reporte || Date.now()).toLocaleDateString('es-MX')}
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
                    onClick={() =>
                      setFiltros({ ...filtros, pagina: filtros.pagina - 1 })
                    }
                  >
                    <ChevronLeft size={16} /> Anterior
                  </button>
                  <span className="pagination__info text-xs text-slate-400">
                    Página {paginacion.pagina} de {paginacion.paginas} ({paginacion.total} expedientes)
                  </span>
                  <button
                    className="btn btn--ghost btn--sm"
                    disabled={paginacion.pagina >= paginacion.paginas}
                    onClick={() =>
                      setFiltros({ ...filtros, pagina: filtros.pagina + 1 })
                    }
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
