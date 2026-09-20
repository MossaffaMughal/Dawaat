import React, { useEffect, useState } from "react";
import apiClient from "../utils/apiClient";
import "../styles/Home.css";

const PAGE_SIZE = 5;

const HomeReviewsSection = () => {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ count: 0, averageRating: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const fetchInitialReviews = async () => {
      try {
        const [reviewsResponse, summaryResponse] = await Promise.all([
          apiClient.get(`/reviews/recent?limit=${PAGE_SIZE}&offset=0`),
          apiClient.get("/reviews/summary"),
        ]);
        setReviews(reviewsResponse.data || []);
        setSummary(summaryResponse.data || { count: 0, averageRating: 0 });
      } catch (error) {
        console.error("Error fetching homepage reviews:", error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialReviews();
  }, []);

  const handleSeeMore = async () => {
    try {
      setLoadingMore(true);
      const response = await apiClient.get(
        `/reviews/recent?limit=${PAGE_SIZE}&offset=${reviews.length}`,
      );
      setReviews((current) => [...current, ...(response.data || [])]);
    } catch (error) {
      console.error("Error fetching more reviews:", error);
    } finally {
      setLoadingMore(false);
    }
  };

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

  const hasMore = reviews.length < summary.count;

  return (
    <section className="home-reviews-section">
      <div className="home-reviews-header">
        <h2>What Customers Are Saying</h2>
        <p>Recent reviews from our community</p>
        {summary.count > 0 && (
          <p className="home-reviews-summary">
            <span className="home-reviews-summary-stars">
              {renderStars(Math.round(summary.averageRating))}
            </span>
            <span className="home-reviews-summary-text">
              {summary.averageRating.toFixed(1)} out of 5 · {summary.count}{" "}
              {summary.count === 1 ? "review" : "reviews"}
            </span>
          </p>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="home-reviews-empty">
          No reviews yet. Be the first to share your experience.
        </div>
      ) : (
        <>
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

          {hasMore && (
            <button
              type="button"
              className="see-more-reviews-button"
              onClick={handleSeeMore}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading..." : "See more reviews"}
              <i className="fas fa-arrow-down"></i>
            </button>
          )}
        </>
      )}
    </section>
  );
};

export default HomeReviewsSection;
