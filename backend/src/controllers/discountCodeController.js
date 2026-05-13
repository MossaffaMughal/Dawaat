import pool from "../config/database.js";

const normalizeCode = (code) =>
  String(code || "")
    .trim()
    .toUpperCase();

export const getDiscountCodes = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, code, percentage, is_active, created_at, updated_at
       FROM discount_codes
       ORDER BY created_at DESC, id DESC`,
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get discount codes error:", error);
    res.status(500).json({
      message: "Error fetching discount codes",
      error: error.message,
    });
  }
};

export const createDiscountCode = async (req, res) => {
  try {
    const code = normalizeCode(req.body.code);
    const percentage = parseInt(req.body.percentage, 10);
    const isActive = req.body.is_active !== false;

    if (!code) {
      return res.status(400).json({ message: "Discount code is required" });
    }

    if (Number.isNaN(percentage) || percentage < 0 || percentage > 100) {
      return res
        .status(400)
        .json({ message: "Percentage must be between 0 and 100" });
    }

    const result = await pool.query(
      `INSERT INTO discount_codes (code, percentage, is_active)
       VALUES ($1, $2, $3)
       RETURNING id, code, percentage, is_active, created_at, updated_at`,
      [code, percentage, isActive],
    );

    res.status(201).json({
      message: "Discount code created successfully",
      discountCode: result.rows[0],
    });
  } catch (error) {
    console.error("Create discount code error:", error);
    if (error.code === "23505") {
      return res.status(400).json({ message: "Discount code already exists" });
    }
    res.status(500).json({
      message: "Error creating discount code",
      error: error.message,
    });
  }
};

export const updateDiscountCode = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (req.body.code !== undefined) {
      const code = normalizeCode(req.body.code);
      if (!code) {
        return res.status(400).json({ message: "Discount code is required" });
      }
      updates.push(`code = $${paramCount}`);
      values.push(code);
      paramCount++;
    }

    if (req.body.percentage !== undefined) {
      const percentage = parseInt(req.body.percentage, 10);
      if (Number.isNaN(percentage) || percentage < 0 || percentage > 100) {
        return res
          .status(400)
          .json({ message: "Percentage must be between 0 and 100" });
      }
      updates.push(`percentage = $${paramCount}`);
      values.push(percentage);
      paramCount++;
    }

    if (req.body.is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(req.body.is_active !== false);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE discount_codes
       SET ${updates.join(", ")}
       WHERE id = $${paramCount}
       RETURNING id, code, percentage, is_active, created_at, updated_at`,
      values,
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Discount code not found" });
    }

    res.json({
      message: "Discount code updated successfully",
      discountCode: result.rows[0],
    });
  } catch (error) {
    console.error("Update discount code error:", error);
    if (error.code === "23505") {
      return res.status(400).json({ message: "Discount code already exists" });
    }
    res.status(500).json({
      message: "Error updating discount code",
      error: error.message,
    });
  }
};

export const deleteDiscountCode = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM discount_codes WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Discount code not found" });
    }

    res.json({ message: "Discount code deleted successfully" });
  } catch (error) {
    console.error("Delete discount code error:", error);
    res.status(500).json({
      message: "Error deleting discount code",
      error: error.message,
    });
  }
};

export const validateDiscountCode = async (req, res) => {
  try {
    const code = normalizeCode(req.body.code);

    if (!code) {
      return res.status(400).json({ message: "Discount code is required" });
    }

    const result = await pool.query(
      `SELECT id, code, percentage
       FROM discount_codes
       WHERE code = $1 AND is_active = true
       LIMIT 1`,
      [code],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Invalid or inactive discount code",
        valid: false,
      });
    }

    res.json({
      valid: true,
      discountCode: result.rows[0],
    });
  } catch (error) {
    console.error("Validate discount code error:", error);
    res.status(500).json({
      message: "Error validating discount code",
      error: error.message,
    });
  }
};
