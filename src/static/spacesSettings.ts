import {
  SHOW_GREETING_LOCAL_STORAGE_KEY,
  SHOW_VISITED_SITE_LOCAL_STORAGE_KEY,
  SEPARATE_PAGE_LINKS_LOCAL_STORAGE_KEY,
  SHOW_SEARCH_ENGINES_LOCAL_STORAGE_KEY,
  SHOW_MONTH_VIEW_LOCAL_STORAGE_KEY,
  SHOW_CLOCK_AND_CALENDAR_LOCAL_STORAGE_KEY,
  SHOW_TAB_MANAGER_LOCAL_STORAGE_KEY,
  CENTER_WIDGETS_AWAY_FROM_DOCK_STORAGE_KEY,
  USE_ANALOG_CLOCK_2_LOCAL_STORAGE_KEY,
  SHOW_FOCUS_MODE_LOCAL_STORAGE_KEY,
  SHOW_BATTERY_LOCAL_STORAGE_KEY,
  SHOW_FREEFORM_LOCAL_STORAGE_KEY,
} from "./generalSettings";
import {
  THEME_LOCAL_STORAGE_KEY,
  THEME_COLOR_LOCAL_STORAGE_KEY,
} from "./theme";
import { WALLPAPER_BLUR_LOCAL_STORAGE_KEY } from "./wallpapers";
import {
  WALLPAPER_TYPE_LOCAL_STORAGE_KEY,
  DYNAMIC_WALLPAPER_THEME_LOCAL_STORAGE_KEY,
} from "./dynamicWallpaper";
import { INTERACTIVE_WALLPAPER_THEME_LOCAL_STORAGE_KEY } from "./interactiveThemes";
import {
  DOCK_SITES_LOCAL_STORAGE_KEY,
  DOCK_POSITION_LOCAL_STORAGE_KEY,
} from "./dockSites";
import {
  TODO_DOCK_VISIBLE_LOCAL_STORAGE_KEY,
  TODO_LIST_LOCAL_STORAGE_KEY,
  TODO_LIST_UPDATED_DATE_LOCAL_STORAGE_KEY,
} from "./todo";
import {
  SHOW_STICKY_NOTES_LOCAL_STORAGE_KEY,
  ENABLE_STICKY_NOTES_SYNC_LOCAL_STORAGE_KEY,
} from "./stickyNotes";
import {
  SHOW_WEATHER_LOCAL_STORAGE_KEY,
  WEATHER_TEMP_UNIT_LOCAL_STORAGE_KEY,
  WEATHER_LOCATION_MODE_LOCAL_STORAGE_KEY,
  WEATHER_MANUAL_LOCATION_LOCAL_STORAGE_KEY,
} from "./weatherSettings";
import {
  QUICK_LINKS_MODE_LOCAL_STORAGE_KEY,
  QUICK_LINKS_LOCAL_STORAGE_KEY,
} from "./quickLinksSettings";
import { BOOKMARK_TOGGLE_STORAGE_KEY } from "./bookmarks";
import {
  FREEFORM_DATA_LOCAL_STORAGE_KEY,
  SHOW_FREEFORM_LOCAL_STORAGE_KEY as FREEFORM_SHOW_KEY,
} from "./freeformSettings";

// ─── LocalStorage key for Spaces configuration ───
export const SPACES_CONFIG_KEY = "macnewtab_spaces_config";

// ─── Sticky notes data key (not exported from a static file) ───
const STICKY_NOTES_DATA_KEY = "macnewtab_sticky_notes";

// ─── Weather cache key ───
const WEATHER_CACHE_KEY = "macnewtab_weather_cache";

// ─── Types ───
export interface SpaceTimeRange {
  startHour: number; // 0-23
  startMinute: number; // 0-59
  endHour: number; // 0-23
  endMinute: number; // 0-59
}

export interface Space {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  isTimeSensitive: boolean;
  timeRange?: SpaceTimeRange;
}

export interface SpacesConfig {
  spaces: Space[];
  activeSpaceId: string;
  timeSensitiveEnabled: boolean;
}

// ─── Default colors for space indicators (macOS-inspired) ───
export const DEFAULT_SPACE_COLORS = [
  "#007AFF", // blue
  "#34C759", // green
  "#FF9500", // orange
  "#FF3B30", // red
  "#AF52DE", // purple
  "#5856D6", // indigo
  "#FF2D55", // pink
  "#00C7BE", // teal
  "#FFD60A", // yellow
  "#8E8E93", // gray
];

