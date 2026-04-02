import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Auth.css";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, register, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        // Register with profile details
        await register(email, password, { name, phone, address, city });
        // Auto login after registration
        await login(email, password);
      }
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="auth-page">Loading...</div>;
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>{isLogin ? "Welcome Back" : "Create Your Account"}</h1>
          <p className="subtitle">
            {isLogin
              ? "Sign in to access your account and continue shopping"
              : "Join us to start saving your favorite products and tracking orders"}
          </p>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">
                <span className="required">*</span> Full Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                placeholder="John Doe"
                className="form-input"
              />
              <small>This will appear on your profile and orders</small>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">
              <span className="required">*</span> Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="form-input"
            />
            <small>We'll never share your email address</small>
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <span className="required">*</span> Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="At least 6 characters"
              className="form-input"
            />
            {!isLogin && (
              <small>
                Use a strong password with uppercase, numbers, and symbols
              </small>
            )}
            {isLogin && (
              <small>
                <a href="#forgot" className="forgot-password">
                  Forgot your password?
                </a>
              </small>
            )}
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="phone">
                  <span className="required">*</span> Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required={!isLogin}
                  placeholder="+92 300 1234567"
                  className="form-input"
                />
                <small>For order updates and delivery</small>
              </div>

              <div className="form-group">
                <label htmlFor="address">
                  <span className="required">*</span> Address
                </label>
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required={!isLogin}
                  placeholder="123 Main Street, Apt 4B"
                  className="form-input"
                />
                <small>Your delivery address</small>
              </div>

              <div className="form-group">
                <label htmlFor="city">
                  <span className="required">*</span> City
                </label>
                <input
                  type="text"
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required={!isLogin}
                  placeholder="Karachi"
                  className="form-input"
                />
                <small>Your city for accurate shipping</small>
              </div>
            </>
          )}

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? (
              <>
                <span className="spinner"></span> Processing...
              </>
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="auth-footer">
          <p className="toggle-auth-text">
            {isLogin
              ? "Don't have an account yet? "
              : "Already have an account? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="toggle-button"
            >
              {isLogin ? "Sign up for free" : "Sign in here"}
            </button>
          </p>
          <p className="terms-text">
            By {isLogin ? "signing in" : "creating an account"}, you agree to
            our <a href="/terms">Terms & Conditions</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
