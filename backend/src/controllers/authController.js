import pool from "../config/database.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim());

export const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (admin check based on email)
    const isAdmin = ADMIN_EMAILS.includes(email);
    const newUser = await pool.query(
      "INSERT INTO users (email, password, is_admin) VALUES ($1, $2, $3) RETURNING id, email, is_admin",
      [email, hashedPassword, isAdmin],
    );

    // Generate token for auto-login
    const token = jwt.sign(
      {
        id: newUser.rows[0].id,
        email: newUser.rows[0].email,
        isAdmin: newUser.rows[0].is_admin,
      },
      process.env.JWT_SECRET || "your_secret_key",
      { expiresIn: "7d" },
    );

    res.status(201).json({
      message: "User created successfully",
      token,
      user: newUser.rows[0],
    });
  } catch (error) {
    console.error("Register error:", error);
    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (user.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: user.rows[0].id,
        email: user.rows[0].email,
        isAdmin: user.rows[0].is_admin,
      },
      process.env.JWT_SECRET || "your_secret_key",
      { expiresIn: "7d" },
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.rows[0].id,
        email: user.rows[0].email,
        isAdmin: user.rows[0].is_admin,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

export const verifyToken = (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_secret_key",
    );
    res.json({
      valid: true,
      user: decoded,
    });
  } catch (error) {
    res.status(401).json({ valid: false, message: "Invalid token" });
  }
};
