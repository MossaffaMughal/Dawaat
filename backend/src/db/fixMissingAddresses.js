import pool from "../config/database.js";

/**
 * Migration script to fix orders with missing addresses
 * This script will:
 * 1. Find orders with NULL or empty addresses
 * 2. Attempt to populate missing city/postal_code from user profiles if available
 * 3. Log orders that still lack addresses after attempts
 */
export const fixMissingAddresses = async () => {
  const client = await pool.connect();
  try {
    console.log("Starting address migration...");

    // Get all orders with missing or empty addresses
    const result = await client.query(`
      SELECT o.id, o.order_number, o.user_id, o.customer_name, o.city, o.postal_code,
             u.address as user_address, u.city as user_city, u.postal_code as user_postal_code
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.address IS NULL OR o.address = ''
      ORDER BY o.created_at DESC
    `);

    console.log(`Found ${result.rows.length} orders with missing addresses`);

    if (result.rows.length === 0) {
      console.log("All orders have addresses!");
      return {
        success: true,
        updatedCount: 0,
        message: "No orders needed fixing",
      };
    }

    let updatedCount = 0;

    // For each order with missing address, try to fill from user profile
    for (const order of result.rows) {
      let updateQuery = null;
      let params = null;

      if (order.user_address) {
        // User has an address in their profile - use it
        updateQuery = `
          UPDATE orders 
          SET address = COALESCE(NULLIF($1, ''), address),
              city = COALESCE(NULLIF($2, ''), city),
              postal_code = COALESCE(NULLIF($3, ''), postal_code),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
        `;
        params = [
          order.user_address,
          order.user_city || order.city || "Not provided",
          order.user_postal_code || order.postal_code || "Not provided",
          order.id,
        ];
      } else {
        // No user address available - set default values
        updateQuery = `
          UPDATE orders 
          SET address = COALESCE(NULLIF($1, ''), 'Delivery Address Not Provided'),
              city = COALESCE(NULLIF($2, ''), 'Pending'),
              postal_code = COALESCE(NULLIF($3, ''), 'Pending'),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
        `;
        params = [
          "Delivery Address Not Provided",
          order.city || "Pending",
          order.postal_code || "Pending",
          order.id,
        ];
      }

      try {
        await client.query(updateQuery, params);
        updatedCount++;
        console.log(`✓ Updated order ${order.order_number}`);
      } catch (err) {
        console.error(
          `✗ Failed to update order ${order.order_number}:`,
          err.message,
        );
      }
    }

    console.log(`Migration complete. Updated ${updatedCount} orders`);
    return {
      success: true,
      updatedCount,
      message: `Successfully updated ${updatedCount} orders with missing addresses`,
    };
  } catch (error) {
    console.error("Address migration error:", error);
    throw error;
  } finally {
    client.release();
  }
};

// Run the migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixMissingAddresses()
    .then((result) => {
      console.log("\nMigration Result:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}
