import { useState, useCallback, useRef, useEffect } from "react";
import { PER_SPACE_KEYS } from "../static/spacesSettings";

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  validate?: (val: any) => boolean,
  activeSpaceId?: string,
) {
  // Keep validate in a ref so reloadFromStorage always uses the latest
  const validateRef = useRef(validate);
  validateRef.current = validate;

  // Determine the actual key to use based on the active space
  const actualKey =
    activeSpaceId && activeSpaceId !== "Default" && PER_SPACE_KEYS.includes(key)
      ? `space_${activeSpaceId}__${key}`
      : key;

  const readFromStorage = useCallback((): T => {
    try {
      const stored = localStorage.getItem(actualKey);
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
  }, [actualKey]);

  const [state, setState] = useState<T>(readFromStorage);

  // When actualKey changes (because activeSpaceId changed), re-read from storage automatically
  useEffect(() => {
    setState(readFromStorage());
  }, [actualKey, readFromStorage]);

  const updateState = useCallback(
    (val: T) => {
      setState(val);
      if (typeof val === "string") {
        localStorage.setItem(actualKey, val);
      } else {
        localStorage.setItem(actualKey, JSON.stringify(val));
      }
    },
    [actualKey],
  );

  return [state, updateState] as const;
}
