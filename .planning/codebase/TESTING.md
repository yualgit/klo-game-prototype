# Testing Patterns

**Analysis Date:** 2026-02-05

## Test Framework

**Runner:**
- Jest (recommended for TypeScript + Phaser game testing)
- Version: ^29.0.0
- Config: `jest.config.js` or `jest.config.ts`

**Assertion Library:**
- Jest built-in assertions (expect API)
- Optional: `jest-extended` for additional matchers

**Run Commands:**
```bash
npm test                  # Run all tests
npm test -- --watch      # Watch mode (re-run on changes)
npm test -- --coverage   # Generate coverage report
npm test -- --testNamePattern="Grid" # Run tests matching pattern
```

**Configuration Baseline (`jest.config.ts`):**
```typescript
export default {
  preset: 'ts-jest',
  testEnvironment: 'node', // or 'jsdom' if testing Phaser visual elements
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.spec.ts', '**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/main.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

## Test File Organization

**Location:**
- **Co-located pattern** (preferred): Test files live next to source files
- Example: `src/game/Grid.ts` and `src/game/Grid.spec.ts` in same directory
- Alternative: Centralized in `src/__tests__/` directory (less preferred)

**Naming:**
- Unit tests: `[FileName].spec.ts` (e.g., `Grid.spec.ts`)
- Integration tests: `[FileName].integration.spec.ts`
- Firebase emulator tests: `[FileName].firebase.spec.ts`

**Structure by Module:**
```
src/
├── game/
│   ├── Grid.ts
│   ├── Grid.spec.ts          # Unit tests
│   ├── Match.ts
│   ├── Match.spec.ts
│   ├── Booster.ts
│   └── Booster.spec.ts
├── data/
│   ├── LevelLoader.ts
│   └── LevelLoader.spec.ts   # Includes JSON loading tests
├── firebase/
│   ├── firestore.ts
│   └── firestore.firebase.spec.ts  # Firebase emulator tests
└── utils/
    ├── constants.ts
    └── helpers.spec.ts
