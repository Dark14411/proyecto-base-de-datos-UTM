// ═══════════════════════════════════════════════════════════════
// seeds/seed.js — Datos iniciales del Sistema UTM Desk
// Carga usuarios, catálogo de edificios e incidencias sintéticas
// oficiales (Figuras 4, 5, 6, 7 y 8 de la ERS).
// ═══════════════════════════════════════════════════════════════
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/database');
const Usuario = require('../models/Usuario');
const Edificio = require('../models/Edificio');
const Incidencia = require('../models/Incidencia');

const seedDB = async () => {
  try {
    await connectDB();
    console.log('📡 Conexión establecida para seed...');

    // ─── 1. Limpiar colecciones ───────────────────────────────
    console.log('🗑️  Limpiando colecciones existentes...');
    await Usuario.deleteMany({});
    await Edificio.deleteMany({});
    await Incidencia.deleteMany({});

    // ─── 2. Hashear contraseñas ───────────────────────────────
    const passAdmin = await bcrypt.hash('admin123', 10);
    const passCoord = await bcrypt.hash('coord123', 10);
    const passTecnico = await bcrypt.hash('tecnico123', 10);
    const passDirectivo = await bcrypt.hash('directivo123', 10);
    const passUser = await bcrypt.hash('utm123', 10);

    // ─── 3. Insertar Usuarios (Tabla 2 y Figura 7) ───────────
    console.log('👥 Insertando usuarios del campus...');
    const usuariosData = [
      {
        nombre_completo: 'Admin UTM Desk',
        nombre: 'Admin UTM Desk',
        correo: 'admin@utm.mx',
        password_hash: passAdmin,
        rol: 'administrador',
        rol_sistema: 'Administrador',
        matricula_o_numero_empleado: 'ADM-001',
        departamento: 'Dirección de TI',
        cuenta_activa: true,
        activo: true,
      },
      {
        nombre_completo: 'Ing. Sofía Morales',
        nombre: 'Ing. Sofía Morales',
        correo: 'coordinador@utm.mx',
        password_hash: passCoord,
        rol: 'coordinador',
        rol_sistema: 'Coordinador',
        matricula_o_numero_empleado: 'COO-001',
        departamento: 'Coordinación de Soporte y Redes',
        cuenta_activa: true,
        activo: true,
      },
      {
        nombre_completo: 'Téc. Mario Chan',
        nombre: 'Téc. Mario Chan',
        correo: 'mario.chan@utmetropolitana.edu.mx',
        password_hash: passTecnico,
        rol: 'tecnico',
        rol_sistema: 'Tecnico',
        matricula_o_numero_empleado: 'EMP-UTM-048',
        departamento: 'Dirección de Tecnologías de la Información',
        especialidades: ['computo_redes', 'academico'],
        cuenta_activa: true,
        activo: true,
      },
      {
        nombre_completo: 'Téc. Luis Pech',
        nombre: 'Téc. Luis Pech',
        correo: 'luis.pech@utmetropolitana.edu.mx',
        password_hash: passTecnico,
        rol: 'tecnico',
        rol_sistema: 'Tecnico',
        matricula_o_numero_empleado: 'EMP-UTM-049',
        departamento: 'Mantenimiento e Infraestructura',
        especialidades: ['infraestructura'],
        cuenta_activa: true,
        activo: true,
      },
      {
        nombre_completo: 'Dr. Reyes Carrillo Lizandro Israel',
        nombre: 'Dr. Reyes Carrillo Lizandro Israel',
        correo: 'directivo@utm.mx',
        password_hash: passDirectivo,
        rol: 'directivo',
        rol_sistema: 'Directivo',
        matricula_o_numero_empleado: 'DIR-001',
        departamento: 'Dirección Académica',
        cuenta_activa: true,
        activo: true,
      },
      {
        nombre_completo: 'Mtro. Roberto Méndez',
        nombre: 'Mtro. Roberto Méndez',
        correo: 'roberto.mendez@utmetropolitana.edu.mx',
        password_hash: passUser,
        rol: 'reportante',
        rol_sistema: 'Reportante',
        matricula_o_numero_empleado: 'DOC-102',
        departamento: 'Docencia en Redes',
        cuenta_activa: true,
        activo: true,
      },
      {
        nombre_completo: 'Lic. Andrea Cetina',
        nombre: 'Lic. Andrea Cetina',
        correo: 'andrea.cetina@utmetropolitana.edu.mx',
        password_hash: passUser,
        rol: 'reportante',
        rol_sistema: 'Reportante',
        matricula_o_numero_empleado: 'ADM-205',
        departamento: 'Servicios Administrativos',
        cuenta_activa: true,
        activo: true,
      },
      {
        nombre_completo: 'Mtra. Karla Dzul',
        nombre: 'Mtra. Karla Dzul',
        correo: 'karla.dzul@utmetropolitana.edu.mx',
        password_hash: passUser,
        rol: 'reportante',
        rol_sistema: 'Reportante',
        matricula_o_numero_empleado: 'DOC-110',
        departamento: 'Ciencias Básicas',
        cuenta_activa: true,
        activo: true,
      },
      {
        nombre_completo: 'Carlos Santiago Euan Ayala',
        nombre: 'Carlos Santiago Euan Ayala',
        correo: 'alumno@utm.mx',
        password_hash: passUser,
        rol: 'reportante',
        rol_sistema: 'Reportante',
        matricula_o_numero_empleado: '2026-TI-005',
        departamento: 'Tecnologías de la Información',
        cuenta_activa: true,
        activo: true,
      },
    ];

    const usuariosCreados = await Usuario.insertMany(usuariosData);
    console.log(`   ✅ ${usuariosCreados.length} usuarios creados`);

    // ─── 4. Insertar Catálogo de Edificios (Figura 8) ─────────
    console.log('🏢 Insertando catálogo oficial de edificios...');
    const edificiosData = [
      {
        nombre: 'Edificio K',
        clave: 'EDIF-K',
        pisos: 2,
        descripcion: 'Edificio de Tecnologías de la Información e Innovación Digital',
        activo: true,
        aulas: [
          { nombre: 'Laboratorio 4', piso: 2, tipo: 'laboratorio', capacidad: 30, tiene_equipo_computo: true },
          { nombre: 'Aula K-102', piso: 1, tipo: 'aula', capacidad: 35 },
          { nombre: 'Lab Redes Cisco', piso: 2, tipo: 'laboratorio', capacidad: 25, tiene_equipo_computo: true },
          { nombre: 'Servidores TI', piso: 1, tipo: 'otro', capacidad: 5, tiene_equipo_computo: true },
        ],
      },
      {
        nombre: 'Edificio A',
        clave: 'EDIF-A',
        pisos: 3,
        descripcion: 'Aulas de Ciencias Básicas y Sala de Docentes',
        activo: true,
        aulas: [
          { nombre: 'Sala de docentes', piso: 1, tipo: 'oficina', capacidad: 20 },
          { nombre: 'Aula A-101', piso: 1, tipo: 'aula', capacidad: 40 },
          { nombre: 'Aula A-202', piso: 2, tipo: 'aula', capacidad: 40 },
          { nombre: 'Aula A-301', piso: 3, tipo: 'aula', capacidad: 35 },
        ],
      },
      {
        nombre: 'Edificio B',
        clave: 'EDIF-B',
        pisos: 2,
        descripcion: 'Ingenierías y Laboratorios de Electrónica',
        activo: true,
        aulas: [
          { nombre: 'Aula 12', piso: 1, tipo: 'aula', capacidad: 35 },
          { nombre: 'Laboratorio B-1', piso: 1, tipo: 'laboratorio', capacidad: 30, tiene_equipo_computo: true },
          { nombre: 'Taller de Mecatrónica', piso: 2, tipo: 'laboratorio', capacidad: 25 },
        ],
      },
      {
        nombre: 'Edificio C',
        clave: 'EDIF-C',
        pisos: 2,
        descripcion: 'Rectoría y Servicios Administrativos',
        activo: true,
        aulas: [
          { nombre: 'Dirección General', piso: 2, tipo: 'oficina', capacidad: 10 },
          { nombre: 'Ventanillas Escolares', piso: 1, tipo: 'oficina', capacidad: 15 },
          { nombre: 'Sala de Juntas', piso: 2, tipo: 'auditorio', capacidad: 25 },
        ],
      },
      {
        nombre: 'Edificio D',
        clave: 'EDIF-D',
        pisos: 2,
        descripcion: 'Biblioteca Central y Auditorio Magno',
        activo: true,
        aulas: [
          { nombre: 'Biblioteca Central', piso: 1, tipo: 'area_comun', capacidad: 120 },
          { nombre: 'Auditorio Magno', piso: 1, tipo: 'auditorio', capacidad: 250 },
          { nombre: 'Sala de Cómputo Biblioteca', piso: 2, tipo: 'laboratorio', capacidad: 40, tiene_equipo_computo: true },
        ],
      },
    ];

    const edificiosCreados = await Edificio.insertMany(edificiosData);
    console.log(`   ✅ ${edificiosCreados.length} edificios creados`);

    // ─── 5. Insertar Incidencias Oficiales (Figuras 4, 5, 6 + Extras)
    console.log('📋 Insertando incidencias oficiales según el $jsonSchema estricto...');
    const incidenciasData = [
      // Figura 4: Cómputo y Telecomunicaciones (Resuelta)
      {
        codigo_incidencia: 'INC-20261014-COM-001',
        titulo: 'Caída total de red en Laboratorio de Redes',
        descripcion: 'El switch principal no asigna DHCP y no hay salida a internet.',
        categoria: 'computo_redes',
        prioridad: 'critica',
        estado: 'resuelta',
        horas_invertidas: 3,
        fecha_creacion: new Date('2026-10-14T08:30:00.000Z'),
        fecha_resolucion: new Date('2026-10-14T11:30:00.000Z'),
        tecnico_asignado: 'Téc. Mario Chan',
        reportante: {
          nombre: 'Mtro. Roberto Méndez',
          rol: 'Docente',
          correo: 'roberto.mendez@utmetropolitana.edu.mx',
        },
        ubicacion: {
          edificio: 'Edificio K',
          aula_espacio: 'Laboratorio 4',
        },
        detalle_especifico: {
          direccion_ip: '192.168.20.1',
          vlan: 'VLAN-20-LABS',
          puerto_uplink: 'Gi0/24',
          equipos_afectados: 28,
        },
        tags: ['switch', 'dhcp', 'fibra-optica'],
        historial_seguimiento: [
          {
            fecha: new Date('2026-10-14T08:30:00.000Z'),
            autor: 'Mtro. Roberto Méndez',
            estado_asignado: 'abierta',
            comentario: 'Reporte inicial generado por el usuario.',
          },
          {
            fecha: new Date('2026-10-14T11:30:00.000Z'),
            autor: 'Téc. Mario Chan',
            estado_asignado: 'resuelta',
            comentario: 'Se reinició el DHCP y se cambió el cable de uplink.',
          },
        ],
        evidencias_adjuntas: [
          {
            nombre_archivo: 'captura_dhcp.png',
            tipo_mime: 'image/png',
            peso_kb: 420,
            ruta_storage: 'INC-20261014-COM-001/captura_dhcp.png',
            url_storage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
            fecha_carga: new Date('2026-10-14T08:32:00.000Z'),
          },
        ],
      },
      // Figura 5: Infraestructura Física y Mantenimiento (En proceso)
      {
        codigo_incidencia: 'INC-20261016-INF-001',
        titulo: 'Filtración de agua en techo del Aula 12',
        descripcion: 'Con la lluvia cae agua por el plafón cerca del proyector.',
        categoria: 'infraestructura',
        prioridad: 'alta',
        estado: 'en_proceso',
        horas_invertidas: 1.5,
        fecha_creacion: new Date('2026-10-16T07:45:00.000Z'),
        tecnico_asignado: 'Téc. Luis Pech',
        reportante: {
          nombre: 'Lic. Andrea Cetina',
          rol: 'Administrativo',
          correo: 'andrea.cetina@utmetropolitana.edu.mx',
        },
        ubicacion: {
          edificio: 'Edificio B',
          aula_espacio: 'Aula 12',
        },
        detalle_especifico: {
          tipo_dano: 'filtracion_techo',
          nivel_riesgo: 'medio',
          requiere_contratista: true,
          insumos_requeridos: ['impermeabilizante', 'lamina_galvanizada'],
        },
        tags: ['filtracion', 'techo', 'lluvia'],
        historial_seguimiento: [
          {
            fecha: new Date('2026-10-16T07:45:00.000Z'),
            autor: 'Lic. Andrea Cetina',
            estado_asignado: 'abierta',
            comentario: 'Reporte inicial generado por el usuario.',
          },
          {
            fecha: new Date('2026-10-16T10:00:00.000Z'),
            autor: 'Téc. Luis Pech',
            estado_asignado: 'en_proceso',
            comentario: 'Se acordonó la zona y se pidió contratista para sellar.',
          },
        ],
        evidencias_adjuntas: [
          {
            nombre_archivo: 'goteras_aula12.jpg',
            tipo_mime: 'image/jpeg',
            peso_kb: 860,
            ruta_storage: 'INC-20261016-INF-001/goteras_aula12.jpg',
            url_storage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
            fecha_carga: new Date('2026-10-16T07:50:00.000Z'),
          },
        ],
      },
      // Figura 6: Sistemas y Servicios Académicos (Abierta)
      {
        codigo_incidencia: 'INC-20261019-ACA-001',
        titulo: 'Docentes sin acceso a la captura de calificaciones',
        descripcion: 'El portal marca error de sesión al asentar actas del periodo.',
        categoria: 'academico',
        prioridad: 'alta',
        estado: 'abierta',
        horas_invertidas: 0,
        fecha_creacion: new Date('2026-10-19T09:10:00.000Z'),
        reportante: {
          nombre: 'Mtra. Karla Dzul',
          rol: 'Docente',
          correo: 'karla.dzul@utmetropolitana.edu.mx',
        },
        ubicacion: {
          edificio: 'Edificio A',
          aula_espacio: 'Sala de docentes',
        },
        detalle_especifico: {
          plataforma: 'Portal de calificaciones',
          codigo_curso: 'BDN-301',
          periodo_escolar: 'Septiembre-Diciembre 2026',
          estudiantes_afectados: 38,
        },
        tags: ['portal', 'calificaciones', 'acceso'],
        historial_seguimiento: [
          {
            fecha: new Date('2026-10-19T09:10:00.000Z'),
            autor: 'Mtra. Karla Dzul',
            estado_asignado: 'abierta',
            comentario: 'Reporte inicial generado por el usuario.',
          },
        ],
        evidencias_adjuntas: [],
      },
      // Incidencia 4: Cómputo (En espera)
      {
        codigo_incidencia: 'INC-20261020-COM-002',
        titulo: 'Punto de acceso WiFi sin conexión en Auditorio Magno',
        descripcion: 'El access point AP-D02 parpadea en naranja y los estudiantes pierden conectividad.',
        categoria: 'computo_redes',
        prioridad: 'media',
        estado: 'en_espera',
        horas_invertidas: 1,
        fecha_creacion: new Date('2026-10-20T10:15:00.000Z'),
        tecnico_asignado: 'Téc. Mario Chan',
        reportante: {
          nombre: 'Carlos Santiago Euan Ayala',
          rol: 'Estudiante',
          correo: 'carlos.euan@alumnos.utmetropolitana.edu.mx',
        },
        ubicacion: {
          edificio: 'Edificio D',
          aula_espacio: 'Auditorio Magno',
        },
        detalle_especifico: {
          direccion_ip: '192.168.40.15',
          vlan: 'VLAN-40-WIFI',
          puerto_uplink: 'Gi0/12',
          equipos_afectados: 45,
        },
        tags: ['wifi', 'access-point', 'auditorio'],
        historial_seguimiento: [
          {
            fecha: new Date('2026-10-20T10:15:00.000Z'),
            autor: 'Carlos Santiago Euan Ayala',
            estado_asignado: 'abierta',
            comentario: 'Sin señal WiFi durante la conferencia.',
          },
          {
            fecha: new Date('2026-10-20T11:00:00.000Z'),
            autor: 'Téc. Mario Chan',
            estado_asignado: 'en_espera',
            comentario: 'En espera de cable PoE de repuesto del almacén.',
          },
        ],
        evidencias_adjuntas: [],
      },
      // Incidencia 5: Infraestructura (Resuelta)
      {
        codigo_incidencia: 'INC-20261021-INF-002',
        titulo: 'Falla de aire acondicionado mini-split en Edificio C',
        descripcion: 'El equipo de climatización no enfría y gotea sobre el escritorio.',
        categoria: 'infraestructura',
        prioridad: 'media',
        estado: 'resuelta',
        horas_invertidas: 2.5,
        fecha_creacion: new Date('2026-10-21T09:00:00.000Z'),
        fecha_resolucion: new Date('2026-10-21T13:30:00.000Z'),
        tecnico_asignado: 'Téc. Luis Pech',
        reportante: {
          nombre: 'Lic. Andrea Cetina',
          rol: 'Administrativo',
          correo: 'andrea.cetina@utmetropolitana.edu.mx',
        },
        ubicacion: {
          edificio: 'Edificio C',
          aula_espacio: 'Ventanillas Escolares',
        },
        detalle_especifico: {
          tipo_dano: 'climatizacion',
          nivel_riesgo: 'bajo',
          requiere_contratista: false,
          insumos_requeridos: ['gas_refrigerante_r410a', 'filtro'],
        },
        tags: ['climatizacion', 'aire-acondicionado', 'mantenimiento'],
        historial_seguimiento: [
          {
            fecha: new Date('2026-10-21T09:00:00.000Z'),
            autor: 'Lic. Andrea Cetina',
            estado_asignado: 'abierta',
            comentario: 'Reporte de falla en ventanilla.',
          },
          {
            fecha: new Date('2026-10-21T13:30:00.000Z'),
            autor: 'Téc. Luis Pech',
            estado_asignado: 'resuelta',
            comentario: 'Se limpiaron filtros y se recargó gas refrigerante.',
          },
        ],
        evidencias_adjuntas: [],
      },
    ];

    const incidenciasCreadas = await Incidencia.insertMany(incidenciasData);
    console.log(`   ✅ ${incidenciasCreadas.length} incidencias creadas validando con $jsonSchema`);

    console.log('\n═════════════════════════════════════════════════════════');
    console.log(' 🎉 SEED COMPLETADO EXITOSAMENTE');
    console.log('═════════════════════════════════════════════════════════');
    console.log('Credenciales de acceso:');
    console.log(' Admin:        admin@utm.mx       / admin123');
    console.log(' Coordinador:  coordinador@utm.mx / coord123');
    console.log(' Técnico Redes: mario.chan@utmetropolitana.edu.mx / tecnico123');
    console.log(' Técnico Mant:  luis.pech@utmetropolitana.edu.mx  / tecnico123');
    console.log(' Directivo:    directivo@utm.mx   / directivo123');
    console.log(' Alumno:       alumno@utm.mx      / utm123');
    console.log(' Docente:      roberto.mendez@utmetropolitana.edu.mx / utm123');
    console.log('═════════════════════════════════════════════════════════\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en el seed:', error);
    process.exit(1);
  }
};

seedDB();
