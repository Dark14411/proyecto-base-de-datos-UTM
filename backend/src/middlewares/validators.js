// ═══════════════════════════════════════════════════════════════
// middlewares/validators.js — Validaciones con express-validator
// ═══════════════════════════════════════════════════════════════
const { body, param, validationResult } = require('express-validator');

/**
 * Middleware: Revisar errores de validación y responder 400 si hay.
 */
const revisarValidacion = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({
      exito: false,
      mensaje: errores.array()[0]?.msg || 'Error de validación en los campos enviados.',
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
    .isLength({ min: 5, max: 120 }).withMessage('El título debe tener entre 5 y 120 caracteres'),
  body('descripcion')
    .trim()
    .notEmpty().withMessage('La descripción es obligatoria')
    .isLength({ min: 10, max: 2000 }).withMessage('La descripción debe tener al menos 10 caracteres'),
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
    .optional({ values: 'falsy' })
    .isIn(['abierta', 'en_proceso', 'en_progreso', 'en_espera', 'resuelta', 'cerrada'])
    .withMessage('Estado inválido'),
  revisarValidacion,
];

// ─── Validaciones de Usuario (usuarios_campus) ────────────────
const validarRegistro = [
  body().custom((value, { req }) => {
    const nombre = (req.body.nombre || req.body.nombre_completo || '').trim();
    if (!nombre) {
      throw new Error('El nombre del usuario es obligatorio');
    }
    return true;
  }),
  body('correo')
    .trim()
    .toLowerCase()
    .isEmail().withMessage('Correo electrónico inválido'),
  body('password')
    .optional({ values: 'falsy' })
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('rol')
    .optional({ values: 'falsy' })
    .custom((val) => {
      const limpio = String(val).toLowerCase();
      if (!['reportante', 'tecnico', 'coordinador', 'directivo', 'administrador'].includes(limpio)) {
        throw new Error('Rol inválido');
      }
      return true;
    }),
  revisarValidacion,
];

const validarLogin = [
  body('correo')
    .trim()
    .toLowerCase()
    .isEmail().withMessage('Correo inválido'),
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
