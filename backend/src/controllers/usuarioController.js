// ═══════════════════════════════════════════════════════════════
// controllers/usuarioController.js — Gestión de usuarios (usuarios_campus)
// Lee y escribe directamente en MongoDB Atlas
// ═══════════════════════════════════════════════════════════════
const Usuario = require('../models/Usuario');
const { serializarUsuario } = require('./authController');

const MAP_ROL_SISTEMA = {
  reportante: 'Reportante',
  tecnico: 'Tecnico',
  coordinador: 'Coordinador',
  directivo: 'Directivo',
  administrador: 'Administrador',
};

/**
 * GET /api/usuarios
 * Lista todos los usuarios desde la colección real usuarios_campus de MongoDB Atlas.
 */
const listarUsuarios = async (req, res) => {
  try {
    const { rol, rol_sistema, activo, busqueda, pagina = 1, limite = 100 } = req.query;
    const condiciones = [];

    const rolFiltro = (rol || rol_sistema || '').toLowerCase().trim();
    if (rolFiltro) {
      condiciones.push({
        $or: [
          { rol: rolFiltro },
          { rol_sistema: MAP_ROL_SISTEMA[rolFiltro] || rolFiltro },
        ],
      });
    }

    if (activo !== undefined && activo !== '') {
      const esActivo = activo === 'true' || activo === true;
      if (esActivo) {
        condiciones.push({ activo: { $ne: false }, cuenta_activa: { $ne: false } });
      } else {
        condiciones.push({ $or: [{ activo: false }, { cuenta_activa: false }] });
      }
    }

    if (busqueda && busqueda.trim()) {
      const q = busqueda.trim();
      condiciones.push({
        $or: [
          { nombre: { $regex: q, $options: 'i' } },
          { nombre_completo: { $regex: q, $options: 'i' } },
          { correo: { $regex: q, $options: 'i' } },
          { matricula_o_clave: { $regex: q, $options: 'i' } },
          { matricula_o_numero_empleado: { $regex: q, $options: 'i' } },
        ],
      });
    }

    const filtro = condiciones.length > 0 ? { $and: condiciones } : {};
    const skip = (parseInt(pagina) - 1) * parseInt(limite);

    const [usuariosDocs, total] = await Promise.all([
      Usuario.find(filtro)
        .sort({ fecha_alta: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limite)),
      Usuario.countDocuments(filtro),
    ]);

    const usuarios = usuariosDocs.map(serializarUsuario);

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
      mensaje: 'Error al listar usuarios de usuarios_campus.',
      error: error.message,
    });
  }
};

/**
 * GET /api/usuarios/tecnicos
 * Lista todos los técnicos activos de usuarios_campus (para el selector de asignación RF-09).
 */
const listarTecnicos = async (req, res) => {
  try {
    const { categoria } = req.query;
    const tecnicosDocs = await Usuario.find({
      $or: [{ rol: 'tecnico' }, { rol_sistema: 'Tecnico' }],
      activo: { $ne: false },
      cuenta_activa: { $ne: false },
    }).sort({ nombre: 1 });

    let tecnicos = tecnicosDocs.map(serializarUsuario);

    // Si se solicita filtrar o priorizar por especialidad (categoría de incidencia)
    if (categoria) {
      const conEspecialidad = tecnicos.filter((t) =>
        t.especialidades?.includes(categoria) ||
        t.perfil_operativo?.especialidades?.includes(categoria)
      );
      if (conEspecialidad.length > 0) {
        tecnicos = conEspecialidad;
      }
    }

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
    res.json({ exito: true, datos: serializarUsuario(usuario) });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener usuario.',
      error: error.message,
    });
  }
};

/**
 * POST /api/usuarios
 * Crea un nuevo usuario en la colección usuarios_campus de MongoDB Atlas.
 */
const crearUsuario = async (req, res) => {
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
      activo,
    } = req.body;

    const emailLimpio = (correo || '').toLowerCase().trim();
    if (!emailLimpio) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El correo electrónico es obligatorio.',
      });
    }

    const existente = await Usuario.findOne({ correo: emailLimpio });
    if (existente) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Ya existe un usuario registrado con ese correo institucional.',
      });
    }

    const nombreFinal = (nombre || nombre_completo || '').trim();
    const matFinal = (matricula_o_clave || matricula_o_numero_empleado || `EMP-${Date.now().toString().slice(-4)}`).trim();
    const rolMin = (rol || rol_sistema || 'reportante').toLowerCase();
    const rolSistemaFinal = MAP_ROL_SISTEMA[rolMin] || 'Reportante';
    const deptoFinal = (departamento || perfil_operativo?.departamento || 'Comunidad Universitaria').trim();
    const espFinal = Array.isArray(especialidades)
      ? especialidades
      : (Array.isArray(perfil_operativo?.especialidades) ? perfil_operativo.especialidades : []);
    const cargoFinal = (cargo || perfil_operativo?.cargo || rolSistemaFinal).trim();
    const estadoActivo = activo !== undefined ? Boolean(activo) : true;

    const nuevoUsuario = await Usuario.create({
      matricula_o_clave: matFinal,
      matricula_o_numero_empleado: matFinal,
      nombre: nombreFinal,
      nombre_completo: nombreFinal,
      correo: emailLimpio,
      password_hash: password || 'utm123',
      rol_sistema: rolSistemaFinal,
      rol: rolMin,
      departamento: deptoFinal,
      telefono: telefono ? String(telefono).trim() : undefined,
      especialidades: espFinal,
      perfil_operativo: {
        departamento: deptoFinal,
        especialidades: espFinal,
        cargo: cargoFinal,
      },
      cuenta_activa: estadoActivo,
      activo: estadoActivo,
      fecha_alta: new Date(),
      ultimo_acceso: new Date(),
    });

    res.status(201).json({
      exito: true,
      mensaje: `Usuario ${nuevoUsuario.nombre} guardado en usuarios_campus de MongoDB Atlas.`,
      datos: serializarUsuario(nuevoUsuario),
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({
      exito: false,
      mensaje: error.message || 'Error al crear usuario en la base de datos.',
      error: error.message,
    });
  }
};

