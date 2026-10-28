// ═══════════════════════════════════════════════════════════════
// controllers/authController.js — Autenticación (RF-10)
// Conectado directamente a la colección real usuarios_campus
// ═══════════════════════════════════════════════════════════════
const Usuario = require('../models/Usuario');
const { generarToken } = require('../middlewares/auth');

const serializarUsuario = (usuario) => ({
  _id: usuario._id,
  matricula_o_clave: usuario.matricula_o_clave || usuario.matricula_o_numero_empleado || 'S/M',
  matricula_o_numero_empleado: usuario.matricula_o_numero_empleado || usuario.matricula_o_clave || 'S/M',
  nombre: usuario.nombre || usuario.nombre_completo,
  nombre_completo: usuario.nombre_completo || usuario.nombre,
  correo: usuario.correo,
  rol_sistema: usuario.rol_sistema || (usuario.rol ? usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1) : 'Reportante'),
  rol: (usuario.rol || usuario.rol_sistema || 'reportante').toLowerCase(),
  activo: usuario.activo !== false && usuario.cuenta_activa !== false,
  cuenta_activa: usuario.cuenta_activa !== false && usuario.activo !== false,
  perfil_operativo: {
    departamento: usuario.perfil_operativo?.departamento || usuario.departamento || 'Comunidad Universitaria',
    especialidades: usuario.perfil_operativo?.especialidades?.length
      ? usuario.perfil_operativo.especialidades
      : (usuario.especialidades || []),
    cargo: usuario.perfil_operativo?.cargo || usuario.rol_sistema || 'General',
  },
  departamento: usuario.departamento || usuario.perfil_operativo?.departamento || 'Comunidad Universitaria',
  especialidades: usuario.especialidades?.length
    ? usuario.especialidades
    : (usuario.perfil_operativo?.especialidades || []),
  telefono: usuario.telefono || '',
  fecha_alta: usuario.fecha_alta || usuario.createdAt,
  ultimo_acceso: usuario.ultimo_acceso,
});

/**
 * POST /api/auth/registro
 * Crea un nuevo usuario en la colección usuarios_campus de MongoDB Atlas.
 */
const registro = async (req, res) => {
  try {
    const {
      nombre_completo,
      nombre,
      correo,
      password,
      rol,
      rol_sistema,
      matricula_o_numero_empleado,
      matricula_o_clave,
      departamento,
      telefono,
      especialidades,
      cargo,
      perfil_operativo,
    } = req.body;

    const emailLimpio = (correo || '').toLowerCase().trim();
    const existente = await Usuario.findOne({ correo: emailLimpio });
    if (existente) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Ya existe un usuario con ese correo.',
      });
    }

    const nombreFinal = (nombre || nombre_completo || '').trim();
    const matFinal = (matricula_o_clave || matricula_o_numero_empleado || `UTM-${Date.now().toString().slice(-4)}`).trim();
    const deptoFinal = (departamento || perfil_operativo?.departamento || 'Comunidad Universitaria').trim();
    const espFinal = Array.isArray(especialidades) ? especialidades : (perfil_operativo?.especialidades || []);
    const rolNormalizado = (rol || rol_sistema || 'reportante').toLowerCase();
    const mapRolSistema = {
      reportante: 'Reportante',
      tecnico: 'Tecnico',
      coordinador: 'Coordinador',
      directivo: 'Directivo',
      administrador: 'Administrador',
    };
    const rolSistemaFinal = mapRolSistema[rolNormalizado] || 'Reportante';

    const nuevoUsuario = await Usuario.create({
      matricula_o_clave: matFinal,
      matricula_o_numero_empleado: matFinal,
      nombre: nombreFinal,
      nombre_completo: nombreFinal,
      correo: emailLimpio,
      password_hash: password || 'utm123',
      rol_sistema: rolSistemaFinal,
      rol: rolNormalizado,
      activo: true,
      cuenta_activa: true,
      departamento: deptoFinal,
      telefono,
      especialidades: espFinal,
      perfil_operativo: {
        departamento: deptoFinal,
        especialidades: espFinal,
        cargo: cargo || perfil_operativo?.cargo || rolSistemaFinal,
      },
      fecha_alta: new Date(),
      ultimo_acceso: new Date(),
    });

    const token = generarToken(nuevoUsuario._id);

    res.status(201).json({
      exito: true,
      mensaje: 'Usuario registrado exitosamente en MongoDB Atlas.',
      datos: {
        usuario: serializarUsuario(nuevoUsuario),
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error en el registro.',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/login
 * Inicia sesión leyendo directamente de usuarios_campus y devuelve un token JWT.
 */
const login = async (req, res) => {
  try {
    const correoLimpio = (req.body.correo || '').toLowerCase().trim();
    const { password } = req.body;

    // Buscar usuario incluyendo el password_hash en usuarios_campus
    const usuario = await Usuario.findOne({ correo: correoLimpio }).select('+password_hash');
    if (!usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales inválidas.',
      });
    }

    if (usuario.cuenta_activa === false || usuario.activo === false) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Cuenta desactivada. Contacte al administrador.',
      });
    }

    // Comparar contraseña con bcrypt
    const esCorrecta = await usuario.compararPassword(password);
    if (!esCorrecta) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales inválidas.',
      });
    }

    // Actualizar último acceso
    usuario.ultimo_acceso = new Date();
    await usuario.save();

    const token = generarToken(usuario._id);

    res.json({
      exito: true,
      mensaje: 'Inicio de sesión exitoso.',
      datos: {
        usuario: serializarUsuario(usuario),
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error en el inicio de sesión.',
      error: error.message,
    });
  }
};

