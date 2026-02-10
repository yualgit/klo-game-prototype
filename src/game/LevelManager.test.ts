/**
 * Tests for LevelManager class
 * Validates goal tracking, move counting, and win/lose conditions
 */

import { LevelManager } from './LevelManager';
import type { LevelGoal, LevelEvent, TileData, ObstacleData, BoosterType } from './types';

describe('LevelManager', () => {
  describe('Move Counter', () => {
    it('initializes with level moves', () => {
      const levelData = {
        moves: 15,
        goals: [
          {
            type: 'collect' as const,
            item: 'burger' as const,
            count: 10,
            current: 0,
            description: 'Collect 10 fuel'
          }
        ]
      };
      const manager = new LevelManager(levelData);
      expect(manager.getMovesRemaining()).toBe(15);
    });

    it('decrementMoves reduces by 1', () => {
      const levelData = {
        moves: 15,
        goals: [
          {
            type: 'collect' as const,
            item: 'burger' as const,
            count: 10,
            current: 0,
            description: 'Collect 10 fuel'
          }
        ]
      };
      const manager = new LevelManager(levelData);
      manager.decrementMoves();
      expect(manager.getMovesRemaining()).toBe(14);
    });

    it('emits moves_changed event', () => {
      const levelData = {
        moves: 15,
        goals: [
          {
            type: 'collect' as const,
            item: 'burger' as const,
            count: 10,
            current: 0,
            description: 'Collect 10 fuel'
          }
        ]
      };
      const manager = new LevelManager(levelData);
      const events: LevelEvent[] = [];
      manager.subscribe((event) => events.push(event));

      manager.decrementMoves();

      expect(events).toContainEqual({
        type: 'moves_changed',
        movesRemaining: 14
      });
    });
  });

  describe('Collect Goals', () => {
    it('tracks tile matches toward collect goal', () => {
      const levelData = {
        moves: 15,
        goals: [
          {
            type: 'collect' as const,
            item: 'burger' as const,
            count: 20,
            current: 0,
            description: 'Collect 20 fuel'
          }
        ]
      };
      const manager = new LevelManager(levelData);

      const fuelTiles: TileData[] = Array.from({ length: 5 }, (_, i) => ({
        row: 0,
        col: i,
        type: 'burger' as const,
        isEmpty: false,
        id: `fuel-${i}`
      }));

      manager.onTilesMatched(fuelTiles);

      const goals = manager.getGoals();
      expect(goals[0].current).toBe(5);
    });

    it('caps progress at goal count', () => {
      const levelData = {
        moves: 15,
        goals: [
          {
            type: 'collect' as const,
            item: 'burger' as const,
            count: 20,
            current: 0,
            description: 'Collect 20 fuel'
          }
        ]
      };
      const manager = new LevelManager(levelData);

      const fuelTiles: TileData[] = Array.from({ length: 25 }, (_, i) => ({
        row: 0,
        col: i,
        type: 'burger' as const,
        isEmpty: false,
        id: `fuel-${i}`
      }));

      manager.onTilesMatched(fuelTiles);

      const goals = manager.getGoals();
      expect(goals[0].current).toBe(20);
    });

    it('ignores tiles not in goals', () => {
      const levelData = {
        moves: 15,
        goals: [
          {
            type: 'collect' as const,
            item: 'burger' as const,
            count: 20,
            current: 0,
            description: 'Collect 20 fuel'
          }
        ]
      };
      const manager = new LevelManager(levelData);

      const coffeeTiles: TileData[] = Array.from({ length: 5 }, (_, i) => ({
        row: 0,
        col: i,
        type: 'hotdog' as const,
        isEmpty: false,
        id: `coffee-${i}`
      }));

      manager.onTilesMatched(coffeeTiles);

      const goals = manager.getGoals();
      expect(goals[0].current).toBe(0);
    });

    it('tracks multiple goals independently', () => {
      const levelData = {
        moves: 15,
        goals: [
          {
            type: 'collect' as const,
            item: 'burger' as const,
            count: 15,
            current: 0,
            description: 'Collect 15 fuel'
          },
          {
            type: 'collect' as const,
            item: 'hotdog' as const,
            count: 15,
            current: 0,
            description: 'Collect 15 coffee'
          }
        ]
      };
      const manager = new LevelManager(levelData);

      const mixedTiles: TileData[] = [
        ...Array.from({ length: 5 }, (_, i) => ({
          row: 0,
          col: i,
          type: 'burger' as const,
          isEmpty: false,
          id: `fuel-${i}`
        })),
        ...Array.from({ length: 3 }, (_, i) => ({
          row: 1,
          col: i,
          type: 'hotdog' as const,
          isEmpty: false,
          id: `coffee-${i}`
        }))
      ];

      manager.onTilesMatched(mixedTiles);

      const goals = manager.getGoals();
      expect(goals[0].current).toBe(5);
      expect(goals[1].current).toBe(3);
    });
  });

  describe('Destroy Obstacle Goals', () => {
    it('tracks fully destroyed obstacles', () => {
      const levelData = {
        moves: 15,
        goals: [
          {
            type: 'destroy_obstacle' as const,
            obstacleType: 'ice' as const,
            count: 5,
            current: 0,
            description: 'Destroy 5 ice'
          }
        ]
      };
      const manager = new LevelManager(levelData);

      const destroyedObstacles: ObstacleData[] = [
        { type: 'ice', layers: 0 }
      ];

      manager.onObstaclesDestroyed(destroyedObstacles);

      const goals = manager.getGoals();
      expect(goals[0].current).toBe(1);
    });

    it('ignores partially damaged obstacles', () => {
      const levelData = {
        moves: 15,
        goals: [
          {
            type: 'destroy_obstacle' as const,
            obstacleType: 'ice' as const,
            count: 5,
            current: 0,
            description: 'Destroy 5 ice'
          }
        ]
      };
      const manager = new LevelManager(levelData);

      const damagedObstacles: ObstacleData[] = [
        { type: 'ice', layers: 1 }
      ];

      manager.onObstaclesDestroyed(damagedObstacles);

      const goals = manager.getGoals();
      expect(goals[0].current).toBe(0);
    });
  });

  describe('Create Booster Goals', () => {
    it('tracks booster creation', () => {
      const levelData = {
        moves: 15,
        goals: [
          {
            type: 'create_booster' as const,
            boosterType: 'linear_horizontal' as const,
            count: 1,
            current: 0,
            description: 'Create 1 linear horizontal booster'
          }
        ]
      };
      const manager = new LevelManager(levelData);

      manager.onBoosterCreated('linear_horizontal');

      const goals = manager.getGoals();
      expect(goals[0].current).toBe(1);
    });
  });

  describe('Win/Lose Conditions', () => {
    it('emits level_won when all goals complete', () => {
      const levelData = {
        moves: 15,
        goals: [
          {
            type: 'collect' as const,
            item: 'burger' as const,
            count: 3,
            current: 0,
            description: 'Collect 3 fuel'
          }
        ]
      };
      const manager = new LevelManager(levelData);
      const events: LevelEvent[] = [];
      manager.subscribe((event) => events.push(event));

      const fuelTiles: TileData[] = Array.from({ length: 3 }, (_, i) => ({
        row: 0,
        col: i,
        type: 'burger' as const,
        isEmpty: false,
        id: `fuel-${i}`
      }));

      manager.onTilesMatched(fuelTiles);

      expect(events).toContainEqual({ type: 'level_won' });
    });

    it('emits level_won immediately on goal completion (not waiting for moves)', () => {
      const levelData = {
        moves: 15,
        goals: [
          {
            type: 'collect' as const,
            item: 'burger' as const,
            count: 3,
            current: 0,
            description: 'Collect 3 fuel'
          }
        ]
      };
      const manager = new LevelManager(levelData);
      const events: LevelEvent[] = [];
      manager.subscribe((event) => events.push(event));

      const fuelTiles: TileData[] = Array.from({ length: 3 }, (_, i) => ({
        row: 0,
        col: i,
        type: 'burger' as const,
        isEmpty: false,
        id: `fuel-${i}`
      }));

      manager.onTilesMatched(fuelTiles);

      expect(manager.getMovesRemaining()).toBe(15);
      expect(events).toContainEqual({ type: 'level_won' });
    });

    it('emits level_lost when moves exhausted with incomplete goals', () => {
      const levelData = {
        moves: 1,
        goals: [
          {
            type: 'collect' as const,
            item: 'burger' as const,
            count: 20,
            current: 0,
            description: 'Collect 20 fuel'
          }
        ]
      };
      const manager = new LevelManager(levelData);
      const events: LevelEvent[] = [];
      manager.subscribe((event) => events.push(event));

      const fuelTiles: TileData[] = Array.from({ length: 3 }, (_, i) => ({
        row: 0,
        col: i,
        type: 'burger' as const,
        isEmpty: false,
        id: `fuel-${i}`
      }));

      manager.onTilesMatched(fuelTiles);
      manager.decrementMoves();

      expect(events).toContainEqual({ type: 'level_lost' });
    });

    it('does NOT emit level_lost if goals complete on last move', () => {
      const levelData = {
        moves: 1,
        goals: [
          {
            type: 'collect' as const,
            item: 'burger' as const,
            count: 3,
            current: 0,
            description: 'Collect 3 fuel'
          }
        ]
      };
      const manager = new LevelManager(levelData);
      const events: LevelEvent[] = [];
      manager.subscribe((event) => events.push(event));

      const fuelTiles: TileData[] = Array.from({ length: 3 }, (_, i) => ({
        row: 0,
        col: i,
        type: 'burger' as const,
        isEmpty: false,
        id: `fuel-${i}`
      }));

      manager.onTilesMatched(fuelTiles);
      manager.decrementMoves();

      expect(events).toContainEqual({ type: 'level_won' });
      expect(events).not.toContainEqual({ type: 'level_lost' });
    });
  });
});
