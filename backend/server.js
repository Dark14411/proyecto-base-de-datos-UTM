/**
 * server.js — Punto de entrada del Backend
 * ═══════════════════════════════════════════════════════════════
 * UTM Desk NoSQL Cloud — API REST
 * ═══════════════════════════════════════════════════════════════
 */
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const { connectDB } = require("./config/db");
const { connectRedis } = require("./config/redis");
const incidenciasRoutes = require("./routes/incidencias");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middlewares Globales ───────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (uploads simulando Cloud Storage)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── Rutas ──────────────────────────────────────────────────────────────────
app.use("/api/incidencias", incidenciasRoutes);

// ─── Ruta de salud ──────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    servicio: "UTM Desk NoSQL Cloud API",
    timestamp: new Date().toISOString(),
  });
});

// ─── Manejo global de errores ───────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Error no manejado:", err);
  res.status(500).json({
    error: "Error interno del servidor",
    detalle: err.message,
  });
});

// ─── Iniciar servidor ───────────────────────────────────────────────────────
async function iniciar() {
  try {
    // Conectar a MongoDB
    await connectDB();

    // Conectar a Redis
    connectRedis();

    app.listen(PORT, () => {
      console.log(`\n═══════════════════════════════════════════════════`);
      console.log(`  🚀 UTM Desk NoSQL Cloud — API REST`);
      console.log(`  📡 Servidor corriendo en: http://localhost:${PORT}`);
      console.log(`  📦 Endpoints disponibles:`);
      console.log(`     POST   /api/incidencias`);
      console.log(`     POST   /api/incidencias/:id/evidencias`);
      console.log(`     PATCH  /api/incidencias/:id/seguimiento`);
      console.log(`     PATCH  /api/incidencias/:id/tags`);
      console.log(`     GET    /api/incidencias/buscar?q=texto`);
      console.log(`     GET    /api/incidencias/analitica`);
      console.log(`     GET    /api/incidencias`);
      console.log(`     GET    /api/incidencias/:id`);
      console.log(`     PUT    /api/incidencias/:id`);
      console.log(`     DELETE /api/incidencias/:id`);
      console.log(`═══════════════════════════════════════════════════\n`);
    });
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error);
    process.exit(1);
  }
}

iniciar();
