import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../utils/apiClient";

const ReviewStats = ({ productId }) => {
  const [stats, setStats] = useState({ count: 0, averageRating: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.get(`/reviews/stats/${productId}`);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching review stats:", error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) return null;

  const starRating = Math.round(stats.averageRating);
  const filledStars = "★".repeat(starRating);
  const emptyStars = "☆".repeat(5 - starRating);

  return (
    <div className="review-stats">
      <span className="stats-stars">
        {filledStars}
        {emptyStars}
      </span>
      <span className="stats-count">({stats.count})</span>
    </div>
  );
};

export default ReviewStats;
