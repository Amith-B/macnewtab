import React, { useRef, useState, useContext } from "react";
import "./Data.css";
import { exportData, importData } from "../../../utils/dataManagement";
import Translation from "../../../locale/Translation";
import { translation } from "../../../locale/languages";
import { AppContext } from "../../../context/provider";

export default function Data() {
  const { locale } = useContext(AppContext);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const t = translation[locale];

  const handleExport = () => {
    exportData();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (window.confirm(t.import_confirm)) {
      setImporting(true);
      try {
        await importData(file);
        window.location.reload();
      } catch (error) {
        console.error("Import failed:", error);
        alert(t.import_failed);
      } finally {
        setImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } else {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="data__container">
      <div className="data__row-item">
        <div className="data__info">
          <div className="data__title">
            <Translation value="export_data_title" />
          </div>
          <div className="data__description">
            <Translation value="export_data_description" />
          </div>
        </div>
        <button className="button" onClick={handleExport}>
          <Translation value="export_to_json" />
        </button>
      </div>

      <div className="data__row-item">
        <div className="data__info">
          <div className="data__title">
            <Translation value="import_data_title" />
          </div>
          <div className="data__description">
            <Translation value="import_data_description" />
          </div>
        </div>
        <button
          className="button"
          onClick={handleImportClick}
          disabled={importing}
        >
          {importing ? (
            <Translation value="importing" />
          ) : (
            <Translation value="import_from_json" />
          )}
        </button>
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
