/**
 * EconomyManager - Singleton managing lives and bonuses with regeneration logic.
 * Loaded once in main.ts, stored in Phaser registry for scene access.
 *
 * Extends Phaser.Events.EventEmitter to emit reactive economy updates:
 * - 'lives-changed' (lives: number) - emitted whenever lives count changes
 * - 'bonuses-changed' (bonuses: number) - emitted whenever bonuses count changes
 */

import Phaser from 'phaser';
import { Timestamp } from 'firebase/firestore';
import { FirestoreService, EconomyState } from '../firebase/firestore';

export class EconomyManager extends Phaser.Events.EventEmitter {
  private static readonly MAX_LIVES = 5;
  private static readonly REGEN_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
  private static readonly REFILL_COST = 15;
  private static readonly DEFAULT_LIVES = 5;
  private static readonly DEFAULT_BONUSES = 500;

  private firestoreService: FirestoreService;
  private uid: string;
  private state: EconomyState;
  private lastRecalcTime: number;

  constructor(firestoreService: FirestoreService, uid: string, initialState: EconomyState) {
    super(); // EventEmitter constructor

    this.firestoreService = firestoreService;
    this.uid = uid;
    this.state = initialState;
    this.lastRecalcTime = 0;

    console.log('[EconomyManager] Initialized with state:', this.state);
  }

  /**
   * Get current lives count.
   * Automatically recalculates regeneration before returning.
   */
  getLives(): number {
    this.recalculateLives();
    return this.state.lives;
  }

  /**
   * Get current bonuses count.
   */
  getBonuses(): number {
    return this.state.bonuses;
  }

  /**
   * Check if user can start a level (has at least 1 life).
   */
  canStartLevel(): boolean {
    this.recalculateLives();
    return this.state.lives > 0;
  }

  /**
   * Get seconds until next life regenerates.
   * Returns 0 if lives are at max or not regenerating.
   */
  getSecondsUntilNextLife(): number {
    if (this.state.lives >= EconomyManager.MAX_LIVES || !this.state.lives_regen_start) {
      return 0;
    }

    const elapsedMs = Date.now() - this.state.lives_regen_start.toMillis();
    const remainderMs = elapsedMs % EconomyManager.REGEN_INTERVAL_MS;
    const msUntilNext = EconomyManager.REGEN_INTERVAL_MS - remainderMs;

    return Math.ceil(msUntilNext / 1000);
  }

  /**
   * Lose one life (called when starting a level).
   * Returns false if no lives available.
   */
  async loseLife(): Promise<boolean> {
    if (this.state.lives <= 0) {
      console.log('[EconomyManager] Cannot lose life: no lives available');
      return false;
    }

    this.state.lives--;
    console.log('[EconomyManager] Lost life. Lives remaining:', this.state.lives);

    // Emit lives changed event for reactive UI updates
    this.emit('lives-changed', this.state.lives);

    // Start regeneration timer if just dropped below max
    if (this.state.lives < EconomyManager.MAX_LIVES && !this.state.lives_regen_start) {
      this.state.lives_regen_start = Timestamp.now();
      console.log('[EconomyManager] Started regeneration timer');
    }

    await this.save();
    return true;
  }

  /**
   * Spend bonuses to refill lives to max.
   * Returns false if not enough bonuses.
   */
  async spendBonusesForRefill(): Promise<boolean> {
    if (this.state.bonuses < EconomyManager.REFILL_COST) {
      console.log('[EconomyManager] Cannot refill: not enough bonuses');
      return false;
    }

    this.state.bonuses -= EconomyManager.REFILL_COST;
    this.state.lives = EconomyManager.MAX_LIVES;
    this.state.lives_regen_start = null;

    console.log('[EconomyManager] Refilled lives to max. Bonuses remaining:', this.state.bonuses);

    // Emit both events for reactive UI updates
    this.emit('lives-changed', this.state.lives);
    this.emit('bonuses-changed', this.state.bonuses);

    await this.save();
    return true;
  }

  /**
   * Add bonuses (e.g., from collection exchange).
   * Emits 'bonuses-changed' event for reactive UI updates.
   */
  async addBonuses(amount: number): Promise<void> {
    this.state.bonuses += amount;
    console.log('[EconomyManager] Added', amount, 'bonuses. Total:', this.state.bonuses);

    // Emit bonuses changed event for reactive UI updates
    this.emit('bonuses-changed', this.state.bonuses);

    await this.save();
  }

  /**
   * Get a shallow copy of the current economy state.
   */
  getState(): EconomyState {
    return { ...this.state };
  }

  /**
   * Recalculate lives based on regeneration timer.
   * Throttled to once per second to avoid excessive calculations.
   */
  private recalculateLives(): void {
    const now = Date.now();

    // Throttle to max once per second
    if (now - this.lastRecalcTime < 1000) {
      return;
    }
    this.lastRecalcTime = now;

    // No regeneration if at max or no timer started
    if (this.state.lives >= EconomyManager.MAX_LIVES || !this.state.lives_regen_start) {
      return;
    }

    const elapsedMs = now - this.state.lives_regen_start.toMillis();
    const livesGained = Math.floor(elapsedMs / EconomyManager.REGEN_INTERVAL_MS);

    if (livesGained > 0) {
      this.state.lives = Math.min(
        this.state.lives + livesGained,
        EconomyManager.MAX_LIVES
      );

      console.log('[EconomyManager] Regenerated', livesGained, 'lives. Current:', this.state.lives);

      // Emit lives changed event for reactive UI updates
      this.emit('lives-changed', this.state.lives);

      if (this.state.lives >= EconomyManager.MAX_LIVES) {
        // Reached max - stop regeneration
        this.state.lives_regen_start = null;
        console.log('[EconomyManager] Reached max lives, stopped regeneration');
      } else {
        // Advance timer by the amount of regenerated lives
        const newStartMs = this.state.lives_regen_start.toMillis() +
          (livesGained * EconomyManager.REGEN_INTERVAL_MS);
        this.state.lives_regen_start = Timestamp.fromMillis(newStartMs);
      }

      // Fire-and-forget save
      this.save().catch(err => {
        console.error('[EconomyManager] Failed to save after regeneration:', err);
      });
    }
  }

  /**
   * Save current economy state to Firestore.
   */
  private async save(): Promise<void> {
    await this.firestoreService.saveEconomy(this.uid, {
      lives: this.state.lives,
      bonuses: this.state.bonuses,
      lives_regen_start: this.state.lives_regen_start,
    });
  }
}
