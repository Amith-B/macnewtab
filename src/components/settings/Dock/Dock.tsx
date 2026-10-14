import { memo, useContext } from "react";
import "./Dock.css";
import { AppContext } from "../../../context/provider";
import { DockPosition, dockPositions } from "../../../static/dockSites";
import Translation from "../../../locale/Translation";
import { Select } from "../../select/Select";
import Toggle from "../../toggle/Toggle";
import LinkListEditor from "../shared/LinkListEditor";
import { ReactComponent as AppStoreIcon } from "../../../assets/app-store.svg";

export default memo(function Dock() {
  const {
    dockBarSites,
    handleDockSitesChange,
    dockPosition,
    setDockPosition,
    enableStickyNotesSync,
    setEnableStickyNotesSync,
    showAppStore,
    setShowAppStore,
    activeSpaceId,
  } = useContext(AppContext);

  return (
    <div className="dock-links__container">
      <div className="dock-app__toggle">
        <div className="dock-app__toggle-info">
          <div className="dock-app__icon">
            <AppStoreIcon />
          </div>
          <span>
            <h3 className="dock-app__toggle-title">
              <Translation value="app_store" />
            </h3>
            <h4 className="dock-app__toggle-description">
              <Translation value="manage_dock_apps_in_store" />
            </h4>
          </span>
        </div>
        <Toggle
          id={"app-store-toggle"}
          name="App Store toggle"
          isChecked={showAppStore}
          handleToggleChange={() => setShowAppStore(!showAppStore)}
        />
      </div>

      <div className="dock-app__toggle">
        <div className="dock-app__toggle-info">
          <span>
            <h3 className="dock-app__toggle-title">
              <Translation value="enable_sticky_notes_sync" />
            </h3>
            <h4 className="dock-app__toggle-description">
              <Translation value="enable_sticky_notes_sync_description" />
            </h4>
          </span>
        </div>
        <Toggle
          id={"enable-sticky-notes-sync-toggle"}
          name="Enable sticky notes sync toggle"
          isChecked={enableStickyNotesSync}
          handleToggleChange={() =>
            setEnableStickyNotesSync(!enableStickyNotesSync)
          }
        />
      </div>

      <div className={"dock-links__position"}>
        <Translation value="position_on_screen" />
        <Select
          id="dock-position-menu"
          name="Dock position menu"
          options={dockPositions}
          value={dockPosition}
          onChange={(event) =>
            setDockPosition(event.target.value as DockPosition)
          }
        />
      </div>

      <LinkListEditor
        links={dockBarSites}
        onSave={handleDockSitesChange}
        emptyMessage="add_dock_links"
        iconDbPrefix="dock_icon"
        activeSpaceId={activeSpaceId}
        allowFolder={true}
      />
    </div>
  );
});
