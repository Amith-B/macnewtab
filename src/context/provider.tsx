import { useState, useEffect, ReactNode, createContext } from "react";
import {
  THEME_KEYS,
  THEME_LOCAL_STORAGE_KEY,
  THEME_COLOR_LOCAL_STORAGE_KEY,
} from "../static/theme";
import {
  SEPARATE_PAGE_LINKS_LOCAL_STORAGE_KEY,
  SHOW_CLOCK_AND_CALENDAR_LOCAL_STORAGE_KEY,
  SHOW_GREETING_LOCAL_STORAGE_KEY,
  SHOW_MONTH_VIEW_LOCAL_STORAGE_KEY,
  SHOW_SEARCH_ENGINES_LOCAL_STORAGE_KEY,
  SHOW_TAB_MANAGER_LOCAL_STORAGE_KEY,
  SHOW_VISITED_SITE_LOCAL_STORAGE_KEY,
} from "../static/generalSettings";
import { BOOKMARK_TOGGLE_STORAGE_KEY } from "../static/bookmarks";
import { SELECTED_LOCALE_LOCAL_STORAGE_KEY } from "../static/locale";
import { languages } from "../locale/languages";
import {
  DOCK_POSITION_LOCAL_STORAGE_KEY,
  DOCK_SITES_LOCAL_STORAGE_KEY,
  dockBarDefaultSites,
  DockPosition,
  dockPositionsList,
} from "../static/dockSites";
import { generateRandomId } from "../utils/random";
import {
  TODO_DOCK_VISIBLE_LOCAL_STORAGE_KEY,
  TODO_LIST_LOCAL_STORAGE_KEY,
  TODO_LIST_UPDATED_DATE_LOCAL_STORAGE_KEY,
} from "../static/todo";
import { WALLPAPER_BLUR_LOCAL_STORAGE_KEY } from "../static/wallpapers";
import { SHOW_STICKY_NOTES_LOCAL_STORAGE_KEY } from "../static/stickyNotes";

type DockBarSites = Array<{ title: string; url: string; id: string }>;
type TodoList = Array<{ content: string; id: string; checked: boolean }>;

