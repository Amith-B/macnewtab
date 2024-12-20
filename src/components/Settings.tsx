import React, { useContext, useEffect, useState } from "react";
import "./Settings.css";
import { AppContext } from "../context/provider";
import { ReactComponent as CloseIcon } from "./close-icon.svg";
import { ReactComponent as MinimizeIcon } from "./minimize-icon.svg";

export default function Settings({
  open,
  onClose,
  animate,
  onAnimationToggle,
}: {
  open: boolean;
  onClose: () => void;
  animate: boolean;
  onAnimationToggle: (val: boolean) => void;
}) {
  const { date } = useContext(AppContext);

  return (
    <div
      className={"settings__overlay" + (open ? " visible" : "")}
      onClick={() => {
        onAnimationToggle(true);
        onClose();
      }}
    >
      <div
        className={"settings__container" + (animate ? " animate" : "")}
        onClick={(evt) => evt.stopPropagation()}
      >
        <div className="settings__side-panel">
          <div className="settings__window-manager">
            <button
              className="settings__window-manager-button settings__window-close"
              onClick={() => {
                onAnimationToggle(false);
                onClose();
              }}
            >
              <CloseIcon />
            </button>
            <button
              className="settings__window-manager-button settings__window-minimize"
              onClick={() => {
                onAnimationToggle(true);
                onClose();
              }}
            >
              <MinimizeIcon />
            </button>
            <button className="settings__window-manager-button settings__window-expand"></button>
          </div>
          <div className="settings__menu"></div>
        </div>
        <div className="settings__menu-content"></div>
      </div>
    </div>
  );
}
