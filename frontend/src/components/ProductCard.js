import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import ReviewStats from "./ReviewStats";
import {
  getAvailablePageTypeVariant,
  getPageTypeConfig,
} from "../utils/pageType";
import "../styles/ProductCard.css";

const ProductCard = ({ product, onAddToCart }) => {
  const [mainImage, setMainImage] = useState(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState("dotted");
  const { isInWishlist, toggleWishlist } = useWishlist();
  const hasSalePrice =
    product.sale_price !== undefined &&
    product.sale_price !== null &&
    product.sale_price !== "";
  const currentPrice =
    product.current_price ?? product.sale_price ?? product.price;
  const pageTypeConfig = getPageTypeConfig(product.category);

  useEffect(() => {
    if (product.images && product.images.length > 0) {
      setMainImage(product.images[0].image_url);
    }
  }, [product]);

  const handleAddToCart = () => {
    if (pageTypeConfig) {
      setSelectedVariant(getAvailablePageTypeVariant(product.category, product));
      setShowVariantModal(true);
    } else if (onAddToCart) {
      onAddToCart(product, 1, null);
    }
  };

  const handleVariantSelect = () => {
    if (onAddToCart) {
      onAddToCart(product, 1, selectedVariant);
    }
    setShowVariantModal(false);
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    toggleWishlist(product.id);
  };

  return (
    <div className="product-card-container">
      <Link to={`/products/${product.id}`} className="product-card-link">
        <div className="product-card">
          <div className="product-image">
            {mainImage && <img src={mainImage} alt={product.name} />}
            {hasSalePrice && <span className="sale-badge">Sale</span>}
            <button
              className={`wishlist-btn ${isInWishlist(product.id) ? "active" : ""}`}
              onClick={handleWishlistClick}
              title={
                isInWishlist(product.id)
                  ? "Remove from wishlist"
                  : "Add to wishlist"
              }
            >
              <i
                className={`fas fa-heart ${isInWishlist(product.id) ? "active" : ""}`}
              ></i>
            </button>
          </div>

          <div className="product-info">
            <h3>{product.name}</h3>

            <ReviewStats productId={product.id} />

            <div className="product-price">
              {hasSalePrice ? (
                <>
                  <span className="original-price">Rs. {product.price}</span>
                  <span className="sale-price">Rs. {currentPrice}</span>
                </>
              ) : (
                <span className="price">Rs. {currentPrice}</span>
              )}
            </div>
          </div>
        </div>
      </Link>

      <button
        className="add-to-cart-btn"
        onClick={(e) => {
          e.preventDefault();
          handleAddToCart();
        }}
        disabled={!product.in_stock}
      >
        <i className="fas fa-shopping-cart"></i>
        <span>{product.in_stock ? "Add to Cart" : "Out of Stock"}</span>
      </button>

      {showVariantModal && pageTypeConfig && (
        <div
          className="modal-overlay"
          onClick={() => setShowVariantModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Choose Page Type</h3>
            <p>{pageTypeConfig.prompt}</p>
            <div className="variant-options">
              {pageTypeConfig.options.map((option) => {
                const isInStock = product?.[option.stockField] ?? true;

                return (
                  <label
                    key={option.variant}
                    className={`variant-option ${!isInStock ? "disabled" : ""}`}
                    title={isInStock ? "" : option.outOfStockMessage}
                  >
                    <input
                      type="radio"
                      name="pageType"
                      value={option.variant}
                      checked={selectedVariant === option.variant}
                      onChange={(e) => {
                        if (isInStock) {
                          setSelectedVariant(e.target.value);
                        }
                      }}
                      disabled={!isInStock}
                    />
                    <span>
                      {option.label}{" "}
                      {!isInStock && (
                        <span className="out-of-stock">(Out of Stock)</span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="modal-buttons">
              <button
                className="btn-confirm"
                onClick={handleVariantSelect}
                disabled={
                  !pageTypeConfig.options.some(
                    (option) => option.variant === selectedVariant,
                  ) ||
                  pageTypeConfig.options.some(
                    (option) =>
                      option.variant === selectedVariant &&
                      !(product?.[option.stockField] ?? true),
                  )
                }
              >
                Add to Cart
              </button>
              <button
                className="btn-cancel"
                onClick={() => setShowVariantModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
