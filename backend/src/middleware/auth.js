import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token required" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your_secret_key",
    (err, user) => {
      if (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
      }
      req.user = user;
      next();
    },
  );
};

export const authorizeAdmin = (req, res, next) => {
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim());

  if (!req.user || !adminEmails.includes(req.user.email)) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};
