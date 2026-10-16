/**
 * ============================================================================
 * SETUP_DB.JS — Script Maestro de MongoDB
 * UTM Desk NoSQL Cloud: Sistema Integral de Gestión de Incidencias en el Campus
 * ============================================================================
 *
 * Ejecutar con: node setup_db.js
 *
 * Este script:
 *   1. Crea (o recrea) la colección `incidencias_campus` con validador $jsonSchema
 *      polimórfico estricto por categoría.
 *   2. Crea 3 índices obligatorios: compuesto, TTL y full-text en español.
 *   3. Inserta 25 documentos seed sintéticos balanceados.
 * ============================================================================
 */

const path = require("path");
let dotenv;
try {
  dotenv = require("dotenv");
} catch (e) {
  dotenv = require("./backend/node_modules/dotenv");
}
dotenv.config({ path: path.resolve(__dirname, "backend/.env") });
dotenv.config();

let MongoClient;
try {
  MongoClient = require("mongodb").MongoClient;
} catch (e) {
  MongoClient = require("./backend/node_modules/mongodb").MongoClient;
}

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "utm_desk_nosql";
const COLLECTION = "incidencias_campus";

// ─── Validador $jsonSchema con polimorfismo estricto ────────────────────────

const jsonSchemaValidator = {
  $jsonSchema: {
    bsonType: "object",
    required: [
      "codigo_incidencia",
      "titulo",
      "descripcion",
      "categoria",
      "prioridad",
      "estado",
      "horas_invertidas",
      "fecha_creacion",
      "reportante",
      "ubicacion",
      "tags",
      "historial_seguimiento",
      "evidencias_adjuntas",
      "detalle_especifico",
    ],
    properties: {
      codigo_incidencia: {
        bsonType: "string",
        description: "Folio único generado con Redis INCR (ej. INC-2026-0042)",
      },
      titulo: {
        bsonType: "string",
        minLength: 5,
        description: "Título descriptivo de la incidencia",
      },
      descripcion: {
        bsonType: "string",
        minLength: 10,
        description: "Descripción detallada del problema",
      },
      categoria: {
        bsonType: "string",
        enum: ["computo_redes", "infraestructura", "academico"],
        description: "Categoría de la incidencia",
      },
      prioridad: {
        bsonType: "string",
        enum: ["baja", "media", "alta", "critica"],
        description: "Nivel de prioridad",
      },
      estado: {
        bsonType: "string",
        enum: ["abierta", "en proceso", "en espera", "resuelta", "cerrada"],
        description: "Estado actual de la incidencia",
      },
      horas_invertidas: {
        bsonType: "number",
        minimum: 0,
        description: "Horas totales invertidas en la resolución",
      },
      fecha_creacion: {
        bsonType: "date",
        description: "Fecha y hora de creación",
      },
      fecha_resolucion: {
        bsonType: "date",
        description:
          "Fecha de resolución (solo presente si estado es resuelta o cerrada)",
      },
      reportante: {
        bsonType: "object",
        required: ["nombre", "rol", "correo"],
        properties: {
          nombre: { bsonType: "string" },
          rol: { bsonType: "string" },
          correo: { bsonType: "string" },
        },
      },
      ubicacion: {
        bsonType: "object",
        required: ["edificio", "aula_espacio"],
        properties: {
          edificio: { bsonType: "string" },
          aula_espacio: { bsonType: "string" },
        },
      },
      tags: {
        bsonType: "array",
        items: { bsonType: "string" },
        description: "Etiquetas categorizadoras",
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
            comentario: { bsonType: "string" },
            horas_agregadas: { bsonType: "number" },
          },
        },
      },
      evidencias_adjuntas: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: [
            "nombre_archivo",
            "tipo_mime",
            "peso_kb",
            "url_storage",
            "fecha_carga",
          ],
          properties: {
            nombre_archivo: { bsonType: "string" },
            tipo_mime: { bsonType: "string" },
            peso_kb: { bsonType: "number" },
            url_storage: { bsonType: "string" },
            fecha_carga: { bsonType: "date" },
          },
        },
      },
      detalle_especifico: {
        bsonType: "object",
        description: "Subdocumento polimórfico según categoría",
      },
    },
    // ── Polimorfismo estricto con oneOf ──
    oneOf: [
      {
        // Categoría: computo_redes
        properties: {
          categoria: { enum: ["computo_redes"] },
          detalle_especifico: {
            bsonType: "object",
            required: [
              "direccion_ip",
              "vlan",
              "puerto_uplink",
              "equipos_afectados",
            ],
            properties: {
              direccion_ip: { bsonType: "string" },
              vlan: { bsonType: "string" },
              puerto_uplink: { bsonType: "string" },
              equipos_afectados: { bsonType: "int" },
            },
            additionalProperties: false,
          },
        },
      },
      {
        // Categoría: infraestructura
        properties: {
          categoria: { enum: ["infraestructura"] },
          detalle_especifico: {
            bsonType: "object",
            required: [
              "tipo_dano",
              "riesgo_seguridad",
              "insumos_requeridos",
              "requiere_contratista",
            ],
            properties: {
              tipo_dano: { bsonType: "string" },
              riesgo_seguridad: { bsonType: "string" },
              insumos_requeridos: {
                bsonType: "array",
                items: { bsonType: "string" },
              },
              requiere_contratista: { bsonType: "bool" },
            },
            additionalProperties: false,
          },
        },
      },
      {
        // Categoría: academico
        properties: {
          categoria: { enum: ["academico"] },
          detalle_especifico: {
            bsonType: "object",
            required: [
              "plataforma",
              "codigo_curso",
              "periodo_escolar",
              "estudiantes_impactados",
            ],
            properties: {
              plataforma: { bsonType: "string" },
              codigo_curso: { bsonType: "string" },
              periodo_escolar: { bsonType: "string" },
              estudiantes_impactados: { bsonType: "int" },
            },
            additionalProperties: false,
          },
        },
      },
    ],
  },
};

// ─── Datos Seed (25 documentos) ─────────────────────────────────────────────

