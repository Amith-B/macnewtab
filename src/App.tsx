import {
  CSSProperties,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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
import Battery from "./widgets/battery/Battery";
import FooterNotice from "./components/footer-notice/FooterNotice";

const App = function App() {
  const [searchEngine, setSearchEngine] = useState("");
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());

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
    useAnalogClock2,
    wallpaperType,
    dynamicWallpaperTheme,
    interactiveWallpaperTheme,
    showWeather,
    showBattery,
    enableLoadAnimation,
    loadAnimationType,
  } = useContext(AppContext);

  const [isWakingUp, setIsWakingUp] = useState(enableLoadAnimation);

  useEffect(() => {
    if (isWakingUp) {
      const timer = setTimeout(() => {
        setIsWakingUp(false);
      }, 1100);
      return () => clearTimeout(timer);
    }
  }, [isWakingUp]);

  // Animate SVG filters via JS since SMIL <animate> is unreliable
  useEffect(() => {
    if (!isWakingUp) return;

    if (loadAnimationType === "chromatic-shift") {
      const startTime = performance.now();
      const duration = 500;
      const startDx = 8;
      let rafId: number;

      const animate = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const dx = startDx * (1 - eased);
        const rEl = document.getElementById("chromatic-dx-right");
        const lEl = document.getElementById("chromatic-dx-left");
        if (rEl) rEl.setAttribute("dx", String(dx));
        if (lEl) lEl.setAttribute("dx", String(-dx));
        if (progress < 1) rafId = requestAnimationFrame(animate);
      };

      rafId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(rafId);
    }
  }, [isWakingUp, loadAnimationType]);

  useEffect(() => {
    if (showClockAndCalendar) {
      const interval = setInterval(() => {
        const now = new Date();
        setTime(now);
        const currentDateStr = now.toDateString();
        setDate((prev) => {
          if (prev.toDateString() !== currentDateStr) {
            return now;
          }
          return prev;
        });
      }, 1000);
      return () => clearInterval(interval);
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

  const handleSearchEngineChange = useCallback((val: string) => {
    localStorage.setItem(SEARCH_ENGINE_LOCAL_STORAGE_KEY, val);
    setSearchEngine(val);
  }, []);

  const bgStyle: CSSProperties & Record<string, string> = useMemo(
    () => ({
      ...(backgroundImage && (wallpaperType === "image" || !wallpaperType)
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
        (wallpaperType === "interactive" ? " has-interactive-bg" : "") +
        (isWakingUp ? ` load-animation-${loadAnimationType}` : "")
      }
      style={bgStyle}
      lang={locale}
    >
      {isWakingUp && loadAnimationType === "chromatic-shift" && (
        <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
          <filter id="chromatic-shift-filter" x="-5%" y="0%" width="110%" height="100%">
            <feOffset in="SourceGraphic" dx="8" result="shifted-right" id="chromatic-dx-right" />
            <feComponentTransfer in="shifted-right" result="red-only">
              <feFuncR type="identity" />
              <feFuncG type="discrete" tableValues="0" />
              <feFuncB type="discrete" tableValues="0" />
            </feComponentTransfer>
            <feComponentTransfer in="SourceGraphic" result="green-only">
              <feFuncR type="discrete" tableValues="0" />
              <feFuncG type="identity" />
              <feFuncB type="discrete" tableValues="0" />
            </feComponentTransfer>
            <feOffset in="SourceGraphic" dx="-8" result="shifted-left" id="chromatic-dx-left" />
            <feComponentTransfer in="shifted-left" result="blue-only">
              <feFuncR type="discrete" tableValues="0" />
              <feFuncG type="discrete" tableValues="0" />
              <feFuncB type="identity" />
            </feComponentTransfer>
            <feComposite in="red-only" in2="green-only" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="rg" />
            <feComposite in="rg" in2="blue-only" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
          </filter>
        </svg>
      )}
      {isWakingUp && loadAnimationType === "tv-static-burst" && (
        <div className="tv-static-overlay" aria-hidden="true" />
      )}
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
          ` dock-${dockPosition}`
        }
      >
        {showClockAndCalendar && (
          <div className="section-1">
            {useAnalogClock2 ? <Clock2 date={time} /> : <Clock1 date={time} />}
            {showMonthView ? (
              <Calendar date={date} />
            ) : (
              <Calendar1 date={date} />
            )}
            {(showWeather || showBattery) && (
              <div className="weather-in-widgets">
                <div className="weather-battery-row">
                  {showWeather && <Weather />}
                  {showBattery && <Battery />}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="section-2">
          {(showWeather || showBattery) && (
            <div className={showClockAndCalendar ? "weather-in-greeting" : ""}>
              <div className="weather-battery-row">
                {showWeather && <Weather />}
                {showBattery && <Battery />}
              </div>
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
      <FooterNotice 
        storageKey="hide_footer_notice"
        title={<Translation value="hide_footer_notice_title" />}
        description={<Translation value="hide_footer_notice_desc" />}
      />
    </div>
  );
};

export default App;
