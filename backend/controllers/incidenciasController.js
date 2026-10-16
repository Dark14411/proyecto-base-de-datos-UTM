/**
 * controllers/incidenciasController.js
 * ═══════════════════════════════════════════════════════════════
 * Controladores para todos los Casos de Uso (CU-01 a CU-07)
 * ═══════════════════════════════════════════════════════════════
 */
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const { getRedis } = require("../config/redis");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");

const COLLECTION = "incidencias_campus";

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Genera un folio formal usando Redis INCR.
 * Formato: INC-YYYY-XXXX (ej. INC-2026-0042)
 */
async function generarFolio(categoria) {
  const redis = getRedis();
  const ahora = new Date();
  const yyyy = ahora.getFullYear();
  const mm = String(ahora.getMonth() + 1).padStart(2, "0");
  const dd = String(ahora.getDate()).padStart(2, "0");
  const clave = `contador:incidencias:${yyyy}-${mm}-${dd}:${categoria}`;

  const consecutivo = await redis.incr(clave);
  // Establecer TTL de 24h en la clave si es nueva
  const ttl = await redis.ttl(clave);
  if (ttl === -1) {
    await redis.expire(clave, 86400);
  }

  // Para el folio global, usamos un contador global
  const globalKey = `contador:incidencias:global`;
  const globalConsecutivo = await redis.incr(globalKey);

  const folio = `INC-${yyyy}-${String(globalConsecutivo).padStart(4, "0")}`;
  return folio;
}

