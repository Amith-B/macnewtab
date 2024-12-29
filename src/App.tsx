import React, {
  CSSProperties,
  memo,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import "./App.css";
import Clock1 from "./widgets/clock-1/Clock1";
import Calendar1 from "./widgets/day-calendar/Calendar1";
import Calendar from "./widgets/calendar/Calendar";
import Search from "./widgets/search/Search";
import SearchEngineSwitcher from "./widgets/search-engine-switcher/SearchEngineSwitcher";
import {
  SEARCH_ENGINE_LOCAL_STORAGE_KEY,
  searchEngineKeys,
} from "./static/searchEngine";
import { ReactComponent as SettingsIcon } from "./assets/settings.svg";
import { AppContext } from "./context/provider";
import Settings from "./components/settings/Settings";
import TopSites from "./components/topsites/TopSites";
import Translation from "./locale/Translation";

const App = memo(function App() {
  const [searchEngine, setSearchEngine] = useState("");
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [settingsActive, setSettingsActive] = useState(false);
  const {
    theme,
    backgroundImage,
    date,
    showGreeting,
    showVisitedSites,
    showSearchEngines,
    showMonthView,
    locale,
  } = useContext(AppContext);

  useEffect(() => {
    const defaultSearchEngine = localStorage.getItem(
      SEARCH_ENGINE_LOCAL_STORAGE_KEY
    );

    if (defaultSearchEngine && searchEngineKeys.includes(defaultSearchEngine)) {
      setSearchEngine(defaultSearchEngine);
    } else {
      setSearchEngine(searchEngineKeys[0]);
    }
  }, []);

  const handleSearchEngineChange = (val: string) => {
    localStorage.setItem(SEARCH_ENGINE_LOCAL_STORAGE_KEY, val);
    setSearchEngine(val);
  };

  const bgStyle: CSSProperties & Record<string, string> = useMemo(
    () => ({
      ...(backgroundImage
        ? {
            "--bg-image": `url(${backgroundImage})`,
          }
        : {}),
    }),
    [backgroundImage]
  );

  const greeting = useMemo(() => {
    const hour = date.getHours();
    if (hour < 12) {
      return "morning";
    } else if (hour < 17) {
      return "afternoon";
    } else {
      return "evening";
    }
  }, [date]);

  return (
    <div
      className={`App theme-${theme}` + (backgroundImage ? " has-bg" : "")}
      style={bgStyle}
      lang={locale}
    >
      <div className="main-content">
        <div className="section-1">
          <Clock1 />
          {showMonthView ? <Calendar /> : <Calendar1 />}
        </div>
        <div className="section-2">
          {showGreeting && (
            <h1 className="greeting">
              <Translation value={greeting} />!
            </h1>
          )}
          {showVisitedSites && <TopSites />}
          <Search selectedSearchEngine={searchEngine} />
          {showSearchEngines && (
            <SearchEngineSwitcher
              selectedSearchEngine={searchEngine}
              onSelectedEngineChange={handleSearchEngineChange}
            />
          )}
        </div>
      </div>
      <button
        className={
          "settings-icon" +
          (settingsActive || settingsVisible ? " settings-active" : "")
        }
        onClick={() => setSettingsVisible(true)}
      >
        <SettingsIcon />
      </button>
      <Settings
        open={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        animate={settingsActive}
        onAnimationToggle={setSettingsActive}
      />
    </div>
  );
});

export default App;
