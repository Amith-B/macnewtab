import { useCallback, useContext, useState } from "react";
import { ReactComponent as SettingsIcon } from "../../assets/settings.svg";
import { ReactComponent as LaunchpadIcon } from "../../assets/launchpad.svg";
import { ReactComponent as TodoIcon } from "../../assets/todo.svg";
import Settings from "../settings/Settings";
import Launchpad from "../launchpad/Launchpad";
import TodoDialog from "../todo/Todo";
import "./Dock.css";
import { AppContext } from "../../context/provider";

const SITE_IMAGE_URL = "https://www.google.com/s2/favicons?sz=64&domain=";

const TooltipPosition: Record<string, string> = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom",
};

export default function Dock() {
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [launchpadVisible, setLaunchpadVisible] = useState(false);
  const [todoDialogOpen, setTodoDialogOpen] = useState(false);
  const { dockBarSites, dockPosition, todoListVisbility } =
    useContext(AppContext);

  const handleLaunchpadClose = useCallback(
    () => setLaunchpadVisible(false),
    []
  );

  const showDocBar = !!dockBarSites.length;

  return (
    <>
      <div
        className={
          `dock-container ${dockPosition}` + (showDocBar ? " center" : "")
        }
      >
        <button
          className={`launchpad-icon accessible tooltip tooltip-${
            TooltipPosition[dockPosition] || "top"
          }`}
          data-label="Launchpad"
          onClick={() => {
            setLaunchpadVisible(!launchpadVisible);
            setSettingsVisible(false);
          }}
        >
          <LaunchpadIcon />
        </button>
        {todoListVisbility && (
          <button
            className={`todo-button accessible tooltip tooltip-${
              TooltipPosition[showDocBar ? dockPosition : "top"] || "top"
            }`}
            data-label="Todo List"
            onClick={() => setTodoDialogOpen(true)}
          >
            <TodoIcon />
          </button>
        )}
        <button
          className={`settings-icon accessible tooltip tooltip-${
            TooltipPosition[dockPosition] || "top"
          }`}
          data-label="Settings"
          onClick={() => {
            setSettingsVisible(true);
            setLaunchpadVisible(false);
          }}
        >
          <SettingsIcon />
        </button>
        <div className="dock-divider"></div>
        {dockBarSites.map((item) => {
          let siteURL;
          let siteURLHasError = false;

          try {
            siteURL = new URL(item.url);
          } catch (error) {
            siteURLHasError = true;
          }

          return (
            <a
              rel="noreferrer"
              className={`dock-site__item tooltip with-link tooltip-${
                TooltipPosition[dockPosition] || "top"
              }`}
              data-label={item.title}
              href={!siteURLHasError ? item.url : "https://google.com"}
              target="_self"
              title={item.title}
              key={item.id}
            >
              <img
                className="dock-site__icon"
                src={SITE_IMAGE_URL + siteURL?.hostname}
                alt={item.title}
              />
            </a>
          );
        })}
      </div>
      <Settings
        withinDock={showDocBar}
        open={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
      <Launchpad visible={launchpadVisible} onClose={handleLaunchpadClose} />
      <TodoDialog
        withinDock={showDocBar}
        open={todoDialogOpen}
        onClose={() => setTodoDialogOpen(false)}
      />
    </>
  );
}
