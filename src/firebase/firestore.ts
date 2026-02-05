/**
 * Firestore Service for game progress persistence.
 * Handles saving and loading user progress data.
 */

import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

/**
 * User progress data structure stored in Firestore.
 */
export interface UserProgress {
  current_level: number;
  completed_levels: number[];
  stars: number;
  last_seen: Date | Timestamp;
}

export class FirestoreService {
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  /**
   * Save user progress to Firestore.
   * Uses merge to update only provided fields.
   *
   * @param uid User's Firebase UID
   * @param progress Progress data to save (partial update supported)
   */
  async saveProgress(uid: string, progress: Partial<Omit<UserProgress, 'last_seen'>>): Promise<void> {
    console.log(`[FirestoreService] Saving progress for ${uid}`);

    const userDocRef = doc(this.db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        ...progress,
        last_seen: serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`[FirestoreService] Progress saved for ${uid}`);
  }

  /**
   * Load user progress from Firestore.
   *
   * @param uid User's Firebase UID
   * @returns User progress or null if no document exists
   */
  async loadProgress(uid: string): Promise<UserProgress | null> {
    console.log(`[FirestoreService] Loading progress for ${uid}`);

    const userDocRef = doc(this.db, 'users', uid);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      console.log(`[FirestoreService] No progress found for ${uid}`);
      return null;
    }

    const data = docSnap.data() as UserProgress;
    console.log(`[FirestoreService] Loaded progress for ${uid}:`, data);
    return data;
  }
}
