// ═══════════════════════════════════════════════════════════════
// models/Edificio.js — Colección auxiliar: edificios_campus
// Catálogo de edificios y aulas para selectores de la interfaz
// ═══════════════════════════════════════════════════════════════
const mongoose = require('mongoose');
const { Schema } = mongoose;

const aulaSchema = new Schema(
  {
    nombre: { type: String, required: true },
    piso: { type: Number, default: 1 },
    tipo: {
      type: String,
      enum: ['aula', 'laboratorio', 'oficina', 'auditorio', 'area_comun', 'otro'],
      default: 'aula',
    },
    capacidad: Number,
    tiene_equipo_computo: { type: Boolean, default: false },
  },
  { _id: true }
);

const edificioSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del edificio es obligatorio'],
      unique: true,
      trim: true,
    },
    clave: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    pisos: { type: Number, default: 1 },
    descripcion: String,
    activo: { type: Boolean, default: true },

    // ─── Aulas / zonas dentro del edificio ────────────────────
    aulas: [aulaSchema],
  },
  {
    timestamps: true,
    collection: 'edificios_campus',
  }
);

// ─── Índice ───────────────────────────────────────────────────
edificioSchema.index({ activo: 1 }, { name: 'idx_edificio_activo' });

module.exports = mongoose.model('Edificio', edificioSchema);
