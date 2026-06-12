import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  memo,
  useCallback,
} from "react";
import "./StickyNotes.css";
import { AppContext } from "../../context/provider";
import { translation } from "../../locale/languages";
import {
  Note,
  syncNotesToChrome,
  loadNotesFromSync,
  mergeNotes,
  listenForSyncChanges,
} from "../../utils/stickyNotesSync";
import { getBodyZoomScale } from "../../utils/zoom";
import { getResolvedKey } from "../../utils/spacesStorage";

const STICKY_NOTES_KEY = "macnewtab_sticky_notes";

const noteColors = [
  "#FFE066", // Classic Yellow
  "#FFB3BA", // Soft Pink
  "#BAFFC9", // Mint Green
  "#BAE1FF", // Sky Blue
  "#FFDFBA", // Peach
  "#E6CCFF", // Lavender
  "#FFD1DC", // Light Rose
  "#B3E5D1", // Seafoam
  "#FFE4B5", // Moccasin
  "#D4EDDA", // Light Green
  "#F8D7DA", // Light Red
  "#D1ECF1", // Light Cyan
  "#FFF3CD", // Light Amber
  "#E2E3E5", // Light Gray
  "#F4CCCC", // Light Coral
  "#C9DAF8", // Light Blue
  "#FCE5CD", // Light Orange
  "#D9EAD3", // Light Lime
  "#F4CCCC", // Blush
  "#E1D5E7", // Thistle
];

