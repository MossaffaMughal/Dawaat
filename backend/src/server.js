import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for uploaded products
app.use(
  "/products",
  express.static(path.join(__dirname, "../public/products")),
);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../public/products");
    console.log("📁 Multer upload directory:", uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PNG, JPEG, JPG, and WEBP allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/reviews", reviewRoutes);

// Image upload endpoint
app.post("/api/upload", (req, res) => {
  console.log("\n========== IMAGE UPLOAD REQUEST RECEIVED ==========");
  console.log("Time:", new Date().toISOString());
  console.log("Headers:", req.headers);

  upload.single("image")(req, res, (err) => {
    if (err) {
      console.error("\n!!! UPLOAD ERROR !!!");
      console.error("Error message:", err.message);
      console.error("Error code:", err.code);
      console.error("Full error:", err);
      console.error("=========================================\n");

      return res.status(400).json({
        message: "Upload failed",
        error: err.message || err,
      });
    }

    if (!req.file) {
      console.error("\n!!! NO FILE RECEIVED !!!");
      console.error("Request body:", req.body);
      console.error("Request files:", req.files);
      console.error("=========================================\n");
      return res.status(400).json({ message: "No file uploaded" });
    }

    const imageUrl = `/products/${req.file.filename}`;
    console.log("=== FILE UPLOADED SUCCESSFULLY ===");
    console.log("Filename:", req.file.filename);
    console.log("Size:", req.file.size);
    console.log("Mimetype:", req.file.mimetype);
    console.log("Image URL:", imageUrl);
    console.log("=========================================\n");

    res.json({
      message: "File uploaded successfully",
      imageUrl,
      filename: req.file.filename,
    });
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("\n========== GLOBAL ERROR HANDLER ==========");
  console.error("Error:", err.message);
  console.error("Stack:", err.stack);
  console.error("=========================================\n");

  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ Server running on port ${PORT}`);
  console.log(
    `✅ Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`,
  );
  console.log(`✅ Node ENV: ${process.env.NODE_ENV || "development"}\n`);
});
