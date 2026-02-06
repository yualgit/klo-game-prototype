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

      // Clear grid with non-matching pattern to avoid random matches
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          grid[row][col].type = ((row + col) % 2 === 0) ? 'fuel' : 'coffee';
        }
      }

      // Set pattern: fuel, road, fuel (non-adjacent fuels)
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

  describe('Booster Detection', () => {
    test('4-in-a-row horizontal creates linear_horizontal booster', () => {
      // Create clean test environment - use small engine to avoid random matches
      const testEngine = new Match3Engine(5, 5);
      testEngine.generateGrid(defaultSpawnRules);
      const grid = testEngine.getGrid();

      // Clear grid with non-matching pattern
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          grid[row][col].type = ((row + col) % 2 === 0) ? 'fuel' : 'coffee';
        }
      }

      // Set grid row 0 cols 0-3 to same type
      grid[0][0].type = 'snack';
      grid[0][1].type = 'snack';
      grid[0][2].type = 'snack';
      grid[0][3].type = 'snack';

      const result = testEngine.findMatchesWithBoosters();

      expect(result.boostersToSpawn.length).toBe(1);
      expect(result.boostersToSpawn[0].boosterType).toBe('linear_horizontal');
      expect(result.boostersToSpawn[0].row).toBe(0);
      // Spawn position at middle (index 1 or 2 of 4 tiles)
      expect([1, 2]).toContain(result.boostersToSpawn[0].col);
      expect(result.boostersToSpawn[0].baseType).toBe('snack');
    });

    test('4-in-a-row vertical creates linear_vertical booster', () => {
      const testEngine = new Match3Engine(5, 5);
      testEngine.generateGrid(defaultSpawnRules);
      const grid = testEngine.getGrid();

      // Clear grid with non-matching pattern
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          grid[row][col].type = ((row + col) % 2 === 0) ? 'fuel' : 'coffee';
        }
      }

      // Set grid rows 0-3 col 0 to same type
      grid[0][0].type = 'road';
      grid[1][0].type = 'road';
      grid[2][0].type = 'road';
      grid[3][0].type = 'road';

      const result = testEngine.findMatchesWithBoosters();

      expect(result.boostersToSpawn.length).toBe(1);
      expect(result.boostersToSpawn[0].boosterType).toBe('linear_vertical');
      expect(result.boostersToSpawn[0].col).toBe(0);
      // Spawn position at middle (row 1 or 2 of 4 tiles)
      expect([1, 2]).toContain(result.boostersToSpawn[0].row);
      expect(result.boostersToSpawn[0].baseType).toBe('road');
    });

    test('5-in-a-row creates klo_sphere booster', () => {
      const testEngine = new Match3Engine(5, 6);
      testEngine.generateGrid(defaultSpawnRules);
      const grid = testEngine.getGrid();

      // Clear grid with non-matching pattern
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 6; col++) {
          grid[row][col].type = ((row + col) % 2 === 0) ? 'fuel' : 'coffee';
        }
      }

      // Set grid row 0 cols 0-4 to same type
      grid[0][0].type = 'snack';
      grid[0][1].type = 'snack';
      grid[0][2].type = 'snack';
      grid[0][3].type = 'snack';
      grid[0][4].type = 'snack';

      const result = testEngine.findMatchesWithBoosters();

      expect(result.boostersToSpawn.length).toBe(1);
      expect(result.boostersToSpawn[0].boosterType).toBe('klo_sphere');
      expect(result.boostersToSpawn[0].row).toBe(0);
      expect(result.boostersToSpawn[0].col).toBe(2); // Middle position (index 2 of 5)
      expect(result.boostersToSpawn[0].baseType).toBe('snack');
    });

    test('L/T-shape creates bomb booster', () => {
      const testEngine = new Match3Engine(6, 6);
      testEngine.generateGrid(defaultSpawnRules);
      const grid = testEngine.getGrid();

      // Clear grid with non-matching pattern
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 6; col++) {
          grid[row][col].type = ((row + col) % 2 === 0) ? 'fuel' : 'coffee';
        }
      }

      // Set up horizontal match (row 2, cols 2-4)
      grid[2][2].type = 'road';
      grid[2][3].type = 'road';
      grid[2][4].type = 'road';

      // Set up vertical match (rows 2-4, col 2)
      grid[3][2].type = 'road';
      grid[4][2].type = 'road';

      const result = testEngine.findMatchesWithBoosters();

      expect(result.boostersToSpawn.length).toBe(1);
      expect(result.boostersToSpawn[0].boosterType).toBe('bomb');
      expect(result.boostersToSpawn[0].row).toBe(2);
      expect(result.boostersToSpawn[0].col).toBe(2); // Intersection position
      expect(result.boostersToSpawn[0].baseType).toBe('road');
    });

    test('3-in-a-row creates no booster', () => {
      const testEngine = new Match3Engine(5, 5);
      testEngine.generateGrid(defaultSpawnRules);
      const grid = testEngine.getGrid();

      // Clear grid with non-matching pattern
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          grid[row][col].type = ((row + col) % 2 === 0) ? 'fuel' : 'coffee';
        }
      }

      // Set grid row 0 cols 0-2 to same type
      grid[0][0].type = 'snack';
      grid[0][1].type = 'snack';
      grid[0][2].type = 'snack';

      const result = testEngine.findMatchesWithBoosters();

      expect(result.boostersToSpawn.length).toBe(0);
      expect(result.tilesToRemove.length).toBe(3);
    });

    test('tilesToRemove contains all matched tiles', () => {
      const testEngine = new Match3Engine(5, 5);
      testEngine.generateGrid(defaultSpawnRules);
      const grid = testEngine.getGrid();

      // Clear grid with non-matching pattern
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          grid[row][col].type = ((row + col) % 2 === 0) ? 'fuel' : 'snack';
        }
      }

      // Set 4-in-a-row
      grid[0][0].type = 'coffee';
      grid[0][1].type = 'coffee';
      grid[0][2].type = 'coffee';
      grid[0][3].type = 'coffee';

      const result = testEngine.findMatchesWithBoosters();

      expect(result.tilesToRemove.length).toBe(4);
      expect(result.tilesToRemove.every(t => t.type === 'coffee')).toBe(true);
      expect(result.tilesToRemove.every(t => t.row === 0)).toBe(true);
    });
  });

  describe('Obstacle System', () => {
    test('ice obstacle loses a layer when adjacent tile matches', () => {
      engine.generateGrid(defaultSpawnRules);
      const grid = engine.getGrid();

      // Place ice obstacle (layers: 2) at (3,3)
      grid[3][3].obstacle = { type: 'ice', layers: 2 };

      // Create a match adjacent to ice at (3,2), (3,1), (3,0)
      grid[3][0].type = 'fuel';
      grid[3][1].type = 'fuel';
      grid[3][2].type = 'fuel';

      const matches = engine.findMatches();
      const damaged = engine.damageObstacles(matches);

      // Assert obstacle at (3,3) has layers: 1
      expect(grid[3][3].obstacle?.layers).toBe(1);
      expect(damaged.length).toBeGreaterThan(0);
    });

    test('ice obstacle fully destroyed when last layer removed', () => {
      engine.generateGrid(defaultSpawnRules);
      const grid = engine.getGrid();

      // Place ice obstacle (layers: 1) at (3,3)
      grid[3][3].obstacle = { type: 'ice', layers: 1 };

      // Create adjacent match
      grid[3][0].type = 'coffee';
      grid[3][1].type = 'coffee';
      grid[3][2].type = 'coffee';

      const matches = engine.findMatches();
      engine.damageObstacles(matches);

      // Assert obstacle at (3,3) has type: 'none' or is removed
      expect(grid[3][3].obstacle).toBeUndefined();
    });

    test('dirt obstacle destroyed by adjacent match (1 hit)', () => {
      engine.generateGrid(defaultSpawnRules);
      const grid = engine.getGrid();

      // Place dirt obstacle (layers: 1) at (4,4)
      grid[4][4].obstacle = { type: 'dirt', layers: 1 };

      // Create adjacent match (vertical)
      grid[2][4].type = 'snack';
      grid[3][4].type = 'snack';
      grid[5][4].type = 'snack';

      const matches = engine.findMatches();
      engine.damageObstacles(matches);

      // Assert obstacle destroyed
      expect(grid[4][4].obstacle).toBeUndefined();
    });

    test('crate obstacle takes damage from adjacent match, survives with layers > 0', () => {
      engine.generateGrid(defaultSpawnRules);
      const grid = engine.getGrid();

      // Place crate (layers: 3) at (2,3) - adjacent to match at cols 4,5,6
      grid[2][3].obstacle = { type: 'crate', layers: 3 };

      // Create adjacent match (horizontal)
      grid[2][4].type = 'road';
      grid[2][5].type = 'road';
      grid[2][6].type = 'road';

      const matches = engine.findMatches();
      engine.damageObstacles(matches);

      // Assert layers: 2 after damage
      expect(grid[2][3].obstacle?.layers).toBe(2);
      expect(grid[2][3].obstacle?.type).toBe('crate');
    });

    test('blocked cell is not affected by matches', () => {
      engine.generateGrid(defaultSpawnRules);
      const grid = engine.getGrid();

      // Place blocked obstacle at (5,5)
      grid[5][5].obstacle = { type: 'blocked', layers: 1 };
      grid[5][5].isEmpty = true;

      // Create adjacent match
      grid[5][2].type = 'fuel';
      grid[5][3].type = 'fuel';
      grid[5][4].type = 'fuel';

      const matches = engine.findMatches();
      engine.damageObstacles(matches);

      // Assert blocked cell unchanged
      expect(grid[5][5].obstacle?.type).toBe('blocked');
      expect(grid[5][5].obstacle?.layers).toBe(1);
    });

    test('damageObstacles returns list of damaged obstacles for goal tracking', () => {
      engine.generateGrid(defaultSpawnRules);
      const grid = engine.getGrid();

      // Place ice (layers: 1)
      grid[3][3].obstacle = { type: 'ice', layers: 1 };

      // Create adjacent match
      grid[3][0].type = 'coffee';
      grid[3][1].type = 'coffee';
      grid[3][2].type = 'coffee';

      const matches = engine.findMatches();
      const damaged = engine.damageObstacles(matches);

      // Assert return value includes the destroyed obstacle
      expect(damaged.length).toBeGreaterThan(0);
      expect(damaged[0].type).toBe('ice');
    });

    test('tiles with obstacles do not fall during gravity', () => {
      engine.generateGrid(defaultSpawnRules);
      const grid = engine.getGrid();

      // Place obstacle at (5,3)
      const tileId = grid[5][3].id;
      grid[5][3].obstacle = { type: 'ice', layers: 2 };

      // Create empty space below at (7,3)
      grid[7][3].isEmpty = true;
      grid[7][3].type = 'empty';

      const movements = engine.applyGravity();

      // Obstacle tile should stay in place (not in movements)
      const obstacleMoved = movements.find(m => m.tileId === tileId);
      expect(obstacleMoved).toBeUndefined();
      expect(grid[5][3].obstacle).toBeDefined();
    });

    test('gravity skips over blocked cells', () => {
      engine.generateGrid(defaultSpawnRules);
      const grid = engine.getGrid();

      // Place blocked cell at (5,3)
      grid[5][3].obstacle = { type: 'blocked', layers: 1 };
      grid[5][3].isEmpty = true;
      grid[5][3].type = 'empty';

      // Place tile above at (3,3)
      const tileType = grid[3][3].type;

      // Create empty space at (7,3)
      grid[7][3].isEmpty = true;
      grid[7][3].type = 'empty';

      const movements = engine.applyGravity();

      // Tile at (3,3) should fall to (4,3) only, not through blocked cell
      const tileMovement = movements.find(m => m.fromRow === 3 && m.fromCol === 3);
      expect(tileMovement).toBeDefined();
      expect(tileMovement?.toRow).toBe(4);
    });

    test('spawnNewTiles does not spawn on blocked cells', () => {
      engine.generateGrid(defaultSpawnRules);
      const grid = engine.getGrid();

      // Place blocked cell at (0,0)
      grid[0][0].obstacle = { type: 'blocked', layers: 1 };
      grid[0][0].isEmpty = true;
      grid[0][0].type = 'empty';

      const spawns = engine.spawnNewTiles(defaultSpawnRules);

      // Should not spawn on (0,0)
      const spawnedOnBlocked = spawns.find(s => s.row === 0 && s.col === 0);
      expect(spawnedOnBlocked).toBeUndefined();
      expect(grid[0][0].isEmpty).toBe(true);
    });
  });
});
