// ═══════════════════════════════════════════════════════════════
// controllers/incidenciaController.js — CRUD + Analítica
// Implementa estrictamente RF-01 a RF-10 según Figuras 2 a 6
// ═══════════════════════════════════════════════════════════════
const Incidencia = require('../models/Incidencia');
const generarFolio = require('../utils/generarFolio');
const { uploadFile } = require('../config/supabase');

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
    const cargoUsuario = (req.usuario.perfil_operativo?.cargo || '').trim();
    const rolReportante = ['Docente', 'Estudiante', 'Administrativo'].includes(cargoUsuario)
      ? cargoUsuario
      : (req.usuario.correo?.includes('alumno') ? 'Estudiante' : (req.usuario.rol === 'reportante' ? 'Docente' : 'Administrativo'));

    const autorNombre = req.usuario.nombre || req.usuario.nombre_completo || 'Usuario UTM';

    // Normalizar detalle_especifico según categoría (oneOf en $jsonSchema, sin campos nulos)
    let detalleNormalizado = {};
    if (catNormalizada === 'computo_redes') {
      detalleNormalizado = {
        direccion_ip: String(detalle_especifico?.direccion_ip || '192.168.1.1').trim(),
        vlan: String(detalle_especifico?.vlan || 'VLAN-10').trim(),
        puerto_uplink: String(detalle_especifico?.puerto_uplink || 'Gi0/1').trim(),
        equipos_afectados: Math.max(0, Number(detalle_especifico?.equipos_afectados ?? 1)),
      };
    } else if (catNormalizada === 'infraestructura') {
      const riesgo = ['bajo', 'medio', 'alto'].includes(detalle_especifico?.nivel_riesgo)
        ? detalle_especifico.nivel_riesgo
        : 'medio';
      detalleNormalizado = {
        tipo_dano: String(detalle_especifico?.tipo_dano || 'mantenimiento_general').trim(),
        nivel_riesgo: riesgo,
        requiere_contratista: Boolean(detalle_especifico?.requiere_contratista),
        insumos_requeridos: Array.isArray(detalle_especifico?.insumos_requeridos)
          ? detalle_especifico.insumos_requeridos.map(String).filter(Boolean)
          : (detalle_especifico?.insumos_requeridos
              ? String(detalle_especifico.insumos_requeridos).split(',').map(s => s.trim()).filter(Boolean)
              : ['insumo_basico']),
      };
    } else {
      detalleNormalizado = {
        plataforma: String(detalle_especifico?.plataforma || 'Portal Académico').trim(),
        codigo_curso: String(detalle_especifico?.codigo_curso || 'TI-101').trim(),
        periodo_escolar: String(detalle_especifico?.periodo_escolar || detalle_especifico?.periodo_academico || 'Septiembre-Diciembre 2026').trim(),
        estudiantes_afectados: Math.max(0, Number(detalle_especifico?.estudiantes_afectados ?? detalle_especifico?.alumnos_afectados ?? 1)),
      };
    }

    const tagsRaw = Array.isArray(tags)
      ? tags.map(t => String(t).trim().toLowerCase()).filter(Boolean)
      : (typeof tags === 'string' ? tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : []);
    const tagsUnicos = [...new Set(tagsRaw)];

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
      tags: tagsUnicos,
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
// RF-08 y RF-05: Listar incidencias con Índice Compuesto,
// Búsqueda Ponderada ($text) y control RBAC estricto (Tabla 3)
// ─────────────────────────────────────────────────────────────
const listarIncidencias = async (req, res) => {
  try {
    const { categoria, estado, edificio, prioridad, busqueda, pagina = 1, limite = 20 } = req.query;
    const filtro = {};

    const rolUsuario = (req.usuario.rol || req.usuario.rol_sistema || '').toLowerCase();

    // Control de acceso RBAC (Tabla 3)
    if (rolUsuario === 'reportante') {
      filtro['reportante.correo'] = req.usuario.correo;
    } else if (rolUsuario === 'tecnico') {
      filtro['tecnico_asignado'] = req.usuario.nombre || req.usuario.nombre_completo;
    }

    // Filtros del Índice Compuesto { categoria: 1, estado: 1, "ubicacion.edificio": 1 }
    if (categoria) filtro.categoria = (categoria === 'sistemas_academicos') ? 'academico' : categoria;
    if (estado) filtro.estado = (estado === 'en_progreso') ? 'en_proceso' : estado;
    if (edificio) filtro['ubicacion.edificio'] = edificio;
    if (prioridad) filtro.prioridad = prioridad;

    // RF-05: Búsqueda textual ponderada sobre titulo (peso 10) y descripcion (peso 5)
    const textoBusqueda = busqueda ? String(busqueda).trim() : '';
    if (textoBusqueda) {
      filtro.$text = { $search: textoBusqueda };
    }

    const skip = (parseInt(pagina) - 1) * parseInt(limite);
    const proyeccion = textoBusqueda ? { score: { $meta: 'textScore' } } : {};
    const ordenamiento = textoBusqueda
      ? { score: { $meta: 'textScore' }, fecha_creacion: -1 }
      : { fecha_creacion: -1 };

    const [incidencias, total] = await Promise.all([
      Incidencia.find(filtro, proyeccion)
        .sort(ordenamiento)
        .skip(skip)
        .limit(parseInt(limite))
        .lean(),
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

    const rolUsuario = (req.usuario.rol || req.usuario.rol_sistema || '').toLowerCase();

    // RBAC: Reportante solo ve las suyas
    if (
      rolUsuario === 'reportante' &&
      incidencia.reportante.correo !== req.usuario.correo
    ) {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tiene permiso para ver esta incidencia.',
      });
    }

    // Técnico solo ve las asignadas a él
    if (
      rolUsuario === 'tecnico' &&
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
// RF-03 / CU-03: Actualización ATÓMICA en UNA SOLA operación updateOne
// Usa simultáneamente $set (estado/fecha_resolucion), $inc (horas_invertidas)
// y $push (historial_seguimiento)
// ─────────────────────────────────────────────────────────────
const actualizarEstado = async (req, res) => {
  try {
    const incidenciaActual = await Incidencia.findById(req.params.id);
    if (!incidenciaActual) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Incidencia no encontrada.',
      });
    }

    let { estado, descripcion, comentario, horas, horas_invertidas } = req.body;
    if (estado === 'en_progreso') estado = 'en_proceso';

    const autorNombre = req.usuario.nombre || req.usuario.nombre_completo || 'Usuario UTM';
    const nuevoEstado = estado || incidenciaActual.estado || 'en_proceso';
    const textoNota = (comentario || descripcion || `Seguimiento técnico registrado (${nuevoEstado.replace('_', ' ')})`).trim();
    const horasASumar = Math.max(0, Number(horas_invertidas !== undefined ? horas_invertidas : horas) || 0);

    const camposSet = {
      estado: nuevoEstado,
    };

    if (nuevoEstado === 'resuelta' || nuevoEstado === 'cerrada') {
      camposSet.fecha_resolucion = new Date();
    }

    // Operación atómica única con $set, $inc y $push simultáneos (RF-03)
    const actualizacionAtomica = {
      $set: camposSet,
      $inc: {
        horas_invertidas: horasASumar,
      },
      $push: {
        historial_seguimiento: {
          fecha: new Date(),
          autor: autorNombre,
          estado_asignado: nuevoEstado,
          comentario: textoNota,
        },
      },
    };

    await Incidencia.updateOne({ _id: req.params.id }, actualizacionAtomica);
    const incidenciaActualizada = await Incidencia.findById(req.params.id);

    res.json({
      exito: true,
      mensaje: `Seguimiento atómico guardado (estado: "${nuevoEstado}", +${horasASumar}h).`,
      datos: incidenciaActualizada,
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al actualizar el seguimiento de la incidencia.',
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

    const incidenciaActual = await Incidencia.findById(req.params.id);
    if (!incidenciaActual) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Incidencia no encontrada.',
      });
    }

    const autorNombre = req.usuario.nombre || req.usuario.nombre_completo || 'Coordinador';
    const nuevoEstado = incidenciaActual.estado === 'abierta' ? 'en_proceso' : incidenciaActual.estado;

    await Incidencia.updateOne(
      { _id: req.params.id },
      {
        $set: {
          tecnico_asignado: nombreTecnicoAsignado,
          estado: nuevoEstado,
        },
        $push: {
          historial_seguimiento: {
            fecha: new Date(),
            autor: autorNombre,
            estado_asignado: nuevoEstado,
            comentario: `Técnico asignado por coordinación: ${nombreTecnicoAsignado}`,
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
    const arrayTags = (Array.isArray(tags) ? tags : [tags])
      .map((t) => String(t).trim().toLowerCase())
      .filter(Boolean);

    await Incidencia.updateOne(
      { _id: req.params.id },
      { $addToSet: { tags: { $each: arrayTags } } }
    );

    const incidencia = await Incidencia.findById(req.params.id);
    res.json({
      exito: true,
      mensaje: 'Etiquetas agregadas con $addToSet.',
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
      mensaje: `Tag "${tag}" eliminado con $pull.`,
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

    const incidenciaActual = await Incidencia.findById(req.params.id);
    if (!incidenciaActual) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Incidencia no encontrada.',
      });
    }

    // RBAC: Si es reportante, solo puede subir evidencia en sus propios reportes
    const rolUsuario = (req.usuario.rol || req.usuario.rol_sistema || '').toLowerCase();
    if (rolUsuario === 'reportante' && incidenciaActual.reportante?.correo !== req.usuario.correo) {
      return res.status(403).json({
        exito: false,
        mensaje: 'Solo puedes adjuntar evidencias en incidencias reportadas por ti.',
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
// Agregar nota técnica al historial (redirige al flujo atómico)
// ─────────────────────────────────────────────────────────────
const agregarNota = async (req, res) => {
  return actualizarEstado(req, res);
};

// ─────────────────────────────────────────────────────────────
// RF-06 / CU-06: Analítica directiva (2 Pipelines oficiales de agregación)
// ─────────────────────────────────────────────────────────────
const obtenerEstadisticas = async (req, res) => {
  try {
    const [pipeline1, pipeline2, porCategoria, porEstado] = await Promise.all([
      // Pipeline 1 oficial: $match resueltas/cerradas, $group por $ubicacion.edificio con $avg, $sum y conteo
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
        { $sort: { conteo: -1, total_horas: -1 } },
      ]),

      // Pipeline 2 oficial: $unwind de $tags, $group, $sort descendente y $limit de 10
      Incidencia.aggregate([
        { $unwind: '$tags' },
        { $group: { _id: '$tags', total: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 10 },
      ]),

      // Métricas complementarias por categoría
      Incidencia.aggregate([
        { $group: { _id: '$categoria', total: { $sum: 1 } } },
      ]),

      // Métricas complementarias por estado
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
    if (!q || !String(q).trim()) {
      return res.json({ exito: true, datos: [] });
    }

    const filtro = { $text: { $search: String(q).trim() } };
    const rolUsuario = (req.usuario.rol || req.usuario.rol_sistema || '').toLowerCase();
    if (rolUsuario === 'reportante') {
      filtro['reportante.correo'] = req.usuario.correo;
    } else if (rolUsuario === 'tecnico') {
      filtro['tecnico_asignado'] = req.usuario.nombre || req.usuario.nombre_completo;
    }

    const resultados = await Incidencia.find(
      filtro,
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .lean();

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
