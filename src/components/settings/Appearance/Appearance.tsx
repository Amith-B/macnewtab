import React, { useContext } from "react";
import "./Appearance.css";
import { THEME_COLOR_KEYS, THEME_LIST } from "../../../static/theme";
import { AppContext } from "../../../context/provider";
import { ReactComponent as DeleteIcon } from "../delete-icon.svg";
import Translation from "../../../locale/Translation";
import { WALLPAPER_LIST } from "../../../static/wallpapers";
import Slider from "../../slider/Slider";

const MAX_FILE_SIZE_MB = 1;

export default function Appearance() {
  const {
    theme,
    themeColor,
    backgroundImage,
    wallpaperBlur,
    handleWallpaperBlur,
    handleThemeChange,
    handleThemeColorChange,
    handleWallpaperChange,
  } = useContext(AppContext);

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
      <div
        className={
          "appearance__theme-selection-container" +
          (themeColor ? " disabled" : "")
        }
      >
        <Translation value="appearance" />
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
                alt={item.key}
                src={item.image}
                className="appearance__theme-image"
              />
              <div className="appearance__theme-label">{item.title}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="appearance__theme-color-selection-container">
        <Translation value="theme" />
        <div className="appearance__theme-color-selection">
          <button
            className={
              "appearance__theme-color-option theme-none" +
              (!themeColor ? " selected" : "")
            }
            onClick={() => handleThemeColorChange("")}
          ></button>
          {THEME_COLOR_KEYS.map((item) => (
            <button
              key={item}
              className={
                `appearance__theme-color-option theme-${item}` +
                (themeColor === item ? " selected" : "")
              }
              onClick={() => handleThemeColorChange(item)}
            ></button>
          ))}
        </div>
      </div>

      <div className="appearance__wallpaper-blur-container">
        <Translation value="wallpaper_blur" />
        <div
          className={
            "appearance__wallpaper-blur-input" +
            (!backgroundImage ? " disabled" : "")
          }
          style={{
            width: "100%",
            maxWidth: "200px",
            justifyContent: "space-between",
          }}
        >
          <Slider
            value={wallpaperBlur}
            min={0}
            max={50}
            id="blur-slider"
            name="Blur slider"
            onChange={(event) => {
              handleWallpaperBlur(parseInt(event.target.value));
            }}
            style={{
              maxWidth: "160px",
            }}
          />
          <span>{wallpaperBlur}</span>
        </div>
      </div>
      <div className="appearance__wallpaper-upload-container">
        <Translation value="upload_wallpaper" />
        <div className="appearance__wallpaper-actions-container">
          <div className="image-picker accessible">
            <label htmlFor="file-input" className="file-label">
              <span>
                <Translation value="choose_file" />
              </span>
              <input
                type="file"
                id="file-input"
                className="image-input"
                accept="image/*"
                name="upload image"
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
      <div className="appearance__wallpaper-selection-container">
        <Translation value="choose_wallpaper" />
        <div className="appearance__wallpaper-selection-list">
          <button
            className="appearance__wallpaper-option wallpaper-none"
            onClick={() => handleWallpaperChange("")}
          ></button>
          {WALLPAPER_LIST.map((item) => (
            <button
              key={item.id}
              className="appearance__wallpaper-option"
              onClick={() => handleWallpaperChange(item.link)}
            >
              <img
                alt={item.id}
                src={item.link}
                className="appearance__wallpaper-image"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
