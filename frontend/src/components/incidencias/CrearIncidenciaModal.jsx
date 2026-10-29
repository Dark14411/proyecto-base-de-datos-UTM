// ═══════════════════════════════════════════════════════════════
// components/incidencias/CrearIncidenciaModal.jsx
// Formulario polimórfico estricto según categoría (RF-01 y Figura 2)
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { X, Send, Building2, AlertTriangle, Cpu, Wrench, GraduationCap } from 'lucide-react';

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
      detalle_especifico: { ...form.detalle_especifico, [campo]: valor },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
          insumos = form.detalle_especifico.insumos_requeridos.split(',').map(s => s.trim()).filter(Boolean);
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
          edificio: form.ubicacion.edificio || 'Edificio K',
          aula_espacio: form.ubicacion.aula_espacio || 'Laboratorio General',
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
        <div className="modal__header">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h2 className="modal__title">Nueva Incidencia en el Campus</h2>
              <p className="text-xs text-slate-400">Modelo Polimórfico NoSQL validado con $jsonSchema</p>
            </div>
          </div>
          <button className="btn btn--ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="modal__error">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form className="modal__form flex-1 flex flex-col min-h-0 overflow-hidden" onSubmit={handleSubmit}>
          <div className="modal__body modal__body--scroll">
          {/* Título */}
          <div className="form-group">
            <label className="form-label">Título de la Incidencia *</label>
            <input
              className="form-input"
              placeholder="Ej. Caída de conexión en switch de laboratorio"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              minLength={5}
              maxLength={120}
              required
            />
          </div>

          {/* Descripción */}
          <div className="form-group">
            <label className="form-label">Descripción Detallada *</label>
            <textarea
              className="form-input form-textarea"
              placeholder="Describa claramente el problema observado, síntomas y contexto..."
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
              <label className="form-label">Categoría Polimórfica *</label>
              <select
                className="form-select"
                value={form.categoria}
                onChange={(e) => handleCategoriaChange(e.target.value)}
              >
                <option value="computo_redes">💻 Cómputo y Redes</option>
                <option value="infraestructura">🏗️ Infraestructura y Mantenimiento</option>
                <option value="academico">🎓 Sistemas y Servicios Académicos</option>
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
                <option value="baja">🟢 Baja</option>
                <option value="media">🟡 Media</option>
                <option value="alta">🟠 Alta</option>
                <option value="critica">🔴 Crítica</option>
              </select>
            </div>
          </div>

          {/* Ubicación */}
          <fieldset className="form-fieldset">
            <legend className="flex items-center gap-1.5">
              <Building2 size={16} /> Ubicación Estandarizada
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
                  <option value="">Seleccionar edificio</option>
                  {edificios.map((ed) => {
                    const nombre = ed.nombre || ed.nombre_edificio;
                    return (
                      <option key={ed._id} value={nombre}>
                        {nombre} ({ed.clave || ed.codigo_edificio || 'EDIF'})
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
                  <option value="">Seleccionar espacio</option>
                  {espaciosDelEdificio().map((espacio, idx) => (
                    <option key={idx} value={espacio}>
                      {espacio}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          {/* Subdocumento Polimórfico: Cómputo y Redes */}
          {form.categoria === 'computo_redes' && (
            <fieldset className="form-fieldset">
              <legend className="flex items-center gap-1.5 text-indigo-400">
                <Cpu size={16} /> Detalle Específico: Cómputo y Telecomunicaciones
              </legend>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Dirección IP *</label>
                  <input
                    className="form-input"
                    placeholder="Ej. 192.168.20.1"
                    value={form.detalle_especifico.direccion_ip}
                    onChange={(e) => updateDetalle('direccion_ip', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">VLAN *</label>
                  <input
                    className="form-input"
                    placeholder="Ej. VLAN-20-LABS"
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
                  <label className="form-label">Equipos Afectados *</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={form.detalle_especifico.equipos_afectados}
                    onChange={(e) => updateDetalle('equipos_afectados', e.target.value)}
                    required
                  />
                </div>
              </div>
            </fieldset>
          )}

          {/* Subdocumento Polimórfico: Infraestructura */}
          {form.categoria === 'infraestructura' && (
            <fieldset className="form-fieldset">
              <legend className="flex items-center gap-1.5 text-amber-400">
                <Wrench size={16} /> Detalle Específico: Infraestructura Física
              </legend>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tipo de Daño *</label>
                  <select
                    className="form-select"
                    value={form.detalle_especifico.tipo_dano}
                    onChange={(e) => updateDetalle('tipo_dano', e.target.value)}
                    required
                  >
                    <option value="filtracion_techo">Filtración en techo / Gotera</option>
                    <option value="climatizacion">Falla de climatización (A/C)</option>
                    <option value="luminaria">Luminaria fundida / Cableado expuesto</option>
                    <option value="mobiliario">Mobiliario dañado / Butacas rotas</option>
                    <option value="plomeria">Plomería / Sanitarios</option>
                    <option value="electrico">Cortocircuito / Tablero eléctrico</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Nivel de Riesgo *</label>
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
                  <label className="form-label">Insumos Requeridos * (separados por coma)</label>
                  <input
                    className="form-input"
                    placeholder="Ej. impermeabilizante, lamina_galvanizada"
                    value={form.detalle_especifico.insumos_requeridos}
                    onChange={(e) => updateDetalle('insumos_requeridos', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group flex items-center pt-6">
                  <label className="form-label form-label--checkbox flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.detalle_especifico.requiere_contratista}
                      onChange={(e) => updateDetalle('requiere_contratista', e.target.checked)}
                    />
                    <span>Requiere intervención de contratista</span>
                  </label>
                </div>
              </div>
            </fieldset>
          )}

          {/* Subdocumento Polimórfico: Académico */}
          {form.categoria === 'academico' && (
            <fieldset className="form-fieldset">
              <legend className="flex items-center gap-1.5 text-emerald-400">
                <GraduationCap size={16} /> Detalle Específico: Sistemas Académicos
              </legend>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Plataforma *</label>
                  <input
                    className="form-input"
                    placeholder="Ej. Portal de calificaciones, Aula Virtual"
                    value={form.detalle_especifico.plataforma}
                    onChange={(e) => updateDetalle('plataforma', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Código de Curso *</label>
                  <input
                    className="form-input"
                    placeholder="Ej. BDN-301, TI-402"
                    value={form.detalle_especifico.codigo_curso}
                    onChange={(e) => updateDetalle('codigo_curso', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Período Escolar *</label>
                  <input
                    className="form-input"
                    placeholder="Ej. Septiembre-Diciembre 2026"
                    value={form.detalle_especifico.periodo_escolar}
                    onChange={(e) => updateDetalle('periodo_escolar', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Estudiantes Afectados *</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={form.detalle_especifico.estudiantes_afectados}
                    onChange={(e) => updateDetalle('estudiantes_afectados', e.target.value)}
                    required
                  />
                </div>
              </div>
            </fieldset>
          )}

          {/* Etiquetas / Tags */}
          <div className="form-group">
            <label className="form-label">Etiquetas Descriptivas (separadas por coma)</label>
            <input
              className="form-input"
              placeholder="Ej. switch, dhcp, fibra-optica, aula-12"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>

          </div>

          <div className="modal__footer">
            <button type="button" className="btn btn--secondary" onClick={onClose} disabled={enviando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary" disabled={enviando}>
              {enviando ? 'Guardando en MongoDB Atlas...' : (
                <>
                  <Send size={16} />
                  Registrar Incidencia
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
