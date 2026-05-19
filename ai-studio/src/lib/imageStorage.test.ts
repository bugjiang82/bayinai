import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

const LOCAL_STORAGE_THRESHOLD = 2 * 1024 * 1024;

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

async function saveToIndexedDB(images: string[]): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise<void>((resolve, reject) => {
    store.clear();
    const request = store.put({
      id: "current",
      images,
      timestamp: Date.now(),
    });
    request.onsuccess = () => {
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

async function loadFromIndexedDB(): Promise<string[]> {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise<{ images: string[]; timestamp: number } | undefined>((resolve, reject) => {
    const request = store.get("current");
    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  }) as Promise<{ images: string[]; timestamp: number } | undefined>;
}

async function clearIndexedDB(): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise<void>((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => {
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

async function saveToStorage(
  images: string[],
  storageKey: string
): Promise<void> {
  if (images.length === 0) {
    localStorage.removeItem(storageKey);
    await clearIndexedDB();
    return;
  }

  const totalSize = images.reduce((acc, img) => acc + img.length, 0);
  
  if (totalSize < LOCAL_STORAGE_THRESHOLD) {
    localStorage.setItem(storageKey, JSON.stringify(images));
    await clearIndexedDB();
  } else {
    await saveToIndexedDB(images);
    localStorage.setItem(storageKey, JSON.stringify([]));
  }
}

async function loadFromStorage(storageKey: string): Promise<string[]> {
  try {
    const localData = localStorage.getItem(storageKey);
    if (localData) {
      const parsed = JSON.parse(localData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    
    const idbData = await loadFromIndexedDB();
    if (idbData?.images && idbData.images.length > 0) {
      return idbData.images;
    }
    
    return [];
  } catch (error) {
    console.error("加载失败:", error);
    return [];
  }
}

describe("imageStorage 混合存储方案测试", () => {
  const STORAGE_KEY = "test-reference-images";
  
  beforeEach(() => {
    localStorage.clear();
  });
  
  afterEach(async () => {
    localStorage.clear();
    await clearIndexedDB();
  });

  describe("存储决策逻辑", () => {
    it("总大小 < 2MB 时应使用 localStorage", async () => {
      const smallImage = "data:image/png;base64," + "A".repeat(500 * 1024);
      const images = [smallImage, smallImage, smallImage];
      
      await saveToStorage(images, STORAGE_KEY);
      
      const localData = localStorage.getItem(STORAGE_KEY);
      expect(localData).not.toBeNull();
      expect(localData).not.toBe("[]");
      
      const parsed = JSON.parse(localData!);
      expect(parsed).toHaveLength(3);
    });

    it("总大小 >= 2MB 时应使用 IndexedDB", async () => {
      const largeImage = "data:image/png;base64," + "B".repeat(3 * 1024 * 1024);
      const images = [largeImage];
      
      await saveToStorage(images, STORAGE_KEY);
      
      const localData = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(localData!);
      expect(parsed).toHaveLength(0);
      
      const idbData = await loadFromIndexedDB();
      expect(idbData?.images).toHaveLength(1);
    });

    it("空数组应清除所有存储", async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(["some-data"]));
      
      await saveToStorage([], STORAGE_KEY);
      
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      
      const idbData = await loadFromIndexedDB();
      expect(idbData?.images).toBeUndefined();
    });
  });

  describe("加载逻辑", () => {
    it("localStorage 有数据时从 localStorage 加载", async () => {
      const images = ["data:image/png;base64,test1", "data:image/png;base64,test2"];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
      
      const loaded = await loadFromStorage(STORAGE_KEY);
      
      expect(loaded).toHaveLength(2);
      expect(loaded).toEqual(images);
    });

    it("localStorage 为空但 IndexedDB 有数据时从 IndexedDB 加载", async () => {
      const images = ["data:image/png;base64,idb-test"];
      await saveToIndexedDB(images);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      
      const loaded = await loadFromStorage(STORAGE_KEY);
      
      expect(loaded).toHaveLength(1);
      expect(loaded[0]).toBe("data:image/png;base64,idb-test");
    });

    it("两者都为空时返回空数组", async () => {
      const loaded = await loadFromStorage(STORAGE_KEY);
      expect(loaded).toEqual([]);
    });
  });

  describe("边界情况", () => {
    it("正好 2MB 边界值应用 localStorage", async () => {
      const exactSize = "A".repeat(2 * 1024 * 1024 - 50);
      const image = "data:image/png;base64," + exactSize;
      const images = [image];
      
      await saveToStorage(images, STORAGE_KEY);
      
      const localData = localStorage.getItem(STORAGE_KEY);
      expect(localData).not.toBe("[]");
    });

    it("略超过 2MB 应用 IndexedDB", async () => {
      const overSize = "A".repeat(2 * 1024 * 1024 + 100);
      const image = "data:image/png;base64," + overSize;
      const images = [image];
      
      await saveToStorage(images, STORAGE_KEY);
      
      const localData = localStorage.getItem(STORAGE_KEY);
      expect(JSON.parse(localData!)).toHaveLength(0);
      
      const idbData = await loadFromIndexedDB();
      expect(idbData?.images).toHaveLength(1);
    });

    it("多张小图片总和超过 2MB 时应使用 IndexedDB", async () => {
      const mediumImage = "data:image/png;base64," + "C".repeat(800 * 1024);
      const images = [mediumImage, mediumImage, mediumImage];
      
      await saveToStorage(images, STORAGE_KEY);
      
      const localData = localStorage.getItem(STORAGE_KEY);
      expect(JSON.parse(localData!)).toHaveLength(0);
      
      const idbData = await loadFromIndexedDB();
      expect(idbData?.images).toHaveLength(3);
    });
  });

  describe("数据完整性", () => {
    it("存储后加载的数据应与原始数据一致", async () => {
      const originalImages = [
        "data:image/png;base64,image1data",
        "data:image/jpeg;base64,image2data",
      ];
      
      await saveToStorage(originalImages, STORAGE_KEY);
      const loaded = await loadFromStorage(STORAGE_KEY);
      
      expect(loaded).toEqual(originalImages);
    });

    it("大文件存储后数据内容不丢失", async () => {
      const largeData = "X".repeat(5 * 1024 * 1024);
      const originalImages = [`data:image/png;base64,${largeData}`];
      
      await saveToStorage(originalImages, STORAGE_KEY);
      const loaded = await loadFromStorage(STORAGE_KEY);
      
      expect(loaded[0].length).toBe(originalImages[0].length);
      expect(loaded[0]).toBe(originalImages[0]);
    });
  });
});

describe("存储阈值常量", () => {
  it("阈值应为 2MB", () => {
    expect(LOCAL_STORAGE_THRESHOLD).toBe(2 * 1024 * 1024);
  });
});