/**
 * GET /api/auth/perfil
 * Devuelve el perfil del usuario autenticado desde MongoDB Atlas.
 */
const obtenerPerfil = async (req, res) => {
  res.json({
    exito: true,
    datos: {
      usuario: serializarUsuario(req.usuario),
    },
  });
};

/**
 * GET /api/auth/perfiles
 * Devuelve todos los usuarios activos de usuarios_campus para el selector
 * superior de cambio de rol/usuario y pantalla de acceso rápido.
 */
const listarPerfilesActivos = async (req, res) => {
  try {
    const usuarios = await Usuario.find({
      activo: { $ne: false },
      cuenta_activa: { $ne: false },
    }).sort({ fecha_alta: -1, createdAt: -1 });

    res.json({
      exito: true,
      datos: usuarios.map(serializarUsuario),
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener perfiles de usuarios_campus.',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/switch
 * Permite cambiar de sesión instantáneamente generando un token JWT válido
 * para cualquier usuario de usuarios_campus en MongoDB Atlas.
 */
const switchUsuario = async (req, res) => {
  try {
    const { correo, usuario_id } = req.body;
    const filtro = {};
    if (usuario_id) filtro._id = usuario_id;
    else if (correo) filtro.correo = correo.toLowerCase().trim();
    else {
      return res.status(400).json({ exito: false, mensaje: 'Especifique correo o ID de usuario.' });
    }

    const usuario = await Usuario.findOne(filtro);
    if (!usuario) {
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado en usuarios_campus.' });
    }

    if (usuario.activo === false || usuario.cuenta_activa === false) {
      return res.status(403).json({ exito: false, mensaje: 'Esta cuenta de usuario se encuentra inactiva.' });
    }

    usuario.ultimo_acceso = new Date();
    await usuario.save();

    const token = generarToken(usuario._id);

    res.json({
      exito: true,
      mensaje: `Sesión activa cambiada a ${usuario.nombre || usuario.nombre_completo}.`,
      datos: {
        usuario: serializarUsuario(usuario),
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al alternar usuario.',
      error: error.message,
    });
  }
};

module.exports = {
  registro,
  login,
  obtenerPerfil,
  listarPerfilesActivos,
  switchUsuario,
  serializarUsuario,
};
