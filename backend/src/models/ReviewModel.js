import pool from "../config/database.js";

const ReviewModel = {
  // Create a new review
  createReview: async (productId, name, rating, comment) => {
    const query = `
      INSERT INTO reviews (product_id, name, rating, comment, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    const result = await pool.query(query, [
      productId,
      name,
      rating,
      comment || null,
    ]);
    return result.rows[0];
  },

  // Get reviews for a product
  getProductReviews: async (productId) => {
    const query = `
      SELECT * FROM reviews 
      WHERE product_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [productId]);
    return result.rows;
  },

  // Get all reviews (for admin)
  getAllReviews: async () => {
    const query = `
      SELECT r.*, p.name as product_name
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  // Delete a review
  deleteReview: async (reviewId) => {
    const query = `
      DELETE FROM reviews 
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [reviewId]);
    return result.rows[0];
  },

  // Get review count for a product
  getReviewCount: async (productId) => {
    const query = `
      SELECT COUNT(*) as count FROM reviews 
      WHERE product_id = $1
    `;
    const result = await pool.query(query, [productId]);
    return parseInt(result.rows[0].count);
  },

  // Get average rating for a product
  getAverageRating: async (productId) => {
    const query = `
      SELECT AVG(rating) as average_rating FROM reviews 
      WHERE product_id = $1
    `;
    const result = await pool.query(query, [productId]);
    return result.rows[0].average_rating
      ? Math.round(result.rows[0].average_rating * 10) / 10
      : 0;
  },
};

export default ReviewModel;
