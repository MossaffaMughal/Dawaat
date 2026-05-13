import React, { useEffect, useState } from "react";
import apiClient from "../utils/apiClient";

const PromoBannerPanel = () => {
  const [text, setText] = useState("");
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchPromo = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/orders/promo-banner");
      setText(res.data?.promoBannerText || "");
      setActive(!!res.data?.isActive);
    } catch (err) {
      console.error("Error fetching promo banner:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromo();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiClient.put("/orders/promo-banner", {
        promoBannerText: text,
        isActive: active,
      });
      setMessage("Saved successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error saving promo banner:", err);
      setMessage(err.response?.data?.message || "Error saving");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-section">
      <h1>Promo Banner</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="settings-card">
          <div className="setting-item">
            <h3>Banner Text</h3>
            <p className="setting-description">
              Text shown in the top promo ticker.
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              style={{ width: "100%", padding: 8 }}
            />

            <label
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                marginTop: 12,
              }}
            >
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />{" "}
              Active
            </label>

            <div style={{ marginTop: 12 }}>
              <button
                className="btn-save-setting"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
              {message && <span style={{ marginLeft: 12 }}>{message}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoBannerPanel;
