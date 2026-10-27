// ═══════════════════════════════════════════════════════════════
// pages/EdificiosPage.jsx — Catálogo de edificios y aulas (Admin)
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Building2, Plus, MapPin, RefreshCw, X, Layers } from 'lucide-react';

const EdificiosPage = () => {
  const { tieneRol } = useAuth();
  const [edificios, setEdificios] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Modal Nuevo Edificio
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState('');
  const [nuevoEdificio, setNuevoEdificio] = useState({
    nombre: '',
    clave: '',
    pisos: 1,
    descripcion: '',
    aulasStr: '',
  });

  useEffect(() => {
    cargarEdificios();
  }, []);

  const cargarEdificios = async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/edificios');
      setEdificios(data.datos || []);
    } catch (error) {
      console.error('Error cargando edificios:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleCrearEdificio = async (e) => {
    e.preventDefault();
    setErrorModal('');

    if (!nuevoEdificio.nombre.trim() || !nuevoEdificio.clave.trim()) {
      setErrorModal('El nombre y clave del edificio son obligatorios.');
      return;
    }

    try {
      setGuardando(true);
      const aulasArray = nuevoEdificio.aulasStr
        ? nuevoEdificio.aulasStr
            .split(',')
            .map((a) => a.trim())
            .filter(Boolean)
            .map((nombre, idx) => ({
              nombre,
              piso: 1,
              tipo: 'aula',
            }))
        : [];

      const payload = {
        nombre: nuevoEdificio.nombre.trim(),
        clave: nuevoEdificio.clave.trim().toUpperCase(),
        pisos: Number(nuevoEdificio.pisos) || 1,
        descripcion: nuevoEdificio.descripcion.trim(),
        activo: true,
        aulas: aulasArray,
      };

      await api.post('/edificios', payload);
      setModalAbierto(false);
      setNuevoEdificio({
        nombre: '',
        clave: '',
        pisos: 1,
        descripcion: '',
        aulasStr: '',
      });
      cargarEdificios();
    } catch (err) {
      setErrorModal(
        err.response?.data?.mensaje ||
        'Error al crear el edificio. Verifique que el nombre y clave sean únicos.'
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="page">
      <div className="page__header flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="page__title flex items-center gap-2.5">
            <Building2 size={28} className="text-indigo-400" />
            Catálogo de Edificios del Campus
          </h1>
          <p className="page__subtitle">
            Edificios, aulas y laboratorios universitarios para la localización de incidencias ({edificios.length} registrados)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn--secondary flex items-center gap-1.5"
            onClick={cargarEdificios}
            title="Recargar catálogo"
          >
            <RefreshCw size={16} />
            <span>Actualizar</span>
          </button>
          {tieneRol('administrador') && (
            <button
              className="btn btn--primary flex items-center gap-1.5"
              onClick={() => setModalAbierto(true)}
            >
              <Plus size={18} />
              <span>Nuevo Edificio</span>
            </button>
          )}
        </div>
      </div>

      {cargando ? (
        <div className="loading-screen">
          <div className="loading-spinner" />
          <p className="mt-2 text-sm text-slate-400">Cargando catálogo del campus...</p>
        </div>
      ) : (
        <div className="edificios-grid">
          {edificios.map((ed) => (
            <div key={ed._id} className="card edificio-card hover:border-indigo-500/40 transition-all">
              <div className="card__header flex items-center justify-between">
                <h2 className="card__title flex items-center gap-2">
                  <Building2 size={20} className="text-indigo-400" />
                  {ed.nombre}
                </h2>
                <span className="badge badge--info font-mono">{ed.clave}</span>
              </div>
              <div className="card__body">
                <p className="edificio-card__desc text-sm text-slate-300">
                  {ed.descripcion || 'Infraestructura general del campus universitario.'}
                </p>
                <div className="edificio-card__meta flex gap-4 my-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Layers size={14} className="text-indigo-400" />
                    {ed.pisos} nivel{ed.pisos > 1 ? 'es' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} className="text-emerald-400" />
                    {ed.aulas?.length || 0} espacio(s)
                  </span>
                </div>
                {ed.aulas?.length > 0 && (
                  <div className="edificio-card__aulas mt-3 pt-3 border-t border-slate-700/50">
                    <h4 className="text-xs font-semibold text-slate-400 mb-2">Aulas y Espacios:</h4>
                    <div className="edificio-card__aulas-list flex flex-wrap gap-1.5">
                      {ed.aulas.map((aula, idx) => (
                        <span key={aula._id || idx} className="badge badge--secondary text-xs flex items-center gap-1">
                          <MapPin size={11} />
                          {aula.nombre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nuevo Edificio */}
      {modalAbierto && (
        <div className="modal-overlay" onClick={() => setModalAbierto(false)}>
          <div className="modal max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Building2 size={22} />
                </div>
                <div>
                  <h2 className="modal__title">Nuevo Edificio Universitario</h2>
                  <p className="text-xs text-slate-400">Dar de alta una nueva instalación en el catálogo oficial</p>
                </div>
              </div>
              <button className="btn btn--ghost" onClick={() => setModalAbierto(false)}>
                <X size={20} />
              </button>
            </div>

            {errorModal && (
              <div className="p-3 mx-6 mt-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                {errorModal}
              </div>
            )}

            <form onSubmit={handleCrearEdificio}>
              <div className="modal__body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="form-group md:col-span-2">
                    <label className="form-label" htmlFor="ed-nombre">
                      Nombre del Edificio *
                    </label>
                    <input
                      id="ed-nombre"
                      type="text"
                      required
                      className="form-input"
                      placeholder="Ej. Edificio N - Posgrado"
                      value={nuevoEdificio.nombre}
                      onChange={(e) =>
                        setNuevoEdificio({ ...nuevoEdificio, nombre: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="ed-clave">
                      Clave / Código *
                    </label>
                    <input
                      id="ed-clave"
                      type="text"
                      required
                      className="form-input uppercase font-mono"
                      placeholder="EDIF-N"
                      value={nuevoEdificio.clave}
                      onChange={(e) =>
                        setNuevoEdificio({ ...nuevoEdificio, clave: e.target.value.toUpperCase() })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label" htmlFor="ed-pisos">
                      Número de Pisos
                    </label>
                    <input
                      id="ed-pisos"
                      type="number"
                      min={1}
                      max={10}
                      className="form-input"
                      value={nuevoEdificio.pisos}
                      onChange={(e) =>
                        setNuevoEdificio({ ...nuevoEdificio, pisos: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="ed-aulas">
                      Aulas / Espacios (separados por coma)
                    </label>
                    <input
                      id="ed-aulas"
                      type="text"
                      className="form-input"
                      placeholder="Aula 101, Lab TI, Auditorio"
                      value={nuevoEdificio.aulasStr}
                      onChange={(e) =>
                        setNuevoEdificio({ ...nuevoEdificio, aulasStr: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="ed-desc">
                    Descripción de la Instalación
                  </label>
                  <textarea
                    id="ed-desc"
                    rows={3}
                    className="form-textarea"
                    placeholder="Detalles sobre las áreas que alberga este edificio..."
                    value={nuevoEdificio.descripcion}
                    onChange={(e) =>
                      setNuevoEdificio({ ...nuevoEdificio, descripcion: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="modal__footer">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setModalAbierto(false)}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn--primary" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar Edificio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EdificiosPage;
