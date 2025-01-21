import { useContext, useState } from "react";
import { ReactComponent as SettingsIcon } from "../../assets/settings.svg";
import { ReactComponent as LaunchpadIcon } from "../../assets/launchpad.svg";
import Settings from "../settings/Settings";
import Launchpad from "../launchpad/Launchpad";
import "./Dock.css";
import { AppContext } from "../../context/provider";

const SITE_IMAGE_URL = "https://www.google.com/s2/favicons?sz=64&domain=";

export default function Dock() {
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [launchpadVisible, setLaunchpadVisible] = useState(false);
  const [settingsActive, setSettingsActive] = useState(false);
  const { dockBarSites } = useContext(AppContext);

  const showDocBar = !!dockBarSites.length;

  return (
    <>
      <div className={"dock-container" + (showDocBar ? " center" : "")}>
        <button
          className="launchpad-icon accessible"
          onClick={() => {
            setLaunchpadVisible(!launchpadVisible);
            setSettingsVisible(false);
          }}
        >
          <LaunchpadIcon />
        </button>
        <button
          className="settings-icon accessible"
          onClick={() => {
            setSettingsVisible(true);
            setLaunchpadVisible(false);
          }}
        >
          <SettingsIcon />
        </button>
        <div className="vertical-divider"></div>
        {dockBarSites.map((item, idx) => {
          const siteURL = new URL(item.url);

          return (
            <a
              rel="noreferrer"
              className="dock-site__item"
              href={item.url}
              target="_self"
              title={item.title}
              key={idx}
            >
              <img
                className="dock-site__icon"
                src={SITE_IMAGE_URL + siteURL.hostname}
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
        animate={settingsActive}
        onAnimationToggle={setSettingsActive}
      />
      <Launchpad
        visible={launchpadVisible}
        onClose={() => setLaunchpadVisible(false)}
      />
    </>
  );
}
