import { useState, useEffect, ReactNode, createContext } from "react";
import {
  THEME_KEYS,
  THEME_LOCAL_STORAGE_KEY,
  THEME_COLOR_LOCAL_STORAGE_KEY,
} from "../static/theme";
import {
  CENTER_WIDGETS_AWAY_FROM_DOCK_STORAGE_KEY,
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
import {
  GOOGLE_CALENDAR_EVENTS_LOCAL_STORAGE_KEY,
  GOOGLE_USER_LOCAL_STORAGE_KEY,
  SHOW_GOOGLE_CALENDAR_LOCAL_STORAGE_KEY,
} from "../static/googleSettings";
import {
  GoogleUser,
  getGoogleAuthToken,
  removeGoogleAuthToken,
  fetchGoogleUserProfile,
  fetchGoogleCalendarEvents,
  GoogleCalendarEvent,
} from "../utils/googleAuth";
import {
  saveImageToIndexedDB,
  fetchImageFromIndexedDB,
  deleteImageFromIndexedDB,
} from "../utils/db";

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
  handleTodoListUpdate: (_: TodoList) => {},
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
  isWidgetsAwayFromDock: false,
  setIsWidgetsAwayFromDock: (_: boolean) => {},
  googleUser: null as GoogleUser | null,
  googleAuthToken: "",
  handleGoogleSignIn: async () => {},
  handleGoogleSignOut: async () => {},
  showGoogleCalendar: true,
  setShowGoogleCalendar: (_: boolean) => {},
  calendarEvents: [] as GoogleCalendarEvent[],
  setCalendarEvents: (_: GoogleCalendarEvent[]) => {},
});



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

  const [isWidgetsAwayFromDock, setIsWidgetsAwayFromDock] = useLocalStorage(
    CENTER_WIDGETS_AWAY_FROM_DOCK_STORAGE_KEY,
    false
  );

  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [googleAuthToken, setGoogleAuthToken] = useState("");
  const [showGoogleCalendar, setShowGoogleCalendar] = useLocalStorage(
    SHOW_GOOGLE_CALENDAR_LOCAL_STORAGE_KEY,
    true
  );

  const [calendarEvents, setCalendarEvents] = useLocalStorage(
    GOOGLE_CALENDAR_EVENTS_LOCAL_STORAGE_KEY,
    [] as GoogleCalendarEvent[],
    (val) => Array.isArray(val)
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
    const loadGoogleUser = async () => {
      try {
        const storedUser = localStorage.getItem(GOOGLE_USER_LOCAL_STORAGE_KEY);
        if (!storedUser) {
          return;
        }
        const token = await getGoogleAuthToken();
        if (token) {
          setGoogleUser(JSON.parse(storedUser));
          setGoogleAuthToken(token);
        }
      } catch (error) {
        console.error("Failed to load Google user:", error);
      }
    };

    loadGoogleUser();
  }, []);

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

  useEffect(() => {
    if (!showGoogleCalendar || !googleAuthToken) {
      return;
    }

    fetchGoogleCalendarEvents(googleAuthToken).then((events) => {
      setCalendarEvents(events);
    });
    // eslint-disable-next-line
  }, [showGoogleCalendar, googleAuthToken]);

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

  const groupTodosByCheckedStatus = () => {
    const uncheckedItems = todoList.filter((todo) => !todo.checked);
    const checkedItems = todoList.filter((todo) => todo.checked);

    handleTodoListUpdate([...uncheckedItems, ...checkedItems]);
  };

  const handleWallpaperBlur = (val: number) => {
    localStorage.setItem(WALLPAPER_BLUR_LOCAL_STORAGE_KEY, String(val));
    setWallpaperBlur(val);
  };

  const handleTodoListUpdate = (list: TodoList) => {
    setTodoList(list);
    localStorage.setItem(TODO_LIST_LOCAL_STORAGE_KEY, JSON.stringify(list));
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

  const handleGoogleSignIn = async () => {
    try {
      await chrome.identity.clearAllCachedAuthTokens();
      const token = await getGoogleAuthToken();
      const userProfile = await fetchGoogleUserProfile(token);

      setGoogleUser(userProfile);
      setGoogleAuthToken(token);

      localStorage.setItem(
        GOOGLE_USER_LOCAL_STORAGE_KEY,
        JSON.stringify(userProfile)
      );
    } catch (error) {
      console.error("Google sign in failed:", error);
      throw error;
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      if (googleAuthToken) {
        await removeGoogleAuthToken(googleAuthToken);
      }

      setGoogleUser(null);
      setGoogleAuthToken("");
      setShowGoogleCalendar(false);

      localStorage.removeItem(GOOGLE_USER_LOCAL_STORAGE_KEY);
    } catch (error) {
      console.error("Google sign out failed:", error);
      throw error;
    }
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
        handleTodoListUpdate,
        handleTodoItemDelete,
        handleClearCompletedTodoList,
        setTodoList,
        groupTodosByCheckedStatus,
        bookmarksVisible,
        handleBookmarkVisbility,
        showStickyNotes,
        setShowStickyNotes,
        isWidgetsAwayFromDock,
        setIsWidgetsAwayFromDock,
        googleUser,
        googleAuthToken,
        handleGoogleSignIn,
        handleGoogleSignOut,
        showGoogleCalendar,
        setShowGoogleCalendar,
        calendarEvents,
        setCalendarEvents,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
