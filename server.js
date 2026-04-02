const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const propiedadRoutes = require('./routes/propiedades.routes');
const planesRoutes = require('./routes/planes.routes');
const construccionRoutes = require('./routes/construccion.routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/propiedades', propiedadRoutes);
app.use("/api/planes", planesRoutes);
app.use("/api/construcciones", construccionRoutes);

//Test DB y sincronización Sincronizá el modelo no forzando la tabla 
sequelize.sync({ force: false })
// Test DB y sincronización Sincronizá el modelo forzando la tabla   Borra y recrea todas las tablas
// sequelize.sync({ force: true  })
//Sincronizá el modelo para no borrar: (no recomendado en producción):
//sequelize.sync({ alter: true })

.then(() => {
  console.log('🟢 DB sincronizada');
  app.listen(3001, () => console.log('Servidor corriendo en http://localhost:3001'));
}).catch(err => {
  console.error('🔴 Error al conectar la DB:', err);
});

// require("dotenv").config();

// const express = require("express");
// const cors = require("cors");
// const helmet = require("helmet");
// const morgan = require("morgan");

// const sequelize = require("./config/database");

// const propiedadRoutes = require("./routes/propiedades.routes");
// const planesRoutes = require("./routes/planes.routes");
// const construccionRoutes = require("./routes/construccion.routes");

// const app = express();
// const PORT = process.env.PORT || 3001;
// const isDevelopment = process.env.NODE_ENV === "development";
// const DB_RETRY_DELAY_MS = Number.parseInt(process.env.DB_RETRY_DELAY_MS || "", 10) || 10000;
// const dbState = {
//   connected: false,
//   connecting: false,
//   lastError: null,
//   lastAttemptAt: null,
//   lastConnectedAt: null,
// };

// // Helmet without CSP because CSP is handled in the frontend.
// app.use(
//   helmet({
//     contentSecurityPolicy: false,
//   })
// );

// const normalize = (url) => url?.replace(/\/$/, "");

// const ALLOWED_ORIGINS = [
//   "https://globalhomegroup.com.ar",
//   "https://www.globalhomegroup.com.ar",
//   "https://globalhomegroup.netlify.app",
//   "https://main--globalhomegroup.netlify.app",
//   process.env.FRONTEND_URL,
//   ...(process.env.CORS_ORIGINS || "")
//     .split(",")
//     .map((origin) => origin.trim())
//     .filter(Boolean),
//   "http://localhost:5173",
//   "http://localhost:3001",
// ]
//   .filter(Boolean)
//   .map(normalize);

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       if (!origin) return callback(null, true);

//       const normalizedOrigin = normalize(origin);

//       if (ALLOWED_ORIGINS.includes(normalizedOrigin)) {
//         return callback(null, true);
//       }

//       console.warn("CORS bloqueado:", origin);
//       return callback(null, false);
//     },
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//   })
// );

// app.use(express.json());
// app.use(morgan("dev"));

// app.use((req, res, next) => {
//   console.log("Origin:", req.headers.origin);
//   next();
// });

// const getServiceStatus = () => ({
//   status: dbState.connected ? "ok" : "degraded",
//   service: "globalhomegroup-backend",
//   database: {
//     connected: dbState.connected,
//     connecting: dbState.connecting,
//     lastAttemptAt: dbState.lastAttemptAt,
//     lastConnectedAt: dbState.lastConnectedAt,
//     lastError: dbState.lastError,
//   },
// });

// const requireDatabaseConnection = (req, res, next) => {
//   if (dbState.connected) {
//     return next();
//   }

//   return res.status(503).json({
//     error: "Servicio temporalmente no disponible",
//     database: {
//       connected: false,
//       lastError: dbState.lastError,
//     },
//   });
// };

// app.get("/", (req, res) => {
//   res.status(200).json(getServiceStatus());
// });

// app.get("/healthz", (req, res) => {
//   res.status(200).json(getServiceStatus());
// });

// app.get("/readyz", (req, res) => {
//   res.status(dbState.connected ? 200 : 503).json(getServiceStatus());
// });

// app.use("/api", requireDatabaseConnection);
// app.use("/api/propiedades", propiedadRoutes);
// app.use("/api/planes", planesRoutes);
// app.use("/api/construcciones", construccionRoutes);

// app.use((err, req, res, next) => {
//   console.error("ERROR GLOBAL:", err);

//   res.status(500).json({
//     error: "Error interno del servidor",
//   });
// });

// const validateRequiredEnv = () => {
//   const missingVars = sequelize.getMissingDbEnvVars ? sequelize.getMissingDbEnvVars() : [];

//   if (missingVars.length > 0) {
//     throw new Error(`Faltan variables de entorno requeridas: ${missingVars.join(", ")}`);
//   }
// };

// const scheduleReconnect = () => {
//   setTimeout(() => {
//     connectToDatabase().catch((error) => {
//       console.error("Error inesperado al reintentar DB:", error);
//     });
//   }, DB_RETRY_DELAY_MS);
// };

// const connectToDatabase = async () => {
//   if (dbState.connecting || dbState.connected) {
//     return;
//   }

//   dbState.connecting = true;
//   dbState.lastAttemptAt = new Date().toISOString();

//   try {
//     validateRequiredEnv();
//     await sequelize.authenticate();
//     dbState.connected = true;
//     dbState.lastError = null;
//     dbState.lastConnectedAt = new Date().toISOString();
//     console.log("DB conectada");

//     if (isDevelopment) {
//       await sequelize.sync({ force: false });
//       console.log("DB sync (dev)");
//     }
//   } catch (error) {
//     dbState.connected = false;
//     dbState.lastError = error.message;
//     console.error("Error al conectar DB:", error.message);
//     scheduleReconnect();
//   } finally {
//     dbState.connecting = false;
//   }
// };

// const startServer = () => {
//   app.listen(PORT, () => {
//     console.log(`Server corriendo en puerto ${PORT}`);
//     connectToDatabase().catch((error) => {
//       console.error("Error inesperado al iniciar DB:", error);
//     });
//   });
// };

// startServer();
