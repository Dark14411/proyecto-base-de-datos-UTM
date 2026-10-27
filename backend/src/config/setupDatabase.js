// ═══════════════════════════════════════════════════════════════
// config/setupDatabase.js
// Configura el validador $jsonSchema exacto (Figura 2) y los
// 3 índices obligatorios (Figura 3) en MongoDB Atlas.
// ═══════════════════════════════════════════════════════════════
require('dotenv').config();
const mongoose = require('mongoose');

const INCIDENCIAS_JSON_SCHEMA = {
  $jsonSchema: {
    bsonType: "object",
    required: [
      "codigo_incidencia", "titulo", "descripcion", "categoria",
      "prioridad", "estado", "horas_invertidas", "fecha_creacion",
      "reportante", "ubicacion", "detalle_especifico", "tags",
      "historial_seguimiento", "evidencias_adjuntas"
    ],
    properties: {
      codigo_incidencia: {
        bsonType: "string",
        pattern: "^INC-[0-9]{8}-(COM|INF|ACA)-[0-9]{3}$"
      },
      titulo: { bsonType: "string", minLength: 5, maxLength: 120 },
      descripcion: { bsonType: "string", minLength: 10 },
      categoria: { enum: ["computo_redes", "infraestructura", "academico"] },
      prioridad: { enum: ["baja", "media", "alta", "critica"] },
      estado: {
        enum: ["abierta", "en_proceso", "en_espera", "resuelta", "cerrada"]
      },
      horas_invertidas: { bsonType: ["int", "double", "long"], minimum: 0 },
      fecha_creacion: { bsonType: "date" },
      fecha_resolucion: { bsonType: "date" },
      tecnico_asignado: { bsonType: "string" },
      reportante: {
        bsonType: "object",
        required: ["nombre", "rol", "correo"],
        properties: {
          nombre: { bsonType: "string" },
          rol: { enum: ["Docente", "Estudiante", "Administrativo"] },
          correo: { bsonType: "string" }
        }
      },
      ubicacion: {
        bsonType: "object",
        required: ["edificio", "aula_espacio"],
        properties: {
          edificio: { bsonType: "string" },
          aula_espacio: { bsonType: "string" }
        }
      },
      tags: {
        bsonType: "array",
        uniqueItems: true,
        items: { bsonType: "string" }
      },
      historial_seguimiento: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["fecha", "autor", "estado_asignado", "comentario"],
          properties: {
            fecha: { bsonType: "date" },
            autor: { bsonType: "string" },
            estado_asignado: { bsonType: "string" },
            comentario: { bsonType: "string" }
          }
        }
      },
      evidencias_adjuntas: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: [
            "nombre_archivo", "tipo_mime", "peso_kb",
            "ruta_storage", "url_storage", "fecha_carga"
          ],
          properties: {
            nombre_archivo: { bsonType: "string" },
            tipo_mime: { bsonType: "string" },
            peso_kb: { bsonType: ["int", "double", "long"], minimum: 1 },
            ruta_storage: { bsonType: "string" },
            url_storage: { bsonType: "string" },
            fecha_carga: { bsonType: "date" }
          }
        }
      }
    },
    oneOf: [
      {
        properties: {
          categoria: { enum: ["computo_redes"] },
          detalle_especifico: {
            bsonType: "object",
            required: ["direccion_ip", "vlan", "puerto_uplink", "equipos_afectados"],
            additionalProperties: false,
            properties: {
              direccion_ip: { bsonType: "string" },
              vlan: { bsonType: "string" },
              puerto_uplink: { bsonType: "string" },
              equipos_afectados: { bsonType: ["int", "double", "long"], minimum: 0 }
            }
          }
        }
      },
      {
        properties: {
          categoria: { enum: ["infraestructura"] },
          detalle_especifico: {
            bsonType: "object",
            required: ["tipo_dano", "nivel_riesgo", "requiere_contratista", "insumos_requeridos"],
            additionalProperties: false,
            properties: {
              tipo_dano: { bsonType: "string" },
              nivel_riesgo: { enum: ["bajo", "medio", "alto"] },
              requiere_contratista: { bsonType: "bool" },
              insumos_requeridos: {
                bsonType: "array",
                items: { bsonType: "string" }
              }
            }
          }
        }
      },
      {
        properties: {
          categoria: { enum: ["academico"] },
          detalle_especifico: {
            bsonType: "object",
            required: ["plataforma", "codigo_curso", "periodo_escolar", "estudiantes_afectados"],
            additionalProperties: false,
            properties: {
              plataforma: { bsonType: "string" },
              codigo_curso: { bsonType: "string" },
              periodo_escolar: { bsonType: "string" },
              estudiantes_afectados: { bsonType: ["int", "double", "long"], minimum: 0 }
            }
          }
        }
      }
    ]
  }
};

const setupSchemaAndIndexes = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME,
    });
    const db = conn.connection.db;
    console.log(`📡 Conectado a MongoDB Atlas: ${process.env.DB_NAME}`);

    // 1. Verificar si la colección incidencias_campus existe
    const collections = await db.listCollections({ name: 'incidencias_campus' }).toArray();
    if (collections.length === 0) {
      console.log('🔨 Creando colección incidencias_campus con $jsonSchema estricto...');
      await db.createCollection('incidencias_campus', {
        validator: INCIDENCIAS_JSON_SCHEMA,
        validationLevel: 'strict',
        validationAction: 'error',
      });
      console.log('✅ Colección incidencias_campus creada con $jsonSchema');
    } else {
      console.log('🔄 Actualizando validador $jsonSchema en incidencias_campus...');
      await db.command({
        collMod: 'incidencias_campus',
        validator: INCIDENCIAS_JSON_SCHEMA,
        validationLevel: 'strict',
        validationAction: 'error',
      });
      console.log('✅ Validador $jsonSchema actualizado correctamente');
    }

    // 2. Crear los 3 índices obligatorios de la Figura 3
    const coll = db.collection('incidencias_campus');

    console.log('📐 Creando Índice 1: { categoria: 1, estado: 1, "ubicacion.edificio": 1 }...');
    await coll.createIndex(
      { categoria: 1, estado: 1, 'ubicacion.edificio': 1 },
      { name: 'idx_categoria_estado_edificio' }
    );

    console.log('📐 Creando Índice 2: { fecha_resolucion: 1 } (TTL 60 días = 5,184,000s)...');
    try {
      await coll.createIndex(
        { fecha_resolucion: 1 },
        { expireAfterSeconds: 5184000, name: 'idx_ttl_fecha_resolucion' }
      );
    } catch (e) {
      console.log('   ℹ️ Índice TTL ya existía o se conservó.');
    }

    console.log('📐 Creando Índice 3: Texto ponderado en español { titulo: 10, descripcion: 5 }...');
    try {
      await coll.createIndex(
        { titulo: 'text', descripcion: 'text' },
        {
          default_language: 'spanish',
          weights: { titulo: 10, descripcion: 5 },
          name: 'idx_texto_ponderado_es',
        }
      );
    } catch (e) {
      console.log('   ℹ️ Índice de texto ya existía.');
    }

    console.log('✨ Configuración de colección e índices en MongoDB Atlas completada con éxito.');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error configurando esquema e índices:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  setupSchemaAndIndexes();
}

module.exports = { setupSchemaAndIndexes, INCIDENCIAS_JSON_SCHEMA };
