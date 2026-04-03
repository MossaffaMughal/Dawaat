import { supabase } from "../config/supabase.js";
import path from "path";

export const uploadImage = async (file) => {
  try {
    if (!file || !file.buffer) {
      throw new Error("No file buffer provided");
    }

    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error } = await supabase.storage
      .from("products")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
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
