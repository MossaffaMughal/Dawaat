import pool from "../config/database.js";

const main = async () => {
  const localResult = await pool.query(
    `SELECT COUNT(1)::int AS count
     FROM product_images
     WHERE image_url ILIKE '%localhost:5000/products/%'
        OR image_url ILIKE '%127.0.0.1:5000/products/%'
        OR image_url LIKE '/products/%'`,
  );

  const supabaseResult = await pool.query(
    `SELECT COUNT(1)::int AS count
     FROM product_images
     WHERE image_url ILIKE '%supabase.co/storage/v1/object/public/products/%'`,
  );

  console.log(`local_url_count=${localResult.rows[0].count}`);
  console.log(`supabase_url_count=${supabaseResult.rows[0].count}`);
};

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
