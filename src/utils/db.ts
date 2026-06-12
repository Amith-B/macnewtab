import { getResolvedDbKey } from "./spacesStorage";

export const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("WallpaperDB", 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("wallpapers")) {
        db.createObjectStore("wallpapers", { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

export const saveImageToIndexedDB = async (
  base64Image: string,
  id: string = "customWallpaper",
  activeSpaceId?: string,
): Promise<string> => {
  const db = await openDatabase();
  const blob = await fetch(base64Image).then((res) => res.blob());
  const actualId = getResolvedDbKey(id, activeSpaceId);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction("wallpapers", "readwrite");
    const store = transaction.objectStore("wallpapers");
    store.put({ id: actualId, imageBlob: blob });

    transaction.oncomplete = () => {
      const url = URL.createObjectURL(blob);
      resolve(url);
    };
    transaction.onerror = () => reject(transaction.error);
  });
};

export const fetchImageFromIndexedDB = async (
  id: string = "customWallpaper",
  activeSpaceId?: string,
): Promise<string | null> => {
  const db = await openDatabase();
  const actualId = getResolvedDbKey(id, activeSpaceId);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction("wallpapers", "readonly");
    const store = transaction.objectStore("wallpapers");
    const request = store.get(actualId);

    request.onsuccess = () => {
      const result = request.result as
        | { id: string; base64?: string; imageBlob?: Blob }
        | undefined;

      if (result?.imageBlob) {
        const url = URL.createObjectURL(result.imageBlob);
        resolve(url);
      } else {
        resolve(result?.base64 || null);
      }
    };

    request.onerror = () => reject(transaction.error);
  });
};

export const deleteImageFromIndexedDB = async (
  id: string = "customWallpaper",
  activeSpaceId?: string,
): Promise<void> => {
  const db = await openDatabase();
  const actualId = getResolvedDbKey(id, activeSpaceId);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction("wallpapers", "readwrite");
    const store = transaction.objectStore("wallpapers");
    const request = store.delete(actualId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(transaction.error);
  });
};

export const deleteSpaceImagesFromIndexedDB = async (
  spaceId: string,
): Promise<void> => {
  const db = await openDatabase();
  const prefix = `space_${spaceId}__`;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction("wallpapers", "readwrite");
    const store = transaction.objectStore("wallpapers");
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest)
        .result as IDBCursorWithValue | null;
      if (cursor) {
        if (typeof cursor.key === "string" && cursor.key.startsWith(prefix)) {
          cursor.delete();
        }
        cursor.continue();
      }
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};
