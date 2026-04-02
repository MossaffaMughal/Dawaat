import pool from "../config/database.js";

// Get user's wishlist
export const getWishlist = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT p.*, COALESCE(AVG(r.rating), 0) as average_rating, COUNT(r.id) as review_count, MAX(w.created_at) as wishlist_added_at
       FROM products p
       INNER JOIN wishlist w ON p.id = w.product_id
       LEFT JOIN reviews r ON p.id = r.product_id
       WHERE w.user_id = $1
       GROUP BY p.id
       ORDER BY MAX(w.created_at) DESC`,
      [userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get wishlist error:", error);
    res
      .status(500)
      .json({ message: "Error fetching wishlist", error: error.message });
  }
};

// Add product to wishlist
export const addToWishlist = async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Check if product exists
    const productResult = await pool.query(
      "SELECT id FROM products WHERE id = $1",
      [productId],
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Add to wishlist (ignore if already exists)
    const result = await pool.query(
      `INSERT INTO wishlist (user_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING
       RETURNING *`,
      [userId, productId],
    );

    res.status(201).json({
      message: "Product added to wishlist",
      wishlistItem: result.rows[0] || {
        user_id: userId,
        product_id: productId,
      },
    });
  } catch (error) {
    console.error("Add to wishlist error:", error);
    res
      .status(500)
      .json({ message: "Error adding to wishlist", error: error.message });
  }
};

// Remove product from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const result = await pool.query(
      "DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2 RETURNING *",
      [userId, productId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not in wishlist" });
    }

    res.json({ message: "Product removed from wishlist" });
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    res
      .status(500)
      .json({ message: "Error removing from wishlist", error: error.message });
  }
};

// Check if product is in wishlist
export const isInWishlist = async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId } = req.query;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const result = await pool.query(
      "SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2",
      [userId, productId],
    );

    res.json({ inWishlist: result.rows.length > 0 });
  } catch (error) {
    console.error("Check wishlist error:", error);
    res
      .status(500)
      .json({ message: "Error checking wishlist", error: error.message });
  }
};
