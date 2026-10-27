// ═══════════════════════════════════════════════════════════════
// controllers/edificioController.js — Catálogo de edificios
// ═══════════════════════════════════════════════════════════════
const Edificio = require('../models/Edificio');

/**
 * GET /api/edificios
 * Lista todos los edificios activos (para selectores del frontend).
 */
const listarEdificios = async (req, res) => {
  try {
    const edificios = await Edificio.find({ activo: true }).sort({ nombre: 1 });
    res.json({ exito: true, datos: edificios });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al listar edificios.',
      error: error.message,
    });
  }
};

/**
 * GET /api/edificios/:id
 */
const obtenerEdificio = async (req, res) => {
  try {
    const edificio = await Edificio.findById(req.params.id);
    if (!edificio) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Edificio no encontrado.',
      });
    }
    res.json({ exito: true, datos: edificio });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener edificio.',
      error: error.message,
    });
  }
};

/**
 * POST /api/edificios
 * Crear un nuevo edificio. Solo administrador.
 */
const crearEdificio = async (req, res) => {
  try {
    const edificio = await Edificio.create(req.body);
    res.status(201).json({
      exito: true,
      mensaje: 'Edificio creado.',
      datos: edificio,
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al crear edificio.',
      error: error.message,
    });
  }
};

/**
 * PUT /api/edificios/:id
 * Actualizar edificio. Solo administrador.
 */
const actualizarEdificio = async (req, res) => {
  try {
    const edificio = await Edificio.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!edificio) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Edificio no encontrado.',
      });
    }

    res.json({
      exito: true,
      mensaje: 'Edificio actualizado.',
      datos: edificio,
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al actualizar edificio.',
      error: error.message,
    });
  }
};

module.exports = {
  listarEdificios,
  obtenerEdificio,
  crearEdificio,
  actualizarEdificio,
};
