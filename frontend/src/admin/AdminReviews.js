import React, { useState, useEffect } from "react";
import apiClient from "../utils/apiClient";
import ConfirmDialog from "../components/ConfirmDialog";
import "../styles/AdminReviews.css";

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusType, setStatusType] = useState("success");
  const [reviewToDelete, setReviewToDelete] = useState(null);

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
    try {
      await apiClient.delete(`/reviews/${reviewId}`);
      setReviews(reviews.filter((r) => r.id !== reviewId));
      setStatusType("success");
      setStatusMessage("Review deleted successfully.");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error("Error deleting review:", error);
      setStatusType("error");
      setStatusMessage("Failed to delete review.");
      setTimeout(() => setStatusMessage(null), 3000);
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

      {statusMessage && (
        <div className={`review-status ${statusType}`}>{statusMessage}</div>
      )}

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
                      onClick={() => setReviewToDelete(review.id)}
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

      <ConfirmDialog
        isOpen={reviewToDelete !== null}
        title="Delete Review"
        message="Are you sure you want to delete this review?"
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        onCancel={() => setReviewToDelete(null)}
        onConfirm={async () => {
          const targetReviewId = reviewToDelete;
          setReviewToDelete(null);
          await handleDeleteReview(targetReviewId);
        }}
      />
    </div>
  );
};

export default AdminReviews;
