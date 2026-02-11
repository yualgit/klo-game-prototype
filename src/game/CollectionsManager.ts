/**
 * CollectionsManager - Singleton managing user's card collection state.
 * Loaded once in main.ts, stored in Phaser registry for scene access.
 *
 * Extends Phaser.Events.EventEmitter to emit reactive collection updates:
 * - 'collection-exchangeable' - emitted when any collection just reached 6/6
 * - 'collection-exchanged' (collectionId: string) - emitted after successful exchange
 * - 'no-exchangeable-collections' - emitted when no collections are 6/6 anymore
 */

import Phaser from 'phaser';
import { FirestoreService, CollectionState } from '../firebase/firestore';
import { getCardsForCollection } from './collectionConfig';

export class CollectionsManager extends Phaser.Events.EventEmitter {
  private firestoreService: FirestoreService;
  private uid: string;
  private state: CollectionState;

  constructor(firestoreService: FirestoreService, uid: string, initialState: CollectionState) {
    super(); // EventEmitter constructor

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
   * Get the number of times a specific card has been acquired.
   */
  getCardCount(collectionId: string, cardId: string): number {
    const collection = this.state.collections[collectionId];
    if (!collection?.card_counts) return 0;
    return collection.card_counts[cardId] ?? 0;
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

    // Check if collection was complete before adding
    const wasComplete = this.isCollectionComplete(collectionId);

    // Add card
    collection.owned_cards.push(cardId);
    console.log(`[CollectionsManager] Added card ${cardId} to ${collectionId}. Progress: ${collection.owned_cards.length}/6`);

    // Track card count
    if (!collection.card_counts) collection.card_counts = {};
    collection.card_counts[cardId] = (collection.card_counts[cardId] ?? 0) + 1;

    // Save to Firestore
    await this.save();

    // Emit event if collection just became complete
    if (!wasComplete && this.isCollectionComplete(collectionId)) {
      this.emit('collection-exchangeable');
    }

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

    // Check if collection was complete before selecting
    const wasComplete = this.isCollectionComplete(collectionId);

    const isNew = !collection.owned_cards.includes(cardId);

    if (isNew) {
      collection.owned_cards.push(cardId);
      collection.pity_streak = 0;
      console.log(`[CollectionsManager] New card ${cardId} added to ${collectionId}. Pity reset.`);
    } else {
      collection.pity_streak++;
      console.log(`[CollectionsManager] Duplicate ${cardId} in ${collectionId}. Pity: ${collection.pity_streak}`);
    }

    // Track card count (both new and duplicate)
    if (!collection.card_counts) collection.card_counts = {};
    collection.card_counts[cardId] = (collection.card_counts[cardId] ?? 0) + 1;

    await this.save();

    // Emit event if collection just became complete
    if (!wasComplete && this.isCollectionComplete(collectionId)) {
      this.emit('collection-exchangeable');
    }

    return isNew;
  }

  /**
   * Check if any collection is ready for exchange (has all 6 cards).
   */
  hasExchangeableCollection(): boolean {
    const collectionIds = ['coffee', 'food', 'car'];
    return collectionIds.some((id) => this.isCollectionComplete(id));
  }

  /**
   * Exchange a complete collection.
   * Deducts one of each card from card_counts, removes cards with 0 count from owned_cards.
   * Resets pity_streak to 0.
   * Returns true if successful, false if collection is not complete.
   */
  async exchangeCollection(collectionId: string): Promise<boolean> {
    // Guard: collection must be complete
    if (!this.isCollectionComplete(collectionId)) {
      console.error(`[CollectionsManager] Cannot exchange incomplete collection: ${collectionId}`);
      return false;
    }

    const collection = this.state.collections[collectionId];
    const cards = getCardsForCollection(collectionId);

    // Deduct one of each card
    for (const card of cards) {
      const cardId = card.id;

      // Decrement card count
      if (!collection.card_counts) collection.card_counts = {};
      collection.card_counts[cardId] = (collection.card_counts[cardId] ?? 0) - 1;

      // Remove from owned_cards if count reaches 0
      if (collection.card_counts[cardId] <= 0) {
        const index = collection.owned_cards.indexOf(cardId);
        if (index > -1) {
          collection.owned_cards.splice(index, 1);
        }
        delete collection.card_counts[cardId];
      }
    }

    // Reset pity streak
    collection.pity_streak = 0;

    console.log(`[CollectionsManager] Exchanged collection ${collectionId}. Remaining progress: ${collection.owned_cards.length}/6`);

    // Emit events
    this.emit('collection-exchanged', collectionId);
    if (!this.hasExchangeableCollection()) {
      this.emit('no-exchangeable-collections');
    }

    // Save to Firestore
    await this.save();

    return true;
  }

  /**
   * Save current collection state to Firestore.
   */
  private async save(): Promise<void> {
    await this.firestoreService.saveCollections(this.uid, this.state);
  }
}
