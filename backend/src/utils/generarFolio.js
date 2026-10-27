// ═══════════════════════════════════════════════════════════════
// utils/generarFolio.js — Generador atómico de folios con Redis INCR
// Cumple estrictamente con la ERS (Pág 9 y 11):
// - Clave Redis: contador:incidencias:AAAA-MM-DD:categoria
// - Formato Folio: INC-AAAAMMDD-CAT-NNN (COM | INF | ACA)
// ═══════════════════════════════════════════════════════════════
const { getRedisClient } = require('../config/redis');

/**
 * Mapeo de categorías al código corto de 3 letras según la especificación:
 * - computo_redes -> COM
 * - infraestructura -> INF
 * - academico -> ACA
 */
const CATEGORIA_A_CODIGO = {
  computo_redes: 'COM',
  infraestructura: 'INF',
  academico: 'ACA',
  sistemas_academicos: 'ACA', // compatibilidad
};

/**
 * Genera un folio único y consecutivo usando Redis INCR.
 * La clave en Redis es `contador:incidencias:AAAA-MM-DD:categoria`
 * Se usa INCR atómico para evitar folios repetidos con peticiones simultáneas.
 *
 * @param {string} categoria - Categoría de la incidencia ('computo_redes', 'infraestructura', 'academico')
 * @returns {Promise<string>} Folio con formato INC-AAAAMMDD-CAT-NNN
 */
const generarFolio = async (categoria) => {
  const redis = getRedisClient();

  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');

  const fechaIso = `${anio}-${mes}-${dia}`; // AAAA-MM-DD para la clave Redis
  const fechaCompacta = `${anio}${mes}${dia}`; // AAAAMMDD para el código

  const catNormalizada = categoria === 'sistemas_academicos' ? 'academico' : categoria;
  const codigoCat = CATEGORIA_A_CODIGO[catNormalizada] || 'COM';

  const claveRedis = `contador:incidencias:${fechaIso}:${catNormalizada}`;

  let consecutivo = 1;

  if (redis && redis.status === 'ready') {
    try {
      consecutivo = await redis.incr(claveRedis);
      if (consecutivo === 1) {
        // Mantener la clave por 48 horas de margen
        await redis.expire(claveRedis, 172800);
      }
    } catch (err) {
      console.warn('⚠️ Error al consultar Redis para folio, usando timestamp fallback:', err.message);
      consecutivo = Math.floor(Math.random() * 899) + 100;
    }
  } else {
    // Si Redis no está listo temporalmente, usar un fallback determinista
    const Incidencia = require('../models/Incidencia');
    const regexHoy = new RegExp(`^INC-${fechaCompacta}-${codigoCat}-`);
    const count = await Incidencia.countDocuments({ codigo_incidencia: regexHoy });
    consecutivo = count + 1;
  }

  const Incidencia = require('../models/Incidencia');
  let nnn = String(consecutivo).padStart(3, '0');
  let folio = `INC-${fechaCompacta}-${codigoCat}-${nnn}`;

  // Verificar si ya existe en MongoDB (por ejemplo tras reinicios o seeds)
  while (await Incidencia.exists({ codigo_incidencia: folio })) {
    if (redis && redis.status === 'ready') {
      try {
        consecutivo = await redis.incr(claveRedis);
      } catch (e) {
        consecutivo++;
      }
    } else {
      consecutivo++;
    }
    nnn = String(consecutivo).padStart(3, '0');
    folio = `INC-${fechaCompacta}-${codigoCat}-${nnn}`;
  }

  return folio;
};

module.exports = generarFolio;
