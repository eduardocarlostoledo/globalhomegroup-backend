require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const sequelize = require("./config/database");

const propiedadRoutes = require("./routes/propiedades.routes");
const planesRoutes = require("./routes/planes.routes");
const construccionRoutes = require("./routes/construccion.routes");

const app = express();

/* =========================================================
   🔐 SEGURIDAD (SIN ROMPER NADA)
========================================================= */

// Helmet SIN CSP (CSP va en frontend)
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

/* =========================================================
   🌐 CORS CONFIG (ROBUSTO)
========================================================= */

const normalize = (url) => url?.replace(/\/$/, "");

const ALLOWED_ORIGINS = [
  "https://globalhomegroup.com.ar",
  "https://www.globalhomegroup.com.ar",
  "https://globalhomegroup.netlify.app",
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3001",
].filter(Boolean).map(normalize);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Postman / server-to-server

      const normalizedOrigin = normalize(origin);

      if (ALLOWED_ORIGINS.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      console.warn("❌ CORS bloqueado:", origin);

      // 🔥 NO romper el server
      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

/* =========================================================
   🧰 MIDDLEWARES
========================================================= */

app.use(express.json());
app.use(morgan("dev")); // logs útiles en Railway

// Debug opcional (podés comentar después)
app.use((req, res, next) => {
  console.log("🌐 Origin:", req.headers.origin);
  next();
});

/* =========================================================
   🚀 ROUTES
========================================================= */

app.use("/api/propiedades", propiedadRoutes);
app.use("/api/planes", planesRoutes);
app.use("/api/construcciones", construccionRoutes);

/* =========================================================
   ❤️ HEALTH CHECK (clave para Railway)
========================================================= */

app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "globalhomegroup-backend",
  });
});

/* =========================================================
   ❌ MANEJO DE ERRORES GLOBAL
========================================================= */

app.use((err, req, res, next) => {
  console.error("🔥 ERROR GLOBAL:", err);

  res.status(500).json({
    error: "Error interno del servidor",
  });
});

/* =========================================================
   🗄️ DB + SERVER START
========================================================= */

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("🟢 DB conectada");

    // ⚠️ SOLO en desarrollo
    if (process.env.NODE_ENV !== "production") {
      await sequelize.sync({ alter: true });
      console.log("🟡 DB sync (dev)");
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    console.error("🔴 Error al iniciar servidor:", error);
    process.exit(1);
  }
};

startServer();