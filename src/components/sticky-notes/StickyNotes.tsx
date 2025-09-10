import React, { useState, useEffect, useRef, useContext } from "react";
import "./StickyNotes.css";
import { AppContext } from "../../context/provider";
import { translation } from "../../locale/languages";

interface Note {
  id: string;
  content: string;
  x: number;
  y: number;
  color: string;
  timestamp: number;
}

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

const StickyNotes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draggedNote, setDraggedNote] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { locale } = useContext(AppContext);

  useEffect(() => {
    const savedNotes = localStorage.getItem(STICKY_NOTES_KEY);
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }

    // Listen for localStorage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STICKY_NOTES_KEY && e.newValue) {
        try {
          setNotes(JSON.parse(e.newValue));
        } catch (error) {
          console.error(
            "Failed to parse sticky notes from storage event",
            error
          );
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const saveNotes = (updatedNotes: Note[]) => {
    localStorage.setItem(STICKY_NOTES_KEY, JSON.stringify(updatedNotes));
    setNotes(updatedNotes);
  };

  const createNote = () => {
    // Get fresh data from localStorage to avoid conflicts
    const currentNotes = localStorage.getItem(STICKY_NOTES_KEY);
    const existingNotes = currentNotes ? JSON.parse(currentNotes) : [];

    const newNote: Note = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 11),
      content: "",
      x: Math.random() * 300 + 50,
      y: Math.random() * 200 + 100,
      color: noteColors[Math.floor(Math.random() * noteColors.length)],
      timestamp: Date.now(),
    };

    const updatedNotes = [...existingNotes, newNote];
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
    const currentNotes = localStorage.getItem(STICKY_NOTES_KEY);
    const existingNotes = currentNotes ? JSON.parse(currentNotes) : [];

    const updatedNotes = existingNotes.map((note: Note) =>
      note.id === id ? { ...note, content, timestamp: Date.now() } : note
    );
    saveNotes(updatedNotes);
  };

  const deleteNote = (id: string) => {
    // Get fresh data from localStorage to avoid conflicts
    const currentNotes = localStorage.getItem(STICKY_NOTES_KEY);
    const existingNotes = currentNotes ? JSON.parse(currentNotes) : [];

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
    setDragOffset({
      x: e.clientX - note.x,
      y: e.clientY - note.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggedNote) return;

    const updatedNotes = notes.map((note) =>
      note.id === draggedNote
        ? {
            ...note,
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y,
          }
        : note
    );
    setNotes(updatedNotes);
  };

  const handleMouseUp = () => {
    if (draggedNote) {
      // Get fresh data and update the specific note position
      const currentNotes = localStorage.getItem(STICKY_NOTES_KEY);
      const existingNotes = currentNotes ? JSON.parse(currentNotes) : [];

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
            : note
        );
        localStorage.setItem(STICKY_NOTES_KEY, JSON.stringify(updatedNotes));
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
};

export default StickyNotes;
