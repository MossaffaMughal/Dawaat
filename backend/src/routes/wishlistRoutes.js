import express from "express";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
} from "../controllers/wishlistController.js";

const router = express.Router();

// Wishlist endpoints
router.get("/:userId", getWishlist);
router.post("/:userId/add", addToWishlist);
router.delete("/:userId/remove", removeFromWishlist);
router.get("/:userId/check", isInWishlist);

export default router;
