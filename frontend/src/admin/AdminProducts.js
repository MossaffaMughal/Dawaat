import React, { useState, useEffect } from "react";
import apiClient from "../utils/apiClient";
import { useAuth } from "../context/AuthContext";
import "../styles/AdminProducts.css";

const AdminProducts = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Notebook",
    stock_quantity: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get("/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.put(`/products/${editingId}`, formData);
      } else {
        await apiClient.post("/products", formData);
      }
      fetchProducts();
      resetForm();
      alert(editingId ? "Product updated!" : "Product created!");
    } catch (error) {
      console.error("Error:", error);
      alert("Error saving product");
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      stock_quantity: product.stock_quantity,
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure?")) {
      try {
        await apiClient.delete(`/products/${id}`);
        fetchProducts();
        alert("Product deleted!");
      } catch (error) {
        console.error("Error:", error);
        alert("Error deleting product");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "Notebook",
      stock_quantity: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (user?.isAdmin === false) {
    return (
      <div className="admin-products">
        <p>Access Denied</p>
      </div>
    );
  }

  return (
    <div className="admin-products">
      <h1>Manage Products</h1>

      <button className="add-btn" onClick={() => setShowForm(!showForm)}>
        {showForm ? "Cancel" : "Add New Product"}
      </button>

      {showForm && (
        <form className="product-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price (Rs.)</label>
              <input
                type="number"
                step="0.01"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
              >
                <option value="Notebook">Journal</option>
                <option value="Bookmark">Bookmark</option>
              </select>
            </div>

            <div className="form-group">
              <label>Stock Quantity</label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="submit-btn">
            {editingId ? "Update Product" : "Create Product"}
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading products...</p>
      ) : (
        <table className="products-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>Rs. {product.price}</td>
                <td>{product.stock_quantity}</td>
                <td>
                  <button
                    className="edit-btn"
                    onClick={() => handleEdit(product)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(product.id)}
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
  );
};

export default AdminProducts;
