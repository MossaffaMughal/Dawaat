import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

const firstDefined = (...values) =>
  values.map((value) => value?.trim()).find(Boolean) || null;

const connectionString = firstDefined(
  process.env.DATABASE_URL,
  process.env.POSTGRES_URL_NON_POOLING,
  process.env.POSTGRES_URL,
  process.env.SUPABASE_DB_URL,
  process.env.SUPABASE_POSTGRES_URL,
);

const hasLegacyDbConfig =
  process.env.DB_HOST &&
  process.env.DB_PORT &&
  process.env.DB_NAME &&
  process.env.DB_USER;

const legacyConnectionString = hasLegacyDbConfig
  ? `postgresql://${encodeURIComponent(process.env.DB_USER)}:${encodeURIComponent(
      process.env.DB_PASSWORD || "",
    )}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
  : null;

const resolvedConnectionString = connectionString || legacyConnectionString;
const supabaseUrl = process.env.SUPABASE_URL?.trim();
const poolerHost =
  process.env.SUPABASE_POOLER_HOST?.trim() ||
  "aws-0-eu-west-1.pooler.supabase.com";

const connectionSource = connectionString
  ? process.env.DATABASE_URL?.trim()
    ? "DATABASE_URL"
    : process.env.POSTGRES_URL_NON_POOLING?.trim()
      ? "POSTGRES_URL_NON_POOLING"
      : process.env.POSTGRES_URL?.trim()
        ? "POSTGRES_URL"
        : process.env.SUPABASE_DB_URL?.trim()
          ? "SUPABASE_DB_URL"
          : process.env.SUPABASE_POSTGRES_URL?.trim()
            ? "SUPABASE_POSTGRES_URL"
            : "UNKNOWN"
  : hasLegacyDbConfig
    ? "DB_HOST/DB_PORT/DB_NAME/DB_USER"
    : null;

if (!resolvedConnectionString) {
  throw new Error(
    "Database config missing. Set DATABASE_URL, POSTGRES_URL, POSTGRES_URL_NON_POOLING, SUPABASE_DB_URL, or legacy DB_HOST, DB_PORT, DB_NAME, DB_USER.",
  );
}

let projectRef = null;
if (supabaseUrl) {
  try {
    projectRef = new URL(supabaseUrl).host.split(".")[0] || null;
  } catch {
    projectRef = null;
  }
}

const normalizeConnectionString = (rawConnectionString) => {
  try {
    const dbUrl = new URL(rawConnectionString);

    // Supabase pooler requires postgres.<projectRef> as tenant-aware username.
    if (
      projectRef &&
      dbUrl.hostname.includes("pooler.supabase.com") &&
      dbUrl.username === "postgres"
    ) {
      dbUrl.username = `postgres.${projectRef}`;
    }

    // Direct DB host can fail in serverless environments; use pooler in production.
    if (
      process.env.NODE_ENV === "production" &&
      projectRef &&
      dbUrl.hostname === `db.${projectRef}.supabase.co`
    ) {
      dbUrl.hostname = poolerHost;
      if (dbUrl.username === "postgres") {
        dbUrl.username = `postgres.${projectRef}`;
      }
    }

    return dbUrl.toString();
  } catch {
    return rawConnectionString;
  }
};

const finalConnectionString = normalizeConnectionString(
  resolvedConnectionString,
);

if (process.env.NODE_ENV !== "test") {
  console.log(
    `📦 Database source: ${connectionSource || "unresolved"} | mode=${process.env.NODE_ENV || "development"}`,
  );
}
const explicitSsl = process.env.DB_SSL;
const shouldUseSsl = explicitSsl
  ? explicitSsl.toLowerCase() === "true"
  : process.env.NODE_ENV === "production";

const poolConfig = {
  connectionString: finalConnectionString,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

const pool = new Pool(poolConfig);

export const testDatabaseConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Supabase PostgreSQL connected successfully!");
    client.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    return false;
  }
};

export default pool;
