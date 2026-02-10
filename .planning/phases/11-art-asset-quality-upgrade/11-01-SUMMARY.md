---
phase: 11-art-asset-quality-upgrade
plan: 01
subsystem: type-system, assets, levels
tags: [foundation, types, assets, levels]
dependency_graph:
  requires: [phase-10]
  provides: [6-tile-type-system, new-asset-loading, updated-level-configs]
  affects: [Match3Engine, Boot, all-levels]
tech_stack:
  added: []
  patterns: [generic-spawn-rules-iteration]
key_files:
  created: []
  modified:
    - src/game/types.ts
    - src/game/constants.ts
    - src/game/Match3Engine.ts
    - src/scenes/Boot.ts
    - data/levels/level_001.json through level_010.json
    - public/data/levels/level_001.json through level_005.json
decisions:
  - Generic Object.entries approach for spawn rules iteration (supports any tile types)
  - Equal 6-way split for empty board fallback (0.167 each with rounding to 0.166 for last two)
  - Levels 6-10 use inactive_cell_style: block for visual clarity
  - Spawn weight distributions preserve gameplay feel (dominant tiles keep higher weights)
metrics:
  duration_seconds: 239
  tasks_completed: 3
  files_modified: 19
  commits: 3
  completed_date: 2026-02-10
---

# Phase 11 Plan 01: Tile Type System & Asset Foundation Summary

**One-liner:** Migrated from 4 old tile types to 6 new KLO-themed types (burger/hotdog/oil/water/snack/soda), added booster/block asset loading, and updated all 10 level configs with new spawn rules and inactive cell styling.

## Overview

This plan established the foundation for the art asset quality upgrade by replacing the entire tile type system, updating asset loading, and migrating all level configurations. The changes enable subsequent plans to reference the new tile types and assets without breaking existing functionality.

**Key outcomes:**
- Type system now supports 6 tile types (burger, hotdog, oil, water, snack, soda)
- Match3Engine uses generic spawn rule iteration (supports any tile type count)
- Boot scene loads 6 new tile PNGs, 4 booster PNGs, and 1 block PNG
- All 10 levels use new tile types in spawn_rules and goals
- Levels 6-10 have inactive_cell_style for visual clarity

## Tasks Completed

### Task 1: Update type system and constants for 6 new tile types
**Commit:** 505a62a

- Changed `TileType` union from fuel/coffee/snack/road to burger/hotdog/oil/water/snack/soda
- Updated `SpawnRules` interface with all 6 new tile types
- Added `inactive_cell_style?: 'block' | 'transparent'` to LevelData.grid
- Updated `TILE_TYPES`, `TILE_COLORS`, `TEXTURE_KEYS` constants
- Added `BOOSTER_TEXTURE_KEYS` and `BLOCK_TEXTURE_KEY` constants

**Files:** src/game/types.ts, src/game/constants.ts

### Task 2: Update Match3Engine and Boot scene for new tile types
**Commit:** 2edc977

- Refactored `getRandomTileType()` to use generic `Object.entries()` iteration (supports any tile type count)
- Updated `estimateSpawnRules()` to count all 6 new types with 0.167 fallback
- Replaced old tile asset loads with 6 new tile PNGs
- Added 4 booster sprite loads (bomb, horizontal, vertical, sphere)
- Added block texture load

**Files:** src/game/Match3Engine.ts, src/scenes/Boot.ts

### Task 3: Update all level JSONs with new tile types and inactive cell style
**Commit:** f2f3fcb

- Updated spawn_rules in all 10 levels: fuel→burger, coffee→hotdog, road→oil, added water and soda
- Updated goals: fuel→burger (levels 1,3,6,10), coffee→hotdog (levels 2,4,7), snack stays (levels 5,8)
- Added `inactive_cell_style: "block"` to levels 6-10 (with cell_map)
- Updated pre_placed_tiles in levels 8 and 10 to use burger/hotdog instead of fuel/coffee
- Synced public/data/levels for levels 1-5

**Files:** data/levels/level_001.json through level_010.json, public/data/levels/level_001.json through level_005.json

**Spawn weight distributions (preserving gameplay feel):**
- Level 1: burger-dominant (0.30)
- Level 2: burger+hotdog equal (0.25 each)
- Level 3: burger-dominant (0.30)
- Level 4: hotdog-dominant (0.30)
- Level 5: snack-dominant (0.30)
- Level 6-10: varied distributions maintaining original dominant tile patterns

## Deviations from Plan

None — plan executed exactly as written.

## Verification

All success criteria met:
- ✅ TypeScript compiles without errors (only test file errors remain, as expected)
- ✅ No references to fuel/coffee/road/light in types.ts, constants.ts, Match3Engine.ts, Boot.ts
- ✅ Boot.ts loads exactly 6 tile images, 4 booster images, 1 block image
- ✅ All spawn_rules in level JSONs have exactly 6 fields summing to 1.0
- ✅ Levels 6-10 have `inactive_cell_style` in grid config
- ✅ Grep for old tile types in level JSONs returns only coupon metadata (not tile types)

## Technical Details

### Generic Spawn Rules Iteration

The refactored `getRandomTileType()` uses `Object.entries()` to iterate over spawn rules generically, eliminating hardcoded tile type references:

```typescript
private getRandomTileType(spawnRules: SpawnRules): TileType {
  const entries = Object.entries(spawnRules) as [TileType, number][];
  const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
  const random = Math.random() * totalWeight;
  let cumulative = 0;
  for (const [type, weight] of entries) {
    cumulative += weight;
    if (random < cumulative) return type;
  }
  return entries[entries.length - 1][0]; // Fallback
}
```

This pattern supports any number of tile types without code changes.

### Asset Loading

Boot scene now loads:
- **Tiles:** burger.png, hotdog.png, oil.png, water.png, snack.png, soda.png
- **Boosters:** bomb.png, klo_horizontal.png, klo_vertical.png, klo_sphere.png
- **Blocks:** block.png

All paths follow `assets/{category}/{name}.png` convention.

## Impact

### Immediate
- Type system is now KLO-themed and matches brand identity
- Spawn rule iteration is generic and extensible
- Level configs reference new tile types (ready for new assets)

### Next Steps (for subsequent plans)
- Plan 02: Replace placeholder tile assets with high-quality 1024px sprites
- Plan 03+: Update TileSprite rendering to use new texture keys
- Game scene can now reference BOOSTER_TEXTURE_KEYS and BLOCK_TEXTURE_KEY

## Self-Check

### Created Files
All files already existed — modifications only.

### Modified Files
✅ FOUND: src/game/types.ts
✅ FOUND: src/game/constants.ts
✅ FOUND: src/game/Match3Engine.ts
✅ FOUND: src/scenes/Boot.ts
✅ FOUND: data/levels/level_001.json through level_010.json
✅ FOUND: public/data/levels/level_001.json through level_005.json

### Commits
✅ FOUND: 505a62a (Task 1: type system)
✅ FOUND: 2edc977 (Task 2: Match3Engine and Boot)
✅ FOUND: f2f3fcb (Task 3: level configs)

## Self-Check: PASSED

All files exist, all commits are in git history, and all verification checks pass.
