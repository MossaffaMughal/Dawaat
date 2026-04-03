import React, { useState, useEffect } from "react";
import apiClient from "../utils/apiClient";
import { useAuth } from "../context/AuthContext";
import AdminReviews from "./AdminReviews";
import ConfirmDialog from "../components/ConfirmDialog";
import "../styles/AdminDashboard.css";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
  });

  // Product form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productFormData, setProductFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Notebook",
    in_stock: true,
  });
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  // Order details state
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Dialog state
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    action: null,
    isDangerous: false,
  });

  // Notification state
  const [notification, setNotification] = useState(null);

  // Settings state
  const [shippingCost, setShippingCost] = useState(250);
  const [shippingCostInput, setShippingCostInput] = useState(250);
  const [savingShippingCost, setSavingShippingCost] = useState(false);

  useEffect(() => {
    fetchAdminData();
    fetchShippingCost();
  }, []);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchShippingCost = async () => {
    try {
      const response = await apiClient.get("/orders/shipping/cost");
      setShippingCost(response.data.shippingCost);
      setShippingCostInput(response.data.shippingCost);
    } catch (error) {
      console.error("Error fetching shipping cost:", error);
    }
  };

  const handleSaveShippingCost = async () => {
    try {
      setSavingShippingCost(true);
      await apiClient.put("/orders/shipping/cost", {
        shippingCost: parseFloat(shippingCostInput),
      });
      setShippingCost(shippingCostInput);
      showNotification("Shipping cost updated successfully!", "success");
    } catch (error) {
      console.error("Error updating shipping cost:", error);
      showNotification("Error updating shipping cost", "error");
    } finally {
      setSavingShippingCost(false);
    }
  };

  useEffect(() => {
    console.log("Active tab changed to:", activeTab);
  }, [activeTab]);

  // Completely suppress HMR/reload dialogs during upload
  useEffect(() => {
    // Create a handler that prevents ANY beforeunload dialog
    const suppressReload = (event) => {
      if (uploadingImage) {
        console.log("🔒 Blocking reload attempt during upload");
        // Delete the returnValue to prevent dialog
        delete event.returnValue;
        // Prevent default behavior
        event.preventDefault();
        // Return false for extra measure
        return false;
      }
    };

    // Set the handler with capture flag to intercept early
    window.addEventListener("beforeunload", suppressReload, true);

    return () => {
      window.removeEventListener("beforeunload", suppressReload, true);
    };
  }, [uploadingImage]);

  // Additional: Disable module.hot updates during upload
  useEffect(() => {
    if (uploadingImage && module.hot) {
      console.log("🔥 Disabling hot reload during upload");
      // Accept without applying changes during upload
      module.hot.decline();
    }
  }, [uploadingImage]);

  const fetchAdminData = async () => {
    console.log("fetchAdminData() called!");
    try {
      setLoading(true);
      const [ordersRes, productsRes] = await Promise.all([
        apiClient.get("/orders"),
        apiClient.get("/products"),
      ]);

      setOrders(ordersRes.data);
      setProducts(productsRes.data);
      setStats({
        totalOrders: ordersRes.data.length,
        totalRevenue: ordersRes.data.reduce(
          (sum, order) => sum + parseFloat(order.total_amount || 0),
          0,
        ),
        totalProducts: productsRes.data.length,
      });
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Product handlers
  const handleProductInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "price") {
      console.log(
        "[handleProductInputChange] Price changed to:",
        value,
        "Type:",
        typeof value,
      );
    }
    setProductFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();

    // Validate: at least one image must be present (new or existing)
    if (uploadedImages.length === 0 && !editingProductId) {
      showNotification(
        "Please upload at least 1 image for the product",
        "error",
      );
      return;
    }

    // Validate: no images currently uploading
    if (uploadingImage) {
      showNotification("Please wait while images are uploading...", "error");
      return;
    }

    try {
      // Ensure price is sent as a number, not string
      const submittedData = {
        ...productFormData,
        price: parseInt(productFormData.price, 10),
      };
      console.log("Submitting product data:", submittedData);

      // Get existing image URLs before update (for editing case)
      const existingImageUrls =
        editingProductId && uploadedImages.length > 0 ? uploadedImages : [];

      let productId;
      if (editingProductId) {
        await apiClient.put(`/products/${editingProductId}`, submittedData);
        productId = editingProductId;
      } else {
        const response = await apiClient.post("/products", submittedData);
        productId = response.data.product.id;
        console.log("New product created with ID:", productId);
      }

      // Only add NEW images (skip existing ones that are already in database)
      // If editing, uploadedImages contains both old and new URLs
      // We need to identify which are new by checking if they're data URLs
      const newImages = uploadedImages.filter(
        (url) => url.startsWith("data:") || !existingImageUrls.includes(url),
      );

      for (let i = 0; i < newImages.length; i++) {
        console.log(`Adding image ${i + 1} to product ${productId}`);
        await apiClient.post("/products/images/add", {
          productId,
          imageUrl: newImages[i],
          displayOrder: existingImageUrls.length + i,
        });
      }

      showNotification(
        editingProductId
          ? "Product updated successfully!"
          : "Product added successfully!",
        "success",
      );
      resetProductForm();
      fetchAdminData();
    } catch (error) {
      console.error("Error saving product:", error);
      showNotification("Error saving product: " + error.message, "error");
    }
  };

  const handleImageUpload = async (e) => {
    try {
      console.log("=== IMAGE UPLOAD STARTED ===");
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      // Check limit
      if (uploadedImages.length + files.length > 6) {
        setUploadError("Maximum 6 images allowed per product");
        setTimeout(() => setUploadError(""), 5000);
        if (e.target) {
          e.target.value = "";
        }
        return;
      }

      // Validate file sizes (10MB max per file)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE);

      if (oversizedFiles.length > 0) {
        const fileNames = oversizedFiles.map((f) => f.name).join(", ");
        setUploadError(
          `File(s) too large: ${fileNames}. Maximum size is 10MB per image.`,
        );
        setTimeout(() => setUploadError(""), 5000);
        if (e.target) {
          e.target.value = "";
        }
        return;
      }

      setUploadingImage(true);
      setUploadError("");
      setUploadProgress(0);
      console.log(`Starting upload of ${files.length} files...`);

      let successCount = 0;
      let failureCount = 0;
      const uploadedUrls = [];

      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        try {
          console.log(
            `Uploading file ${index + 1}/${files.length}: ${file.name} (${Math.round(file.size / 1024)}KB)`,
          );

          const formData = new FormData();
          formData.append("image", file);

          console.log("Making POST request to /upload...");
          const response = await apiClient.post("/upload", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          console.log("Upload response:", response.data);

          const returnedUrl = String(response.data.imageUrl || "").trim();
          const apiUrl =
            process.env.REACT_APP_API_URL || "http://localhost:5000/api";
          const baseUrl = apiUrl.replace(/\/api\/?$/, "");
          const fullImageUrl = /^https?:\/\//i.test(returnedUrl)
            ? returnedUrl
            : `${baseUrl}${returnedUrl.startsWith("/") ? "" : "/"}${returnedUrl}`;

          console.log("Full image URL:", fullImageUrl);
          uploadedUrls.push(fullImageUrl);
          successCount++;
          setUploadProgress(Math.round(((index + 1) / files.length) * 100));
        } catch (err) {
          console.error("❌ Upload failed for file:", file.name);
          console.error("Error status:", err.response?.status);
          console.error("Error data:", err.response?.data);
          console.error("Error message:", err.message);
          failureCount++;
          const errorMsg =
            err.response?.data?.error ||
            err.response?.data?.message ||
            err.message ||
            "Unknown error";
          setUploadError(`Failed to upload ${file.name}: ${errorMsg}`);
        }
      }

      // Update state with all successfully uploaded images
      if (uploadedUrls.length > 0) {
        setUploadedImages((prev) => [...prev, ...uploadedUrls]);
      }

      console.log(
        `=== IMAGE UPLOAD COMPLETED: ${successCount} success, ${failureCount} failed ===`,
      );

      if (failureCount === 0 && successCount > 0) {
        setUploadError("");
      }
    } catch (outerError) {
      console.error("!!! OUTER CATCH - CRITICAL ERROR !!!", outerError);
      setUploadError(
        outerError.message || "An unexpected error occurred during upload",
      );
    } finally {
      console.log("Upload finally block - cleaning up...");
      setUploadingImage(false);
      setUploadProgress(0);
      if (e.target) {
        e.target.value = "";
      }
      console.log("Upload cleanup complete");
    }
  };

  const removeUploadedImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditProduct = (product) => {
    console.log(
      "[handleEditProduct] Product price value:",
      product.price,
      "Type:",
      typeof product.price,
    );
    setProductFormData({
      name: product.name,
      description: product.description,
      price: String(product.price), // Ensure price is a string for input field
      category: product.category,
      in_stock: product.in_stock ?? true,
    });
    // Load existing product images for editing
    if (product.images && product.images.length > 0) {
      const imageUrls = product.images.map((img) => img.image_url);
      setUploadedImages(imageUrls);
      console.log("Loaded existing images for product:", imageUrls);
    } else {
      setUploadedImages([]);
    }
    setEditingProductId(product.id);
    setShowProductForm(true);
  };

  const handleDeleteProduct = (productId) => {
    setDialog({
      isOpen: true,
      title: "Delete Product",
      message:
        "Are you sure you want to delete this product? This action cannot be undone.",
      isDangerous: true,
      action: async () => {
        try {
          await apiClient.delete(`/products/${productId}`);
          fetchAdminData();
          showNotification("Product deleted successfully", "success");
        } catch (error) {
          console.error("Error deleting product:", error);
          const errorMessage =
            error.response?.data?.message || "Error deleting product";
          showNotification(errorMessage, "error");
        }
      },
    });
  };

  const handleToggleStock = async (productId, currentStatus) => {
    try {
      console.log(
        "Toggling stock for product:",
        productId,
        "Current status:",
        currentStatus,
      );
      const token = localStorage.getItem("token");
      console.log("Token exists:", !!token);

      const response = await apiClient.put(`/products/${productId}`, {
        in_stock: !currentStatus,
      });

      console.log("Stock update response:", response.data);
      fetchAdminData();
    } catch (error) {
      console.error("Error toggling stock status:", error);
      console.error("Response status:", error.response?.status);
      console.error("Response data:", error.response?.data);
      showNotification(
        "Error updating stock status: " +
          (error.response?.data?.message || error.message),
        "error",
      );
    }
  };

  const resetProductForm = () => {
    setShowProductForm(false);
    setEditingProductId(null);
    setProductFormData({
      name: "",
      description: "",
      price: "",
      category: "Notebook",
      in_stock: true,
    });
    setUploadedImages([]);
    setUploadError("");
  };

  // Order handlers
  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await apiClient.put(`/orders/${orderId}/status`, { status });
      fetchAdminData();
      showNotification("Order status updated successfully", "success");
    } catch (error) {
      console.error("Error updating order:", error);
      showNotification("Error updating order status", "error");
    }
  };

  const handleDeleteOrder = (orderId) => {
    setDialog({
      isOpen: true,
      title: "Delete Order",
      message:
        "Are you sure you want to delete this order? This action cannot be undone.",
      isDangerous: true,
      action: async () => {
        try {
          await apiClient.delete(`/orders/${orderId}`);
          fetchAdminData();
          setSelectedOrder(null);
          showNotification("Order deleted successfully", "success");
        } catch (error) {
          console.error("Error deleting order:", error);
          showNotification("Error deleting order", "error");
        }
      },
    });
  };

  if (user?.isAdmin === false) {
    return (
      <div className="admin-container">
        <p>Access Denied</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Sidebar Menu */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>Admin Panel</h2>
        </div>

        <nav className="admin-menu">
          <button
            className={`admin-menu-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => {
              console.log("DASHBOARD BUTTON CLICKED");
              setActiveTab("dashboard");
            }}
          >
            📊 Dashboard
          </button>
          <button
            className={`admin-menu-item ${activeTab === "products" ? "active" : ""}`}
            onClick={() => {
              console.log("PRODUCTS BUTTON CLICKED");
              setActiveTab("products");
            }}
          >
            📦 Products
          </button>
          <button
            className={`admin-menu-item ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => {
              console.log("ORDERS BUTTON CLICKED");
              setActiveTab("orders");
            }}
          >
            🛍️ Orders
          </button>
          <button
            className={`admin-menu-item ${activeTab === "reviews" ? "active" : ""}`}
            onClick={() => {
              console.log("REVIEWS BUTTON CLICKED");
              setActiveTab("reviews");
            }}
          >
            ⭐ Reviews
          </button>
          <button
            className={`admin-menu-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => {
              console.log("SETTINGS BUTTON CLICKED");
              setActiveTab("settings");
            }}
          >
            ⚙️ Settings
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-content">
        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="admin-section">
            <h1>Dashboard</h1>

            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Orders</h3>
                <p className="stat-value">{stats.totalOrders}</p>
              </div>
              <div className="stat-card">
                <h3>Total Revenue</h3>
                <p className="stat-value">
                  Rs. {stats.totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="stat-card">
                <h3>Total Products</h3>
                <p className="stat-value">{stats.totalProducts}</p>
              </div>
            </div>

            <div className="admin-section">
              <h2>Recent Orders</h2>
              {loading ? (
                <p>Loading...</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 10).map((order) => (
                      <tr key={order.id}>
                        <td>{order.order_number}</td>
                        <td>{order.customer_name}</td>
                        <td>Rs. {order.total_amount}</td>
                        <td>
                          <span className={`status ${order.status}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === "products" && (
          <div className="admin-section">
            <h1>Products Management</h1>

            <button
              type="button"
              className="add-btn"
              onClick={() => {
                resetProductForm();
                setShowProductForm(true);
              }}
            >
              + Add Product
            </button>

            {showProductForm && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleProductSubmit(e);
                }}
                className="admin-form"
              >
                <h3>{editingProductId ? "Edit Product" : "Add New Product"}</h3>

                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={productFormData.name}
                    onChange={handleProductInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={productFormData.description}
                    onChange={handleProductInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Price (Rs.)</label>
                  <input
                    type="number"
                    name="price"
                    value={productFormData.price}
                    onChange={handleProductInputChange}
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    required
                  />
                  <small style={{ color: "#666", fontSize: "12px" }}>
                    Enter the exact price in Pakistani Rupees
                  </small>
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select
                    name="category"
                    value={productFormData.category}
                    onChange={handleProductInputChange}
                  >
                    <option value="Notebook">Journal</option>
                    <option value="Bookmark">Bookmark</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="in_stock"
                      checked={productFormData.in_stock}
                      onChange={(e) =>
                        setProductFormData((prev) => ({
                          ...prev,
                          in_stock: e.target.checked,
                        }))
                      }
                    />
                    In Stock
                  </label>
                </div>

                <div className="form-group">
                  <label htmlFor="product-images">
                    Product Images (Max 6 images, 10MB each)
                  </label>
                  <input
                    id="product-images"
                    name="product-images"
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => {
                      console.log("File input onChange triggered");
                      handleImageUpload(e);
                    }}
                    disabled={uploadingImage || uploadedImages.length >= 6}
                    onKeyPress={(e) => {
                      console.log("File input key press:", e.key);
                      if (e.key === "Enter") {
                        e.preventDefault();
                      }
                    }}
                  />
                  {uploadError && (
                    <p style={{ color: "#d32f2f", marginTop: "8px" }}>
                      ⚠️ {uploadError}
                    </p>
                  )}
                  {uploadingImage && (
                    <div style={{ marginTop: "12px" }}>
                      <p style={{ color: "#666", fontSize: "13px" }}>
                        Uploading... {uploadProgress}%
                      </p>
                      <div
                        style={{
                          width: "100%",
                          height: "4px",
                          backgroundColor: "#eee",
                          borderRadius: "2px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${uploadProgress}%`,
                            height: "100%",
                            backgroundColor: "var(--primary-color)",
                            transition: "width 0.3s",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {uploadedImages.length > 0 && (
                  <div className="form-group">
                    <label>Uploaded Images ({uploadedImages.length}/6)</label>
                    <div className="uploaded-images">
                      {uploadedImages.map((image, index) => (
                        <div key={index} className="image-preview">
                          <img
                            src={image}
                            alt={`Uploaded ${index + 1}`}
                            onError={(e) => {
                              console.error("Image failed to load:", image);
                              console.error("IMG element error:", e);
                              e.target.src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f0f0f0' width='100' height='100'/%3E%3Ctext x='50' y='50' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='12' fill='%23999'%3EFailed to load%3C/text%3E%3C/svg%3E";
                            }}
                            onLoad={() => {
                              console.log("Image loaded successfully:", image);
                            }}
                          />
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => removeUploadedImage(index)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-buttons">
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={
                      (!editingProductId && uploadedImages.length === 0) ||
                      uploadingImage
                    }
                    title={
                      !editingProductId && uploadedImages.length === 0
                        ? "Please upload at least 1 image for new products"
                        : uploadingImage
                          ? "Please wait while images are uploading..."
                          : ""
                    }
                  >
                    {uploadingImage
                      ? "Uploading images..."
                      : editingProductId
                        ? "Update"
                        : "Add"}{" "}
                    Product{" "}
                    {uploadedImages.length > 0
                      ? `(${uploadedImages.length} image${uploadedImages.length !== 1 ? "s" : ""})`
                      : editingProductId
                        ? "(Keep existing)"
                        : "(No images)"}
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={resetProductForm}
                    disabled={uploadingImage}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <h2>All Products</h2>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>{product.name}</td>
                      <td>Rs. {product.price}</td>
                      <td>{product.category}</td>
                      <td>
                        <button
                          type="button"
                          className={`stock-toggle-btn ${
                            product.in_stock ? "in-stock" : "out-of-stock"
                          }`}
                          onClick={() =>
                            handleToggleStock(product.id, product.in_stock)
                          }
                          title="Click to toggle stock status"
                        >
                          <span className="toggle-icon">
                            {product.in_stock ? "✓" : "✕"}
                          </span>
                          <span className="toggle-text">
                            {product.in_stock ? "In Stock" : "Out of Stock"}
                          </span>
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => handleEditProduct(product)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div className="admin-section">
            <h1>Orders Management</h1>

            <h2>All Orders</h2>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.order_number}</td>
                      <td>{order.customer_name}</td>
                      <td>Rs. {order.total_amount}</td>
                      <td>
                        <span className={`status ${order.status}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>{new Date(order.created_at).toLocaleDateString()}</td>
                      <td>
                        <button
                          type="button"
                          className="view-btn"
                          onClick={() => setSelectedOrder(order)}
                        >
                          View
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteOrder(order.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedOrder && (
              <div className="order-details">
                <h3>Order #{selectedOrder.order_number} Details</h3>
                <p>
                  <strong>Customer:</strong> {selectedOrder.customer_name}
                </p>
                <p>
                  <strong>Email:</strong> {selectedOrder.customer_email}
                </p>
                <p>
                  <strong>Phone:</strong> {selectedOrder.customer_phone}
                </p>
                <p>
                  <strong>Address:</strong> {selectedOrder.shipping_address}
                </p>
                <p>
                  <strong>Amount:</strong> Rs. {selectedOrder.total_amount}
                </p>
                <p>
                  <strong>Status:</strong> {selectedOrder.status}
                </p>

                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div className="order-items-section">
                    <h4>Order Items</h4>
                    <table className="order-items-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Quantity</th>
                          <th>Price</th>
                          <th>Type</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item) => (
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
                              Rs. {(item.price * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="status-update">
                  <label>Update Status:</label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) =>
                      handleUpdateOrderStatus(selectedOrder.id, e.target.value)
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setSelectedOrder(null)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === "reviews" && <AdminReviews />}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="admin-section">
            <h1>Settings</h1>

            <div className="settings-card">
              <div className="setting-item">
                <h3>Shipping Cost</h3>
                <p className="setting-description">
                  Set the shipping cost for all orders (in Pakistani Rupees)
                </p>

                <div className="setting-control">
                  <div className="input-group">
                    <span className="currency">Rs.</span>
                    <input
                      type="number"
                      value={shippingCostInput}
                      onChange={(e) =>
                        setShippingCostInput(parseFloat(e.target.value) || 0)
                      }
                      min="0"
                      step="1"
                      placeholder="Enter shipping cost"
                      className="setting-input"
                    />
                  </div>
                  <button
                    className="btn-save-setting"
                    onClick={handleSaveShippingCost}
                    disabled={savingShippingCost}
                  >
                    {savingShippingCost ? "Saving..." : "Save"}
                  </button>
                </div>

                {shippingCost === shippingCostInput && (
                  <p className="setting-info">
                    ✓ Current shipping cost: Rs. {shippingCost}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {notification && (
          <div className={`toast-notification toast-${notification.type}`}>
            <div className="toast-content">
              {notification.type === "success" && "✓"}
              {notification.type === "error" && "✕"}
              {notification.type === "warning" && "⚠"}
              <span className="toast-message">{notification.message}</span>
            </div>
          </div>
        )}

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={dialog.isOpen}
          title={dialog.title}
          message={dialog.message}
          isDangerous={dialog.isDangerous}
          onConfirm={() => {
            if (dialog.action) {
              dialog.action();
            }
            setDialog({ ...dialog, isOpen: false });
          }}
          onCancel={() => setDialog({ ...dialog, isOpen: false })}
          confirmText={dialog.isDangerous ? "Delete" : "OK"}
        />
      </main>
    </div>
  );
};

export default AdminDashboard;
