// ═══════════════════════════════════════════════════════════════
// routes/incidenciaRoutes.js — Rutas de incidencias
// RBAC aplicado según la matriz de roles del ERS (Tabla 3 y 4)
// ═══════════════════════════════════════════════════════════════
const router = require('express').Router();
const multer = require('multer');
const {
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
} = require('../controllers/incidenciaController');
const { protegerRuta, autorizar } = require('../middlewares/auth');
const {
  validarCrearIncidencia,
  validarActualizarEstado,
  validarIdMongo,
} = require('../middlewares/validators');

// Multer en memoria para subir a Supabase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB máximo según RNF-02
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = [
      'image/jpeg', 'image/png', 'image/webp',
      'application/pdf',
      'video/mp4', 'video/quicktime',
    ];
    if (tiposPermitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo imágenes, PDF y video.'), false);
    }
  },
});

// Todas las rutas requieren autenticación
router.use(protegerRuta);

// ─── RF-05: Búsqueda textual ponderada ($text en español) ─────
router.get(
  '/buscar',
  autorizar('tecnico', 'coordinador', 'directivo', 'administrador'),
  buscarTexto
);

// ─── RF-06: Analítica directiva (Pipelines oficiales) ─────────
router.get(
  '/analitica',
  autorizar('coordinador', 'directivo', 'administrador'),
  obtenerEstadisticas
);
router.get(
  '/estadisticas',
  autorizar('coordinador', 'directivo', 'administrador'),
  obtenerEstadisticas
);

// ─── RF-01 y RF-08: CRUD principal ───────────────────────────
router.post(
  '/',
  autorizar('reportante', 'tecnico', 'coordinador', 'administrador'),
  validarCrearIncidencia,
  crearIncidencia
);

router.get('/', listarIncidencias); // Filtro RBAC automático en el controlador

router.get('/:id', validarIdMongo, obtenerIncidencia);

// ─── RF-03: Actualizaciones atómicas ($set, $push, $inc) ──────
router.patch(
  '/:id/estado',
  autorizar('tecnico', 'coordinador', 'administrador'),
  validarActualizarEstado,
  actualizarEstado
);

// ─── RF-09: Asignación de técnico (Coordinador) ───────────────
router.patch(
  '/:id/tecnico',
  autorizar('coordinador', 'administrador'),
  asignarTecnico
);
router.patch(
  '/:id/asignar',
  autorizar('coordinador', 'administrador'),
  asignarTecnico
);

// ─── RF-04: Gestión de etiquetas ($addToSet y $pull) ──────────
router.patch(
  '/:id/tags',
  autorizar('tecnico', 'coordinador', 'administrador'),
  agregarTags
);

router.patch(
  '/:id/tags/eliminar',
  autorizar('tecnico', 'coordinador', 'administrador'),
  eliminarTag
);

// ─── RF-02: Evidencias adjuntas (Supabase Storage) ────────────
router.post(
  '/:id/evidencias',
  autorizar('reportante', 'tecnico', 'coordinador', 'administrador'),
  upload.single('archivo'),
  subirEvidencia
);

// ─── Notas técnicas e historial de seguimiento ────────────────
router.post(
  '/:id/notas',
  autorizar('tecnico', 'coordinador', 'administrador'),
  agregarNota
);

module.exports = router;
