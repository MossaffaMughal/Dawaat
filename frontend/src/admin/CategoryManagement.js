import React, { useEffect, useState } from "react";
import apiClient from "../utils/apiClient";
import { compressImageFile } from "../utils/compressImage";
import "../styles/CategoryManagement.css";

const API_BASE_URL = (
  process.env.REACT_APP_API_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

const toFullImageUrl = (url) => {
  if (!url || /^https?:\/\//i.test(url)) return url;
  // Seeded category covers are frontend public assets; uploaded files may be backend-relative URLs.
  if (url.startsWith("/images/")) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", imageUrl: "" });
  const [message, setMessage] = useState("");

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/categories");
      setCategories(response.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openEditor = (category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, imageUrl: category.image_url });
    setMessage("");
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const compressedFile = await compressImageFile(file, {
        maxDimension: 1600,
        maxBytes: 3.5 * 1024 * 1024,
        quality: 0.82,
        mimeType: "image/webp",
      });
      const uploadData = new FormData();
      uploadData.append("image", compressedFile);
      const response = await apiClient.post("/upload", uploadData);
      setFormData((current) => ({
        ...current,
        imageUrl: toFullImageUrl(response.data.imageUrl),
      }));
      setMessage("");
    } catch (error) {
      setMessage(error.response?.data?.message || "Image upload failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const response = await apiClient.put(
        `/categories/${editingCategory.id}`,
        formData,
      );
      setCategories((current) =>
        current.map((category) =>
          category.id === response.data.id ? response.data : category,
        ),
      );
      setEditingCategory(null);
      setMessage("Category updated successfully");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update category");
    } finally {
      setSaving(false);
    }
  };

  const moveCategory = async (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= categories.length) return;

    const reordered = [...categories];
    [reordered[index], reordered[nextIndex]] = [
      reordered[nextIndex],
      reordered[index],
    ];
    setCategories(reordered);

    try {
      await apiClient.patch("/categories/reorder", {
        orderedIds: reordered.map((category) => category.id),
      });
      setMessage("Category order updated");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to update category order",
      );
      fetchCategories();
    }
  };

  return (
    <div className="admin-section category-management">
      <h1>Categories</h1>
      <p className="category-management-intro">
        Manage the category names and cover images shown on the home page. Use
        the arrows to change their order.
      </p>

      {message && <p className="category-management-message">{message}</p>}
      {loading ? (
        <p>Loading categories...</p>
      ) : (
        <div className="category-management-list">
          {categories.map((category, index) => (
            <article className="category-management-row" key={category.id}>
              <img
                src={toFullImageUrl(category.image_url)}
                alt=""
                className="category-management-image"
              />
              <div className="category-management-details">
                <h2>{category.name}</h2>
                <span>Product key: {category.category_key}</span>
              </div>
              <div className="category-management-actions">
                <button
                  type="button"
                  className="category-order-button"
                  onClick={() => moveCategory(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${category.name} up`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="category-order-button"
                  onClick={() => moveCategory(index, 1)}
                  disabled={index === categories.length - 1}
                  aria-label={`Move ${category.name} down`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="edit-btn category-edit-button"
                  onClick={() => openEditor(category)}
                >
                  Edit
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editingCategory && (
        <div className="category-editor-backdrop" role="presentation">
          <form className="category-editor" onSubmit={handleSave}>
            <h2>Edit Category</h2>
            <label>
              Home page name
              <input
                type="text"
                value={formData.name}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label>
              Cover image
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleImageChange}
                disabled={uploading}
              />
            </label>
            {formData.imageUrl && (
              <img
                src={toFullImageUrl(formData.imageUrl)}
                alt="Category preview"
                className="category-editor-preview"
              />
            )}
            <div className="category-editor-actions">
              <button
                type="submit"
                className="submit-btn"
                disabled={saving || uploading}
              >
                {uploading
                  ? "Uploading..."
                  : saving
                    ? "Saving..."
                    : "Save changes"}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setEditingCategory(null)}
                disabled={saving || uploading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
