import React, { useState, useEffect } from "react";
import apiClient from "../utils/apiClient";
import { useAuth } from "../context/AuthContext";
import OrderDetailsDialog from "../components/OrderDetailsDialog";
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
      console.log("Orders fetched from API:", response.data);
      if (response.data.length > 0) {
        console.log("First order data:", response.data[0]);
        console.log("First order address field:", response.data[0].address);
      }
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await apiClient.put(`/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
      // Update selected order with new status
      setSelectedOrder((prev) =>
        prev ? { ...prev, status: newStatus } : null,
      );
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Error updating order");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await apiClient.delete(`/orders/${orderId}`);
      fetchOrders();
      setSelectedOrder(null);
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("Error deleting order");
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
      ) : filteredOrders.length === 0 ? (
        <p>No orders found</p>
      ) : (
        <div className="orders-list">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="order-item"
              onClick={() => setSelectedOrder(order)}
            >
              <div className="order-item-header">
                <h3>{order.order_number}</h3>
                <span className={`status-badge ${order.status}`}>
                  {order.status}
                </span>
              </div>
              <p className="customer-name">{order.customer_name}</p>
              <p className="payment-method">
                Payment:{" "}
                {order.payment_method === "online"
                  ? "Online Payment"
                  : order.payment_method === "cod"
                    ? "Cash on Delivery"
                    : order.payment_method || "N/A"}
              </p>
              <p className="order-amount">
                Rs.{" "}
                {(
                  parseFloat(order.total_amount) +
                  parseFloat(order.shipping_cost || 0)
                ).toFixed(2)}
              </p>
              <p className="order-date">
                {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      <OrderDetailsDialog
        isOpen={selectedOrder !== null}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteOrder}
      />
    </div>
  );
};

export default AdminOrders;
