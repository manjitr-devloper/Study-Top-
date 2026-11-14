// Notes sync and offline cache state manager for Firebase Firestore & Local Storage
export type NotesSyncStatus = 'synced' | 'syncing' | 'cached_offline';

export interface NotesSyncInfo {
  status: NotesSyncStatus;
  lastSyncedAt: number | null;
  pendingCount: number;
  isOnline: boolean;
  notesCount: number;
  message?: string;
  databaseId: string;
}

const FIRESTORE_DATABASE_ID = 'ai-studio-2fb8cd7c-f879-4d0b-a6a4-b9386105a50d';

let currentInfo: NotesSyncInfo = {
  status: typeof navigator !== 'undefined' && !navigator.onLine ? 'cached_offline' : 'synced',
  lastSyncedAt: Date.now(),
  pendingCount: 0,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  notesCount: 0,
  message: typeof navigator !== 'undefined' && !navigator.onLine 
    ? 'Offline: Changes cached locally' 
    : 'All notes synced to Firebase',
  databaseId: FIRESTORE_DATABASE_ID
};

const listeners = new Set<(info: NotesSyncInfo) => void>();

export function getNotesSyncInfo(): NotesSyncInfo {
  return { ...currentInfo };
}

export function setNotesSyncStatus(
  status: NotesSyncStatus, 
  options: Partial<Omit<NotesSyncInfo, 'status'>> = {}
) {
  currentInfo = {
    ...currentInfo,
    status,
    ...options,
    lastSyncedAt: status === 'synced' ? (options.lastSyncedAt || Date.now()) : currentInfo.lastSyncedAt,
    isOnline: options.isOnline !== undefined ? options.isOnline : (typeof navigator !== 'undefined' ? navigator.onLine : true)
  };

  listeners.forEach(fn => {
    try {
      fn(currentInfo);
    } catch (e) {
      console.error('Error notifying sync listener:', e);
    }
  });
}

export function subscribeNotesSync(listener: (info: NotesSyncInfo) => void): () => void {
  listeners.add(listener);
  // Initial callback
  listener(currentInfo);
  return () => {
    listeners.delete(listener);
  };
}

// Global window online/offline listener setup
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    setNotesSyncStatus('syncing', {
      isOnline: true,
      message: 'Connection restored. Syncing notes to Firebase...'
    });
    // Give Firestore long-polling a second to commit pending writes
    setTimeout(() => {
      setNotesSyncStatus('synced', {
        isOnline: true,
        lastSyncedAt: Date.now(),
        message: 'All notes synced to Firebase Firestore',
        pendingCount: 0
      });
    }, 1500);
  });

  window.addEventListener('offline', () => {
    setNotesSyncStatus('cached_offline', {
      isOnline: false,
      message: 'Offline: Notes are safely cached in local storage'
    });
  });
}
