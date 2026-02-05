import { Match3Engine } from './Match3Engine';
import { SpawnRules, TileType } from './types';

describe('Match3Engine', () => {
  let engine: Match3Engine;
  const defaultSpawnRules: SpawnRules = {
    fuel: 0.25,
    coffee: 0.25,
    snack: 0.25,
    road: 0.25,
  };

  beforeEach(() => {
    engine = new Match3Engine(8, 8);
  });

  describe('Grid Generation', () => {
    test('generates grid without initial matches', () => {
      engine.generateGrid(defaultSpawnRules);
      const matches = engine.findMatches();
      expect(matches.length).toBe(0);
    });

    test('generates grid with correct dimensions', () => {
      engine.generateGrid(defaultSpawnRules);
      const grid = engine.getGrid();
      expect(grid.length).toBe(8);
      expect(grid[0].length).toBe(8);
    });

    test('all tiles are non-empty initially', () => {
      engine.generateGrid(defaultSpawnRules);
      const grid = engine.getGrid();
      grid.forEach(row => {
        row.forEach(tile => {
          expect(tile.isEmpty).toBe(false);
          expect(tile.type).not.toBe('empty');
        });
      });
    });
  });

  describe('Swap Operation', () => {
    test('swaps two adjacent tiles', () => {
      engine.generateGrid(defaultSpawnRules);
      const grid = engine.getGrid();
      const tile1Type = grid[0][0].type;
      const tile2Type = grid[0][1].type;

      engine.swapTiles(0, 0, 0, 1);

      const newGrid = engine.getGrid();
      expect(newGrid[0][0].type).toBe(tile2Type);
      expect(newGrid[0][1].type).toBe(tile1Type);
    });

    test('returns movement data for animation', () => {
      engine.generateGrid(defaultSpawnRules);
      const movements = engine.swapTiles(0, 0, 0, 1);

      expect(movements.length).toBe(2);
      expect(movements[0].fromRow).toBe(0);
      expect(movements[0].fromCol).toBe(0);
      expect(movements[0].toRow).toBe(0);
      expect(movements[0].toCol).toBe(1);
    });
  });

  describe('Match Detection', () => {
    test('detects horizontal match of 3', () => {
      // Create a controlled grid
      engine.generateGrid(defaultSpawnRules);
      const grid = engine.getGrid();

      // Manually set 3 in a row
      grid[0][0].type = 'fuel';
      grid[0][1].type = 'fuel';
      grid[0][2].type = 'fuel';

      const matches = engine.findMatches();
      expect(matches.length).toBeGreaterThan(0);
      const horizontalMatch = matches.find(m => m.direction === 'horizontal');
      expect(horizontalMatch).toBeDefined();
    });

    test('detects vertical match of 3', () => {
      engine.generateGrid(defaultSpawnRules);
      const grid = engine.getGrid();

      // Manually set 3 in a column
      grid[0][0].type = 'coffee';
      grid[1][0].type = 'coffee';
      grid[2][0].type = 'coffee';

      const matches = engine.findMatches();
      expect(matches.length).toBeGreaterThan(0);
      const verticalMatch = matches.find(m => m.direction === 'vertical');
      expect(verticalMatch).toBeDefined();
    });

    test('detects match of 4', () => {
      engine.generateGrid(defaultSpawnRules);
      const grid = engine.getGrid();

      grid[0][0].type = 'snack';
      grid[0][1].type = 'snack';
      grid[0][2].type = 'snack';
      grid[0][3].type = 'snack';

      const matches = engine.findMatches();
      expect(matches.length).toBeGreaterThan(0);
      const match = matches.find(m => m.tiles.length === 4);
      expect(match).toBeDefined();
    });

    test('does not detect non-adjacent same tiles', () => {
      engine.generateGrid(defaultSpawnRules);
      const grid = engine.getGrid();

      // Set pattern: fuel, road, fuel
      grid[0][0].type = 'fuel';
      grid[0][1].type = 'road';
      grid[0][2].type = 'fuel';

      const matches = engine.findMatches();
      const fuelMatches = matches.filter(m =>
        m.tiles.some(t => t.row === 0 && t.col <= 2)
      );
      expect(fuelMatches.length).toBe(0);
    });
  });

  describe('Remove Matches', () => {
    test('marks matched tiles as empty', () => {
      engine.generateGrid(defaultSpawnRules);
      const grid = engine.getGrid();

      grid[0][0].type = 'fuel';
      grid[0][1].type = 'fuel';
      grid[0][2].type = 'fuel';

      const matches = engine.findMatches();
      engine.removeMatches(matches);

      const newGrid = engine.getGrid();
      expect(newGrid[0][0].isEmpty).toBe(true);
      expect(newGrid[0][1].isEmpty).toBe(true);
      expect(newGrid[0][2].isEmpty).toBe(true);
    });
  });

  describe('Gravity', () => {
    test('tiles fall down to fill empty spaces', () => {
      engine.generateGrid(defaultSpawnRules);
      const grid = engine.getGrid();

      // Create empty space at row 7 (bottom), put tile at row 0
      const topTileType = grid[0][0].type;
      grid[7][0].isEmpty = true;
      grid[7][0].type = 'empty';

      const movements = engine.applyGravity();
      const newGrid = engine.getGrid();

      // Check that top tile fell down
      expect(movements.length).toBeGreaterThan(0);
      expect(newGrid[7][0].isEmpty).toBe(false);
    });

    test('returns movement data for all falling tiles', () => {
      engine.generateGrid(defaultSpawnRules);
      const grid = engine.getGrid();

      // Remove entire bottom row
      for (let col = 0; col < 8; col++) {
        grid[7][col].isEmpty = true;
        grid[7][col].type = 'empty';
      }

      const movements = engine.applyGravity();
      // Should have movements for many tiles falling
      expect(movements.length).toBeGreaterThan(0);
    });
  });

  describe('Spawn New Tiles', () => {
    test('fills empty cells from top', () => {
      engine.generateGrid(defaultSpawnRules);
      const grid = engine.getGrid();

      // Create empty cells at top
      grid[0][0].isEmpty = true;
      grid[0][0].type = 'empty';
      grid[0][1].isEmpty = true;
      grid[0][1].type = 'empty';

      const spawns = engine.spawnNewTiles(defaultSpawnRules);
      const newGrid = engine.getGrid();

      expect(spawns.length).toBe(2);
      expect(newGrid[0][0].isEmpty).toBe(false);
      expect(newGrid[0][1].isEmpty).toBe(false);
    });

    test('respects spawn rules probabilities', () => {
      const customRules: SpawnRules = {
        fuel: 1.0,
        coffee: 0,
        snack: 0,
        road: 0,
      };

      engine.generateGrid(customRules);
      const grid = engine.getGrid();

      // All tiles should be fuel
      grid.forEach(row => {
        row.forEach(tile => {
          expect(tile.type).toBe('fuel');
        });
      });
    });
  });

  describe('Valid Moves Detection', () => {
    test('detects valid moves on normal board', () => {
      engine.generateGrid(defaultSpawnRules);
      const hasValidMoves = engine.hasValidMoves();

      // A random 8x8 board should almost always have valid moves
      expect(hasValidMoves).toBe(true);
    });

    test('returns false when no valid moves exist', () => {
      // Create a 3x3 minimal deadlock board for easier testing
      const smallEngine = new Match3Engine(3, 3);
      smallEngine.generateGrid(defaultSpawnRules);
      const grid = smallEngine.getGrid();

      // This specific 3x3 pattern has no valid moves:
      // F C S
      // C S F
      // S F C
      // No adjacent swap creates 3-in-a-row
      grid[0][0].type = 'fuel';
      grid[0][1].type = 'coffee';
      grid[0][2].type = 'snack';
      grid[1][0].type = 'coffee';
      grid[1][1].type = 'snack';
      grid[1][2].type = 'fuel';
      grid[2][0].type = 'snack';
      grid[2][1].type = 'fuel';
      grid[2][2].type = 'coffee';

      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          grid[row][col].isEmpty = false;
        }
      }

      const hasValidMoves = smallEngine.hasValidMoves();
      expect(hasValidMoves).toBe(false);
    });
  });

  describe('Board Reshuffle', () => {
    test('creates valid board after reshuffle', () => {
      engine.generateGrid(defaultSpawnRules);
      engine.reshuffleBoard();

      const matches = engine.findMatches();
      expect(matches.length).toBe(0);

      const hasValidMoves = engine.hasValidMoves();
      expect(hasValidMoves).toBe(true);
    });
  });

  describe('Process Turn (Cascade)', () => {
    test('processes single cascade iteration', () => {
      engine.generateGrid(defaultSpawnRules);
      const grid = engine.getGrid();

      // Create a match
      grid[0][0].type = 'fuel';
      grid[0][1].type = 'fuel';
      grid[0][2].type = 'fuel';

      const result = engine.processTurn();

      expect(result.matches.length).toBeGreaterThan(0);
      expect(result.depth).toBeGreaterThanOrEqual(1);
    });

    test('cascade depth is limited to prevent infinite loops', () => {
      // Even with a pathological setup, should not exceed max depth
      engine.generateGrid(defaultSpawnRules);
      const grid = engine.getGrid();

      // Create vertical matches that could cascade
      for (let row = 0; row < 8; row++) {
        grid[row][0].type = 'fuel';
      }

      const result = engine.processTurn();
      expect(result.depth).toBeLessThanOrEqual(20);
    });

    test('returns all movements and spawns', () => {
      engine.generateGrid(defaultSpawnRules);
      const grid = engine.getGrid();

      grid[0][0].type = 'snack';
      grid[0][1].type = 'snack';
      grid[0][2].type = 'snack';

      const result = engine.processTurn();

      expect(result.movements).toBeDefined();
      expect(result.spawns).toBeDefined();
      expect(Array.isArray(result.movements)).toBe(true);
      expect(Array.isArray(result.spawns)).toBe(true);
    });
  });
});
