import React, {
  CSSProperties,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import "./App.css";
import Clock1 from "./widgets/clock-1/Clock1";
import Calendar1 from "./widgets/day-calendar/Calendar1";
import Search from "./widgets/search/Search";
import SearchEngineSwitcher from "./widgets/search-engine-switcher/SearchEngineSwitcher";
import {
  SEARCH_ENGINE_LOCAL_STORAGE_KEY,
  searchEngineKeys,
} from "./static/searchEngine";
import { ReactComponent as SettingsIcon } from "./assets/settings.svg";
import { AppContext } from "./context/provider";
import Settings from "./components/settings/Settings";

function App() {
  const [searchEngine, setSearchEngine] = useState("");
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [settingsActive, setSettingsActive] = useState(false);
  const { theme, backgroundImage, date } = useContext(AppContext);

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
      return "Morning";
    } else if (hour < 17) {
      return "Afternoon";
    } else {
      return "Evening";
    }
  }, [date.getHours()]);

  return (
    <div
      className={`App theme-${theme}` + (backgroundImage ? " has-bg" : "")}
      style={bgStyle}
    >
      <div className="main-content">
        <div className="section-1">
          <Clock1 />
          <Calendar1 />
        </div>
        <div className="section-2">
          <h1 className="greeting">Good {greeting}!</h1>
          <Search selectedSearchEngine={searchEngine} />
          <SearchEngineSwitcher
            selectedSearchEngine={searchEngine}
            onSelectedEngineChange={handleSearchEngineChange}
          />
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
}

export default App;
