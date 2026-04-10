import express from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getUserOrders,
  getShippingCost,
  updateShippingCost,
  getHeroBannerUrl,
  updateHeroBannerUrl,
} from "../controllers/orderController.js";
import { authenticateToken, authorizeAdmin } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/", createOrder);
router.get("/shipping/cost", getShippingCost);
router.get("/hero-banner", getHeroBannerUrl);
router.get("/user/:userId", getUserOrders);

// Admin routes for settings
router.put(
  "/shipping/cost",
  authenticateToken,
  authorizeAdmin,
  updateShippingCost,
);
router.put(
  "/hero-banner",
  authenticateToken,
  authorizeAdmin,
  updateHeroBannerUrl,
);

// Admin routes
router.get("/", authenticateToken, authorizeAdmin, getAllOrders);
router.get("/:id", authenticateToken, authorizeAdmin, getOrderById);
router.put("/:id/status", authenticateToken, authorizeAdmin, updateOrderStatus);
router.delete("/:id", authenticateToken, authorizeAdmin, deleteOrder);

export default router;
