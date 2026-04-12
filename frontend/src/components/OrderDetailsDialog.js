import React, { useState } from "react";
import ReactDOM from "react-dom";
import ConfirmDialog from "./ConfirmDialog";
import "../styles/OrderDetailsDialog.css";

const OrderDetailsDialog = ({
  isOpen,
  order,
  onClose,
  onStatusChange,
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  console.log(
    "[OrderDetailsDialog] isOpen:",
    isOpen,
    "order:",
    order?.order_number,
  );

  if (!isOpen || !order) return null;

  const handleStatusChange = (e) => {
    onStatusChange(order.id, e.target.value);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    onDelete(order.id);
  };

  const totalAmount =
    parseFloat(order.total_amount) + parseFloat(order.shipping_cost || 0);

  const formatItemType = (item) => {
    const variant = String(item?.variant || "")
      .trim()
      .toLowerCase();
    if (variant === "lined") return "Lined pages";
    if (variant === "plain") return "Plain pages";
    if (variant) return item.variant;
    return "-";
  };

  return ReactDOM.createPortal(
    <>
      <div className="order-details-overlay">
        <div className="order-details-dialog">
          {/* Header */}
          <div className="order-details-header">
            <div>
              <h2>Order #{order.order_number}</h2>
              <span className={`status-badge ${order.status}`}>
                {order.status}
              </span>
            </div>
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="order-details-body">
            {/* Customer Info */}
            <div className="info-group">
              <h4>Customer</h4>
              <p>
                <strong>{order.customer_name}</strong>
              </p>
              <p>{order.customer_email}</p>
              <p>{order.customer_phone}</p>
            </div>

            {/* Delivery Address - HIGHLIGHTED */}
            <div className="info-group address-group">
              <h4>Delivery Address</h4>
              <div className="address-box">
                <p>
                  <strong>
                    {order.address && String(order.address).trim() !== ""
                      ? String(order.address).trim()
                      : "No address provided"}
                  </strong>
                </p>
                <p>
                  {order.city || "N/A"}, {order.postal_code || "N/A"}
                </p>
              </div>
            </div>

            {/* Items */}
            {order.items && order.items.length > 0 && (
              <div className="info-group">
                <h4>Items</h4>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Type</th>
                      <th align="right">Qty</th>
                      <th align="right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.product_name}</td>
                        <td>{formatItemType(item)}</td>
                        <td align="right">{item.quantity}</td>
                        <td align="right">
                          Rs. {parseFloat(item.price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary */}
            <div className="info-group summary-group">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>Rs. {parseFloat(order.total_amount).toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping:</span>
                <span>
                  Rs. {parseFloat(order.shipping_cost || 0).toFixed(2)}
                </span>
              </div>
              <div className="summary-row total">
                <span>
                  <strong>Total:</strong>
                </span>
                <span>
                  <strong>Rs. {totalAmount.toFixed(2)}</strong>
                </span>
              </div>
            </div>

            {/* Status Update */}
            <div className="info-group">
              <h4>Update Status</h4>
              <select
                value={order.status}
                onChange={handleStatusChange}
                className="status-select"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="order-details-footer">
            <button
              className="delete-btn"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Order
            </button>
            <button className="close-dialog-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Order"
        message={`Are you sure you want to delete order ${order.order_number}? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        isDangerous={true}
      />
    </>,
    document.body,
  );
};

export default OrderDetailsDialog;
