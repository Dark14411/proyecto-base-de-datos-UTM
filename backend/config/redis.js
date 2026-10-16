/**
 * config/redis.js — Conexión a Redis con ioredis
 */
const Redis = require("ioredis");

let redis;

function connectRedis() {
  if (redis) return redis;

  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
      retryStrategy(times) {
        const delay = Math.min(times * 200, 5000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });
  } else {
    const options = {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      retryStrategy(times) {
        const delay = Math.min(times * 200, 5000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    };

    if (process.env.REDIS_PASSWORD) {
      options.password = process.env.REDIS_PASSWORD;
    }

    redis = new Redis(options);
  }

  redis.on("connect", () => console.log("✅ Redis conectado"));
  redis.on("error", (err) => console.error("❌ Redis error:", err.message));

  return redis;
}

function getRedis() {
  if (!redis) throw new Error("Redis no conectado. Llama a connectRedis() primero.");
  return redis;
}

module.exports = { connectRedis, getRedis };
