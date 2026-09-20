import React, { useState, useEffect } from "react";
import apiClient from "../utils/apiClient";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import "../styles/Home.css";
import ProductCard from "../components/ProductCard";
import HomeReviewsSection from "../components/HomeReviewsSection";

const fallbackCategories = [
  {
    id: "notebook",
    category_key: "Notebook",
    name: "Journals",
    image_url: "/images/categories/journals.jpeg",
  },
  {
    id: "bookmark",
    category_key: "Bookmark",
    name: "Bookmarks",
    image_url: "/images/categories/bookmarks.jpeg",
  },
  {
    id: "notebooks",
    category_key: "Notebooks",
    name: "Notebooks",
    image_url: "/images/categories/notebooks.jpeg",
  },
  {
    id: "cards",
    category_key: "Cards",
    name: "Cards",
    image_url: "/images/categories/cards.jpeg",
  },
  {
    id: "stickers",
    category_key: "Stickers",
    name: "Stickers",
    image_url: "/images/categories/stickers.jpeg",
  },
];

const Home = () => {
  const [products, setProducts] = useState([]);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [heroBannerUrl, setHeroBannerUrl] = useState(
    "/images/banners/hero-banner.jpeg",
  );
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
    fetchHeroBanner();
    fetchCategories();
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

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get("/categories");
      setCategories(response.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories(fallbackCategories);
    }
  };

  const fetchHeroBanner = async () => {
    try {
      const response = await apiClient.get("/orders/hero-banner");
      if (response.data?.heroBannerUrl) {
        setHeroBannerUrl(response.data.heroBannerUrl);
      }
    } catch (error) {
      console.error("Error fetching hero banner URL:", error);
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
          backgroundImage: `url(${heroBannerUrl || "/images/banners/hero-banner.jpeg"})`,
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
          {categories.map((category) => (
            <Link
              to={`/products?category=${encodeURIComponent(category.category_key)}`}
              className="category-card-link"
              key={category.id}
            >
              <div className="category-card">
                <div
                  className="category-image"
                  style={{ backgroundImage: `url(${category.image_url})` }}
                >
                  <span className="category-label">{category.name}</span>
                </div>
              </div>
            </Link>
          ))}
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
                  .filter((p) =>
                    String(p.category || "")
                      .toLowerCase()
                      .includes("notebook"),
                  )
                  .slice(0, 3),
                ...products
                  .filter((p) => p.category === "Bookmark")
                  .slice(0, 3),
                ...products
                  .filter((p) => p.category === "Notebooks")
                  .slice(0, 3),
                ...products.filter((p) => p.category === "Cards").slice(0, 3),
                ...products
                  .filter((p) => p.category === "Stickers")
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
            <HomeReviewsSection />
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
