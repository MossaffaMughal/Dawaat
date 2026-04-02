import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../utils/apiClient";
import "../styles/Checkout.css";

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    customerName: user?.name || "",
    customerEmail: user?.email || "",
    customerPhone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    postalCode: user?.postalCode || "",
    paymentMethod: "cod",
    shippingMethod: "standard",
  });
  const [loading, setLoading] = useState(false);
  const [shippingCost, setShippingCost] = useState(250);

  const checkoutData = JSON.parse(localStorage.getItem("checkoutData") || "{}");

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    // Fetch current shipping cost
    const fetchShippingCost = async () => {
      try {
        const response = await apiClient.get("/orders/shipping/cost");
        setShippingCost(parseFloat(response.data.shippingCost));
      } catch (error) {
        console.error("Error fetching shipping cost:", error);
        setShippingCost(250); // Default fallback
      }
    };
    fetchShippingCost();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Map cart items to match backend expectations
      const mappedItems = checkoutData.items.map((item) => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
        variant: item.variant || null,
      }));

      const orderData = {
        ...formData,
        items: mappedItems,
        totalAmount: checkoutData.total,
        userId: user?.id || null, // null for guest checkout
      };

      const response = await apiClient.post("/orders", orderData);

      // Clear cart and checkout data
      localStorage.removeItem("cart");
      localStorage.removeItem("checkoutData");

      showNotification(
        `✓ Order placed successfully! Order #: ${response.data.order.order_number}`,
        "success",
      );
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      console.error("Error placing order:", error);
      showNotification("Error placing order. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!checkoutData.items) {
    return (
      <div className="checkout">
        <p>
          No items in cart. <a href="/products">Continue shopping</a>
        </p>
      </div>
    );
  }

  const subtotal = checkoutData.total || 0;
  const total = subtotal + shippingCost;

  return (
    <div className="checkout">
      <h1>Checkout</h1>

      <div className="checkout-container">
        <form className="checkout-form" onSubmit={handleSubmit}>
          {!user && (
            <div className="guest-notice">
              <p>
                You're checking out as a guest. <a href="/auth">Sign in</a> to
                save your details.
              </p>
            </div>
          )}

          <div className="form-section">
            <h2>Shipping Information</h2>

            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="Street address"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Delivery & Payment</h2>

            <div className="shipping-info">
              <div className="shipping-icon">
                <i className="fas fa-truck"></i>
              </div>
              <div className="shipping-details">
                <label>Standard Delivery</label>
                <p>Delivery in 5-7 business days</p>
              </div>
            </div>

            <div className="payment-info">
              <div className="payment-icon">
                <i className="fas fa-money-bill-wave"></i>
              </div>
              <div className="payment-details">
                <label>Payment Method</label>
                <p>Cash on Delivery</p>
              </div>
            </div>
          </div>

          <div className="order-summary">
            <h2>Order Summary</h2>

            <div className="summary-items">
              {checkoutData.items?.map((item) => (
                <div key={item.id} className="summary-item">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>Rs. {(item.price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>

            <div className="summary-costs">
              <div className="summary-item">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toFixed(0)}</span>
              </div>
              <div className="summary-item">
                <span>Shipping</span>
                <span>Rs. {shippingCost.toFixed(0)}</span>
              </div>
            </div>

            <div className="summary-total">
              <span>Total</span>
              <span>Rs. {total.toFixed(0)}</span>
            </div>
          </div>

          <button type="submit" disabled={loading} className="place-order-btn">
            {loading ? "Placing Order..." : "Place Order"}
          </button>
        </form>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className={`toast-notification toast-${notification.type}`}>
          <div className="toast-content">
            <span className="toast-message">{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
