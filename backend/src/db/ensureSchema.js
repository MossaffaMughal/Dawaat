import pool from "../config/database.js";

export const ensureDatabaseSchema = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255),
      name VARCHAR(255),
      phone VARCHAR(20),
      address TEXT,
      city VARCHAR(100),
      postal_code VARCHAR(20),
      is_admin BOOLEAN DEFAULT false,
      google_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      category VARCHAR(100) NOT NULL,
      in_stock BOOLEAN DEFAULT true,
      stock_quantity INTEGER DEFAULT 999,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Add stock_quantity column if it doesn't exist (migration for existing databases)
  await pool.query(`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 999;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_images (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      image_url VARCHAR(255) NOT NULL,
      alt_text VARCHAR(255),
      display_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cart (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      session_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id SERIAL PRIMARY KEY,
      cart_id INTEGER NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_number VARCHAR(50) UNIQUE NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      customer_email VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(20),
      address TEXT,
      city VARCHAR(100),
      postal_code VARCHAR(20),
      total_amount DECIMAL(10, 2) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      payment_method VARCHAR(50),
      shipping_method VARCHAR(50),
      notes TEXT,
      shipping_cost DECIMAL(10, 2) DEFAULT 0,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      product_name VARCHAR(255) NOT NULL,
      quantity INTEGER NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      variant VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    ALTER TABLE order_items
    ALTER COLUMN product_id DROP NOT NULL;
  `);

  await pool.query(`
    DO $$
    DECLARE
      fk_name text;
    BEGIN
      SELECT tc.constraint_name
      INTO fk_name
      FROM information_schema.table_constraints tc
      WHERE tc.table_schema = 'public'
        AND tc.table_name = 'order_items'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND tc.constraint_name LIKE '%product_id%';

      IF fk_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE order_items DROP CONSTRAINT %I', fk_name);
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        WHERE tc.table_schema = 'public'
          AND tc.table_name = 'order_items'
          AND tc.constraint_name = 'order_items_product_id_fkey'
      ) THEN
        ALTER TABLE order_items
        ADD CONSTRAINT order_items_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
      END IF;
    END $$;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      message TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'new',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wishlist (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      key VARCHAR(100) UNIQUE NOT NULL,
      value VARCHAR(255) NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    SELECT setval(
      pg_get_serial_sequence('settings', 'id'),
      GREATEST(COALESCE((SELECT MAX(id) FROM settings), 1), 1),
      true
    );
  `);

  await pool.query(`
    INSERT INTO settings (key, value)
    VALUES ('shipping_cost', '250')
    ON CONFLICT (key) DO NOTHING;
  `);
};
