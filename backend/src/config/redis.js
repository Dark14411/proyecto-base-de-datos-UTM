// ═══════════════════════════════════════════════════════════════
// config/redis.js — Conexión a Redis (Contador atómico de folios)
// ═══════════════════════════════════════════════════════════════
const Redis = require('ioredis');

let redisClient = null;

const connectRedis = () => {
  try {
    const url = process.env.REDIS_URL;
    const isTls = url && url.startsWith('rediss://');

    const options = {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 500,
    };

    if (isTls) {
      options.tls = { rejectUnauthorized: false };
    }

    redisClient = new Redis(url, options);

    redisClient.on('connect', () => {
      console.log('✅ Redis conectado (contador atómico de folios)');
    });

    redisClient.on('error', (err) => {
      console.error(`⚠️ Advertencia de Redis: ${err.message}`);
    });

    return redisClient;
  } catch (error) {
    console.error(`❌ No se pudo conectar a Redis: ${error.message}`);
    return null;
  }
};

const getRedisClient = () => redisClient;

module.exports = { connectRedis, getRedisClient };
