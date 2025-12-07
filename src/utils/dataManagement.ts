import {
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
import {
  DOCK_POSITION_LOCAL_STORAGE_KEY,
  DOCK_SITES_LOCAL_STORAGE_KEY,
} from "../static/dockSites";
import {
  TODO_DOCK_VISIBLE_LOCAL_STORAGE_KEY,
  TODO_LIST_LOCAL_STORAGE_KEY,
  TODO_LIST_UPDATED_DATE_LOCAL_STORAGE_KEY,
} from "../static/todo";
import { WALLPAPER_BLUR_LOCAL_STORAGE_KEY } from "../static/wallpapers";
import { SHOW_STICKY_NOTES_LOCAL_STORAGE_KEY } from "../static/stickyNotes";
import {
  GOOGLE_USER_LOCAL_STORAGE_KEY,
  SHOW_GOOGLE_CALENDAR_LOCAL_STORAGE_KEY,
} from "../static/googleSettings";

const STICKY_NOTES_KEY = "macnewtab_sticky_notes";

const KEYS_TO_EXPORT = [
  THEME_LOCAL_STORAGE_KEY,
  THEME_COLOR_LOCAL_STORAGE_KEY,
  CENTER_WIDGETS_AWAY_FROM_DOCK_STORAGE_KEY,
  SEPARATE_PAGE_LINKS_LOCAL_STORAGE_KEY,
  SHOW_CLOCK_AND_CALENDAR_LOCAL_STORAGE_KEY,
  SHOW_GREETING_LOCAL_STORAGE_KEY,
  SHOW_MONTH_VIEW_LOCAL_STORAGE_KEY,
  SHOW_SEARCH_ENGINES_LOCAL_STORAGE_KEY,
  SHOW_TAB_MANAGER_LOCAL_STORAGE_KEY,
  SHOW_VISITED_SITE_LOCAL_STORAGE_KEY,
  BOOKMARK_TOGGLE_STORAGE_KEY,
  SELECTED_LOCALE_LOCAL_STORAGE_KEY,
  DOCK_POSITION_LOCAL_STORAGE_KEY,
  DOCK_SITES_LOCAL_STORAGE_KEY,
  TODO_DOCK_VISIBLE_LOCAL_STORAGE_KEY,
  TODO_LIST_LOCAL_STORAGE_KEY,
  TODO_LIST_UPDATED_DATE_LOCAL_STORAGE_KEY,
  WALLPAPER_BLUR_LOCAL_STORAGE_KEY,
  SHOW_STICKY_NOTES_LOCAL_STORAGE_KEY,
  GOOGLE_USER_LOCAL_STORAGE_KEY,
  SHOW_GOOGLE_CALENDAR_LOCAL_STORAGE_KEY,
  STICKY_NOTES_KEY,
];

export const exportData = () => {
  const data: Record<string, any> = {};
  KEYS_TO_EXPORT.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value !== null) {
      try {
        data[key] = JSON.parse(value);
      } catch {
        data[key] = value;
      }
    }
  });

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "macnewtab-backup.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importData = (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const data = JSON.parse(result);

        if (typeof data !== "object" || data === null) {
          throw new Error("Invalid data format");
        }

        KEYS_TO_EXPORT.forEach((key) => {
          if (data[key] !== undefined) {
            const value = data[key];
            if (typeof value === "object") {
              localStorage.setItem(key, JSON.stringify(value));
            } else {
              localStorage.setItem(key, String(value));
            }
          }
        });

        resolve();
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};
