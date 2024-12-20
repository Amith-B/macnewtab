import React, { useContext } from "react";
import "./Appearance.css";
import { THEME_LIST } from "../../../static/theme";
import { AppContext } from "../../../context/provider";

export default function Appearance() {
  const { theme, handleThemeChange } = useContext(AppContext);

  return (
    <div className="appearance__container">
      <div className="appearance__theme-selection-container">
        Appearance
        <div className="appearance__theme-selection">
          {THEME_LIST.map((item) => (
            <div
              className={
                "appearance__theme-option" +
                (theme === item.key ? " selected" : "")
              }
              onClick={() => handleThemeChange(item.key)}
            >
              <img src={item.image} className="appearance__theme-image" />
              <div className="appearance__theme-label">{item.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
