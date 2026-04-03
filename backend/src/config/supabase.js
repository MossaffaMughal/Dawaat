import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageKey = supabaseServiceKey || supabaseAnonKey;
const hasSupabaseCredentials = Boolean(supabaseUrl && storageKey);

if (!hasSupabaseCredentials) {
  console.warn(
    "⚠️ Supabase credentials are missing. File storage features are disabled until SUPABASE_URL and SUPABASE_ANON_KEY are set.",
  );
}

export const supabase = hasSupabaseCredentials
  ? createClient(supabaseUrl, storageKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export const isSupabaseConfigured = () => hasSupabaseCredentials;

export const initStorage = async () => {
  if (!supabase) {
    console.warn(
      "⚠️ Skipping storage initialization: Supabase is not configured.",
    );
    return false;
  }

  try {
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();
    if (listError) throw listError;

    const bucketExists = buckets?.some((b) => b.name === "products");

    if (!bucketExists) {
      console.log("📦 Creating products bucket...");
      const { error: createError } = await supabase.storage.createBucket(
        "products",
        {
          public: true,
          allowedMimeTypes: [
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/webp",
          ],
          fileSizeLimit: 10485760,
        },
      );
      if (createError) throw createError;
      console.log("✅ Products bucket created!");
    } else {
      console.log("✅ Products bucket already exists");
    }
    return true;
  } catch (error) {
    console.error("❌ Failed to initialize storage:", error.message);
    return false;
  }
};

export const testSupabaseConnection = async () => {
  if (!supabase) {
    console.warn(
      "⚠️ Skipping Supabase connection test: Supabase is not configured.",
    );
    return false;
  }

  try {
    const { error } = await supabase.storage.listBuckets();
    if (error) throw error;
    console.log("✅ Supabase storage connected successfully!");
    return true;
  } catch (error) {
    console.error("❌ Supabase connection failed:", error.message);
    return false;
  }
};
