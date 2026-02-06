import { Match3Engine } from './Match3Engine';
import { BoosterActivator } from './BoosterActivator';
import { TileData, TileType, BoosterType } from './types';

describe('BoosterActivator', () => {
  let engine: Match3Engine;
  let activator: BoosterActivator;

  beforeEach(() => {
    engine = new Match3Engine(8, 8);
    activator = new BoosterActivator(engine);
  });

  describe('Individual Booster Activation', () => {
    test('linear_horizontal clears entire row', () => {
      // Generate grid and place booster at (3, 3)
      engine.generateGrid({ fuel: 1, coffee: 1, snack: 1, road: 1 });
      const grid = engine.getGrid();

      // Set a tile at (3, 3) to have a linear_horizontal booster
      const boosterTile: TileData = {
        ...grid[3][3],
        booster: 'linear_horizontal'
      };

      const tilesToRemove = activator.activateBooster(boosterTile);

      // Should return all 8 tiles in row 3
      expect(tilesToRemove.length).toBe(8);
      tilesToRemove.forEach(tile => {
        expect(tile.row).toBe(3);
      });
    });

    test('linear_vertical clears entire column', () => {
      engine.generateGrid({ fuel: 1, coffee: 1, snack: 1, road: 1 });
      const grid = engine.getGrid();

      const boosterTile: TileData = {
        ...grid[3][3],
        booster: 'linear_vertical'
      };

      const tilesToRemove = activator.activateBooster(boosterTile);

      // Should return all 8 tiles in column 3
      expect(tilesToRemove.length).toBe(8);
      tilesToRemove.forEach(tile => {
        expect(tile.col).toBe(3);
      });
    });

    test('bomb clears 3x3 area', () => {
      engine.generateGrid({ fuel: 1, coffee: 1, snack: 1, road: 1 });
      const grid = engine.getGrid();

      const boosterTile: TileData = {
        ...grid[4][4],
        booster: 'bomb'
      };

      const tilesToRemove = activator.activateBooster(boosterTile);

      // Should return 9 tiles (3x3 centered at 4,4)
      expect(tilesToRemove.length).toBe(9);

      // Verify it's a 3x3 area centered at (4,4)
      const positions = tilesToRemove.map(t => `${t.row},${t.col}`);
      expect(positions).toContain('3,3');
      expect(positions).toContain('3,4');
      expect(positions).toContain('3,5');
      expect(positions).toContain('4,3');
      expect(positions).toContain('4,4');
      expect(positions).toContain('4,5');
      expect(positions).toContain('5,3');
      expect(positions).toContain('5,4');
      expect(positions).toContain('5,5');
    });

    test('bomb near edge clears only valid tiles', () => {
      engine.generateGrid({ fuel: 1, coffee: 1, snack: 1, road: 1 });
      const grid = engine.getGrid();

      const boosterTile: TileData = {
        ...grid[0][0],
        booster: 'bomb'
      };

      const tilesToRemove = activator.activateBooster(boosterTile);

      // Should return 4 tiles (2x2 in corner), no out-of-bounds
      expect(tilesToRemove.length).toBe(4);

      // Verify all tiles are in valid bounds
      tilesToRemove.forEach(tile => {
        expect(tile.row).toBeGreaterThanOrEqual(0);
        expect(tile.row).toBeLessThan(8);
        expect(tile.col).toBeGreaterThanOrEqual(0);
        expect(tile.col).toBeLessThan(8);
      });

      // Verify it's the corner tiles
      const positions = tilesToRemove.map(t => `${t.row},${t.col}`);
      expect(positions).toContain('0,0');
      expect(positions).toContain('0,1');
      expect(positions).toContain('1,0');
      expect(positions).toContain('1,1');
    });

    test('klo_sphere clears all tiles of same type', () => {
      engine.generateGrid({ fuel: 1, coffee: 1, snack: 1, road: 1 });
      const grid = engine.getGrid();

      // Count how many 'fuel' tiles exist in the grid
      let fuelCount = 0;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (grid[r][c].type === 'fuel') {
            fuelCount++;
          }
        }
      }

      const boosterTile: TileData = {
        ...grid[3][3],
        type: 'fuel',
        booster: 'klo_sphere'
      };

      const tilesToRemove = activator.activateBooster(boosterTile);

      // Should return all tiles of type 'fuel'
      expect(tilesToRemove.length).toBe(fuelCount);
      tilesToRemove.forEach(tile => {
        expect(tile.type).toBe('fuel');
      });
    });
  });

  describe('Booster Combos', () => {
    test('two linear boosters create rocket effect (cross clear)', () => {
      engine.generateGrid({ fuel: 1, coffee: 1, snack: 1, road: 1 });
      const grid = engine.getGrid();
      const booster1: TileData = { ...grid[3][3], booster: 'linear_horizontal' };
      const booster2: TileData = { ...grid[3][4], booster: 'linear_vertical' };
      const tilesToRemove = activator.activateBoosterCombo(booster1, booster2);
      expect(tilesToRemove.length).toBe(15);
      const rowTiles = tilesToRemove.filter(t => t.row === 3);
      expect(rowTiles.length).toBe(8);
      const colTiles = tilesToRemove.filter(t => t.col === 3);
      expect(colTiles.length).toBe(8);
    });

    test('two bombs create mega bomb (5x5)', () => {
      engine.generateGrid({ fuel: 1, coffee: 1, snack: 1, road: 1 });
      const grid = engine.getGrid();
      const booster1: TileData = { ...grid[4][4], booster: 'bomb' };
      const booster2: TileData = { ...grid[4][5], booster: 'bomb' };
      const tilesToRemove = activator.activateBoosterCombo(booster1, booster2);
      expect(tilesToRemove.length).toBe(25);
      tilesToRemove.forEach(tile => {
        expect(tile.row).toBeGreaterThanOrEqual(2);
        expect(tile.row).toBeLessThanOrEqual(6);
        expect(tile.col).toBeGreaterThanOrEqual(2);
        expect(tile.col).toBeLessThanOrEqual(6);
      });
    });

    test('linear + bomb clears 3 rows or columns', () => {
      engine.generateGrid({ fuel: 1, coffee: 1, snack: 1, road: 1 });
      const grid = engine.getGrid();
      const booster1: TileData = { ...grid[3][3], booster: 'linear_horizontal' };
      const booster2: TileData = { ...grid[3][4], booster: 'bomb' };
      const tilesToRemove = activator.activateBoosterCombo(booster1, booster2);
      expect(tilesToRemove.length).toBe(24);
      const rows = new Set(tilesToRemove.map(t => t.row));
      expect(rows.has(2)).toBe(true);
      expect(rows.has(3)).toBe(true);
      expect(rows.has(4)).toBe(true);
    });

    test('klo_sphere + linear converts all same-type to linear', () => {
      engine.generateGrid({ fuel: 1, coffee: 1, snack: 1, road: 1 });
      const grid = engine.getGrid();
      let coffeeCount = 0;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (grid[r][c].type === 'coffee') coffeeCount++;
        }
      }
      const booster1: TileData = { ...grid[3][3], booster: 'klo_sphere' };
      const booster2: TileData = { ...grid[3][4], type: 'coffee', booster: 'linear_horizontal' };
      const tilesToRemove = activator.activateBoosterCombo(booster1, booster2);
      expect(tilesToRemove.length).toBe(coffeeCount);
      tilesToRemove.forEach(tile => {
        expect(tile.type).toBe('coffee');
      });
    });

    test('two klo_spheres clear entire board', () => {
      engine.generateGrid({ fuel: 1, coffee: 1, snack: 1, road: 1 });
      const grid = engine.getGrid();
      const booster1: TileData = { ...grid[3][3], booster: 'klo_sphere' };
      const booster2: TileData = { ...grid[3][4], booster: 'klo_sphere' };
      const tilesToRemove = activator.activateBoosterCombo(booster1, booster2);
      expect(tilesToRemove.length).toBe(64);
    });

    test('no combo just activates both', () => {
      engine.generateGrid({ fuel: 1, coffee: 1, snack: 1, road: 1 });
      const grid = engine.getGrid();
      const booster1: TileData = { ...grid[3][3], booster: 'linear_horizontal' };
      const booster2: TileData = { ...grid[5][5], booster: 'linear_vertical' };
      const tilesToRemove = activator.activateBoosterCombo(booster1, booster2);
      expect(tilesToRemove.length).toBe(15);
    });
  });
});
