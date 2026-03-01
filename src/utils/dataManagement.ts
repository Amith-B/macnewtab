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
  USE_ANALOG_CLOCK_2_LOCAL_STORAGE_KEY,
} from "../static/generalSettings";
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
  fetchImageFromIndexedDB,
  saveImageToIndexedDB,
} from "../utils/db";
import {
  WALLPAPER_TYPE_LOCAL_STORAGE_KEY,
  DYNAMIC_WALLPAPER_THEME_LOCAL_STORAGE_KEY,
} from "../static/dynamicWallpaper";
import { INTERACTIVE_WALLPAPER_THEME_LOCAL_STORAGE_KEY } from "../static/interactiveThemes";
import {
  SHOW_WEATHER_LOCAL_STORAGE_KEY,
  WEATHER_TEMP_UNIT_LOCAL_STORAGE_KEY,
  WEATHER_LOCATION_LOCAL_STORAGE_KEY,
  WEATHER_LOCATION_MODE_LOCAL_STORAGE_KEY,
  WEATHER_MANUAL_LOCATION_LOCAL_STORAGE_KEY,
} from "../static/weatherSettings";
import {
  QUICK_LINKS_MODE_LOCAL_STORAGE_KEY,
  QUICK_LINKS_LOCAL_STORAGE_KEY,
} from "../static/quickLinksSettings";
import { syncNotesToChrome, Note } from "./stickyNotesSync";

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
  SELECTED_LOCALE_LOCAL_STORAGE_KEY,
  DOCK_POSITION_LOCAL_STORAGE_KEY,
  DOCK_SITES_LOCAL_STORAGE_KEY,
  TODO_DOCK_VISIBLE_LOCAL_STORAGE_KEY,
  TODO_LIST_LOCAL_STORAGE_KEY,
  TODO_LIST_UPDATED_DATE_LOCAL_STORAGE_KEY,
  WALLPAPER_BLUR_LOCAL_STORAGE_KEY,
  SHOW_STICKY_NOTES_LOCAL_STORAGE_KEY,
  STICKY_NOTES_KEY,
  USE_ANALOG_CLOCK_2_LOCAL_STORAGE_KEY,
  WALLPAPER_TYPE_LOCAL_STORAGE_KEY,
  DYNAMIC_WALLPAPER_THEME_LOCAL_STORAGE_KEY,
  INTERACTIVE_WALLPAPER_THEME_LOCAL_STORAGE_KEY,
  SHOW_WEATHER_LOCAL_STORAGE_KEY,
  WEATHER_TEMP_UNIT_LOCAL_STORAGE_KEY,
  WEATHER_LOCATION_LOCAL_STORAGE_KEY,
  WEATHER_LOCATION_MODE_LOCAL_STORAGE_KEY,
  WEATHER_MANUAL_LOCATION_LOCAL_STORAGE_KEY,
  QUICK_LINKS_MODE_LOCAL_STORAGE_KEY,
  QUICK_LINKS_LOCAL_STORAGE_KEY,
];

// Helper to convert Blob URL to Base64
const convertBlobUrlToBase64 = async (blobUrl: string): Promise<string> => {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const exportData = async () => {
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

  try {
    // Export Wallpaper
    const wallpaper = await fetchImageFromIndexedDB();
    if (wallpaper) {
      if (wallpaper.startsWith("blob:")) {
        data["wallpaper_image"] = await convertBlobUrlToBase64(wallpaper);
      } else {
        data["wallpaper_image"] = wallpaper;
      }
    }

    // Export Custom Dock Icons
    const dockSitesString = localStorage.getItem(DOCK_SITES_LOCAL_STORAGE_KEY);
    if (dockSitesString) {
      const dockSites = JSON.parse(dockSitesString);
      const dockIcons: Record<string, string> = {};

      for (const site of dockSites) {
        if (site.hasCustomIcon) {
          const iconId = `dock_icon_${site.id}`;
          const iconData = await fetchImageFromIndexedDB(iconId);
          if (iconData) {
            if (iconData.startsWith("blob:")) {
              dockIcons[iconId] = await convertBlobUrlToBase64(iconData);
            } else {
              dockIcons[iconId] = iconData;
            }
          }
        }
      }

      if (Object.keys(dockIcons).length > 0) {
        data["dock_icons"] = dockIcons;
      }
    }

    // Export Custom Quick Link Icons
    const quickLinksString = localStorage.getItem(QUICK_LINKS_LOCAL_STORAGE_KEY);
    if (quickLinksString) {
      const quickLinksList = JSON.parse(quickLinksString);
      const quickLinkIcons: Record<string, string> = {};

      for (const link of quickLinksList) {
        if (link.hasCustomIcon) {
          const iconId = `quick_link_icon_${link.id}`;
          const iconData = await fetchImageFromIndexedDB(iconId);
          if (iconData) {
            if (iconData.startsWith("blob:")) {
              quickLinkIcons[iconId] = await convertBlobUrlToBase64(iconData);
            } else {
              quickLinkIcons[iconId] = iconData;
            }
          }
        }
      }

      if (Object.keys(quickLinkIcons).length > 0) {
        data["quick_link_icons"] = quickLinkIcons;
      }
    }
  } catch (error) {
    console.error("Failed to export data:", error);
  }

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
    reader.onload = async (e) => {
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

        // Import Wallpaper
        if (data["wallpaper_image"]) {
          try {
            await saveImageToIndexedDB(data["wallpaper_image"]);
          } catch (error) {
            console.error("Failed to import wallpaper:", error);
          }
        }

        // Import Custom Dock Icons
        if (data["dock_icons"]) {
          try {
            const dockIcons = data["dock_icons"] as Record<string, string>;
            for (const [id, base64] of Object.entries(dockIcons)) {
              await saveImageToIndexedDB(base64, id);
            }
          } catch (error) {
            console.error("Failed to import dock icons:", error);
          }
        }

        // Import Custom Quick Link Icons
        if (data["quick_link_icons"]) {
          try {
            const quickLinkIcons = data["quick_link_icons"] as Record<string, string>;
            for (const [id, base64] of Object.entries(quickLinkIcons)) {
              await saveImageToIndexedDB(base64, id);
            }
          } catch (error) {
            console.error("Failed to import quick link icons:", error);
          }
        }

        // Sync imported sticky notes to chrome.storage.sync
        if (data[STICKY_NOTES_KEY]) {
          try {
            const importedNotes: Note[] = Array.isArray(data[STICKY_NOTES_KEY])
              ? data[STICKY_NOTES_KEY]
              : JSON.parse(data[STICKY_NOTES_KEY]);
            syncNotesToChrome(importedNotes);
          } catch (error) {
            console.error("Failed to sync imported sticky notes:", error);
          }
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};
