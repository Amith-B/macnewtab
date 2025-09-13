import { useState } from "react";

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  validate?: (val: any) => boolean
) {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (typeof defaultValue === "string") {
        if (!validate || validate(stored)) {
          return stored as T;
        }

        return defaultValue;
      }

      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (parsed === "") {
          return defaultValue;
        }

        if (!validate || validate(parsed)) {
          return parsed as T;
        }
      }
    } catch {}
    return defaultValue;
  });

  const updateState = (val: T) => {
    setState(val);
    if (typeof val === "string") {
      localStorage.setItem(key, val);
    } else {
      localStorage.setItem(key, JSON.stringify(val));
    }
  };

  return [state, updateState] as const;
}

export const getLocalstorageDataWithPromise = (
  localStorageKey: string
): Promise<string | null> => {
  return new Promise<string | null>((resolve) => {
    const todoList = localStorage.getItem(localStorageKey);

    resolve(todoList);
  });
};
