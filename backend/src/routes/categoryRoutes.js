import express from "express";
import {
  getCategories,
  updateCategory,
  reorderCategories,
} from "../controllers/categoryController.js";
import { authenticateToken, authorizeAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getCategories);
router.patch("/reorder", authenticateToken, authorizeAdmin, reorderCategories);
router.put("/:id", authenticateToken, authorizeAdmin, updateCategory);

export default router;
