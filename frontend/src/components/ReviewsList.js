import React, { useState, useEffect } from "react";
import apiClient from "../utils/apiClient";
import "../styles/ReviewsList.css";

const ReviewsList = ({ productId, refreshTrigger }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ count: 0, averageRating: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [productId, refreshTrigger]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const [reviewsRes, statsRes] = await Promise.all([
        apiClient.get(`/reviews/product/${productId}`),
        apiClient.get(`/reviews/stats/${productId}`),
      ]);

      setReviews(reviewsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="stars-display">
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`fas fa-star ${star <= rating ? "filled" : "empty"}`}
          ></i>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="reviews-loading">Loading reviews...</div>;
  }

  return (
    <div className="reviews-container">
      <div className="reviews-header">
        <h3>Customer Reviews</h3>
        {stats.count > 0 && (
          <div className="reviews-stats">
            <div className="average-rating">
              <span className="rating-number">{stats.averageRating}</span>
              <div>
                {renderStars(Math.round(stats.averageRating))}
                <p className="review-count">({stats.count} reviews)</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="no-reviews">
          <i className="fas fa-comments"></i>
          <p>No reviews yet. Be the first to review this product!</p>
        </div>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => (
            <div key={review.id} className="review-item">
              <div className="review-header">
                <div>
                  <h4>{review.name}</h4>
                  {renderStars(review.rating)}
                </div>
                <span className="review-date">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              {review.comment && (
                <p className="review-comment">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsList;
