# Coding Conventions

**Analysis Date:** 2026-02-05

## Naming Patterns

**Files:**
- PascalCase for class/component files: `Grid.ts`, `Match.ts`, `Booster.ts`
- camelCase for utility/helper files: `constants.ts`, `helpers.ts`
- camelCase for firebase service files: `auth.ts`, `firestore.ts`, `analytics.ts`
- kebab-case for scene files within scenes directory: `Boot.ts`, `Menu.ts`, `Game.ts`, `UI.ts` (following Phaser convention of PascalCase for scene classes)
- Index files use lowercase: `index.ts` for barrel exports

**Functions:**
- camelCase for all functions: `generateCoupon()`, `redeemCoupon()`, `loadLevel()`
- Prefix action functions with verb: `loadLevel()`, `updateProgress()`, `validateCoupon()`
- Firebase functions use camelCase: `generateCoupon`, `redeemCoupon`
- Public methods are camelCase, private methods prefixed with underscore: `_calculateGridState()`

**Variables:**
- camelCase for all variables: `currentLevel`, `userProgress`, `isGameActive`
- CONSTANT_CASE for module-level constants: `MAX_MOVES`, `GRID_WIDTH`, `COUPON_EXPIRY_DAYS`
- Boolean variables prefixed with `is`, `has`, `can`, `should`: `isLevelComplete`, `hasActiveBooster`, `canSwapTiles`
- Firebase document IDs use snake_case: `user_id`, `level_id`, `coupon_id`, `loyalty_id`

**Types:**
- PascalCase for interfaces and types: `User`, `Level`, `CouponDoc`, `Goal`
- Use `I` prefix for interfaces only if following strict interface pattern, otherwise omit
- Generic type parameters use single uppercase letters or PascalCase: `T`, `K`, `V` for single letters; `TileType`, `ObstacleType` for complex types

## Code Style

**Formatting:**
- 2-space indentation (standard for modern TypeScript/JavaScript projects)
- Line length: 100 characters (soft limit, 120 hard limit)
- Trailing commas in multiline objects/arrays/parameters
- Semicolons required at end of statements
- Single quotes for strings (unless interpolation required)
- Use template literals for string interpolation: `` `Level ${levelId}` ``

**Linting:**
- Use ESLint with TypeScript parser
- Recommend ESLint + Prettier for code formatting consistency
- Configuration file: `.eslintrc.json` or `eslint.config.js`
- TypeScript strict mode enabled (`strict: true` in tsconfig.json)

**Phaser 3 Specifics:**
- Scene classes extend `Phaser.Scene`
- Use `create()`, `update()`, and `preload()` lifecycle methods per Phaser convention
- Game configuration follows `Phaser.Types.Core.GameConfig` type
- Event naming follows Phaser emitter pattern: `this.events.on('eventName', callback)`

## Import Organization

**Order:**
1. External packages/libraries (Phaser, Firebase, third-party)
2. Internal type definitions and interfaces (from `./types` or `./data` if dedicated folder)
3. Services and utilities (from `./firebase`, `./utils`, `./services`)
4. Game logic classes (from `./game`)
5. Constants (from `./constants` or `./utils/constants`)
6. Relative imports (siblings in same directory)

**Path Aliases:**
- Use `@/` for root src directory imports (if configured in `tsconfig.json`)
- Example: `import { LevelLoader } from '@/data/LevelLoader'`
- This improves readability and reduces brittle relative paths

**Example Import Structure:**
```typescript
import Phaser from 'phaser';
import { initializeApp } from 'firebase/app';

import { Level, Goal, Obstacle } from '@/types/level';
import { FirebaseService } from '@/firebase/firestore';
import { LevelLoader } from '@/data/LevelLoader';
import { Grid } from '@/game/Grid';
import { GRID_WIDTH, GRID_HEIGHT } from '@/utils/constants';
```

## Error Handling

