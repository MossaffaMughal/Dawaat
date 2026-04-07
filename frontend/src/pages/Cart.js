import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import apiClient from "../utils/apiClient";
import "../styles/Cart.css";

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, getTotalPrice, clearCart } =
    useCart();
  const totalPrice = getTotalPrice();
  const [shippingCost, setShippingCost] = useState(250);

  useEffect(() => {
    const fetchShippingCost = async () => {
      try {
        const response = await apiClient.get("/orders/shipping/cost");
        setShippingCost(Number(response.data.shippingCost) || 0);
      } catch (error) {
        console.error("Error fetching shipping cost:", error);
        setShippingCost(250);
      }
    };

    fetchShippingCost();
  }, []);

  const grandTotal = totalPrice + shippingCost;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    // Store cart data for checkout page
    localStorage.setItem(
      "checkoutData",
      JSON.stringify({ items: cart, total: totalPrice }),
    );
    window.location.href = "/checkout";
  };

  return (
    <div className="cart-page">
      <h1>Shopping Cart</h1>

      {cart.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <Link to="/products" className="continue-shopping">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="cart-container">
          <div className="cart-items-section">
            <table className="cart-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={`${item.id}-${item.variant || "default"}`}>
                    <td className="product-name">
                      {item.name}
                      {item.variant && (
                        <span className="variant-info">
                          ({item.variant === "lined" ? "Lined" : "Plain"} pages)
                        </span>
                      )}
                    </td>
                    <td>Rs. {item.price}</td>
                    <td>
                      <div className="quantity-control">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          −
                        </button>
                        <input type="number" value={item.quantity} readOnly />
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>Rs. {(item.price * item.quantity).toFixed(2)}</td>
                    <td>
                      <button
                        className="remove-btn"
                        onClick={() => removeFromCart(item.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>Rs. {totalPrice.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping:</span>
              <span>Rs. {shippingCost.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Tax:</span>
              <span>Rs. 0</span>
            </div>
            <div className="summary-total">
              <span>Total:</span>
              <span>Rs. {grandTotal.toFixed(2)}</span>
            </div>

            <button className="checkout-btn" onClick={handleCheckout}>
              Proceed to Checkout
            </button>

            <Link to="/products" className="continue-shopping">
              Continue Shopping
            </Link>

            <button className="clear-cart-btn" onClick={clearCart}>
              Clear Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
