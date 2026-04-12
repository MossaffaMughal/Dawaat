import pool from "../config/database.js";
import { ensureDatabaseSchema } from "./ensureSchema.js";
import { fixMissingAddresses } from "./fixMissingAddresses.js";

const migrate = async () => {
  try {
    console.log("Running migrations...");
    await ensureDatabaseSchema();

    // Optional: Fix missing addresses from previous orders
    console.log("\nFixing missing addresses in existing orders...");
    const addressFixResult = await fixMissingAddresses();
    console.log("Address fix result:", addressFixResult);

    console.log("\nAll migrations completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
};

migrate();
