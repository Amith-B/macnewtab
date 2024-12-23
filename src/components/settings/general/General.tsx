import { memo, useContext } from "react";
import Toggle from "../../toggle/Toggle";
import "./General.css";
import { AppContext } from "../../../context/provider";

const General = memo(function General() {
  const {
    showGreeting,
    handleShowGreeetingChange,
    showVisitedSites,
    handleShowVisitedSitesChange,
    separatePageSite,
    handleSeparatePageSiteChange,
    showSearchEngines,
    handleShowSearchEnginesChange,
  } = useContext(AppContext);

  return (
    <div className="general__container">
      <div className="general__row-item">
        Show Greetings
        <Toggle
          id={"greeting-toggle"}
          isChecked={showGreeting}
          handleToggleChange={() => handleShowGreeetingChange(!showGreeting)}
        />
      </div>
      <div className="general__row-item">
        Show Top Visited Sites
        <Toggle
          id={"visit-toggle"}
          isChecked={showVisitedSites}
          handleToggleChange={() =>
            handleShowVisitedSitesChange(!showVisitedSites)
          }
        />
      </div>
      <div
        className={"general__row-item" + (!showVisitedSites ? " disabled" : "")}
      >
        Open Visited Sites On Separate Page
        <Toggle
          id={"separate-page-toggle"}
          isChecked={separatePageSite}
          handleToggleChange={() =>
            handleSeparatePageSiteChange(!separatePageSite)
          }
        />
      </div>
      <div className="general__row-item">
        Show Search Engines
        <Toggle
          id={"search-engine-toggle"}
          isChecked={showSearchEngines}
          handleToggleChange={() =>
            handleShowSearchEnginesChange(!showSearchEngines)
          }
        />
      </div>
    </div>
  );
});

export default General;
