import React, { useState, useEffect } from "react";
import apiClient from "../utils/apiClient";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import "../styles/Home.css";
import ProductCard from "../components/ProductCard";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get("/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product, quantity, variant) => {
    addToCart(product, quantity, variant);
    setNotification("✓ Added to cart");
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="home">
      <section
        className="hero"
        style={{
          backgroundImage: "url(/images/banners/hero-banner.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="hero-content">
          <Link to="/products" className="cta-button">
            Shop Now
          </Link>
        </div>
      </section>

      <section className="featured-categories">
        <h2>Featured Categories</h2>
        <div className="categories-grid">
          <Link to="/products?category=Notebook" className="category-card-link">
            <div className="category-card">
              <div
                className="category-image"
                style={{
                  backgroundImage: "url(/images/categories/journals.jpeg)",
                }}
              >
                <span className="category-label">Journals</span>
              </div>
            </div>
          </Link>
          <Link to="/products?category=Bookmark" className="category-card-link">
            <div className="category-card">
              <div
                className="category-image"
                style={{
                  backgroundImage: "url(/images/categories/bookmarks.jpeg)",
                }}
              >
                <span className="category-label">Bookmarks</span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      <section className="best-selling">
        <h2>Our Products</h2>

        {loading ? (
          <p>Loading products...</p>
        ) : (
          <>
            <div className="products-grid">
              {[
                ...products
                  .filter((p) => p.category === "Notebook")
                  .slice(0, 3),
                ...products
                  .filter((p) => p.category === "Bookmark")
                  .slice(0, 3),
              ].map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
            <Link to="/products" className="view-all-button">
              View All Products
              <i className="fas fa-arrow-right"></i>
            </Link>
          </>
        )}
      </section>

      {notification && (
        <div className="toast-notification-simple">{notification}</div>
      )}
    </div>
  );
};

export default Home;
