import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  setLogLevel
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence non-fatal backend probing warnings so transient sandbox latency doesn't trigger error banners
setLogLevel('silent');

const app = initializeApp(firebaseConfig);
const FIRESTORE_DATABASE_ID =
  (firebaseConfig as any).firestoreDatabaseId || 'ai-studio-2fb8cd7c-f879-4d0b-a6a4-b9386105a50d';

export const db = (() => {
  try {
    return initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true
      },
      FIRESTORE_DATABASE_ID
    );
  } catch {
    return getFirestore(app, FIRESTORE_DATABASE_ID);
  }
})();
export const auth = getAuth(app);
export const storage = getStorage(app);

// Re-configure Firebase Auth persistence for robust multi-platform session stability (Web & Android WebView / PWA)
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Auth persistence initialization note:", err);
});

// In-memory access token cache (Workspace Integration Skill requirement: never store in localStorage)
let cachedAccessToken: string | null = null;

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleProvider = new GoogleAuthProvider();
// Google Classroom & Gmail Transactional Scopes (Workspace Integration)
googleProvider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/classroom.coursework.me');
googleProvider.addScope('https://www.googleapis.com/auth/classroom.announcements.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/classroom.rosters.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const appleProvider = new OAuthProvider('apple.com');
export const microsoftProvider = new OAuthProvider('microsoft.com');

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errCode = (error as any)?.code;
  const errMsg = (error as any)?.message || String(error);

  // When offline, unavailable, permission-denied without session, or connection is establishing, operate gracefully
  if (
    errCode === 'unavailable' ||
    errCode === 'failed-precondition' ||
    errCode === 'cancelled' ||
    errCode === 'permission-denied' ||
    errMsg.includes('unavailable') ||
    errMsg.includes('offline') ||
    errMsg.includes('Could not reach Cloud Firestore backend') ||
    errMsg.includes('the client is offline') ||
    errMsg.includes('Missing or insufficient permissions')
  ) {
    console.warn(`Firestore notice (${operationType} on ${path}): ${errMsg}`);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  console.warn('Firestore operation notice: ', JSON.stringify(errInfo));
}
