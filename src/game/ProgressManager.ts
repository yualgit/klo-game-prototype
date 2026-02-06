/**
 * ProgressManager - Singleton wrapping Firebase progress + star logic.
 * Loaded once in main.ts, stored in Phaser registry for scene access.
 */

import { FirestoreService, UserProgress } from '../firebase/firestore';

export class ProgressManager {
  private firestoreService: FirestoreService;
  private uid: string;
  private progress: UserProgress;

  constructor(firestoreService: FirestoreService, uid: string, progress: UserProgress) {
    this.firestoreService = firestoreService;
    this.uid = uid;
    this.progress = progress;

    // Ensure level_stars exists for backwards compat
    if (!this.progress.level_stars) {
      this.progress.level_stars = {};
    }
  }

  /**
   * Check if a level is unlocked.
   * Level 1 is always unlocked. Others require previous level completed.
   */
  isLevelUnlocked(levelId: number): boolean {
    if (levelId === 1) return true;
    return this.progress.completed_levels.includes(levelId - 1);
  }

  /**
   * Get stars earned for a specific level (0-3).
   */
  getStars(levelId: number): number {
    return this.progress.level_stars[String(levelId)] || 0;
  }

  /**
   * Get the highest unlocked level number.
   */
  getMaxUnlockedLevel(): number {
    if (this.progress.completed_levels.length === 0) return 1;
    return Math.max(...this.progress.completed_levels) + 1;
  }

  /**
   * Complete a level and calculate stars.
   * Stars: 3 if >50% moves left, 2 if >25%, 1 otherwise.
   */
  completeLevel(
    levelId: number,
    movesUsed: number,
    totalMoves: number
  ): { stars: number; isNewBest: boolean } {
    const movesLeft = totalMoves - movesUsed;
    const ratio = movesLeft / totalMoves;

    let stars: number;
    if (ratio > 0.5) {
      stars = 3;
    } else if (ratio > 0.25) {
      stars = 2;
    } else {
      stars = 1;
    }

    const previousStars = this.getStars(levelId);
    const isNewBest = stars > previousStars;

    // Update level stars (keep best)
    if (isNewBest) {
      this.progress.level_stars[String(levelId)] = stars;
    }

    // Add to completed levels if not already there
    if (!this.progress.completed_levels.includes(levelId)) {
      this.progress.completed_levels.push(levelId);
    }

    // Update current level to next
    const nextLevel = levelId + 1;
    if (nextLevel > this.progress.current_level) {
      this.progress.current_level = nextLevel;
    }

    // Recalculate total stars
    this.progress.stars = Object.values(this.progress.level_stars).reduce(
      (sum, s) => sum + s,
      0
    );

    return { stars, isNewBest };
  }

  /**
   * Save current progress to Firebase.
   */
  async saveProgress(): Promise<void> {
    await this.firestoreService.saveProgress(this.uid, {
      current_level: this.progress.current_level,
      completed_levels: this.progress.completed_levels,
      stars: this.progress.stars,
      level_stars: this.progress.level_stars,
    });
  }

  /**
   * Get the full progress object (read-only snapshot).
   */
  getProgress(): UserProgress {
    return { ...this.progress };
  }
}
