const { Sequelize } = require("sequelize");
require("dotenv").config();

const DEFAULT_CONNECT_TIMEOUT_MS = 10000;
const DEFAULT_DB_PORT = 5432;
const TRUTHY_VALUES = new Set(["1", "true", "yes", "on", "require", "required"]);

const normalizeBoolean = (value) =>
  TRUTHY_VALUES.has(String(value || "").trim().toLowerCase());

const getDatabaseUrl = () =>
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRESQL_URL ||
  process.env.DATABASE_PUBLIC_URL ||
  "";

const getDbConfig = () => ({
  host: process.env.DB_HOST || process.env.PGHOST || "",
  user: process.env.DB_USER || process.env.PGUSER || "",
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD || "",
  name: process.env.DB_NAME || process.env.PGDATABASE || "",
  port: Number.parseInt(process.env.DB_PORT || process.env.PGPORT || "", 10) || DEFAULT_DB_PORT,
});

const shouldUseSsl = () => {
  if (process.env.DB_SSL !== undefined) {
    return normalizeBoolean(process.env.DB_SSL);
  }

  if (process.env.PGSSLMODE) {
    return !["disable", "allow", "prefer"].includes(process.env.PGSSLMODE.toLowerCase());
  }

  return process.env.NODE_ENV === "production";
};

const buildSequelizeOptions = () => {
  const options = {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      connectTimeout:
        Number.parseInt(process.env.DB_CONNECT_TIMEOUT_MS || "", 10) || DEFAULT_CONNECT_TIMEOUT_MS,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  };

  if (shouldUseSsl()) {
    options.dialectOptions.ssl = {
      require: true,
      rejectUnauthorized: false,
    };
  }

  return options;
};

const getMissingDbEnvVars = () => {
  if (getDatabaseUrl()) {
    return [];
  }

  const config = getDbConfig();
  const requiredEntries = [
    ["DB_HOST/PGHOST", config.host],
    ["DB_USER/PGUSER", config.user],
    ["DB_PASSWORD/PGPASSWORD", config.password],
    ["DB_NAME/PGDATABASE", config.name],
    ["DB_PORT/PGPORT", config.port],
  ];

  return requiredEntries
    .filter(([, value]) => !value)
    .map(([label]) => label);
};

const createSequelizeInstance = () => {
  const databaseUrl = getDatabaseUrl();
  const options = buildSequelizeOptions();

  if (databaseUrl) {
    return new Sequelize(databaseUrl, options);
  }

  const config = getDbConfig();

  return new Sequelize(config.name, config.user, config.password, {
    ...options,
    host: config.host,
    port: config.port,
  });
};

const sequelize = createSequelizeInstance();

sequelize.getMissingDbEnvVars = getMissingDbEnvVars;

module.exports = sequelize;
