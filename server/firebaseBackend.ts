/**
 * Firebase Backend Service for Study Top 2.0
 * Connects Express Server directly to Cloud Firestore & Firebase Auth services.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  setLogLevel,
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

setLogLevel('silent');

// Load Firebase configuration
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig: any = {};

try {
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (err) {
  console.warn('[Firebase Backend] Unable to read firebase-applet-config.json:', err);
}

// Initialize backend Firebase App instance
const appName = 'study-top-backend-firebase';
const firebaseApp = getApps().find(a => a.name === appName) 
  ? getApp(appName)
  : initializeApp(firebaseConfig, appName);

const resolvedDatabaseId =
  firebaseConfig.firestoreDatabaseId || 'ai-studio-2fb8cd7c-f879-4d0b-a6a4-b9386105a50d';

// Initialize backend Firestore with provisioned database ID
export const backendFirestore: Firestore = getFirestore(firebaseApp, resolvedDatabaseId);

export const firebaseBackendService = {
  /**
   * Return public configuration safely
   */
  getConfig() {
    return {
      projectId: firebaseConfig.projectId || '',
      appId: firebaseConfig.appId || '',
      apiKey: firebaseConfig.apiKey || '',
      authDomain: firebaseConfig.authDomain || '',
      firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || '',
      storageBucket: firebaseConfig.storageBucket || '',
      messagingSenderId: firebaseConfig.messagingSenderId || '',
      oAuthClientId: firebaseConfig.oAuthClientId || ''
    };
  },

  /**
   * Health and connectivity status
   */
  async getStatus() {
    try {
      return {
        configured: !!firebaseConfig.projectId,
        projectId: firebaseConfig.projectId,
        databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
        authDomain: firebaseConfig.authDomain,
        timestamp: Date.now()
      };
    } catch (err: any) {
      return {
        configured: false,
        error: err.message
      };
    }
  },

  /**
   * Sync user account into Cloud Firestore
   */
  async syncUser(user: { uid: string; email: string; displayName?: string; photoURL?: string; role?: string }) {
    if (!user.uid) throw new Error('User UID is required');
    const userRef = doc(backendFirestore, 'users', user.uid);
    const existingSnap = await getDoc(userRef);

    const dataToSave = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Student',
      photoURL: user.photoURL || '',
      role: user.role || 'student',
      lastLoginAt: Date.now(),
      updatedAt: Date.now()
    };

    if (!existingSnap.exists()) {
      await setDoc(userRef, {
        ...dataToSave,
        createdAt: Date.now()
      });
    } else {
      await setDoc(userRef, dataToSave, { merge: true });
    }

    return { success: true, uid: user.uid };
  },

  /**
   * Save a note to Cloud Firestore from backend
   */
  async saveNote(note: {
    id: string;
    userId: string;
    title: string;
    content: string;
    categoryId?: string;
    tags?: string[];
  }) {
    if (!note.id || !note.userId) throw new Error('Note ID and User ID are required');
    const noteRef = doc(backendFirestore, 'notes', note.id);
    await setDoc(noteRef, {
      ...note,
      updatedAt: Date.now()
    }, { merge: true });

    return { success: true, noteId: note.id };
  },

  /**
   * Retrieve notes for a user from Cloud Firestore
   */
  async getUserNotes(userId: string) {
    if (!userId) return [];
    const notesQuery = query(collection(backendFirestore, 'notes'), where('userId', '==', userId));
    const querySnapshot = await getDocs(notesQuery);
    const notes: any[] = [];
    querySnapshot.forEach(docSnap => {
      notes.push({ id: docSnap.id, ...docSnap.data() });
    });
    return notes;
  }
};
