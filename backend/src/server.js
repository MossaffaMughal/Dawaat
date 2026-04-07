import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import { initStorage, testSupabaseConnection } from "./config/supabase.js";
import { uploadImage } from "./services/uploadService.js";
import { testDatabaseConnection } from "./config/database.js";
import { ensureDatabaseSchema } from "./db/ensureSchema.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const initPromise = (async () => {
  console.log("\n🔧 Initializing Dawaat Backend...");
  await testDatabaseConnection();
  await ensureDatabaseSchema();
  await testSupabaseConnection();
  await initStorage();
  console.log("✅ All systems ready!\n");
})();

// Middleware
const normalizeOrigin = (value) =>
  value.trim().toLowerCase().replace(/\/+$/, "");

const configuredFrontendOrigins = [
  process.env.FRONTEND_URL || "",
  process.env.CORS_ORIGIN || "",
]
  .join(",")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)
  .map(normalizeOrigin);

const productionOrigins = new Set([
  "https://dawaat.pk",
  "https://www.dawaat.pk",
]);

const isAllowedFrontendOrigin = (origin) => {
  if (!origin) return true;
  const normalizedOrigin = normalizeOrigin(origin);

  if (normalizedOrigin === "http://localhost:3000") return true;
  if (productionOrigins.has(normalizedOrigin)) return true;
  if (configuredFrontendOrigins.includes(normalizedOrigin)) return true;

  // Allow Vercel preview deployments for this frontend project.
  return /^https:\/\/dawaat-frontend(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(
    normalizedOrigin,
  );
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedFrontendOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(async (req, res, next) => {
  try {
    await initPromise;
    next();
  } catch (error) {
    console.error("Initialization error:", error.message);
    res.status(500).json({ message: "Server initialization failed" });
  }
});

const storage = multer.memoryStorage();

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
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/reviews", reviewRoutes);

app.post("/api/upload", upload.single("image"), async (req, res) => {
  console.log("\n========== IMAGE UPLOAD TO SUPABASE ==========");

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await uploadImage(req.file);

    if (!result.success) {
      console.error("Upload failed:", result.error);
      return res.status(500).json({ message: result.error });
    }

    console.log("✅ Image uploaded:", result.url);
    res.json({
      message: "File uploaded successfully",
      imageUrl: result.url,
      filename: result.fileName,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
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

// ✅ EXPORT for Vercel (serverless function)
export default app;

// ✅ Only listen locally (not on Vercel)
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`\n✅ Server running on port ${PORT}`);
    console.log(
      `✅ Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`,
    );
    console.log(`✅ Node ENV: ${process.env.NODE_ENV || "development"}\n`);
  });
}
