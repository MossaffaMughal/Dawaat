import React, { useState, useEffect } from "react";
import apiClient from "../utils/apiClient";
import { useAuth } from "../context/AuthContext";
import "../styles/AdminOrders.css";

const AdminOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await apiClient.get("/orders");
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await apiClient.put(`/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
      setSelectedOrder(null);
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Error updating order");
    }
  };

  const deleteOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await apiClient.delete(`/orders/${orderId}`);
        fetchOrders();
        setSelectedOrder(null);
      } catch (error) {
        console.error("Error deleting order:", error);
        alert("Error deleting order");
      }
    }
  };

  const filteredOrders =
    filterStatus === "all"
      ? orders
      : orders.filter((order) => order.status === filterStatus);

  if (user?.isAdmin === false) {
    return (
      <div className="admin-orders">
        <p>Access Denied</p>
      </div>
    );
  }

  return (
    <div className="admin-orders">
      <h1>Manage Orders</h1>

      <div className="filter-bar">
        <label>Filter by Status:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <p>Loading orders...</p>
      ) : (
        <div className="orders-container">
          <div className="orders-list">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`order-item ${selectedOrder?.id === order.id ? "selected" : ""}`}
                onClick={() => setSelectedOrder(order)}
              >
                <h3>{order.order_number}</h3>
                <p>{order.customer_name}</p>
                <p>Rs. {order.total_amount}</p>
                <span className={`status-badge ${order.status}`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>

          {selectedOrder && (
            <div className="order-details">
              <h2>Order Details</h2>
              <div className="detail">
                <span>Order Number:</span>
                <span>{selectedOrder.order_number}</span>
              </div>
              <div className="detail">
                <span>Customer Name:</span>
                <span>{selectedOrder.customer_name}</span>
              </div>
              <div className="detail">
                <span>Customer Email:</span>
                <span>{selectedOrder.customer_email}</span>
              </div>
              <div className="detail">
                <span>Customer Phone:</span>
                <span>{selectedOrder.customer_phone}</span>
              </div>
              <div className="detail">
                <span>Address:</span>
                <span>{selectedOrder.address}</span>
              </div>
              <div className="detail">
                <span>City:</span>
                <span>{selectedOrder.city}</span>
              </div>
              <div className="detail">
                <span>Total Amount:</span>
                <span>Rs. {selectedOrder.total_amount}</span>
              </div>

              <h3>Items</h3>
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product_name}</td>
                      <td>{item.quantity}</td>
                      <td>Rs. {item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3>Update Status</h3>
              <div className="status-buttons">
                {[
                  "pending",
                  "processing",
                  "shipped",
                  "delivered",
                  "cancelled",
                ].map((status) => (
                  <button
                    key={status}
                    className={`status-btn ${selectedOrder.status === status ? "active" : ""}`}
                    onClick={() => updateOrderStatus(selectedOrder.id, status)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>

              <button
                className="delete-btn"
                onClick={() => deleteOrder(selectedOrder.id)}
              >
                Delete Order
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
