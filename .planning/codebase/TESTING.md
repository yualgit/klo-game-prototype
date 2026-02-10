# Testing Patterns

**Analysis Date:** 2026-02-10

## Test Framework

**Runner:**
- Jest ^30.2.0
- Config: `jest.config.js`
- TypeScript support via ts-jest ^29.4.6

**Assertion Library:**
- Jest built-in expect API (no additional libraries)

**Run Commands:**
```bash
npm test              # Run all tests
npm test -- --watch  # Watch mode
npm test -- --coverage # Coverage report
```

**Jest Configuration (`jest.config.js`):**
```javascript
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts',
  ],
};
```

## Test File Organization

**Location:** Co-located pattern
- Test files live next to source files in same directory
- Example: `src/game/Match3Engine.ts` and `src/game/Match3Engine.test.ts`

**Naming Convention:** `FileName.test.ts`
- Unit tests: `Match3Engine.test.ts`, `BoosterActivator.test.ts`, `LevelManager.test.ts`

**File Count:** 3 test files currently
- `src/game/Match3Engine.test.ts` (833 lines)
- `src/game/BoosterActivator.test.ts` (218 lines)
- `src/game/LevelManager.test.ts` (407 lines)

## Test Structure

**Suite Organization:**

```typescript
describe('Match3Engine', () => {
  let engine: Match3Engine;
  const defaultSpawnRules: SpawnRules = {
    burger: 0.17,
    hotdog: 0.17,
    oil: 0.17,
    water: 0.16,
    snack: 0.17,
    soda: 0.16,
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
  });
});
```

**Patterns:**
- `describe()` blocks group related tests by feature
- `beforeEach()` creates fresh instance for each test
- `test()` for individual test cases (preferred over `it()`)
- One behavior per test
- Descriptive test names starting with verb: "generates grid", "detects horizontal match", "rejects out-of-bounds"

## Test Examples

### Grid Generation and Basics (`src/game/Match3Engine.test.ts`)

```typescript
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
```

### Swap Operations (`src/game/Match3Engine.test.ts`)

```typescript
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
    expect(movements[0].toCol).toBe(1);
  });
});
```

### Match Detection (`src/game/Match3Engine.test.ts`)

```typescript
describe('Match Detection', () => {
  test('detects horizontal match of 3', () => {
    engine.generateGrid(defaultSpawnRules);
    const grid = engine.getGrid();

    grid[0][0].type = 'burger';
    grid[0][1].type = 'burger';
    grid[0][2].type = 'burger';

    const matches = engine.findMatches();
    expect(matches.length).toBeGreaterThan(0);
    const horizontalMatch = matches.find(m => m.direction === 'horizontal');
    expect(horizontalMatch).toBeDefined();
  });

  test('detects vertical match of 3', () => {
    engine.generateGrid(defaultSpawnRules);
    const grid = engine.getGrid();

    grid[0][0].type = 'hotdog';
    grid[1][0].type = 'hotdog';
    grid[2][0].type = 'hotdog';

    const matches = engine.findMatches();
    expect(matches.length).toBeGreaterThan(0);
    const verticalMatch = matches.find(m => m.direction === 'vertical');
    expect(verticalMatch).toBeDefined();
  });

  test('does not detect non-adjacent same tiles', () => {
    engine.generateGrid(defaultSpawnRules);
    const grid = engine.getGrid();

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        grid[row][col].type = ((row + col) % 2 === 0) ? 'burger' : 'hotdog';
      }
    }

    grid[0][0].type = 'burger';
    grid[0][1].type = 'oil';
    grid[0][2].type = 'burger';

    const matches = engine.findMatches();
    const fuelMatches = matches.filter(m =>
      m.tiles.some(t => t.row === 0 && t.col <= 2)
    );
    expect(fuelMatches.length).toBe(0);
  });
});
```

### Booster Activation (`src/game/BoosterActivator.test.ts`)

```typescript
describe('Individual Booster Activation', () => {
  test('linear_horizontal clears entire row', () => {
    engine.generateGrid(defaultSpawnRules);
    const grid = engine.getGrid();

    const boosterTile: TileData = {
      ...grid[3][3],
      booster: 'linear_horizontal'
    };

    const tilesToRemove = activator.activateBooster(boosterTile);

    expect(tilesToRemove.length).toBe(8);
    tilesToRemove.forEach(tile => {
      expect(tile.row).toBe(3);
    });
  });

  test('bomb clears 3x3 area', () => {
    engine.generateGrid(defaultSpawnRules);
    const grid = engine.getGrid();

    const boosterTile: TileData = {
      ...grid[4][4],
      booster: 'bomb'
    };

    const tilesToRemove = activator.activateBooster(boosterTile);

    expect(tilesToRemove.length).toBe(9);
    const positions = tilesToRemove.map(t => `${t.row},${t.col}`);
    expect(positions).toContain('3,3');
    expect(positions).toContain('4,4');
    expect(positions).toContain('5,5');
  });
});
```

### Level Manager (`src/game/LevelManager.test.ts`)

