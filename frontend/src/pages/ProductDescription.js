import React, { useState, useEffect, useCallback, useMemo } from "react";
import apiClient from "../utils/apiClient";
import { useCart } from "../context/CartContext";
import { useParams } from "react-router-dom";
import "../styles/ProductDescription.css";
import ReviewForm from "../components/ReviewForm";
import ReviewsList from "../components/ReviewsList";
import {
  getAvailablePageTypeVariant,
  getPageTypeConfig,
  getVariantStock,
  getStockNotice,
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
  const pageTypeConfig = useMemo(
    () => getPageTypeConfig(product?.category),
    [product?.category],
  );
  const defaultVariant = useMemo(
    () => getAvailablePageTypeVariant(product?.category, product),
    [product],
  );
  // For products with page-type variants, availability/quantity tracks the
  // currently selected variant's own stock rather than the product total.
  const selectedVariantOption = pageTypeConfig?.options?.find(
    (option) => option.variant === selectedVariant,
  );
  const availableStock = selectedVariantOption
    ? getVariantStock(product, selectedVariantOption)
    : product?.stock_quantity;
  // Distinct from availableStock (which caps how many of the *selected*
  // variant can be bought): this reflects the product as a whole, so it
  // doesn't misreport a healthy total as critically low just because the
  // currently selected variant happens to be the scarcer one.
  const stockNotice = getStockNotice(product);

  // If switching page types lands on a variant with less stock than the
  // currently selected quantity, clamp it down instead of letting the
  // customer submit an order for more than what's available.
  useEffect(() => {
    if (availableStock) {
      setQuantity((prev) => Math.min(prev, availableStock));
    }
  }, [availableStock]);

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

          {stockNotice && (
            <p className="low-stock-notice">
              {stockNotice.type === "critical"
                ? `Only ${stockNotice.count} left in stock`
                : "Low on stock"}
            </p>
          )}

          <p className="description">{product.description}</p>

          <div className="quantity-selector">
            <label>Quantity:</label>
            <div className="quantity-input">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const nextValue = Math.max(1, parseInt(e.target.value) || 1);
                  setQuantity(
                    availableStock
                      ? Math.min(nextValue, availableStock)
                      : nextValue,
                  );
                }}
              />
              <button
                onClick={() =>
                  setQuantity((prev) =>
                    availableStock ? Math.min(prev + 1, availableStock) : prev + 1,
                  )
                }
              >
                +
              </button>
            </div>
          </div>

          {pageTypeConfig && (
            <div className="page-type-selector">
              <label className="selector-label">Choose Page Type:</label>
              <div className="page-options">
                {pageTypeConfig.options.map((option) => {
                  const variantStock = getVariantStock(product, option);
                  const isInStock = variantStock > 0;

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
                      {!isInStock ? (
                        <span className="out-of-stock-label">Out of Stock</span>
                      ) : (
                        variantStock <= 3 && (
                          <span className="low-stock-label">
                            Only {variantStock} left
                          </span>
                        )
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
