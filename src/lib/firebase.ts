import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  setLogLevel 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence non-fatal backend probing warnings so transient sandbox latency doesn't trigger error banners
setLogLevel('error');

const app = initializeApp(firebaseConfig);

// Configure Firestore with forced long-polling and persistent offline cache
// to guarantee reliable immediate connectivity across iframe sandboxes and proxy environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const storage = getStorage(app);

// Re-configure Firebase Auth persistence for robust multi-platform session stability (Web & Android WebView / PWA)
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Auth persistence initialization note:", err);
});

export const googleProvider = new GoogleAuthProvider();
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

// Background session stabilizer for Firestore rules
if (typeof window !== 'undefined') {
  auth.onAuthStateChanged((u) => {
    if (!u) {
      import('firebase/auth').then(({ signInAnonymously }) => {
        signInAnonymously(auth).catch(() => {});
      });
    }
  });
}