```typescript
describe('LevelManager', () => {
  describe('Move Counter', () => {
    it('initializes with level moves', () => {
      const levelData = {
        moves: 15,
        goals: [/* ... */]
      };
      const manager = new LevelManager(levelData);
      expect(manager.getMovesRemaining()).toBe(15);
    });

    it('emits moves_changed event', () => {
      const levelData = { moves: 15, goals: [/* ... */] };
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

  describe('Win/Lose Conditions', () => {
    it('emits level_won when all goals complete', () => {
      const levelData = {
        moves: 15,
        goals: [{
          type: 'collect' as const,
          item: 'burger' as const,
          count: 3,
          current: 0,
          description: 'Collect 3 fuel'
        }]
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
  });
});
```

## Mocking

**Framework:** Jest built-in mocking (jest.fn())

**Current Approach in Codebase:**
- Pure logic classes (`Match3Engine`, `BoosterActivator`, `LevelManager`) tested with real instances
- No mocking of core game logic
- Tests use generated grid state for deterministic testing

**What NOT to Mock (observed practice):**
- Match3Engine core logic
- Booster activation
- Goal tracking
- Obstacle damage

**When to Mock (potential):**
- Firebase operations (use real FirestoreService in current tests)
- Phaser scene rendering (not tested currently)
- Audio/VFX managers (not tested currently)

## Fixtures and Factories

**Test Data (pattern observed):**
- Default spawn rules defined at suite level:
```typescript
const defaultSpawnRules: SpawnRules = {
  burger: 0.17,
  hotdog: 0.17,
  oil: 0.17,
  water: 0.16,
  snack: 0.17,
  soda: 0.16,
};
```

- Controlled grid setup: manually set tile types to create specific match patterns
```typescript
grid[0][0].type = 'burger';
grid[0][1].type = 'burger';
grid[0][2].type = 'burger';
```

- TileData factory pattern used in LevelManager tests:
```typescript
const fuelTiles: TileData[] = Array.from({ length: 5 }, (_, i) => ({
  row: 0,
  col: i,
  type: 'burger' as const,
  isEmpty: false,
  id: `fuel-${i}`
}));
```

## Coverage

**Current Status:**
- 3 test files covering core game engine
- Match3Engine: 833 lines of tests (comprehensive)
- BoosterActivator: 218 lines of tests
- LevelManager: 407 lines of tests
- Total: 1,458 lines of test code

**Not Yet Tested:**
- Scene classes (Boot, Menu, LevelSelect, Game)
- Manager classes (ProgressManager, EconomyManager, SettingsManager)
- Firebase integration (FirestoreService)
- Utilities (responsive.ts, constants.ts)
- Audio and VFX managers

**Run Coverage:**
```bash
npm test -- --coverage
```

## Test Types

**Unit Tests (all current tests):**
- **Scope:** Single class in isolation (Match3Engine, BoosterActivator, LevelManager)
- **Approach:** Real instances, test inputs/outputs
- **Examples:**
  - Grid generation without matches
  - Swap mechanics
  - Match detection (horizontal, vertical, 4-in-a-row, 5-in-a-row)
  - Booster creation and activation
  - Booster combos
  - Obstacle damage
  - Gravity simulation
  - Non-rectangular boards (cellMap)
  - Goal tracking
  - Move counting
  - Win/lose conditions

**Integration Tests (not yet written):**
- Would test: Grid + Match + Gravity together
- Would test: LevelManager + Match3Engine interaction
- Would test: Goal tracking with cascading matches

**E2E Tests (not yet planned):**
- Not implemented for prototype

## Common Patterns

**Setup Pattern:**

```typescript
describe('Match3Engine', () => {
  let engine: Match3Engine;

  beforeEach(() => {
    engine = new Match3Engine(8, 8);
  });

  // tests...
});
```

**Grid Setup Pattern:**

```typescript
test('test name', () => {
  engine.generateGrid(defaultSpawnRules);
  const grid = engine.getGrid();

  // Modify grid for test scenario
  grid[0][0].type = 'burger';
  grid[0][1].type = 'burger';
  grid[0][2].type = 'burger';

  // Act
  const matches = engine.findMatches();

  // Assert
  expect(matches.length).toBeGreaterThan(0);
});
```

**Assertion Pattern (multiple assertions per test when verifying single behavior):**

```typescript
test('detects horizontal match of 3', () => {
  engine.generateGrid(defaultSpawnRules);
  const grid = engine.getGrid();

  grid[0][0].type = 'burger';
  grid[0][1].type = 'burger';
  grid[0][2].type = 'burger';

  const matches = engine.findMatches();
  expect(matches.length).toBeGreaterThan(0);
  const horizontalMatch = matches.find(m => m.direction === 'horizontal');
  expect(horizontalMatch).toBeDefined();
});
```

**Event Testing Pattern (LevelManager):**

```typescript
it('emits moves_changed event', () => {
  const levelData = { moves: 15, goals: [/* ... */] };
  const manager = new LevelManager(levelData);
  const events: LevelEvent[] = [];
  manager.subscribe((event) => events.push(event));

  manager.decrementMoves();

  expect(events).toContainEqual({
    type: 'moves_changed',
    movesRemaining: 14
  });
});
```

**Async Error Testing Pattern:**

```typescript
it('should reject invalid level ID', async () => {
  await expect(loader.loadLevel(-1)).rejects.toThrow();
});
```

---

*Testing analysis: 2026-02-10*
