/**
 * Firebase initialization and service exports.
 * Initialize Firebase BEFORE Phaser to avoid race conditions.
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  enableMultiTabIndexedDbPersistence,
} from 'firebase/firestore';
import { firebaseConfig } from './config';
import { AuthService } from './auth';
import { FirestoreService } from './firestore';

// Module-level singletons (initialized lazily via initFirebase)
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let authService: AuthService | null = null;
let firestoreService: FirestoreService | null = null;

/**
 * Initialize Firebase services.
 * Must be called before any Firebase operations.
 *
 * @returns Firebase instances and services with authenticated user UID
 */
export async function initFirebase(): Promise<{
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  authService: AuthService;
  firestoreService: FirestoreService;
  uid: string;
}> {
  // Only initialize once
  if (app && auth && db && authService && firestoreService) {
    const uid = authService.getCurrentUser()?.uid;
    if (uid) {
      return { app, auth, db, authService, firestoreService, uid };
    }
  }

  // Initialize Firebase app
  app = initializeApp(firebaseConfig);
  console.log('[Firebase] App initialized');

  // Get Firebase services
  auth = getAuth(app);
  db = getFirestore(app);

  // Enable offline persistence for multi-tab support
  try {
    await enableMultiTabIndexedDbPersistence(db);
    console.log('[Firebase] Offline persistence enabled');
  } catch (err: unknown) {
    const error = err as { code?: string };
    if (error.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn(
        '[Firebase] Persistence failed: Multiple tabs open. Data will not be available offline in this tab.'
      );
    } else if (error.code === 'unimplemented') {
      // The current browser does not support offline persistence
      console.warn(
        '[Firebase] Persistence unavailable: Browser does not support offline storage.'
      );
    } else {
      console.error('[Firebase] Persistence error:', err);
    }
  }

  // Create service instances
  authService = new AuthService(auth);
  firestoreService = new FirestoreService(db);

  // Sign in anonymously
  const uid = await authService.signInAnonymous();

  return { app, auth, db, authService, firestoreService, uid };
}

// Export getters for lazy access (after initialization)
export function getFirebaseApp(): FirebaseApp {
  if (!app) throw new Error('Firebase not initialized. Call initFirebase() first.');
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) throw new Error('Firebase not initialized. Call initFirebase() first.');
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) throw new Error('Firebase not initialized. Call initFirebase() first.');
  return db;
}

export function getAuthService(): AuthService {
  if (!authService) throw new Error('Firebase not initialized. Call initFirebase() first.');
  return authService;
}

export function getFirestoreService(): FirestoreService {
  if (!firestoreService) throw new Error('Firebase not initialized. Call initFirebase() first.');
  return firestoreService;
}
