import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase credentials!");
  throw new Error("Supabase credentials are required");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const initStorage = async () => {
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
