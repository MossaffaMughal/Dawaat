import React, { useState } from "react";
import apiClient from "../utils/apiClient";
import "../styles/ReviewForm.css";

const ReviewForm = ({ productId, onReviewAdded }) => {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.post("/reviews", {
        productId,
        name,
        rating: parseInt(rating),
        comment: comment || null,
      });

      if (response.data.review) {
        setSubmitted(true);
        setName("");
        setRating(5);
        setComment("");
        setTimeout(() => setSubmitted(false), 3000);
        if (onReviewAdded) {
          onReviewAdded(response.data.review);
        }
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Error submitting review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-form-container">
      <div className="review-form-header">
        <h3>Add Your Review</h3>
        <p>Share your experience with this product</p>
      </div>

      {submitted && (
        <div className="review-success-message">
          <i className="fas fa-check-circle"></i> Thank you! Your review has
          been posted.
        </div>
      )}

      <form className="review-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Your Name *</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="rating">Rating *</label>
          <div className="rating-selector">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`star-btn ${rating >= star ? "active" : ""}`}
                onClick={() => setRating(star)}
                title={`${star} star${star > 1 ? "s" : ""}`}
              >
                <i className="fas fa-star"></i>
              </button>
            ))}
            <span className="rating-label">{rating} out of 5</span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="comment">Comment (Optional)</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts... (optional)"
            className="form-textarea"
            rows="4"
          ></textarea>
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
