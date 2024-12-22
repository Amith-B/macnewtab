import React, { useContext } from "react";
import "./Appearance.css";
import { THEME_LIST } from "../../../static/theme";
import { AppContext } from "../../../context/provider";
import { ReactComponent as DeleteIcon } from "./delete.svg";

const MAX_FILE_SIZE_MB = 1;

export default function Appearance() {
  const { theme, handleThemeChange, handleWallpaperChange } =
    useContext(AppContext);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target?.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(
        `The image is too large! Please upload an image smaller than ${MAX_FILE_SIZE_MB} MB.`
      );
      return;
    }

    const fileReader = new FileReader();

    fileReader.onload = (loadEvent) => {
      const imgElement = new Image();
      imgElement.onload = () => {
        const imageUrl = loadEvent.target?.result;
        handleWallpaperChange(imageUrl as string);
      };

      if (imgElement) {
        imgElement.src = loadEvent?.target?.result as any;
      }
    };

    fileReader.readAsDataURL(selectedFile);
  };

  return (
    <div className="appearance__container">
      <div className="appearance__theme-selection-container">
        Appearance
        <div className="appearance__theme-selection">
          {THEME_LIST.map((item) => (
            <button
              key={item.key}
              className={
                "appearance__theme-option" +
                (theme === item.key ? " selected" : "")
              }
              onClick={() => handleThemeChange(item.key)}
            >
              <img
                alt={item.title}
                src={item.image}
                className="appearance__theme-image"
              />
              <div className="appearance__theme-label">{item.title}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="appearance__wallpaper-selection-container">
        Upload Wallpaper
        <div className="appearance__wallpaper-actions-container">
          <div className="image-picker">
            <label htmlFor="file-input" className="file-label">
              <span>Choose File</span>
              <input
                type="file"
                id="file-input"
                className="image-input"
                accept="image/*"
                onChange={handleFileUpload}
              />
            </label>
          </div>
          <button
            className="appearance__wallpaper-delete"
            onClick={() => handleWallpaperChange("")}
          >
            <DeleteIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
