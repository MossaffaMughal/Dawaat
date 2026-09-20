import express from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from "../controllers/categoryController.js";
import { authenticateToken, authorizeAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getCategories);
router.post("/", authenticateToken, authorizeAdmin, createCategory);
router.patch("/reorder", authenticateToken, authorizeAdmin, reorderCategories);
router.put("/:id", authenticateToken, authorizeAdmin, updateCategory);
router.delete("/:id", authenticateToken, authorizeAdmin, deleteCategory);

export default router;
