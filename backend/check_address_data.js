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

console.log(`\n📦 Database source: ${connectionSource || "unresolved"}`);
console.log(
  `Connection string snippet: ${resolvedConnectionString?.substring(0, 50)}...`,
);

const normalizeConnectionString = (rawConnectionString) => {
  try {
    const dbUrl = new URL(rawConnectionString);
    let projectRef = null;
    if (supabaseUrl) {
      try {
        projectRef = new URL(supabaseUrl).host.split(".")[0] || null;
      } catch {
        projectRef = null;
      }
    }

    if (
      projectRef &&
      dbUrl.hostname.includes("pooler.supabase.com") &&
      dbUrl.username === "postgres"
    ) {
      dbUrl.username = `postgres.${projectRef}`;
    }

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

const explicitSsl = process.env.DB_SSL;
const shouldUseSsl = explicitSsl
  ? explicitSsl.toLowerCase() === "true"
  : process.env.NODE_ENV === "production";

const poolConfig = {
  connectionString: finalConnectionString,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

const pool = new Pool(poolConfig);

async function checkAddressData() {
  try {
    console.log("\n🔍 Connecting to database...");
    const client = await pool.connect();
    console.log("✅ Connected successfully!\n");

    // Execute the query
    const query = `SELECT order_number, customer_name, address, city, postal_code, created_at 
                   FROM orders 
                   ORDER BY created_at DESC 
                   LIMIT 10`;

    console.log("📋 Executing query:\n", query);
    console.log("\n" + "=".repeat(100) + "\n");

    const result = await client.query(query);

    console.log(`📊 Found ${result.rows.length} orders\n`);

    if (result.rows.length === 0) {
      console.log("⚠️  No orders found in the database.");
    } else {
      result.rows.forEach((row, index) => {
        console.log(`Order ${index + 1}:`);
        console.log(`  Order Number: ${row.order_number}`);
        console.log(`  Customer Name: ${row.customer_name}`);
        console.log(
          `  Address: ${row.address === null ? "NULL" : row.address === "" ? "EMPTY STRING" : `"${row.address}"`}`,
        );
        console.log(`  City: ${row.city === null ? "NULL" : `"${row.city}"`}`);
        console.log(
          `  Postal Code: ${row.postal_code === null ? "NULL" : `"${row.postal_code}"`}`,
        );
        console.log(`  Created At: ${row.created_at}`);
        console.log();
      });
    }

    console.log("=".repeat(100) + "\n");

    // Check schema and column information
    console.log("📋 Checking orders table structure...\n");
    const schemaQuery = `SELECT column_name, data_type, is_nullable 
                        FROM information_schema.columns 
                        WHERE table_name = 'orders' 
                        ORDER BY ordinal_position`;
    const schemaResult = await client.query(schemaQuery);

    console.log("Orders table columns:");
    schemaResult.rows.forEach((col) => {
      console.log(
        `  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`,
      );
    });

    client.release();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  }
}

checkAddressData();
