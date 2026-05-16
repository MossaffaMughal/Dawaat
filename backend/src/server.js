import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import discountCodeRoutes from "./routes/discountCodeRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import { initStorage, testSupabaseConnection } from "./config/supabase.js";
import { uploadImage } from "./services/uploadService.js";
import { testDatabaseConnection } from "./config/database.js";
import { ensureDatabaseSchema } from "./db/ensureSchema.js";
import { fixMissingAddresses } from "./db/fixMissingAddresses.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const initPromise = (async () => {
  console.log("\n🔧 Initializing Dawaat Backend...");
  await testDatabaseConnection();
  await ensureDatabaseSchema();
  await fixMissingAddresses();
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

  const isLocalhost = normalizedOrigin === "http://localhost:3000";
  const isProduction = productionOrigins.has(normalizedOrigin);
  const isConfigured = configuredFrontendOrigins.includes(normalizedOrigin);
  const isVercelPreview =
    /^https:\/\/dawaat-frontend(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(
      normalizedOrigin,
    );

  const allowed =
    isLocalhost || isProduction || isConfigured || isVercelPreview;

  // Log all origin checks for debugging deployment issues
  if (!allowed) {
    console.warn(`[CORS] ⚠️ Origin REJECTED:`, {
      origin,
      normalizedOrigin,
      isLocalhost,
      isProduction,
      isConfigured,
      isVercelPreview,
      configuredOrigins: configuredFrontendOrigins,
      productionOrigins: Array.from(productionOrigins),
    });
  }

  return allowed;
};

// CORS configuration for all routes
const corsOptions = {
  origin: (origin, callback) => {
    console.log(`[CORS] 🔍 Checking origin:`, origin);
    const allowed = isAllowedFrontendOrigin(origin);
    if (allowed) {
      console.log(`[CORS] ✅ Origin ALLOWED:`, origin);
      return callback(null, true);
    }
    console.error(`[CORS] ❌ Origin BLOCKED:`, origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Accept-Language",
    "Content-Length",
    "X-CSRF-Token",
  ],
  exposedHeaders: ["Content-Length", "X-JSON-Response", "Content-Type"],
  maxAge: 86400,
};

app.use(cors(corsOptions));

// Increase payload limits for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
  // Allow uploads up to 50MB; images will be compressed server-side
  // Vercel max payload is 256MB, but we'll use 50MB for safety
  limits: { fileSize: 50 * 1024 * 1024 },
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/discount-codes", discountCodeRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/reviews", reviewRoutes);

// Explicit OPTIONS handler for preflight requests
app.options("/api/upload", cors(corsOptions));

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

// Global error handler - ensure CORS headers are always set
app.use((err, req, res, next) => {
  console.error("\n========== GLOBAL ERROR HANDLER ==========");
  console.error("Error:", err.message);
  console.error("Stack:", err.stack);
  console.error("=========================================\n");

  // Ensure CORS headers are set even on errors
  const origin = req.headers.origin;
  const allowed = isAllowedFrontendOrigin(origin);
  if (allowed) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  // Handle multer errors specifically
  if (err.code === "LIMIT_FILE_SIZE") {
    console.error("File size limit exceeded:", err.limit);
    return res.status(413).json({
      message: `File too large. Maximum size is ${Math.round(err.limit / 1024 / 1024)}MB`,
    });
  }

  if (err.code === "LIMIT_PART_COUNT") {
    return res.status(400).json({
      message: "Too many parts",
    });
  }

  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// ✅ EXPORT for Vercel (serverless function)
export default app;

// Startup logging - show CORS configuration
console.log("\n========== CORS CONFIGURATION ==========");
console.log("Production Origins:", Array.from(productionOrigins));
console.log("Configured Origins:", configuredFrontendOrigins);
console.log("FRONTEND_URL env:", process.env.FRONTEND_URL);
console.log("CORS_ORIGIN env:", process.env.CORS_ORIGIN);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("=====================================\n");

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
