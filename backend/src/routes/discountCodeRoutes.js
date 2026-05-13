import express from "express";
import {
  getDiscountCodes,
  createDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
  validateDiscountCode,
} from "../controllers/discountCodeController.js";
import { authenticateToken, authorizeAdmin } from "../middleware/auth.js";

const router = express.Router();

router.post("/validate", validateDiscountCode);
router.get("/", authenticateToken, authorizeAdmin, getDiscountCodes);
router.post("/", authenticateToken, authorizeAdmin, createDiscountCode);
router.put("/:id", authenticateToken, authorizeAdmin, updateDiscountCode);
router.delete("/:id", authenticateToken, authorizeAdmin, deleteDiscountCode);

export default router;
