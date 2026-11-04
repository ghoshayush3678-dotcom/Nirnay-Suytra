import { BrandLibraryState, ContentItem, AuditLogEntry } from '../types';
import {
  INITIAL_BRAND_LIBRARY,
  INITIAL_CONTENT_ITEMS,
  INITIAL_AUDIT_LOGS,
  resolveAssetUrl,
} from '../data/kaveriSeed';

const DB_NAME = 'nirnay_sutra_db';
const DB_VERSION = 1;
const STORE_NAME = 'governance_state';

const LS_KEYS = {
  LIBRARY: 'nirnay_sutra_library_v2',
  ITEMS: 'nirnay_sutra_items_v2',
  LOGS: 'nirnay_sutra_logs_v2',
};

function openIdb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveToIndexedDb(key: string, value: unknown): Promise<void> {
  const db = await openIdb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export function loadInitialState(): {
  library: BrandLibraryState;
  items: ContentItem[];
  auditLogs: AuditLogEntry[];
} {
  try {
    const rawLib = localStorage.getItem(LS_KEYS.LIBRARY);
    const rawItems = localStorage.getItem(LS_KEYS.ITEMS);
    const rawLogs = localStorage.getItem(LS_KEYS.LOGS);

    const parsedLib = rawLib ? JSON.parse(rawLib) : null;
    const parsedItems = rawItems ? JSON.parse(rawItems) : null;
    const parsedLogs = rawLogs ? JSON.parse(rawLogs) : null;

    const library: BrandLibraryState =
      parsedLib && typeof parsedLib === 'object'
        ? {
            ...INITIAL_BRAND_LIBRARY,
            ...parsedLib,
            guidelines: Array.isArray(parsedLib.guidelines)
              ? parsedLib.guidelines
              : INITIAL_BRAND_LIBRARY.guidelines,
            facts: Array.isArray(parsedLib.facts)
              ? parsedLib.facts
              : INITIAL_BRAND_LIBRARY.facts,
            terminology: Array.isArray(parsedLib.terminology)
              ? parsedLib.terminology
              : INITIAL_BRAND_LIBRARY.terminology,
            assets: Array.isArray(parsedLib.assets)
              ? parsedLib.assets
              : INITIAL_BRAND_LIBRARY.assets,
            autopilotConfig: {
              ...INITIAL_BRAND_LIBRARY.autopilotConfig,
              ...(parsedLib.autopilotConfig || {}),
              stats: {
                ...INITIAL_BRAND_LIBRARY.autopilotConfig.stats,
                ...(parsedLib.autopilotConfig?.stats || {}),
              },
            },
          }
        : INITIAL_BRAND_LIBRARY;

    const normalizedItems: ContentItem[] = Array.isArray(parsedItems)
      ? parsedItems.map((it: ContentItem) => ({
          ...it,
          imageUrl: resolveAssetUrl(it.imageUrl),
        }))
      : INITIAL_CONTENT_ITEMS;

    return {
      library,
      items: normalizedItems,
      auditLogs: Array.isArray(parsedLogs) ? parsedLogs : INITIAL_AUDIT_LOGS,
    };
  } catch {
    return {
      library: INITIAL_BRAND_LIBRARY,
      items: INITIAL_CONTENT_ITEMS,
      auditLogs: INITIAL_AUDIT_LOGS,
    };
  }
}

export function persistState(
  library: BrandLibraryState,
  items: ContentItem[],
  auditLogs: AuditLogEntry[]
): void {
  try {
    localStorage.setItem(LS_KEYS.LIBRARY, JSON.stringify(library));
    localStorage.setItem(LS_KEYS.ITEMS, JSON.stringify(items));
    localStorage.setItem(LS_KEYS.LOGS, JSON.stringify(auditLogs));
  } catch {
    // Ignore quota errors
  }
  void saveToIndexedDb(LS_KEYS.LIBRARY, library);
  void saveToIndexedDb(LS_KEYS.ITEMS, items);
  void saveToIndexedDb(LS_KEYS.LOGS, auditLogs);
}

export function resetToSeedData(): {
  library: BrandLibraryState;
  items: ContentItem[];
  auditLogs: AuditLogEntry[];
} {
  localStorage.removeItem(LS_KEYS.LIBRARY);
  localStorage.removeItem(LS_KEYS.ITEMS);
  localStorage.removeItem(LS_KEYS.LOGS);
  void saveToIndexedDb(LS_KEYS.LIBRARY, INITIAL_BRAND_LIBRARY);
  void saveToIndexedDb(LS_KEYS.ITEMS, INITIAL_CONTENT_ITEMS);
  void saveToIndexedDb(LS_KEYS.LOGS, INITIAL_AUDIT_LOGS);
  return {
    library: INITIAL_BRAND_LIBRARY,
    items: INITIAL_CONTENT_ITEMS,
    auditLogs: INITIAL_AUDIT_LOGS,
  };
}
