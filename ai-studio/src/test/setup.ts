export {};

declare global {
  interface Window {
    indexedDB: IDBFactory;
  }
}

global.indexedDB = global.indexedDB || {
  open: (_name: string, _version: number) => {
    let db: any = {
      objectStoreNames: { contains: () => false },
      transaction: () => ({
        objectStore: () => ({
          get: () => ({ onsuccess: null, onerror: null, result: undefined }),
          put: () => ({ onsuccess: null, onerror: null }),
          clear: () => ({ onsuccess: null, onerror: null }),
        }),
      }),
      close: () => {},
    };

    const request: any = {
      onerror: null,
      onsuccess: null,
      result: db,
    };

    setTimeout(() => {
      if (request.onsuccess) request.onsuccess({ target: request });
    }, 0);

    return request;
  },
};