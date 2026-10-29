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
    matricula_o_clave: {
      type: String,
      trim: true,
      default: function () {
        return this.matricula_o_numero_empleado || `EMP-${Date.now().toString().slice(-4)}`;
      },
    },
    matricula_o_numero_empleado: {
      type: String,
      sparse: true,
      trim: true,
    },
    nombre: {
      type: String,
      trim: true,
      required: [true, 'El nombre es obligatorio'],
    },
    nombre_completo: {
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
    rol_sistema: {
      type: String,
      enum: ['Reportante', 'Tecnico', 'Coordinador', 'Directivo', 'Administrador'],
      default: 'Reportante',
    },
    rol: {
      type: String,
      enum: [
        'reportante',
        'tecnico',
        'coordinador',
        'directivo',
        'administrador',
      ],
      default: 'reportante',
    },
    activo: { type: Boolean, default: true },
    cuenta_activa: { type: Boolean, default: true },

    perfil_operativo: {
      departamento: { type: String, default: 'Comunidad Universitaria' },
      especialidades: { type: [String], default: [] },
      cargo: { type: String, default: 'General' },
    },

    departamento: String,
    telefono: String,
    especialidades: [String],

    fecha_alta: { type: Date, default: Date.now },
    ultimo_acceso: Date,
  },
  {
    timestamps: true,
    collection: 'usuarios_campus',
  }
);

// ─── Índices ──────────────────────────────────────────────────
usuarioSchema.index({ rol: 1, activo: 1 }, { name: 'idx_rol_activo' });
usuarioSchema.index({ rol_sistema: 1, activo: 1 }, { name: 'idx_rol_sistema_activo' });

// ─── Middleware: Encriptar contraseña y sincronizar campos ────
usuarioSchema.pre('save', async function (next) {
  // Sincronizar nombres
  if (!this.nombre && this.nombre_completo) {
    this.nombre = this.nombre_completo;
  }
  if (!this.nombre_completo && this.nombre) {
    this.nombre_completo = this.nombre;
  }

  // Sincronizar identificador/matrícula
  if (!this.matricula_o_clave && this.matricula_o_numero_empleado) {
    this.matricula_o_clave = this.matricula_o_numero_empleado;
  }
  if (!this.matricula_o_numero_empleado && this.matricula_o_clave) {
    this.matricula_o_numero_empleado = this.matricula_o_clave;
  }

  // Sincronizar roles (rol_sistema <-> rol)
  const mapRolToSistema = {
    reportante: 'Reportante',
    tecnico: 'Tecnico',
    coordinador: 'Coordinador',
    directivo: 'Directivo',
    administrador: 'Administrador',
    admin: 'Administrador',
  };
  const mapSistemaToRol = {
    Reportante: 'reportante',
    Tecnico: 'tecnico',
    Coordinador: 'coordinador',
    Directivo: 'directivo',
    Administrador: 'administrador',
    Admin: 'administrador',
  };

  if (this.rol_sistema && !this.rol) {
    this.rol = mapSistemaToRol[this.rol_sistema] || 'reportante';
  } else if (this.rol && !this.rol_sistema) {
    this.rol_sistema = mapRolToSistema[this.rol.toLowerCase()] || 'Reportante';
  } else if (this.rol && this.rol_sistema) {
    this.rol = this.rol.toLowerCase();
    this.rol_sistema = mapRolToSistema[this.rol] || this.rol_sistema;
  }

  // Sincronizar activo <-> cuenta_activa
  if (this.activo !== undefined && this.cuenta_activa === undefined) {
    this.cuenta_activa = this.activo;
  } else if (this.cuenta_activa !== undefined && this.activo === undefined) {
    this.activo = this.cuenta_activa;
  } else if (this.activo !== undefined && this.cuenta_activa !== undefined) {
    this.cuenta_activa = this.activo;
  }

  // Sincronizar perfil_operativo
  const depto = this.departamento || this.perfil_operativo?.departamento || 'Comunidad Universitaria';
  const esp = (this.especialidades && this.especialidades.length > 0)
    ? this.especialidades
    : (this.perfil_operativo?.especialidades || []);
  const cargo = this.perfil_operativo?.cargo || this.rol_sistema || 'General';

  this.perfil_operativo = {
    departamento: depto,
    especialidades: esp,
    cargo,
  };
  this.departamento = depto;
  this.especialidades = esp;

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
