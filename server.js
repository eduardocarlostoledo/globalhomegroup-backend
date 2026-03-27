require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const propiedadRoutes = require('./routes/propiedades.routes');
const planesRoutes = require('./routes/planes.routes');
const construccionRoutes = require('./routes/construccion.routes');

const app = express();

const ALLOWED_ORIGINS = [
  // Dominio custom
  'https://globalhomegroup.com.ar',
  'https://www.globalhomegroup.com.ar',
  // Frontend Netlify (fallback directo)
  'https://globalhomegroup.netlify.app',
  // Variable de entorno (Railway)
  process.env.FRONTEND_URL,
  // Backend Railway (health checks, inter-service)
  'https://globalhomegroup-backend-production.up.railway.app',
  // Cloudinary webhooks
  'https://api.cloudinary.com',
  // Desarrollo local
  'http://localhost:5173',
  'http://localhost:3001',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origen no permitido — ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());
app.use('/api/propiedades', propiedadRoutes);
app.use("/api/planes", planesRoutes);
app.use("/api/construcciones", construccionRoutes);

// Sincronización DB (no forzar en producción)
sequelize.sync({ alter: true })
  .then(() => {
    const PORT = process.env.PORT || 3001;
    console.log('🟢 DB sincronizada');
    app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
  })
  .catch(err => {
    console.error('🔴 Error al conectar la DB:', err);
  });
