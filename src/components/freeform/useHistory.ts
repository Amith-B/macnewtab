import { useState, useCallback } from 'react';
import { CanvasObject } from './freeformTypes';

const MAX_HISTORY = 50;

export function useHistory(initialState: CanvasObject[]) {
  const [history, setHistory] = useState<CanvasObject[][]>([initialState]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const current = history[historyIndex] || [];

  const pushState = useCallback((objects: CanvasObject[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(objects);
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [historyIndex]);

  const replaceState = useCallback((objects: CanvasObject[]) => {
    setHistory(prev => {
      const newHistory = [...prev];
      newHistory[historyIndex] = objects;
      return newHistory;
    });
  }, [historyIndex]);

  const undo = useCallback(() => {
    setHistoryIndex(prev => Math.max(0, prev - 1));
  }, []);

  const redo = useCallback(() => {
    setHistoryIndex(prev => Math.min(history.length - 1, prev + 1));
  }, [history.length]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const resetHistory = useCallback((objects: CanvasObject[]) => {
    setHistory([objects]);
    setHistoryIndex(0);
  }, []);

  return {
    objects: current,
    pushState,
    replaceState,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
  };
}
