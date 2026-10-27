// ═══════════════════════════════════════════════════════════════
// routes/usuarioRoutes.js — Rutas de gestión de usuarios
// ═══════════════════════════════════════════════════════════════
const router = require('express').Router();
const {
  listarUsuarios,
  listarTecnicos,
  obtenerUsuario,
  actualizarUsuario,
  desactivarUsuario,
  crearUsuario,
} = require('../controllers/usuarioController');
const { protegerRuta, autorizar } = require('../middlewares/auth');
const { validarIdMongo, validarRegistro } = require('../middlewares/validators');

router.use(protegerRuta);

// Listar técnicos activos (para selector de asignación) — coordinador+
router.get(
  '/tecnicos',
  autorizar('coordinador', 'administrador'),
  listarTecnicos
);

// CRUD de usuarios — solo administrador (listar permitido para coordinador)
router.get(
  '/',
  autorizar('coordinador', 'administrador'),
  listarUsuarios
);

router.post(
  '/',
  autorizar('administrador'),
  validarRegistro,
  crearUsuario
);

router.get(
  '/:id',
  autorizar('administrador'),
  validarIdMongo,
  obtenerUsuario
);

router.put(
  '/:id',
  autorizar('administrador'),
  validarIdMongo,
  actualizarUsuario
);

router.delete(
  '/:id',
  autorizar('administrador'),
  validarIdMongo,
  desactivarUsuario
);

module.exports = router;
