import { memo, useContext } from "react";
import "./QuickLinks.css";
import { AppContext } from "../../../context/provider";
import Translation from "../../../locale/Translation";
import LinkListEditor from "../shared/LinkListEditor";
import Toggle from "../../toggle/Toggle";

export default memo(function QuickLinks() {
  const {
    quickLinksMode,
    setQuickLinksMode,
    quickLinks,
    handleQuickLinksChange,
    showVisitedSites,
    setShowVisitedSites,
  } = useContext(AppContext);

  const isCustomMode = quickLinksMode === "custom";

  return (
    <div className="quick-links__container">
      <div className="quick-links__toggle-row">
        <Translation value="show_top_visited_sites" />
        <Toggle
          id={"visit-toggle"}
          name="Visited sites toggle"
          isChecked={showVisitedSites}
          handleToggleChange={() => setShowVisitedSites(!showVisitedSites)}
        />
      </div>

      <div
        className={
          "quick-links__toggle-row" + (!showVisitedSites ? " disabled" : "")
        }
      >
        <div>
          <Translation value="quick_links_custom" />
          <div className="quick-links__mode-description">
            {isCustomMode ? (
              <Translation value="quick_links_custom_description" />
            ) : (
              <Translation value="quick_links_default_description" />
            )}
          </div>
        </div>
        <Toggle
          id={"quick-links-mode-toggle"}
          name="Custom quick links toggle"
          isChecked={isCustomMode}
          handleToggleChange={() =>
            setQuickLinksMode(isCustomMode ? "default" : "custom")
          }
        />
      </div>
      {isCustomMode && showVisitedSites && (
        <LinkListEditor
          links={quickLinks}
          onSave={handleQuickLinksChange}
          emptyMessage="add_quick_links"
          iconDbPrefix="quick_link_icon"
        />
      )}
    </div>
  );
});
