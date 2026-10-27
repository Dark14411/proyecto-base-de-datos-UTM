// ═══════════════════════════════════════════════════════════════
// controllers/authController.js — Autenticación (RF-10)
// ═══════════════════════════════════════════════════════════════
const Usuario = require('../models/Usuario');
const { generarToken } = require('../middlewares/auth');

/**
 * POST /api/auth/registro
 * Crea un nuevo usuario en el sistema.
 * Solo un administrador puede asignar roles distintos a "reportante".
 */
const registro = async (req, res) => {
  try {
    const { nombre_completo, correo, password, rol, matricula_o_numero_empleado, departamento, telefono, especialidades } = req.body;

    // Verificar si el correo ya existe
    const existente = await Usuario.findOne({ correo });
    if (existente) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Ya existe un usuario con ese correo.',
      });
    }

    const nuevoUsuario = await Usuario.create({
      nombre_completo,
      correo,
      password_hash: password,
      rol: rol || 'reportante',
      matricula_o_numero_empleado,
      departamento,
      telefono,
      especialidades: especialidades || [],
    });

    const token = generarToken(nuevoUsuario._id);

    res.status(201).json({
      exito: true,
      mensaje: 'Usuario registrado exitosamente.',
      datos: {
        usuario: {
          _id: nuevoUsuario._id,
          nombre_completo: nuevoUsuario.nombre_completo,
          correo: nuevoUsuario.correo,
          rol: nuevoUsuario.rol,
        },
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
 * Inicia sesión y devuelve un token JWT.
 */
const login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    // Buscar usuario incluyendo el password_hash
    const usuario = await Usuario.findOne({ correo }).select('+password_hash');
    if (!usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales inválidas.',
      });
    }

    if (!usuario.cuenta_activa) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Cuenta desactivada. Contacte al administrador.',
      });
    }

    // Comparar contraseña
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
        usuario: {
          _id: usuario._id,
          nombre_completo: usuario.nombre_completo,
          correo: usuario.correo,
          rol: usuario.rol,
          especialidades: usuario.especialidades,
        },
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
 * Devuelve el perfil del usuario autenticado.
 */
const obtenerPerfil = async (req, res) => {
  res.json({
    exito: true,
    datos: {
      usuario: {
        _id: req.usuario._id,
        nombre_completo: req.usuario.nombre_completo,
        correo: req.usuario.correo,
        rol: req.usuario.rol,
        departamento: req.usuario.departamento,
        especialidades: req.usuario.especialidades,
        cuenta_activa: req.usuario.cuenta_activa,
        ultimo_acceso: req.usuario.ultimo_acceso,
      },
    },
  });
};

module.exports = { registro, login, obtenerPerfil };
