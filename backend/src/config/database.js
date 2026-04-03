import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

const dbHost = process.env.DB_HOST;
const explicitSsl = process.env.DB_SSL;
const shouldUseSsl = explicitSsl
  ? explicitSsl.toLowerCase() === "true"
  : Boolean(
      dbHost?.includes("supabase.com") || process.env.NODE_ENV === "production",
    );

const pool = new Pool({
  host: dbHost,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

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
