import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../utils/apiClient";
import { useCart } from "../context/CartContext";
import { useParams } from "react-router-dom";
import "../styles/ProductDescription.css";
import ReviewForm from "../components/ReviewForm";
import ReviewsList from "../components/ReviewsList";
import {
  getAvailablePageTypeVariant,
  getPageTypeConfig,
} from "../utils/pageType";

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
  const pageTypeConfig = getPageTypeConfig(product?.category);
  const defaultVariant = getAvailablePageTypeVariant(
    product?.category,
    product,
  );

  useEffect(() => {
    if (pageTypeConfig) {
      setSelectedVariant(defaultVariant);
    } else {
      setSelectedVariant(null);
    }
  }, [defaultVariant, pageTypeConfig]);

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
      if (pageTypeConfig && !selectedVariant) {
        setNotification("Please select a page type");
        setTimeout(() => setNotification(null), 3000);
        return;
      }

      addToCart(product, quantity, pageTypeConfig ? selectedVariant : null);
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

          {pageTypeConfig && (
            <div className="page-type-selector">
              <label className="selector-label">Choose Page Type:</label>
              <div className="page-options">
                {pageTypeConfig.options.map((option) => {
                  const isInStock = product?.[option.stockField] ?? true;

                  return (
                    <button
                      key={option.variant}
                      className={`page-option ${selectedVariant === option.variant ? "selected" : ""} ${!isInStock ? "disabled" : ""}`}
                      onClick={() => {
                        if (isInStock) {
                          setSelectedVariant(option.variant);
                        }
                      }}
                      disabled={!isInStock}
                      title={isInStock ? "" : option.outOfStockMessage}
                    >
                      <span className="option-icon">
                        {option.variant === "plain"
                          ? "—"
                          : option.variant === "dotted"
                            ? "•"
                            : "≡"}
                      </span>
                      <span className="option-text">{option.label}</span>
                      {!isInStock && (
                        <span className="out-of-stock-label">Out of Stock</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedVariant && (
                <p className="selection-hint">
                  ✓{" "}
                  {pageTypeConfig.options.find(
                    (option) => option.variant === selectedVariant,
                  )?.shortLabel || selectedVariant}{" "}
                  pages selected
                </p>
              )}
            </div>
          )}

          {product.in_stock ? (
            <button
              className="add-to-cart-large"
              onClick={handleAddToCart}
              disabled={Boolean(pageTypeConfig) && !selectedVariant}
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
