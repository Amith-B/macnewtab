import {
  SpacesConfig,
  Space,
  SpaceTimeRange,
  SPACES_CONFIG_KEY,
  PER_SPACE_KEYS,
  DEFAULT_SPACE_COLORS,
  getSpacePrefixedKey,
} from "../static/spacesSettings";
import { generateRandomId } from "./random";
import {
  saveImageToIndexedDB,
  fetchImageFromIndexedDB,
  deleteImageFromIndexedDB,
} from "./db";
import { DOCK_SITES_LOCAL_STORAGE_KEY } from "../static/dockSites";
import { QUICK_LINKS_LOCAL_STORAGE_KEY } from "../static/quickLinksSettings";

// ─── Config Management ───

/** Load SpacesConfig from localStorage. Returns null if Spaces is not enabled. */
export function loadSpacesConfig(): SpacesConfig | null {
  try {
    const raw = localStorage.getItem(SPACES_CONFIG_KEY);
    if (!raw) return null;
    const config = JSON.parse(raw) as SpacesConfig;
    if (
      config &&
      Array.isArray(config.spaces) &&
      config.spaces.length > 0 &&
      config.activeSpaceId
    ) {
      return config;
    }
    return null;
  } catch {
    return null;
  }
}

/** Save SpacesConfig to localStorage */
export function saveSpacesConfig(config: SpacesConfig): void {
  localStorage.setItem(SPACES_CONFIG_KEY, JSON.stringify(config));
}

// ─── Space Lifecycle ───

/**
 * Enable Spaces for the first time.
 * Creates a "Default" space from the current flat keys (no data movement).
 * Returns the new SpacesConfig.
 */
export function enableSpaces(defaultName: string): SpacesConfig {
  const defaultSpace: Space = {
    id: generateRandomId(),
    name: defaultName,
    color: DEFAULT_SPACE_COLORS[0],
    createdAt: Date.now(),
    isTimeSensitive: false,
  };

  const config: SpacesConfig = {
    spaces: [defaultSpace],
    activeSpaceId: defaultSpace.id,
    timeSensitiveEnabled: false,
  };

  saveSpacesConfig(config);
  return config;
}

/**
 * Create a new space with factory-default settings.
 * Writes default values under the space's prefixed keys in localStorage.
 * Returns the new Space object.
 */
export function createNewSpace(name: string, color: string): Space {
  const space: Space = {
    id: generateRandomId(),
    name,
    color,
    createdAt: Date.now(),
    isTimeSensitive: false,
  };

  // Write factory defaults for the new space under prefixed keys.
  // We don't set any keys — the absence of a key means "use default".
  // The provider's useLocalStorage hook already handles defaults when
  // no value is found. So we just need to ensure no stale prefixed keys exist.

  return space;
}

/**
 * Delete a space and clean up all its prefixed localStorage and IndexedDB entries.
 * Cannot delete the currently active space.
 */
export async function deleteSpace(
  spaceId: string,
  config: SpacesConfig
): Promise<SpacesConfig> {
  // Remove all prefixed localStorage keys for this space
  const prefix = `space_${spaceId}__`;
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));

  // Remove IndexedDB entries for this space
  await cleanupIndexedDBForSpace(spaceId);

  // Update config
  const updatedSpaces = config.spaces.filter((s) => s.id !== spaceId);
  const updatedConfig: SpacesConfig = {
    ...config,
    spaces: updatedSpaces,
  };

  saveSpacesConfig(updatedConfig);
  return updatedConfig;
}

// ─── Space Switching ───

/**
 * Switch from the current active space to a target space.
 * 1. Save all flat per-space keys → prefixed backup for current space
 * 2. Load target space's prefixed keys → flat keys
 * 3. Remove target space's prefixed keys (they now live as flat keys)
 * 4. Handle IndexedDB (wallpaper, dock icons, quick link icons)
 * 5. Update config
 */
