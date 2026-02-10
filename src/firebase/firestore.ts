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
  level_stars: Record<string, number>;  // e.g. {"1": 3, "2": 2}
  last_seen: Date | Timestamp;
}

/**
 * Economy state data structure stored in Firestore.
 */
export interface EconomyState {
  lives: number;
  bonuses: number;
  lives_regen_start: Timestamp | null;
}

/**
 * Collection progress data structure for a single collection.
 */
export interface CollectionProgress {
  owned_cards: string[];
  pity_streak: number;  // For Phase 15
}

/**
 * Collection state data structure stored in Firestore.
 */
export interface CollectionState {
  collections: {
    [key: string]: CollectionProgress;
  };
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

  /**
   * Save economy state to Firestore.
   * Uses merge to update only provided fields.
   *
   * @param uid User's Firebase UID
   * @param economy Economy data to save (partial update supported)
   */
  async saveEconomy(uid: string, economy: Partial<EconomyState>): Promise<void> {
    console.log(`[FirestoreService] Saving economy for ${uid}`);

    const userDocRef = doc(this.db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        ...economy,
        last_seen: serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`[FirestoreService] Economy saved for ${uid}`);
  }

  /**
   * Load economy state from Firestore.
   *
   * @param uid User's Firebase UID
   * @returns Economy state or null if no document exists
   */
  async loadEconomy(uid: string): Promise<EconomyState | null> {
    console.log(`[FirestoreService] Loading economy for ${uid}`);

    const userDocRef = doc(this.db, 'users', uid);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      console.log(`[FirestoreService] No economy found for ${uid}`);
      return null;
    }

    const data = docSnap.data();
    const economy: EconomyState = {
      lives: data.lives ?? 5,
      bonuses: data.bonuses ?? 500,
      lives_regen_start: data.lives_regen_start ?? null,
    };

    console.log(`[FirestoreService] Loaded economy for ${uid}:`, economy);
    return economy;
  }

  /**
   * Save collection state to Firestore.
   * Uses merge to update only the collections field.
   *
   * @param uid User's Firebase UID
   * @param state Collection state to save
   */
  async saveCollections(uid: string, state: CollectionState): Promise<void> {
    console.log(`[FirestoreService] Saving collections for ${uid}`);

    const userDocRef = doc(this.db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        collections: state.collections,
        last_seen: serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`[FirestoreService] Collections saved for ${uid}`);
  }

  /**
   * Load collection state from Firestore.
   *
   * @param uid User's Firebase UID
   * @returns Collection state or null if no document exists
   */
  async loadCollections(uid: string): Promise<CollectionState | null> {
    console.log(`[FirestoreService] Loading collections for ${uid}`);

    const userDocRef = doc(this.db, 'users', uid);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      console.log(`[FirestoreService] No collections found for ${uid}`);
      return null;
    }

    const data = docSnap.data();

    // Return default state if collections field doesn't exist
    if (!data.collections) {
      console.log(`[FirestoreService] No collections field found for ${uid}, returning default state`);
      return {
        collections: {
          coffee: { owned_cards: [], pity_streak: 0 },
          food: { owned_cards: [], pity_streak: 0 },
          car: { owned_cards: [], pity_streak: 0 },
        },
      };
    }

    const collectionState: CollectionState = {
      collections: data.collections,
    };

    console.log(`[FirestoreService] Loaded collections for ${uid}:`, collectionState);
    return collectionState;
  }
}
