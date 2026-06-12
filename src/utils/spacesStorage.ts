import {
  SpacesConfig,
  Space,
  SpaceTimeRange,
  SPACES_CONFIG_KEY,
  DEFAULT_SPACE_COLORS,
  PER_SPACE_KEYS,
} from "../static/spacesSettings";
import { generateRandomId } from "./random";

// ─── Config Management ───

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

export function saveSpacesConfig(config: SpacesConfig): void {
  localStorage.setItem(SPACES_CONFIG_KEY, JSON.stringify(config));
}

// ─── Key Resolution Utility ───

/**
 * Returns the correct localStorage key given an active space ID.
 * - Flat keys are used for the Default space (or when spaces are disabled).
 * - Prefixed keys are used for custom spaces, but ONLY for keys in PER_SPACE_KEYS.
 */
export function getResolvedKey(
  key: string,
  spaceId: string | undefined,
): string {
  if (!spaceId || spaceId === "Default" || !PER_SPACE_KEYS.includes(key)) {
    return key;
  }
  return `space_${spaceId}__${key}`;
}

/**
 * Returns the correct IndexedDB key given an active space ID.
 * Uses the same prefix logic but does not check PER_SPACE_KEYS.
 */
export function getResolvedDbKey(
  key: string,
  spaceId: string | undefined,
): string {
  if (!spaceId || spaceId === "Default") {
    return key;
  }
  return `space_${spaceId}__${key}`;
}

// ─── Space Lifecycle ───

export function enableSpaces(defaultName: string): SpacesConfig {
  const defaultSpace: Space = {
    id: "Default",
    name: defaultName,
    color: DEFAULT_SPACE_COLORS[0],
    createdAt: Date.now(),
    isTimeSensitive: false,
  };

  const config: SpacesConfig = {
    spaces: [defaultSpace],
    activeSpaceId: "Default",
    timeSensitiveEnabled: false,
  };

  saveSpacesConfig(config);
  return config;
}

export function createNewSpace(name: string, color: string): Space {
  return {
    id: generateRandomId(),
    name,
    color,
    createdAt: Date.now(),
    isTimeSensitive: false,
  };
}

export async function deleteSpace(
  spaceId: string,
  config: SpacesConfig,
): Promise<SpacesConfig> {
  const prefix = `space_${spaceId}__`;
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((k) => localStorage.removeItem(k));

  const updatedConfig: SpacesConfig = {
    ...config,
    spaces: config.spaces.filter((s) => s.id !== spaceId),
  };
  saveSpacesConfig(updatedConfig);
  return updatedConfig;
}

export async function switchToSpace(
  targetSpaceId: string,
  config: SpacesConfig,
): Promise<SpacesConfig> {
  if (config.activeSpaceId === targetSpaceId) return config;

  const updatedConfig = { ...config, activeSpaceId: targetSpaceId };
  saveSpacesConfig(updatedConfig);

  // Notify non-React components that the space changed
  window.dispatchEvent(new Event("spaceChanged"));

  return updatedConfig;
}

// ─── Time-Sensitive Logic ───

export function initializeSpaceForCurrentTime(): SpacesConfig | null {
  const config = loadSpacesConfig();
  if (!config || !config.timeSensitiveEnabled) return config;

  const now = new Date();
  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

  const activeTimeSpace = config.spaces.find((s) => {
    if (!s.isTimeSensitive || !s.timeRange) return false;
    const startMins = s.timeRange.startHour * 60 + s.timeRange.startMinute;
    const endMins = s.timeRange.endHour * 60 + s.timeRange.endMinute;

    if (startMins <= endMins) {
      return currentTotalMinutes >= startMins && currentTotalMinutes <= endMins;
    } else {
      return currentTotalMinutes >= startMins || currentTotalMinutes <= endMins;
    }
  });

  if (activeTimeSpace && config.activeSpaceId !== activeTimeSpace.id) {
    const newConfig = { ...config, activeSpaceId: activeTimeSpace.id };
    saveSpacesConfig(newConfig);
    return newConfig;
  }

  return config;
}
export function validateTimeRanges(spaces: Space[]): {
  valid: boolean;
  conflicts: Array<[string, string]>;
} {
  const timeSensitiveSpaces = spaces.filter(
    (s) => s.isTimeSensitive && s.timeRange,
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
function doTimeRangesOverlap(a: SpaceTimeRange, b: SpaceTimeRange): boolean {
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
  range: SpaceTimeRange,
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
  const period = hour >= 12 && hour < 24 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

/** Parse an HH:MM string to { hour, minute } */
export function parseTime(
  timeStr: string,
): { hour: number; minute: number } | null {
  const parts = timeStr.split(":");
  if (parts.length !== 2) return null;
  const hour = parseInt(parts[0], 10);
  const minute = parseInt(parts[1], 10);
  if (
    isNaN(hour) ||
    isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }
  return { hour, minute };
}