// ═══════════════════════════════════════════════════════════════════════════
// CU-01: POST /api/incidencias — Registrar nueva incidencia
// ═══════════════════════════════════════════════════════════════════════════
exports.crearIncidencia = async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection(COLLECTION);
    const body = req.body;

    // Generar folio con Redis INCR
    const codigo_incidencia = await generarFolio(body.categoria);

    // Construir el documento
    const documento = {
      codigo_incidencia,
      titulo: body.titulo,
      descripcion: body.descripcion,
      categoria: body.categoria,
      prioridad: body.prioridad,
      estado: "abierta",
      horas_invertidas: 0,
      fecha_creacion: new Date(),
      reportante: {
        nombre: body.reportante?.nombre,
        rol: body.reportante?.rol,
        correo: body.reportante?.correo,
      },
      ubicacion: {
        edificio: body.ubicacion?.edificio,
        aula_espacio: body.ubicacion?.aula_espacio,
      },
      tags: body.tags || [],
      historial_seguimiento: [
        {
          fecha: new Date(),
          autor: "Sistema",
          estado_asignado: "abierta",
          comentario: "Incidencia registrada automáticamente.",
          horas_agregadas: 0,
        },
      ],
      evidencias_adjuntas: [],
      detalle_especifico: body.detalle_especifico || {},
    };

    const result = await col.insertOne(documento);

    return res.status(201).json({
      mensaje: "Incidencia creada exitosamente.",
      incidencia: { _id: result.insertedId, ...documento },
    });
  } catch (error) {
    // Error code 121 = Document failed validation ($jsonSchema)
    if (error.code === 121) {
      return res.status(400).json({
        error: "Fallo de validación de esquema ($jsonSchema)",
        detalle: error.errInfo?.details || error.message,
        codigo: 121,
      });
    }

    console.error("Error al crear incidencia:", error);
    return res.status(400).json({
      error: "Error al crear la incidencia",
      detalle: error.message,
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// CU-02: POST /api/incidencias/:id/evidencias — Subir evidencia
// ═══════════════════════════════════════════════════════════════════════════
exports.subirEvidencia = async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection(COLLECTION);
    const { id } = req.params;

    let evidencia;

    if (req.file) {
      // Archivo real subido via multer → almacenamiento local simulando Cloud Storage
      const archivo = req.file;
      const uniqueName = `${uuidv4()}${path.extname(archivo.originalname)}`;
      const urlStorage = `${req.protocol}://${req.get("host")}/uploads/${uniqueName}`;

      // Mover archivo al directorio uploads
      const destPath = path.join(__dirname, "..", "uploads", uniqueName);
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.renameSync(archivo.path, destPath);

      evidencia = {
        nombre_archivo: archivo.originalname,
        tipo_mime: archivo.mimetype,
        peso_kb: Math.round(archivo.size / 1024),
        url_storage: urlStorage,
        fecha_carga: new Date(),
      };
    } else {
      // Simulación sin archivo — se genera URL mock
      const { nombre_archivo, tipo_mime, peso_kb } = req.body;
      evidencia = {
        nombre_archivo: nombre_archivo || "evidencia_simulada.png",
        tipo_mime: tipo_mime || "image/png",
        peso_kb: peso_kb ? Number(peso_kb) : 500,
        url_storage: `https://storage.example.com/evidencias/${uuidv4()}.png`,
        fecha_carga: new Date(),
      };
    }

    // $push atómico sobre evidencias_adjuntas
    const result = await col.updateOne(
      { _id: new ObjectId(id) },
      { $push: { evidencias_adjuntas: evidencia } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Incidencia no encontrada." });
    }

    return res.status(200).json({
      mensaje: "Evidencia agregada exitosamente.",
      evidencia,
    });
  } catch (error) {
    console.error("Error al subir evidencia:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// CU-03: PATCH /api/incidencias/:id/seguimiento — Actualizar seguimiento
// ═══════════════════════════════════════════════════════════════════════════
exports.actualizarSeguimiento = async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection(COLLECTION);
    const { id } = req.params;
    const { estado, horas_invertidas, comentario, autor } = req.body;

    if (!estado || !comentario || !autor) {
      return res.status(400).json({
        error: "Campos requeridos: estado, comentario, autor.",
      });
    }

    const horasNum = Number(horas_invertidas) || 0;

    // UNA SOLA operación atómica con $set, $push y $inc simultáneos
    const updateOps = {
      $set: { estado },
      $push: {
        historial_seguimiento: {
          fecha: new Date(),
          autor,
          estado_asignado: estado,
          comentario,
          horas_agregadas: horasNum,
        },
      },
      $inc: { horas_invertidas: horasNum },
    };

    // Si el estado es "resuelta", asignar fecha_resolucion
    if (estado === "resuelta") {
      updateOps.$set.fecha_resolucion = new Date();
    }

    const result = await col.updateOne(
      { _id: new ObjectId(id) },
      updateOps
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Incidencia no encontrada." });
    }

    return res.status(200).json({
      mensaje: "Seguimiento actualizado exitosamente.",
      modificados: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error al actualizar seguimiento:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// CU-04: PATCH /api/incidencias/:id/tags — Gestionar tags
// ═══════════════════════════════════════════════════════════════════════════
exports.gestionarTags = async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection(COLLECTION);
    const { id } = req.params;
    const { accion, tag } = req.body;

    if (!accion || !tag) {
      return res.status(400).json({
        error: "Campos requeridos: accion ('agregar' | 'eliminar'), tag.",
      });
    }

    let updateOp;
    if (accion === "agregar") {
      updateOp = { $addToSet: { tags: tag } };
    } else if (accion === "eliminar" || accion === "remover") {
      updateOp = { $pull: { tags: tag } };
    } else {
      return res.status(400).json({
        error: "Acción inválida. Usa 'agregar' o 'eliminar' / 'remover'.",
      });
    }

    const result = await col.updateOne(
      { _id: new ObjectId(id) },
      updateOp
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Incidencia no encontrada." });
    }

    return res.status(200).json({
      mensaje: `Tag '${tag}' ${accion === "agregar" ? "agregado" : "eliminado"} exitosamente.`,
      modificados: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error al gestionar tags:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// CU-05: GET /api/incidencias/buscar?q=texto — Búsqueda full-text
// ═══════════════════════════════════════════════════════════════════════════
exports.buscarIncidencias = async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection(COLLECTION);
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        error: "Parámetro de búsqueda 'q' requerido.",
      });
    }

    const resultados = await col
      .find(
        { $text: { $search: q } },
        { projection: { score: { $meta: "textScore" } } }
      )
      .sort({ score: { $meta: "textScore" } })
      .toArray();

    return res.status(200).json({
      total: resultados.length,
      query: q,
      resultados,
    });
  } catch (error) {
    console.error("Error en búsqueda full-text:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// CU-06: GET /api/incidencias/analitica — Pipelines de Agregación
// ═══════════════════════════════════════════════════════════════════════════
exports.obtenerAnalitica = async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection(COLLECTION);

    // Pipeline 1: Eficiencia por edificio
    const eficienciaPorEdificio = await col
      .aggregate([
        {
          $match: {
            estado: { $in: ["resuelta", "cerrada"] },
          },
        },
        {
          $group: {
            _id: "$ubicacion.edificio",
            promedio_horas: { $avg: "$horas_invertidas" },
            total_horas: { $sum: "$horas_invertidas" },
            total_tickets: { $sum: 1 },
          },
        },
        {
          $sort: { total_tickets: -1 },
        },
      ])
      .toArray();

    // Pipeline 2: Top 10 tags recurrentes
    const topTags = await col
      .aggregate([
        { $unwind: "$tags" },
        {
          $group: {
            _id: "$tags",
            frecuencia: { $sum: 1 },
          },
        },
        { $sort: { frecuencia: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    // Pipeline extra: Distribución por categoría
    const distribucionCategoria = await col
      .aggregate([
        {
          $group: {
            _id: "$categoria",
            total: { $sum: 1 },
            resueltas: {
              $sum: {
                $cond: [
                  { $in: ["$estado", ["resuelta", "cerrada"]] },
                  1,
                  0,
                ],
              },
            },
            promedio_horas: { $avg: "$horas_invertidas" },
          },
        },
        { $sort: { total: -1 } },
      ])
      .toArray();

    // Pipeline extra: Distribución por prioridad
    const distribucionPrioridad = await col
      .aggregate([
        {
          $group: {
            _id: "$prioridad",
            total: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ])
      .toArray();

    // Pipeline extra: Distribución por estado
    const distribucionEstado = await col
      .aggregate([
        {
          $group: {
            _id: "$estado",
            total: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ])
      .toArray();

    // Pipeline extra: Incidencias por mes
    const incidenciasPorMes = await col
      .aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$fecha_creacion" },
              month: { $month: "$fecha_creacion" },
            },
            total: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": -1, "_id.month": -1 } },
        { $limit: 12 },
      ])
      .toArray();

    return res.status(200).json({
      eficiencia_por_edificio: eficienciaPorEdificio,
      top_tags: topTags,
      distribucion_categoria: distribucionCategoria,
      distribucion_prioridad: distribucionPrioridad,
      distribucion_estado: distribucionEstado,
      incidencias_por_mes: incidenciasPorMes,
    });
  } catch (error) {
    console.error("Error en analítica:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// CU-07: GET /api/incidencias — Consulta general con filtros
// ═══════════════════════════════════════════════════════════════════════════
exports.listarIncidencias = async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection(COLLECTION);
    const { categoria, estado, edificio } = req.query;

    // Construir filtro aprovechando el índice compuesto
    const filtro = {};
    if (categoria) filtro.categoria = categoria;
    if (estado) filtro.estado = estado;
    if (edificio) filtro["ubicacion.edificio"] = edificio;

    const incidencias = await col
      .find(filtro)
      .sort({ fecha_creacion: -1 })
      .toArray();

    return res.status(200).json({
      total: incidencias.length,
      filtros_aplicados: { categoria, estado, edificio },
      incidencias,
    });
  } catch (error) {
    console.error("Error al listar incidencias:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// Extra: GET /api/incidencias/:id — Obtener incidencia por ID
// ═══════════════════════════════════════════════════════════════════════════
exports.obtenerIncidenciaPorId = async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection(COLLECTION);
    const { id } = req.params;

    const incidencia = await col.findOne({ _id: new ObjectId(id) });

    if (!incidencia) {
      return res.status(404).json({ error: "Incidencia no encontrada." });
    }

    return res.status(200).json(incidencia);
  } catch (error) {
    console.error("Error al obtener incidencia:", error);
    return res.status(500).json({ error: error.message });
  }
};

// CRUD: PUT /api/incidencias/:id — Actualizar datos editables
exports.actualizarIncidencia = async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection(COLLECTION);
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de incidencia inválido." });
    }

    const camposPermitidos = [
      "titulo",
      "descripcion",
      "categoria",
      "prioridad",
      "reportante",
      "ubicacion",
      "tags",
      "detalle_especifico",
    ];
    const cambios = Object.fromEntries(
      camposPermitidos
        .filter((campo) => req.body[campo] !== undefined)
        .map((campo) => [campo, req.body[campo]])
    );

    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({ error: "No se recibieron campos editables." });
    }

    const resultado = await col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: cambios },
      { returnDocument: "after" }
    );

    if (!resultado) {
      return res.status(404).json({ error: "Incidencia no encontrada." });
    }

    return res.status(200).json({
      mensaje: "Incidencia actualizada exitosamente.",
      incidencia: resultado,
    });
  } catch (error) {
    console.error("Error al actualizar incidencia:", error);
    return res.status(error.code === 121 ? 400 : 500).json({
      error: "Error al actualizar la incidencia",
      detalle: error.message,
    });
  }
};

// CRUD: DELETE /api/incidencias/:id — Eliminar incidencia
exports.eliminarIncidencia = async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection(COLLECTION);
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de incidencia inválido." });
    }

    const resultado = await col.deleteOne({ _id: new ObjectId(id) });
    if (resultado.deletedCount === 0) {
      return res.status(404).json({ error: "Incidencia no encontrada." });
    }

    return res.status(200).json({ mensaje: "Incidencia eliminada exitosamente." });
  } catch (error) {
    console.error("Error al eliminar incidencia:", error);
    return res.status(500).json({ error: error.message });
  }
};