const StickyNotes: React.FC = memo(() => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draggedNote, setDraggedNote] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const newNoteIdRef = useRef<string | null>(null);
  const dragScale = useRef(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const { locale, enableStickyNotesSync, activeSpace } = useContext(AppContext);
  const activeSpaceId = activeSpace?.id;
  const actualKey = getResolvedKey(STICKY_NOTES_KEY, activeSpaceId);

  // Track whether initial sync load is complete to avoid overwriting sync data
  const initialLoadDone = useRef(false);

  const loadLocalNotes = useCallback((): Note[] => {
    const savedNotes = localStorage.getItem(actualKey);
    if (savedNotes) {
      try {
        return JSON.parse(savedNotes);
      } catch {
        return [];
      }
    }
    return [];
  }, [actualKey]);

  useEffect(() => {
    const initNotes = async () => {
      const localNotes = loadLocalNotes();

      if (enableStickyNotesSync) {
        const syncNotes = await loadNotesFromSync(activeSpaceId);
        const merged = mergeNotes(localNotes, syncNotes);

        localStorage.setItem(actualKey, JSON.stringify(merged));
        setNotes(merged);

        if (merged.length > 0) {
          syncNotesToChrome(merged, activeSpaceId);
        }
      } else {
        setNotes(localNotes);
      }
      initialLoadDone.current = true;
    };

    initNotes();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === actualKey && e.newValue) {
        try {
          const updatedNotes = JSON.parse(e.newValue);
          setNotes(updatedNotes);
          if (enableStickyNotesSync) {
            syncNotesToChrome(updatedNotes, activeSpaceId);
          }
        } catch (error) {
          console.error(
            "Failed to parse sticky notes from storage event",
            error,
          );
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    let unsubscribeSync = () => {};
    if (enableStickyNotesSync) {
      unsubscribeSync = listenForSyncChanges((remoteNotes) => {
        if (!initialLoadDone.current) return;
        const currentLocal = loadLocalNotes();
        const merged = mergeNotes(currentLocal, remoteNotes);
        localStorage.setItem(actualKey, JSON.stringify(merged));
        setNotes(merged);
      }, activeSpaceId);
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      unsubscribeSync();
    };
  }, [enableStickyNotesSync, actualKey, activeSpaceId, loadLocalNotes]);

  const saveNotes = (updatedNotes: Note[]) => {
    localStorage.setItem(actualKey, JSON.stringify(updatedNotes));
    setNotes(updatedNotes);
    if (enableStickyNotesSync) {
      syncNotesToChrome(updatedNotes, activeSpaceId);
    }
  };

  const createNote = () => {
    // Get fresh data from localStorage to avoid conflicts
    const existingNotes = loadLocalNotes();

    const newNote: Note = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 11),
      content: "",
      x: Math.random() * 300 + 50,
      y: Math.random() * 200 + 100,
      color: noteColors[Math.floor(Math.random() * noteColors.length)],
      timestamp: Date.now(),
    };

    const updatedNotes = [...existingNotes, newNote];
    newNoteIdRef.current = newNote.id;
    saveNotes(updatedNotes);
  };

  useEffect(() => {
    // Listen for create note events from dock
    const handleCreateNoteEvent = () => {
      createNote();
    };

    window.addEventListener("createStickyNote", handleCreateNoteEvent);

    return () => {
      window.removeEventListener("createStickyNote", handleCreateNoteEvent);
    };
  });

  const updateNote = (id: string, content: string) => {
    // Get fresh data from localStorage to avoid conflicts
    const existingNotes = loadLocalNotes();

    const updatedNotes = existingNotes.map((note: Note) =>
      note.id === id ? { ...note, content, timestamp: Date.now() } : note,
    );
    saveNotes(updatedNotes);
  };

  const deleteNote = (id: string) => {
    // Get fresh data from localStorage to avoid conflicts
    const existingNotes = loadLocalNotes();

    const updatedNotes = existingNotes.filter((note: Note) => note.id !== id);
    saveNotes(updatedNotes);
  };

  const handleMouseDown = (e: React.MouseEvent, noteId: string) => {
    if ((e.target as HTMLElement).tagName === "TEXTAREA") return;

    // Prevent text selection during drag
    e.preventDefault();

    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    setDraggedNote(noteId);
    dragScale.current = getBodyZoomScale();
    const scale = dragScale.current;
    setDragOffset({
      x: e.clientX / scale - note.x,
      y: e.clientY / scale - note.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggedNote) return;
    const scale = dragScale.current || 1;
    const scaledX = e.clientX / scale;
    const scaledY = e.clientY / scale;

    const updatedNotes = notes.map((note) =>
      note.id === draggedNote
        ? {
            ...note,
            x: scaledX - dragOffset.x,
            y: scaledY - dragOffset.y,
          }
        : note,
    );
    setNotes(updatedNotes);
  };

  const handleMouseUp = () => {
    if (draggedNote) {
      // Get fresh data and update the specific note position
      const existingNotes = loadLocalNotes();

      const draggedNoteData = notes.find((n) => n.id === draggedNote);
      if (draggedNoteData) {
        const updatedNotes = existingNotes.map((note: Note) =>
          note.id === draggedNote
            ? {
                ...note,
                x: draggedNoteData.x,
                y: draggedNoteData.y,
                timestamp: Date.now(),
              }
            : note,
        );
        localStorage.setItem(actualKey, JSON.stringify(updatedNotes));
        if (enableStickyNotesSync) {
          syncNotesToChrome(updatedNotes);
        }
      }
      setDraggedNote(null);
    }
  };

  useEffect(() => {
    if (draggedNote) {
      // Prevent text selection during drag
      document.body.style.userSelect = "none";

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        // Restore text selection
        document.body.style.userSelect = "";

        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  });

  // Auto-focus the textarea of a newly created note
  useEffect(() => {
    if (newNoteIdRef.current) {
      const textarea = document.getElementById(
        newNoteIdRef.current,
      ) as HTMLTextAreaElement | null;
      if (textarea) {
        textarea.focus();
        newNoteIdRef.current = null;
      }
    }
  }, [notes]);

  return (
    <div className="sticky-notes-container" ref={containerRef}>
      {notes.map((note) => (
        <div
          key={note.id}
          className={`sticky-note ${draggedNote === note.id ? "dragging" : ""}`}
          style={{
            left: note.x,
            top: note.y,
            backgroundColor: note.color,
          }}
          onMouseDown={(e) => handleMouseDown(e, note.id)}
        >
          <div className="note-header">
            <button
              className="delete-note-btn"
              onClick={() => deleteNote(note.id)}
              title="Delete Note"
            >
              ×
            </button>
          </div>
          <textarea
            id={note.id}
            className="note-content"
            value={note.content}
            onChange={(e) => updateNote(note.id, e.target.value)}
            placeholder={
              translation[locale]?.sticky_note_placeholder ||
              "Type your note here..."
            }
            rows={6}
          />
        </div>
      ))}
    </div>
  );
});

export default StickyNotes;