export async function switchToSpace(
  targetSpaceId: string,
  config: SpacesConfig
): Promise<void> {
  const currentSpaceId = config.activeSpaceId;

  if (currentSpaceId === targetSpaceId) return;

  // 1. Save current flat keys → prefixed backup for current space
  for (const key of PER_SPACE_KEYS) {
    const value = localStorage.getItem(key);
    if (value !== null) {
      localStorage.setItem(
        getSpacePrefixedKey(currentSpaceId, key),
        value
      );
    }
  }

  // 2. Save current IndexedDB images → prefixed for current space
  await backupIndexedDBForSpace(currentSpaceId);

  // 3. Load target space's prefixed keys → flat keys
  for (const key of PER_SPACE_KEYS) {
    const prefixedKey = getSpacePrefixedKey(targetSpaceId, key);
    const value = localStorage.getItem(prefixedKey);
    if (value !== null) {
      localStorage.setItem(key, value);
      localStorage.removeItem(prefixedKey); // cleanup prefix copy
    } else {
      // No value stored for this key in the target space → remove flat key
      // so the provider falls back to its default value
      localStorage.removeItem(key);
    }
  }

  // 4. Restore target space's IndexedDB images → flat IDs
  await restoreIndexedDBForSpace(targetSpaceId);

  // 5. Update config
  const updatedConfig: SpacesConfig = {
    ...config,
    activeSpaceId: targetSpaceId,
  };
  saveSpacesConfig(updatedConfig);
}

/**
 * Synchronous version of switchToSpace — only swaps localStorage keys.
 * Does NOT touch IndexedDB (wallpaper/icons backup/restore happens async later).
 *
 * Use this when you need the swap to complete before any React children mount,
 * e.g. during Provider state initialization for time-sensitive auto-switch.
 */
export function switchToSpaceSync(
  targetSpaceId: string,
  config: SpacesConfig
): void {
  const currentSpaceId = config.activeSpaceId;
  if (currentSpaceId === targetSpaceId) return;

  // 1. Save current flat keys → prefixed backup for current space
  for (const key of PER_SPACE_KEYS) {
    const value = localStorage.getItem(key);
    if (value !== null) {
      localStorage.setItem(
        getSpacePrefixedKey(currentSpaceId, key),
        value
      );
    }
  }

  // 2. Load target space's prefixed keys → flat keys
  for (const key of PER_SPACE_KEYS) {
    const prefixedKey = getSpacePrefixedKey(targetSpaceId, key);
    const value = localStorage.getItem(prefixedKey);
    if (value !== null) {
      localStorage.setItem(key, value);
      localStorage.removeItem(prefixedKey);
    } else {
      localStorage.removeItem(key);
    }
  }

  // 3. Update config
  const updatedConfig: SpacesConfig = {
    ...config,
    activeSpaceId: targetSpaceId,
  };
  saveSpacesConfig(updatedConfig);
}

export interface SpaceInitResult {
  config: SpacesConfig | null;
  /** If a time-based swap was performed, the space ID we swapped FROM */
  swappedFromSpaceId: string | null;
  /** If a time-based swap was performed, the space ID we swapped TO */
  swappedToSpaceId: string | null;
}

/**
 * Check if a time-sensitive space switch is needed and perform it synchronously.
 * Call this during Provider initialization (in useState initializer) so that
 * by the time children mount, the flat localStorage keys already contain
 * the correct space's data.
 *
 * Returns the config + info about whether an auto-swap occurred (so the caller
 * can perform the async IndexedDB backup/restore in a useEffect).
 */
export function initializeSpaceForCurrentTime(): SpaceInitResult {
  const config = loadSpacesConfig();
  if (!config?.timeSensitiveEnabled) {
    return { config, swappedFromSpaceId: null, swappedToSpaceId: null };
  }

  const targetId = getTimeBasedActiveSpace(config.spaces);
  if (targetId && targetId !== config.activeSpaceId) {
    const previousSpaceId = config.activeSpaceId;
    // Perform synchronous localStorage swap
    switchToSpaceSync(targetId, config);
    // Re-read the updated config (activeSpaceId has changed)
    const updatedConfig = loadSpacesConfig();
    return {
      config: updatedConfig,
      swappedFromSpaceId: previousSpaceId,
      swappedToSpaceId: targetId,
    };
  }

  return { config, swappedFromSpaceId: null, swappedToSpaceId: null };
}

