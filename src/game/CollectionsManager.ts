/**
 * CollectionsManager - Singleton managing user's card collection state.
 * Loaded once in main.ts, stored in Phaser registry for scene access.
 *
 * Follows EconomyManager pattern but does NOT extend EventEmitter yet.
 * Event emission will be added in Phase 16 for notification dot functionality.
 */

import { FirestoreService, CollectionState } from '../firebase/firestore';
import { getCardsForCollection } from './collectionConfig';

export class CollectionsManager {
  private firestoreService: FirestoreService;
  private uid: string;
  private state: CollectionState;

  constructor(firestoreService: FirestoreService, uid: string, initialState: CollectionState) {
    this.firestoreService = firestoreService;
    this.uid = uid;
    this.state = initialState;

    console.log('[CollectionsManager] Initialized with state:', this.state);
  }

  /**
   * Check if a specific card is owned.
   */
  isCardOwned(collectionId: string, cardId: string): boolean {
    const collection = this.state.collections[collectionId];
    if (!collection) {
      return false;
    }
    return collection.owned_cards.includes(cardId);
  }

  /**
   * Get all owned card IDs for a collection.
   */
  getOwnedCards(collectionId: string): string[] {
    const collection = this.state.collections[collectionId];
    if (!collection) {
      return [];
    }
    return [...collection.owned_cards]; // return copy
  }

  /**
   * Get collection progress (owned vs total).
   */
  getProgress(collectionId: string): { owned: number; total: number } {
    const collection = this.state.collections[collectionId];
    const ownedCount = collection ? collection.owned_cards.length : 0;
    const totalCards = getCardsForCollection(collectionId).length;

    return {
      owned: ownedCount,
      total: totalCards,
    };
  }

  /**
   * Check if collection is complete (all 6 cards owned).
   */
  isCollectionComplete(collectionId: string): boolean {
    const progress = this.getProgress(collectionId);
    return progress.owned === progress.total;
  }

  /**
   * Get a shallow copy of the current collection state.
   */
  getState(): CollectionState {
    return {
      collections: {
        ...this.state.collections,
      },
    };
  }

  /**
   * Add a card to a collection (for Phase 15 card acquisition).
   * Returns false if card is already owned (duplicate check).
   * Saves to Firestore after adding.
   */
  async addCard(collectionId: string, cardId: string): Promise<boolean> {
    const collection = this.state.collections[collectionId];

    if (!collection) {
      console.error(`[CollectionsManager] Invalid collection: ${collectionId}`);
      return false;
    }

    // Duplicate check
    if (collection.owned_cards.includes(cardId)) {
      console.log(`[CollectionsManager] Card ${cardId} already owned in ${collectionId}`);
      return false;
    }

    // Add card
    collection.owned_cards.push(cardId);
    console.log(`[CollectionsManager] Added card ${cardId} to ${collectionId}. Progress: ${collection.owned_cards.length}/6`);

    // Save to Firestore
    await this.save();

    return true;
  }

  /**
   * Get current pity streak for a collection.
   */
  getPityStreak(collectionId: string): number {
    const collection = this.state.collections[collectionId];
    return collection?.pity_streak ?? 0;
  }

  /**
   * Add a selected card to collection and update pity streak.
   * New card: push to owned_cards, reset pity_streak to 0.
   * Duplicate: increment pity_streak (card NOT added again).
   * Saves to Firestore after updating.
   * Returns true if card is new, false if duplicate.
   */
  async selectCard(collectionId: string, cardId: string): Promise<boolean> {
    const collection = this.state.collections[collectionId];
    if (!collection) {
      console.error(`[CollectionsManager] Invalid collection: ${collectionId}`);
      return false;
    }

    const isNew = !collection.owned_cards.includes(cardId);

    if (isNew) {
      collection.owned_cards.push(cardId);
      collection.pity_streak = 0;
      console.log(`[CollectionsManager] New card ${cardId} added to ${collectionId}. Pity reset.`);
    } else {
      collection.pity_streak++;
      console.log(`[CollectionsManager] Duplicate ${cardId} in ${collectionId}. Pity: ${collection.pity_streak}`);
    }

    await this.save();
    return isNew;
  }

  /**
   * Save current collection state to Firestore.
   */
  private async save(): Promise<void> {
    await this.firestoreService.saveCollections(this.uid, this.state);
  }
}
