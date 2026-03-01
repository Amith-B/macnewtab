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

/**
 * Convert a Note to its sync storage key.
 */
const noteKey = (id: string) => `${SYNC_NOTE_PREFIX}${id}`;

/**
 * Check if the chrome.storage.sync API is available.
 */
const isSyncAvailable = (): boolean => {
    return (
        typeof chrome !== "undefined" &&
        !!chrome.storage &&
        !!chrome.storage.sync
    );
};

/**
 * Write notes to chrome.storage.sync (debounced).
 * Each note is stored under its own key to stay within the 8KB per-item limit.
 * An index key stores the list of active note IDs.
 */
export const syncNotesToChrome = (notes: Note[]): void => {
    if (!isSyncAvailable()) return;

    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(async () => {
        try {
            const activeIds = notes.map((n) => n.id);

            // Build the object to set
            const dataToSet: Record<string, any> = {
                [SYNC_INDEX_KEY]: activeIds,
            };

            for (const note of notes) {
                dataToSet[noteKey(note.id)] = {
                    id: note.id,
                    content: note.content,
                    x: note.x,
                    y: note.y,
                    color: note.color,
                    timestamp: note.timestamp,
                };
            }

            // Write all notes + index in one call
            await chrome.storage.sync.set(dataToSet);

            // Clean up stale keys that are no longer in the index
            await cleanupSyncKeys(activeIds);
        } catch (error) {
            console.error("Failed to sync sticky notes to Chrome:", error);
        }
    }, DEBOUNCE_DELAY_MS);
};

/**
 * Remove stale snote_* keys from sync storage that are no longer active.
 */
const cleanupSyncKeys = async (activeIds: string[]): Promise<void> => {
    try {
        const allData = await chrome.storage.sync.get(null);
        const activeKeySet = new Set(activeIds.map((id) => noteKey(id)));

        const keysToRemove = Object.keys(allData).filter(
            (key) => key.startsWith(SYNC_NOTE_PREFIX) && !activeKeySet.has(key)
        );

        if (keysToRemove.length > 0) {
            await chrome.storage.sync.remove(keysToRemove);
        }
    } catch (error) {
        console.error("Failed to cleanup stale sync keys:", error);
    }
};

/**
 * Load all notes from chrome.storage.sync.
 */
export const loadNotesFromSync = async (): Promise<Note[]> => {
    if (!isSyncAvailable()) return [];

    try {
        const data = await chrome.storage.sync.get(null);
        const index: string[] = data[SYNC_INDEX_KEY] || [];

        const notes: Note[] = [];
        for (const id of index) {
            const noteData = data[noteKey(id)];
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

/**
 * Merge local and remote notes using timestamp-based conflict resolution.
 * - Notes present in both: keep the one with the latest timestamp.
 * - Notes present only in remote: add them (they were created on another device).
 * - Notes present only in local: keep them (they'll be synced on next write).
 */
export const mergeNotes = (local: Note[], remote: Note[]): Note[] => {
    const merged = new Map<string, Note>();

    // Add all local notes first
    for (const note of local) {
        merged.set(note.id, note);
    }

    // Merge remote notes — latest timestamp wins
    for (const note of remote) {
        const existing = merged.get(note.id);
        if (!existing || note.timestamp > existing.timestamp) {
            merged.set(note.id, note);
        }
    }

    return Array.from(merged.values());
};

/**
 * Listen for sync changes from other devices.
 * Calls the callback with the full updated notes array whenever a change is detected.
 * Returns an unsubscribe function.
 */
export const listenForSyncChanges = (
    callback: (notes: Note[]) => void
): (() => void) => {
    if (!isSyncAvailable()) return () => { };

    const listener = (
        changes: { [key: string]: chrome.storage.StorageChange },
        areaName: string
    ) => {
        if (areaName !== "sync") return;

        // Check if any sticky note keys changed
        const hasNoteChanges = Object.keys(changes).some(
            (key) => key.startsWith(SYNC_NOTE_PREFIX) || key === SYNC_INDEX_KEY
        );

        if (!hasNoteChanges) return;

        // Reload all notes from sync to get the full picture
        loadNotesFromSync().then((notes) => {
            callback(notes);
        });
    };

    chrome.storage.onChanged.addListener(listener);

    return () => {
        chrome.storage.onChanged.removeListener(listener);
    };
};