```

## Test Structure

**Suite Organization:**

```typescript
describe('Grid', () => {
  let grid: Grid;

  beforeEach(() => {
    grid = new Grid(8, 8); // 8x8 standard match-3 grid
  });

  describe('initialization', () => {
    it('should create empty 8x8 grid', () => {
      expect(grid.width).toBe(8);
      expect(grid.height).toBe(8);
    });

    it('should have all cells empty initially', () => {
      expect(grid.isEmpty()).toBe(true);
    });
  });

  describe('tile placement', () => {
    it('should place tile at coordinates', () => {
      grid.setTile(0, 0, 'fuel');
      expect(grid.getTile(0, 0)).toBe('fuel');
    });

    it('should reject out-of-bounds placement', () => {
      expect(() => grid.setTile(8, 8, 'fuel')).toThrow();
    });
  });

  describe('gravity', () => {
    it('should move tiles down after match removal', () => {
      // Setup: place tiles with gap
      grid.setTile(0, 0, 'fuel');
      grid.setTile(0, 2, 'coffee');

      // Remove tile at (0, 1) to create gap
      grid.removeTile(0, 1);
      grid.applyGravity();

      // Coffee should fall to position (0, 1)
      expect(grid.getTile(0, 1)).toBe('coffee');
      expect(grid.getTile(0, 2)).toBeNull();
    });
  });
});
```

**Patterns:**
- Use `describe()` blocks to group related tests
- Use `beforeEach()` to set up test state (grid instance, mock data)
- Use `afterEach()` to clean up (Firebase connections, event listeners)
- Use `it()` for individual test cases (one assertion per test when possible)
- Test one behavior per test for clarity

## Test Examples by Component

### Grid Logic Tests (`src/game/Grid.spec.ts`)

```typescript
describe('Grid', () => {
  let grid: Grid;

  beforeEach(() => {
    grid = new Grid(8, 8);
  });

  describe('swap mechanics', () => {
    it('should swap adjacent tiles', () => {
      grid.setTile(0, 0, 'fuel');
      grid.setTile(1, 0, 'coffee');

      grid.swap(0, 0, 1, 0);

      expect(grid.getTile(0, 0)).toBe('coffee');
      expect(grid.getTile(1, 0)).toBe('fuel');
    });

    it('should not allow non-adjacent swaps', () => {
      grid.setTile(0, 0, 'fuel');
      grid.setTile(2, 0, 'coffee');

      expect(() => grid.swap(0, 0, 2, 0)).toThrow('Adjacent tiles only');
    });
  });
});
```

### Match Detection Tests (`src/game/Match.spec.ts`)

```typescript
describe('Match', () => {
  let match: Match;
  let grid: Grid;

  beforeEach(() => {
    grid = new Grid(8, 8);
    match = new Match(grid);
  });

  describe('horizontal matches', () => {
    it('should detect 3 in a row horizontally', () => {
      // Create: FFF (fuel, fuel, fuel)
      grid.setTile(0, 0, 'fuel');
      grid.setTile(1, 0, 'fuel');
      grid.setTile(2, 0, 'fuel');

      const matches = match.findMatches();

      expect(matches).toHaveLength(3);
      expect(matches.every(t => t.type === 'fuel')).toBe(true);
    });

    it('should detect 4+ in a row as single match', () => {
      // Create: FFFF (4 in a row)
      for (let x = 0; x < 4; x++) {
        grid.setTile(x, 0, 'fuel');
      }

      const matches = match.findMatches();

      expect(matches).toHaveLength(4);
    });

    it('should not detect 2 in a row', () => {
      grid.setTile(0, 0, 'fuel');
      grid.setTile(1, 0, 'fuel');

      const matches = match.findMatches();

      expect(matches).toHaveLength(0);
    });
  });

  describe('special tile creation', () => {
    it('should create linear booster from 4 in a row', () => {
      for (let x = 0; x < 4; x++) {
        grid.setTile(x, 0, 'fuel');
      }

      match.findMatches(); // Process matches
      const boosterType = match.getBoosterAt(0, 0);

      expect(boosterType).toBe('linear');
    });

    it('should create bomb from 5 in T or L shape', () => {
      // Create T shape:
      // FFF
      //  F
      //  F
      grid.setTile(0, 0, 'fuel');
      grid.setTile(1, 0, 'fuel');
      grid.setTile(2, 0, 'fuel');
      grid.setTile(1, 1, 'fuel');
      grid.setTile(1, 2, 'fuel');

      match.findMatches();
      const boosterType = match.getBoosterAt(1, 0);

      expect(boosterType).toBe('bomb');
    });
  });
});
```

### Level Loader Tests (`src/data/LevelLoader.spec.ts`)

```typescript
describe('LevelLoader', () => {
  let loader: LevelLoader;

  beforeEach(() => {
    loader = new LevelLoader();
  });

  describe('loadLevel', () => {
    it('should load valid level JSON', async () => {
      const level = await loader.loadLevel(1);

      expect(level.level_id).toBe(1);
      expect(level.moves).toBeGreaterThan(0);
      expect(level.grid.width).toBe(8);
      expect(level.grid.height).toBe(8);
    });

    it('should throw on missing level file', async () => {
      await expect(loader.loadLevel(99999)).rejects.toThrow();
    });

    it('should validate level schema', async () => {
      // This test ensures schema validation catches malformed levels
      const invalidLevel = {
        level_id: 1,
        moves: 15
        // Missing required fields: grid, goals, spawn_rules
      };

      expect(() => loader.validateLevel(invalidLevel as Level)).toThrow();
    });
  });

  describe('spawn rules', () => {
    it('should respect spawn probability distribution', async () => {
      const level = await loader.loadLevel(5);
      const { fuel, coffee, snack, road } = level.spawn_rules;

      expect(fuel + coffee + snack + road).toBeCloseTo(1.0, 2); // Sum to ~1.0
    });
  });
});
```

### Firebase Functions Tests (`src/firebase/functions.firebase.spec.ts`)

Using Firebase Emulator Suite:

```typescript
import { initializeApp } from 'firebase/app';
import { connectFunctionsEmulator, httpsCallable } from 'firebase/functions';

