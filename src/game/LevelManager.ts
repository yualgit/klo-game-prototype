/**
 * LevelManager - Manages level state, goals, moves, and win/lose conditions
 *
 * Responsibilities:
 * - Track and update goals (collect, destroy_obstacle, create_booster)
 * - Track move counter
 * - Evaluate win/lose conditions
 * - Emit events for state changes (moves_changed, level_won, level_lost)
 *
 * Design: Uses observer pattern to decouple from game engine and rendering
 */

import type { LevelGoal, LevelEvent, TileData, ObstacleData, BoosterType, TileType } from './types';

export class LevelManager {
  private movesRemaining: number;
  private goals: LevelGoal[];
  private listeners: Array<(event: LevelEvent) => void> = [];
  private levelComplete: boolean = false;

  constructor(levelData: { moves: number; goals: LevelGoal[] }) {
    this.movesRemaining = levelData.moves;
    // Initialize goals with current set to 0
    this.goals = levelData.goals.map(g => ({ ...g, current: 0 }));
  }

  /**
   * Get current moves remaining
   */
  getMovesRemaining(): number {
    return this.movesRemaining;
  }

  /**
   * Get copy of current goals
   */
  getGoals(): LevelGoal[] {
    return [...this.goals];
  }

  /**
   * Subscribe to level events
   */
  subscribe(listener: (event: LevelEvent) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Decrement move counter and check for lose condition
   */
  decrementMoves(): void {
    if (this.levelComplete) return;

    this.movesRemaining--;
    this.notify({ type: 'moves_changed', movesRemaining: this.movesRemaining });

    // Check lose condition: moves exhausted with incomplete goals
    if (this.movesRemaining <= 0 && !this.allGoalsComplete()) {
      this.levelComplete = true;
      this.notify({ type: 'level_lost' });
    }
  }

  /**
   * Handle tiles matched - updates collect goals
   */
  onTilesMatched(tiles: TileData[]): void {
    if (this.levelComplete) return;

    // Count tiles by type
    const tileCounts = new Map<TileType, number>();
    for (const tile of tiles) {
      if (tile.type !== 'empty') {
        tileCounts.set(tile.type, (tileCounts.get(tile.type) || 0) + 1);
      }
    }

    // Update collect goals
    for (const goal of this.goals) {
      if (goal.type === 'collect' && goal.item) {
        const matchedCount = tileCounts.get(goal.item) || 0;
        if (matchedCount > 0) {
          // Cap progress at goal count
          goal.current = Math.min(goal.current + matchedCount, goal.count);
        }
      }
    }

    this.checkWin();
  }

  /**
   * Handle obstacles destroyed - updates destroy_obstacle goals
   */
  onObstaclesDestroyed(obstacles: ObstacleData[]): void {
    if (this.levelComplete) return;

    // Count fully destroyed obstacles by type (layers === 0)
    const destroyedCounts = new Map<string, number>();
    for (const obstacle of obstacles) {
      if (obstacle.layers === 0) {
        destroyedCounts.set(obstacle.type, (destroyedCounts.get(obstacle.type) || 0) + 1);
      }
    }

    // Update destroy_obstacle goals
    for (const goal of this.goals) {
      if (goal.type === 'destroy_obstacle' && goal.obstacleType) {
        const destroyedCount = destroyedCounts.get(goal.obstacleType) || 0;
        if (destroyedCount > 0) {
          // Cap progress at goal count
          goal.current = Math.min(goal.current + destroyedCount, goal.count);
        }
      }
    }

    this.checkWin();
  }

  /**
   * Handle booster created - updates create_booster goals
   */
  onBoosterCreated(boosterType: BoosterType): void {
    if (this.levelComplete) return;

    // Update create_booster goals
    for (const goal of this.goals) {
      if (goal.type === 'create_booster' && goal.boosterType === boosterType) {
        // Cap progress at goal count
        goal.current = Math.min(goal.current + 1, goal.count);
      }
    }

    this.checkWin();
  }

  /**
   * Check if all goals are complete
   */
  private allGoalsComplete(): boolean {
    return this.goals.every(g => g.current >= g.count);
  }

  /**
   * Check win condition and emit event if met
   * Win condition: all goals complete (regardless of moves remaining)
   */
  private checkWin(): void {
    if (this.allGoalsComplete() && !this.levelComplete) {
      this.levelComplete = true;
      this.notify({ type: 'level_won' });
    }
  }

  /**
   * Notify all listeners of an event
   */
  private notify(event: LevelEvent): void {
    this.listeners.forEach(listener => listener(event));
  }
}
