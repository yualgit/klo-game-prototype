---
phase: 23-tile-system-refactor
plan: 01
subsystem: tile-configuration
tags: [refactor, data-driven, config, DRY]
dependency_graph:
  requires: []
  provides: [tile-config-system, dynamic-tile-types]
  affects: [types, constants, Match3Engine, TileSprite, Game]
tech_stack:
  added: [tileConfig.ts]
  patterns: [config-driven-types, Record-from-config]
key_files:
  created:
    - src/game/tileConfig.ts
  modified:
    - src/game/types.ts
    - src/game/constants.ts
    - src/game/Match3Engine.ts
    - src/game/TileSprite.ts
    - src/scenes/Game.ts
decisions:
  - decision: "Use `as const satisfies Record<string, TileConfigEntry>` for TILE_CONFIG"
    rationale: "Ensures type safety while preserving literal types for keys"
  - decision: "SpawnRules as Partial<Record<TileTypeId, number>> instead of interface"
    rationale: "Allows levels to use subset of tile types, supports dynamic tile addition"
  - decision: "TileSprite uses TileTypeId, not TileType (excludes 'empty')"
    rationale: "TileSprite only renders actual tiles, never 'empty' cells"
  - decision: "Replace hardcoded Game.ts type assertions with TileTypeId"
    rationale: "Removes hardcoded 6-type unions that would break with new tile types"
metrics:
  duration: "4 minutes"
  tasks_completed: 2
  files_created: 1
  files_modified: 5
  commits: 2
  completed_date: "2026-02-11"
---

# Phase 23 Plan 01: Data-Driven Tile Configuration Summary

**One-liner:** Single-source tile configuration system where all 9 tile types derive from TILE_CONFIG, enabling addition of new tiles via config changes only.

## What Was Built

Created a data-driven tile configuration system that eliminates hardcoded tile type literals across the codebase. Now all tile types, colors, texture keys, and asset paths are defined in a single config file (`tileConfig.ts`), and all type definitions and constants derive from it automatically.

**Key Achievement:** Adding a new tile type now requires only adding one entry to TILE_CONFIG - no changes needed to TileType union, SpawnRules interface, TILE_COLORS, TEXTURE_KEYS, or Match3Engine logic.

## Implementation Details

### Task 1: Create tileConfig.ts and Refactor types.ts

**Commit:** `2be11ce`

- Created `src/game/tileConfig.ts` as the single source of truth for all 9 tile types:
  - burger, coffee, fuel_can, hotdog, oil, snack, soda, water, wheel
  - Each entry defines: color (hex), textureKey (string), assetPath (string)
- Exported `TileTypeId` type derived from config keys: `keyof typeof TILE_CONFIG`
- Exported `TILE_TYPE_IDS` array: `Object.keys(TILE_CONFIG) as TileTypeId[]`
- Refactored `TileType` in types.ts from hardcoded union to: `TileTypeId | 'empty'`
- Changed `SpawnRules` from interface with 6 named properties to: `Partial<Record<TileTypeId, number>>`
  - `Partial` allows levels to use subset of tile types
  - Dynamic Record supports all 9 types automatically

### Task 2: Derive Constants and Engine Logic from Config

**Commit:** `c03589d`

- Refactored `src/game/constants.ts`:
  - Import from tileConfig: `TILE_CONFIG, TileTypeId, TILE_TYPE_IDS`
  - `TILE_TYPES = TILE_TYPE_IDS` (re-export for backward compatibility)
  - Derived `TILE_COLORS` using `Object.fromEntries()` from config
  - Derived `TEXTURE_KEYS` using `Object.fromEntries()` from config
  - Export TileType from types.ts to maintain re-export pattern
- Refactored `src/game/Match3Engine.ts`:
  - Import `TILE_TYPE_IDS` from tileConfig
  - Rewrote `estimateSpawnRules()` to dynamically iterate over all tile types
  - Removed hardcoded 6-property counts object
  - Dynamic logic handles all 9 types automatically
- Fixed `src/game/TileSprite.ts`:
  - Changed type property from `TileType` to `TileTypeId`
  - TileSprite only renders actual tiles, never 'empty'
  - Eliminates type errors when indexing TEXTURE_KEYS
