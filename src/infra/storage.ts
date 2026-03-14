// ─────────────────────────────────────────────
//  INFRASTRUCTURE — IndexedDB Storage Adapter
//  Replaces localStorage — no 5MB limit,
//  iOS Safari won't auto-clear after 7 days
// ─────────────────────────────────────────────
import { logger } from './logger';

export interface StorageAdapter {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

const DB_NAME    = 'wk_v7';
const DB_VERSION = 1;
const STORE_NAME = 'kv';

class IndexedDBAdapter implements StorageAdapter {
  private db: IDBDatabase | null = null;
  private ready: Promise<IDBDatabase>;
  private cache: Map<string, string> = new Map();

  constructor() {
    this.ready = this.openDB();
    this.ready
      .then(() => this.loadAllIntoCache())
      .catch(e => logger.warn('[IDB] init failed', e));
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = (e) => {
        this.db = (e.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };
      req.onerror = () => reject(req.error);
    });
  }

  private loadAllIntoCache(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) { resolve(); return; }
      const req = this.db.transaction(STORE_NAME, 'readonly')
        .objectStore(STORE_NAME).openCursor();
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          this.cache.set(cursor.key as string, cursor.value);
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  // Sync reads from in-memory cache (populated at startup)
  get(key: string): string | null {
    return this.cache.get(key) ?? null;
  }

  // Async write to IDB + sync update cache
  set(key: string, value: string): void {
    this.cache.set(key, value);
    this.ready.then(db => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(value, key);
      tx.onerror = () => logger.error('[IDB] write failed', key);
    }).catch(e => logger.error('[IDB] set error', e));
  }

  remove(key: string): void {
    this.cache.delete(key);
    this.ready.then(db => {
      db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(key);
    }).catch(e => logger.error('[IDB] remove error', e));
  }
}

// Fallback for old browsers / private browsing
class LocalStorageFallback implements StorageAdapter {
  private mem = new Map<string, string>();
  get(key: string): string | null {
    try { return localStorage.getItem(key); }
    catch { return this.mem.get(key) ?? null; }
  }
  set(key: string, value: string): void {
    try { localStorage.setItem(key, value); }
    catch { this.mem.set(key, value); }
  }
  remove(key: string): void {
    try { localStorage.removeItem(key); }
    catch { this.mem.delete(key); }
  }
}

function isIDBAvailable(): boolean {
  try { return typeof indexedDB !== 'undefined' && indexedDB !== null; }
  catch { return false; }
}

export const storage: StorageAdapter = isIDBAvailable()
  ? new IndexedDBAdapter()
  : new LocalStorageFallback();
