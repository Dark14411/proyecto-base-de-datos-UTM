/**
 * config/db.js — Conexión a MongoDB Atlas (driver nativo)
 */
const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "utm_desk_nosql";

let client;
let db;

async function connectDB() {
  if (db) return db;

  client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  console.log(`✅ MongoDB conectado → DB: ${DB_NAME}`);
  return db;
}

function getDB() {
  if (!db) throw new Error("Base de datos no conectada. Llama a connectDB() primero.");
  return db;
}

function getClient() {
  return client;
}

module.exports = { connectDB, getDB, getClient };