// ─── Per-space localStorage keys ───
// These keys are isolated per space. The active space uses the flat key,
// inactive spaces store under "space_{id}__{key}".
export const PER_SPACE_KEYS: string[] = [
  // Theme
  THEME_LOCAL_STORAGE_KEY, // "default_theme"
  THEME_COLOR_LOCAL_STORAGE_KEY, // "theme_color"

  // Wallpaper
  WALLPAPER_BLUR_LOCAL_STORAGE_KEY, // "wallpaper_blur"
  WALLPAPER_TYPE_LOCAL_STORAGE_KEY, // "wallpaper_type"
  DYNAMIC_WALLPAPER_THEME_LOCAL_STORAGE_KEY, // "dynamic_wallpaper_theme"
  INTERACTIVE_WALLPAPER_THEME_LOCAL_STORAGE_KEY, // "interactive_wallpaper_theme"

  // General toggles
  SHOW_GREETING_LOCAL_STORAGE_KEY, // "show_greeting"
  SHOW_VISITED_SITE_LOCAL_STORAGE_KEY, // "show_visited_site"
  SEPARATE_PAGE_LINKS_LOCAL_STORAGE_KEY, // "separate_page_links"
  SHOW_SEARCH_ENGINES_LOCAL_STORAGE_KEY, // "show_search_engines"
  SHOW_MONTH_VIEW_LOCAL_STORAGE_KEY, // "show_month_view"
  SHOW_CLOCK_AND_CALENDAR_LOCAL_STORAGE_KEY, // "show_clock_and_calendar"
  SHOW_TAB_MANAGER_LOCAL_STORAGE_KEY, // "show_tab_manager"
  CENTER_WIDGETS_AWAY_FROM_DOCK_STORAGE_KEY, // "center_widgets_away_from_dock"
  USE_ANALOG_CLOCK_2_LOCAL_STORAGE_KEY, // "use_analog_clock_2"
  SHOW_FOCUS_MODE_LOCAL_STORAGE_KEY, // "show_focus_mode"
  SHOW_BATTERY_LOCAL_STORAGE_KEY, // "show_battery"
  SHOW_FREEFORM_LOCAL_STORAGE_KEY, // "show_freeform" (from generalSettings)
  FREEFORM_SHOW_KEY, // "macnewtab_show_freeform" (from freeformSettings)

  // Dock
  DOCK_SITES_LOCAL_STORAGE_KEY, // "dock_sites"
  DOCK_POSITION_LOCAL_STORAGE_KEY, // "dock_position"

  // Todo
  TODO_DOCK_VISIBLE_LOCAL_STORAGE_KEY, // "todo_dock_visible"
  TODO_LIST_LOCAL_STORAGE_KEY, // "todo_list"
  TODO_LIST_UPDATED_DATE_LOCAL_STORAGE_KEY, // "todo_list_updated_date"

  // Sticky Notes
  SHOW_STICKY_NOTES_LOCAL_STORAGE_KEY, // "show_sticky_notes"
  ENABLE_STICKY_NOTES_SYNC_LOCAL_STORAGE_KEY, // "enable_sticky_notes_sync"
  STICKY_NOTES_DATA_KEY, // "macnewtab_sticky_notes"

  // Weather
  SHOW_WEATHER_LOCAL_STORAGE_KEY, // "show_weather"
  WEATHER_TEMP_UNIT_LOCAL_STORAGE_KEY, // "weather_temp_unit"
  WEATHER_LOCATION_MODE_LOCAL_STORAGE_KEY, // "macnewtab_weather_location_mode"
  WEATHER_MANUAL_LOCATION_LOCAL_STORAGE_KEY, // "macnewtab_weather_manual_location"
  WEATHER_CACHE_KEY, // "macnewtab_weather_cache"

  // Quick Links
  QUICK_LINKS_MODE_LOCAL_STORAGE_KEY, // "quick_links_mode"
  QUICK_LINKS_LOCAL_STORAGE_KEY, // "quick_links"

  // Bookmarks
  BOOKMARK_TOGGLE_STORAGE_KEY, // "bookmarks_visible"

  // Freeform data
  FREEFORM_DATA_LOCAL_STORAGE_KEY, // "macnewtab_freeform_data"
];

// ─── Helpers ───

/** Returns the prefixed key for storing an inactive space's data */
export function getSpacePrefixedKey(spaceId: string, key: string): string {
  return `space_${spaceId}__${key}`;
}
