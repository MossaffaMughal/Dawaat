import express from "express";
import ReviewController from "../controllers/reviewController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/", ReviewController.createReview); // Create review
router.get("/product/:productId", ReviewController.getProductReviews); // Get reviews for product
router.get("/stats/:productId", ReviewController.getReviewStats); // Get rating stats

// Admin routes
router.get("/", authenticateToken, ReviewController.getAllReviews); // Get all reviews (admin)
router.delete("/:reviewId", authenticateToken, ReviewController.deleteReview); // Delete review (admin)

export default router;