/**
 * Complete the IndexedDB portion of a space switch (backup old space's images,
 * restore new space's images). Call this after switchToSpaceSync to handle
 * wallpaper and custom icons.
 */
export async function completeIndexedDBSwap(
  fromSpaceId: string,
  toSpaceId: string
): Promise<void> {
  await backupIndexedDBForSpace(fromSpaceId);
  await restoreIndexedDBForSpace(toSpaceId);
}

// ─── IndexedDB Helpers ───

/** Get all dock site IDs that have custom icons from localStorage */
function getDockIconIds(): string[] {
  try {
    const dockSitesStr = localStorage.getItem(DOCK_SITES_LOCAL_STORAGE_KEY);
    if (!dockSitesStr) return [];
    const dockSites = JSON.parse(dockSitesStr);
    if (!Array.isArray(dockSites)) return [];
    return dockSites
      .filter((site: any) => site.hasCustomIcon)
      .map((site: any) => `dock_icon_${site.id}`);
  } catch {
    return [];
  }
}

/** Get all quick link IDs that have custom icons from localStorage */
function getQuickLinkIconIds(): string[] {
  try {
    const linksStr = localStorage.getItem(QUICK_LINKS_LOCAL_STORAGE_KEY);
    if (!linksStr) return [];
    const links = JSON.parse(linksStr);
    if (!Array.isArray(links)) return [];
    return links
      .filter((link: any) => link.hasCustomIcon)
      .map((link: any) => `quick_link_icon_${link.id}`);
  } catch {
    return [];
  }
}

