import React, { useEffect, useState } from "react";
import apiClient from "../utils/apiClient";

const emptyForm = {
  code: "",
  percentage: "",
  is_active: true,
};

const DiscountCodesPanel = () => {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState("");

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/discount-codes");
      setCodes(response.data);
    } catch (err) {
      console.error("Error fetching discount codes:", err);
      setError("Unable to load discount codes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setSaving(true);
      await apiClient.post("/discount-codes", {
        code: formData.code,
        percentage: formData.percentage,
        is_active: formData.is_active,
      });
      setFormData(emptyForm);
      await fetchCodes();
    } catch (err) {
      console.error("Error saving discount code:", err);
      setError(err.response?.data?.message || "Error saving discount code.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (code) => {
    try {
      await apiClient.put(`/discount-codes/${code.id}`, {
        is_active: !code.is_active,
      });
      fetchCodes();
    } catch (err) {
      console.error("Error updating discount code:", err);
      setError(err.response?.data?.message || "Error updating discount code.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this discount code?")) return;

    try {
      await apiClient.delete(`/discount-codes/${id}`);
      fetchCodes();
    } catch (err) {
      console.error("Error deleting discount code:", err);
      setError(err.response?.data?.message || "Error deleting discount code.");
    }
  };

  return (
    <div className="admin-section">
      <h1>Discount Codes</h1>

      <div className="settings-card">
        <div className="setting-item">
          <h3>Add Discount Code</h3>
          <p className="setting-description">
            Create a code and assign a percentage discount.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="setting-control" style={{ marginBottom: 12 }}>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g. MOTHERSDAY"
                className="setting-input"
                required
              />
              <div className="input-group">
                <span className="currency">%</span>
                <input
                  type="number"
                  name="percentage"
                  value={formData.percentage}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="1"
                  className="setting-input"
                  placeholder="Discount"
                  required
                />
              </div>
            </div>

            <label
              style={{
                display: "inline-flex",
                gap: 8,
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              Active
            </label>

            <div>
              <button
                className="btn-save-setting"
                type="submit"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Code"}
              </button>
            </div>
          </form>

          {error && (
            <p className="setting-info" style={{ color: "#c0392b" }}>
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="settings-card">
        <div className="setting-item">
          <h3>Existing Codes</h3>
          {loading ? (
            <p>Loading...</p>
          ) : codes.length === 0 ? (
            <p className="setting-description">
              No discount codes have been added yet.
            </p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((code) => (
                  <tr key={code.id}>
                    <td>{code.code}</td>
                    <td>{code.percentage}%</td>
                    <td>
                      <span
                        className={`status ${code.is_active ? "processing" : "cancelled"}`}
                      >
                        {code.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="edit-btn"
                        onClick={() => handleToggleActive(code)}
                      >
                        {code.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(code.id)}
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
      </div>
    </div>
  );
};

export default DiscountCodesPanel;
