import { useState, useCallback, useRef } from "react";

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  validate?: (val: any) => boolean,
) {
  // Keep validate in a ref so reloadFromStorage always uses the latest
  const validateRef = useRef(validate);
  validateRef.current = validate;

  const readFromStorage = useCallback((): T => {
    try {
      const stored = localStorage.getItem(key);
      if (stored === null) {
        return defaultValue;
      }

      if (typeof defaultValue === "string") {
        if (!validateRef.current || validateRef.current(stored)) {
          return stored as T;
        }
        return defaultValue;
      }

      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (parsed === "") {
          return defaultValue;
        }
        if (!validateRef.current || validateRef.current(parsed)) {
          return parsed as T;
        }
      }
    } catch {}
    return defaultValue;
    // defaultValue is only used as a fallback and should not change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const [state, setState] = useState<T>(readFromStorage);

  const updateState = useCallback(
    (val: T) => {
      setState(val);
      if (typeof val === "string") {
        localStorage.setItem(key, val);
      } else {
        localStorage.setItem(key, JSON.stringify(val));
      }
    },
    [key],
  );

  /** Re-read the current value from localStorage into React state. */
  const reloadFromStorage = useCallback(() => {
    setState(readFromStorage());
  }, [readFromStorage]);

  return [state, updateState, reloadFromStorage] as const;
}
