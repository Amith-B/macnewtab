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
    showClockAndCalendar,
    handleShowClockAndCalendarChange,
    showTabManager,
    handleShowTabManagerChange,
    locale,
    handleLocaleChange,
  } = useContext(AppContext);

  const selectedLanguageDetails = useMemo(() => {
    return languageOptions.find((item) => item.value === locale);
  }, [locale]);

  const isMac = useMemo(() => {
    return navigator.userAgent.toLowerCase().includes("mac");
  }, []);

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
      <div
        className={
          "general__row-item" + (!showClockAndCalendar ? " disabled" : "")
        }
      >
        <Translation value="switch_calendar_to_month_view" />
        <Toggle
          id={"month-view-toggle"}
          isChecked={showMonthView}
          handleToggleChange={() => handleShowMonthViewChange(!showMonthView)}
        />
      </div>

      <div className="general__row-item">
        <Translation value="show_clock_and_calendar" />
        <Toggle
          id={"clock-and-calendar-toggle"}
          isChecked={showClockAndCalendar}
          handleToggleChange={() =>
            handleShowClockAndCalendarChange(!showClockAndCalendar)
          }
        />
      </div>

      <div className="general__row-item">
        <Translation value="show_tab_manager" />
        <Toggle
          id={"tab-manager-toggle"}
          isChecked={showTabManager}
          handleToggleChange={() => handleShowTabManagerChange(!showTabManager)}
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

      <div className="general__row-item">
        <Translation value="toggle_bookmark" />
        <code>{isMac ? "Cmd + Shift + B" : "Ctrl + Shift + B"}</code>
      </div>
    </div>
  );
});

export default General;
