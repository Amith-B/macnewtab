import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
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
import { AppContext } from "../../context/provider";

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
  withinDock,
}: {
  open: boolean;
  onClose: () => void;
  withinDock: boolean;
}) {
  const [selectedMenu, setSelectedMenu] = useState(SETTINGS_MENU[0]);
  const [modalAccessible, setModalAccessible] = useState(false);
  const { dockPosition } = useContext(AppContext);

  const [position, setPosition] = useState({ x: "unset", y: "unset" });
  const modalRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!modalRef.current) return;

    isDragging.current = true;
    offset.current = {
      x: e.clientX - modalRef.current.getBoundingClientRect().left,
      y: e.clientY - modalRef.current.getBoundingClientRect().top,
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;

    setPosition({
      x: `${e.clientX - offset.current.x}px`,
      y: `${e.clientY - offset.current.y}px`,
    });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

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
        setPosition({ x: "unset", y: "unset" });
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
        onClose();
      }}
    >
      <div
        className={
          `settings__container dock-position-${dockPosition}` +
          (withinDock ? " within-dock" : "")
        }
        onClick={(evt) => evt.stopPropagation()}
        ref={modalRef}
        style={{
          position: "absolute",
          left: position.x,
          top: position.y,
        }}
      >
        <div
          className="settings__side-panel draggable"
          onMouseDown={handleMouseDown}
        >
          <div className="settings__window-manager">
            <button
              className="settings__window-manager-button settings__window-close"
              onClick={() => {
                onClose();
                setSelectedMenu(SETTINGS_MENU[0]);
              }}
            >
              <CloseIcon />
            </button>
            <button
              className="settings__window-manager-button settings__window-minimize"
              onClick={onClose}
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
