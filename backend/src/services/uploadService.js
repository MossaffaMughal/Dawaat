import { supabase } from "../config/supabase.js";
import path from "path";
import sharp from "sharp";

export const uploadImage = async (file) => {
  try {
    if (!supabase) {
      throw new Error(
        "Supabase storage is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env",
      );
    }

    if (!file || !file.buffer) {
      throw new Error("No file buffer provided");
    }

    // Compress and normalize images using sharp before uploading to Supabase
    const maxDim = 2000; // maximum width/height
    const quality = 80; // compression quality

    // Convert/encode to WebP for smaller size and wide support
    const processedBuffer = await sharp(file.buffer)
      .rotate()
      .resize({ width: maxDim, height: maxDim, fit: "inside" })
      .toFormat("webp", { quality })
      .toBuffer();

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
    const filePath = `products/${fileName}`;

    const { error } = await supabase.storage
      .from("products")
      .upload(filePath, processedBuffer, {
        contentType: "image/webp",
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("products").getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrl,
      path: filePath,
      fileName: fileName,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const deleteImage = async (filePath) => {
  try {
    if (!supabase) {
      throw new Error(
        "Supabase storage is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env",
      );
    }

    const { error } = await supabase.storage
      .from("products")
      .remove([filePath]);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return { success: false, error: error.message };
  }
};
