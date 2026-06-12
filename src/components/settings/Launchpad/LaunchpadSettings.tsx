import { memo, useContext, useMemo } from "react";
import "./LaunchpadSettings.css";
import { AppContext } from "../../../context/provider";
import Translation from "../../../locale/Translation";
import LinkListEditor from "../shared/LinkListEditor";
import Toggle from "../../toggle/Toggle";

export default memo(function LaunchpadSettings() {
  const { customLaunchpadLinks, handleCustomLaunchpadLinksChange, bookmarksVisible, handleBookmarkVisbility, activeSpaceId } =
    useContext(AppContext);

  const isMac = useMemo(() => {
    return navigator.userAgent.toLowerCase().includes("mac");
  }, []);

  return (
    <div className="launchpad-settings__container">
      <div className="launchpad-settings__row-item with-description">
        <div className="bookmark-toggle-row">
          <Translation value="bookmark_toggle" />
          <Toggle
            id={"bookmark-toggle"}
            name="Bookmark toggle"
            isChecked={bookmarksVisible}
            handleToggleChange={() =>
              handleBookmarkVisbility(!bookmarksVisible)
            }
          />
        </div>
        <div className="bookmark-toggle-description">
          <Translation value="bookmark_toggle_description" />{" "}
          <code>{isMac ? "Cmd + Shift + B" : "Ctrl + Shift + B"}</code>
        </div>
      </div>

      <div className="launchpad-settings__description">
        <Translation value="my_apps_description" />
      </div>
      <LinkListEditor
        links={customLaunchpadLinks}
        onSave={handleCustomLaunchpadLinksChange}
        emptyMessage="add_launchpad_links"
        iconDbPrefix="launchpad_custom_icon"
        activeSpaceId={activeSpaceId}
      />
    </div>
  );
});