export const AppContext = createContext({
  theme: "system",
  themeColor: "",
  dockPosition: "bottom",
  handleDockPositionChange: (_: DockPosition) => {},
  locale: "en" as typeof languages,
  dockBarSites: [] as DockBarSites,
  handleDockSitesChange: (_: DockBarSites) => {},
  handleLocaleChange: (_: typeof languages) => {},
  handleThemeChange: (_: string) => {},
  handleThemeColorChange: (_: string) => {},
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
  showClockAndCalendar: true,
  handleShowClockAndCalendarChange: (_: boolean) => {},
  showTabManager: true,
  handleShowTabManagerChange: (_: boolean) => {},
  todoList: [] as TodoList,
  handleAddTodoList: (_: string) => {},
  handleTodoItemChecked: (_id: string, _checked: boolean) => {},
  handleTodoItemDelete: (_: string) => {},
  handleTodoListUpdate: (_: TodoList) => {},
  todoListVisbility: true,
  handleTodoListVisbility: (_: boolean) => {},
  handleClearCompletedTodoList: () => {},
  groupTodosByCheckedStatus: () => {},
  wallpaperBlur: 0,
  handleWallpaperBlur: (_: number) => {},
  bookmarksVisible: false,
  handleBookmarkVisbility: (_: boolean) => {},
  showStickyNotes: true,
  handleShowStickyNotesChange: (_: boolean) => {},
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

const saveImageToIndexedDB = async (base64Image: string): Promise<string> => {
  const db = await openDatabase();
  const blob = await fetch(base64Image).then((res) => res.blob());

  return new Promise((resolve, reject) => {
    const transaction = db.transaction("wallpapers", "readwrite");
    const store = transaction.objectStore("wallpapers");
    store.put({ id: "customWallpaper", imageBlob: blob });

    transaction.oncomplete = () => {
      const url = URL.createObjectURL(blob);
      resolve(url);
    };
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
        | { id: string; base64?: string; imageBlob?: Blob }
        | undefined;

      if (result?.imageBlob) {
        const url = URL.createObjectURL(result.imageBlob);
        resolve(url);
      } else {
        resolve(result?.base64 || null);
      }
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

const getLocalstorageDataWithPromise = (
  localStorageKey: string
): Promise<string | null> => {
  return new Promise<string | null>((resolve) => {
    const todoList = localStorage.getItem(localStorageKey);

    resolve(todoList);
  });
};

export default function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState("system");
  const [themeColor, setThemeColor] = useState("");
  const [backgroundImage, setBackgroundImage] = useState("");
  const [wallpaperBlur, setWallpaperBlur] = useState(0);

  const [locale, setLocale] = useState<typeof languages>("en");

  const [showGreeting, setShowGreeeting] = useState(true);
  const [showClockAndCalendar, setShowClockAndCalendar] = useState(true);
  const [showTabManager, setShowTabManager] = useState(true);
  const [showVisitedSites, setShowVisitedSites] = useState(true);
  const [separatePageSite, setSeparatePageSite] = useState(false);
  const [showSearchEngines, setShowSearchEngines] = useState(true);
  const [showMonthView, setShowMonthView] = useState(true);
  const [dockBarSites, setDockBarSites] = useState<DockBarSites>([]);

  const [dockPosition, setDockPosition] = useState<DockPosition>("bottom");
  const [todoList, setTodoList] = useState<TodoList>([]);

  const [todoListVisbility, setTodoListVisbility] = useState(false);
  const [bookmarksVisible, setBookmarksVisible] = useState(false);
  const [showStickyNotes, setShowStickyNotes] = useState(true);

  useEffect(() => {
    const getList = () => {
      const request = getLocalstorageDataWithPromise(
        TODO_LIST_LOCAL_STORAGE_KEY
      );

      request.then((todoList: string | null) => {
        try {
          if (todoList) {
            let parsedList = JSON.parse(todoList) as TodoList;

            parsedList = parsedList.map((item) => ({
              ...item,
              id: item.id || generateRandomId(),
            }));

            if (Array.isArray(parsedList)) {
              setTodoList(parsedList);
            }
          } else {
            setTodoList([]);
          }
        } catch (_) {
          setTodoList([]);
        }
      });
    };

    getList();
  }, [todoListVisbility]);

  useEffect(() => {
    const defaultTheme = localStorage.getItem(THEME_LOCAL_STORAGE_KEY);

    if (defaultTheme && THEME_KEYS.includes(defaultTheme)) {
      setTheme(defaultTheme);
    } else {
      setTheme("system");
    }

    const defaultThemeColor = localStorage.getItem(
      THEME_COLOR_LOCAL_STORAGE_KEY
    );

    if (defaultThemeColor) {
      setThemeColor(defaultThemeColor);
    } else {
      setThemeColor("");
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

    const defaultLocale = localStorage.getItem(
      SELECTED_LOCALE_LOCAL_STORAGE_KEY
    );
    setLocale(
      (languages.includes(String(defaultLocale))
        ? String(defaultLocale)
        : "en") as typeof languages
    );

    const defaultShowClockAndCalendar = localStorage.getItem(
      SHOW_CLOCK_AND_CALENDAR_LOCAL_STORAGE_KEY
    );
    setShowClockAndCalendar(
      defaultShowClockAndCalendar === "true"
        ? true
        : defaultShowClockAndCalendar === "false"
        ? false
        : true
    );

    const defaultShowTabManager = localStorage.getItem(
      SHOW_TAB_MANAGER_LOCAL_STORAGE_KEY
    );
    setShowTabManager(
      defaultShowTabManager === "true"
        ? true
        : defaultShowTabManager === "false"
        ? false
        : true
    );

    const dockPosition =
      localStorage.getItem(DOCK_POSITION_LOCAL_STORAGE_KEY) || "bottom";

    setDockPosition(
      dockPositionsList.includes(dockPosition || "")
        ? (dockPosition as DockPosition)
        : "bottom"
    );

    const wallpaperBlurValue = parseInt(
      localStorage.getItem(WALLPAPER_BLUR_LOCAL_STORAGE_KEY) || "0"
    );

    setWallpaperBlur(
      !isNaN(wallpaperBlurValue) &&
        wallpaperBlurValue <= 50 &&
        wallpaperBlurValue >= 0
        ? wallpaperBlurValue
        : 0
    );

    try {
      const storedDockSites = localStorage.getItem(
        DOCK_SITES_LOCAL_STORAGE_KEY
      );

      if (storedDockSites) {
        let parsedList = JSON.parse(storedDockSites) as DockBarSites;

        parsedList = parsedList.map((item) => ({
          ...item,
          id: item.id || generateRandomId(),
        }));

        if (Array.isArray(parsedList)) {
          setDockBarSites(parsedList);
        }
      } else {
        setDockBarSites(dockBarDefaultSites);
      }
    } catch (_) {
      setDockBarSites(dockBarDefaultSites);
    }

    const bookmarksEnabled = localStorage.getItem(BOOKMARK_TOGGLE_STORAGE_KEY);

    setBookmarksVisible(bookmarksEnabled === "true");

    const defaultTodoDockVisibility = localStorage.getItem(
      TODO_DOCK_VISIBLE_LOCAL_STORAGE_KEY
    );
    setTodoListVisbility(
      defaultTodoDockVisibility === "true"
        ? true
        : defaultTodoDockVisibility === "false"
        ? false
        : true
    );

    const defaultShowStickyNotes = localStorage.getItem(
      SHOW_STICKY_NOTES_LOCAL_STORAGE_KEY
    );
    setShowStickyNotes(
      defaultShowStickyNotes === "true"
        ? true
        : defaultShowStickyNotes === "false"
        ? false
        : true
    );

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TODO_LIST_LOCAL_STORAGE_KEY && e.newValue) {
        try {
          setTodoList(JSON.parse(e.newValue));
        } catch (error) {
          console.error("Failed to parse todo list from storage event", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleClearCompletedTodoList = () => {
    const todoSavedDate = localStorage.getItem(
      TODO_LIST_UPDATED_DATE_LOCAL_STORAGE_KEY
    );

    const currentDate = new Date();
    const formatedCurrentDate = `${currentDate.getDate()}_${currentDate.getMonth()}_${currentDate.getFullYear()}`;

    if (
      todoSavedDate &&
      todoSavedDate.split("_").length === 3 &&
      todoSavedDate !== formatedCurrentDate
    ) {
      const updatedTodoList = todoList.filter((item) => !item.checked);
      handleTodoListUpdate(updatedTodoList);
    }

    localStorage.setItem(
      TODO_LIST_UPDATED_DATE_LOCAL_STORAGE_KEY,
      formatedCurrentDate
    );
  };

  const handleThemeChange = (val: string) => {
    localStorage.setItem(THEME_LOCAL_STORAGE_KEY, val);
    setTheme(val);
  };

  const handleThemeColorChange = (val: string) => {
    localStorage.setItem(THEME_COLOR_LOCAL_STORAGE_KEY, val);
    setThemeColor(val);
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
    const blobURL = await saveImageToIndexedDB(base64Image);
    setBackgroundImage(blobURL);
  };

  const handleLoadWallpaper = async () => {
    const blobURL = await fetchImageFromIndexedDB();
    if (blobURL) {
      setBackgroundImage(blobURL);
    }
  };

  const handleDeleteWallpaper = async () => {
    await deleteImageFromIndexedDB();
    setBackgroundImage("");
  };

  const handleLocaleChange = (val: typeof languages) => {
    localStorage.setItem(SELECTED_LOCALE_LOCAL_STORAGE_KEY, val);
    setLocale(val);
  };

  const handleDockSitesChange = (val: DockBarSites) => {
    localStorage.setItem(DOCK_SITES_LOCAL_STORAGE_KEY, JSON.stringify(val));
    setDockBarSites(val);
  };

  const handleDockPositionChange = (val: DockPosition) => {
    localStorage.setItem(DOCK_POSITION_LOCAL_STORAGE_KEY, val);
    setDockPosition(val);
  };

  const handleAddTodoList = (content: string) => {
    const updatedTodoList = [
      {
        checked: false,
        id: generateRandomId(),
        content,
      },
      ...todoList,
    ] as TodoList;

    handleTodoListUpdate(updatedTodoList);
    handleClearCompletedTodoList();
  };

  const handleTodoItemChecked = (id: string, checked: boolean) => {
    const updatedTodoList = todoList.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          checked,
        };
      }

      return item;
    });

    handleTodoListUpdate(updatedTodoList);
    handleClearCompletedTodoList();
  };

  const handleTodoItemDelete = (id: string) => {
    const updatedTodoList = todoList.filter((item) => {
      return item.id !== id;
    });
    handleTodoListUpdate(updatedTodoList);
    handleClearCompletedTodoList();
  };

  const handleTodoListVisbility = (val: boolean) => {
    localStorage.setItem(TODO_DOCK_VISIBLE_LOCAL_STORAGE_KEY, String(val));
    setTodoListVisbility(val);
  };

  const handleTodoListUpdate = (list: TodoList) => {
    setTodoList(list);
    localStorage.setItem(TODO_LIST_LOCAL_STORAGE_KEY, JSON.stringify(list));
  };

  const groupTodosByCheckedStatus = () => {
    const uncheckedItems = todoList.filter((todo) => !todo.checked);
    const checkedItems = todoList.filter((todo) => todo.checked);

    handleTodoListUpdate([...uncheckedItems, ...checkedItems]);
  };

  const handleShowClockAndCalendarChange = (val: boolean) => {
    localStorage.setItem(
      SHOW_CLOCK_AND_CALENDAR_LOCAL_STORAGE_KEY,
      String(val)
    );
    setShowClockAndCalendar(val);
  };

  const handleShowTabManagerChange = (val: boolean) => {
    localStorage.setItem(SHOW_TAB_MANAGER_LOCAL_STORAGE_KEY, String(val));
    setShowTabManager(val);
  };

  const handleWallpaperBlur = (val: number) => {
    localStorage.setItem(WALLPAPER_BLUR_LOCAL_STORAGE_KEY, String(val));
    setWallpaperBlur(val);
  };

  const handleBookmarkVisbility = async (val: boolean) => {
    if (val) {
      const hasBookmarkPermission = await new Promise((resolve) =>
        chrome.permissions.contains({ permissions: ["bookmarks"] }, resolve)
      );

      if (!hasBookmarkPermission) {
        const permissionGranted = await new Promise((resolve) =>
          chrome.permissions.request({ permissions: ["bookmarks"] }, resolve)
        );

        if (!permissionGranted) {
          return;
        }
      }
    }

    localStorage.setItem(BOOKMARK_TOGGLE_STORAGE_KEY, String(val));
    setBookmarksVisible(val);
  };

  const handleShowStickyNotesChange = (val: boolean) => {
    localStorage.setItem(SHOW_STICKY_NOTES_LOCAL_STORAGE_KEY, String(val));
    setShowStickyNotes(val);
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        themeColor,
        handleThemeChange,
        handleThemeColorChange,
        backgroundImage,
        handleWallpaperChange,
        wallpaperBlur,
        handleWallpaperBlur,
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
        showClockAndCalendar,
        handleShowClockAndCalendarChange,
        showTabManager,
        handleShowTabManagerChange,
        locale,
        handleLocaleChange,
        dockBarSites,
        handleDockSitesChange,
        dockPosition,
        handleDockPositionChange,
        todoList,
        handleAddTodoList,
        handleTodoItemChecked,
        todoListVisbility,
        handleTodoListVisbility,
        handleTodoItemDelete,
        handleClearCompletedTodoList,
        handleTodoListUpdate,
        groupTodosByCheckedStatus,
        bookmarksVisible,
        handleBookmarkVisbility,
        showStickyNotes,
        handleShowStickyNotesChange,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
