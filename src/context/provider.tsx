import React, {
  useState,
  useEffect,
  useCallback,
  ReactNode,
  createContext,
} from "react";
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
  USE_ANALOG_CLOCK_2_LOCAL_STORAGE_KEY,
  SHOW_FOCUS_MODE_LOCAL_STORAGE_KEY,
} from "../static/generalSettings";
import {
  SHOW_WEATHER_LOCAL_STORAGE_KEY,
  WEATHER_TEMP_UNIT_LOCAL_STORAGE_KEY,
  WEATHER_LOCATION_MODE_LOCAL_STORAGE_KEY,
  WEATHER_MANUAL_LOCATION_LOCAL_STORAGE_KEY,
} from "../static/weatherSettings";
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
  WALLPAPER_TYPE_LOCAL_STORAGE_KEY,
  DYNAMIC_WALLPAPER_THEME_LOCAL_STORAGE_KEY,
  DynamicWallpaperThemes,
} from "../static/dynamicWallpaper";
import {
  INTERACTIVE_WALLPAPER_THEME_LOCAL_STORAGE_KEY,
  InteractiveWallpaperThemes,
} from "../static/interactiveThemes";
import {
  QUICK_LINKS_MODE_LOCAL_STORAGE_KEY,
  QUICK_LINKS_LOCAL_STORAGE_KEY,
  QuickLinksMode,
} from "../static/quickLinksSettings";
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

const WEATHER_CACHE_KEY = "macnewtab_weather_cache";
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

type DockBarSites = Array<{
  title: string;
  url: string;
  id: string;
  hasCustomIcon?: boolean;
}>;
type QuickLinksSites = DockBarSites;
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
  showFocusMode: true,
  setShowFocusMode: (_: boolean) => {},
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
  useAnalogClock2: false,
  setUseAnalogClock2: (_: boolean) => {},
  wallpaperType: "image",
  setWallpaperType: (_: string) => {},
  dynamicWallpaperTheme: "aurora",
  setDynamicWallpaperTheme: (_: string) => {},
  interactiveWallpaperTheme: "particles",
  setInteractiveWallpaperTheme: (_: string) => {},
  quickLinksMode: "default" as QuickLinksMode,
  setQuickLinksMode: (_: QuickLinksMode) => {},
  quickLinks: [] as QuickLinksSites,
  handleQuickLinksChange: (_: QuickLinksSites) => {},
  showWeather: true,
  setShowWeather: (_: boolean) => {},
  weatherTempUnit: "celsius",
  setWeatherTempUnit: (_: string) => {},
  weatherLocationMode: "auto",
  setWeatherLocationMode: (_: string) => {},
  weatherManualLocation: null as {
    latitude: number;
    longitude: number;
    name: string;
  } | null,
  setWeatherManualLocation: (
    _: { latitude: number; longitude: number; name: string } | null,
  ) => {},
  weatherData: null as {
    temperature: number;
    weatherCode: number;
    isDay: boolean;
    windSpeed: number;
    cityName: string;
  } | null,
  weatherLoading: true,
  weatherError: null as string | null,
});