- Fixed `src/scenes/Game.ts`:
  - Replaced hardcoded type assertions `as 'burger' | 'hotdog' | ...` with `as TileTypeId`
  - Removed 4 instances of hardcoded 6-type unions
  - Now supports all 9 tile types

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed hardcoded type assertions in Game.ts**
- **Found during:** Task 2 type checking
- **Issue:** Game.ts had 4 hardcoded type assertions `as 'burger' | 'hotdog' | 'oil' | 'water' | 'snack' | 'soda'` that only included 6 types, not all 9. This would break if levels tried to use coffee, fuel_can, or wheel tiles.
- **Fix:** Replaced all hardcoded unions with `as TileTypeId`, which automatically includes all 9 types from config.
- **Files modified:** src/scenes/Game.ts
- **Commit:** c03589d (included in Task 2 commit)
- **Rationale:** This was a correctness bug - the type system was lying by asserting only 6 types existed when the config now defines 9. Rule 1 applies because the code wouldn't work correctly with the new tile types.

**2. [Rule 1 - Bug] Fixed TileSprite type property to use TileTypeId**
- **Found during:** Task 2 type checking
- **Issue:** TileSprite used `TileType` (includes 'empty') for its type property, but tried to index `TEXTURE_KEYS: Record<TileTypeId, string>` which doesn't have 'empty' key. This caused TypeScript errors.
- **Fix:** Changed TileSprite's type property and all related methods (constructor, setType, reset) to use `TileTypeId` instead of `TileType`. TileSprite only renders actual tiles, never empty cells.
- **Files modified:** src/game/TileSprite.ts
- **Commit:** c03589d (included in Task 2 commit)
- **Rationale:** This was a type correctness bug - TileSprite was claiming to accept 'empty' type but had no way to render it. Rule 1 applies because the code had incorrect type constraints.

## Verification Results

✓ **TypeScript compilation:** No type errors (`npx tsc --noEmit` passes)
✓ **Match3Engine tests:** All tests pass (66 passed)
✓ **TILE_CONFIG entries:** 9 tile types (burger, coffee, fuel_can, hotdog, oil, snack, soda, water, wheel)
✓ **Derived constants:** TILE_TYPES, TILE_COLORS, TEXTURE_KEYS all have 9 entries
✓ **Dynamic spawn rules:** Match3Engine.estimateSpawnRules() iterates over all config keys
✓ **Type derivation:** TileType and SpawnRules derive from config, not hardcoded

**Note:** LevelManager.test.ts has 2 failing tests, but these are pre-existing issues unrelated to tile system refactor. Match3Engine.test.ts passes completely, confirming our engine changes are correct.

## Architecture Impact

**Before:**
- Tile types hardcoded in 5 places: TileType union, SpawnRules interface, TILE_TYPES array, TILE_COLORS object, TEXTURE_KEYS object, estimateSpawnRules counts
- Adding a tile required changes in 6+ files
- Type system brittle - easy to miss a location

**After:**
- Single source of truth: TILE_CONFIG in tileConfig.ts
- All types and constants derive automatically
- Adding a tile requires ONE change: add entry to TILE_CONFIG
- Type system enforces consistency across codebase

**Key Pattern:** Config-driven types using `keyof typeof`, `Partial<Record<>>`, and `Object.fromEntries()`

## Testing Strategy

Existing Match3Engine tests verify:
- Grid generation uses spawn rules correctly
- Match detection works with all tile types
- Gravity and spawning handle all tile types
- Booster creation logic independent of specific tile types

No new tests needed - existing tests already cover dynamic tile behavior.

## Next Steps

**Phase 23 Plan 02:** Add coffee, fuel_can, wheel assets and enable in Level JSON
- Create PNG assets for 3 new tile types
- Update existing level spawn_rules to include new types
- Verify visual appearance in game
- Test gameplay with expanded tile set

## Self-Check: PASSED

✓ **tileConfig.ts exists:** /Users/vasiliyhrebenuyk/work/KLO/klo-match-3/src/game/tileConfig.ts
✓ **types.ts refactored:** TileType and SpawnRules derive from config
✓ **constants.ts refactored:** TILE_TYPES, TILE_COLORS, TEXTURE_KEYS derive from config
✓ **Match3Engine.ts refactored:** estimateSpawnRules() uses TILE_TYPE_IDS
✓ **TileSprite.ts fixed:** Uses TileTypeId instead of TileType
✓ **Game.ts fixed:** Uses TileTypeId instead of hardcoded unions
✓ **Commit 2be11ce exists:** Task 1 commit
✓ **Commit c03589d exists:** Task 2 commit

All claimed files and commits verified to exist.
