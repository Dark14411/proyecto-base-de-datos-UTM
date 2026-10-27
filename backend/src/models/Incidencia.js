// ═══════════════════════════════════════════════════════════════
// models/Incidencia.js — Colección principal: incidencias_campus
// Cumple al 100% con el validador $jsonSchema oficial (Figura 2)
// y los documentos canónicos (Figuras 4, 5 y 6) de la ERS.
// ═══════════════════════════════════════════════════════════════
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Subdocumento: Entrada en el historial de seguimiento (Figura 2)
const entradaHistorialSchema = new Schema(
  {
    fecha: { type: Date, default: Date.now, required: true },
    autor: { type: String, required: true },
    estado_asignado: { type: String, required: true },
    comentario: { type: String, required: true },
  },
  { _id: false }
);

// Subdocumento: Evidencia adjunta con metadatos (Figura 2)
const evidenciaAdjuntaSchema = new Schema(
  {
    nombre_archivo: { type: String, required: true },
    tipo_mime: { type: String, required: true },
    peso_kb: { type: Number, required: true, min: 1 },
    ruta_storage: { type: String, required: true },
    url_storage: { type: String, required: true },
    fecha_carga: { type: Date, default: Date.now, required: true },
  },
  { _id: false }
);

// Subdocumento: Reportante institucional (Figura 2)
const reportanteSchema = new Schema(
  {
    nombre: { type: String, required: true },
    rol: {
      type: String,
      required: true,
      enum: ['Docente', 'Estudiante', 'Administrativo'],
    },
    correo: { type: String, required: true },
  },
  { _id: false }
);

// Subdocumento: Ubicación estandarizada (Figura 2)
const ubicacionSchema = new Schema(
  {
    edificio: { type: String, required: true },
    aula_espacio: { type: String, required: true },
  },
  { _id: false }
);

// Esquema principal: incidencias_campus
const incidenciaSchema = new Schema(
  {
    codigo_incidencia: {
      type: String,
      required: true,
      unique: true,
      match: /^INC-[0-9]{8}-(COM|INF|ACA)-[0-9]{3}$/,
    },
    titulo: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 120,
    },
    descripcion: {
      type: String,
      required: true,
      minlength: 10,
    },
    categoria: {
      type: String,
      required: true,
      enum: ['computo_redes', 'infraestructura', 'academico'],
    },
    prioridad: {
      type: String,
      required: true,
      enum: ['baja', 'media', 'alta', 'critica'],
      default: 'media',
    },
    estado: {
      type: String,
      required: true,
      enum: ['abierta', 'en_proceso', 'en_espera', 'resuelta', 'cerrada'],
      default: 'abierta',
    },
    horas_invertidas: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    fecha_creacion: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // Opcionales: solo existen cuando aplican (no guardar como null)
    fecha_resolucion: {
      type: Date,
      required: false,
    },
    tecnico_asignado: {
      type: String,
      required: false,
    },
    reportante: {
      type: reportanteSchema,
      required: true,
    },
    ubicacion: {
      type: ubicacionSchema,
      required: true,
    },
    detalle_especifico: {
      type: Schema.Types.Mixed,
      required: true,
    },
    tags: {
      type: [String],
      required: true,
      default: [],
    },
    historial_seguimiento: {
      type: [entradaHistorialSchema],
      required: true,
      default: [],
    },
    evidencias_adjuntas: {
      type: [evidenciaAdjuntaSchema],
      required: true,
      default: [],
    },
  },
  {
    // MongoDB Atlas no usa timestamps automáticos de Mongoose para coincidir con el $jsonSchema exacto
    timestamps: false,
    collection: 'incidencias_campus',
    versionKey: false,
  }
);

// ─── Índices obligatorios de la ERS (Figura 3) ────────────────
// 1. Filtros y analítica por edificio (RF-06, RNF-04)
incidenciaSchema.index(
  { categoria: 1, estado: 1, 'ubicacion.edificio': 1 },
  { name: 'idx_categoria_estado_edificio' }
);

// 2. TTL: 60 días = 5 184 000 s desde fecha_resolucion (RF-07)
incidenciaSchema.index(
  { fecha_resolucion: 1 },
  { expireAfterSeconds: 5184000, name: 'idx_ttl_fecha_resolucion' }
);

// 3. Búsqueda de texto ponderada en español (RF-05)
incidenciaSchema.index(
  { titulo: 'text', descripcion: 'text' },
  {
    default_language: 'spanish',
    weights: { titulo: 10, descripcion: 5 },
    name: 'idx_texto_ponderado_es',
  }
);

module.exports = mongoose.model('Incidencia', incidenciaSchema);
