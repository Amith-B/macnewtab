import { CSSProperties, useContext, useEffect, useMemo, useState } from "react";
import "./App.css";
import Clock1 from "./widgets/clock-1/Clock1";
import Clock2 from "./widgets/clock-2/Clock2";
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
import StickyNotes from "./components/sticky-notes/StickyNotes";
import DynamicWallpaper from "./components/wallpaper/DynamicWallpaper";
import InteractiveWallpaper from "./components/wallpaper/InteractiveWallpaper";
import Weather from "./widgets/weather/Weather";

const App = function App() {
  const [searchEngine, setSearchEngine] = useState("");
  const [date, setDate] = useState(new Date());

  const {
    theme,
    themeColor,
    backgroundImage,
    wallpaperBlur,
    showGreeting,
    showVisitedSites,
    showSearchEngines,
    showMonthView,
    locale,
    showClockAndCalendar,
    showTabManager,
    showStickyNotes,
    dockPosition,
    isWidgetsAwayFromDock,
    dockBarSites,
    useAnalogClock2,
    wallpaperType,
    dynamicWallpaperTheme,
    interactiveWallpaperTheme,
    showWeather,
  } = useContext(AppContext);

  useEffect(() => {
    if (showClockAndCalendar) {
      const intervalRef = setInterval(() => {
        setDate(new Date());
      }, 1000);

      return () => clearInterval(intervalRef);
    }
  }, [showClockAndCalendar]);

  useEffect(() => {
    const defaultSearchEngine = localStorage.getItem(
      SEARCH_ENGINE_LOCAL_STORAGE_KEY,
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
      ...(backgroundImage && wallpaperType === "image"
        ? {
            "--bg-image": `url(${backgroundImage})`,
          }
        : {}),
    }),
    [backgroundImage, wallpaperType],
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
        `App theme-${themeColor || theme}` +
        (backgroundImage ? " has-bg" : "") +
        (wallpaperType === "dynamic" ? " has-dynamic-bg" : "") +
        (wallpaperType === "interactive" ? " has-interactive-bg" : "")
      }
      style={bgStyle}
      lang={locale}
    >
      {wallpaperType === "dynamic" && (
        <DynamicWallpaper theme={dynamicWallpaperTheme} />
      )}
      {wallpaperType === "interactive" && (
        <InteractiveWallpaper theme={interactiveWallpaperTheme} />
      )}
      {wallpaperType !== "dynamic" &&
        wallpaperType !== "interactive" &&
        wallpaperBlur !== 0 && (
          <div
            className="wallpaper-blur-container"
            style={{ backdropFilter: `blur(${wallpaperBlur}px)` }}
          ></div>
        )}
      <div
        className={
          "main-content" +
          (showClockAndCalendar ? " has-clock-calendar" : "") +
          (isWidgetsAwayFromDock ? " widgets-away-from-dock" : "") +
          (!!dockBarSites.length ? ` dock-${dockPosition}` : "")
        }
      >
        {showClockAndCalendar && (
          <div className="section-1">
            {useAnalogClock2 ? <Clock2 date={date} /> : <Clock1 date={date} />}
            {showMonthView ? (
              <Calendar date={date} />
            ) : (
              <Calendar1 date={date} />
            )}
            {showWeather && (
              <div className="weather-in-widgets">
                <Weather />
              </div>
            )}
          </div>
        )}
        <div className="section-2">
          {showWeather && (
            <div className={showClockAndCalendar ? "weather-in-greeting" : ""}>
              <Weather />
            </div>
          )}
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
      {showStickyNotes && <StickyNotes />}
    </div>
  );
};

export default App;
