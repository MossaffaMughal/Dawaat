import React, { useEffect, useState } from "react";
import apiClient from "../utils/apiClient";
import { compressImageFile } from "../utils/compressImage";
import ConfirmDialog from "../components/ConfirmDialog";
import "../styles/CategoryManagement.css";

const API_BASE_URL = (
  process.env.REACT_APP_API_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

const EMPTY_FORM = { name: "", imageUrl: "" };

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
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [message, setMessage] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    category: null,
  });

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
    setIsCreating(false);
    setEditingCategory(category);
    setFormData({ name: category.name, imageUrl: category.image_url });
    setMessage("");
  };

  const openCreator = () => {
    setIsCreating(true);
    setEditingCategory(null);
    setFormData(EMPTY_FORM);
    setMessage("");
  };

  const closeForm = () => {
    setIsCreating(false);
    setEditingCategory(null);
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
      if (isCreating) {
        const response = await apiClient.post("/categories", formData);
        setCategories((current) => [...current, response.data]);
        setMessage("Category created successfully");
      } else {
        const response = await apiClient.put(
          `/categories/${editingCategory.id}`,
          formData,
        );
        setCategories((current) =>
          current.map((category) =>
            category.id === response.data.id ? response.data : category,
          ),
        );
        setMessage("Category updated successfully");
      }
      closeForm();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          (isCreating
            ? "Unable to create category"
            : "Unable to update category"),
      );
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

  const requestDelete = (category) => {
    setDeleteDialog({ isOpen: true, category });
  };

  const handleDeleteConfirmed = async () => {
    const category = deleteDialog.category;
    setDeleteDialog({ isOpen: false, category: null });
    if (!category) return;

    try {
      await apiClient.delete(`/categories/${category.id}`);
      setCategories((current) =>
        current.filter((item) => item.id !== category.id),
      );
      setMessage("Category deleted successfully");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to delete category");
    }
  };

  const isFormOpen = isCreating || Boolean(editingCategory);

  return (
    <div className="admin-section category-management">
      <div className="category-management-header">
        <div>
          <h1>Categories</h1>
          <p className="category-management-intro">
            Manage the category names and cover images shown on the home
            page, site navigation, and products filter. Use the arrows to
            change their order.
          </p>
        </div>
        <button
          type="button"
          className="submit-btn category-add-button"
          onClick={openCreator}
        >
          + Add Category
        </button>
      </div>

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
                <button
                  type="button"
                  className="delete-btn category-delete-button"
                  onClick={() => requestDelete(category)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {isFormOpen && (
        <div className="category-editor-backdrop" role="presentation">
          <form className="category-editor" onSubmit={handleSave}>
            <h2>{isCreating ? "Add Category" : "Edit Category"}</h2>
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
                disabled={saving || uploading || !formData.imageUrl}
              >
                {uploading
                  ? "Uploading..."
                  : saving
                    ? "Saving..."
                    : isCreating
                      ? "Create category"
                      : "Save changes"}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={closeForm}
                disabled={saving || uploading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteDialog.category?.name}"? Products already assigned to it will keep their category value but it will no longer appear in navigation or filters.`}
        isDangerous
        confirmText="Delete"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteDialog({ isOpen: false, category: null })}
      />
    </div>
  );
};

export default CategoryManagement;
