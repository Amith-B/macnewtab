import React, { useEffect, useMemo, useState } from "react";
import "./Settings.css";
import { ReactComponent as CloseIcon } from "./close-icon.svg";
import { ReactComponent as MinimizeIcon } from "./minimize-icon.svg";
import { ReactComponent as GeneralIcon } from "./general.svg";
import { ReactComponent as AppearanceIcon } from "./appearance.svg";
import { ReactComponent as DockIcon } from "./dock.svg";
import { ReactComponent as AboutIcon } from "./about.svg";
import Appearance from "./Appearance/Appearance";
import About from "./About/About";
import General from "./general/General";
import Translation from "../../locale/Translation";
import Dock from "./Dock/Dock";

export const SETTINGS_MENU = [
  {
    key: "general",
    title: <Translation value="general" />,
    icon: GeneralIcon,
    content: General,
  },
  {
    key: "appearance",
    title: <Translation value="appearance" />,
    icon: AppearanceIcon,
    content: Appearance,
  },
  {
    key: "dock",
    title: <Translation value="dock" />,
    icon: DockIcon,
    content: Dock,
  },
  {
    key: "about",
    title: <Translation value="about" />,
    icon: AboutIcon,
    content: About,
  },
];

export default function Settings({
  open,
  onClose,
  animate,
  onAnimationToggle,
  withinDock,
}: {
  open: boolean;
  onClose: () => void;
  animate: boolean;
  onAnimationToggle: (val: boolean) => void;
  withinDock: boolean;
}) {
  const [selectedMenu, setSelectedMenu] = useState(SETTINGS_MENU[0]);
  const [modalAccessible, setModalAccessible] = useState(false);

  const Content = useMemo(() => {
    return selectedMenu.content;
  }, [selectedMenu]);

  // this is to prevent keyboard accessibility when modal is closed
  useEffect(() => {
    if (open) {
      setModalAccessible(true);
    } else {
      const timerRef = setTimeout(() => {
        setModalAccessible(false);
      }, 600);

      return () => clearTimeout(timerRef);
    }
  }, [open]);

  return (
    <div
      className={
        "settings__overlay" +
        (open ? " visible" : "") +
        (modalAccessible ? " modal-accessible" : " modal-inaccessible")
      }
      onClick={() => {
        onAnimationToggle(true);
        onClose();
      }}
    >
      <div
        className={
          "settings__container" +
          (animate ? " animate" : "") +
          (withinDock ? " within-dock" : "")
        }
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
          <div className="settings__menu">
            {SETTINGS_MENU.map((item) => {
              const MenuIcon = item.icon;
              return (
                <button
                  key={item.key}
                  className={
                    "settings_menu-item" +
                    (selectedMenu.key === item.key ? " selected" : "")
                  }
                  onClick={() => setSelectedMenu(item)}
                >
                  <MenuIcon />
                  {item.title}
                </button>
              );
            })}
          </div>
        </div>
        <div className="settings__menu-content">
          <div className="settings__menu-content-title">
            {selectedMenu.title}
          </div>
          <Content />
        </div>
      </div>
    </div>
  );
}
