import React, { useEffect, useState } from "react";
import "./FooterNotice.css";

interface FooterNoticeProps {
  storageKey: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}

export default function FooterNotice({ storageKey, title, description, children }: FooterNoticeProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isHidden = localStorage.getItem(storageKey);
    if (!isHidden) {
      setVisible(true);
    }
  }, [storageKey]);

  if (!visible) return null;

  const handleClose = () => {
    localStorage.setItem(storageKey, "true");
    setVisible(false);
  };

  return (
    <div className="footer-notice">
      <div className="footer-notice-content">
        {title && <p><strong>{title}</strong></p>}
        {description && <p>{description}</p>}
        {children}
      </div>
      <button className="footer-notice-close" onClick={handleClose} title="Dismiss">
        ✕
      </button>
    </div>
  );
}