/**
 * PUT /api/usuarios/:id y PATCH /api/usuarios/:id
 * Actualiza un usuario directamente en usuarios_campus de MongoDB Atlas.
 */
const actualizarUsuario = async (req, res) => {
  try {
    const {
      nombre_completo,
      nombre,
      correo,
      rol,
      rol_sistema,
      matricula_o_clave,
      matricula_o_numero_empleado,
      departamento,
      telefono,
      especialidades,
      cargo,
      perfil_operativo,
      cuenta_activa,
      activo,
      password,
    } = req.body;

    const usuario = await Usuario.findById(req.params.id).select('+password_hash');
    if (!usuario) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Usuario no encontrado en usuarios_campus.',
      });
    }

    if (correo && correo.toLowerCase().trim() !== usuario.correo) {
      const correoNuevo = correo.toLowerCase().trim();
      const duplicado = await Usuario.findOne({ correo: correoNuevo, _id: { $ne: usuario._id } });
      if (duplicado) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Ese correo ya está asignado a otro usuario.',
        });
      }
      usuario.correo = correoNuevo;
    }

    const nuevoNombre = (nombre !== undefined ? nombre : nombre_completo);
    if (nuevoNombre !== undefined && String(nuevoNombre).trim()) {
      usuario.nombre = String(nuevoNombre).trim();
      usuario.nombre_completo = String(nuevoNombre).trim();
    }

    const nuevoRol = (rol || rol_sistema || '').toLowerCase().trim();
    if (nuevoRol && MAP_ROL_SISTEMA[nuevoRol]) {
      usuario.rol = nuevoRol;
      usuario.rol_sistema = MAP_ROL_SISTEMA[nuevoRol];
    }

    const nuevaMat = matricula_o_clave !== undefined ? matricula_o_clave : matricula_o_numero_empleado;
    if (nuevaMat !== undefined) {
      usuario.matricula_o_clave = String(nuevaMat).trim();
      usuario.matricula_o_numero_empleado = String(nuevaMat).trim();
    }

    if (telefono !== undefined) {
      usuario.telefono = String(telefono).trim();
    }

    const depto = departamento !== undefined ? departamento : perfil_operativo?.departamento;
    const esp = especialidades !== undefined ? especialidades : perfil_operativo?.especialidades;
    const nuevoCargo = cargo !== undefined ? cargo : perfil_operativo?.cargo;

    const deptoFinal = depto !== undefined ? String(depto).trim() : (usuario.perfil_operativo?.departamento || usuario.departamento || 'Comunidad Universitaria');
    const espFinal = Array.isArray(esp) ? esp : (usuario.perfil_operativo?.especialidades || usuario.especialidades || []);
    const cargoFinal = nuevoCargo !== undefined ? String(nuevoCargo).trim() : (usuario.perfil_operativo?.cargo || usuario.rol_sistema || 'General');

    usuario.departamento = deptoFinal;
    usuario.especialidades = espFinal;
    usuario.perfil_operativo = {
      departamento: deptoFinal,
      especialidades: espFinal,
      cargo: cargoFinal,
    };

    if (activo !== undefined) {
      usuario.activo = Boolean(activo);
      usuario.cuenta_activa = Boolean(activo);
    } else if (cuenta_activa !== undefined) {
      usuario.cuenta_activa = Boolean(cuenta_activa);
      usuario.activo = Boolean(cuenta_activa);
    }

    if (password && String(password).trim().length >= 6) {
      usuario.password_hash = String(password).trim();
    }

    await usuario.save();

    res.json({
      exito: true,
      mensaje: `Usuario ${usuario.nombre} actualizado exitosamente en MongoDB Atlas.`,
      datos: serializarUsuario(usuario),
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
 * Desactiva la cuenta (soft delete).
 */
const desactivarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Usuario no encontrado.',
      });
    }

    usuario.cuenta_activa = false;
    usuario.activo = false;
    await usuario.save();

    res.json({
      exito: true,
      mensaje: `Cuenta de ${usuario.nombre || usuario.nombre_completo} desactivada.`,
      datos: serializarUsuario(usuario),
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al desactivar usuario.',
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
