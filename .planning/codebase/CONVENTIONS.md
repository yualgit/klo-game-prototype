# Coding Conventions

**Analysis Date:** 2026-02-10

## Naming Patterns

**Files:**
- PascalCase for class files: `Match3Engine.ts`, `SettingsManager.ts`, `ProgressManager.ts`, `TileSprite.ts`
- camelCase for utility files: `responsive.ts`, `constants.ts`
- Test files use pattern: `FileName.test.ts` (co-located with source): `Match3Engine.test.ts`, `BoosterActivator.test.ts`
- Barrel export files: `index.ts` (e.g., `src/scenes/index.ts`, `src/firebase/index.ts`)
- Scene files: PascalCase `Boot.ts`, `Menu.ts`, `LevelSelect.ts`, `Game.ts`

**Functions:**
- camelCase for all functions and methods: `getLives()`, `completeLevel()`, `activateBooster()`, `processTurn()`
- Private methods use `private` keyword with camelCase: `private save(): void`, `private applyCellMap(): void`
- Async functions follow same camelCase: `async loseLife()`, `async saveProgress()`

**Variables:**
- camelCase for const/let/var: `currentLevel`, `gridWidth`, `levelData`, `isProcessing`
- SCREAMING_SNAKE_CASE for constants: `MAX_LIVES`, `REGEN_INTERVAL_MS`, `MAX_CASCADE_DEPTH`, `DEFAULT_LIVES`
- Private class properties use camelCase: `private uid: string`, `private grid: TileData[][]`

**Types:**
- PascalCase for interfaces: `UserProgress`, `EconomyState`, `TileData`, `MatchResult`, `SpawnRules`
- Type unions use lowercase literal values: `type TileType = 'burger' | 'hotdog' | 'oil' | 'water' | 'snack' | 'soda' | 'empty'`
- Type variables: `K extends SettingsKey`, `K extends BoosterType`

## Code Style

**Formatting:**
- 2-space indentation (observed throughout)
- Trailing commas in multiline arrays/objects
- Semicolons required at end of statements
- No explicit formatter configured; TypeScript compiler is primary tool

**Linting:**
- No ESLint config file present
- TypeScript strict mode enabled in `tsconfig.json`: `"strict": true`
- Property initialization: `"strictPropertyInitialization": false` (explicitly relaxed for Phaser compatibility with lifecycle methods)
- No module path aliases configured (all relative imports)

## Import Organization

**Order (observed in `src/scenes/Game.ts`):**
1. External libraries: `import Phaser from 'phaser'`
2. Engine/core classes: `import { Match3Engine } from '../game/Match3Engine'`
3. Graphics/sprite classes: `import { TileSprite } from '../game/TileSprite'`
4. Type definitions: `import { TileData, SpawnRules, LevelGoal } from '../game/types'`
5. Game managers: `import { LevelManager } from '../game/LevelManager'`
6. Utilities: `import { TILE_SIZE } from '../utils/constants'`, `import { getResponsiveLayout } from '../utils/responsive'`

**Pattern from `src/scenes/Game.ts`:**
```typescript
import Phaser from 'phaser';
import { Match3Engine } from '../game/Match3Engine';
import { TileSprite } from '../game/TileSprite';
import { TileData, SpawnRules, LevelGoal, LevelEvent, MatchResult, TileType } from '../game/types';
import { TILE_SIZE } from '../utils/constants';
import { TILE_COLORS, GUI_TEXTURE_KEYS, TEXTURE_KEYS, BLOCK_TEXTURE_KEY } from '../game/constants';
import { LevelManager } from '../game/LevelManager';
import { BoosterActivator } from '../game/BoosterActivator';
import { ProgressManager } from '../game/ProgressManager';
import { EconomyManager } from '../game/EconomyManager';
import { AudioManager } from '../game/AudioManager';
import { VFXManager } from '../game/VFXManager';
import { getResponsiveLayout, cssToGame } from '../utils/responsive';
```

**Barrel Exports:**
- Used for scene modules: `src/scenes/index.ts` exports all four scenes
- Firebase has barrel export: `src/firebase/index.ts`

## Error Handling

**Patterns:**
- Try-catch blocks used in async initialization: `src/main.ts` entry point
- Promise-based error propagation: `main().catch(console.error)`
- Null coalescing with optional chaining: `this.state?.lives_regen_start?.toMillis()`
- Non-null assertion used selectively: `existingProgress!` after null check
- Firebase operations wrap in try-catch (see `FirestoreService`)
- localStorage access wrapped: `src/game/SettingsManager.ts` catches parse errors

**Example from `src/main.ts`:**
```typescript
try {
  const { uid, firestoreService } = await initFirebase();
  console.log('[Main] Firebase initialized, user:', uid);
  // ... initialization
} catch (error) {
  console.error('[Main] Failed to initialize:', error);
  throw error;
}
```

**Example from `src/game/SettingsManager.ts`:**
```typescript
static load(): SettingsData {
  try {
    const stored = localStorage.getItem(SettingsManager.STORAGE_KEY);
    if (!stored) {
      return new SettingsManager().getDefaults();
    }
    return JSON.parse(stored);
  } catch (error) {
    console.warn('[SettingsManager] Failed to load from localStorage:', error);
    return new SettingsManager().getDefaults();
  }
}
```

## Logging

**Framework:** Native `console` object (no external logging library)

