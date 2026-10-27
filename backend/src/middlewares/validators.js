// ═══════════════════════════════════════════════════════════════
// middlewares/validators.js — Validaciones con express-validator
// ═══════════════════════════════════════════════════════════════
const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware: Revisar errores de validación y responder 400 si hay.
 */
const revisarValidacion = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({
      exito: false,
      errores: errores.array().map((e) => ({
        campo: e.path,
        mensaje: e.msg,
      })),
    });
  }
  next();
};

// ─── Validaciones de Incidencia ───────────────────────────────
const validarCrearIncidencia = [
  body('titulo')
    .trim()
    .notEmpty().withMessage('El título es obligatorio')
    .isLength({ max: 200 }).withMessage('Máximo 200 caracteres'),
  body('descripcion')
    .trim()
    .notEmpty().withMessage('La descripción es obligatoria')
    .isLength({ max: 2000 }).withMessage('Máximo 2000 caracteres'),
  body('categoria')
    .isIn(['computo_redes', 'infraestructura', 'academico', 'sistemas_academicos'])
    .withMessage('Categoría inválida'),
  body('prioridad')
    .optional()
    .isIn(['baja', 'media', 'alta', 'critica'])
    .withMessage('Prioridad inválida'),
  body('ubicacion.edificio')
    .notEmpty().withMessage('El edificio es obligatorio'),
  body('detalle_especifico')
    .notEmpty().withMessage('El detalle específico es obligatorio'),
  revisarValidacion,
];

const validarActualizarEstado = [
  param('id').isMongoId().withMessage('ID de incidencia inválido'),
  body('estado')
    .isIn(['abierta', 'en_proceso', 'en_progreso', 'en_espera', 'resuelta', 'cerrada'])
    .withMessage('Estado inválido'),
  body('descripcion')
    .optional()
    .trim()
    .notEmpty().withMessage('La descripción del cambio no puede estar vacía'),
  revisarValidacion,
];

// ─── Validaciones de Usuario ──────────────────────────────────
const validarRegistro = [
  body('nombre_completo')
    .trim()
    .notEmpty().withMessage('El nombre completo es obligatorio'),
  body('correo')
    .isEmail().withMessage('Correo inválido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('rol')
    .optional()
    .isIn(['reportante', 'tecnico', 'coordinador', 'directivo', 'administrador'])
    .withMessage('Rol inválido'),
  revisarValidacion,
];

const validarLogin = [
  body('correo')
    .isEmail().withMessage('Correo inválido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria'),
  revisarValidacion,
];

const validarIdMongo = [
  param('id').isMongoId().withMessage('ID inválido'),
  revisarValidacion,
];

module.exports = {
  revisarValidacion,
  validarCrearIncidencia,
  validarActualizarEstado,
  validarRegistro,
  validarLogin,
  validarIdMongo,
};
