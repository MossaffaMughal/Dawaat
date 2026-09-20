import pool from "../config/database.js";

export const getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, category_key, name, image_url, sort_order
       FROM categories
       ORDER BY sort_order ASC, id ASC`,
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: "Error fetching categories" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { name, imageUrl } = req.body;
    const normalizedName = String(name || "").trim();
    const normalizedImageUrl = String(imageUrl || "").trim();

    if (!normalizedName || !normalizedImageUrl) {
      return res
        .status(400)
        .json({ message: "Category name and image are required" });
    }

    const result = await pool.query(
      `UPDATE categories
       SET name = $1, image_url = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, category_key, name, image_url, sort_order`,
      [normalizedName, normalizedImageUrl, req.params.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({ message: "Error updating category" });
  }
};

export const reorderCategories = async (req, res) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return res.status(400).json({ message: "orderedIds are required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (let index = 0; index < orderedIds.length; index += 1) {
      await client.query(
        "UPDATE categories SET sort_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [index, orderedIds[index]],
      );
    }
    await client.query("COMMIT");
    res.json({ message: "Category order updated successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Reorder categories error:", error);
    res.status(500).json({ message: "Error updating category order" });
  } finally {
    client.release();
  }
};
