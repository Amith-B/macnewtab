import { memo, useContext, useMemo } from "react";
import Toggle from "../../toggle/Toggle";
import "./General.css";
import { AppContext } from "../../../context/provider";
import Translation from "../../../locale/Translation";
import { Select } from "../../select/Select";
import { languageOptions, languages } from "../../../locale/languages";

const clockStyleOptions = [
  { label: <Translation value="analog_clock_1" />, value: "analog-1" },
  { label: <Translation value="analog_clock_2" />, value: "analog-2" },
  { label: <Translation value="digital_clock" />, value: "digital" },
];

const General = memo(function General() {
  const {
    showGreeting,
    setShowGreeeting,
    showSearchEngines,
    setShowSearchEngines,
    useSearchDropdown,
    setUseSearchDropdown,
    showMonthView,
    setShowMonthView,
    showClockAndCalendar,
    setShowClockAndCalendar,
    showTabManager,
    setShowTabManager,
    locale,
    setLocale,
    isWidgetsAwayFromDock,
    setIsWidgetsAwayFromDock,
    clockStyle,
    setClockStyle,
    showBattery,
    setShowBattery,
    separatePageSite,
    setSeparatePageSite,
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
          "general__row-item" + (!showSearchEngines ? " disabled" : "")
        }
      >
        <Translation value="use_search_dropdown" />
        <Toggle
          id={"search-dropdown-toggle"}
          name="Search dropdown toggle"
          isChecked={useSearchDropdown}
          handleToggleChange={() => setUseSearchDropdown(!useSearchDropdown)}
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
        <Translation value="clock_style" />
        <Select
          id="clock-style-menu"
          name="Clock style menu"
          options={clockStyleOptions}
          value={clockStyle}
          onChange={(event) => setClockStyle(event.target.value)}
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

      <div className="general__row-item">
        <Translation value="show_battery" />
        <Toggle
          id={"battery-toggle"}
          name="Battery widget toggle"
          isChecked={showBattery}
          handleToggleChange={() => setShowBattery(!showBattery)}
        />
      </div>

      <div className="general__row-item">
        <Translation value="open_links_on_separate_page" />
        <Toggle
          id={"separate-page-toggle"}
          name="Separate page on link click toggle"
          isChecked={separatePageSite}
          handleToggleChange={() => setSeparatePageSite(!separatePageSite)}
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

      <div className="general__row-item">
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
