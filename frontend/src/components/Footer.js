import React from "react";
import { Link } from "react-router-dom";
import "../styles/Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Premium Journals & Bookmarks – Crafted to Inspire Every Word!</h3>
          <div className="footer-contact">
            <p className="contact-item">
              <i className="fab fa-whatsapp"></i>
              <a
                href="https://wa.me/923354023791"
                target="_blank"
                rel="noopener noreferrer"
              >
                +923354023791
              </a>
            </p>
            <p className="contact-item">
              <i className="fas fa-envelope"></i>
              <a href="mailto:dawaat.pk@gmail.com">dawaat.pk@gmail.com</a>
            </p>
          </div>
          <div className="social-links">
            <a
              href="https://instagram.com/dawaat.pk"
              target="_blank"
              rel="noopener noreferrer"
              className="instagram-link"
            >
              <i className="fab fa-instagram"></i>
              @dawaat.pk
            </a>
          </div>
        </div>

        <div className="footer-section">
          <h4>CONNECT</h4>
          <ul>
            <li>
              <Link to="/about">About Us</Link>
            </li>
            <li>
              <Link to="/contact">Contact Us</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>INFORMATION</h4>
          <ul>
            <li>
              <Link to="/shipping-policy">Shipping Policy</Link>
            </li>
            <li>
              <Link to="/privacy-policy">Privacy Policy</Link>
            </li>
            <li>
              <Link to="/returns-refunds">Returns & Refunds</Link>
            </li>
            <li>
              <Link to="/terms-conditions">Terms & Conditions</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>SHOP</h4>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/products">All Products</Link>
            </li>
            <li>
              <Link to="/products?category=Notebook">Journals</Link>
            </li>
            <li>
              <Link to="/products?category=Bookmark">Bookmarks</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 Dawaat. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
