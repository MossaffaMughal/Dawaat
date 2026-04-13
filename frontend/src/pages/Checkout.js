import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import apiClient from "../utils/apiClient";
import "../styles/Checkout.css";

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [notification, setNotification] = useState(null);
  const [successDialog, setSuccessDialog] = useState({
    isOpen: false,
    orderNumber: "",
    copied: false,
  });
  const [formData, setFormData] = useState({
    customerName: user?.name || "",
    customerEmail: user?.email || "",
    customerPhone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    postalCode: user?.postalCode || user?.postal_code || "",
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

  // Update form data when user profile data loads
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        customerName: user.name || prev.customerName,
        customerEmail: user.email || prev.customerEmail,
        customerPhone: user.phone || prev.customerPhone,
        address: user.address || prev.address,
        city: user.city || prev.city,
        postalCode: user.postalCode || user.postal_code || prev.postalCode,
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const isOnlinePayment = formData.paymentMethod === "online";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Additional client-side validation
    if (!formData.customerName?.trim()) {
      showNotification("Please enter your full name", "error");
      setLoading(false);
      return;
    }
    if (!formData.customerEmail?.trim()) {
      showNotification("Please enter your email address", "error");
      setLoading(false);
      return;
    }
    if (!formData.customerPhone?.trim()) {
      showNotification("Please enter your phone number", "error");
      setLoading(false);
      return;
    }
    if (!formData.address?.trim()) {
      showNotification("Please enter your delivery address", "error");
      setLoading(false);
      return;
    }
    if (!formData.city?.trim()) {
      showNotification("Please enter your city", "error");
      setLoading(false);
      return;
    }
    if (!formData.postalCode?.trim()) {
      showNotification("Please enter your postal code", "error");
      setLoading(false);
      return;
    }

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

      // Log the order data being sent (for debugging)
      console.log("Order data being sent:", orderData);

      const response = await apiClient.post("/orders", orderData);

      console.log("Order response:", response.data);

      const orderNumber = response.data.order.order_number;

      console.log("Order placed with number:", orderNumber);

      // Clear cart from context and localStorage
      clearCart();
      localStorage.removeItem("cart");
      localStorage.removeItem("checkoutData");

      // Set flag for cart page to show success message
      console.log(
        "Setting sessionStorage with orderPlaced and orderNumber:",
        orderNumber,
      );
      sessionStorage.setItem("orderPlaced", "true");
      sessionStorage.setItem("orderNumber", orderNumber);

      console.log("SessionStorage after:", {
        orderPlaced: sessionStorage.getItem("orderPlaced"),
        orderNumber: sessionStorage.getItem("orderNumber"),
      });

      // Navigate to cart immediately - success message will show there
      console.log("Navigating to /cart");
      navigate("/cart");
    } catch (error) {
      console.error("Error placing order:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Error placing order. Please try again.";
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(successDialog.orderNumber);
    setSuccessDialog((prev) => ({ ...prev, copied: true }));
    setTimeout(() => {
      setSuccessDialog((prev) => ({ ...prev, copied: false }));
    }, 2000);
  };

  const handleSuccessDialogOK = () => {
    setSuccessDialog({ isOpen: false, orderNumber: "", copied: false });
    navigate("/cart");
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
                <div className="payment-options">
                  <label
                    className={`payment-option ${
                      formData.paymentMethod === "cod" ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === "cod"}
                      onChange={handleChange}
                    />
                    <span className="payment-option-content">
                      <span className="payment-option-title">
                        Cash on Delivery
                      </span>
                      <span className="payment-option-subtitle">
                        Pay when your order arrives.
                      </span>
                    </span>
                  </label>

                  <label
                    className={`payment-option ${
                      formData.paymentMethod === "online" ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="online"
                      checked={formData.paymentMethod === "online"}
                      onChange={handleChange}
                    />
                    <span className="payment-option-content">
                      <span className="payment-option-title">
                        Online Payment
                      </span>
                      <span className="payment-option-subtitle">
                        Transfer the amount using bank details below.
                      </span>
                    </span>
                  </label>
                </div>

                {isOnlinePayment && (
                  <div className="online-payment-note">
                    <p className="online-payment-intro">
                      For online payments, kindly send the amount to:
                    </p>
                    <div className="online-payment-bank-details">
                      <p>
                        <span>Account Title:</span> Fatima Latif
                      </p>
                      <p>
                        <span>Bank:</span> Askari Bank
                      </p>
                      <p>
                        <span>IBAN:</span> PK18ASCM0003200320026046
                      </p>
                    </div>
                    <p className="online-payment-whatsapp">
                      Please share the transaction screenshot on WhatsApp at{" "}
                      <a
                        href="https://wa.me/923354023791"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        +923354023791
                      </a>
                      .
                    </p>
                  </div>
                )}
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

      {/* Order Success Dialog */}
      {successDialog.isOpen && (
        <div className="success-dialog-overlay">
          <div className="success-dialog">
            <div className="success-dialog-icon">✓</div>
            <h2>Order Placed Successfully!</h2>
            <p className="success-message">
              Your order has been placed successfully. Your order number is:
            </p>
            <div className="order-number-section">
              <div className="order-number-display">
                <strong>{successDialog.orderNumber}</strong>
              </div>
              <button
                className="copy-button"
                onClick={copyOrderNumber}
                title="Copy order number"
              >
                {successDialog.copied ? "✓ Copied!" : "📋 Copy"}
              </button>
            </div>
            <p className="order-info">
              You will receive a confirmation email shortly with your order
              details.
            </p>
            <button
              className="success-dialog-ok-button"
              onClick={handleSuccessDialogOK}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
