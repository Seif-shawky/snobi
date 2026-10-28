import "@testing-library/jest-dom/vitest";

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Node 22+ exposes a global `localStorage` that is undefined unless --localstorage-file is
// passed, which shadows jsdom's. Zustand's persist middleware needs a working Storage.
class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
}

function storageWorks() {
  try {
    const storage = globalThis.localStorage;
    storage.setItem("__probe__", "1");
    storage.removeItem("__probe__");
    return true;
  } catch {
    return false;
  }
}

if (!storageWorks()) {
  for (const name of ["localStorage", "sessionStorage"] as const) {
    const storage = new MemoryStorage();
    Object.defineProperty(globalThis, name, { configurable: true, value: storage });
    Object.defineProperty(window, name, { configurable: true, value: storage });
  }
}