describe('Firebase Cloud Functions (Emulator)', () => {
  beforeAll(() => {
    // Initialize Firebase with emulator
    const app = initializeApp({
      projectId: 'test-project'
    });

    const functions = getFunctions(app);
    connectFunctionsEmulator(functions, 'localhost', 5001);
  });

  describe('generateCoupon', () => {
    it('should generate coupon for valid user and level', async () => {
      const generateCoupon = httpsCallable(functions, 'generateCoupon');

      const result = await generateCoupon({
        userId: 'test-user-123',
        levelId: 5,
        couponType: 'coffee_s_free'
      });

      expect(result.data.success).toBe(true);
      expect(result.data.coupon).toHaveProperty('coupon_id');
      expect(result.data.coupon.expires_at).toBeDefined();
    });

    it('should respect user coupon limits (1 per week)', async () => {
      const generateCoupon = httpsCallable(functions, 'generateCoupon');
      const userId = 'limit-test-user';

      // First coupon should succeed
      const result1 = await generateCoupon({
        userId,
        levelId: 5,
        couponType: 'coffee_s_free'
      });
      expect(result1.data.success).toBe(true);

      // Second coupon same week should fail
      const result2 = await generateCoupon({
        userId,
        levelId: 6,
        couponType: 'coffee_s_free'
      });
      expect(result2.data.success).toBe(false);
      expect(result2.data.error).toContain('limit');
    });

    it('should enforce budget limits', async () => {
      // This requires setting up emulator with limited budget
      // Implementation depends on how budget tracking is stored
    });
  });

  describe('redeemCoupon', () => {
    it('should redeem valid coupon', async () => {
      const redeemCoupon = httpsCallable(functions, 'redeemCoupon');

      const result = await redeemCoupon({
        coupon_id: 'KLO-AB12CD',
        station_id: 'klo_station_42',
        receipt_id: 'receipt_98765',
        product_id: 'coffee_latte_s'
      });

      expect(result.data.success).toBe(true);
      expect(result.data.discount_amount).toBeDefined();
    });

    it('should reject expired coupon', async () => {
      const redeemCoupon = httpsCallable(functions, 'redeemCoupon');

      const result = await redeemCoupon({
        coupon_id: 'KLO-EXPIRED',
        station_id: 'klo_station_42'
      });

      expect(result.data.success).toBe(false);
      expect(result.data.error).toContain('expired');
    });

    it('should reject already-redeemed coupon', async () => {
      const redeemCoupon = httpsCallable(functions, 'redeemCoupon');

      // First redemption
      await redeemCoupon({
        coupon_id: 'KLO-SINGLE-USE',
        station_id: 'klo_station_42'
      });

      // Second redemption should fail
      const result = await redeemCoupon({
        coupon_id: 'KLO-SINGLE-USE',
        station_id: 'klo_station_42'
      });

      expect(result.data.success).toBe(false);
      expect(result.data.error).toContain('redeemed');
    });
  });
});
```

## Mocking

**Framework:** Jest built-in mocking (`jest.mock()`)

**Patterns:**

### Mocking Firebase Functions

```typescript
// In test file header
jest.mock('@/firebase/functions', () => ({
  generateCoupon: jest.fn(),
  redeemCoupon: jest.fn()
}));

// In test
import { generateCoupon } from '@/firebase/functions';

it('should handle coupon generation', async () => {
  (generateCoupon as jest.Mock).mockResolvedValue({
    success: true,
    coupon: { coupon_id: 'KLO-TEST' }
  });

  const result = await generateCoupon('user123', 5);

  expect(result.success).toBe(true);
  expect(generateCoupon).toHaveBeenCalledWith('user123', 5);
});
```

### Mocking Level Data

```typescript
jest.mock('@/data/LevelLoader', () => ({
  LevelLoader: jest.fn(() => ({
    loadLevel: jest.fn((id: number) =>
      Promise.resolve({
        level_id: id,
        moves: 15,
        grid: { width: 8, height: 8, blocked_cells: [] },
        goals: [],
        spawn_rules: { fuel: 0.25, coffee: 0.25, snack: 0.25, road: 0.25 }
      })
    )
  }))
}));
```

### Mocking Phaser Scene

```typescript
class MockScene extends Phaser.Scene {
  constructor() {
    super('MockScene');
  }

  create(): void {}
}

it('should create game scene', () => {
  const scene = new MockScene();
  expect(scene).toBeDefined();
  expect(scene.isActive()).toBe(false); // Not running in test
});
```

**What to Mock:**
- Firebase functions (use emulator instead when possible)
- External API calls
- File loading (provide mock JSON data)
- Phaser event emitters (mock only if testing event logic)

**What NOT to Mock:**
- Core game logic (Grid, Match, Booster classes)
- Data structures and types
- Helper functions in utils
- Authentication flow (test against emulator)

## Fixtures and Factories

**Test Data:**

```typescript
// src/__tests__/fixtures/levelFixtures.ts
export const mockLevel1: Level = {
  level_id: 1,
  name: 'Level 1',
  moves: 15,
  grid: {
    width: 8,
    height: 8,
    blocked_cells: []
  },
  goals: [
    {
      type: 'collect',
      item: 'fuel',
      count: 20,
      description: 'Collect 20 fuel'
    }
  ],
  spawn_rules: {
    fuel: 0.3,
    coffee: 0.25,
    snack: 0.25,
    road: 0.2
  },
  obstacles: [],
  difficulty: 'tutorial',
  target_fail_rate: 0.05,
  rewards: {
    stars: 1,
    boosters: { linear: 1 },
    coupon_chance: 0
  }
};

export const mockCoupon: CouponDoc = {
  coupon_id: 'KLO-TEST123',
  user_id: 'user-123',
  loyalty_id: 'loyalty-456',
  category: 'coffee',
  value: 'Free Coffee S',
  discount_amount: 0,
  status: 'active',
  created_at: new Date(),
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  redeemed_at: undefined,
  station_id: undefined,
  receipt_id: undefined,
  product_id: undefined
};

