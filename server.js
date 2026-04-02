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
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "0.0.0.0";
const isDevelopment = process.env.NODE_ENV === "development";
const DB_RETRY_DELAY_MS = Number.parseInt(process.env.DB_RETRY_DELAY_MS || "", 10) || 10000;
const DB_HEALTHCHECK_INTERVAL_MS =
  Number.parseInt(process.env.DB_HEALTHCHECK_INTERVAL_MS || "", 10) || 60000;

const dbState = {
  connected: false,
  connecting: false,
  lastError: null,
  lastAttemptAt: null,
  lastConnectedAt: null,
};

let server = null;
let reconnectTimer = null;

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

const normalize = (url) => url?.replace(/\/$/, "");

const ALLOWED_ORIGINS = [
  "https://globalhomegroup.com.ar",
  "https://www.globalhomegroup.com.ar",
  "https://globalhomegroup.netlify.app",
  "https://helpful-grace-production-4a12.up.railway.app",
  process.env.FRONTEND_URL,
  ...(process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  "http://localhost:5173",
  "http://localhost:3001",
]
  .filter(Boolean)
  .map(normalize);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const normalizedOrigin = normalize(origin);

    if (ALLOWED_ORIGINS.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.warn("CORS bloqueado:", origin);
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Accept", "Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("dev"));

const getServiceStatus = () => ({
  status: dbState.connected ? "ok" : "degraded",
  service: "globalhomegroup-backend",
  database: {
    connected: dbState.connected,
    connecting: dbState.connecting,
    lastAttemptAt: dbState.lastAttemptAt,
    lastConnectedAt: dbState.lastConnectedAt,
    lastError: dbState.lastError,
  },
});

const requireDatabaseConnection = (req, res, next) => {
  if (dbState.connected) {
    return next();
  }

  return res.status(503).json({
    error: "Servicio temporalmente no disponible",
    database: {
      connected: false,
      lastError: dbState.lastError,
    },
  });
};

const markDatabaseDisconnected = (reason) => {
  dbState.connected = false;
  dbState.lastError = reason || dbState.lastError;
};

app.get("/", (req, res) => {
  res.status(200).json(getServiceStatus());
});

app.get("/healthz", (req, res) => {
  res.status(200).json(getServiceStatus());
});

app.get("/readyz", (req, res) => {
  res.status(dbState.connected ? 200 : 503).json(getServiceStatus());
});

app.use("/api", requireDatabaseConnection);
app.use("/api/propiedades", propiedadRoutes);
app.use("/api/planes", planesRoutes);
app.use("/api/construcciones", construccionRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    path: req.originalUrl,
  });
});

app.use((err, req, res, next) => {
  console.error("ERROR GLOBAL:", err);

  res.status(err.statusCode || err.status || 500).json({
    error: err.expose ? err.message : "Error interno del servidor",
  });
});

const validateRequiredEnv = () => {
  const missingVars = sequelize.getMissingDbEnvVars ? sequelize.getMissingDbEnvVars() : [];

  if (missingVars.length > 0) {
    throw new Error(`Faltan variables de entorno requeridas: ${missingVars.join(", ")}`);
  }
};

const scheduleReconnect = () => {
  if (reconnectTimer) {
    return;
  }

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectToDatabase().catch((error) => {
      console.error("Error inesperado al reintentar DB:", error);
    });
  }, DB_RETRY_DELAY_MS);
};

const connectToDatabase = async () => {
  if (dbState.connecting || dbState.connected) {
    return;
  }

  dbState.connecting = true;
  dbState.lastAttemptAt = new Date().toISOString();

  try {
    validateRequiredEnv();
    await sequelize.authenticate();
    dbState.connected = true;
    dbState.lastError = null;
    dbState.lastConnectedAt = new Date().toISOString();

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    console.log("DB conectada");

    if (isDevelopment) {
      await sequelize.sync({ force: false });
      console.log("DB sync (dev)");
    }
  } catch (error) {
    markDatabaseDisconnected(error.message);
    console.error("Error al conectar DB:", error.message);
    scheduleReconnect();
  } finally {
    dbState.connecting = false;
  }
};

const startDatabaseHealthcheck = () => {
  setInterval(async () => {
    if (dbState.connecting) {
      return;
    }

    try {
      await sequelize.authenticate();
      if (!dbState.connected) {
        dbState.connected = true;
        dbState.lastError = null;
        dbState.lastConnectedAt = new Date().toISOString();
        console.log("DB reconectada");
      }
    } catch (error) {
      if (dbState.connected) {
        console.error("DB desconectada:", error.message);
      }
      markDatabaseDisconnected(error.message);
      scheduleReconnect();
    }
  }, DB_HEALTHCHECK_INTERVAL_MS);
};

const startServer = () => {
  server = app.listen(PORT, HOST, () => {
    console.log(`Server corriendo en ${HOST}:${PORT}`);
    connectToDatabase().catch((error) => {
      console.error("Error inesperado al iniciar DB:", error);
    });
  });

  server.on("error", (error) => {
    console.error("Error del servidor HTTP:", error);
  });
};

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM recibido, cerrando servidor...");
  server?.close(() => {
    console.log("Servidor HTTP detenido");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT recibido, cerrando servidor...");
  server?.close(() => {
    console.log("Servidor HTTP detenido");
    process.exit(0);
  });
});

startServer();
startDatabaseHealthcheck();