/** Convert a blob URL to a base64 data URL */
async function blobUrlToBase64(blobUrl: string): Promise<string> {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Backup the current flat IndexedDB images into prefixed entries for the given space.
 * Covers: customWallpaper, dock icons, quick link icons
 */
async function backupIndexedDBForSpace(spaceId: string): Promise<void> {
  try {
    // Backup wallpaper
    const wallpaper = await fetchImageFromIndexedDB("customWallpaper");
    if (wallpaper) {
      const base64 = wallpaper.startsWith("blob:")
        ? await blobUrlToBase64(wallpaper)
        : wallpaper;
      await saveImageToIndexedDB(
        base64,
        `space_${spaceId}__customWallpaper`
      );
    }

    // Backup dock icons
    const dockIconIds = getDockIconIds();
    for (const iconId of dockIconIds) {
      const iconData = await fetchImageFromIndexedDB(iconId);
      if (iconData) {
        const base64 = iconData.startsWith("blob:")
          ? await blobUrlToBase64(iconData)
          : iconData;
        await saveImageToIndexedDB(
          base64,
          `space_${spaceId}__${iconId}`
        );
      }
    }

    // Backup quick link icons
    const quickLinkIconIds = getQuickLinkIconIds();
    for (const iconId of quickLinkIconIds) {
      const iconData = await fetchImageFromIndexedDB(iconId);
      if (iconData) {
        const base64 = iconData.startsWith("blob:")
          ? await blobUrlToBase64(iconData)
          : iconData;
        await saveImageToIndexedDB(
          base64,
          `space_${spaceId}__${iconId}`
        );
      }
    }
  } catch (error) {
    console.error("Failed to backup IndexedDB for space:", error);
  }
}

/**
 * Restore a space's prefixed IndexedDB entries into the flat IDs.
 * Then remove the prefixed entries.
 */
async function restoreIndexedDBForSpace(spaceId: string): Promise<void> {
  try {
    // Delete current flat wallpaper first
    await deleteImageFromIndexedDB("customWallpaper");

    // Restore wallpaper from space backup
    const prefixedWallpaperId = `space_${spaceId}__customWallpaper`;
    const wallpaper = await fetchImageFromIndexedDB(prefixedWallpaperId);
    if (wallpaper) {
      const base64 = wallpaper.startsWith("blob:")
        ? await blobUrlToBase64(wallpaper)
        : wallpaper;
      await saveImageToIndexedDB(base64, "customWallpaper");
      await deleteImageFromIndexedDB(prefixedWallpaperId);
    }

    // Restore dock icons — read from the TARGET space's prefixed dock_sites
    // to know which icons to restore
    const targetDockSitesKey = getSpacePrefixedKey(
      spaceId,
      DOCK_SITES_LOCAL_STORAGE_KEY
    );
    const targetDockStr =
      localStorage.getItem(DOCK_SITES_LOCAL_STORAGE_KEY) ||
      localStorage.getItem(targetDockSitesKey);
    if (targetDockStr) {
      try {
        const dockSites = JSON.parse(targetDockStr);
        if (Array.isArray(dockSites)) {
          for (const site of dockSites) {
            if (site.hasCustomIcon) {
              const flatId = `dock_icon_${site.id}`;
              const prefixedId = `space_${spaceId}__${flatId}`;
              const iconData = await fetchImageFromIndexedDB(prefixedId);
              if (iconData) {
                const base64 = iconData.startsWith("blob:")
                  ? await blobUrlToBase64(iconData)
                  : iconData;
                await saveImageToIndexedDB(base64, flatId);
                await deleteImageFromIndexedDB(prefixedId);
              }
            }
          }
        }
      } catch {
        // ignore parse errors
      }
    }

    // Restore quick link icons
    const targetLinksKey = getSpacePrefixedKey(
      spaceId,
      QUICK_LINKS_LOCAL_STORAGE_KEY
    );
    const targetLinksStr =
      localStorage.getItem(QUICK_LINKS_LOCAL_STORAGE_KEY) ||
      localStorage.getItem(targetLinksKey);
    if (targetLinksStr) {
      try {
        const links = JSON.parse(targetLinksStr);
        if (Array.isArray(links)) {
          for (const link of links) {
            if (link.hasCustomIcon) {
              const flatId = `quick_link_icon_${link.id}`;
              const prefixedId = `space_${spaceId}__${flatId}`;
              const iconData = await fetchImageFromIndexedDB(prefixedId);
              if (iconData) {
                const base64 = iconData.startsWith("blob:")
                  ? await blobUrlToBase64(iconData)
                  : iconData;
                await saveImageToIndexedDB(base64, flatId);
                await deleteImageFromIndexedDB(prefixedId);
              }
            }
          }
        }
      } catch {
        // ignore parse errors
      }
    }
  } catch (error) {
    console.error("Failed to restore IndexedDB for space:", error);
  }
}

/**
 * Remove all IndexedDB entries associated with a space (when deleting it).
 */
async function cleanupIndexedDBForSpace(spaceId: string): Promise<void> {
  try {
    // Delete wallpaper
    await deleteImageFromIndexedDB(`space_${spaceId}__customWallpaper`);

    // We can't enumerate IndexedDB easily, but we can try to delete
    // based on the space's dock sites and quick links stored in localStorage
    const prefix = `space_${spaceId}__`;

    // Check for dock icon keys in localStorage that might reference IndexedDB
    const dockSitesKey = getSpacePrefixedKey(
      spaceId,
      DOCK_SITES_LOCAL_STORAGE_KEY
    );
    const dockStr = localStorage.getItem(dockSitesKey);
    if (dockStr) {
      try {
        const sites = JSON.parse(dockStr);
        if (Array.isArray(sites)) {
          for (const site of sites) {
            if (site.hasCustomIcon) {
              await deleteImageFromIndexedDB(
                `${prefix}dock_icon_${site.id}`
              );
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // Check for quick link icon keys
    const linksKey = getSpacePrefixedKey(
      spaceId,
      QUICK_LINKS_LOCAL_STORAGE_KEY
    );
    const linksStr = localStorage.getItem(linksKey);
    if (linksStr) {
      try {
        const links = JSON.parse(linksStr);
        if (Array.isArray(links)) {
          for (const link of links) {
            if (link.hasCustomIcon) {
              await deleteImageFromIndexedDB(
                `${prefix}quick_link_icon_${link.id}`
              );
            }
          }
        }
      } catch {
        // ignore
      }
    }
  } catch (error) {
    console.error("Failed to cleanup IndexedDB for space:", error);
  }
}

// ─── Time-Sensitive Logic ───

/** Check if a given time falls within a time range (handles midnight crossing) */
export function isTimeInRange(
  hour: number,
  minute: number,
  range: SpaceTimeRange
): boolean {
  const current = hour * 60 + minute;
  const start = range.startHour * 60 + range.startMinute;
  const end = range.endHour * 60 + range.endMinute;

  if (start <= end) {
    // Normal range (e.g., 09:00 → 17:00)
    return current >= start && current < end;
  } else {
    // Crosses midnight (e.g., 22:00 → 06:00)
    return current >= start || current < end;
  }
}

/**
 * Determine which space should be active based on the current time.
 * Only considers spaces that have isTimeSensitive=true and a valid timeRange.
 * Returns the matching space ID, or null if no match.
 */
export function getTimeBasedActiveSpace(
  spaces: Space[]
): string | null {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  for (const space of spaces) {
    if (space.isTimeSensitive && space.timeRange) {
      if (isTimeInRange(currentHour, currentMinute, space.timeRange)) {
        return space.id;
      }
    }
  }

  return null;
}

/**
 * Validate that no time ranges overlap between spaces.
 * Returns an object with the validation result and any conflicting space ID pairs.
 */
export function validateTimeRanges(
  spaces: Space[]
): { valid: boolean; conflicts: Array<[string, string]> } {
  const timeSensitiveSpaces = spaces.filter(
    (s) => s.isTimeSensitive && s.timeRange
  );

  const conflicts: Array<[string, string]> = [];

  for (let i = 0; i < timeSensitiveSpaces.length; i++) {
    for (let j = i + 1; j < timeSensitiveSpaces.length; j++) {
      const a = timeSensitiveSpaces[i];
      const b = timeSensitiveSpaces[j];

      if (doTimeRangesOverlap(a.timeRange!, b.timeRange!)) {
        conflicts.push([a.id, b.id]);
      }
    }
  }

  return { valid: conflicts.length === 0, conflicts };
}

/** Check if two time ranges overlap */
function doTimeRangesOverlap(
  a: SpaceTimeRange,
  b: SpaceTimeRange
): boolean {
  // Convert to minute-based intervals and check overlap
  // For ranges that cross midnight, split into two intervals

  const aIntervals = getMinuteIntervals(a);
  const bIntervals = getMinuteIntervals(b);

  for (const ai of aIntervals) {
    for (const bi of bIntervals) {
      if (ai.start < bi.end && bi.start < ai.end) {
        return true;
      }
    }
  }

  return false;
}

/** Convert a time range to one or two non-wrapping minute intervals */
function getMinuteIntervals(
  range: SpaceTimeRange
): Array<{ start: number; end: number }> {
  const start = range.startHour * 60 + range.startMinute;
  const end = range.endHour * 60 + range.endMinute;

  if (start < end) {
    return [{ start, end }];
  } else if (start > end) {
    // Crosses midnight: split into [start, 1440) and [0, end)
    return [
      { start, end: 24 * 60 },
      { start: 0, end },
    ];
  } else {
    // start === end means full 24 hours
    return [{ start: 0, end: 24 * 60 }];
  }
}

/** Format a time value (hour, minute) to HH:MM string */
export function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Format a time value (hour, minute) to 12-hour AM/PM display string */
export function formatTimeDisplay(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

/** Parse an HH:MM string to { hour, minute } */
export function parseTime(
  timeStr: string
): { hour: number; minute: number } | null {
  const parts = timeStr.split(":");
  if (parts.length !== 2) return null;
  const hour = parseInt(parts[0], 10);
  const minute = parseInt(parts[1], 10);
  if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  return { hour, minute };
}
