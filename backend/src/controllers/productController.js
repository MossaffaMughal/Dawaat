import pool from "../config/database.js";

export const getAllProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sortBy } = req.query;

    console.log("getAllProducts called with filters:", {
      category,
      search,
      minPrice,
      maxPrice,
      sortBy,
    });

    let query = `
      SELECT p.*, 
             COALESCE(p.sale_price, p.price) AS current_price,
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
      query += ` AND LOWER(TRIM(p.category)) = LOWER(TRIM($${paramCount}))`;
      params.push(category);
      console.log(`Adding category filter: p.category = '${category}'`);
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
      query += ` AND COALESCE(p.sale_price, p.price) >= $${paramCount}`;
      params.push(parseInt(minPrice));
      paramCount++;
    }

    if (maxPrice !== undefined) {
      query += ` AND COALESCE(p.sale_price, p.price) <= $${paramCount}`;
      params.push(parseInt(maxPrice));
      paramCount++;
    }

    query += " GROUP BY p.id";

    // Sorting (default by sort_order within category)
    if (sortBy === "price_asc") {
      query += " ORDER BY COALESCE(p.sale_price, p.price) ASC";
    } else if (sortBy === "price_desc") {
      query += " ORDER BY COALESCE(p.sale_price, p.price) DESC";
    } else if (sortBy === "newest") {
      query += " ORDER BY p.created_at DESC";
    } else {
      query += " ORDER BY p.sort_order ASC, p.id ASC";
    }

    const result = await pool.query(query, params);
    console.log(`Query returned ${result.rows.length} products`);
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
              COALESCE(p.sale_price, p.price) AS current_price,
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

// Products in these categories are stocked per page-type variant instead of
// as a single count. The overall stock_quantity/in_stock columns are kept in
// sync as the sum of the relevant variant columns so the rest of the app
// (listings, cart gating, "X in stock" displays) keeps working unmodified.
const PAGE_TYPE_VARIANT_COLUMNS = {
  notebook: ["plain_pages_stock_quantity", "lined_pages_stock_quantity"],
  notebooks: ["dotted_pages_stock_quantity", "lined_pages_stock_quantity"],
};

const getVariantColumnsForCategory = (category) =>
  PAGE_TYPE_VARIANT_COLUMNS[String(category || "").trim().toLowerCase()] ||
  null;

// Returns a non-negative integer, `fallback` if the value is missing/empty,
// or null if the value is present but invalid.
const parseNonNegativeInt = (value, fallback) => {
  if (value === undefined || value === "") return fallback;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 0 ? null : parsed;
};

export const createProduct = async (req, res) => {
  try {
    console.log("[createProduct] Raw request body:", req.body);
    let {
      name,
      description,
      price,
      sale_price,
      category,
      stock_quantity,
      plain_pages_stock_quantity,
      lined_pages_stock_quantity,
      dotted_pages_stock_quantity,
    } = req.body;

    // Ensure price is a number
    price = parseInt(price, 10);
    if (isNaN(price)) {
      return res.status(400).json({ error: "Price must be a valid number" });
    }

    if (sale_price !== undefined && sale_price !== "") {
      sale_price = parseInt(sale_price, 10);
      if (isNaN(sale_price)) {
        return res
          .status(400)
          .json({ error: "Sale price must be a valid number" });
      }
    } else {
      sale_price = null;
    }
    console.log("[createProduct] Parsed price:", price, "Type:", typeof price);

    // Stock quantity is the source of truth for in_stock: 0 units means
    // out of stock, any positive count means it's available for purchase.
    // Categories with page-type variants (Notebook/Notebooks) are stocked
    // per variant instead, and the overall quantity is their sum.
    const variantColumns = getVariantColumnsForCategory(category);
    let plainStock = 0;
    let linedStock = 0;
    let dottedStock = 0;

    if (variantColumns) {
      const parsedValues = {
        plain_pages_stock_quantity: parseNonNegativeInt(
          plain_pages_stock_quantity,
          0,
        ),
        lined_pages_stock_quantity: parseNonNegativeInt(
          lined_pages_stock_quantity,
          0,
        ),
        dotted_pages_stock_quantity: parseNonNegativeInt(
          dotted_pages_stock_quantity,
          0,
        ),
      };
      for (const column of variantColumns) {
        if (parsedValues[column] === null) {
          return res.status(400).json({
            error: `${column.replace(/_/g, " ")} must be a non-negative number`,
          });
        }
      }
      plainStock = parsedValues.plain_pages_stock_quantity;
      linedStock = parsedValues.lined_pages_stock_quantity;
      dottedStock = parsedValues.dotted_pages_stock_quantity;
      stock_quantity = variantColumns.reduce(
        (sum, column) => sum + parsedValues[column],
        0,
      );
    } else {
      stock_quantity = parseNonNegativeInt(stock_quantity, 0);
      if (stock_quantity === null) {
        return res
          .status(400)
          .json({ error: "Stock quantity must be a non-negative number" });
      }
    }
    const inStock = stock_quantity > 0;

    // Determine next sort_order for this category so new products append to the end
    let sortOrder = 0;
    if (category) {
      const maxRes = await pool.query(
        "SELECT COALESCE(MAX(sort_order), -1) as max_sort FROM products WHERE category = $1",
        [category],
      );
      sortOrder = (maxRes.rows[0]?.max_sort ?? -1) + 1;
    }

    const result = await pool.query(
      "INSERT INTO products (name, description, price, sale_price, category, in_stock, stock_quantity, plain_pages_stock_quantity, lined_pages_stock_quantity, dotted_pages_stock_quantity, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *",
      [
        name,
        description,
        price,
        sale_price,
        category,
        inStock,
        stock_quantity,
        plainStock,
        linedStock,
        dottedStock,
        sortOrder,
      ],
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
    let {
      name,
      description,
      price,
      sale_price,
      category,
      in_stock,
      stock_quantity,
      plain_pages_stock_quantity,
      lined_pages_stock_quantity,
      dotted_pages_stock_quantity,
    } = req.body;

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

    if (sale_price !== undefined) {
      if (sale_price === "") {
        sale_price = null;
      } else {
        sale_price = parseInt(sale_price, 10);
        if (isNaN(sale_price)) {
          return res
            .status(400)
            .json({ error: "Sale price must be a valid number" });
        }
      }
    }

    // Stock quantity (overall or per page-type variant) is the source of
    // truth for in_stock whenever any of it is included in the update. A
    // plain in_stock toggle with none of these fields still works on its
    // own for a quick pause/resume without touching the counted quantity.
    const touchesStock =
      stock_quantity !== undefined ||
      plain_pages_stock_quantity !== undefined ||
      lined_pages_stock_quantity !== undefined ||
      dotted_pages_stock_quantity !== undefined;

    let computedStockQuantity;
    let computedInStock;
    let computedPlainStock;
    let computedLinedStock;
    let computedDottedStock;

    if (touchesStock) {
      const currentRes = await pool.query(
        "SELECT category, stock_quantity, plain_pages_stock_quantity, lined_pages_stock_quantity, dotted_pages_stock_quantity FROM products WHERE id = $1",
        [id],
      );
      if (currentRes.rows.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }
      const current = currentRes.rows[0];
      const effectiveCategory =
        category !== undefined ? category : current.category;
      const variantColumns = getVariantColumnsForCategory(effectiveCategory);

      computedPlainStock = parseNonNegativeInt(
        plain_pages_stock_quantity,
        current.plain_pages_stock_quantity,
      );
      computedLinedStock = parseNonNegativeInt(
        lined_pages_stock_quantity,
        current.lined_pages_stock_quantity,
      );
      computedDottedStock = parseNonNegativeInt(
        dotted_pages_stock_quantity,
        current.dotted_pages_stock_quantity,
      );

      if (
        [computedPlainStock, computedLinedStock, computedDottedStock].some(
          (value) => value === null,
        )
      ) {
        return res
          .status(400)
          .json({ error: "Stock quantities must be non-negative numbers" });
      }

      if (variantColumns) {
        const values = {
          plain_pages_stock_quantity: computedPlainStock,
          lined_pages_stock_quantity: computedLinedStock,
          dotted_pages_stock_quantity: computedDottedStock,
        };
        computedStockQuantity = variantColumns.reduce(
          (sum, column) => sum + values[column],
          0,
        );
      } else if (stock_quantity !== undefined) {
        computedStockQuantity = parseNonNegativeInt(stock_quantity, null);
        if (computedStockQuantity === null) {
          return res
            .status(400)
            .json({ error: "Stock quantity must be a non-negative number" });
        }
      } else {
        computedStockQuantity = current.stock_quantity;
      }
      computedInStock = computedStockQuantity > 0;
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
    if (sale_price !== undefined) {
      updates.push(`sale_price = $${paramCount}`);
      values.push(sale_price);
      paramCount++;
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount}`);
      values.push(category);
      paramCount++;
    }
    if (touchesStock) {
      updates.push(`stock_quantity = $${paramCount}`);
      values.push(computedStockQuantity);
      paramCount++;
      updates.push(`in_stock = $${paramCount}`);
      values.push(computedInStock);
      paramCount++;
      updates.push(`plain_pages_stock_quantity = $${paramCount}`);
      values.push(computedPlainStock);
      paramCount++;
      updates.push(`lined_pages_stock_quantity = $${paramCount}`);
      values.push(computedLinedStock);
      paramCount++;
      updates.push(`dotted_pages_stock_quantity = $${paramCount}`);
      values.push(computedDottedStock);
      paramCount++;
    } else if (in_stock !== undefined) {
      updates.push(`in_stock = $${paramCount}`);
      values.push(in_stock !== false);
      paramCount++;
    }
    if (req.body.sort_order !== undefined) {
      updates.push(`sort_order = $${paramCount}`);
      values.push(parseInt(req.body.sort_order, 10));
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

export const moveProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { direction } = req.body; // 'up' or 'down'

    if (!["up", "down"].includes(direction)) {
      return res.status(400).json({ message: "Invalid direction" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const productRes = await client.query(
        "SELECT id, category FROM products WHERE id = $1 FOR UPDATE",
        [id],
      );

      if (productRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Product not found" });
      }

      const product = productRes.rows[0];

      const categoryRes = await client.query(
        `SELECT id
         FROM products
         WHERE category = $1
         ORDER BY COALESCE(sort_order, 0) ASC, id ASC
         FOR UPDATE`,
        [product.category],
      );

      const orderedProducts = categoryRes.rows;
      const currentIndex = orderedProducts.findIndex(
        (row) => row.id === product.id,
      );

      if (currentIndex === -1) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Product not found" });
      }

      const targetIndex =
        direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= orderedProducts.length) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Cannot move further" });
      }

      const movedProductId = orderedProducts[currentIndex].id;
      const neighborProductId = orderedProducts[targetIndex].id;
      [orderedProducts[currentIndex], orderedProducts[targetIndex]] = [
        orderedProducts[targetIndex],
        orderedProducts[currentIndex],
      ];

      console.log(
        `🔄 MOVE PRODUCT: Product ID ${movedProductId} ${direction} with neighbor ID ${neighborProductId} in category ${product.category}`,
      );

      for (let index = 0; index < orderedProducts.length; index += 1) {
        await client.query(
          `UPDATE products SET sort_order = $1 WHERE id = $2`,
          [index, orderedProducts[index].id],
        );
      }

      await client.query("COMMIT");
      console.log(`✨ Transaction committed successfully`);
    } catch (err) {
      console.error(`❌ Transaction error: ${err.message}`);
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    res.json({ message: "Product moved" });
  } catch (error) {
    console.error("Move product error:", error);
    res
      .status(500)
      .json({ message: "Error moving product", error: error.message });
  }
};

export const reorderProducts = async (req, res) => {
  try {
    const { category, orderedIds } = req.body;

    if (!category || !Array.isArray(orderedIds)) {
      return res
        .status(400)
        .json({ message: "category and orderedIds required" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i];
        await client.query(
          "UPDATE products SET sort_order = $1 WHERE id = $2 AND category = $3",
          [i, id, category],
        );
      }

      await client.query("COMMIT");
      res.json({ message: "Reordered" });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Reorder products error:", error);
    res
      .status(500)
      .json({ message: "Error reordering products", error: error.message });
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