**Patterns:**
- Throw typed errors with meaningful messages for logical errors
- Use try-catch blocks for async operations (Firebase calls, level loading)
- Firebase errors: catch specific error codes (auth/user-not-found, firestore/permission-denied)
- Level loading failures: wrap JSON parsing in try-catch, provide fallback behavior
- Game state errors: validate state transitions before executing (e.g., can't start level if not loaded)

**Example Error Pattern:**
```typescript
async function loadLevel(levelId: number): Promise<Level> {
  try {
    const response = await fetch(`/data/levels/level_${String(levelId).padStart(3, '0')}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load level ${levelId}: ${response.statusText}`);
    }
    const level = await response.json() as Level;
    validateLevelSchema(level); // Custom validation
    return level;
  } catch (error) {
    console.error(`Level loading failed for level ${levelId}`, error);
    throw new Error(`Cannot load level ${levelId}`);
  }
}
```

**Firebase Error Handling:**
```typescript
async function generateCoupon(userId: string, levelId: number): Promise<Coupon | null> {
  try {
    const result = await functions.httpsCallable('generateCoupon')({ userId, levelId });
    return result.data as Coupon;
  } catch (error: any) {
    if (error.code === 'functions/budget-exceeded') {
      console.warn('Coupon budget exceeded, returning booster reward instead');
      return null;
    }
    throw error;
  }
}
```

## Logging

**Framework:** console methods (console.log, console.warn, console.error)

**Patterns:**
- Use `console.log()` for informational messages during development/debugging
- Use `console.warn()` for non-fatal issues (coupon generation failures, level load delays)
- Use `console.error()` for errors that should be tracked (missing assets, Firebase auth failures)
- Include context in logs: include level_id, user_id, or operation name
- Firebase Analytics is primary telemetry tool (not console)

**Log Levels by Feature:**
- **Level Loading:** Info on success, error on failure
- **Game State:** Warn on invalid transitions, error on critical state corruption
- **Firebase:** Error on auth/connection failures, warn on rate limits
- **Analytics:** Info on event tracking (optional, only during debugging)

**Example Logging:**
```typescript
console.log(`Level ${levelId} started by user ${userId}`);
console.warn(`Cannot create booster: insufficient items at level ${levelId}`);
console.error(`Firebase authentication failed: ${error.message}`);
```

## Comments

**When to Comment:**
- Explain "why" not "what" — code should be clear about what it does
- Comment non-obvious game logic (e.g., why fail rate is targeted at specific percentage)
- Comment Firebase integration complexities (authentication flow, Cloud Function limitations)
- Comment grid gravity and match detection algorithms (inherently complex)
- Do NOT comment obvious code: `const x = 5; // set x to 5` (unnecessary)

**JSDoc/TSDoc:**
- Use JSDoc comments for public functions and exported types
- Include `@param`, `@returns`, `@throws` tags for complex functions
- Document Firebase function contracts (what data structure is expected/returned)

**Example JSDoc:**
```typescript
/**
 * Loads a level definition from JSON and validates schema.
 * @param levelId - The level ID (1-indexed)
 * @returns Parsed and validated Level object
 * @throws Error if level not found or schema invalid
 */
async function loadLevel(levelId: number): Promise<Level> {
  // ...
}

/**
 * Generates a coupon for user with fraud checks and budget validation.
 * @param userId - Firebase UID of the user
 * @param levelId - Level ID where coupon was earned
 * @returns Generated coupon or null if budget exhausted
 * @throws Error on critical failures (auth, database)
 */
async function generateCoupon(userId: string, levelId: number): Promise<Coupon | null> {
  // ...
}
```

## Function Design

**Size:**
- Aim for functions <50 lines (soft limit)
- Complex algorithms (grid matching, gravity) can be 50-100 lines if well-structured
- If function exceeds 100 lines, consider breaking into helper functions
- Phaser lifecycle methods (create, update) can be longer but should delegate to helper methods

**Parameters:**
- Maximum 3-4 parameters per function
- If more needed, use object destructuring or configuration object
- Example: `createGame({ levelId, userId, difficulty })` instead of `createGame(levelId, userId, difficulty, ...)`

**Return Values:**
- Single return type (avoid union types like `string | null` unless necessary)
- Use optional chaining and nullish coalescing for safe null handling
- For async operations, always return Promise<T>
- For void operations (event handlers), explicitly type as `(): void`

**Example Function Design:**
```typescript
// Good: clear parameters via destructuring
function updateGridState(config: { grid: Tile[][]; gravity: boolean; spawn: boolean }): void {
  const { grid, gravity, spawn } = config;
  if (gravity) applyGravity(grid);
  if (spawn) spawnNewTiles(grid);
}

// Good: single responsibility
function calculateMatchesAt(grid: Tile[][], x: number, y: number): Tile[] {
  return [
    ...findHorizontalMatch(grid, x, y),
    ...findVerticalMatch(grid, x, y)
  ];
}

// Avoid: too many parameters
function updateProgress(userId, levelId, stars, moves, time, boosterUsed, couponsEarned) {
  // ❌ Too many params
}

// Good: configuration object
function updateProgress(userId: string, config: ProgressUpdate): void {
  const { levelId, stars, moves, time, boosterUsed, couponsEarned } = config;
  // ✅ Clear, maintainable
}
```

## Module Design

**Exports:**
- Export named exports from modules, not default exports (easier tree-shaking, explicit imports)
- Example: `export class Grid { }` and `import { Grid } from '@/game/Grid'`
- Avoid default exports in service files
- Default exports acceptable for scene classes (Phaser convention): `export default class Game extends Phaser.Scene { }`

**Barrel Files:**
- Use `index.ts` files to re-export from subdirectories for cleaner imports
- Example in `src/game/index.ts`: `export { Grid } from './Grid'; export { Match } from './Match';`
- Import as: `import { Grid, Match } from '@/game'` instead of individual paths

**Example Module Structure:**
```typescript
// src/game/index.ts (barrel file)
export { Grid } from './Grid';
export { Tile } from './Tile';
export { Match } from './Match';
export { Booster } from './Booster';

// Usage in another module
import { Grid, Match, Booster } from '@/game';
```

**Separation of Concerns:**
- Game logic in `src/game/` (Grid, Match, Tiles)
- Firebase integration in `src/firebase/` (auth, firestore, functions)
- Data loading in `src/data/` (LevelLoader, RemoteConfig)
- Phaser scenes in `src/scenes/` (Boot, Menu, Game, UI)
- Utilities in `src/utils/` (constants, helpers, types if small)

## Firebase Integration Conventions

**File Structure:**
- `src/firebase/auth.ts` — Authentication (login, logout, user management)
- `src/firebase/firestore.ts` — Database operations (user progress, coupons, stats)
- `src/firebase/analytics.ts` — Event tracking (level_start, coupon_claimed, etc.)
- `src/firebase/functions.ts` — Cloud Function calls (generateCoupon, redeemCoupon)

**Function Naming:**
- Firebase Cloud Functions in `functions/src/` use camelCase: `generateCoupon`, `redeemCoupon`
- Client-side wrapper functions are descriptive: `generateCouponForUser()`, `redeemCouponAtStation()`

**Error Codes:**
- Document Firebase error codes handled in catch blocks
- Example: `functions/budget-exceeded`, `auth/user-not-found`, `firestore/permission-denied`

---

*Convention analysis: 2026-02-05*
