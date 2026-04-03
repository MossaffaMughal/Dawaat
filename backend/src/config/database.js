import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL?.trim();
const dbHost = process.env.DB_HOST?.trim();
const dbPort = process.env.DB_PORT || 5432;
const dbName = process.env.DB_NAME || "postgres";
const dbUser = process.env.DB_USER?.trim();
const dbPassword = process.env.DB_PASSWORD;
const supabaseUrl = process.env.SUPABASE_URL?.trim();

let derivedConnectionString = null;
if (!connectionString && supabaseUrl && dbPassword) {
  try {
    const supabaseHost = new URL(supabaseUrl).host;
    const projectRef = supabaseHost.split(".")[0];
    if (projectRef) {
      const derivedHost = `db.${projectRef}.supabase.co`;
      const derivedUser = dbUser || "postgres";
      const encodedPassword = encodeURIComponent(dbPassword);
      derivedConnectionString = `postgresql://${derivedUser}:${encodedPassword}@${derivedHost}:${dbPort}/${dbName}`;
    }
  } catch {
    // Keep config unchanged if SUPABASE_URL is malformed.
  }
}

const finalConnectionString = connectionString || derivedConnectionString;
const explicitSsl = process.env.DB_SSL;
const shouldUseSsl = explicitSsl
  ? explicitSsl.toLowerCase() === "true"
  : Boolean(
      dbHost?.includes("supabase.com") ||
      dbHost?.includes("supabase.co") ||
      finalConnectionString?.includes("supabase.co") ||
      finalConnectionString?.includes("supabase.com") ||
      process.env.NODE_ENV === "production",
    );

const poolConfig = finalConnectionString
  ? {
      connectionString: finalConnectionString,
      ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }
  : {
      host: dbHost,
      port: dbPort,
      database: dbName,
      user: dbUser,
      password: dbPassword,
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
