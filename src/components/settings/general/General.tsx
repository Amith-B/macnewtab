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
    setShowGreeeting,
    showSearchEngines,
    setShowSearchEngines,
    showMonthView,
    setShowMonthView,
    showClockAndCalendar,
    setShowClockAndCalendar,
    showTabManager,
    setShowTabManager,
    locale,
    setLocale,
    bookmarksVisible,
    handleBookmarkVisbility,
    isWidgetsAwayFromDock,
    setIsWidgetsAwayFromDock,
    dockBarSites,
    useAnalogClock2,
    setUseAnalogClock2,
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
          name="greeting toggle"
          isChecked={showGreeting}
          handleToggleChange={() => setShowGreeeting(!showGreeting)}
        />
      </div>
      <div className="general__row-item">
        <Translation value="show_search_engines" />
        <Toggle
          id={"search-engine-toggle"}
          name="Search engine options toggle"
          isChecked={showSearchEngines}
          handleToggleChange={() => setShowSearchEngines(!showSearchEngines)}
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
          name="Month view toggle"
          isChecked={showMonthView}
          handleToggleChange={() => setShowMonthView(!showMonthView)}
        />
      </div>

      <div className="general__row-item">
        <Translation value="show_clock_and_calendar" />
        <Toggle
          id={"clock-and-calendar-toggle"}
          name="Clock and calendar toggle"
          isChecked={showClockAndCalendar}
          handleToggleChange={() =>
            setShowClockAndCalendar(!showClockAndCalendar)
          }
        />
      </div>

      <div
        className={
          "general__row-item" + (!showClockAndCalendar ? " disabled" : "")
        }
      >
        <Translation value="use_analog_clock_2" />
        <Toggle
          id={"use-analog-clock-2-toggle"}
          name="Analog clock 2 toggle"
          isChecked={useAnalogClock2}
          handleToggleChange={() => setUseAnalogClock2(!useAnalogClock2)}
        />
      </div>

      <div className="general__row-item">
        <Translation value="show_tab_manager" />
        <Toggle
          id={"tab-manager-toggle"}
          name="Tab manager toggle"
          isChecked={showTabManager}
          handleToggleChange={() => setShowTabManager(!showTabManager)}
        />
      </div>

      <div className="general__row-item with-description">
        <div className="language-selection-row">
          <Translation value="language" />
          <Select
            id="language-select-menu"
            name="Language select menu"
            options={languageOptions}
            value={locale}
            onChange={(event) =>
              setLocale(event.target.value as typeof languages)
            }
          />
        </div>

        {!selectedLanguageDetails?.voiceSearchLanguage && (
          <div className="voice-search-warning">
            <Translation value="voice_search_warning" />
          </div>
        )}
      </div>

      <div className="general__row-item with-description">
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

      <div
        className={
          "general__row-item" + (!dockBarSites.length ? " disabled" : "")
        }
      >
        <Translation value="center_widgets_away_from_dock" />
        <Toggle
          id={"center-widgets-away-from-dock"}
          name="Center widgets away from dock toggle"
          isChecked={isWidgetsAwayFromDock}
          handleToggleChange={() =>
            setIsWidgetsAwayFromDock(!isWidgetsAwayFromDock)
          }
        />
      </div>
    </div>
  );
});

export default General;
