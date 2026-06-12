/* global chrome */

export interface Note {
  id: string;
  content: string;
  x: number;
  y: number;
  color: string;
  timestamp: number;
}

const SYNC_NOTE_PREFIX = "snote_";
const SYNC_INDEX_KEY = "snotes_index";
const DEBOUNCE_DELAY_MS = 1500;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const getIndexKey = (activeSpaceId?: string) => {
  if (!activeSpaceId || activeSpaceId === "Default") return SYNC_INDEX_KEY;
  return `space_${activeSpaceId}__${SYNC_INDEX_KEY}`;
};

const noteKey = (id: string, activeSpaceId?: string) => {
  const base = `${SYNC_NOTE_PREFIX}${id}`;
  if (!activeSpaceId || activeSpaceId === "Default") return base;
  return `space_${activeSpaceId}__${base}`;
};

const isSyncAvailable = (): boolean => {
  return (
    typeof chrome !== "undefined" && !!chrome.storage && !!chrome.storage.sync
  );
};

const MAX_SYNC_BYTES = 90000;

const getByteSize = (str: string): number => {
  return new Blob([str]).size;
};

export const syncNotesToChrome = (
  notes: Note[],
  activeSpaceId?: string,
): void => {
  if (!isSyncAvailable()) return;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(async () => {
    try {
      const sortedNotes = [...notes].sort((a, b) => b.timestamp - a.timestamp);

      const activeIds: string[] = [];
      const dataToSet: Record<string, any> = {};
      let estimatedTotalBytes = 0;
      let quotaExceeded = false;

      const indexKey = getIndexKey(activeSpaceId);
      const indexKeySize = getByteSize(indexKey);
      estimatedTotalBytes += indexKeySize;

      for (const note of sortedNotes) {
        const notePayload = {
          id: note.id,
          content: note.content,
          x: note.x,
          y: note.y,
          color: note.color,
          timestamp: note.timestamp,
        };

        const notePayloadStr = JSON.stringify(notePayload);
        const noteKeyStr = noteKey(note.id, activeSpaceId);
        const noteBytes =
          getByteSize(noteKeyStr) +
          getByteSize(notePayloadStr) +
          getByteSize(note.id) +
          4;

        if (estimatedTotalBytes + noteBytes > MAX_SYNC_BYTES) {
          quotaExceeded = true;
          break;
        }

        activeIds.push(note.id);
        dataToSet[noteKeyStr] = notePayload;
        estimatedTotalBytes += noteBytes;
      }

      dataToSet[indexKey] = activeIds;

      if (quotaExceeded) {
        console.warn(
          `Sticky Notes Sync: Quota limit approached. Syncing the ${activeIds.length} most recent notes (out of ${notes.length} total). Older notes remain local-only.`,
        );
      }

      await chrome.storage.sync.set(dataToSet);
      await cleanupSyncKeys(activeIds, activeSpaceId);
    } catch (error) {
      console.error("Failed to sync sticky notes to Chrome:", error);
    }
  }, DEBOUNCE_DELAY_MS);
};

const cleanupSyncKeys = async (
  activeIds: string[],
  activeSpaceId?: string,
): Promise<void> => {
  try {
    const allData = await chrome.storage.sync.get(null);
    const activeKeySet = new Set(
      activeIds.map((id) => noteKey(id, activeSpaceId)),
    );

    const prefix = noteKey("", activeSpaceId);

    const keysToRemove = Object.keys(allData).filter(
      (key) => key.startsWith(prefix) && !activeKeySet.has(key),
    );

    if (keysToRemove.length > 0) {
      await chrome.storage.sync.remove(keysToRemove);
    }
  } catch (error) {
    console.error("Failed to cleanup stale sync keys:", error);
  }
};

export const loadNotesFromSync = async (
  activeSpaceId?: string,
): Promise<Note[]> => {
  if (!isSyncAvailable()) return [];

  try {
    const data = await chrome.storage.sync.get(null);
    const indexKey = getIndexKey(activeSpaceId);
    const index: string[] = data[indexKey] || [];

    const notes: Note[] = [];
    for (const id of index) {
      const noteData = data[noteKey(id, activeSpaceId)];
      if (noteData && noteData.id) {
        notes.push(noteData as Note);
      }
    }

    return notes;
  } catch (error) {
    console.error("Failed to load sticky notes from sync:", error);
    return [];
  }
};

export const mergeNotes = (local: Note[], remote: Note[]): Note[] => {
  const merged = new Map<string, Note>();

  for (const note of local) {
    merged.set(note.id, note);
  }

  for (const note of remote) {
    const existing = merged.get(note.id);
    if (!existing || note.timestamp > existing.timestamp) {
      merged.set(note.id, note);
    }
  }

  return Array.from(merged.values());
};

export const listenForSyncChanges = (
  callback: (notes: Note[]) => void,
  activeSpaceId?: string,
): (() => void) => {
  if (!isSyncAvailable()) return () => {};

  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string,
  ) => {
    if (areaName !== "sync") return;

    const indexKey = getIndexKey(activeSpaceId);
    const prefix = noteKey("", activeSpaceId);

    const hasNoteChanges = Object.keys(changes).some(
      (key) => key.startsWith(prefix) || key === indexKey,
    );

    if (!hasNoteChanges) return;

    loadNotesFromSync(activeSpaceId).then((notes) => {
      callback(notes);
    });
  };

  chrome.storage.onChanged.addListener(listener);

  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
};
