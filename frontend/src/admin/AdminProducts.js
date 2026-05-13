import React, { useState, useEffect } from "react";
import apiClient from "../utils/apiClient";
import { useAuth } from "../context/AuthContext";
import ProductFormModal from "../components/ProductFormModal";
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
    sale_price: "",
    category: "Notebook",
    stock_quantity: "",
    plain_pages_in_stock: true,
    lined_pages_in_stock: true,
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
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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
      sale_price: product.sale_price ?? "",
      category: product.category,
      stock_quantity: product.stock_quantity,
      plain_pages_in_stock: product.plain_pages_in_stock ?? true,
      lined_pages_in_stock: product.lined_pages_in_stock ?? true,
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
      sale_price: "",
      category: "Notebook",
      stock_quantity: "",
      plain_pages_in_stock: true,
      lined_pages_in_stock: true,
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

      <button className="add-btn" onClick={() => setShowForm(true)}>
        + Add Product
      </button>

      <ProductFormModal
        isOpen={showForm}
        editingId={editingId}
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        onClose={resetForm}
      />

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
              <th>Plain Pages</th>
              <th>Lined Pages</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>
                  {product.sale_price !== null &&
                  product.sale_price !== undefined &&
                  product.sale_price !== "" ? (
                    <>
                      <span
                        style={{
                          textDecoration: "line-through",
                          color: "#888",
                          marginRight: "8px",
                        }}
                      >
                        Rs. {product.price}
                      </span>
                      <strong>Rs. {product.sale_price}</strong>
                    </>
                  ) : (
                    <span>Rs. {product.price}</span>
                  )}
                </td>
                <td>{product.stock_quantity}</td>
                <td>
                  <span
                    className={
                      product.plain_pages_in_stock
                        ? "status-badge in-stock"
                        : "status-badge out-of-stock"
                    }
                  >
                    {product.plain_pages_in_stock ? "✓ In Stock" : "✕ Out"}
                  </span>
                </td>
                <td>
                  <span
                    className={
                      product.lined_pages_in_stock
                        ? "status-badge in-stock"
                        : "status-badge out-of-stock"
                    }
                  >
                    {product.lined_pages_in_stock ? "✓ In Stock" : "✕ Out"}
                  </span>
                </td>
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