**Patterns:**
- Bracket module name prefix for context: `[Main]`, `[Game]`, `[FirestoreService]`, `[SettingsManager]`, `[EconomyManager]`, `[Boot]`, `[LevelSelect]`, `[Menu]`
- Log levels: `console.log()` (info), `console.warn()` (warnings), `console.error()` (errors)
- Log on critical paths: initialization, async operations, game state changes, level events

**Examples from codebase:**
- `console.log('[Main] Firebase initialized, user:', uid);`
- `console.log('[Game] Level data loaded:', this.levelData);`
- `console.log('[Game] Level won!');`
- `console.warn('[LevelSelect] SettingsManager not found in registry');`
- `console.error('[Main] Failed to initialize:', error);`
- `console.log('[FirestoreService] Saving progress for ${uid}');`

## Comments

**When to Comment:**
- JSDoc blocks on all public classes and methods
- Explain purpose and behavior of managers and services
- Inline comments for non-obvious algorithm logic (e.g., gravity simulation, match detection heuristics)
- Single-line comments for implementation details in complex functions

**JSDoc/TSDoc:**
- Classes: describe purpose, singleton pattern if applicable
- Methods: @param and @returns for all public APIs
- Format: `/** ... */` blocks above declarations

**Examples:**
```typescript
/**
 * SettingsManager - Reactive settings with localStorage persistence.
 * Provides subscription pattern for settings changes (audio, animations).
 * Stores settings in localStorage for cross-session persistence.
 */
export class SettingsManager { ... }

/**
 * Get current lives count.
 * Automatically recalculates regeneration before returning.
 */
getLives(): number { ... }

/**
 * Save user progress to Firestore.
 * Uses merge to update only provided fields.
 *
 * @param uid User's Firebase UID
 * @param progress Progress data to save (partial update supported)
 */
async saveProgress(uid: string, progress: Partial<Omit<UserProgress, 'last_seen'>>): Promise<void> { ... }

/**
 * Match3Engine - Pure game logic for match-3 mechanics
 *
 * This class handles all core game algorithms as pure data operations,
 * enabling unit testing and separation from rendering.
 */
export class Match3Engine { ... }
```

## Function Design

**Size:** Methods typically 10-50 lines; longer methods split into private helpers
- Example: `Match3Engine` methods average 20-40 lines with clear responsibility
- Complex logic broken into: `applyGravity()`, `spawnNewTiles()`, `findMatches()`, `processTurn()`, `removeMatches()`

**Parameters:**
- Prefer individual parameters for 1-3 params
- Type all parameters explicitly
- Optional parameters use `?:` syntax: `cellMap?: number[][]`
- Default values with `??` for null coalescing

**Return Values:**
- Typed returns: `TileData[]`, `boolean`, `Promise<void>`, `Movement[]`
- Return null for "not found" (FirestoreService pattern)
- Return false for "operation failed" (EconomyManager.loseLife())
- Void for side-effect-only methods

## Module Design

**Exports:**
- Named exports for classes and interfaces: `export class Match3Engine { ... }`
- Single responsibility: ONE main class per file
- Type definitions exported: `export interface TileData { ... }`, `export type TileType = ...`

**Barrel Files:**
- `src/scenes/index.ts`: exports Boot, Menu, LevelSelect, Game
- `src/firebase/index.ts`: exports firebase initialization
- Simplifies config imports: `import { Boot, Menu, LevelSelect, Game } from './scenes'`

**Example `src/scenes/index.ts`:**
```typescript
/**
 * Scene exports for game configuration.
 */

export { Boot } from './Boot';
export { Menu } from './Menu';
export { LevelSelect } from './LevelSelect';
export { Game } from './Game';
```

## Class Architecture

**Singletons:**
- Managers are pseudo-singletons created in `main.ts`, stored in Phaser registry
- Pattern: constructor takes injected dependencies
- Examples: `ProgressManager`, `EconomyManager`, `SettingsManager`
- Accessed via: `this.registry.get('progress') as ProgressManager`

**Pure Logic Classes:**
- `Match3Engine`: No Phaser dependency, pure data operations for testing
- `BoosterActivator`: Works with engine state, no rendering
- `LevelManager`: Tracks goals and moves, emits events

**Service Managers:**
- Encapsulate domain logic: economy, progress, settings, audio, VFX
- Firebase integration in `FirestoreService`: load/save operations
- Separation: pure logic separate from Phaser rendering
- `TileSprite`: Bridges engine state to Phaser graphics

## TypeScript-Specific Patterns

**Strict Mode:**
- All variables must have explicit types
- Non-null assertions used carefully: `existingProgress!` after null checks
- Type guards: `this.registry.get('economy') as EconomyManager`
- Optional chaining: `this.state.lives_regen_start?.toMillis()`

**Generics:**
- SettingsManager: `subscribe<K extends SettingsKey>(key: K, callback: SettingsListener<K>)`
- Typed subscriptions with discriminated unions

**Type Unions (instead of Enums):**
- `type TileType = 'burger' | 'hotdog' | 'oil' | 'water' | 'snack' | 'soda' | 'empty'`
- `type BoosterType = 'linear_horizontal' | 'linear_vertical' | 'bomb' | 'klo_sphere'`
- `type ObstacleType = 'ice' | 'grass' | 'crate' | 'blocked'`
- Discriminated unions for events: `type LevelEvent = { type: 'moves_changed'; movesRemaining: number } | { type: 'goals_updated'; goals: LevelGoal[] } | ...`

---

*Convention analysis: 2026-02-10*
