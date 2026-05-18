import React, { useState, useEffect, useRef } from "react";
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
    dotted_pages_in_stock: true,
    lined_pages_in_stock: true,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const draggedRef = useRef(null);

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get("/products");
      const rows = response.data || [];
      rows.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      setProducts(rows);
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
      dotted_pages_in_stock: product.dotted_pages_in_stock ?? true,
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

  // Group products by category for rendering
  const productsByCategory = products.reduce((acc, p) => {
    const cat = p.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  // Drag handlers
  const handleDragStart = (e, category, index) => {
    draggedRef.current = { category, index };
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const persistReorder = async (category, list) => {
    try {
      const orderedIds = list.map((p) => p.id);
      await apiClient.patch("/products/reorder", { category, orderedIds });
    } catch (error) {
      console.error("Error persisting reorder:", error);
      alert("Error saving new order");
      fetchProducts();
    }
  };

  const handleDrop = (e, category, index) => {
    e.preventDefault();
    const src = draggedRef.current;
    if (!src) return;
    if (src.category !== category) return; // only allow within same category

    const list = [...(productsByCategory[category] || [])];
    const [moved] = list.splice(src.index, 1);
    // if dropping at end
    const insertIndex = index === undefined ? list.length : index;
    list.splice(insertIndex, 0, moved);

    // Update global products array: rebuild products with updated category ordering
    const other = products.filter(
      (p) => (p.category || "Uncategorized") !== category,
    );
    const updated = [...other, ...list];
    // ensure overall array preserves sort_order grouping; we'll just set state and persist
    setProducts(updated);
    draggedRef.current = null;
    persistReorder(category, list);
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
      dotted_pages_in_stock: true,
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
        <div className="products-by-category">
          {Object.keys(productsByCategory).map((category) => (
            <div key={category} className="category-block">
              <h2>{category}</h2>
              <ul className="draggable-list">
                {(productsByCategory[category] || []).map((product, idx) => (
                  <li
                    key={product.id}
                    className="draggable-item"
                    draggable
                    onDragStart={(e) => handleDragStart(e, category, idx)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, category, idx)}
                  >
                    <div className="item-main">
                      <strong>{product.name}</strong>
                      <span className="price">
                        Rs. {product.sale_price ?? product.price}
                      </span>
                    </div>
                    <div className="item-actions">
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
                    </div>
                  </li>
                ))}
                {/* allow dropping at end */}
                <li
                  className="drop-end"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, category, undefined)}
                />
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
