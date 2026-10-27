// ═══════════════════════════════════════════════════════════════
// models/Usuario.js — Colección auxiliar: usuarios_campus
// Autenticación, roles RBAC y Extended Reference Pattern
// Compatible con Figura 7 de la ERS
// ═══════════════════════════════════════════════════════════════
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;

const usuarioSchema = new Schema(
  {
    nombre_completo: {
      type: String,
      required: [true, 'El nombre completo es obligatorio'],
      trim: true,
    },
    nombre: {
      type: String,
      trim: true,
    },
    correo: {
      type: String,
      required: [true, 'El correo es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Formato de correo inválido'],
    },
    password_hash: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: 6,
      select: false,
    },
    rol: {
      type: String,
      required: true,
      enum: [
        'reportante',
        'tecnico',
        'coordinador',
        'directivo',
        'administrador',
      ],
      default: 'reportante',
    },
    rol_sistema: {
      type: String,
      enum: ['Reportante', 'Tecnico', 'Coordinador', 'Directivo', 'Administrador', 'Admin'],
    },
    matricula_o_clave: {
      type: String,
      trim: true,
    },
    matricula_o_numero_empleado: {
      type: String,
      sparse: true,
      trim: true,
    },
    departamento: String,
    telefono: String,

    // ─── Campos específicos para técnicos ─────────────────────
    especialidades: [
      {
        type: String,
        enum: [
          'computo_redes',
          'infraestructura',
          'academico',
          'sistemas_academicos',
        ],
      },
    ],

    perfil_operativo: {
      departamento: String,
      especialidades: [String],
      cargo: String,
    },

    // ─── Estado de la cuenta ──────────────────────────────────
    cuenta_activa: { type: Boolean, default: true },
    activo: { type: Boolean, default: true },
    fecha_alta: { type: Date, default: Date.now },
    ultimo_acceso: Date,
  },
  {
    timestamps: true,
    collection: 'usuarios_campus',
  }
);

// ─── Índices ──────────────────────────────────────────────────
usuarioSchema.index({ rol: 1, cuenta_activa: 1 }, { name: 'idx_rol_activo' });

// ─── Middleware: Encriptar contraseña antes de guardar ────────
usuarioSchema.pre('save', async function (next) {
  if (!this.nombre && this.nombre_completo) {
    this.nombre = this.nombre_completo;
  }
  if (!this.nombre_completo && this.nombre) {
    this.nombre_completo = this.nombre;
  }
  if (!this.isModified('password_hash')) return next();
  // Solo hashear si no es ya un hash bcrypt ($2b$ o $2a$)
  if (!this.password_hash.startsWith('$2')) {
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
  }
  next();
});

// ─── Método: Comparar contraseña en login ────────────────────
usuarioSchema.methods.compararPassword = async function (passwordPlano) {
  return bcrypt.compare(passwordPlano, this.password_hash);
};

// ─── Método: Devolver datos para Extended Reference Pattern ──
usuarioSchema.methods.datosReferencia = function () {
  return {
    _id: this._id,
    nombre_completo: this.nombre_completo || this.nombre,
    nombre: this.nombre || this.nombre_completo,
    correo: this.correo,
    rol: this.rol === 'reportante' ? 'Docente' : (this.rol.charAt(0).toUpperCase() + this.rol.slice(1)),
    especialidad: this.especialidades?.[0] || null,
  };
};

module.exports = mongoose.model('Usuario', usuarioSchema);
