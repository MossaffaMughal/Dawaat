import pool from "../config/database.js";

export const getAllProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sortBy } = req.query;
    let query = `
      SELECT p.*, 
             json_agg(
               json_build_object('id', pi.id, 'image_url', pi.image_url, 'alt_text', pi.alt_text, 'display_order', pi.display_order)
               ORDER BY pi.display_order ASC, pi.id ASC
             ) 
             FILTER (WHERE pi.id IS NOT NULL) as images
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Category filter
    if (category) {
      query += ` AND p.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    // Search by name or description
    if (search) {
      query += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Price range filter
    if (minPrice !== undefined) {
      query += ` AND p.price >= $${paramCount}`;
      params.push(parseInt(minPrice));
      paramCount++;
    }

    if (maxPrice !== undefined) {
      query += ` AND p.price <= $${paramCount}`;
      params.push(parseInt(maxPrice));
      paramCount++;
    }

    query += " GROUP BY p.id";

    // Sorting
    if (sortBy === "price_asc") {
      query += " ORDER BY p.price ASC";
    } else if (sortBy === "price_desc") {
      query += " ORDER BY p.price DESC";
    } else if (sortBy === "newest") {
      query += " ORDER BY p.created_at DESC";
    } else {
      query += " ORDER BY p.id";
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get products error:", error);
    res
      .status(500)
      .json({ message: "Error fetching products", error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT p.*, 
              json_agg(
                json_build_object('id', pi.id, 'image_url', pi.image_url, 'alt_text', pi.alt_text, 'display_order', pi.display_order)
                ORDER BY pi.display_order ASC, pi.id ASC
              ) 
              FILTER (WHERE pi.id IS NOT NULL) as images
       FROM products p
       LEFT JOIN product_images pi ON p.id = pi.product_id
       WHERE p.id = $1
       GROUP BY p.id`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get product by id error:", error);
    res
      .status(500)
      .json({ message: "Error fetching product", error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    console.log("[createProduct] Raw request body:", req.body);
    let { name, description, price, category, in_stock } = req.body;

    // Ensure price is a number
    price = parseInt(price, 10);
    if (isNaN(price)) {
      return res.status(400).json({ error: "Price must be a valid number" });
    }
    console.log("[createProduct] Parsed price:", price, "Type:", typeof price);

    const result = await pool.query(
      "INSERT INTO products (name, description, price, category, in_stock) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, description, price, category, in_stock !== false],
    );

    res.status(201).json({
      message: "Product created successfully",
      product: result.rows[0],
    });
  } catch (error) {
    console.error("Create product error:", error);
    res
      .status(500)
      .json({ message: "Error creating product", error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let { name, description, price, category, in_stock } = req.body;

    console.log("[updateProduct] Raw request body:", req.body);

    // Ensure price is a number if provided
    if (price !== undefined) {
      price = parseInt(price, 10);
      if (isNaN(price)) {
        return res.status(400).json({ error: "Price must be a valid number" });
      }
      console.log(
        "[updateProduct] Parsed price:",
        price,
        "Type:",
        typeof price,
      );
    }

    // Build dynamic update query for partial updates
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }
    if (price !== undefined) {
      updates.push(`price = $${paramCount}`);
      values.push(price);
      paramCount++;
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount}`);
      values.push(category);
      paramCount++;
    }
    if (in_stock !== undefined) {
      updates.push(`in_stock = $${paramCount}`);
      values.push(in_stock !== false);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE products SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      message: "Product updated successfully",
      product: result.rows[0],
    });
  } catch (error) {
    console.error("Update product error:", error);
    res
      .status(500)
      .json({ message: "Error updating product", error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const productCheck = await pool.query(
      "SELECT id FROM products WHERE id = $1",
      [id],
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if product is in any active orders (pending, processing, shipped)
    const activeOrdersCheck = await pool.query(
      `SELECT COUNT(*) as count FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.product_id = $1 AND o.status IN ('pending', 'processing', 'shipped')`,
      [id],
    );

    if (parseInt(activeOrdersCheck.rows[0].count, 10) > 0) {
      return res.status(400).json({
        message: "Cannot delete product: it is part of active orders",
      });
    }

    // Safe to delete: removes from product_images (cascade), wishlist (cascade), and orphaned cart/order items
    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING id",
      [id],
    );

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res
      .status(500)
      .json({ message: "Error deleting product", error: error.message });
  }
};

export const addProductImage = async (req, res) => {
  try {
    const { productId, imageUrl, altText, displayOrder } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: "imageUrl is required" });
    }

    const normalizedUrl = String(imageUrl).trim();
    const isLocalProductsPath =
      normalizedUrl.includes("localhost:5000/products/") ||
      normalizedUrl.startsWith("/products/") ||
      normalizedUrl.includes("127.0.0.1:5000/products/");

    if (isLocalProductsPath) {
      return res.status(400).json({
        message:
          "Local product image URLs are not allowed. Upload images through Supabase and use the returned public URL.",
      });
    }

    const result = await pool.query(
      "INSERT INTO product_images (product_id, image_url, alt_text, display_order) VALUES ($1, $2, $3, $4) RETURNING *",
      [productId, normalizedUrl, altText, displayOrder || 0],
    );

    res.status(201).json({
      message: "Image added successfully",
      image: result.rows[0],
    });
  } catch (error) {
    console.error("Add product image error:", error);
    res
      .status(500)
      .json({ message: "Error adding image", error: error.message });
  }
};

export const deleteProductImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const result = await pool.query(
      "DELETE FROM product_images WHERE id = $1 RETURNING id",
      [imageId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Delete product image error:", error);
    res
      .status(500)
      .json({ message: "Error deleting image", error: error.message });
  }
};
