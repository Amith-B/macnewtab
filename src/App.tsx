import {
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
import Search from "./components/search/Search";
import SearchEngineSwitcher from "./components/search-engine-switcher/SearchEngineSwitcher";
import {
  SEARCH_ENGINE_LOCAL_STORAGE_KEY,
  searchEngineKeys,
} from "./static/searchEngine";
import { AppContext } from "./context/provider";
import TopSites from "./components/topsites/TopSites";
import Translation from "./locale/Translation";
import Dock from "./components/dock/Dock";
import TabManager from "./components/tab-manager/TabManager";

const App = memo(function App() {
  const [searchEngine, setSearchEngine] = useState("");

  const {
    theme,
    themeColor,
    backgroundImage,
    wallpaperBlur,
    date,
    showGreeting,
    showVisitedSites,
    showSearchEngines,
    showMonthView,
    locale,
    showClockAndCalendar,
    showTabManager,
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

    if (hour >= 21 || hour < 5) {
      return "night";
    }

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
      className={
        `App theme-${themeColor || theme}` + (backgroundImage ? " has-bg" : "")
      }
      style={bgStyle}
      lang={locale}
    >
      {wallpaperBlur !== 0 && (
        <div
          className="wallpaper-blur-container"
          style={{ backdropFilter: `blur(${wallpaperBlur}px)` }}
        ></div>
      )}
      <div
        className={
          "main-content" + (showClockAndCalendar ? " has-clock-calendar" : "")
        }
      >
        {showClockAndCalendar && (
          <div className="section-1">
            <Clock1 />
            {showMonthView ? <Calendar /> : <Calendar1 />}
          </div>
        )}
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
      <Dock />
      {showTabManager && <TabManager />}
    </div>
  );
});

export default App;