// Factory function for dynamic test data
export function createMockUser(overrides?: Partial<User>): User {
  return {
    uid: 'test-user-' + Math.random(),
    loyalty_id: 'loyalty-' + Math.random(),
    phone: '+380501234567',
    created_at: new Date(),
    last_seen: new Date(),
    progress: {
      current_level: 1,
      completed_levels: [],
      stars: 0
    },
    boosters: {
      linear: 0,
      bomb: 0,
      rocket: 0,
      sphere: 0
    },
    stats: {
      total_levels_completed: 0,
      total_coupons_claimed: 0,
      total_coupons_redeemed: 0,
      total_sessions: 0
    },
    ...overrides
  };
}
```

**Location:**
- Fixtures in `src/__tests__/fixtures/` directory
- One file per domain: `levelFixtures.ts`, `userFixtures.ts`, `couponFixtures.ts`
- Import and use in test files

## Coverage

**Requirements:**
- Minimum 70% coverage for all metrics (lines, branches, functions, statements)
- Critical paths (game logic, Firebase integration) aim for 85%+
- UI/Scene logic can be lower (40-50%) due to Phaser testing complexity

**View Coverage:**
```bash
npm test -- --coverage
# Generates coverage/index.html with detailed report
# Open in browser: open coverage/index.html
```

**Coverage by Module:**
- `src/game/` — 85%+ (core logic)
- `src/data/` — 80%+ (schema validation, loading)
- `src/firebase/` — 75%+ (with emulator tests)
- `src/scenes/` — 40%+ (Phaser scenes harder to test)
- `src/utils/` — 90%+ (pure functions)

## Test Types

**Unit Tests:**
- **Scope:** Single class or function in isolation
- **Approach:** Mock external dependencies, test inputs/outputs
- **Examples:**
  - `Grid.spec.ts` — test grid state management
  - `Match.spec.ts` — test match detection algorithms
  - `Booster.spec.ts` — test booster creation and activation
  - `LevelLoader.spec.ts` — test JSON parsing and validation
  - `helpers.spec.ts` — test utility functions

**Integration Tests:**
- **Scope:** Multiple components working together
- **Approach:** Real instances, minimal mocking
- **Examples:**
  - Grid + Match + Gravity together
  - LevelLoader + Game scene initialization
  - User progress update with analytics event tracking
  - Firebase Firestore + Analytics together

**E2E Tests:**
- **Framework:** Not yet planned for prototype
- **When to add:** Post-MVP, use Cypress or Playwright
- **Scope:** User flows (complete level, claim coupon, redeem coupon)

## Common Patterns

**Async Testing:**

```typescript
// Using async/await
it('should load level asynchronously', async () => {
  const level = await loader.loadLevel(1);
  expect(level.level_id).toBe(1);
});

// Using .returns() promise chain
it('should load level with promise', () => {
  return loader.loadLevel(1).then(level => {
    expect(level.level_id).toBe(1);
  });
});

// Using done callback (not recommended)
it('should load level with done', (done) => {
  loader.loadLevel(1).then(level => {
    expect(level.level_id).toBe(1);
    done();
  }).catch(done);
});
```

**Error Testing:**

```typescript
// Testing thrown errors
it('should throw on invalid grid size', () => {
  expect(() => {
    new Grid(0, 0);
  }).toThrow('Grid dimensions must be positive');
});

// Testing async errors
it('should reject invalid level ID', async () => {
  await expect(loader.loadLevel(-1)).rejects.toThrow('Invalid level ID');
});

// Testing Firebase errors
it('should handle auth errors', async () => {
  (signIn as jest.Mock).mockRejectedValue({
    code: 'auth/user-not-found'
  });

  await expect(loginUser('invalid@test.com', 'password')).rejects.toThrow();
});
```

**Setup and Teardown:**

```typescript
describe('GameScene', () => {
  let game: Phaser.Game;
  let scene: GameScene;

  beforeAll(() => {
    // Initialize once for all tests in suite
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      scene: GameScene
    };
    game = new Phaser.Game(config);
  });

  beforeEach(() => {
    // Reset before each test
    scene = game.scene.getScene('GameScene') as GameScene;
    scene.reset();
  });

  afterEach(() => {
    // Clean up listeners, timers
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Destroy game instance
    game.destroy(true);
  });

  it('should initialize game state', () => {
    expect(scene.isRunning()).toBe(true);
  });
});
```

**Snapshot Testing (use sparingly):**

```typescript
// For level definitions or complex data structures
it('should match level snapshot', async () => {
  const level = await loader.loadLevel(1);
  expect(level).toMatchSnapshot();
});

// Update snapshots: npm test -- -u
```

---

*Testing analysis: 2026-02-05*
