import logger from "@/lib/logger";

const LOCAL_STORAGE_THRESHOLD = 2 * 1024 * 1024; // 2MB 以下用 localStorage

const DB_NAME = "bayinai-db";
const DB_VERSION = 1;
const STORE_NAME = "reference-images";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export async function saveToStorage(
  images: string[],
  storageKey: string
): Promise<void> {
  if (images.length === 0) {
    localStorage.removeItem(storageKey);
    return;
  }

  const totalSize = images.reduce((acc, img) => acc + img.length, 0);
  
  if (totalSize < LOCAL_STORAGE_THRESHOLD) {
    localStorage.setItem(storageKey, JSON.stringify(images));
    await clearIndexedDB();
    logger.info("小文件: 使用 localStorage 存储");
  } else {
    await saveToIndexedDB(images);
    localStorage.setItem(storageKey, JSON.stringify([]));
    logger.info("大文件: 使用 IndexedDB 存储");
  }
}

export async function loadFromStorage(storageKey: string): Promise<string[]> {
  try {
    const localData = localStorage.getItem(storageKey);
    if (localData) {
      const parsed = JSON.parse(localData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        logger.info("从 localStorage 加载");
        return parsed;
      }
    }
    
    const idbData = await loadFromIndexedDB();
    if (idbData.length > 0) {
      logger.info("从 IndexedDB 加载");
      return idbData;
    }
    
    return [];
  } catch (error) {
    logger.error("加载失败，尝试 IndexedDB:", error);
    try {
      return await loadFromIndexedDB();
    } catch {
      return [];
    }
  }
}

async function saveToIndexedDB(images: string[]): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  
  await new Promise<void>((resolve, reject) => {
    store.clear();
    const request = store.put({
      id: "current",
      images,
      timestamp: Date.now(),
    });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  
  db.close();
}

async function loadFromIndexedDB(): Promise<string[]> {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);
  
  const result = await new Promise<{ images: string[]; timestamp: number } | undefined>((resolve, reject) => {
    const request = store.get("current");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  db.close();
  return result?.images || [];
}

async function clearIndexedDB(): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  
  await new Promise<void>((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  
  db.close();
}

export function getEstimatedSize(data: string): number {
  return data.length;
}