function generarSeedData() {
  const ahora = new Date();
  const hace = (dias) => new Date(ahora.getTime() - dias * 86400000);

  const docs = [
    // ══════════════════════════════════════════════════════════════════
    // CATEGORÍA: computo_redes (9 documentos)
    // ══════════════════════════════════════════════════════════════════
    {
      codigo_incidencia: "INC-2026-0001",
      titulo: "Fallo crítico en switch core del Edificio A",
      descripcion:
        "El switch de distribución principal del piso 2 presenta reinicios intermitentes causando pérdida de conectividad en 15 aulas simultáneamente durante horario de clases.",
      categoria: "computo_redes",
      prioridad: "critica",
      estado: "resuelta",
      horas_invertidas: 12,
      fecha_creacion: hace(30),
      fecha_resolucion: hace(28),
      reportante: {
        nombre: "Ing. Roberto Méndez Castillo",
        rol: "Coordinador de TI",
        correo: "roberto.mendez@utm.mx",
      },
      ubicacion: { edificio: "Edificio A", aula_espacio: "Cuarto de Telecomunicaciones P2" },
      tags: ["red", "switch", "conectividad", "urgente"],
      historial_seguimiento: [
        { fecha: hace(30), autor: "Sistema", estado_asignado: "abierta", comentario: "Incidencia registrada automáticamente." },
        { fecha: hace(29), autor: "Ing. Roberto Méndez Castillo", estado_asignado: "en proceso", comentario: "Se identificó firmware corrupto en el switch Cisco 3850. Iniciando procedimiento de recuperación.", horas_agregadas: 4 },
        { fecha: hace(28), autor: "Ing. Roberto Méndez Castillo", estado_asignado: "resuelta", comentario: "Firmware actualizado a versión estable. Conectividad restaurada en todas las aulas.", horas_agregadas: 8 },
      ],
      evidencias_adjuntas: [
        { nombre_archivo: "log_switch_core.txt", tipo_mime: "text/plain", peso_kb: 245, url_storage: "https://storage.example.com/evidencias/log_switch_core.txt", fecha_carga: hace(30) },
        { nombre_archivo: "captura_errores.png", tipo_mime: "image/png", peso_kb: 1200, url_storage: "https://storage.example.com/evidencias/captura_errores.png", fecha_carga: hace(29) },
      ],
      detalle_especifico: {
        direccion_ip: "10.0.1.1",
        vlan: "VLAN-100",
        puerto_uplink: "GigabitEthernet1/0/1",
        equipos_afectados: 15,
      },
    },
    {
      codigo_incidencia: "INC-2026-0002",
      titulo: "Punto de acceso WiFi sin funcionar en Biblioteca",
      descripcion:
        "El access point Ubiquiti del segundo piso de la Biblioteca Central no emite señal WiFi desde hace 3 días. Los estudiantes no pueden conectarse al servicio inalámbrico.",
      categoria: "computo_redes",
      prioridad: "alta",
      estado: "en proceso",
      horas_invertidas: 3,
      fecha_creacion: hace(5),
      reportante: {
        nombre: "Lic. Ana Gabriela Torres Ruiz",
        rol: "Bibliotecaria",
        correo: "ana.torres@utm.mx",
      },
      ubicacion: { edificio: "Biblioteca", aula_espacio: "Piso 2 - Sala de Lectura" },
      tags: ["wifi", "access-point", "biblioteca"],
      historial_seguimiento: [
        { fecha: hace(5), autor: "Sistema", estado_asignado: "abierta", comentario: "Incidencia registrada automáticamente." },
        { fecha: hace(4), autor: "Tec. Luis Ramírez", estado_asignado: "en proceso", comentario: "Se verificó que el PoE del puerto asignado no entrega voltaje suficiente. Solicitando inyector de repuesto.", horas_agregadas: 3 },
      ],
      evidencias_adjuntas: [
        { nombre_archivo: "foto_ap_ubiquiti.jpg", tipo_mime: "image/jpeg", peso_kb: 890, url_storage: "https://storage.example.com/evidencias/foto_ap_ubiquiti.jpg", fecha_carga: hace(5) },
      ],
      detalle_especifico: {
        direccion_ip: "10.0.5.22",
        vlan: "VLAN-200",
        puerto_uplink: "FastEthernet0/12",
        equipos_afectados: 1,
      },
    },
    {
      codigo_incidencia: "INC-2026-0003",
      titulo: "Servidor de impresión caído en Edificio B",
      descripcion:
        "El servicio de impresión en red del laboratorio 3 del Edificio B dejó de responder. Las 20 computadoras del laboratorio no pueden enviar trabajos de impresión.",
      categoria: "computo_redes",
      prioridad: "media",
      estado: "resuelta",
      horas_invertidas: 5,
      fecha_creacion: hace(20),
      fecha_resolucion: hace(18),
      reportante: {
        nombre: "Dr. Carlos Fuentes López",
        rol: "Profesor Titular",
        correo: "carlos.fuentes@utm.mx",
      },
      ubicacion: { edificio: "Edificio B", aula_espacio: "Laboratorio 3" },
      tags: ["impresora", "servidor", "laboratorio"],
      historial_seguimiento: [
        { fecha: hace(20), autor: "Sistema", estado_asignado: "abierta", comentario: "Incidencia registrada automáticamente." },
        { fecha: hace(19), autor: "Tec. María García", estado_asignado: "en proceso", comentario: "Servicio de cola de impresión detenido. Reiniciando servicio.", horas_agregadas: 2 },
        { fecha: hace(18), autor: "Tec. María García", estado_asignado: "resuelta", comentario: "Servicio de impresión restaurado. Se configuró reinicio automático.", horas_agregadas: 3 },
      ],
      evidencias_adjuntas: [
        { nombre_archivo: "error_spooler.png", tipo_mime: "image/png", peso_kb: 340, url_storage: "https://storage.example.com/evidencias/error_spooler.png", fecha_carga: hace(20) },
      ],
      detalle_especifico: {
        direccion_ip: "10.0.2.50",
        vlan: "VLAN-150",
        puerto_uplink: "GigabitEthernet0/2",
        equipos_afectados: 20,
      },
    },
    {
      codigo_incidencia: "INC-2026-0004",
      titulo: "Firewall bloqueando tráfico legítimo hacia plataforma Moodle",
      descripcion:
        "Desde las redes del Edificio K, el acceso a Moodle institucional es extremadamente lento. Se detectaron reglas de firewall que están descartando paquetes válidos hacia el puerto 443 del servidor Moodle.",
      categoria: "computo_redes",
      prioridad: "alta",
      estado: "cerrada",
      horas_invertidas: 8,
      fecha_creacion: hace(45),
      fecha_resolucion: hace(43),
      reportante: {
        nombre: "Ing. Patricia Domínguez Soto",
        rol: "Jefa de Redes",
        correo: "patricia.dominguez@utm.mx",
      },
      ubicacion: { edificio: "Edificio K", aula_espacio: "Centro de Datos" },
      tags: ["firewall", "moodle", "seguridad", "red"],
      historial_seguimiento: [
        { fecha: hace(45), autor: "Sistema", estado_asignado: "abierta", comentario: "Incidencia registrada automáticamente." },
        { fecha: hace(44), autor: "Ing. Patricia Domínguez Soto", estado_asignado: "en proceso", comentario: "Identificadas reglas ACL conflictivas en FortiGate. Preparando reglas corregidas.", horas_agregadas: 3 },
        { fecha: hace(43), autor: "Ing. Patricia Domínguez Soto", estado_asignado: "resuelta", comentario: "Reglas ACL corregidas. Tráfico hacia Moodle normalizado.", horas_agregadas: 5 },
        { fecha: hace(40), autor: "Ing. Roberto Méndez Castillo", estado_asignado: "cerrada", comentario: "Verificado funcionamiento estable durante 3 días. Cerrando incidencia." },
      ],
      evidencias_adjuntas: [
        { nombre_archivo: "acl_before.txt", tipo_mime: "text/plain", peso_kb: 15, url_storage: "https://storage.example.com/evidencias/acl_before.txt", fecha_carga: hace(44) },
        { nombre_archivo: "acl_after.txt", tipo_mime: "text/plain", peso_kb: 18, url_storage: "https://storage.example.com/evidencias/acl_after.txt", fecha_carga: hace(43) },
      ],
      detalle_especifico: {
        direccion_ip: "10.0.10.1",
        vlan: "VLAN-500",
        puerto_uplink: "TenGigabitEthernet1/0/1",
        equipos_afectados: 120,
      },
    },
    {
      codigo_incidencia: "INC-2026-0005",
      titulo: "DHCP agotado en VLAN de estudiantes Edificio A",
      descripcion:
        "El pool DHCP de la VLAN de estudiantes se ha agotado completamente. Los nuevos dispositivos no obtienen dirección IP y no pueden conectarse a la red del campus.",
      categoria: "computo_redes",
      prioridad: "critica",
      estado: "resuelta",
      horas_invertidas: 4,
      fecha_creacion: hace(15),
      fecha_resolucion: hace(14),
      reportante: {
        nombre: "Tec. Luis Ramírez Ortega",
        rol: "Soporte Técnico",
        correo: "luis.ramirez@utm.mx",
      },
      ubicacion: { edificio: "Edificio A", aula_espacio: "Aula Magna" },
      tags: ["dhcp", "red", "vlan", "critico"],
      historial_seguimiento: [
        { fecha: hace(15), autor: "Sistema", estado_asignado: "abierta", comentario: "Incidencia registrada automáticamente." },
        { fecha: hace(14), autor: "Tec. Luis Ramírez Ortega", estado_asignado: "resuelta", comentario: "Se amplió el rango DHCP de /24 a /22 y se redujo el lease time de 8h a 2h.", horas_agregadas: 4 },
      ],
      evidencias_adjuntas: [
        { nombre_archivo: "dhcp_pool_stats.csv", tipo_mime: "text/csv", peso_kb: 56, url_storage: "https://storage.example.com/evidencias/dhcp_pool_stats.csv", fecha_carga: hace(15) },
      ],
      detalle_especifico: {
        direccion_ip: "10.0.1.254",
        vlan: "VLAN-300",
        puerto_uplink: "GigabitEthernet1/0/48",
        equipos_afectados: 250,
      },
    },
    {
      codigo_incidencia: "INC-2026-0006",
      titulo: "Equipo de cómputo sin arrancar en laboratorio de cómputo",
      descripcion:
        "5 equipos de escritorio Dell OptiPlex del laboratorio 1 no encienden. Se sospecha falla en la fuente de alimentación tras corte eléctrico la semana pasada.",
      categoria: "computo_redes",
      prioridad: "media",
      estado: "en espera",
      horas_invertidas: 2,
      fecha_creacion: hace(7),
      reportante: {
        nombre: "Mtro. Fernando Salazar Díaz",
        rol: "Responsable de Laboratorio",
        correo: "fernando.salazar@utm.mx",
      },
      ubicacion: { edificio: "Edificio B", aula_espacio: "Laboratorio 1" },
      tags: ["hardware", "fuente-poder", "laboratorio"],
      historial_seguimiento: [
        { fecha: hace(7), autor: "Sistema", estado_asignado: "abierta", comentario: "Incidencia registrada automáticamente." },
        { fecha: hace(6), autor: "Tec. María García", estado_asignado: "en proceso", comentario: "Se confirmó falla en fuentes de poder. Solicitando 5 fuentes de reemplazo.", horas_agregadas: 2 },
        { fecha: hace(5), autor: "Tec. María García", estado_asignado: "en espera", comentario: "En espera de autorización de compra por parte de adquisiciones." },
      ],
      evidencias_adjuntas: [
        { nombre_archivo: "diagnostico_equipos.pdf", tipo_mime: "application/pdf", peso_kb: 1500, url_storage: "https://storage.example.com/evidencias/diagnostico_equipos.pdf", fecha_carga: hace(7) },
        { nombre_archivo: "cotizacion_fuentes.pdf", tipo_mime: "application/pdf", peso_kb: 420, url_storage: "https://storage.example.com/evidencias/cotizacion_fuentes.pdf", fecha_carga: hace(6) },
      ],
      detalle_especifico: {
        direccion_ip: "10.0.2.100",
        vlan: "VLAN-150",
        puerto_uplink: "FastEthernet0/24",
        equipos_afectados: 5,
      },
    },
    {
      codigo_incidencia: "INC-2026-0007",
      titulo: "Cableado de red dañado en pasillo del Edificio K",
      descripcion:
        "Se detectaron cables de red UTP categoría 6 expuestos y dañados en el pasillo principal del primer piso del Edificio K tras obras de remodelación.",
      categoria: "computo_redes",
      prioridad: "baja",
      estado: "abierta",
      horas_invertidas: 0,
      fecha_creacion: hace(2),
      reportante: {
        nombre: "Arq. Sofía Villanueva Pérez",
        rol: "Coordinadora de Infraestructura",
        correo: "sofia.villanueva@utm.mx",
      },
      ubicacion: { edificio: "Edificio K", aula_espacio: "Pasillo Piso 1" },
      tags: ["cableado", "infraestructura-red"],
      historial_seguimiento: [
        { fecha: hace(2), autor: "Sistema", estado_asignado: "abierta", comentario: "Incidencia registrada automáticamente." },
      ],
      evidencias_adjuntas: [
        { nombre_archivo: "cables_danados.jpg", tipo_mime: "image/jpeg", peso_kb: 2100, url_storage: "https://storage.example.com/evidencias/cables_danados.jpg", fecha_carga: hace(2) },
      ],
      detalle_especifico: {
        direccion_ip: "N/A",
        vlan: "VLAN-100",
        puerto_uplink: "Panel-Patcheo-1A",
        equipos_afectados: 8,
      },
    },
    {
      codigo_incidencia: "INC-2026-0008",
      titulo: "VPN institucional desconectándose intermitentemente",
      descripcion:
        "La conexión VPN para acceso remoto de profesores se desconecta cada 15-20 minutos. Se requiere reconexión manual cada vez, afectando el teletrabajo docente.",
      categoria: "computo_redes",
      prioridad: "alta",
      estado: "cerrada",
      horas_invertidas: 10,
      fecha_creacion: hace(35),
      fecha_resolucion: hace(32),
      reportante: {
        nombre: "Dra. Elena Ríos Martínez",
        rol: "Directora Académica",
        correo: "elena.rios@utm.mx",
      },
      ubicacion: { edificio: "Edificio A", aula_espacio: "Oficina de Dirección Académica" },
      tags: ["vpn", "acceso-remoto", "teletrabajo"],
      historial_seguimiento: [
        { fecha: hace(35), autor: "Sistema", estado_asignado: "abierta", comentario: "Incidencia registrada automáticamente." },
        { fecha: hace(34), autor: "Ing. Patricia Domínguez Soto", estado_asignado: "en proceso", comentario: "Problema identificado en la configuración de timeout del concentrador VPN. Ajustando parámetros.", horas_agregadas: 5 },
        { fecha: hace(32), autor: "Ing. Patricia Domínguez Soto", estado_asignado: "resuelta", comentario: "Timeout de sesión VPN incrementado. Dead peer detection ajustado.", horas_agregadas: 5 },
        { fecha: hace(30), autor: "Dra. Elena Ríos Martínez", estado_asignado: "cerrada", comentario: "Conexión VPN estable durante una semana. Problema resuelto satisfactoriamente." },
      ],
      evidencias_adjuntas: [],
      detalle_especifico: {
        direccion_ip: "200.23.45.1",
        vlan: "VLAN-999",
        puerto_uplink: "GigabitEthernet0/0",
        equipos_afectados: 45,
      },
    },
    {
      codigo_incidencia: "INC-2026-0009",
      titulo: "Antivirus desactualizado en equipos de laboratorio Edificio B",
      descripcion:
        "Se detectó que 30 equipos del laboratorio 2 tienen el antivirus con definiciones de virus obsoletas (más de 90 días sin actualizar), representando un riesgo de seguridad.",
      categoria: "computo_redes",
      prioridad: "media",
      estado: "en proceso",
      horas_invertidas: 1,
      fecha_creacion: hace(3),
      reportante: {
        nombre: "Ing. Roberto Méndez Castillo",
        rol: "Coordinador de TI",
        correo: "roberto.mendez@utm.mx",
      },
      ubicacion: { edificio: "Edificio B", aula_espacio: "Laboratorio 2" },
      tags: ["antivirus", "seguridad", "actualizacion"],
      historial_seguimiento: [
        { fecha: hace(3), autor: "Sistema", estado_asignado: "abierta", comentario: "Incidencia registrada automáticamente." },
        { fecha: hace(2), autor: "Tec. Luis Ramírez Ortega", estado_asignado: "en proceso", comentario: "Creando script de actualización masiva via GPO. Aplicando en lotes de 10 equipos.", horas_agregadas: 1 },
      ],
      evidencias_adjuntas: [
        { nombre_archivo: "reporte_antivirus.xlsx", tipo_mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", peso_kb: 89, url_storage: "https://storage.example.com/evidencias/reporte_antivirus.xlsx", fecha_carga: hace(3) },
      ],
      detalle_especifico: {
        direccion_ip: "10.0.2.0/24",
        vlan: "VLAN-150",
        puerto_uplink: "GigabitEthernet0/8",
        equipos_afectados: 30,
      },
    },

    // ══════════════════════════════════════════════════════════════════
    // CATEGORÍA: infraestructura (8 documentos)
    // ══════════════════════════════════════════════════════════════════
    {
      codigo_incidencia: "INC-2026-0010",
      titulo: "Filtración de agua en techo del Edificio B aula 201",
      descripcion:
        "Filtración activa de agua de lluvia por el techo del aula 201 del Edificio B. El agua cae directamente sobre el área de mesas y equipos electrónicos, poniendo en riesgo tanto a estudiantes como al equipo.",
      categoria: "infraestructura",
      prioridad: "critica",
      estado: "resuelta",
      horas_invertidas: 24,
      fecha_creacion: hace(25),
      fecha_resolucion: hace(20),
      reportante: {
        nombre: "Mtro. Javier Mendoza Cruz",
        rol: "Profesor de Tiempo Completo",
        correo: "javier.mendoza@utm.mx",
      },
      ubicacion: { edificio: "Edificio B", aula_espacio: "Aula 201" },
      tags: ["filtración", "techo", "urgente", "agua"],
      historial_seguimiento: [
        { fecha: hace(25), autor: "Sistema", estado_asignado: "abierta", comentario: "Incidencia registrada automáticamente." },
        { fecha: hace(24), autor: "Arq. Sofía Villanueva Pérez", estado_asignado: "en proceso", comentario: "Se colocaron lonas protectoras temporales. Contratista programado para reparación.", horas_agregadas: 4 },
        { fecha: hace(22), autor: "Arq. Sofía Villanueva Pérez", estado_asignado: "en espera", comentario: "Contratista confirma inicio de trabajos para mañana. Material impermeabilizante adquirido.", horas_agregadas: 2 },
        { fecha: hace(20), autor: "Arq. Sofía Villanueva Pérez", estado_asignado: "resuelta", comentario: "Impermeabilización completa del área afectada. Se verificó con prueba de agua durante 4 horas.", horas_agregadas: 18 },
      ],
      evidencias_adjuntas: [
        { nombre_archivo: "filtracion_techo.mp4", tipo_mime: "video/mp4", peso_kb: 15000, url_storage: "https://storage.example.com/evidencias/filtracion_techo.mp4", fecha_carga: hace(25) },
        { nombre_archivo: "reparacion_completada.jpg", tipo_mime: "image/jpeg", peso_kb: 3200, url_storage: "https://storage.example.com/evidencias/reparacion_completada.jpg", fecha_carga: hace(20) },
      ],
      detalle_especifico: {
        tipo_dano: "Filtración por impermeabilización deteriorada",
        riesgo_seguridad: "Alto - Riesgo eléctrico y resbalones",
        insumos_requeridos: ["Impermeabilizante acrílico 20L", "Malla de refuerzo", "Sellador de juntas", "Pintura acrílica"],
        requiere_contratista: true,
      },
    },
    {
      codigo_incidencia: "INC-2026-0011",
      titulo: "Luminarias fundidas en pasillo principal de Biblioteca",
      descripcion:
        "7 de las 12 luminarias LED del pasillo principal de la Biblioteca Central se encuentran fundidas, generando áreas oscuras que dificultan la circulación segura de estudiantes, especialmente en horario nocturno.",
      categoria: "infraestructura",
      prioridad: "media",
      estado: "cerrada",
      horas_invertidas: 6,
      fecha_creacion: hace(40),
      fecha_resolucion: hace(37),
      reportante: {
        nombre: "Lic. Ana Gabriela Torres Ruiz",
        rol: "Bibliotecaria",
        correo: "ana.torres@utm.mx",
      },
      ubicacion: { edificio: "Biblioteca", aula_espacio: "Pasillo Principal" },
      tags: ["iluminacion", "luminarias", "seguridad"],
      historial_seguimiento: [
        { fecha: hace(40), autor: "Sistema", estado_asignado: "abierta", comentario: "Incidencia registrada automáticamente." },
        { fecha: hace(39), autor: "Sr. Miguel Ángel Rojas", estado_asignado: "en proceso", comentario: "Se solicitaron 7 lámparas LED de reemplazo al almacén.", horas_agregadas: 1 },
        { fecha: hace(37), autor: "Sr. Miguel Ángel Rojas", estado_asignado: "resuelta", comentario: "Las 7 luminarias fueron reemplazadas. Se verificó el funcionamiento correcto.", horas_agregadas: 5 },
        { fecha: hace(35), autor: "Lic. Ana Gabriela Torres Ruiz", estado_asignado: "cerrada", comentario: "Iluminación completa restaurada. Gracias al equipo de mantenimiento." },
      ],
      evidencias_adjuntas: [
        { nombre_archivo: "pasillo_oscuro.jpg", tipo_mime: "image/jpeg", peso_kb: 1800, url_storage: "https://storage.example.com/evidencias/pasillo_oscuro.jpg", fecha_carga: hace(40) },
        { nombre_archivo: "luminarias_nuevas.jpg", tipo_mime: "image/jpeg", peso_kb: 2200, url_storage: "https://storage.example.com/evidencias/luminarias_nuevas.jpg", fecha_carga: hace(37) },
      ],
      detalle_especifico: {
        tipo_dano: "Luminarias LED fundidas por sobrevoltaje",
        riesgo_seguridad: "Medio - Áreas oscuras de circulación",
        insumos_requeridos: ["Lámpara LED tubular T8 (x7)", "Balastros electrónicos (x3)"],
        requiere_contratista: false,
      },
    },
    {
      codigo_incidencia: "INC-2026-0012",
      titulo: "Puerta de emergencia trabada en Edificio K",
      descripcion:
        "La puerta de emergencia sur del Edificio K no abre correctamente. El mecanismo de barra antipánico está trabado, impidiendo la evacuación rápida en caso de emergencia. Esto viola las normas de protección civil.",
      categoria: "infraestructura",
      prioridad: "critica",
      estado: "resuelta",
      horas_invertidas: 3,
      fecha_creacion: hace(10),
      fecha_resolucion: hace(9),
      reportante: {
        nombre: "Cap. Ricardo Solís Hernández",
        rol: "Jefe de Protección Civil",
        correo: "ricardo.solis@utm.mx",
      },
      ubicacion: { edificio: "Edificio K", aula_espacio: "Salida de Emergencia Sur" },
      tags: ["emergencia", "puerta", "proteccion-civil", "urgente"],
      historial_seguimiento: [
        { fecha: hace(10), autor: "Sistema", estado_asignado: "abierta", comentario: "Incidencia registrada automáticamente." },
        { fecha: hace(9), autor: "Sr. Miguel Ángel Rojas", estado_asignado: "resuelta", comentario: "Mecanismo antipánico desbloqueado y lubricado. Bisagras reajustadas. Verificación exitosa de apertura.", horas_agregadas: 3 },
      ],
      evidencias_adjuntas: [
        { nombre_archivo: "puerta_trabada.jpg", tipo_mime: "image/jpeg", peso_kb: 980, url_storage: "https://storage.example.com/evidencias/puerta_trabada.jpg", fecha_carga: hace(10) },
      ],
      detalle_especifico: {
        tipo_dano: "Mecanismo de barra antipánico trabado",
        riesgo_seguridad: "Crítico - Imposibilita evacuación de emergencia",
        insumos_requeridos: ["Lubricante industrial WD-40", "Kit de herramientas cerrajería"],
        requiere_contratista: false,
      },
    },
    {
      codigo_incidencia: "INC-2026-0013",
      titulo: "Bache peligroso en estacionamiento principal",
      descripcion:
        "Se formó un bache de aproximadamente 50cm de diámetro y 15cm de profundidad en la entrada del estacionamiento principal. Ya ha dañado al menos 2 vehículos del personal docente.",
      categoria: "infraestructura",
      prioridad: "alta",
      estado: "en proceso",
      horas_invertidas: 2,
      fecha_creacion: hace(4),
      reportante: {
        nombre: "Lic. Alejandro Vega Morales",
        rol: "Director Administrativo",
        correo: "alejandro.vega@utm.mx",
      },
      ubicacion: { edificio: "Edificio A", aula_espacio: "Estacionamiento Principal" },
      tags: ["estacionamiento", "bache", "pavimento"],
      historial_seguimiento: [
        { fecha: hace(4), autor: "Sistema", estado_asignado: "abierta", comentario: "Incidencia registrada automáticamente." },
        { fecha: hace(3), autor: "Arq. Sofía Villanueva Pérez", estado_asignado: "en proceso", comentario: "Se colocó señalización y conos de seguridad. Cotización de reparación en trámite con 2 contratistas.", horas_agregadas: 2 },
      ],
      evidencias_adjuntas: [
        { nombre_archivo: "bache_estacionamiento.jpg", tipo_mime: "image/jpeg", peso_kb: 2800, url_storage: "https://storage.example.com/evidencias/bache_estacionamiento.jpg", fecha_carga: hace(4) },
        { nombre_archivo: "cotizacion_reparacion.pdf", tipo_mime: "application/pdf", peso_kb: 650, url_storage: "https://storage.example.com/evidencias/cotizacion_reparacion.pdf", fecha_carga: hace(3) },
      ],
      detalle_especifico: {
        tipo_dano: "Bache en pavimento asfáltico",
        riesgo_seguridad: "Alto - Daño vehicular y posible lesión de peatones",
        insumos_requeridos: ["Mezcla asfáltica en frío 50kg", "Compactadora manual", "Pintura para señalización"],
        requiere_contratista: true,
      },
    },
    {
      codigo_incidencia: "INC-2026-0014",
      titulo: "Aire acondicionado descompuesto en aula 105 Edificio A",
      descripcion:
        "La unidad de aire acondicionado tipo mini-split de 2 toneladas del aula 105 emite ruidos fuertes y no enfría adecuadamente. La temperatura en el aula supera los 35°C.",
      categoria: "infraestructura",
      prioridad: "alta",
      estado: "en espera",
      horas_invertidas: 3,
      fecha_creacion: hace(6),
      reportante: {
        nombre: "Dra. Carmen Ortiz Velasco",
        rol: "Profesora Investigadora",
        correo: "carmen.ortiz@utm.mx",
      },
      ubicacion: { edificio: "Edificio A", aula_espacio: "Aula 105" },
      tags: ["aire-acondicionado", "climatizacion", "mantenimiento"],
      historial_seguimiento: [
        { fecha: hace(6), autor: "Sistema", estado_asignado: "abierta", comentario: "Incidencia registrada automáticamente." },
        { fecha: hace(5), autor: "Sr. Miguel Ángel Rojas", estado_asignado: "en proceso", comentario: "Diagnóstico: compresor con fuga de gas refrigerante. Se requiere técnico especializado en refrigeración.", horas_agregadas: 2 },
        { fecha: hace(4), autor: "Sr. Miguel Ángel Rojas", estado_asignado: "en espera", comentario: "En espera de la visita del técnico especializado. Cita programada para el viernes.", horas_agregadas: 1 },
      ],
      evidencias_adjuntas: [],
      detalle_especifico: {
        tipo_dano: "Fuga de gas refrigerante en compresor de mini-split",
        riesgo_seguridad: "Medio - Temperatura excesiva para actividades académicas",
        insumos_requeridos: ["Gas refrigerante R-410A", "Kit de soldadura de cobre", "Detector de fugas"],
        requiere_contratista: true,
      },
    },
    {
      codigo_incidencia: "INC-2026-0015",
      titulo: "Barandal suelto en escaleras del Edificio B",
      descripcion:
        "El barandal metálico del segundo tramo de escaleras del Edificio B está suelto de la pared. Se mueve peligrosamente al sujetarse, representando riesgo de caída para los usuarios.",
      categoria: "infraestructura",
      prioridad: "critica",
      estado: "cerrada",
      horas_invertidas: 5,
      fecha_creacion: hace(50),
      fecha_resolucion: hace(48),
      reportante: {
        nombre: "Cap. Ricardo Solís Hernández",
        rol: "Jefe de Protección Civil",
        correo: "ricardo.solis@utm.mx",
      },
      ubicacion: { edificio: "Edificio B", aula_espacio: "Escaleras Piso 1-2" },
      tags: ["barandal", "escaleras", "seguridad", "proteccion-civil"],
      historial_seguimiento: [
        { fecha: hace(50), autor: "Sistema", estado_asignado: "abierta", comentario: "Incidencia registrada automáticamente." },
        { fecha: hace(49), autor: "Sr. Miguel Ángel Rojas", estado_asignado: "en proceso", comentario: "Área acordonada. Se requiere soldador para reforzar anclajes.", horas_agregadas: 1 },
        { fecha: hace(48), autor: "Sr. Miguel Ángel Rojas", estado_asignado: "resuelta", comentario: "Barandal re-soldado y anclado con taquetes expansivos. Prueba de carga exitosa.", horas_agregadas: 4 },
        { fecha: hace(46), autor: "Cap. Ricardo Solís Hernández", estado_asignado: "cerrada", comentario: "Inspección de seguridad aprobada. Barandal firme y seguro." },
      ],
      evidencias_adjuntas: [
        { nombre_archivo: "barandal_suelto.jpg", tipo_mime: "image/jpeg", peso_kb: 1450, url_storage: "https://storage.example.com/evidencias/barandal_suelto.jpg", fecha_carga: hace(50) },
        { nombre_archivo: "reparacion_barandal.jpg", tipo_mime: "image/jpeg", peso_kb: 1600, url_storage: "https://storage.example.com/evidencias/reparacion_barandal.jpg", fecha_carga: hace(48) },
      ],
      detalle_especifico: {
        tipo_dano: "Anclajes de barandal metálico desprendidos de muro",
        riesgo_seguridad: "Crítico - Riesgo de caída en escaleras",
        insumos_requeridos: ["Electrodos de soldadura 6013", "Taquetes expansivos 3/8", "Pintura anticorrosiva"],
        requiere_contratista: false,
      },
    },
    {
      codigo_incidencia: "INC-2026-0016",
      titulo: "Piso resbaloso en entrada principal Biblioteca después de lluvia",
      descripcion:
        "El piso de loseta pulida en la entrada principal de la Biblioteca se vuelve extremadamente resbaloso cuando llueve. Ya se han registrado 3 caídas de estudiantes este semestre.",
      categoria: "infraestructura",
      prioridad: "alta",
      estado: "abierta",
      horas_invertidas: 0,
      fecha_creacion: hace(1),
      reportante: {
        nombre: "Lic. Ana Gabriela Torres Ruiz",
        rol: "Bibliotecaria",
        correo: "ana.torres@utm.mx",
      },
      ubicacion: { edificio: "Biblioteca", aula_espacio: "Entrada Principal" },
      tags: ["piso", "resbaloso", "seguridad", "lluvia"],
      historial_seguimiento: [
        { fecha: hace(1), autor: "Sistema", estado_asignado: "abierta", comentario: "Incidencia registrada automáticamente." },
      ],
      evidencias_adjuntas: [
        { nombre_archivo: "piso_mojado.jpg", tipo_mime: "image/jpeg", peso_kb: 1950, url_storage: "https://storage.example.com/evidencias/piso_mojado.jpg", fecha_carga: hace(1) },
      ],
      detalle_especifico: {
        tipo_dano: "Piso con acabado liso sin tratamiento antiderrapante",
        riesgo_seguridad: "Alto - Riesgo de caídas y lesiones",
        insumos_requeridos: ["Cintas antiderrapantes 5m (x10)", "Tapetes absorbentes para entrada", "Señalización de piso mojado"],
        requiere_contratista: false,
      },
    },
    {
      codigo_incidencia: "INC-2026-0017",
      titulo: "Fuga de agua en sanitarios del Edificio K planta baja",
      descripcion:
        "Fuga constante de agua en los sanitarios de hombres planta baja del Edificio K. El desperdicio de agua es significativo y el piso permanece mojado generando riesgo de resbalones.",
      categoria: "infraestructura",
      prioridad: "media",
      estado: "resuelta",
      horas_invertidas: 4,
      fecha_creacion: hace(12),
      fecha_resolucion: hace(10),
      reportante: {
        nombre: "Sr. Pedro Guzmán Flores",
        rol: "Intendente",
        correo: "pedro.guzman@utm.mx",
      },
      ubicacion: { edificio: "Edificio K", aula_espacio: "Sanitarios PB Hombres" },
      tags: ["plomeria", "fuga", "agua", "sanitarios"],
      historial_seguimiento: [
        { fecha: hace(12), autor: "Sistema", estado_asignado: "abierta", comentario: "Incidencia registrada automáticamente." },
        { fecha: hace(11), autor: "Sr. Miguel Ángel Rojas", estado_asignado: "en proceso", comentario: "Identificada fuga en válvula de llenado de tanque de WC. Solicitando refacción.", horas_agregadas: 1 },
        { fecha: hace(10), autor: "Sr. Miguel Ángel Rojas", estado_asignado: "resuelta", comentario: "Válvula de llenado reemplazada. Fuga detenida completamente.", horas_agregadas: 3 },
      ],
      evidencias_adjuntas: [
        { nombre_archivo: "fuga_sanitario.jpg", tipo_mime: "image/jpeg", peso_kb: 1100, url_storage: "https://storage.example.com/evidencias/fuga_sanitario.jpg", fecha_carga: hace(12) },
      ],
      detalle_especifico: {
        tipo_dano: "Válvula de llenado de WC defectuosa",
        riesgo_seguridad: "Bajo - Desperdicio de agua y piso húmedo",
        insumos_requeridos: ["Válvula de llenado universal", "Cinta teflón", "Llave de tubo"],
        requiere_contratista: false,
      },
    },

    // ══════════════════════════════════════════════════════════════════
    // CATEGORÍA: academico (8 documentos)
    // ══════════════════════════════════════════════════════════════════
    {
      codigo_incidencia: "INC-2026-0018",
      titulo: "Moodle no permite subir tareas en curso de Cálculo III",
      descripcion:
        "Los estudiantes del curso MAT-301 Cálculo III no pueden subir archivos de tarea en Moodle. El sistema muestra error 'Maximum upload size exceeded' aunque los archivos son menores a 5MB. Fecha límite de entrega mañana.",
      categoria: "academico",
      prioridad: "critica",
      estado: "resuelta",
      horas_invertidas: 2,
      fecha_creacion: hace(8),
      fecha_resolucion: hace(7),
      reportante: {
        nombre: "Dr. Arturo Castañeda Rivas",
        rol: "Profesor Titular",
        correo: "arturo.castaneda@utm.mx",
      },
      ubicacion: { edificio: "Edificio A", aula_espacio: "Aula 302" },
      tags: ["moodle", "tareas", "upload", "critico"],
      historial_seguimiento: [
        { fecha: hace(8), autor: "Sistema", estado_asignado: "abierta", comentario: "Incidencia registrada automáticamente." },
        { fecha: hace(7), autor: "Ing. Roberto Méndez Castillo", estado_asignado: "en proceso", comentario: "Parámetro upload_max_filesize en PHP estaba limitado a 2MB. Incrementando a 50MB.", horas_agregadas: 1 },
        { fecha: hace(7), autor: "Ing. Roberto Méndez Castillo", estado_asignado: "resuelta", comentario: "Parámetro corregido. Se extendió la fecha límite 24h por acuerdo con el profesor.", horas_agregadas: 1 },
      ],
      evidencias_adjuntas: [
        { nombre_archivo: "error_moodle_upload.png", tipo_mime: "image/png", peso_kb: 450, url_storage: "https://storage.example.com/evidencias/error_moodle_upload.png", fecha_carga: hace(8) },
      ],
      detalle_especifico: {
        plataforma: "Moodle 4.1",
        codigo_curso: "MAT-301",
        periodo_escolar: "2026-2",
        estudiantes_impactados: 35,
      },
    },
    {
      codigo_incidencia: "INC-2026-0019",
      titulo: "Zoom institucional no genera enlaces para clases híbridas",
      descripcion:
        "La cuenta institucional de Zoom no permite crear reuniones programadas desde hace 2 días. Afecta a todos los profesores que imparten clases en modalidad híbrida, obligándolos a usar cuentas personales con límite de 40 minutos.",
      categoria: "academico",
      prioridad: "alta",
      estado: "cerrada",
      horas_invertidas: 6,
      fecha_creacion: hace(22),
      fecha_resolucion: hace(20),
      reportante: {
        nombre: "Dra. Elena Ríos Martínez",
        rol: "Directora Académica",
        correo: "elena.rios@utm.mx",
      },
      ubicacion: { edificio: "Edificio A", aula_espacio: "Dirección Académica" },
      tags: ["zoom", "clases-hibridas", "licencia", "videoconferencia"],
      historial_seguimiento: [
        { fecha: hace(22), autor: "Sistema", estado_asignado: "abierta", comentario: "Incidencia registrada automáticamente." },
        { fecha: hace(21), autor: "Ing. Roberto Méndez Castillo", estado_asignado: "en proceso", comentario: "Licencia Zoom Education expirada. Contactando proveedor para renovación urgente.", horas_agregadas: 2 },
        { fecha: hace(20), autor: "Ing. Roberto Méndez Castillo", estado_asignado: "resuelta", comentario: "Licencia renovada y reactivada. Todos los profesores pueden crear reuniones nuevamente.", horas_agregadas: 4 },
        { fecha: hace(18), autor: "Dra. Elena Ríos Martínez", estado_asignado: "cerrada", comentario: "Servicio de Zoom funcionando normalmente. Se agendó recordatorio para renovación futura." },
      ],
      evidencias_adjuntas: [
        { nombre_archivo: "error_zoom_licencia.png", tipo_mime: "image/png", peso_kb: 380, url_storage: "https://storage.example.com/evidencias/error_zoom_licencia.png", fecha_carga: hace(22) },
        { nombre_archivo: "confirmacion_renovacion.pdf", tipo_mime: "application/pdf", peso_kb: 220, url_storage: "https://storage.example.com/evidencias/confirmacion_renovacion.pdf", fecha_carga: hace(20) },
      ],
      detalle_especifico: {
        plataforma: "Zoom Education",
        codigo_curso: "GENERAL",
        periodo_escolar: "2026-2",
        estudiantes_impactados: 500,
      },
    },
    {
      codigo_incidencia: "INC-2026-0020",
      titulo: "Sistema de calificaciones SII no guarda parciales",
      descripcion:
        "El Sistema Integral de Información (SII) presenta error al intentar guardar calificaciones del segundo parcial. Los profesores reportan pérdida de datos ingresados tras hacer clic en Guardar.",
      categoria: "academico",
      prioridad: "critica",
      estado: "en proceso",
      horas_invertidas: 8,
      fecha_creacion: hace(3),
      reportante: {
        nombre: "Mtro. Ricardo Paredes Aguilar",
        rol: "Jefe de Control Escolar",
        correo: "ricardo.paredes@utm.mx",
      },
      ubicacion: { edificio: "Edificio A", aula_espacio: "Control Escolar" },
      tags: ["sii", "calificaciones", "parciales", "critico"],
      historial_seguimiento: [
        { fecha: hace(3), autor: "Sistema", estado_asignado: "abierta", comentario: "Incidencia registrada automáticamente." },
        { fecha: hace(2), autor: "Ing. Roberto Méndez Castillo", estado_asignado: "en proceso", comentario: "Bug identificado en la validación del formulario de captura. El campo 'periodo' envía formato incorrecto. Corrigiendo código fuente.", horas_agregadas: 8 },
      ],
      evidencias_adjuntas: [
        { nombre_archivo: "error_sii_console.png", tipo_mime: "image/png", peso_kb: 520, url_storage: "https://storage.example.com/evidencias/error_sii_console.png", fecha_carga: hace(3) },
        { nombre_archivo: "log_servidor_sii.txt", tipo_mime: "text/plain", peso_kb: 890, url_storage: "https://storage.example.com/evidencias/log_servidor_sii.txt", fecha_carga: hace(2) },
      ],
      detalle_especifico: {
        plataforma: "SII (Sistema Integral de Información)",
        codigo_curso: "MULTI",
        periodo_escolar: "2026-2",
        estudiantes_impactados: 1200,
      },
    },
    {
      codigo_incidencia: "INC-2026-0021",
      titulo: "Google Classroom no sincroniza con correo institucional",
      descripcion:
        "Google Classroom no reconoce las cuentas de correo institucional @utm.mx de los alumnos de nuevo ingreso. Los estudiantes no pueden unirse a los cursos asignados para el semestre actual.",
      categoria: "academico",
      prioridad: "alta",
      estado: "resuelta",
      horas_invertidas: 4,
      fecha_creacion: hace(18),
      fecha_resolucion: hace(16),
      reportante: {
        nombre: "Lic. Gabriela Méndez Torres",
        rol: "Coordinadora de Servicios Estudiantiles",
        correo: "gabriela.mendez@utm.mx",
      },
      ubicacion: { edificio: "Edificio K", aula_espacio: "Servicios Estudiantiles" },
      tags: ["google-classroom", "correo", "nuevo-ingreso"],
      historial_seguimiento: [
        { fecha: hace(18), autor: "Sistema", estado_asignado: "abierta", comentario: "Incidencia registrada automáticamente." },
        { fecha: hace(17), autor: "Ing. Roberto Méndez Castillo", estado_asignado: "en proceso", comentario: "Las cuentas de nuevo ingreso no fueron agregadas a la unidad organizativa correcta en Google Admin. Migrando cuentas.", horas_agregadas: 2 },
        { fecha: hace(16), autor: "Ing. Roberto Méndez Castillo", estado_asignado: "resuelta", comentario: "150 cuentas migradas a la OU correcta. Sincronización con Classroom verificada.", horas_agregadas: 2 },
      ],
      evidencias_adjuntas: [
        { nombre_archivo: "error_classroom.png", tipo_mime: "image/png", peso_kb: 310, url_storage: "https://storage.example.com/evidencias/error_classroom.png", fecha_carga: hace(18) },
      ],
      detalle_especifico: {
        plataforma: "Google Classroom",
        codigo_curso: "MULTI",
        periodo_escolar: "2026-2",
        estudiantes_impactados: 150,
      },
    },
    {
      codigo_incidencia: "INC-2026-0022",
      titulo: "Proyector no enciende en sala de videoconferencia Edificio B",
      descripcion:
        "El proyector Epson de la sala de videoconferencia del Edificio B no enciende. La lámpara parece agotada tras más de 5000 horas de uso. Se cancelaron 3 sesiones de videoconferencia hoy.",
      categoria: "academico",
      prioridad: "media",
      estado: "en espera",
      horas_invertidas: 1,
      fecha_creacion: hace(5),
      reportante: {
        nombre: "Mtro. Fernando Salazar Díaz",
        rol: "Responsable de Laboratorio",
        correo: "fernando.salazar@utm.mx",
      },
      ubicacion: { edificio: "Edificio B", aula_espacio: "Sala de Videoconferencia" },
      tags: ["proyector", "lampara", "videoconferencia"],
      historial_seguimiento: [
        { fecha: hace(5), autor: "Sistema", estado_asignado: "abierta", comentario: "Incidencia registrada automáticamente." },
        { fecha: hace(4), autor: "Tec. María García", estado_asignado: "en proceso", comentario: "Confirmado: lámpara agotada. Modelo de reemplazo: ELPLP96. Solicitando compra.", horas_agregadas: 1 },
        { fecha: hace(3), autor: "Tec. María García", estado_asignado: "en espera", comentario: "Lámpara de reemplazo pedida a proveedor. Tiempo estimado de entrega: 5-7 días hábiles." },
      ],
      evidencias_adjuntas: [
        { nombre_archivo: "proyector_apagado.jpg", tipo_mime: "image/jpeg", peso_kb: 750, url_storage: "https://storage.example.com/evidencias/proyector_apagado.jpg", fecha_carga: hace(5) },
      ],
      detalle_especifico: {
        plataforma: "Epson PowerLite X49",
        codigo_curso: "INFRAESTRUCTURA-AUDIOVISUAL",
        periodo_escolar: "2026-2",
        estudiantes_impactados: 80,
      },
    },
    {
      codigo_incidencia: "INC-2026-0023",
      titulo: "Plataforma Teams no carga materiales del curso de Redes",
      descripcion:
        "Los materiales del curso TEL-401 en Microsoft Teams no cargan correctamente. Los archivos de la pestaña 'Archivos' muestran error de sincronización con SharePoint, impidiendo que los estudiantes descarguen las prácticas de laboratorio.",
      categoria: "academico",
      prioridad: "media",
      estado: "abierta",
      horas_invertidas: 0,
      fecha_creacion: hace(1),
      reportante: {
        nombre: "Ing. Patricia Domínguez Soto",
        rol: "Profesora",
        correo: "patricia.dominguez@utm.mx",
      },
      ubicacion: { edificio: "Edificio K", aula_espacio: "Laboratorio de Redes" },
      tags: ["teams", "sharepoint", "materiales", "sincronizacion"],
      historial_seguimiento: [
        { fecha: hace(1), autor: "Sistema", estado_asignado: "abierta", comentario: "Incidencia registrada automáticamente." },
      ],
      evidencias_adjuntas: [],
      detalle_especifico: {
        plataforma: "Microsoft Teams / SharePoint",
        codigo_curso: "TEL-401",
        periodo_escolar: "2026-2",
        estudiantes_impactados: 28,
      },
    },
    {
      codigo_incidencia: "INC-2026-0024",
      titulo: "Laboratorio virtual de química no es accesible desde campus",
      descripcion:
        "La plataforma ChemCollective para laboratorios virtuales de Química Orgánica no es accesible desde la red del campus. Los estudiantes pueden acceder desde fuera usando datos móviles, lo que sugiere un bloqueo de red interno.",
      categoria: "academico",
      prioridad: "baja",
      estado: "abierta",
      horas_invertidas: 0,
      fecha_creacion: hace(2),
      reportante: {
        nombre: "Dra. Laura Jiménez Padilla",
        rol: "Profesora de Química",
        correo: "laura.jimenez@utm.mx",
      },
      ubicacion: { edificio: "Edificio B", aula_espacio: "Laboratorio de Química" },
      tags: ["laboratorio-virtual", "quimica", "acceso-red", "bloqueo"],
      historial_seguimiento: [
        { fecha: hace(2), autor: "Sistema", estado_asignado: "abierta", comentario: "Incidencia registrada automáticamente." },
      ],
      evidencias_adjuntas: [
        { nombre_archivo: "error_acceso_chemcollective.png", tipo_mime: "image/png", peso_kb: 280, url_storage: "https://storage.example.com/evidencias/error_acceso_chemcollective.png", fecha_carga: hace(2) },
      ],
      detalle_especifico: {
        plataforma: "ChemCollective",
        codigo_curso: "QUI-202",
        periodo_escolar: "2026-2",
        estudiantes_impactados: 45,
      },
    },
    {
      codigo_incidencia: "INC-2026-0025",
      titulo: "Examen en línea se interrumpió por caída del servidor de evaluaciones",
      descripcion:
        "Durante la aplicación del examen final de Programación Web (30 estudiantes presentando simultáneamente), el servidor de evaluaciones en línea se cayó durante 25 minutos, causando pérdida de progreso en los exámenes de 12 estudiantes.",
      categoria: "academico",
      prioridad: "critica",
      estado: "cerrada",
      horas_invertidas: 7,
      fecha_creacion: hace(14),
      fecha_resolucion: hace(12),
      reportante: {
        nombre: "Dr. Arturo Castañeda Rivas",
        rol: "Profesor Titular",
        correo: "arturo.castaneda@utm.mx",
      },
      ubicacion: { edificio: "Edificio A", aula_espacio: "Laboratorio de Cómputo 1" },
      tags: ["examen", "servidor", "caida", "evaluaciones", "critico"],
      historial_seguimiento: [
        { fecha: hace(14), autor: "Sistema", estado_asignado: "abierta", comentario: "Incidencia registrada automáticamente." },
        { fecha: hace(14), autor: "Ing. Roberto Méndez Castillo", estado_asignado: "en proceso", comentario: "Servidor restaurado. Causa: memoria RAM insuficiente ante 30 conexiones concurrentes de examen. Ampliando RAM de 4GB a 16GB.", horas_agregadas: 3 },
        { fecha: hace(13), autor: "Ing. Roberto Méndez Castillo", estado_asignado: "en proceso", comentario: "RAM instalada. Configurando auto-guardado cada 60 segundos para prevenir pérdida de datos futuros.", horas_agregadas: 2 },
        { fecha: hace(12), autor: "Ing. Roberto Méndez Castillo", estado_asignado: "resuelta", comentario: "Mejoras implementadas. Se reprogramó examen extraordinario para los 12 estudiantes afectados.", horas_agregadas: 2 },
        { fecha: hace(10), autor: "Dr. Arturo Castañeda Rivas", estado_asignado: "cerrada", comentario: "Examen extraordinario aplicado exitosamente. Servidor estable con las mejoras." },
      ],
      evidencias_adjuntas: [
        { nombre_archivo: "log_servidor_crash.txt", tipo_mime: "text/plain", peso_kb: 1200, url_storage: "https://storage.example.com/evidencias/log_servidor_crash.txt", fecha_carga: hace(14) },
        { nombre_archivo: "monitoreo_ram.png", tipo_mime: "image/png", peso_kb: 680, url_storage: "https://storage.example.com/evidencias/monitoreo_ram.png", fecha_carga: hace(13) },
        { nombre_archivo: "config_autoguardado.json", tipo_mime: "application/json", peso_kb: 5, url_storage: "https://storage.example.com/evidencias/config_autoguardado.json", fecha_carga: hace(12) },
      ],
      detalle_especifico: {
        plataforma: "Servidor de Evaluaciones Institucional",
        codigo_curso: "PRW-401",
        periodo_escolar: "2026-2",
        estudiantes_impactados: 30,
      },
    },
  ];

  return docs;
}

// ─── Función principal ──────────────────────────────────────────────────────

async function main() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log("✅ Conectado a MongoDB Atlas");

    const db = client.db(DB_NAME);

    // 1. Eliminar colección existente (si la hay)
    const collections = await db
      .listCollections({ name: COLLECTION })
      .toArray();
    if (collections.length > 0) {
      await db.dropCollection(COLLECTION);
      console.log(`🗑️  Colección '${COLLECTION}' eliminada.`);
    }

    // 2. Crear colección con validador $jsonSchema
    await db.createCollection(COLLECTION, {
      validator: jsonSchemaValidator,
      validationLevel: "strict",
      validationAction: "error",
    });
    console.log(
      `📦 Colección '${COLLECTION}' creada con validador $jsonSchema polimórfico.`
    );

    const col = db.collection(COLLECTION);

    // 3. Crear índices obligatorios
    // 3a. Índice Compuesto
    await col.createIndex(
      { categoria: 1, estado: 1, "ubicacion.edificio": 1 },
      { name: "idx_categoria_estado_edificio" }
    );
    console.log("📇 Índice compuesto creado: categoria + estado + edificio");

    // 3b. Índice TTL (60 días = 5184000 segundos)
    await col.createIndex(
      { fecha_resolucion: 1 },
      { expireAfterSeconds: 5184000, name: "idx_ttl_fecha_resolucion" }
    );
    console.log("⏰ Índice TTL creado: fecha_resolucion (60 días)");

    // 3c. Índice Full-Text Search en español
    await col.createIndex(
      { titulo: "text", descripcion: "text" },
      {
        default_language: "spanish",
        weights: { titulo: 10, descripcion: 5 },
        name: "idx_fulltext_titulo_descripcion",
      }
    );
    console.log("🔍 Índice full-text creado: titulo (peso 10) + descripcion (peso 5) en español");

    // 4. Insertar datos seed
    const seedData = generarSeedData();
    const result = await col.insertMany(seedData);
    console.log(`🌱 ${result.insertedCount} documentos seed insertados exitosamente.`);

    // 5. Verificación
    const count = await col.countDocuments();
    console.log(`\n📊 Verificación final:`);
    console.log(`   Total de documentos: ${count}`);

    const categorias = await col
      .aggregate([{ $group: { _id: "$categoria", count: { $sum: 1 } } }])
      .toArray();
    console.log("   Distribución por categoría:");
    categorias.forEach((c) => console.log(`     - ${c._id}: ${c.count}`));

    const estados = await col
      .aggregate([{ $group: { _id: "$estado", count: { $sum: 1 } } }])
      .toArray();
    console.log("   Distribución por estado:");
    estados.forEach((e) => console.log(`     - ${e._id}: ${e.count}`));

    const edificios = await col
      .aggregate([
        { $group: { _id: "$ubicacion.edificio", count: { $sum: 1 } } },
      ])
      .toArray();
    console.log("   Distribución por edificio:");
    edificios.forEach((e) => console.log(`     - ${e._id}: ${e.count}`));

    const conEvidencias = await col.countDocuments({
      "evidencias_adjuntas.0": { $exists: true },
    });
    console.log(`   Documentos con evidencias: ${conEvidencias}`);

    const resueltas = await col.countDocuments({
      estado: { $in: ["resuelta", "cerrada"] },
      fecha_resolucion: { $exists: true },
    });
    console.log(`   Documentos resueltos/cerrados con fecha_resolucion: ${resueltas}`);

    const indexes = await col.indexes();
    console.log(`\n📇 Índices creados (${indexes.length}):`);
    indexes.forEach((idx) =>
      console.log(`     - ${idx.name}: ${JSON.stringify(idx.key)}`)
    );

    console.log("\n🎉 Setup completado exitosamente.");
  } catch (error) {
    console.error("❌ Error durante el setup:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("🔌 Conexión cerrada.");
  }
}

main();
