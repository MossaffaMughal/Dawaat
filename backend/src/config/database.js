import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL?.trim();
const supabaseUrl = process.env.SUPABASE_URL?.trim();
const poolerHost =
  process.env.SUPABASE_POOLER_HOST?.trim() ||
  "aws-0-eu-west-1.pooler.supabase.com";

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
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

const finalConnectionString = normalizeConnectionString(connectionString);
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
