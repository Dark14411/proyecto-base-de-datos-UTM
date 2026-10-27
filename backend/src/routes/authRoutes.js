// ═══════════════════════════════════════════════════════════════
// routes/authRoutes.js — Rutas de autenticación
// ═══════════════════════════════════════════════════════════════
const router = require('express').Router();
const { registro, login, obtenerPerfil } = require('../controllers/authController');
const { protegerRuta } = require('../middlewares/auth');
const { validarRegistro, validarLogin } = require('../middlewares/validators');

router.post('/registro', validarRegistro, registro);
router.post('/login', validarLogin, login);
router.get('/perfil', protegerRuta, obtenerPerfil);

module.exports = router;
