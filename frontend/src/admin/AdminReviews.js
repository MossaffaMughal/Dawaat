import React, { useState, useEffect } from "react";
import apiClient from "../utils/apiClient";
import "../styles/AdminReviews.css";

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllReviews();
  }, []);

  const fetchAllReviews = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/reviews");
      setReviews(response.data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setError("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        await apiClient.delete(`/reviews/${reviewId}`);
        setReviews(reviews.filter((r) => r.id !== reviewId));
        alert("Review deleted successfully");
      } catch (error) {
        console.error("Error deleting review:", error);
        alert("Failed to delete review");
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderStars = (rating) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  if (loading) {
    return (
      <div className="admin-reviews">
        <div className="loading">Loading reviews...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-reviews">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="admin-reviews">
      <div className="reviews-header">
        <h1>Manage Reviews</h1>
        <p>Total Reviews: {reviews.length}</p>
      </div>

      {reviews.length === 0 ? (
        <div className="no-reviews">
          <p>No reviews yet</p>
        </div>
      ) : (
        <div className="reviews-table-container">
          <table className="reviews-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Reviewer</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id} className="review-row">
                  <td className="product-name">{review.product_name}</td>
                  <td className="reviewer-name">{review.name}</td>
                  <td className="rating">
                    <span className="rating-stars">
                      {renderStars(review.rating)}
                    </span>
                  </td>
                  <td className="comment">
                    {review.comment || <em>No comment</em>}
                  </td>
                  <td className="date">{formatDate(review.created_at)}</td>
                  <td className="action">
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteReview(review.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
