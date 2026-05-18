import React from "react";
import ReactDOM from "react-dom";
import { getPageTypeConfig } from "../utils/pageType";
import "../styles/ProductFormModal.css";

const ProductFormModal = ({
  isOpen,
  editingId,
  formData,
  onInputChange,
  onSubmit,
  onClose,
}) => {
  if (!isOpen) return null;
  const pageTypeConfig = getPageTypeConfig(formData.category);

  return ReactDOM.createPortal(
    <>
      <div className="product-form-overlay" onClick={onClose}>
        <div
          className="product-form-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="product-form-header">
            <h2>{editingId ? "Edit Product" : "Add New Product"}</h2>
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="product-form-body">
            <form onSubmit={onSubmit}>
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={onInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={onInputChange}
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
                    onChange={onInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Sale Price (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="sale_price"
                    value={formData.sale_price}
                    onChange={onInputChange}
                    placeholder="Optional"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={onInputChange}
                  >
                    <option value="Notebook">Journal</option>
                    <option value="Bookmark">Bookmark</option>
                    <option value="Notebooks">Notebooks</option>
                    <option value="Cards">Cards</option>
                    <option value="Stickers">Stickers</option>
                    <option value="Bundles">Bundles</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={onInputChange}
                    required
                  />
                </div>
              </div>

              {pageTypeConfig && (
                <div className="form-row">
                  {pageTypeConfig.options.map((option) => (
                    <div className="form-group" key={option.variant}>
                      <label>
                        <input
                          type="checkbox"
                          name={option.stockField}
                          checked={formData[option.stockField]}
                          onChange={onInputChange}
                        />
                        {option.label} In Stock
                      </label>
                    </div>
                  ))}
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  {editingId ? "Update Product" : "Create Product"}
                </button>
                <button type="button" onClick={onClose} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
};

export default ProductFormModal;
