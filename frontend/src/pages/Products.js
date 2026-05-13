import React, { useState, useEffect } from "react";
import apiClient from "../utils/apiClient";
import { useCart } from "../context/CartContext";
import { useSearchParams } from "react-router-dom";
import "../styles/Products.css";
import ProductCard from "../components/ProductCard";
import HomeReviewsSection from "../components/HomeReviewsSection";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [notification, setNotification] = useState(null);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const { addToCart } = useCart();

  useEffect(() => {
    const categoryParam = searchParams.get("category");
    const searchParam = searchParams.get("search");
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    const sortByParam = searchParams.get("sortBy");

    console.log("URL Params - category:", categoryParam, "search:", searchParam, "minPrice:", minPriceParam, "maxPrice:", maxPriceParam, "sortBy:", sortByParam);

    setFilter(categoryParam || "all");
    setSearch(searchParam || "");
    setMinPrice(minPriceParam || "");
    setMaxPrice(maxPriceParam || "");
    setSortBy(sortByParam || "newest");
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();

        if (filter !== "all") {
          params.append("category", filter);
        }
        if (search) {
          params.append("search", search);
        }
        if (minPrice) {
          params.append("minPrice", minPrice);
        }
        if (maxPrice) {
          params.append("maxPrice", maxPrice);
        }
        if (sortBy) {
          params.append("sortBy", sortBy);
        }

        const queryString = params.toString();
        console.log("Fetching products with query:", queryString || "(no filters)");
        console.log("Filter state:", { filter, search, minPrice, maxPrice, sortBy });

        const response = await apiClient.get(`/products?${queryString}`);
        console.log("Backend returned", response.data.length, "products");
        setProducts(response.data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filter, search, minPrice, maxPrice, sortBy]);

  const handleAddToCart = (product, quantity, variant) => {
    addToCart(product, quantity, variant);
    setNotification(`✓ Added to cart`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleClearFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setFilter("all");
    setSortBy("newest");
  };

  return (
    <div className="products-page">
      <div className="products-header">
        <h1>Our Premium Collection</h1>
        <p>Explore our curated selection of elegant journals and bookmarks</p>
      </div>

      <div className="products-wrapper">
        <aside className="filters">
          <div className="filters-header">
            <h3>
              <i className="fas fa-filter"></i> Filters
            </h3>
            {(search || minPrice || maxPrice || filter !== "all") && (
              <button className="clear-filters" onClick={handleClearFilters}>
                Clear All
              </button>
            )}
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={handleSearchChange}
              className="search-input"
            />
            <i className="fas fa-search"></i>
          </div>

          <div className="filter-section">
            <h4>Categories</h4>
            <div className="filter-options">
              <label className={filter === "all" ? "active" : ""}>
                <input
                  type="radio"
                  name="category"
                  value="all"
                  checked={filter === "all"}
                  onChange={(e) => setFilter(e.target.value)}
                />
                <span>All Products</span>
              </label>
              <label className={filter === "Notebook" ? "active" : ""}>
                <input
                  type="radio"
                  name="category"
                  value="Notebook"
                  checked={filter === "Notebook"}
                  onChange={(e) => setFilter(e.target.value)}
                />
                <span>Journals</span>
              </label>
              <label className={filter === "Bookmark" ? "active" : ""}>
                <input
                  type="radio"
                  name="category"
                  value="Bookmark"
                  checked={filter === "Bookmark"}
                  onChange={(e) => setFilter(e.target.value)}
                />
                <span>Bookmarks</span>
              </label>
              <label className={filter === "Notebooks" ? "active" : ""}>
                <input
                  type="radio"
                  name="category"
                  value="Notebooks"
                  checked={filter === "Notebooks"}
                  onChange={(e) => setFilter(e.target.value)}
                />
                <span>Notebooks</span>
              </label>
              <label className={filter === "Cards" ? "active" : ""}>
                <input
                  type="radio"
                  name="category"
                  value="Cards"
                  checked={filter === "Cards"}
                  onChange={(e) => setFilter(e.target.value)}
                />
                <span>Cards</span>
              </label>
              <label className={filter === "Stickers" ? "active" : ""}>
                <input
                  type="radio"
                  name="category"
                  value="Stickers"
                  checked={filter === "Stickers"}
                  onChange={(e) => setFilter(e.target.value)}
                />
                <span>Stickers</span>
              </label>
              <label className={filter === "Bundles" ? "active" : ""}>
                <input
                  type="radio"
                  name="category"
                  value="Bundles"
                  checked={filter === "Bundles"}
                  onChange={(e) => setFilter(e.target.value)}
                />
                <span>Bundles</span>
              </label>
            </div>
          </div>

          <div className="filter-section">
            <h4>Price Range</h4>
            <div className="price-inputs">
              <input
                type="number"
                placeholder="Min price"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="price-input"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="price-input"
              />
            </div>
          </div>

          <div className="filter-section">
            <h4>Sort By</h4>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </aside>

        <main className="products-main">
          <div className="products-info">
            <p className="product-count">
              {products.length > 0 &&
                `Showing ${products.length} product${products.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading products...</p>
            </div>
          ) : products.length === 0 && filter !== "all" ? (
            <div className="no-products">
              <i className="fas fa-clock"></i>
              <h3>COMING SOON</h3>
              <p>This category is on the way. Please check back soon.</p>
              <button className="btn-secondary" onClick={handleClearFilters}>
                View All Products
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="no-products">
              <i className="fas fa-inbox"></i>
              <p>No products found matching your criteria</p>
              <button className="btn-secondary" onClick={handleClearFilters}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {products.map((product) => (
                <div key={product.id} className="product-item">
                  <ProductCard
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <HomeReviewsSection />

      {notification && (
        <div className="toast-notification-simple">{notification}</div>
      )}
    </div>
  );
};

export default Products;
