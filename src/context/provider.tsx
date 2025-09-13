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
import {
  getLocalstorageDataWithPromise,
  useLocalStorage,
} from "../utils/localStorage";

type DockBarSites = Array<{ title: string; url: string; id: string }>;
type TodoList = Array<{ content: string; id: string; checked: boolean }>;

export const AppContext = createContext({
  theme: "system",
  setTheme: (_: string) => {},
  themeColor: "",
  setThemeColor: (_: string) => {},
  dockPosition: "bottom",
  setDockPosition: (_: DockPosition) => {},
  locale: "en" as typeof languages,
  setLocale: (_: typeof languages) => {},
  dockBarSites: [] as DockBarSites,
  handleDockSitesChange: (_: DockBarSites) => {},
  backgroundImage: "",
  handleWallpaperChange: (_: string) => {},
  showGreeting: true,
  setShowGreeeting: (_: boolean) => {},
  showVisitedSites: true,
  setShowVisitedSites: (_: boolean) => {},
  separatePageSite: false,
  setSeparatePageSite: (_: boolean) => {},
  showSearchEngines: true,
  setShowSearchEngines: (_: boolean) => {},
  showMonthView: false,
  setShowMonthView: (_: boolean) => {},
  showClockAndCalendar: true,
  setShowClockAndCalendar: (_: boolean) => {},
  showTabManager: true,
  setShowTabManager: (_: boolean) => {},
  todoList: [] as TodoList,
  handleAddTodoList: (_: string) => {},
  handleTodoItemChecked: (_id: string, _checked: boolean) => {},
  handleTodoItemDelete: (_: string) => {},
  setTodoList: (_: TodoList) => {},
  todoListVisbility: true,
  setTodoListVisbility: (_: boolean) => {},
  handleClearCompletedTodoList: () => {},
  groupTodosByCheckedStatus: () => {},
  wallpaperBlur: 0,
  handleWallpaperBlur: (_: number) => {},
  bookmarksVisible: false,
  handleBookmarkVisbility: (_: boolean) => {},
  showStickyNotes: true,
  setShowStickyNotes: (_: boolean) => {},
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

export default function AppProvider({ children }: { children: ReactNode }) {
  const [backgroundImage, setBackgroundImage] = useState("");
  const [wallpaperBlur, setWallpaperBlur] = useState(0);

  const [locale, setLocale] = useLocalStorage<typeof languages>(
    SELECTED_LOCALE_LOCAL_STORAGE_KEY,
    "en",
    (val) => {
      return languages.includes(String(val));
    }
  );

  const [theme, setTheme] = useLocalStorage(
    THEME_LOCAL_STORAGE_KEY,
    "system",
    (val) => {
      return THEME_KEYS.includes(val);
    }
  );
  const [themeColor, setThemeColor] = useLocalStorage(
    THEME_COLOR_LOCAL_STORAGE_KEY,
    ""
  );
  const [showGreeting, setShowGreeeting] = useLocalStorage(
    SHOW_GREETING_LOCAL_STORAGE_KEY,
    true
  );
  const [showClockAndCalendar, setShowClockAndCalendar] = useLocalStorage(
    SHOW_CLOCK_AND_CALENDAR_LOCAL_STORAGE_KEY,
    true
  );
  const [showTabManager, setShowTabManager] = useLocalStorage(
    SHOW_TAB_MANAGER_LOCAL_STORAGE_KEY,
    true
  );
  const [showVisitedSites, setShowVisitedSites] = useLocalStorage(
    SHOW_VISITED_SITE_LOCAL_STORAGE_KEY,
    true
  );
  const [separatePageSite, setSeparatePageSite] = useLocalStorage(
    SEPARATE_PAGE_LINKS_LOCAL_STORAGE_KEY,
    false
  );
  const [showSearchEngines, setShowSearchEngines] = useLocalStorage(
    SHOW_SEARCH_ENGINES_LOCAL_STORAGE_KEY,
    true
  );
  const [showMonthView, setShowMonthView] = useLocalStorage(
    SHOW_MONTH_VIEW_LOCAL_STORAGE_KEY,
    false
  );
  const [dockBarSites, setDockBarSites] = useState<DockBarSites>([]);

  const [dockPosition, setDockPosition] = useLocalStorage<DockPosition>(
    DOCK_POSITION_LOCAL_STORAGE_KEY,
    "bottom",
    (val) => {
      return dockPositionsList.includes(val || "");
    }
  );
  const [todoList, setTodoList] = useState<TodoList>([]);

  const [todoListVisbility, setTodoListVisbility] = useLocalStorage(
    TODO_DOCK_VISIBLE_LOCAL_STORAGE_KEY,
    true
  );
  const [bookmarksVisible, setBookmarksVisible] = useLocalStorage(
    BOOKMARK_TOGGLE_STORAGE_KEY,
    false
  );
  const [showStickyNotes, setShowStickyNotes] = useLocalStorage(
    SHOW_STICKY_NOTES_LOCAL_STORAGE_KEY,
    true
  );

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
    handleLoadWallpaper();

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
      setTodoList(updatedTodoList);
    }

    localStorage.setItem(
      TODO_LIST_UPDATED_DATE_LOCAL_STORAGE_KEY,
      formatedCurrentDate
    );
  };

  const handleWallpaperChange = (val: string) => {
    if (val) {
      handleSaveWallpaper(val);
    } else {
      handleDeleteWallpaper();
    }
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

  const handleAddTodoList = (content: string) => {
    const updatedTodoList = [
      {
        checked: false,
        id: generateRandomId(),
        content,
      },
      ...todoList,
    ] as TodoList;

    setTodoList(updatedTodoList);
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

    setTodoList(updatedTodoList);
    handleClearCompletedTodoList();
  };

  const handleTodoItemDelete = (id: string) => {
    const updatedTodoList = todoList.filter((item) => {
      return item.id !== id;
    });
    setTodoList(updatedTodoList);
    handleClearCompletedTodoList();
  };

  const groupTodosByCheckedStatus = () => {
    const uncheckedItems = todoList.filter((todo) => !todo.checked);
    const checkedItems = todoList.filter((todo) => todo.checked);

    setTodoList([...uncheckedItems, ...checkedItems]);
  };

  const handleWallpaperBlur = (val: number) => {
    localStorage.setItem(WALLPAPER_BLUR_LOCAL_STORAGE_KEY, String(val));
    setWallpaperBlur(val);
  };

  const handleDockSitesChange = (val: DockBarSites) => {
    localStorage.setItem(DOCK_SITES_LOCAL_STORAGE_KEY, JSON.stringify(val));
    setDockBarSites(val);
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

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        themeColor,
        setThemeColor,
        backgroundImage,
        handleWallpaperChange,
        wallpaperBlur,
        handleWallpaperBlur,
        showGreeting,
        setShowGreeeting,
        showVisitedSites,
        setShowVisitedSites,
        separatePageSite,
        setSeparatePageSite,
        showSearchEngines,
        setShowSearchEngines,
        showMonthView,
        setShowMonthView,
        showClockAndCalendar,
        setShowClockAndCalendar,
        showTabManager,
        setShowTabManager,
        locale,
        setLocale,
        dockBarSites,
        handleDockSitesChange,
        dockPosition,
        setDockPosition,
        todoList,
        handleAddTodoList,
        handleTodoItemChecked,
        todoListVisbility,
        setTodoListVisbility,
        handleTodoItemDelete,
        handleClearCompletedTodoList,
        setTodoList,
        groupTodosByCheckedStatus,
        bookmarksVisible,
        handleBookmarkVisbility,
        showStickyNotes,
        setShowStickyNotes,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
