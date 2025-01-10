import { memo, useContext, useMemo } from "react";
import Toggle from "../../toggle/Toggle";
import "./General.css";
import { AppContext } from "../../../context/provider";
import Translation from "../../../locale/Translation";
import { Select } from "../../select/Select";
import { languageOptions, languages } from "../../../locale/languages";

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
    showMonthView,
    handleShowMonthViewChange,
    locale,
    handleLocaleChange,
  } = useContext(AppContext);

  const selectedLanguageDetails = useMemo(() => {
    return languageOptions.find((item) => item.value === locale);
  }, [locale]);

  return (
    <div className="general__container">
      <div className="general__row-item">
        <Translation value="show_greetings" />
        <Toggle
          id={"greeting-toggle"}
          isChecked={showGreeting}
          handleToggleChange={() => handleShowGreeetingChange(!showGreeting)}
        />
      </div>
      <div className="general__row-item">
        <Translation value="show_top_visited_sites" />
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
        <Translation value="open_visited_sites_on_separate_page" />
        <Toggle
          id={"separate-page-toggle"}
          isChecked={separatePageSite}
          handleToggleChange={() =>
            handleSeparatePageSiteChange(!separatePageSite)
          }
        />
      </div>
      <div className="general__row-item">
        <Translation value="show_search_engines" />
        <Toggle
          id={"search-engine-toggle"}
          isChecked={showSearchEngines}
          handleToggleChange={() =>
            handleShowSearchEnginesChange(!showSearchEngines)
          }
        />
      </div>
      <div className="general__row-item">
        <Translation value="switch_calendar_to_month_view" />
        <Toggle
          id={"month-view-toggle"}
          isChecked={showMonthView}
          handleToggleChange={() => handleShowMonthViewChange(!showMonthView)}
        />
      </div>

      <div className="general__row-item with-description">
        <div className="language-selection-row">
          <Translation value="language" />
          <Select
            options={languageOptions}
            value={locale}
            onChange={(event) =>
              handleLocaleChange(event.target.value as typeof languages)
            }
          />
        </div>

        {!selectedLanguageDetails?.voiceSearchLanguage && (
          <div className="voice-search-warning">
            <Translation value="voice_search_warning" />
          </div>
        )}
      </div>
    </div>
  );
});

export default General;
