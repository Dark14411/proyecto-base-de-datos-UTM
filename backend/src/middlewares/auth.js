// ═══════════════════════════════════════════════════════════════
// middlewares/auth.js — Autenticación JWT y autorización RBAC
// ═══════════════════════════════════════════════════════════════
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

/**
 * Middleware: Verificar token JWT en el header Authorization.
 * Extrae el usuario de usuarios_campus y lo adjunta a req.usuario.
 */
const protegerRuta = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        exito: false,
        mensaje: 'No autorizado. Token no proporcionado.',
      });
    }

    // Verificar y decodificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuario en la colección usuarios_campus
    const usuario = await Usuario.findById(decoded.id);
    if (!usuario || usuario.cuenta_activa === false || usuario.activo === false) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Token inválido o cuenta desactivada.',
      });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    return res.status(401).json({
      exito: false,
      mensaje: 'Token inválido o expirado.',
    });
  }
};

/**
 * Middleware: Autorizar solo ciertos roles (RBAC).
 * Uso: autorizar('coordinador', 'administrador')
 *
 * Matriz de roles del ERS (Tabla 2 y Tabla 3):
 * - reportante:     Crea incidencias, sube evidencias propias, consulta solo las suyas
 * - tecnico:        Atiende sus incidencias asignadas, actualiza seguimiento atómico, tags y evidencias
 * - coordinador:    Ve todas, asigna/reasigna técnicos, actualiza seguimiento, tags y ve analítica
 * - directivo:      Solo lectura de analítica y de todas las incidencias
 * - administrador:  Gestión de usuarios (usuarios_campus) y edificios (edificios_campus)
 */
const autorizar = (...rolesPermitidos) => {
  return (req, res, next) => {
    const rolActual = (req.usuario.rol || req.usuario.rol_sistema || '').toLowerCase();
    const permitidos = rolesPermitidos.map((r) => r.toLowerCase());
    if (!permitidos.includes(rolActual)) {
      return res.status(403).json({
        exito: false,
        mensaje: `Rol "${rolActual}" no tiene permiso para esta acción. Roles permitidos: ${rolesPermitidos.join(', ')}`,
      });
    }
    next();
  };
};

/**
 * Genera un token JWT con el ID del usuario.
 */
const generarToken = (usuarioId) => {
  return jwt.sign({ id: usuarioId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};

module.exports = { protegerRuta, autorizar, generarToken };