export default function AppProvider({ children }: { children: ReactNode }) {
  const [backgroundImage, setBackgroundImage] = useState("");
  const [wallpaperBlur, setWallpaperBlur] = useState(0);

  const [locale, setLocale] = useLocalStorage<typeof languages>(
    SELECTED_LOCALE_LOCAL_STORAGE_KEY,
    "en",
    (val) => {
      return languages.includes(String(val));
    },
  );

  const [theme, setTheme] = useLocalStorage(
    THEME_LOCAL_STORAGE_KEY,
    "system",
    (val) => {
      return THEME_KEYS.includes(val);
    },
  );
  const [themeColor, setThemeColor] = useLocalStorage(
    THEME_COLOR_LOCAL_STORAGE_KEY,
    "",
  );
  const [showGreeting, setShowGreeeting] = useLocalStorage(
    SHOW_GREETING_LOCAL_STORAGE_KEY,
    true,
  );
  const [showClockAndCalendar, setShowClockAndCalendar] = useLocalStorage(
    SHOW_CLOCK_AND_CALENDAR_LOCAL_STORAGE_KEY,
    true,
  );
  const [showTabManager, setShowTabManager] = useLocalStorage(
    SHOW_TAB_MANAGER_LOCAL_STORAGE_KEY,
    true,
  );
  const [showVisitedSites, setShowVisitedSites] = useLocalStorage(
    SHOW_VISITED_SITE_LOCAL_STORAGE_KEY,
    true,
  );
  const [separatePageSite, setSeparatePageSite] = useLocalStorage(
    SEPARATE_PAGE_LINKS_LOCAL_STORAGE_KEY,
    false,
  );
  const [showSearchEngines, setShowSearchEngines] = useLocalStorage(
    SHOW_SEARCH_ENGINES_LOCAL_STORAGE_KEY,
    true,
  );
  const [showMonthView, setShowMonthView] = useLocalStorage(
    SHOW_MONTH_VIEW_LOCAL_STORAGE_KEY,
    false,
  );
  const [dockBarSites, setDockBarSites] = useState<DockBarSites>([]);

  const [dockPosition, setDockPosition] = useLocalStorage<DockPosition>(
    DOCK_POSITION_LOCAL_STORAGE_KEY,
    "bottom",
    (val) => {
      return dockPositionsList.includes(val || "");
    },
  );
  const [todoList, setTodoList] = useState<TodoList>([]);

  const [todoListVisbility, setTodoListVisbility] = useLocalStorage(
    TODO_DOCK_VISIBLE_LOCAL_STORAGE_KEY,
    true,
  );
  const [bookmarksVisible, setBookmarksVisible] = useLocalStorage(
    BOOKMARK_TOGGLE_STORAGE_KEY,
    false,
  );
  const [showStickyNotes, setShowStickyNotes] = useLocalStorage(
    SHOW_STICKY_NOTES_LOCAL_STORAGE_KEY,
    true,
  );

  const [showFocusMode, setShowFocusMode] = useLocalStorage(
    SHOW_FOCUS_MODE_LOCAL_STORAGE_KEY,
    true,
  );

  const [isWidgetsAwayFromDock, setIsWidgetsAwayFromDock] = useLocalStorage(
    CENTER_WIDGETS_AWAY_FROM_DOCK_STORAGE_KEY,
    false,
  );

  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [googleAuthToken, setGoogleAuthToken] = useState("");
  const [showGoogleCalendar, setShowGoogleCalendar] = useLocalStorage(
    SHOW_GOOGLE_CALENDAR_LOCAL_STORAGE_KEY,
    true,
  );

  const [useAnalogClock2, setUseAnalogClock2] = useLocalStorage(
    USE_ANALOG_CLOCK_2_LOCAL_STORAGE_KEY,
    false,
  );

  const [wallpaperType, setWallpaperType] = useLocalStorage(
    WALLPAPER_TYPE_LOCAL_STORAGE_KEY,
    "image",
  );

  const [dynamicWallpaperTheme, setDynamicWallpaperTheme] = useLocalStorage(
    DYNAMIC_WALLPAPER_THEME_LOCAL_STORAGE_KEY,
    "sunset",
    (val) => {
      return DynamicWallpaperThemes.some((item) => item.value === val);
    },
  );

  const [quickLinksMode, setQuickLinksMode] = useLocalStorage<QuickLinksMode>(
    QUICK_LINKS_MODE_LOCAL_STORAGE_KEY,
    "default",
    (val) => val === "default" || val === "custom",
  );

  const [quickLinks, setQuickLinks] = useState<QuickLinksSites>([]);

  const [interactiveWallpaperTheme, setInteractiveWallpaperTheme] =
    useLocalStorage(
      INTERACTIVE_WALLPAPER_THEME_LOCAL_STORAGE_KEY,
      "particles",
      (val) => {
        return InteractiveWallpaperThemes.some((item) => item.value === val);
      },
    );

  const [showWeather, setShowWeather] = useLocalStorage(
    SHOW_WEATHER_LOCAL_STORAGE_KEY,
    false,
  );

  const [weatherTempUnit, setWeatherTempUnit] = useLocalStorage(
    WEATHER_TEMP_UNIT_LOCAL_STORAGE_KEY,
    "celsius",
    (val) => val === "celsius" || val === "fahrenheit",
  );

  const [weatherLocationMode, setWeatherLocationMode] = useLocalStorage(
    WEATHER_LOCATION_MODE_LOCAL_STORAGE_KEY,
    "auto",
    (val) => val === "auto" || val === "manual",
  );

  const [weatherManualLocation, setWeatherManualLocation] = useLocalStorage<{
    latitude: number;
    longitude: number;
    name: string;
  } | null>(WEATHER_MANUAL_LOCATION_LOCAL_STORAGE_KEY, null);

  const [weatherData, setWeatherData] = useState<{
    temperature: number;
    weatherCode: number;
    isDay: boolean;
    windSpeed: number;
    cityName: string;
    latitude: number;
    longitude: number;
    timestamp: number;
  } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const fetchWeatherData = useCallback(
    async (lat: number, lon: number) => {
      try {
        const tempUnit =
          weatherTempUnit === "fahrenheit" ? "fahrenheit" : "celsius";
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=${tempUnit}&timezone=auto`,
        );
        const data = await response.json();

        if (!data.current_weather) {
          throw new Error("No weather data");
        }

        let cityName = "";
        try {
          const geoRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
          );
          const geoData = await geoRes.json();
          cityName = geoData.city || geoData.locality || "";
        } catch {
          // Ignore geocoding errors
        }

        const weather = {
          temperature: Math.round(data.current_weather.temperature),
          weatherCode: data.current_weather.weathercode,
          isDay: data.current_weather.is_day === 1,
          windSpeed: data.current_weather.windspeed,
          cityName,
          timestamp: Date.now(),
          latitude: lat,
          longitude: lon,
        };

        localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(weather));
        setWeatherData(weather);
        setWeatherError(null);
      } catch {
        setWeatherError("weather_unavailable");
      } finally {
        setWeatherLoading(false);
      }
    },
    [weatherTempUnit],
  );

  useEffect(() => {
    if (!showWeather) {
      setWeatherLoading(false);
      return;
    }

    // Try cache first
    try {
      const cached = localStorage.getItem(WEATHER_CACHE_KEY);
      if (cached) {
        const cachedData = JSON.parse(cached);
        const age = Date.now() - cachedData.timestamp;
        if (age < CACHE_DURATION) {
          setWeatherData(cachedData);
          setWeatherLoading(false);
          return;
        }
      }
    } catch {
      // ignore cache errors
    }

    // Fetch fresh data
    if (weatherLocationMode === "manual" && weatherManualLocation) {
      fetchWeatherData(
        weatherManualLocation.latitude,
        weatherManualLocation.longitude,
      );
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherData(position.coords.latitude, position.coords.longitude);
        },
        () => {
          setWeatherError("weather_location_denied");
          setWeatherLoading(false);
        },
        { timeout: 10000, maximumAge: CACHE_DURATION },
      );
    } else {
      setWeatherError("weather_unavailable");
      setWeatherLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWeather, weatherLocationMode, weatherManualLocation]);

  // Re-fetch when temperature unit changes
  useEffect(() => {
    if (weatherData?.latitude && weatherData?.longitude) {
      localStorage.removeItem(WEATHER_CACHE_KEY);
      fetchWeatherData(weatherData.latitude, weatherData.longitude);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weatherTempUnit]);

  const [calendarEvents, setCalendarEvents] = useLocalStorage(
    GOOGLE_CALENDAR_EVENTS_LOCAL_STORAGE_KEY,
    [] as GoogleCalendarEvent[],
    (val) => Array.isArray(val),
  );

  useEffect(() => {
    const getList = () => {
      const request = getLocalstorageDataWithPromise(
        TODO_LIST_LOCAL_STORAGE_KEY,
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
        const token = await getGoogleAuthToken(false);
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
      localStorage.getItem(WALLPAPER_BLUR_LOCAL_STORAGE_KEY) || "0",
    );

    setWallpaperBlur(
      !isNaN(wallpaperBlurValue) &&
        wallpaperBlurValue <= 50 &&
        wallpaperBlurValue >= 0
        ? wallpaperBlurValue
        : 0,
    );

    try {
      const storedQuickLinks = localStorage.getItem(
        QUICK_LINKS_LOCAL_STORAGE_KEY,
      );

      if (storedQuickLinks) {
        let parsedQuickLinks = JSON.parse(storedQuickLinks) as QuickLinksSites;

        parsedQuickLinks = parsedQuickLinks.map((item) => ({
          ...item,
          id: item.id || generateRandomId(),
        }));

        if (Array.isArray(parsedQuickLinks)) {
          setQuickLinks(parsedQuickLinks);
        }
      }
    } catch (_) {
      setQuickLinks([]);
    }

    try {
      const storedDockSites = localStorage.getItem(
        DOCK_SITES_LOCAL_STORAGE_KEY,
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
      TODO_LIST_UPDATED_DATE_LOCAL_STORAGE_KEY,
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
      formatedCurrentDate,
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

  const handleQuickLinksChange = (val: QuickLinksSites) => {
    localStorage.setItem(QUICK_LINKS_LOCAL_STORAGE_KEY, JSON.stringify(val));
    setQuickLinks(val);
  };

  const handleBookmarkVisbility = async (val: boolean) => {
    if (val) {
      const hasBookmarkPermission = await new Promise((resolve) =>
        chrome.permissions.contains({ permissions: ["bookmarks"] }, resolve),
      );

      if (!hasBookmarkPermission) {
        const permissionGranted = await new Promise((resolve) =>
          chrome.permissions.request({ permissions: ["bookmarks"] }, resolve),
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
      try {
        await chrome.identity.clearAllCachedAuthTokens();
      } catch (error) {}
      const token = await getGoogleAuthToken(true);
      const userProfile = await fetchGoogleUserProfile(token);

      setGoogleUser(userProfile);
      setGoogleAuthToken(token);

      localStorage.setItem(
        GOOGLE_USER_LOCAL_STORAGE_KEY,
        JSON.stringify(userProfile),
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
        showFocusMode,
        setShowFocusMode,
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
        useAnalogClock2,
        setUseAnalogClock2,
        wallpaperType,
        setWallpaperType,
        dynamicWallpaperTheme,
        setDynamicWallpaperTheme,
        interactiveWallpaperTheme,
        setInteractiveWallpaperTheme,
        quickLinksMode,
        setQuickLinksMode,
        quickLinks,
        handleQuickLinksChange,
        showWeather,
        setShowWeather,
        weatherTempUnit,
        setWeatherTempUnit,
        weatherLocationMode,
        setWeatherLocationMode,
        weatherManualLocation,
        setWeatherManualLocation,
        weatherData,
        weatherLoading,
        weatherError,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
