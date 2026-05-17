import express from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImage,
  moveProduct,
  reorderProducts,
  deleteProductImage,
} from "../controllers/productController.js";
import { authenticateToken, authorizeAdmin } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Admin routes
router.post("/", authenticateToken, authorizeAdmin, createProduct);
router.put("/:id", authenticateToken, authorizeAdmin, updateProduct);
router.patch("/:id/move", authenticateToken, authorizeAdmin, moveProduct);
router.delete("/:id", authenticateToken, authorizeAdmin, deleteProduct);
router.patch("/reorder", authenticateToken, authorizeAdmin, reorderProducts);

// Product images
router.post("/images/add", authenticateToken, authorizeAdmin, addProductImage);
router.delete(
  "/images/:imageId",
  authenticateToken,
  authorizeAdmin,
  deleteProductImage,
);

export default router;
