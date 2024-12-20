import React, { useContext } from "react";
import "./Appearance.css";
import { THEME_LIST } from "../../../static/theme";
import { AppContext } from "../../../context/provider";

export default function Appearance() {
  const { theme, handleThemeChange, setBackgroundImage } =
    useContext(AppContext);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target?.files?.[0];
    if (!selectedFile) return;

    const fileReader = new FileReader();

    fileReader.onload = (loadEvent) => {
      const imgElement = new Image();
      imgElement.onload = () => {
        const imageUrl = loadEvent.target?.result;
        setBackgroundImage(imageUrl as string);
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
      </div>
    </div>
  );
}
