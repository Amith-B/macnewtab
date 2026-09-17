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
import DigitalClock from "./widgets/digital-clock/DigitalClock";
import FullScreenClock from "./components/fullscreen-clock/FullScreenClock";
import Search from "./components/search/Search";
import SearchEngineSwitcher from "./components/search-engine-switcher/SearchEngineSwitcher";
import {
  SEARCH_ENGINE_LOCAL_STORAGE_KEY,
  searchEngineKeys,
} from "./static/searchEngine";
import { getResolvedKey } from "./utils/spacesStorage";
import { AppContext } from "./context/provider";
import TopSites from "./components/topsites/TopSites";
import Translation from "./locale/Translation";
import { translation } from "./locale/languages";
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
  const [showFullscreenClock, setShowFullscreenClock] = useState(false);

  const {
    theme,
    themeColor,
    backgroundImage,
    wallpaperBlur,
    wallpaperFit,
    showGreeting,
    showVisitedSites,
    showSearchBar,
    showSearchEngines,
    useSearchDropdown,
    showMonthView,
    locale,
    showClockAndCalendar,
    showTabManager,
    showStickyNotes,
    dockPosition,
    isWidgetsAwayFromDock,
    clockStyle,
    wallpaperType,
    dynamicWallpaperTheme,
    interactiveWallpaperTheme,
    showWeather,
    showBattery,
    enableLoadAnimation,
    loadAnimationType,
    activeSpaceId,
    activeSpace,
    spacesConfig,
    centerWidgetsLayout,
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
    if (showClockAndCalendar || showFullscreenClock) {
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
  }, [showClockAndCalendar, showFullscreenClock]);

  useEffect(() => {
    const resolvedSearchKey = getResolvedKey(
      SEARCH_ENGINE_LOCAL_STORAGE_KEY,
      activeSpaceId,
    );
    const defaultSearchEngine = localStorage.getItem(resolvedSearchKey);

    if (defaultSearchEngine && searchEngineKeys.includes(defaultSearchEngine)) {
      setSearchEngine(defaultSearchEngine);
    } else {
      setSearchEngine(searchEngineKeys[0]);
    }
  }, [activeSpaceId]);

  const handleSearchEngineChange = useCallback(
    (val: string) => {
      const resolvedSearchKey = getResolvedKey(
        SEARCH_ENGINE_LOCAL_STORAGE_KEY,
        activeSpaceId,
      );
      localStorage.setItem(resolvedSearchKey, val);
      setSearchEngine(val);
    },
    [activeSpaceId],
  );

  const handleOpenFullscreenClock = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setTime(new Date());
    setShowFullscreenClock(true);
    if (
      !document.fullscreenElement &&
      document.documentElement.requestFullscreen
    ) {
      document.documentElement.requestFullscreen().catch(() => {
        // Fallback: in-tab fixed overlay still provides fullscreen view
      });
    }
  }, []);

  const bgStyle: CSSProperties & Record<string, string> = useMemo(
    () => ({
      ...(backgroundImage && (wallpaperType === "image" || !wallpaperType)
        ? {
            "--bg-image": `url(${backgroundImage})`,
            backgroundSize:
              wallpaperFit === "fit"
                ? "contain"
                : wallpaperFit === "fill"
                  ? "100% 100%"
                  : wallpaperFit === "tile"
                    ? "auto"
                    : "cover",
            backgroundRepeat: wallpaperFit === "tile" ? "repeat" : "no-repeat",
            backgroundPosition:
              wallpaperFit === "tile" ? "top left" : "center center",
          }
        : {}),
    }),
    [backgroundImage, wallpaperType, wallpaperFit],
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
        <svg
          style={{ position: "absolute", width: 0, height: 0 }}
          aria-hidden="true"
        >
          <filter
            id="chromatic-shift-filter"
            x="-5%"
            y="0%"
            width="110%"
            height="100%"
          >
            <feOffset
              in="SourceGraphic"
              dx="8"
              result="shifted-right"
              id="chromatic-dx-right"
            />
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
            <feOffset
              in="SourceGraphic"
              dx="-8"
              result="shifted-left"
              id="chromatic-dx-left"
            />
            <feComponentTransfer in="shifted-left" result="blue-only">
              <feFuncR type="discrete" tableValues="0" />
              <feFuncG type="discrete" tableValues="0" />
              <feFuncB type="identity" />
            </feComponentTransfer>
            <feComposite
              in="red-only"
              in2="green-only"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="1"
              k4="0"
              result="rg"
            />
            <feComposite
              in="rg"
              in2="blue-only"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="1"
              k4="0"
            />
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
      {spacesConfig && activeSpace && (
        <div className="active-space-capsule">
          <span
            className="space-color-dot"
            style={{ backgroundColor: activeSpace.color || "#0883fd" }}
          ></span>
          <span className="space-name">{activeSpace.name}</span>
        </div>
      )}
      <div
        className={
          "main-content" +
          (showClockAndCalendar ? " has-clock-calendar" : "") +
          (isWidgetsAwayFromDock ? " widgets-away-from-dock" : "") +
          ` dock-${dockPosition}` +
          ` layout-${centerWidgetsLayout}`
        }
      >
        {showClockAndCalendar && (
          <div className="section-1">
            <div className="clock-widget-container">
              {clockStyle === "digital" ? (
                <DigitalClock date={time} />
              ) : clockStyle === "analog-2" ? (
                <Clock2 date={time} />
              ) : (
                <Clock1 date={time} />
              )}
              <button
                className="clock-widget-fullscreen-btn"
                onClick={handleOpenFullscreenClock}
                title={
                  translation[locale]?.fullscreen_clock || "Fullscreen Clock"
                }
                aria-label={
                  translation[locale]?.fullscreen_clock || "Fullscreen Clock"
                }
                type="button"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </button>
            </div>
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
          {showSearchBar && (
            <>
              <Search
                selectedSearchEngine={searchEngine}
                onSelectedEngineChange={handleSearchEngineChange}
                showSearchEngines={showSearchEngines}
                useSearchDropdown={useSearchDropdown}
              />
              {showSearchEngines && !useSearchDropdown && (
                <SearchEngineSwitcher
                  selectedSearchEngine={searchEngine}
                  onSelectedEngineChange={handleSearchEngineChange}
                />
              )}
            </>
          )}
        </div>
      </div>
      <Dock />
      {showTabManager && <TabManager />}
      {showStickyNotes && <StickyNotes />}
      {showFullscreenClock && (
        <FullScreenClock
          date={time}
          onClose={() => setShowFullscreenClock(false)}
        />
      )}
      <FooterNotice
        storageKey="hide_footer_notice"
        title={<Translation value="hide_footer_notice_title" />}
        description={<Translation value="hide_footer_notice_desc" />}
      />
    </div>
  );
};

export default App;
