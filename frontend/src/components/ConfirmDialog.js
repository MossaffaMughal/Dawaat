import React from "react";
import "../styles/ConfirmDialog.css";

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "OK",
  cancelText = "Cancel",
  isDangerous = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog">
        <div className="confirm-dialog-header">
          <h2>{title}</h2>
        </div>
        <div className="confirm-dialog-body">
          <p>{message}</p>
        </div>
        <div className="confirm-dialog-footer">
          <button className="confirm-dialog-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={`confirm-dialog-confirm ${isDangerous ? "dangerous" : ""}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
