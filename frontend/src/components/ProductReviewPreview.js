import React, { useEffect, useState } from "react";
import apiClient from "../utils/apiClient";

const ProductReviewPreview = ({ productId }) => {
  const [review, setReview] = useState(null);
  const [hasReviews, setHasReviews] = useState(false);

  useEffect(() => {
    const fetchLatestReview = async () => {
      try {
        const response = await apiClient.get(
          `/reviews/product/${productId}?limit=1`,
        );
        if (response.data && response.data.length > 0) {
          setReview(response.data[0]);
          setHasReviews(true);
        } else {
          setReview(null);
          setHasReviews(false);
        }
      } catch (error) {
        console.error("Error fetching latest review:", error);
        setReview(null);
        setHasReviews(false);
      }
    };

    fetchLatestReview();
  }, [productId]);

  if (!hasReviews) {
    return <p className="product-review-empty">No reviews yet.</p>;
  }

  const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);

  return (
    <div className="product-review-preview">
      <p className="product-review-stars">{stars}</p>
      {review.comment && (
        <p className="product-review-text">"{review.comment}"</p>
      )}
      <p className="product-review-author">- {review.name}</p>
    </div>
  );
};

export default ProductReviewPreview;
