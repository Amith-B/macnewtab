import { useState, useEffect, ReactNode, createContext } from "react";
import { THEME_KEYS, THEME_LOCAL_STORAGE_KEY } from "../static/theme";
import { BG_IMAGE_LOCAL_STORAGE_KEY } from "../static/backgroundImage";
import {
  SEPARATE_PAGE_LINKS_LOCAL_STORAGE_KEY,
  SHOW_GREETING_LOCAL_STORAGE_KEY,
  SHOW_SEARCH_ENGINES_LOCAL_STORAGE_KEY,
  SHOW_VISITED_SITE_LOCAL_STORAGE_KEY,
} from "../static/generalSettings";

export const AppContext = createContext({
  date: new Date(),
  theme: "system",
  handleThemeChange: (_: string) => {},
  backgroundImage: "",
  handleWallpaperChange: (_: string) => {},
  showGreeting: true,
  handleShowGreeetingChange: (_: boolean) => {},
  showVisitedSites: true,
  handleShowVisitedSitesChange: (_: boolean) => {},
  separatePageSite: false,
  handleSeparatePageSiteChange: (_: boolean) => {},
  showSearchEngines: true,
  handleShowSearchEnginesChange: (_: boolean) => {},
});

export default function AppProvider({ children }: { children: ReactNode }) {
  const [date, setDate] = useState(new Date());
  const [theme, setTheme] = useState("system");
  const [backgroundImage, setBackgroundImage] = useState("");

  const [showGreeting, setShowGreeeting] = useState(true);
  const [showVisitedSites, setShowVisitedSites] = useState(true);
  const [separatePageSite, setSeparatePageSite] = useState(false);
  const [showSearchEngines, setShowSearchEngines] = useState(true);

  useEffect(() => {
    const intervalRef = setInterval(() => {
      setDate(new Date());
    }, 1000);

    const defaultTheme = localStorage.getItem(THEME_LOCAL_STORAGE_KEY);

    if (defaultTheme && THEME_KEYS.includes(defaultTheme)) {
      setTheme(defaultTheme);
    } else {
      setTheme("system");
    }

    const defaultWallpaper = localStorage.getItem(BG_IMAGE_LOCAL_STORAGE_KEY);
    setBackgroundImage(defaultWallpaper || "");

    const defaultShowGreeting = localStorage.getItem(
      SHOW_GREETING_LOCAL_STORAGE_KEY
    );
    setShowGreeeting(
      defaultShowGreeting === "true"
        ? true
        : defaultShowGreeting === "false"
        ? false
        : true
    );

    const defaultShowVisitedSites = localStorage.getItem(
      SHOW_VISITED_SITE_LOCAL_STORAGE_KEY
    );
    setShowVisitedSites(
      defaultShowVisitedSites === "true"
        ? true
        : defaultShowVisitedSites === "false"
        ? false
        : true
    );

    const defaultSeparatePageSite = localStorage.getItem(
      SEPARATE_PAGE_LINKS_LOCAL_STORAGE_KEY
    );
    setSeparatePageSite(defaultSeparatePageSite === "true" ? true : false);

    const defaultShowSearchEngines = localStorage.getItem(
      SHOW_SEARCH_ENGINES_LOCAL_STORAGE_KEY
    );
    setShowSearchEngines(
      defaultShowSearchEngines === "true"
        ? true
        : defaultShowSearchEngines === "false"
        ? false
        : true
    );

    return () => clearInterval(intervalRef);
  }, []);

  const handleThemeChange = (val: string) => {
    localStorage.setItem(THEME_LOCAL_STORAGE_KEY, val);
    setTheme(val);
  };

  const handleWallpaperChange = (val: string) => {
    localStorage.setItem(BG_IMAGE_LOCAL_STORAGE_KEY, val);
    setBackgroundImage(val);
  };

  const handleShowGreeetingChange = (val: boolean) => {
    localStorage.setItem(SHOW_GREETING_LOCAL_STORAGE_KEY, String(val));
    setShowGreeeting(val);
  };

  const handleShowVisitedSitesChange = (val: boolean) => {
    localStorage.setItem(SHOW_VISITED_SITE_LOCAL_STORAGE_KEY, String(val));
    setShowVisitedSites(val);
  };

  const handleSeparatePageSiteChange = (val: boolean) => {
    localStorage.setItem(SEPARATE_PAGE_LINKS_LOCAL_STORAGE_KEY, String(val));
    setSeparatePageSite(val);
  };

  const handleShowSearchEnginesChange = (val: boolean) => {
    localStorage.setItem(SHOW_SEARCH_ENGINES_LOCAL_STORAGE_KEY, String(val));
    setShowSearchEngines(val);
  };

  return (
    <AppContext.Provider
      value={{
        date,
        theme,
        handleThemeChange,
        backgroundImage,
        handleWallpaperChange,
        showGreeting,
        handleShowGreeetingChange,
        showVisitedSites,
        handleShowVisitedSitesChange,
        separatePageSite,
        handleSeparatePageSiteChange,
        showSearchEngines,
        handleShowSearchEnginesChange,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
