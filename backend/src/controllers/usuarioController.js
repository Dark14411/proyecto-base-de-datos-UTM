// ═══════════════════════════════════════════════════════════════
// controllers/usuarioController.js — Gestión de usuarios (Admin)
// ═══════════════════════════════════════════════════════════════
const Usuario = require('../models/Usuario');

/**
 * GET /api/usuarios
 * Lista todos los usuarios. Solo coordinador y administrador.
 */
const listarUsuarios = async (req, res) => {
  try {
    const { rol, activo, pagina = 1, limite = 20 } = req.query;
    const filtro = {};

    if (rol) filtro.rol = rol;
    if (activo !== undefined) filtro.cuenta_activa = activo === 'true';
    if (req.query.busqueda) {
      const q = req.query.busqueda.trim();
      filtro.$or = [
        { nombre_completo: { $regex: q, $options: 'i' } },
        { correo: { $regex: q, $options: 'i' } },
      ];
    }

    const skip = (parseInt(pagina) - 1) * parseInt(limite);

    const [usuarios, total] = await Promise.all([
      Usuario.find(filtro)
        .sort({ nombre_completo: 1 })
        .skip(skip)
        .limit(parseInt(limite)),
      Usuario.countDocuments(filtro),
    ]);

    res.json({
      exito: true,
      datos: {
        usuarios,
        paginacion: {
          total,
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          paginas: Math.ceil(total / parseInt(limite)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al listar usuarios.',
      error: error.message,
    });
  }
};

/**
 * GET /api/usuarios/tecnicos
 * Lista todos los técnicos activos (para el selector de asignación).
 */
const listarTecnicos = async (req, res) => {
  try {
    const tecnicos = await Usuario.find({
      rol: 'tecnico',
      $or: [{ cuenta_activa: true }, { activo: true }],
    }).select('nombre nombre_completo correo especialidades');

    res.json({ exito: true, datos: tecnicos });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al listar técnicos.',
      error: error.message,
    });
  }
};

/**
 * GET /api/usuarios/:id
 */
const obtenerUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Usuario no encontrado.',
      });
    }
    res.json({ exito: true, datos: usuario });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener usuario.',
      error: error.message,
    });
  }
};

/**
 * PUT /api/usuarios/:id
 * Actualiza un usuario. Solo administrador.
 */
const actualizarUsuario = async (req, res) => {
  try {
    const { nombre_completo, rol, departamento, telefono, especialidades, cuenta_activa } = req.body;

    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { nombre_completo, rol, departamento, telefono, especialidades, cuenta_activa },
      { new: true, runValidators: true }
    );

    if (!usuario) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Usuario no encontrado.',
      });
    }

    res.json({
      exito: true,
      mensaje: 'Usuario actualizado.',
      datos: usuario,
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al actualizar usuario.',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/usuarios/:id
 * Desactiva la cuenta (soft delete). Solo administrador.
 */
const desactivarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { cuenta_activa: false },
      { new: true }
    );

    if (!usuario) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Usuario no encontrado.',
      });
    }

    res.json({
      exito: true,
      mensaje: `Cuenta de ${usuario.nombre_completo} desactivada.`,
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al desactivar usuario.',
      error: error.message,
    });
  }
};

/**
 * POST /api/usuarios
 * Crea un nuevo usuario. Solo administrador.
 */
const crearUsuario = async (req, res) => {
  try {
    const { nombre_completo, correo, password, rol, matricula_o_numero_empleado, departamento, telefono, especialidades } = req.body;

    const existente = await Usuario.findOne({ correo: correo.toLowerCase().trim() });
    if (existente) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Ya existe un usuario con ese correo.',
      });
    }

    const nuevoUsuario = await Usuario.create({
      nombre_completo: nombre_completo.trim(),
      nombre: nombre_completo.trim(),
      correo: correo.toLowerCase().trim(),
      password_hash: password,
      rol: rol || 'reportante',
      matricula_o_numero_empleado,
      departamento,
      telefono,
      especialidades: especialidades || [],
      cuenta_activa: true,
      activo: true,
    });

    res.status(201).json({
      exito: true,
      mensaje: `Usuario ${nuevoUsuario.nombre_completo} creado exitosamente.`,
      datos: {
        _id: nuevoUsuario._id,
        nombre_completo: nuevoUsuario.nombre_completo,
        correo: nuevoUsuario.correo,
        rol: nuevoUsuario.rol,
        departamento: nuevoUsuario.departamento,
      },
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al crear usuario.',
      error: error.message,
    });
  }
};

module.exports = {
  listarUsuarios,
  listarTecnicos,
  obtenerUsuario,
  actualizarUsuario,
  desactivarUsuario,
  crearUsuario,
};

