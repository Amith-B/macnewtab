import { useState, useEffect, ReactNode, createContext } from "react";
import { THEME_KEYS, THEME_LOCAL_STORAGE_KEY } from "../static/theme";
import {
  SEPARATE_PAGE_LINKS_LOCAL_STORAGE_KEY,
  SHOW_GREETING_LOCAL_STORAGE_KEY,
  SHOW_MONTH_VIEW_LOCAL_STORAGE_KEY,
  SHOW_SEARCH_ENGINES_LOCAL_STORAGE_KEY,
  SHOW_VISITED_SITE_LOCAL_STORAGE_KEY,
} from "../static/generalSettings";
import { BOOKMARK_ALERT_SHOWN_LOCAL_STORAGE_KEY } from "../static/bookmarkAlert";

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
  showMonthView: false,
  handleShowMonthViewChange: (_: boolean) => {},
});

const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("WallpaperDB", 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("wallpapers")) {
        db.createObjectStore("wallpapers", { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

const saveImageToIndexedDB = async (base64Image: string): Promise<void> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("wallpapers", "readwrite");
    const store = transaction.objectStore("wallpapers");
    store.put({ id: "customWallpaper", base64: base64Image });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

const fetchImageFromIndexedDB = async (): Promise<string | null> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("wallpapers", "readonly");
    const store = transaction.objectStore("wallpapers");
    const request = store.get("customWallpaper");

    request.onsuccess = () => {
      const result = request.result as
        | { id: string; base64: string }
        | undefined;
      resolve(result?.base64 || null);
    };

    request.onerror = () => reject(request.error);
  });
};

const deleteImageFromIndexedDB = async (): Promise<void> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("wallpapers", "readwrite");
    const store = transaction.objectStore("wallpapers");
    store.delete("customWallpaper");

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export default function AppProvider({ children }: { children: ReactNode }) {
  const [date, setDate] = useState(new Date());
  const [theme, setTheme] = useState("system");
  const [backgroundImage, setBackgroundImage] = useState("");

  const [showGreeting, setShowGreeeting] = useState(true);
  const [showVisitedSites, setShowVisitedSites] = useState(true);
  const [separatePageSite, setSeparatePageSite] = useState(false);
  const [showSearchEngines, setShowSearchEngines] = useState(true);
  const [showMonthView, setShowMonthView] = useState(true);

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

    handleLoadWallpaper();

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
    setSeparatePageSite(defaultSeparatePageSite === "true");

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

    const defaultMonthView = localStorage.getItem(
      SHOW_MONTH_VIEW_LOCAL_STORAGE_KEY
    );
    setShowMonthView(defaultMonthView === "true");

    const bookmarkAlertShown = localStorage.getItem(
      BOOKMARK_ALERT_SHOWN_LOCAL_STORAGE_KEY
    );

    if (!bookmarkAlertShown) {
      const isMac = navigator.userAgent.toLowerCase().includes("mac");
      setTimeout(() => {
        alert(
          isMac
            ? "Use Cmd + Shift + B to toggle the bookmark bar."
            : "Use Ctrl + Shift + B to toggle the bookmark bar."
        );
        localStorage.setItem(BOOKMARK_ALERT_SHOWN_LOCAL_STORAGE_KEY, "true");
      }, 1000);
    }

    return () => clearInterval(intervalRef);
  }, []);

  const handleThemeChange = (val: string) => {
    localStorage.setItem(THEME_LOCAL_STORAGE_KEY, val);
    setTheme(val);
  };

  const handleWallpaperChange = (val: string) => {
    if (val) {
      handleSaveWallpaper(val);
    } else {
      handleDeleteWallpaper();
    }
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

  const handleShowMonthViewChange = (val: boolean) => {
    localStorage.setItem(SHOW_MONTH_VIEW_LOCAL_STORAGE_KEY, String(val));
    setShowMonthView(val);
  };

  const handleSaveWallpaper = async (base64Image: string) => {
    await saveImageToIndexedDB(base64Image);
    setBackgroundImage(base64Image);
  };

  const handleLoadWallpaper = async () => {
    const base64Image = await fetchImageFromIndexedDB();
    if (base64Image) {
      setBackgroundImage(base64Image);
    }
  };

  const handleDeleteWallpaper = async () => {
    await deleteImageFromIndexedDB();
    setBackgroundImage("");
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
        showMonthView,
        handleShowMonthViewChange,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
