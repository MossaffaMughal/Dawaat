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
  getProductReviews: async (productId, limit) => {
    let query = `
      SELECT * FROM reviews
      WHERE product_id = $1
      ORDER BY created_at DESC
    `;
    const params = [productId];

    if (Number.isInteger(limit) && limit > 0) {
      query += " LIMIT $2";
      params.push(limit);
    }

    const result = await pool.query(query, params);
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

  // Get recent reviews for public display
  getRecentReviews: async (limit = 5, offset = 0) => {
    const query = `
      SELECT r.*, p.name as product_name
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  },

  // Get total review count and average rating across all reviews
  getOverallStats: async () => {
    const query = `SELECT COUNT(*) as count, AVG(rating) as average_rating FROM reviews`;
    const result = await pool.query(query);
    const { count, average_rating } = result.rows[0];
    return {
      count: parseInt(count, 10),
      averageRating: average_rating
        ? Math.round(average_rating * 10) / 10
        : 0,
    };
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
