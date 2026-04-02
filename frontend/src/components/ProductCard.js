import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../utils/apiClient";
import { useWishlist } from "../context/WishlistContext";
import ReviewStats from "./ReviewStats";
import "../styles/ProductCard.css";

const ProductCard = ({ product, onAddToCart }) => {
  const [mainImage, setMainImage] = useState(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState("plain");
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    if (product.images && product.images.length > 0) {
      setMainImage(product.images[0].image_url);
    }
  }, [product]);

  const isJournal = product.category === "Notebook";

  const handleAddToCart = () => {
    if (isJournal) {
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
            {product.discount && <span className="sale-badge">Sale</span>}
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
              <span className="price">Rs.{product.price}</span>
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

      {showVariantModal && isJournal && (
        <div
          className="modal-overlay"
          onClick={() => setShowVariantModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Choose Page Type</h3>
            <p>Select between lined or plain pages</p>
            <div className="variant-options">
              <label className="variant-option">
                <input
                  type="radio"
                  name="pageType"
                  value="plain"
                  checked={selectedVariant === "plain"}
                  onChange={(e) => setSelectedVariant(e.target.value)}
                />
                <span>Plain Pages</span>
              </label>
              <label className="variant-option">
                <input
                  type="radio"
                  name="pageType"
                  value="lined"
                  checked={selectedVariant === "lined"}
                  onChange={(e) => setSelectedVariant(e.target.value)}
                />
                <span>Lined Pages</span>
              </label>
            </div>
            <div className="modal-buttons">
              <button className="btn-confirm" onClick={handleVariantSelect}>
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
