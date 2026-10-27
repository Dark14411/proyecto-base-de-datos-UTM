// ═══════════════════════════════════════════════════════════════
// server.js — Punto de entrada del Backend
// Sistema Integral de Gestión de Incidencias en el Campus – UTM
// ═══════════════════════════════════════════════════════════════
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./config/database');
const { connectRedis } = require('./config/redis');

// ─── Importar rutas ───────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const incidenciaRoutes = require('./routes/incidenciaRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const edificioRoutes = require('./routes/edificioRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middlewares globales ─────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origen (Postman, curl) o cualquier localhost
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    callback(null, true);
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Ruta de salud ────────────────────────────────────────────
app.get('/api/salud', (req, res) => {
  res.json({
    exito: true,
    mensaje: '🏛️ UTM Desk NoSQL — API activa',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── Montar rutas ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/incidencias', incidenciaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/edificios', edificioRoutes);

// ─── Manejo de ruta no encontrada ─────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    exito: false,
    mensaje: `Ruta ${req.originalUrl} no encontrada.`,
  });
});

// ─── Manejo global de errores ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    exito: false,
    mensaje: err.message || 'Error interno del servidor.',
  });
});

// ─── Iniciar servidor ─────────────────────────────────────────
const iniciar = async () => {
  // Conectar a MongoDB Atlas
  await connectDB();

  // Conectar a Redis (contador de folios)
  connectRedis();

  app.listen(PORT, () => {
    console.log(`\n🚀 UTM Desk NoSQL — Backend corriendo en puerto ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api/salud`);
    console.log(`🗄️  Base de datos: ${process.env.DB_NAME}`);
    console.log('─'.repeat(50));
  });
};

iniciar().catch((err) => {
  console.error('❌ Error al iniciar el servidor:', err);
  process.exit(1);
});
