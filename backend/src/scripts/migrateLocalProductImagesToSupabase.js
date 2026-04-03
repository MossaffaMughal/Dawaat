import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import pool from "../config/database.js";
import { supabase, isSupabaseConfigured } from "../config/supabase.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const productsDir = path.resolve(__dirname, "../../public/products");
const shouldCleanup = process.argv.includes("--cleanup");

const ensureProductsBucket = async () => {
  const { data: buckets, error: listError } =
    await supabase.storage.listBuckets();
  if (listError) {
    throw new Error(`Failed to list buckets: ${listError.message}`);
  }

  const exists = buckets?.some((bucket) => bucket.name === "products");
  if (exists) {
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(
    "products",
    {
      public: true,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
      fileSizeLimit: 10485760,
    },
  );

  if (createError) {
    throw new Error(`Failed to create products bucket: ${createError.message}`);
  }

  console.log("Created Supabase bucket: products");
};

const getContentType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return "application/octet-stream";
};

const getLocalFilename = (imageUrl) => {
  try {
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      const parsed = new URL(imageUrl);
      return path.basename(parsed.pathname);
    }
  } catch {
    return null;
  }

  if (imageUrl.startsWith("/products/")) {
    return path.basename(imageUrl);
  }

  return null;
};

const isLocalProductUrl = (imageUrl) => {
  const value = String(imageUrl || "").trim();
  return (
    value.includes("localhost:5000/products/") ||
    value.includes("127.0.0.1:5000/products/") ||
    value.startsWith("/products/")
  );
};

const main = async () => {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_ANON_KEY).",
    );
  }

  await ensureProductsBucket();

  const { rows } = await pool.query(
    `SELECT id, image_url
     FROM product_images
     WHERE image_url ILIKE '%localhost:5000/products/%'
        OR image_url ILIKE '%127.0.0.1:5000/products/%'
        OR image_url LIKE '/products/%'
     ORDER BY id`,
  );

  console.log(`Found ${rows.length} local image record(s) to migrate.`);

  let migrated = 0;
  let failed = 0;
  let missingFile = 0;

  for (const row of rows) {
    const sourceUrl = String(row.image_url || "").trim();
    if (!isLocalProductUrl(sourceUrl)) {
      continue;
    }

    const filename = getLocalFilename(sourceUrl);
    if (!filename) {
      failed += 1;
      console.error(
        `[${row.id}] Skipped: could not parse filename from ${sourceUrl}`,
      );
      continue;
    }

    const localPath = path.join(productsDir, filename);

    let fileBuffer;
    try {
      fileBuffer = await fs.readFile(localPath);
    } catch {
      missingFile += 1;
      console.error(`[${row.id}] Missing local file: ${localPath}`);
      continue;
    }

    const storagePath = `products/${filename}`;
    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(storagePath, fileBuffer, {
        contentType: getContentType(filename),
        upsert: true,
      });

    if (uploadError) {
      failed += 1;
      console.error(`[${row.id}] Upload failed: ${uploadError.message}`);
      continue;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("products").getPublicUrl(storagePath);

    try {
      await pool.query(
        "UPDATE product_images SET image_url = $1 WHERE id = $2",
        [publicUrl, row.id],
      );
    } catch (updateError) {
      failed += 1;
      console.error(`[${row.id}] DB update failed: ${updateError.message}`);
      continue;
    }

    migrated += 1;
    console.log(`[${row.id}] Migrated to ${publicUrl}`);
  }

  if (shouldCleanup && failed === 0 && missingFile === 0) {
    const productFiles = await fs.readdir(productsDir);
    let deleted = 0;

    for (const file of productFiles) {
      if (file === ".gitkeep") continue;
      const fullPath = path.join(productsDir, file);
      const stats = await fs.stat(fullPath);
      if (!stats.isFile()) continue;
      await fs.unlink(fullPath);
      deleted += 1;
    }

    console.log(`Cleanup complete. Deleted ${deleted} local file(s).`);
  } else if (shouldCleanup) {
    console.warn(
      "Cleanup skipped because some records failed or source files were missing.",
    );
  }

  console.log("Migration summary:", {
    total: rows.length,
    migrated,
    failed,
    missingFile,
    cleanup: shouldCleanup,
  });
};

main()
  .catch((error) => {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
