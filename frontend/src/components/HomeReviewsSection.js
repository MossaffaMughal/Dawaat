import React, { useEffect, useState } from "react";
import apiClient from "../utils/apiClient";
import "../styles/Home.css";

const HomeReviewsSection = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentReviews = async () => {
      try {
        const response = await apiClient.get("/reviews/recent?limit=6");
        setReviews(response.data || []);
      } catch (error) {
        console.error("Error fetching homepage reviews:", error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentReviews();
  }, []);

  const renderStars = (rating) => {
    const filled = Math.max(0, Math.min(5, Number(rating) || 0));
    return "★".repeat(filled) + "☆".repeat(5 - filled);
  };

  if (loading) {
    return (
      <section className="home-reviews-section">
        <div className="home-reviews-header">
          <h2>What Customers Are Saying</h2>
          <p>Recent reviews from our community</p>
        </div>
        <div className="home-reviews-loading">Loading reviews...</div>
      </section>
    );
  }

  return (
    <section className="home-reviews-section">
      <div className="home-reviews-header">
        <h2>What Customers Are Saying</h2>
        <p>Recent reviews from our community</p>
      </div>

      {reviews.length === 0 ? (
        <div className="home-reviews-empty">
          No reviews yet. Be the first to share your experience.
        </div>
      ) : (
        <div className="home-reviews-grid">
          {reviews.map((review) => (
            <article key={review.id} className="home-review-card">
              <div className="home-review-top">
                <div>
                  <h3>{review.name}</h3>
                  <p className="home-review-product">
                    For {review.product_name}
                  </p>
                </div>
                <span className="home-review-date">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="home-review-stars">
                {renderStars(review.rating)}
              </div>
              {review.comment ? (
                <p className="home-review-comment">{review.comment}</p>
              ) : (
                <p className="home-review-comment home-review-comment-muted">
                  No comment provided.
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default HomeReviewsSection;
