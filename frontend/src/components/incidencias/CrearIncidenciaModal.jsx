// ═══════════════════════════════════════════════════════════════
// components/incidencias/CrearIncidenciaModal.jsx
// Formulario de registro de incidencias del campus
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { X, Send, Building2, Monitor, Wrench, GraduationCap, AlertCircle } from 'lucide-react';

const CrearIncidenciaModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    categoria: 'computo_redes',
    prioridad: 'media',
    ubicacion: { edificio: '', aula_espacio: '' },
    detalle_especifico: {
      direccion_ip: '192.168.10.15',
      vlan: 'VLAN-10-DOCENCIA',
      puerto_uplink: 'Gi0/1',
      equipos_afectados: 1,
    },
    tags: '',
  });

  const [edificios, setEdificios] = useState([]);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api.get('/edificios')
      .then(({ data }) => {
        const lista = data.datos || [];
        setEdificios(lista);
        if (lista.length > 0) {
          const primerEd = lista[0];
          const primerEspacio = primerEd.aulas?.[0]?.nombre || primerEd.espacios?.[0]?.nombre_espacio || 'Aula 1';
          setForm(prev => ({
            ...prev,
            ubicacion: {
              edificio: primerEd.nombre || primerEd.nombre_edificio,
              aula_espacio: primerEspacio,
            },
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleEdificioChange = (nombreEdificio) => {
    const ed = edificios.find((e) => (e.nombre || e.nombre_edificio) === nombreEdificio);
    const primerEspacio = ed?.aulas?.[0]?.nombre || ed?.espacios?.[0]?.nombre_espacio || '';
    setForm({
      ...form,
      ubicacion: {
        edificio: nombreEdificio,
        aula_espacio: primerEspacio,
      },
    });
  };

  const espaciosDelEdificio = () => {
    const ed = edificios.find((e) => (e.nombre || e.nombre_edificio) === form.ubicacion.edificio);
    if (!ed) return [];
    if (ed.aulas && ed.aulas.length > 0) {
      return ed.aulas.map(a => a.nombre);
    }
    if (ed.espacios && ed.espacios.length > 0) {
      return ed.espacios.map(e => e.nombre_espacio);
    }
    return [];
  };

  const handleCategoriaChange = (nuevaCat) => {
    let nuevoDetalle = {};
    if (nuevaCat === 'computo_redes') {
      nuevoDetalle = {
        direccion_ip: '192.168.10.15',
        vlan: 'VLAN-10-DOCENCIA',
        puerto_uplink: 'Gi0/1',
        equipos_afectados: 1,
      };
    } else if (nuevaCat === 'infraestructura') {
      nuevoDetalle = {
        tipo_dano: 'filtracion_techo',
        nivel_riesgo: 'medio',
        requiere_contratista: false,
        insumos_requeridos: 'impermeabilizante, sellador',
      };
    } else {
      nuevoDetalle = {
        plataforma: 'Portal de calificaciones',
        codigo_curso: 'BDN-301',
        periodo_escolar: 'Septiembre-Diciembre 2026',
        estudiantes_afectados: 25,
      };
    }

    setForm({
      ...form,
      categoria: nuevaCat,
      detalle_especifico: nuevoDetalle,
    });
  };

  const updateDetalle = (campo, valor) => {
    setForm({
      ...form,
      detalle_especifico: {
        ...form.detalle_especifico,
        [campo]: valor,
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.titulo.trim() || !form.descripcion.trim()) {
      setError('Por favor complete el título y la descripción del reporte.');
      return;
    }

    setEnviando(true);

    try {
      let detalleFinal = {};
      if (form.categoria === 'computo_redes') {
        detalleFinal = {
          direccion_ip: form.detalle_especifico.direccion_ip || '192.168.1.1',
          vlan: form.detalle_especifico.vlan || 'VLAN-1',
          puerto_uplink: form.detalle_especifico.puerto_uplink || 'Gi0/1',
          equipos_afectados: parseInt(form.detalle_especifico.equipos_afectados || 1),
        };
      } else if (form.categoria === 'infraestructura') {
        let insumos = [];
        if (typeof form.detalle_especifico.insumos_requeridos === 'string') {
          insumos = form.detalle_especifico.insumos_requeridos
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        } else if (Array.isArray(form.detalle_especifico.insumos_requeridos)) {
          insumos = form.detalle_especifico.insumos_requeridos;
        }
        if (insumos.length === 0) insumos = ['insumo_basico'];

        detalleFinal = {
          tipo_dano: form.detalle_especifico.tipo_dano || 'mantenimiento_general',
          nivel_riesgo: form.detalle_especifico.nivel_riesgo || 'medio',
          requiere_contratista: Boolean(form.detalle_especifico.requiere_contratista),
          insumos_requeridos: insumos,
        };
      } else {
        detalleFinal = {
          plataforma: form.detalle_especifico.plataforma || 'Portal Académico',
          codigo_curso: form.detalle_especifico.codigo_curso || 'TI-101',
          periodo_escolar: form.detalle_especifico.periodo_escolar || 'Septiembre-Diciembre 2026',
          estudiantes_afectados: parseInt(form.detalle_especifico.estudiantes_afectados || 1),
        };
      }

      const tagsArray = form.tags
        ? form.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
        : [form.categoria];

      const payload = {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        categoria: form.categoria,
        prioridad: form.prioridad,
        ubicacion: {
          edificio: form.ubicacion.edificio || 'Edificio A',
          aula_espacio: form.ubicacion.aula_espacio || 'Aula General',
        },
        detalle_especifico: detalleFinal,
        tags: tagsArray,
      };

      await api.post('/incidencias', payload);
      onCreated();
    } catch (err) {
      console.error('Error al registrar incidencia:', err);
      setError(
        err.response?.data?.mensaje ||
        err.response?.data?.errores?.[0]?.mensaje ||
        'Error al crear la incidencia. Verifique los campos requeridos.'
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--lg" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera del Modal */}
        <div className="modal__header">
          <div>
            <h2 className="modal__title">Nueva incidencia en el campus</h2>
            <p className="text-xs text-gray-500">Reporta un problema o solicitud de atención técnica</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="modal__error flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="modal__form">
          <div className="modal__body">
            {/* Título */}
            <div className="form-group">
            <label className="form-label">Título del reporte *</label>
            <input
              className="form-input"
              placeholder="Ej. Sin acceso a internet en laboratorio de cómputo"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              minLength={5}
              maxLength={120}
              required
            />
          </div>

          {/* Descripción */}
          <div className="form-group">
            <label className="form-label">Descripción detallada *</label>
            <textarea
              className="form-textarea"
              placeholder="Describe detalladamente la falla observada, síntomas y contexto del problema..."
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              minLength={10}
              maxLength={2000}
              rows={3}
              required
            />
          </div>

          <div className="form-row">
            {/* Categoría */}
            <div className="form-group">
              <label className="form-label">Categoría *</label>
              <select
                className="form-select"
                value={form.categoria}
                onChange={(e) => handleCategoriaChange(e.target.value)}
              >
                <option value="computo_redes">Cómputo y redes</option>
                <option value="infraestructura">Infraestructura y mantenimiento</option>
                <option value="academico">Servicios académicos</option>
              </select>
            </div>

            {/* Prioridad */}
            <div className="form-group">
              <label className="form-label">Prioridad</label>
              <select
                className="form-select"
                value={form.prioridad}
                onChange={(e) => setForm({ ...form, prioridad: e.target.value })}
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
          </div>

          {/* Ubicación */}
          <fieldset className="form-fieldset">
            <legend className="flex items-center gap-1.5">
              <Building2 size={15} /> Ubicación en el campus
            </legend>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Edificio *</label>
                <select
                  className="form-select"
                  value={form.ubicacion.edificio}
                  onChange={(e) => handleEdificioChange(e.target.value)}
                  required
                >
                  <option value="">Seleccionar edificio...</option>
                  {edificios.map((ed) => {
                    const nombre = ed.nombre || ed.nombre_edificio;
                    return (
                      <option key={ed._id} value={nombre}>
                        {nombre}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Aula / Espacio *</label>
                <select
                  className="form-select"
                  value={form.ubicacion.aula_espacio}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ubicacion: { ...form.ubicacion, aula_espacio: e.target.value },
                    })
                  }
                  required
                >
                  <option value="">Seleccionar espacio...</option>
                  {espaciosDelEdificio().map((espacio, idx) => (
                    <option key={idx} value={espacio}>
                      {espacio}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          {/* Parámetros Específicos: Cómputo y Redes */}
          {form.categoria === 'computo_redes' && (
            <fieldset className="form-fieldset">
              <legend className="flex items-center gap-1.5">
                <Monitor size={15} /> Datos técnicos de conectividad
              </legend>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Dirección IP *</label>
                  <input
                    className="form-input"
                    placeholder="Ej. 192.168.10.15"
                    value={form.detalle_especifico.direccion_ip}
                    onChange={(e) => updateDetalle('direccion_ip', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">VLAN *</label>
                  <input
                    className="form-input"
                    placeholder="Ej. VLAN-10-DOCENCIA"
                    value={form.detalle_especifico.vlan}
                    onChange={(e) => updateDetalle('vlan', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Puerto de Uplink *</label>
                  <input
                    className="form-input"
                    placeholder="Ej. Gi0/24"
                    value={form.detalle_especifico.puerto_uplink}
                    onChange={(e) => updateDetalle('puerto_uplink', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Equipos afectados *</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    value={form.detalle_especifico.equipos_afectados}
                    onChange={(e) => updateDetalle('equipos_afectados', e.target.value)}
                    required
                  />
                </div>
              </div>
            </fieldset>
          )}

          {/* Parámetros Específicos: Infraestructura */}
          {form.categoria === 'infraestructura' && (
            <fieldset className="form-fieldset">
              <legend className="flex items-center gap-1.5">
                <Wrench size={15} /> Parámetros de infraestructura
              </legend>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tipo de daño *</label>
                  <select
                    className="form-select"
                    value={form.detalle_especifico.tipo_dano}
                    onChange={(e) => updateDetalle('tipo_dano', e.target.value)}
                    required
                  >
                    <option value="filtracion_techo">Filtración en techo / Gotera</option>
                    <option value="climatizacion">Falla de aire acondicionado / Clima</option>
                    <option value="luminaria">Luminaria o instalación eléctrica</option>
                    <option value="mobiliario">Mobiliario / Puertas / Cerraduras</option>
                    <option value="plomeria">Plomería / Sanitarios</option>
                    <option value="electrico">Tablero eléctrico / Contactos</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Nivel de riesgo *</label>
                  <select
                    className="form-select"
                    value={form.detalle_especifico.nivel_riesgo}
                    onChange={(e) => updateDetalle('nivel_riesgo', e.target.value)}
                    required
                  >
                    <option value="bajo">Bajo</option>
                    <option value="medio">Medio</option>
                    <option value="alto">Alto</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Materiales o insumos estimados</label>
                  <input
                    className="form-input"
                    placeholder="Ej. impermeabilizante, sellador"
                    value={form.detalle_especifico.insumos_requeridos}
                    onChange={(e) => updateDetalle('insumos_requeridos', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={form.detalle_especifico.requiere_contratista}
                      onChange={(e) => updateDetalle('requiere_contratista', e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Requiere apoyo de cuadrilla externa</span>
                  </label>
                </div>
              </div>
            </fieldset>
          )}

          {/* Parámetros Específicos: Académico */}
          {form.categoria === 'academico' && (
            <fieldset className="form-fieldset">
              <legend className="flex items-center gap-1.5">
                <GraduationCap size={15} /> Parámetros del servicio académico
              </legend>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Plataforma o sistema *</label>
                  <input
                    className="form-input"
                    placeholder="Ej. Portal de calificaciones, Aula Virtual"
                    value={form.detalle_especifico.plataforma}
                    onChange={(e) => updateDetalle('plataforma', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Código de materia o curso *</label>
                  <input
                    className="form-input"
                    placeholder="Ej. TI-301"
                    value={form.detalle_especifico.codigo_curso}
                    onChange={(e) => updateDetalle('codigo_curso', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Periodo escolar *</label>
                  <input
                    className="form-input"
                    placeholder="Ej. Septiembre - Diciembre 2026"
                    value={form.detalle_especifico.periodo_escolar}
                    onChange={(e) => updateDetalle('periodo_escolar', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Estudiantes afectados *</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    value={form.detalle_especifico.estudiantes_afectados}
                    onChange={(e) => updateDetalle('estudiantes_afectados', e.target.value)}
                    required
                  />
                </div>
              </div>
            </fieldset>
          )}

          {/* Etiquetas */}
          <div className="form-group">
            <label className="form-label">Etiquetas clave (separadas por coma)</label>
            <input
              className="form-input"
              placeholder="Ej. switch, cableado, aula-12"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>

          </div>

          {/* Botones de acción */}
          <div className="modal__footer">
            <button type="button" className="btn btn--secondary" onClick={onClose} disabled={enviando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary" disabled={enviando}>
              {enviando ? (
                'Guardando reporte...'
              ) : (
                <>
                  <Send size={15} />
                  <span>Registrar incidencia</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrearIncidenciaModal;
