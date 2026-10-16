/**
 * routes/incidencias.js — Rutas de la API REST
 * ═══════════════════════════════════════════════════════════════
 * Mapeo de CU → Endpoint:
 *   CU-01  POST   /api/incidencias
 *   CU-02  POST   /api/incidencias/:id/evidencias
 *   CU-03  PATCH  /api/incidencias/:id/seguimiento
 *   CU-04  PATCH  /api/incidencias/:id/tags
 *   CU-05  GET    /api/incidencias/buscar
 *   CU-06  GET    /api/incidencias/analitica
 *   CU-07  GET    /api/incidencias          (con filtros)
 *   Extra  GET    /api/incidencias/:id       (por ID)
 * ═══════════════════════════════════════════════════════════════
 */
const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");

const {
  crearIncidencia,
  subirEvidencia,
  actualizarSeguimiento,
  gestionarTags,
  buscarIncidencias,
  obtenerAnalitica,
  listarIncidencias,
  obtenerIncidenciaPorId,
  actualizarIncidencia,
  eliminarIncidencia,
} = require("../controllers/incidenciasController");

// ── Las rutas específicas van ANTES de las rutas con :id ──

// CU-05: Búsqueda full-text
router.get("/buscar", buscarIncidencias);

// CU-06: Analítica (pipelines de agregación)
router.get("/analitica", obtenerAnalitica);

// CU-07: Listado general con filtros
router.get("/", listarIncidencias);

// CU-01: Crear incidencia
router.post("/", crearIncidencia);

// Extra: Obtener incidencia por ID
router.get("/:id", obtenerIncidenciaPorId);

// CRUD: actualizar y eliminar una incidencia
router.put("/:id", actualizarIncidencia);
router.delete("/:id", eliminarIncidencia);

// CU-02: Subir evidencia (archivo o simulada)
router.post("/:id/evidencias", upload.single("archivo"), subirEvidencia);

// CU-03: Actualizar seguimiento (operación atómica $set + $push + $inc)
router.patch("/:id/seguimiento", actualizarSeguimiento);

// CU-04: Gestionar tags ($addToSet / $pull)
router.patch("/:id/tags", gestionarTags);

module.exports = router;
