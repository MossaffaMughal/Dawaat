import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../utils/apiClient";
import { useCart } from "../context/CartContext";
import { useParams } from "react-router-dom";
import "../styles/ProductDescription.css";
import ReviewForm from "../components/ReviewForm";
import ReviewsList from "../components/ReviewsList";

const ProductDescription = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [refreshReviews, setRefreshReviews] = useState(false);
  const [notification, setNotification] = useState(null);
  const [reviewStats, setReviewStats] = useState({
    count: 0,
    averageRating: 0,
  });
  const { addToCart } = useCart();
  const hasSalePrice =
    product?.sale_price !== undefined &&
    product?.sale_price !== null &&
    product?.sale_price !== "";
  const currentPrice =
    product?.current_price ?? product?.sale_price ?? product?.price;
  const dottedPagesInStock = product?.dotted_pages_in_stock ?? true;
  const linedPagesInStock = product?.lined_pages_in_stock ?? true;

  const fetchReviewStats = useCallback(async () => {
    try {
      const response = await apiClient.get(`/reviews/stats/${id}`);
      setReviewStats(response.data);
    } catch (error) {
      console.error("Error fetching review stats:", error);
    }
  }, [id]);

  const fetchProduct = useCallback(async () => {
    try {
      const response = await apiClient.get(`/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error("Error fetching product:", error);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
    fetchReviewStats();
  }, [id, refreshReviews, fetchProduct, fetchReviewStats]);

  const handleAddToCart = () => {
    if (product) {
      const isJournal = String(product.category || "")
        .toLowerCase()
        .includes("notebook");

      if (isJournal && !selectedVariant) {
        setNotification("Please select a page type");
        setTimeout(() => setNotification(null), 3000);
        return;
      }

      addToCart(product, quantity, isJournal ? selectedVariant : null);
      setNotification("✓ Added to cart");
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleReviewAdded = () => {
    setRefreshReviews(!refreshReviews);
  };

  if (!product) {
    return (
      <div className="product-description">
        <p>Loading...</p>
      </div>
    );
  }

  const images = product.images || [];

  return (
    <div className="product-description">
      <div className="product-container">
        <div className="product-images">
          <div className="main-image">
            {images.length > 0 && (
              <img src={images[selectedImage]?.image_url} alt={product.name} />
            )}
          </div>
          {images.length > 0 && (
            <div className="thumbnail-images">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className={`thumbnail ${selectedImage === idx ? "active" : ""}`}
                  onClick={() => setSelectedImage(idx)}
                >
                  <img src={img.image_url} alt={`${product.name} ${idx + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="product-details">
          <h1>{product.name}</h1>

          <div className="rating-section">
            <span className="stars">
              {"★".repeat(Math.min(5, Math.round(reviewStats.averageRating)))}
              {"☆".repeat(
                Math.max(0, 5 - Math.round(reviewStats.averageRating)),
              )}
            </span>
            <span className="reviews">({reviewStats.count} reviews)</span>
          </div>

          <div className="pricing">
            {hasSalePrice ? (
              <>
                <span className="original-price">Rs. {product.price}</span>
                <span className="sale-price">Rs. {currentPrice}</span>
              </>
            ) : (
              <span className="price">Rs. {currentPrice}</span>
            )}
          </div>

          <p className="description">{product.description}</p>

          <div className="quantity-selector">
            <label>Quantity:</label>
            <div className="quantity-input">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                −
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
              />
              <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
          </div>

          {String(product.category || "")
            .toLowerCase()
            .includes("notebook") && (
            <div className="page-type-selector">
              <label className="selector-label">Choose Page Type:</label>
              <div className="page-options">
                <button
                  className={`page-option ${selectedVariant === "dotted" ? "selected" : ""} ${!dottedPagesInStock ? "disabled" : ""}`}
                  onClick={() => {
                    if (dottedPagesInStock) {
                      setSelectedVariant("dotted");
                    }
                  }}
                  disabled={!dottedPagesInStock}
                  title={
                    !dottedPagesInStock ? "Dotted pages are out of stock" : ""
                  }
                >
                  <span className="option-icon">•</span>
                  <span className="option-text">Dotted Pages</span>
                  {!dottedPagesInStock && (
                    <span className="out-of-stock-label">Out of Stock</span>
                  )}
                </button>
                <button
                  className={`page-option ${selectedVariant === "lined" ? "selected" : ""} ${!linedPagesInStock ? "disabled" : ""}`}
                  onClick={() => {
                    if (linedPagesInStock) {
                      setSelectedVariant("lined");
                    }
                  }}
                  disabled={!linedPagesInStock}
                  title={
                    !linedPagesInStock ? "Lined pages are out of stock" : ""
                  }
                >
                  <span className="option-icon">≡</span>
                  <span className="option-text">Lined Pages</span>
                  {!linedPagesInStock && (
                    <span className="out-of-stock-label">Out of Stock</span>
                  )}
                </button>
              </div>
              {selectedVariant && (
                <p className="selection-hint">
                  ✓ {selectedVariant === "dotted" ? "Dotted" : "Lined"} pages
                  selected
                </p>
              )}
            </div>
          )}

          {product.in_stock ? (
            <button
              className="add-to-cart-large"
              onClick={handleAddToCart}
              disabled={
                String(product.category || "")
                  .toLowerCase()
                  .includes("notebook") && !selectedVariant
              }
            >
              Add to Cart
            </button>
          ) : (
            <div
              style={{ padding: "10px", color: "#999", textAlign: "center" }}
            >
              Out of Stock
            </div>
          )}

          <div className="product-meta">
            <p>
              <strong>Category:</strong> {product.category}
            </p>
          </div>
        </div>
      </div>

      <div className="reviews-section">
        <ReviewForm productId={id} onReviewAdded={handleReviewAdded} />
        <ReviewsList productId={id} refreshTrigger={refreshReviews} />
      </div>

      {notification && (
        <div className="toast-notification-simple">{notification}</div>
      )}
    </div>
  );
};

export default ProductDescription;
