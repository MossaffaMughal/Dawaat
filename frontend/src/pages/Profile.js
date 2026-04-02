import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import apiClient from "../utils/apiClient";
import "../styles/Profile.css";

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { wishlist } = useWishlist();
  const [profileData, setProfileData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [message, setMessage] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Fetch user profile
        const profileResponse = await apiClient.get(
          `/users/profile/${user.id}`,
        );
        // Handle both postalCode and postal_code field names
        const data = profileResponse.data;
        setProfileData({
          name: data.name || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          postalCode: data.postalCode || data.postal_code || "",
        });

        // Fetch user orders
        const ordersResponse = await apiClient.get(`/orders/user/${user.id}`);
        setOrders(ordersResponse.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setMessage("Error loading profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, navigate]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await apiClient.put(`/users/profile/${user.id}`, {
        name: profileData.name,
        phone: profileData.phone,
        address: profileData.address,
        city: profileData.city,
        postalCode: profileData.postalCode,
      });
      setMessage("Profile updated successfully!");
      setEditing(false);
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage("Error updating profile");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage("Passwords do not match");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      setSaving(true);
      await apiClient.post(`/users/change-password/${user.id}`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setMessage("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordForm(false);
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error changing password:", error);
      setMessage(error.response?.data?.message || "Error changing password");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadImage = async () => {
    if (!profileImage) {
      setMessage("Please select an image first");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      setUploadingImage(true);
      // For now, we store the image in localStorage/state since backend doesn't have image storage
      localStorage.setItem(
        "userProfileImage",
        JSON.stringify({
          userId: user.id,
          image: profileImage,
        }),
      );
      setMessage("Profile image updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error uploading image:", error);
      setMessage("Error uploading image");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setUploadingImage(false);
    }
  };

  const getProfileImage = () => {
    const saved = localStorage.getItem("userProfileImage");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.userId === user.id) {
          return data.image;
        }
      } catch (e) {
        console.error("Error reading saved image:", e);
      }
    }
    return null;
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="user-info">
            <div className="user-avatar profile-avatar-section">
              {getProfileImage() ? (
                <img
                  src={getProfileImage()}
                  alt="Profile"
                  className="avatar-image"
                />
              ) : (
                <span className="avatar-initials">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </span>
              )}
              <label
                className="avatar-upload-label"
                title="Click to change profile picture"
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
                <span className="upload-icon">📷</span>
              </label>
            </div>

            {profileImage && (
              <div className="image-preview-section">
                <div className="preview-label">Preview:</div>
                <img
                  src={profileImage}
                  alt="Preview"
                  className="preview-image"
                />
                <button
                  className="btn-primary"
                  onClick={handleUploadImage}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? "Uploading..." : "Save Image"}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setProfileImage(null)}
                >
                  Cancel
                </button>
              </div>
            )}

            <h2>{user?.name || user?.email}</h2>
            <p>{user?.email}</p>
          </div>

          <nav className="profile-nav">
            <button
              className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("profile");
                setShowPasswordForm(false);
              }}
            >
              My Profile
            </button>
            <button
              className={`nav-item ${activeTab === "orders" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("orders");
                setShowPasswordForm(false);
              }}
            >
              My Orders
            </button>
            <button
              className={`nav-item ${activeTab === "favorites" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("favorites");
                setShowPasswordForm(false);
              }}
            >
              ♥ Favorites
            </button>
            <button
              className={`nav-item ${showPasswordForm ? "active" : ""}`}
              onClick={() => {
                setShowPasswordForm(!showPasswordForm);
                setActiveTab("profile");
              }}
            >
              Change Password
            </button>
            <button className="nav-item logout" onClick={handleLogout}>
              Logout
            </button>
          </nav>
        </div>

        <div className="profile-content">
          {/* Profile Section */}
          {activeTab === "profile" && (
            <div className="section">
              <div className="section-header">
                <h2>Personal Information</h2>
                {!editing && (
                  <button className="btn-edit" onClick={() => setEditing(true)}>
                    Edit
                  </button>
                )}
              </div>

              {editing ? (
                <form className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={profileData.name}
                        onChange={handleProfileChange}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        placeholder="Your phone"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Address</label>
                    <input
                      type="text"
                      name="address"
                      value={profileData.address}
                      onChange={handleProfileChange}
                      placeholder="Your address"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        name="city"
                        value={profileData.city}
                        onChange={handleProfileChange}
                        placeholder="Your city"
                      />
                    </div>
                    <div className="form-group">
                      <label>Postal Code</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={profileData.postalCode}
                        onChange={handleProfileChange}
                        placeholder="Your postal code"
                      />
                    </div>
                  </div>

                  <div className="button-group">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="profile-info">
                  <div className="info-row">
                    <span className="label">Name:</span>
                    <span className="value">
                      {profileData.name || "Not set"}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Email:</span>
                    <span className="value">{user?.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Phone:</span>
                    <span className="value">
                      {profileData.phone || "Not set"}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Address:</span>
                    <span className="value">
                      {profileData.address || "Not set"}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">City:</span>
                    <span className="value">
                      {profileData.city || "Not set"}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Postal Code:</span>
                    <span className="value">
                      {profileData.postalCode || "Not set"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Change Password Section */}
          {showPasswordForm && activeTab === "profile" && (
            <div className="section">
              <h2>Change Password</h2>
              <form className="profile-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="button-group">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleChangePassword}
                    disabled={saving}
                  >
                    {saving ? "Updating..." : "Update Password"}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowPasswordForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Orders Section */}
          {activeTab === "orders" && (
            <div className="section">
              <h2>Order History</h2>
              {orders.length === 0 ? (
                <div className="empty-state">
                  <p>No orders yet</p>
                  <Link to="/products" className="btn-primary">
                    Continue Shopping
                  </Link>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map((order) => (
                    <div key={order.id} className="order-card">
                      <div
                        className="order-header"
                        onClick={() =>
                          setExpandedOrderId(
                            expandedOrderId === order.id ? null : order.id,
                          )
                        }
                      >
                        <div className="order-info">
                          <h4>Order #{order.order_number}</h4>
                          <p>
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="order-summary">
                          <span className="order-total">
                            Rs.{" "}
                            {(
                              parseFloat(order.total_amount || 0) +
                              parseFloat(order.shipping_cost || 0)
                            ).toFixed(2)}
                          </span>
                          <span className={`status status-${order.status}`}>
                            {order.status}
                          </span>
                          <span className="expand-icon">
                            {expandedOrderId === order.id ? "▼" : "▶"}
                          </span>
                        </div>
                      </div>
                      {expandedOrderId === order.id && (
                        <div className="order-details">
                          <div className="details-section">
                            <h5>Order Details</h5>
                            <p>
                              <strong>Customer:</strong> {order.customer_name}
                            </p>
                            <p>
                              <strong>Email:</strong> {order.customer_email}
                            </p>
                            <p>
                              <strong>Phone:</strong> {order.customer_phone}
                            </p>
                            <p>
                              <strong>Address:</strong> {order.shipping_address}
                            </p>
                          </div>
                          {order.items && order.items.length > 0 && (
                            <div className="items-section">
                              <h5>Items</h5>
                              <table className="items-table">
                                <thead>
                                  <tr>
                                    <th>Product</th>
                                    <th>Qty</th>
                                    <th>Price</th>
                                    <th>Type</th>
                                    <th>Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {order.items.map((item) => (
                                    <tr key={item.id}>
                                      <td>{item.product_name}</td>
                                      <td>{item.quantity}</td>
                                      <td>Rs. {item.price}</td>
                                      <td>
                                        {item.variant
                                          ? item.variant === "lined"
                                            ? "Lined pages"
                                            : "Plain pages"
                                          : "—"}
                                      </td>
                                      <td>
                                        Rs.{" "}
                                        {(item.price * item.quantity).toFixed(
                                          2,
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Favorites Section */}
          {activeTab === "favorites" && (
            <div className="section">
              <h2>My Favorites</h2>
              {!wishlist || wishlist.length === 0 ? (
                <div className="empty-state">
                  <p>No favorite products yet</p>
                  <Link to="/products" className="btn-primary">
                    Explore Products
                  </Link>
                </div>
              ) : (
                <div className="favorites-grid">
                  {wishlist.map((item) => {
                    // Get image URL - handle both possible structures
                    const image =
                      item.images && item.images.length > 0
                        ? item.images[0].image_url
                        : item.image_url;

                    return (
                      <Link
                        key={item.id}
                        to={`/products/${item.id}`}
                        className="favorite-card"
                      >
                        <div className="favorite-image">
                          {image ? (
                            <img
                              src={image}
                              alt={item.name}
                              onError={(e) => {
                                console.log(
                                  "Image load failed for:",
                                  item.name,
                                  image,
                                );
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                fontSize: "48px",
                                color: "#ccc",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "100%",
                                height: "100%",
                              }}
                            >
                              📷
                            </div>
                          )}
                        </div>
                        <h4>{item.name}</h4>
                        <p className="price">Rs. {item.price}</p>
                        <p className="category">{item.category}</p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {message && (
        <div
          className={`toast-notification ${message.includes("Error") || message.includes("failed") ? "toast-error" : "toast-success"}`}
        >
          <div className="toast-content">
            {message.includes("Error") || message.includes("failed")
              ? "✕"
              : "✓"}
            <span className="toast-message">{message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
