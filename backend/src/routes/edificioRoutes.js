// ═══════════════════════════════════════════════════════════════
// routes/edificioRoutes.js — Rutas del catálogo de edificios
// ═══════════════════════════════════════════════════════════════
const router = require('express').Router();
const {
  listarEdificios,
  obtenerEdificio,
  crearEdificio,
  actualizarEdificio,
} = require('../controllers/edificioController');
const { protegerRuta, autorizar } = require('../middlewares/auth');
const { validarIdMongo } = require('../middlewares/validators');

router.use(protegerRuta);

// Listar edificios — cualquier usuario autenticado
router.get('/', listarEdificios);
router.get('/:id', validarIdMongo, obtenerEdificio);

// Crear / actualizar — solo administrador
router.post('/', autorizar('administrador'), crearEdificio);
router.put('/:id', autorizar('administrador'), validarIdMongo, actualizarEdificio);

module.exports = router;
