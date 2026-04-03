import pool from "../config/database.js";
import { ensureDatabaseSchema } from "./ensureSchema.js";

const migrate = async () => {
  try {
    console.log("Running migrations...");
    await ensureDatabaseSchema();

    console.log("All migrations completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
};

migrate();
