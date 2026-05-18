import React from "react";
import ReactDOM from "react-dom";
import { getPageTypeConfig } from "../utils/pageType";
import "../styles/ProductFormDialogModal.css";

const ProductFormDialogModal = ({
  isOpen,
  editingProductId,
  productFormData,
  uploadedImages,
  uploadingImage,
  uploadError,
  uploadProgress,
  onInputChange,
  onSubmit,
  onClose,
  onImageUpload,
  onImageRemove,
  children, // For any additional content like image upload section
}) => {
  if (!isOpen) return null;
  const pageTypeConfig = getPageTypeConfig(productFormData.category);

  return ReactDOM.createPortal(
    <>
      <div className="product-form-dialog-overlay" onClick={onClose}>
        <div
          className="product-form-dialog-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="product-form-dialog-header">
            <h2>{editingProductId ? "Edit Product" : "Add New Product"}</h2>
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="product-form-dialog-body">
            <form onSubmit={onSubmit}>
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={productFormData.name}
                  onChange={onInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={productFormData.description}
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
                    value={productFormData.price}
                    onChange={onInputChange}
                    required
                  />
                  <small>Enter the exact price in Pakistani Rupees</small>
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select
                    name="category"
                    value={productFormData.category}
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
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="in_stock"
                    checked={productFormData.in_stock}
                    onChange={(e) =>
                      onInputChange({
                        target: {
                          name: "in_stock",
                          type: "checkbox",
                          checked: e.target.checked,
                        },
                      })
                    }
                  />
                  IN STOCK
                </label>
              </div>

              {pageTypeConfig && (
                <div className="form-row">
                  {pageTypeConfig.options.map((option) => (
                    <div className="form-group" key={option.variant}>
                      <label>
                        <input
                          type="checkbox"
                          name={option.stockField}
                          checked={productFormData[option.stockField]}
                          onChange={(e) =>
                            onInputChange({
                              target: {
                                name: option.stockField,
                                type: "checkbox",
                                checked: e.target.checked,
                              },
                            })
                          }
                        />
                        {option.label.toUpperCase()} IN STOCK
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {/* Additional content for image uploads, etc */}
              {children}

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  {editingProductId ? "Update Product" : "Create Product"}
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

export default ProductFormDialogModal;
