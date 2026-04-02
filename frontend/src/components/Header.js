import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import "../styles/Header.css";

const Header = () => {
  const { getTotalItems } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const cartCount = getTotalItems();

  const handleLogout = () => {
    logout();
    navigate("/");
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

          <div className="search-container">
            <input
              type="text"
              placeholder="Search the store"
              className="search-input"
            />
            <button className="search-btn">
              <i className="fas fa-search"></i>
            </button>
          </div>

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
