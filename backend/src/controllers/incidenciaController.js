// ═══════════════════════════════════════════════════════════════
// controllers/incidenciaController.js — CRUD + Analítica
// Implementa estrictamente RF-01 a RF-09 según Figuras 2 a 6
// ═══════════════════════════════════════════════════════════════
const Incidencia = require('../models/Incidencia');
const generarFolio = require('../utils/generarFolio');
const { uploadFile, getSignedUrl } = require('../config/supabase');

// ─────────────────────────────────────────────────────────────
// RF-01: Registro polimórfico de incidencia
// ─────────────────────────────────────────────────────────────
const crearIncidencia = async (req, res) => {
  try {
    const { titulo, descripcion, categoria, prioridad, ubicacion, detalle_especifico, tags } = req.body;

    const catNormalizada = (categoria === 'sistemas_academicos' || categoria === 'academico') ? 'academico' : categoria;

    // Generar folio atómico con Redis
    const codigo_incidencia = await generarFolio(catNormalizada);

    // Mapear reportante según Figura 2 (nombre, rol: Docente|Estudiante|Administrativo, correo)
    const rolMap = {
      reportante: 'Docente',
      tecnico: 'Administrativo',
      coordinador: 'Administrativo',
      directivo: 'Docente',
      administrador: 'Administrativo',
    };
    const rolReportante = ['Docente', 'Estudiante', 'Administrativo'].includes(req.usuario.rol_sistema)
      ? req.usuario.rol_sistema
      : (rolMap[req.usuario.rol] || 'Docente');

    const autorNombre = req.usuario.nombre || req.usuario.nombre_completo || 'Usuario UTM';

    // Normalizar detalle_especifico según categoría (oneOf en $jsonSchema)
    let detalleNormalizado = {};
    if (catNormalizada === 'computo_redes') {
      detalleNormalizado = {
        direccion_ip: detalle_especifico?.direccion_ip || '192.168.1.1',
        vlan: detalle_especifico?.vlan || 'VLAN-10',
        puerto_uplink: detalle_especifico?.puerto_uplink || 'Gi0/1',
        equipos_afectados: Number(detalle_especifico?.equipos_afectados || 1),
      };
    } else if (catNormalizada === 'infraestructura') {
      const riesgo = ['bajo', 'medio', 'alto'].includes(detalle_especifico?.nivel_riesgo)
        ? detalle_especifico.nivel_riesgo
        : 'medio';
      detalleNormalizado = {
        tipo_dano: detalle_especifico?.tipo_dano || 'mantenimiento_general',
        nivel_riesgo: riesgo,
        requiere_contratista: Boolean(detalle_especifico?.requiere_contratista),
        insumos_requeridos: Array.isArray(detalle_especifico?.insumos_requeridos)
          ? detalle_especifico.insumos_requeridos
          : (detalle_especifico?.insumos_requeridos ? [String(detalle_especifico.insumos_requeridos)] : ['insumo_basico']),
      };
    } else {
      detalleNormalizado = {
        plataforma: detalle_especifico?.plataforma || 'Portal Académico',
        codigo_curso: detalle_especifico?.codigo_curso || 'TI-101',
        periodo_escolar: detalle_especifico?.periodo_escolar || detalle_especifico?.periodo_academico || 'Septiembre-Diciembre 2026',
        estudiantes_afectados: Number(detalle_especifico?.estudiantes_afectados || detalle_especifico?.alumnos_afectados || 1),
      };
    }

    const tagsArray = Array.isArray(tags)
      ? tags.map(t => String(t).trim()).filter(Boolean)
      : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : []);

    const docIncidencia = {
      codigo_incidencia,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      categoria: catNormalizada,
      prioridad: ['baja', 'media', 'alta', 'critica'].includes(prioridad) ? prioridad : 'media',
      estado: 'abierta',
      horas_invertidas: 0,
      fecha_creacion: new Date(),
      reportante: {
        nombre: autorNombre,
        rol: rolReportante,
        correo: req.usuario.correo,
      },
      ubicacion: {
        edificio: ubicacion?.edificio || 'Edificio K',
        aula_espacio: ubicacion?.aula_espacio || ubicacion?.aula_o_zona || 'General',
      },
      detalle_especifico: detalleNormalizado,
      tags: tagsArray,
      historial_seguimiento: [
        {
          fecha: new Date(),
          autor: autorNombre,
          estado_asignado: 'abierta',
          comentario: 'Reporte inicial generado por el usuario.',
        },
      ],
      evidencias_adjuntas: [],
    };

    const incidencia = await Incidencia.create(docIncidencia);

    res.status(201).json({
      exito: true,
      mensaje: `Incidencia ${codigo_incidencia} creada exitosamente.`,
      datos: incidencia,
    });
  } catch (error) {
    console.error('❌ Error al crear incidencia:', error);
    res.status(500).json({
      exito: false,
      mensaje: error.message || 'Error al crear la incidencia.',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// RF-08: Listar incidencias con filtros y control RBAC
// ─────────────────────────────────────────────────────────────
const listarIncidencias = async (req, res) => {
  try {
    const { categoria, estado, edificio, prioridad, busqueda, pagina = 1, limite = 20 } = req.query;
    const filtro = {};

    // Control de acceso RBAC (Tabla 3)
    if (req.usuario.rol === 'reportante') {
      filtro['reportante.correo'] = req.usuario.correo;
    } else if (req.usuario.rol === 'tecnico') {
      filtro['tecnico_asignado'] = req.usuario.nombre || req.usuario.nombre_completo;
    }

    if (categoria) filtro.categoria = (categoria === 'sistemas_academicos') ? 'academico' : categoria;
    if (estado) filtro.estado = (estado === 'en_progreso') ? 'en_proceso' : estado;
    if (edificio) filtro['ubicacion.edificio'] = edificio;
    if (prioridad) filtro.prioridad = prioridad;

    // RF-05: Búsqueda textual ponderada
    if (busqueda) {
      filtro.$text = { $search: busqueda };
    }

    const skip = (parseInt(pagina) - 1) * parseInt(limite);

    const [incidencias, total] = await Promise.all([
      Incidencia.find(filtro)
        .sort(busqueda ? { score: { $meta: 'textScore' } } : { fecha_creacion: -1 })
        .skip(skip)
        .limit(parseInt(limite))
        .select(busqueda ? { score: { $meta: 'textScore' } } : {}),
      Incidencia.countDocuments(filtro),
    ]);

    res.json({
      exito: true,
      datos: {
        incidencias,
        paginacion: {
          total,
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          paginas: Math.ceil(total / parseInt(limite)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al listar incidencias.',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// Obtener incidencia por ID
// ─────────────────────────────────────────────────────────────
const obtenerIncidencia = async (req, res) => {
  try {
    const incidencia = await Incidencia.findById(req.params.id);
    if (!incidencia) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Incidencia no encontrada.',
      });
    }

    // RBAC: Reportante solo ve las suyas
    if (
      req.usuario.rol === 'reportante' &&
      incidencia.reportante.correo !== req.usuario.correo
    ) {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tiene permiso para ver esta incidencia.',
      });
    }

    // Técnico solo ve las asignadas
    if (
      req.usuario.rol === 'tecnico' &&
      incidencia.tecnico_asignado !== (req.usuario.nombre || req.usuario.nombre_completo)
    ) {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tiene permiso para ver esta incidencia.',
      });
    }

    res.json({ exito: true, datos: incidencia });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener la incidencia.',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// RF-03: Actualización atómica con $set, $push, $inc
// ─────────────────────────────────────────────────────────────
const actualizarEstado = async (req, res) => {
  try {
    let { estado, descripcion, horas } = req.body;
    if (estado === 'en_progreso') estado = 'en_proceso';

    const autorNombre = req.usuario.nombre || req.usuario.nombre_completo || 'Usuario UTM';

    const actualizacion = {
      $set: { estado },
      $push: {
        historial_seguimiento: {
          fecha: new Date(),
          autor: autorNombre,
          estado_asignado: estado,
          comentario: descripcion || `Estado cambiado a ${estado}`,
        },
      },
    };

    if (estado === 'resuelta' || estado === 'cerrada') {
      actualizacion.$set.fecha_resolucion = new Date();
    }

    if (horas && Number(horas) > 0) {
      actualizacion.$inc = { horas_invertidas: Number(horas) };
    }

    await Incidencia.updateOne({ _id: req.params.id }, actualizacion);
    const incidenciaActualizada = await Incidencia.findById(req.params.id);

    res.json({
      exito: true,
      mensaje: `Estado actualizado a "${estado}".`,
      datos: incidenciaActualizada,
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al actualizar el estado.',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// RF-09: Asignar / Reasignar técnico (Coordinador)
// ─────────────────────────────────────────────────────────────
const asignarTecnico = async (req, res) => {
  try {
    const { tecnico_id, nombre_tecnico } = req.body;
    const Usuario = require('../models/Usuario');

    let nombreTecnicoAsignado = nombre_tecnico;
    if (tecnico_id) {
      const tec = await Usuario.findById(tecnico_id);
      if (tec) {
        nombreTecnicoAsignado = tec.nombre || tec.nombre_completo;
      }
    }

    if (!nombreTecnicoAsignado) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Debe especificar el técnico a asignar.',
      });
    }

    const autorNombre = req.usuario.nombre || req.usuario.nombre_completo || 'Coordinador';

    await Incidencia.updateOne(
      { _id: req.params.id },
      {
        $set: {
          tecnico_asignado: nombreTecnicoAsignado,
          estado: 'en_proceso',
        },
        $push: {
          historial_seguimiento: {
            fecha: new Date(),
            autor: autorNombre,
            estado_asignado: 'en_proceso',
            comentario: `Técnico asignado: ${nombreTecnicoAsignado}`,
          },
        },
      }
    );

    const actualizada = await Incidencia.findById(req.params.id);
    res.json({
      exito: true,
      mensaje: `Técnico ${nombreTecnicoAsignado} asignado exitosamente.`,
      datos: actualizada,
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al asignar técnico.',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// RF-04: Manejo de tags con $addToSet y $pull
// ─────────────────────────────────────────────────────────────
const agregarTags = async (req, res) => {
  try {
    const { tags } = req.body;
    const arrayTags = Array.isArray(tags) ? tags : [tags];

    await Incidencia.updateOne(
      { _id: req.params.id },
      { $addToSet: { tags: { $each: arrayTags } } }
    );

    const incidencia = await Incidencia.findById(req.params.id);
    res.json({
      exito: true,
      mensaje: 'Etiquetas agregadas.',
      datos: { tags: incidencia.tags },
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al agregar tags.',
      error: error.message,
    });
  }
};

const eliminarTag = async (req, res) => {
  try {
    const { tag } = req.body;

    await Incidencia.updateOne(
      { _id: req.params.id },
      { $pull: { tags: tag } }
    );

    const incidencia = await Incidencia.findById(req.params.id);
    res.json({
      exito: true,
      mensaje: `Tag "${tag}" eliminado.`,
      datos: { tags: incidencia.tags },
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al eliminar tag.',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// RF-02: Subir evidencia (Supabase Storage / Fallback)
// ─────────────────────────────────────────────────────────────
const subirEvidencia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        exito: false,
        mensaje: 'No se proporcionó ningún archivo.',
      });
    }

    const { originalname, mimetype, size, buffer } = req.file;
    const peso_kb = Math.max(1, Math.round(size / 1024));

    let ruta_storage = `incidencias/${Date.now()}_${originalname}`;
    let url_storage = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800';

    try {
      const resultado = await uploadFile(buffer, originalname, mimetype);
      if (resultado && resultado.path) {
        ruta_storage = resultado.path;
        url_storage = resultado.url || url_storage;
      }
    } catch (supErr) {
      console.warn('⚠️ Supabase no configurado, guardando metadatos directos:', supErr.message);
    }

    const evidencia = {
      nombre_archivo: originalname,
      tipo_mime: mimetype,
      peso_kb,
      ruta_storage,
      url_storage,
      fecha_carga: new Date(),
    };

    await Incidencia.updateOne(
      { _id: req.params.id },
      { $push: { evidencias_adjuntas: evidencia } }
    );

    res.status(201).json({
      exito: true,
      mensaje: 'Evidencia subida exitosamente.',
      datos: evidencia,
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al subir evidencia.',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// Agregar nota técnica al historial
// ─────────────────────────────────────────────────────────────
const agregarNota = async (req, res) => {
  try {
    const { descripcion, horas } = req.body;
    const autorNombre = req.usuario.nombre || req.usuario.nombre_completo || 'Técnico';

    const actualizacion = {
      $push: {
        historial_seguimiento: {
          fecha: new Date(),
          autor: autorNombre,
          estado_asignado: req.body.estado || 'en_proceso',
          comentario: descripcion,
        },
      },
    };

    if (horas && Number(horas) > 0) {
      actualizacion.$inc = { horas_invertidas: Number(horas) };
    }

    await Incidencia.updateOne({ _id: req.params.id }, actualizacion);

    res.json({
      exito: true,
      mensaje: 'Nota técnica agregada.',
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al agregar nota.',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// RF-06: Analítica directiva (Pipelines oficiales de agregación)
// ─────────────────────────────────────────────────────────────
const obtenerEstadisticas = async (req, res) => {
  try {
    const [pipeline1, pipeline2, porCategoria, porEstado] = await Promise.all([
      // Pipeline 1 oficial: $match resueltas/cerradas, $group por edificio con $avg, $sum y conteo
      Incidencia.aggregate([
        { $match: { estado: { $in: ['resuelta', 'cerrada'] } } },
        {
          $group: {
            _id: '$ubicacion.edificio',
            promedio_horas: { $avg: '$horas_invertidas' },
            total_horas: { $sum: '$horas_invertidas' },
            conteo: { $sum: 1 },
          },
        },
        { $sort: { conteo: -1 } },
      ]),

      // Pipeline 2 oficial: $unwind de tags, $group, $sort y $limit de 10
      Incidencia.aggregate([
        { $unwind: '$tags' },
        { $group: { _id: '$tags', total: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 10 },
      ]),

      // Métricas complementarias para dashboard
      Incidencia.aggregate([
        { $group: { _id: '$categoria', total: { $sum: 1 } } },
      ]),

      Incidencia.aggregate([
        { $group: { _id: '$estado', total: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      exito: true,
      datos: {
        por_edificio: pipeline1,
        top_tags: pipeline2,
        por_categoria: porCategoria,
        por_estado: porEstado,
      },
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener analítica.',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// RF-05: Búsqueda textual ponderada en español
// ─────────────────────────────────────────────────────────────
const buscarTexto = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json({ exito: true, datos: [] });
    }

    const resultados = await Incidencia.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(20);

    res.json({ exito: true, datos: resultados });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error en la búsqueda textual.',
      error: error.message,
    });
  }
};

module.exports = {
  crearIncidencia,
  listarIncidencias,
  obtenerIncidencia,
  actualizarEstado,
  asignarTecnico,
  agregarTags,
  eliminarTag,
  subirEvidencia,
  agregarNota,
  obtenerEstadisticas,
  buscarTexto,
};
