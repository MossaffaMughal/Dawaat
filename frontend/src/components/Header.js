import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import "../styles/Header.css";

const Header = () => {
  const { getTotalItems } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const cartCount = getTotalItems();
  const [searchTerm, setSearchTerm] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchTerm.trim();

    if (!query) {
      navigate("/products");
      return;
    }

    navigate(`/products?search=${encodeURIComponent(query)}`);
  };

  const getProfileImage = () => {
    const saved = localStorage.getItem("userProfileImage");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.userId === user?.id) {
          return data.image;
        }
      } catch (e) {
        console.error("Error reading saved image:", e);
      }
    }
    return null;
  };

  return (
    <header className="header">
      <div className="header-main">
        <div className="navbar">
          <Link to="/" className="logo">
            <img src="/logo.png" alt="Dawaat Logo" className="logo-img" />
            <span className="brand-name">Dawaat</span>
          </Link>

          <form className="search-container" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search the store"
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="search-btn" type="submit" aria-label="Search">
              <i className="fas fa-search"></i>
            </button>
          </form>

          <div className="header-icons">
            {user ? (
              <div className="user-menu">
                <Link to="/profile" className="profile-link">
                  <div className="profile-avatar-small">
                    {getProfileImage() ? (
                      <img
                        src={getProfileImage()}
                        alt={user.name || user.email}
                        className="avatar-img-small"
                      />
                    ) : (
                      <span className="avatar-initial-small">
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </span>
                    )}
                  </div>
                  <span className="profile-name">
                    {user.name || user.email}
                  </span>
                </Link>
                {user.isAdmin && (
                  <Link to="/admin" className="admin-link">
                    Admin
                  </Link>
                )}
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/auth" className="icon-link">
                <i className="fas fa-user"></i> Sign in
              </Link>
            )}
            <Link to="/cart" className="cart-link">
              <i className="fas fa-shopping-cart"></i> Cart
              <span className="cart-count">{cartCount}</span>
            </Link>
          </div>
        </div>

        <nav className="main-nav">
          <Link to="/">Home</Link>
          <Link to="/products">All Products</Link>
          <Link to="/products?category=Notebook">Journals</Link>
          <Link to="/products?category=Bookmark">Bookmarks</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
