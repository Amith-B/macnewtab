import React, { ReactNode } from "react";
import ReactDOM from "react-dom";
import "./ConfirmDialog.css";

interface ConfirmDialogProps {
  open: boolean;
  title?: string | ReactNode;
  description?: string | ReactNode;
  confirmText?: string | ReactNode;
  cancelText?: string | ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = "Are you sure?",
  description = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm = () => {},
  onCancel = () => {},
}) => {
  if (!open) return null;

  const dialog = (
    <div
      className="cd-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cd-title"
      aria-describedby="cd-desc"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="cd-sheet">
        <div className="cd-header">
          <div className="cd-titles">
            <div id="cd-title" className="cd-title">
              {title}
            </div>
            {description && (
              <div id="cd-desc" className="cd-description">
                {description}
              </div>
            )}
          </div>
        </div>

        <div className="cd-spacer" />

        <div className="cd-actions">
          <button
            className="button"
            onClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
              onCancel();
            }}
          >
            {cancelText}
          </button>

          <button
            className="button button-primary"
            onClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
              onConfirm();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(dialog, document.body);
};

export default ConfirmDialog;
