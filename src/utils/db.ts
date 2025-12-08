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
  base64Image: string
): Promise<string> => {
  const db = await openDatabase();
  const blob = await fetch(base64Image).then((res) => res.blob());

  return new Promise((resolve, reject) => {
    const transaction = db.transaction("wallpapers", "readwrite");
    const store = transaction.objectStore("wallpapers");
    store.put({ id: "customWallpaper", imageBlob: blob });

    transaction.oncomplete = () => {
      const url = URL.createObjectURL(blob);
      resolve(url);
    };
    transaction.onerror = () => reject(transaction.error);
  });
};

export const fetchImageFromIndexedDB = async (): Promise<string | null> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("wallpapers", "readonly");
    const store = transaction.objectStore("wallpapers");
    const request = store.get("customWallpaper");

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

    request.onerror = () => reject(request.error);
  });
};

export const deleteImageFromIndexedDB = async (): Promise<void> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("wallpapers", "readwrite");
    const store = transaction.objectStore("wallpapers");
    store.delete("customWallpaper");

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};
