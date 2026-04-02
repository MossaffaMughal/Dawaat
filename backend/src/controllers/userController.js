import pool from "../config/database.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT id, email, name, phone, address, city, postal_code, is_admin, created_at 
       FROM users WHERE id = $1`,
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get user profile error:", error);
    res
      .status(500)
      .json({ message: "Error fetching user profile", error: error.message });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, phone, address, city, postalCode } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name), 
           phone = COALESCE($2, phone),
           address = COALESCE($3, address),
           city = COALESCE($4, city),
           postal_code = COALESCE($5, postal_code),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, email, name, phone, address, city, postal_code, is_admin`,
      [name, phone, address, city, postalCode, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Update user profile error:", error);
    res
      .status(500)
      .json({ message: "Error updating profile", error: error.message });
  }
};

// Request password reset
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const userResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );

    if (userResult.rows.length === 0) {
      // Don't reveal if email exists (security best practice)
      return res.json({
        message:
          "If an account with this email exists, a reset link will be sent",
      });
    }

    const userId = userResult.rows[0].id;
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to database
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (token) DO UPDATE SET expires_at = $3`,
      [userId, resetToken, expiresAt],
    );

    // In production, send email with reset link
    // For now, we'll return the token to the frontend
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    res.json({
      message: "Password reset link generated",
      resetLink, // In production, send via email instead
      token: resetToken,
    });
  } catch (error) {
    console.error("Request password reset error:", error);
    res
      .status(500)
      .json({
        message: "Error requesting password reset",
        error: error.message,
      });
  }
};

// Reset password with token
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token and new password are required" });
    }

    // Check if token exists and is not expired
    const tokenResult = await pool.query(
      `SELECT user_id FROM password_reset_tokens 
       WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP`,
      [token],
    );

    if (tokenResult.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    const userId = tokenResult.rows[0].user_id;

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await pool.query(
      "UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [hashedPassword, userId],
    );

    // Delete used token
    await pool.query("DELETE FROM password_reset_tokens WHERE token = $1", [
      token,
    ]);

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res
      .status(500)
      .json({ message: "Error resetting password", error: error.message });
  }
};

// Change password (for logged-in users)
export const changePassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new password are required" });
    }

    // Get user
    const userResult = await pool.query(
      "SELECT password FROM users WHERE id = $1",
      [userId],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(
      currentPassword,
      userResult.rows[0].password,
    );
    if (!validPassword) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      "UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [hashedPassword, userId],
    );

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res
      .status(500)
      .json({ message: "Error changing password", error: error.message });
  }
};

// Google OAuth login/register
export const googleAuth = async (req, res) => {
  try {
    const { googleId, email, name } = req.body;

    if (!googleId || !email) {
      return res
        .status(400)
        .json({ message: "Google ID and email are required" });
    }

    // Check if user exists with google_id
    let userResult = await pool.query(
      "SELECT * FROM users WHERE google_id = $1",
      [googleId],
    );

    // If not found by google_id, check by email
    if (userResult.rows.length === 0) {
      userResult = await pool.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);

      // If found by email, update with google_id
      if (userResult.rows.length > 0) {
        await pool.query(
          "UPDATE users SET google_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
          [googleId, userResult.rows[0].id],
        );
      } else {
        // Create new user
        userResult = await pool.query(
          `INSERT INTO users (email, google_id, name, is_admin)
           VALUES ($1, $2, $3, false)
           RETURNING id, email, name, is_admin`,
          [email, googleId, name],
        );
      }
    }

    const user = userResult.rows[0];

    // Generate JWT token
    const jwt = require("jsonwebtoken");
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        isAdmin: user.is_admin,
      },
      process.env.JWT_SECRET || "your_secret_key",
      { expiresIn: "7d" },
    );

    res.json({
      message: "Google authentication successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.is_admin,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res
      .status(500)
      .json({
        message: "Error with Google authentication",
        error: error.message,
      });
  }
};
