import { AppPreferences, ProjectRecord } from '../types';

const DB_NAME = 'pixelforge_db';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORAGE_KEY_PREFS = 'pixelforge_preferences_v1';

export const defaultPreferences: AppPreferences = {
  theme: 'dark',
  defaultResolution: '4k',
  gpuMode: 'auto',
  tileSize: 512,
  lowMemoryMode: false,
  autoSaveHistory: true,
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this browser.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        const store = db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('type', 'type', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProject(project: ProjectRecord): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readwrite');
      const store = tx.objectStore(STORE_PROJECTS);
      store.put(project);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Fallback: save to localStorage if IndexedDB is unavailable
    try {
      const existing = getFallbackProjects();
      const updated = [project, ...existing.filter((p) => p.id !== project.id)].slice(0, 30);
      localStorage.setItem('pixelforge_projects_fallback', JSON.stringify(updated));
    } catch {
      // quota or local storage disabled
    }
  }
}

export async function getProjects(): Promise<ProjectRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readonly');
      const store = tx.objectStore(STORE_PROJECTS);
      const request = store.getAll();
      request.onsuccess = () => {
        const items = (request.result as ProjectRecord[]) || [];
        items.sort((a, b) => b.createdAt - a.createdAt);
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return getFallbackProjects();
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readwrite');
      const store = tx.objectStore(STORE_PROJECTS);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const existing = getFallbackProjects();
    const updated = existing.filter((p) => p.id !== id);
    localStorage.setItem('pixelforge_projects_fallback', JSON.stringify(updated));
  }
}

export async function clearAllProjects(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readwrite');
      const store = tx.objectStore(STORE_PROJECTS);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    localStorage.removeItem('pixelforge_projects_fallback');
  }
}

export function getPreferences(): AppPreferences {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PREFS);
    if (data) {
      return { ...defaultPreferences, ...JSON.parse(data) };
    }
  } catch {}
  return defaultPreferences;
}

export function savePreferences(prefs: AppPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
  } catch {}
}

function getFallbackProjects(): ProjectRecord[] {
  try {
    const data = localStorage.getItem('pixelforge_projects_fallback');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}
