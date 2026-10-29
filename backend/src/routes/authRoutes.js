// ═══════════════════════════════════════════════════════════════
// routes/authRoutes.js — Rutas de autenticación
// ═══════════════════════════════════════════════════════════════
const router = require('express').Router();
const {
  registro,
  login,
  obtenerPerfil,
  listarPerfilesActivos,
  switchUsuario,
} = require('../controllers/authController');
const { protegerRuta } = require('../middlewares/auth');
const { validarRegistro, validarLogin } = require('../middlewares/validators');

router.post('/registro', validarRegistro, registro);
router.post('/login', validarLogin, login);
router.post('/switch', switchUsuario);
router.get('/perfiles', listarPerfilesActivos);
router.get('/perfil', protegerRuta, obtenerPerfil);

module.exports = router;
