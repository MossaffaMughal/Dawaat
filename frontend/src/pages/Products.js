import React, { useState, useEffect, useRef } from "react";
import apiClient from "../utils/apiClient";
import { useCart } from "../context/CartContext";
import { useSearchParams } from "react-router-dom";
import "../styles/Products.css";
import ProductCard from "../components/ProductCard";
import HomeReviewsSection from "../components/HomeReviewsSection";
import { normalizeCategory } from "../utils/pageType";

const CATEGORY_CHUNK_SIZE = 4;

// Interleaves products so the "All Products" view shows a few items from
// each category (in categoryOrder, i.e. the same order as the home page
// category tiles) before moving to the next, looping back through the
// categories until every product has been placed.
const buildCategoryInterleavedOrder = (items, categoryOrder, chunkSize) => {
  const buckets = new Map();

  items.forEach((item) => {
    const key = item.category || "Uncategorized";
    if (!buckets.has(key)) {
      buckets.set(key, []);
    }
    buckets.get(key).push(item);
  });

  const orderedKeys = [
    ...categoryOrder.filter((key) => buckets.has(key)),
    ...[...buckets.keys()].filter((key) => !categoryOrder.includes(key)),
  ];

  const cursors = new Map(orderedKeys.map((key) => [key, 0]));
  const result = [];
  let remaining = items.length;

  while (remaining > 0) {
    let progressed = false;
    for (const key of orderedKeys) {
      const bucket = buckets.get(key);
      const cursor = cursors.get(key);
      if (cursor >= bucket.length) continue;

      const nextChunk = bucket.slice(cursor, cursor + chunkSize);
      result.push(...nextChunk);
      cursors.set(key, cursor + nextChunk.length);
      remaining -= nextChunk.length;
      progressed = true;
    }
    if (!progressed) break;
  }

  return result;
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState(
    () => searchParams.get("category") || "all",
  );
  const [notification, setNotification] = useState(null);
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [minPrice, setMinPrice] = useState(
    () => searchParams.get("minPrice") || "",
  );
  const [maxPrice, setMaxPrice] = useState(
    () => searchParams.get("maxPrice") || "",
  );
  const [sortBy, setSortBy] = useState(
    () => searchParams.get("sortBy") || "featured",
  );
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [refreshTick, setRefreshTick] = useState(0);
  const isBackgroundRefreshRef = useRef(false);
  const { addToCart } = useCart();

  // Re-fetch whenever this tab becomes visible/focused again, so admin
  // changes (like reordering products) show up without a manual reload.
  // Marked as a background refresh so it doesn't flash the loading spinner
  // and swap out the whole grid every time the tab regains focus.
  useEffect(() => {
    const handleRefresh = () => {
      if (document.visibilityState === "visible") {
        isBackgroundRefreshRef.current = true;
        setRefreshTick((tick) => tick + 1);
      }
    };

    window.addEventListener("focus", handleRefresh);
    document.addEventListener("visibilitychange", handleRefresh);

    return () => {
      window.removeEventListener("focus", handleRefresh);
      document.removeEventListener("visibilitychange", handleRefresh);
    };
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get("/categories");
        setCategories(response.data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, [refreshTick]);

  const matchesCategoryFilter = (productCategory, selectedCategory) => {
    if (selectedCategory === "all") return true;

    return (
      normalizeCategory(productCategory) === normalizeCategory(selectedCategory)
    );
  };

  useEffect(() => {
    const categoryParam = searchParams.get("category");
    const searchParam = searchParams.get("search");
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    const sortByParam = searchParams.get("sortBy");

    console.log(
      "URL Params - category:",
      categoryParam,
      "search:",
      searchParam,
      "minPrice:",
      minPriceParam,
      "maxPrice:",
      maxPriceParam,
      "sortBy:",
      sortByParam,
    );

    setFilter(categoryParam || "all");
    setSearch(searchParam || "");
    setMinPrice(minPriceParam || "");
    setMaxPrice(maxPriceParam || "");
    setSortBy(sortByParam || "featured");
  }, [searchParams]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");

    const syncFilterPanelState = () => {
      if (mediaQuery.matches) {
        setIsMobileFiltersOpen(false);
      } else {
        setIsMobileFiltersOpen(true);
      }
    };

    syncFilterPanelState();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", syncFilterPanelState);
      return () =>
        mediaQuery.removeEventListener("change", syncFilterPanelState);
    }

    mediaQuery.addListener(syncFilterPanelState);
    return () => mediaQuery.removeListener(syncFilterPanelState);
  }, []);

  useEffect(() => {
    let isStale = false;
    const isBackground = isBackgroundRefreshRef.current;
    isBackgroundRefreshRef.current = false;

    const fetchProducts = async () => {
      try {
        if (!isBackground) {
          setLoading(true);
        }
        const params = new URLSearchParams();

        if (filter && filter !== "all") {
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
        console.log(
          "Fetching products with query:",
          queryString || "(no filters)",
        );
        console.log("Filter state:", {
          filter,
          search,
          minPrice,
          maxPrice,
          sortBy,
        });

        const response = await apiClient.get(`/products?${queryString}`);
        console.log("Backend returned", response.data.length, "products");

        const filteredProducts = response.data.filter((product) =>
          matchesCategoryFilter(product.category, filter),
        );

        if (!isStale) {
          setProducts(filteredProducts);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        if (!isStale && !isBackground) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isStale = true;
    };
  }, [filter, search, minPrice, maxPrice, sortBy, refreshTick]);

  const displayProducts =
    filter === "all" && sortBy === "featured"
      ? buildCategoryInterleavedOrder(
          products,
          categories.map((category) => category.category_key),
          CATEGORY_CHUNK_SIZE,
        )
      : products;

  const handleAddToCart = (product, quantity, variant) => {
    addToCart(product, quantity, variant);
    setNotification(`✓ Added to cart`);
    setTimeout(() => setNotification(null), 3000);
  };

  // Keeps the current filter selections in the URL so a reload (or
  // sharing/bookmarking the link) restores what was actually selected,
  // instead of falling back to whatever category the user first arrived
  // with from the navbar or home page.
  const updateQueryParam = (key, value, isDefault) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (isDefault(value)) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
        return next;
      },
      { replace: true },
    );
  };

  const handleCategoryChange = (value) => {
    setFilter(value);
    updateQueryParam("category", value, (v) => v === "all");
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    updateQueryParam("search", value, (v) => !v);
  };

  const handleMinPriceChange = (value) => {
    setMinPrice(value);
    updateQueryParam("minPrice", value, (v) => !v);
  };

  const handleMaxPriceChange = (value) => {
    setMaxPrice(value);
    updateQueryParam("maxPrice", value, (v) => !v);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    updateQueryParam("sortBy", value, (v) => v === "featured");
  };

  const handleClearFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setFilter("all");
    setSortBy("featured");
    setSearchParams(new URLSearchParams(), { replace: true });
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
            <div className="filters-actions">
              {(search || minPrice || maxPrice || filter !== "all") && (
                <button className="clear-filters" onClick={handleClearFilters}>
                  Clear All
                </button>
              )}
              <button
                className="filters-toggle-btn"
                type="button"
                onClick={() => setIsMobileFiltersOpen((prev) => !prev)}
                aria-expanded={isMobileFiltersOpen}
                aria-controls="products-filters-content"
              >
                {isMobileFiltersOpen ? "Hide Filters" : "Show Filters"}
                <i
                  className={`fas fa-chevron-${isMobileFiltersOpen ? "up" : "down"}`}
                ></i>
              </button>
            </div>
          </div>

          <div
            id="products-filters-content"
            className={`filters-content ${isMobileFiltersOpen ? "open" : ""}`}
          >
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
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  />
                  <span>All Products</span>
                </label>
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className={
                      filter === category.category_key ? "active" : ""
                    }
                  >
                    <input
                      type="radio"
                      name="category"
                      value={category.category_key}
                      checked={filter === category.category_key}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                    />
                    <span>{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <h4>Price Range</h4>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="Min price"
                  value={minPrice}
                  onChange={(e) => handleMinPriceChange(e.target.value)}
                  className="price-input"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max price"
                  value={maxPrice}
                  onChange={(e) => handleMaxPriceChange(e.target.value)}
                  className="price-input"
                />
              </div>
            </div>

            <div className="filter-section">
              <h4>Sort By</h4>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="sort-select"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
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
              {displayProducts.map((product) => (
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
