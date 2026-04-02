import ReviewModel from "../models/ReviewModel.js";

const ReviewController = {
  // Create a new review
  createReview: async (req, res) => {
    try {
      const { productId, name, rating, comment } = req.body;

      // Validation
      if (!productId || !name || !rating) {
        return res
          .status(400)
          .json({ message: "Product ID, name, and rating are required" });
      }

      if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        return res
          .status(400)
          .json({ message: "Rating must be between 1 and 5" });
      }

      const review = await ReviewModel.createReview(
        productId,
        name,
        rating,
        comment,
      );
      res.status(201).json({
        message: "Review added successfully",
        review: review,
      });
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Error adding review" });
    }
  },

  // Get reviews for a product
  getProductReviews: async (req, res) => {
    try {
      const { productId } = req.params;
      const reviews = await ReviewModel.getProductReviews(productId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Error fetching reviews" });
    }
  },

  // Get all reviews (admin only)
  getAllReviews: async (req, res) => {
    try {
      const reviews = await ReviewModel.getAllReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Error fetching reviews" });
    }
  },

  // Delete a review (admin only)
  deleteReview: async (req, res) => {
    try {
      const { reviewId } = req.params;
      await ReviewModel.deleteReview(reviewId);
      res.json({ message: "Review deleted successfully" });
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ message: "Error deleting review" });
    }
  },

  // Get review stats for a product
  getReviewStats: async (req, res) => {
    try {
      const { productId } = req.params;
      const count = await ReviewModel.getReviewCount(productId);
      const avgRating = await ReviewModel.getAverageRating(productId);

      res.json({
        count: count,
        averageRating: avgRating,
      });
    } catch (error) {
      console.error("Error fetching review stats:", error);
      res.status(500).json({ message: "Error fetching review stats" });
    }
  },
};

export default ReviewController;
