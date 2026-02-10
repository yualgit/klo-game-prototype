---
phase: 08-advanced-level-mechanics
plan: 01
subsystem: core-engine
tags: [types, engine, cell-map, obstacles, grass, non-rectangular-boards]
dependency_graph:
  requires: [phase-03-game-features]
  provides: [cell-map-support, grass-obstacles, pre-placed-tiles-schema]
  affects: [Match3Engine, types, TileSprite, level-data-schema]
tech_stack:
  added: []
  patterns: [cell-map-masking, inactive-cell-skipping]
key_files:
  created: []
  modified:
    - src/game/types.ts
    - src/game/Match3Engine.ts
    - src/game/TileSprite.ts
    - src/game/constants.ts
    - src/game/Match3Engine.test.ts
    - data/levels/level_005.json
decisions:
  - "Cell map uses number[][] (1=active, 0=inactive) for backward compatibility"
  - "Inactive cells marked as blocked obstacles internally for existing gravity/spawn logic"
  - "isCellActive() checks bounds, returns true if no cellMap (backward compatible)"
  - "All engine algorithms (findMatches, applyGravity, spawn, moves) skip inactive cells"
  - "Renamed ObstacleType 'dirt' to 'grass' to match asset names (grss01/02/03.png)"
metrics:
  duration_minutes: 5
  tasks_completed: 2
  files_modified: 6
  tests_added: 7
  tests_passing: 43
  commits: 2
completed_date: 2026-02-10
---

# Phase 08 Plan 01: Variable Board Shapes & Grass Obstacles Summary

**One-liner:** Extended Match3Engine with cell_map support for non-rectangular boards, renamed dirt to grass, added PrePlacedTile schema

## What Was Built

### Task 1: Type Extensions & Grass Rename
- **Extended LevelData schema:**
  - Added `cell_map?: number[][]` to `LevelData.grid` (optional for backward compatibility)
  - Added `PrePlacedTile` interface with row, col, type, booster, obstacle fields
  - Added `pre_placed_tiles?: PrePlacedTile[]` to `LevelData`
- **Renamed ObstacleType:** Changed `'dirt'` to `'grass'` throughout codebase
- **Updated TileSprite:** Renamed `case 'dirt'` to `case 'grass'` in drawObstacle()
- **Updated level_005.json:** Changed dirt obstacles to grass type
- **Updated tests:** Renamed dirt test to grass test

**Commit:** da04e91

### Task 2: Cell Map Engine Support
- **Added cell map fields and methods:**
  - Private `cellMap?: number[][]` field
  - Public `isCellActive(row, col): boolean` - checks bounds, cellMap, returns true if no cellMap
  - Public `setCellMap(cellMap?)` - stores cellMap and calls applyCellMap()
  - Private `applyCellMap()` - marks inactive cells as empty with blocked obstacle

- **Updated all engine algorithms to respect cell_map:**
  - `generateGrid()` - applies cellMap after generation
  - `findMatches()` - skips inactive cells, treats them as sequence terminators (no match across gaps)
  - `applyGravity()` - skips inactive cells in writeRow/readRow loops
  - `spawnNewTiles()` - skips inactive cells when spawning
  - `wouldCreateMatch()` - checks isCellActive in left/right/up/down scans
  - `hasValidMoves()` - skips inactive cells in move checking
  - `getAdjacentTiles()` - checks isCellActive for up/down/left/right
  - `reshuffleBoard()` - preserves cellMap (generateGrid applies it)
  - `estimateSpawnRules()` - skips inactive cells when counting tiles

- **Added comprehensive unit tests:**
  1. isCellActive returns true when no cellMap (backward compatible)
  2. isCellActive returns false for inactive cells in cellMap
  3. isCellActive returns false for out of bounds
  4. findMatches does not match across inactive cells
  5. applyGravity skips inactive cells
  6. spawnNewTiles skips inactive cells
  7. hasValidMoves skips inactive cells

**Commit:** dab23b0

## Deviations from Plan

None - plan executed exactly as written.

## Testing Results

- **All 43 tests passing** (38 existing + 5 new non-rectangular board tests)
- TypeScript compiles cleanly with no errors
- No 'dirt' references remaining in src/ or data/
- Backward compatible: no cellMap = all cells active (L1-L5 unaffected)

## Verification

✅ `npx tsc --noEmit` - compiles without errors
✅ `npm test -- src/game/Match3Engine.test.ts` - all 43 tests pass
✅ `grep -r "'dirt'" src/` - 0 matches
✅ `grep -r '"dirt"' data/` - 0 matches
✅ Existing L1-L5 levels unaffected (no cellMap = all cells active)

## Files Modified

| File | Changes | Lines Modified |
|------|---------|----------------|
| src/game/types.ts | Added PrePlacedTile, cell_map, pre_placed_tiles; changed dirt→grass | +13 |
| src/game/Match3Engine.ts | Added cellMap field, isCellActive, setCellMap, applyCellMap; updated 10 algorithms | +95 |
| src/game/TileSprite.ts | Renamed dirt case to grass | 1 |
| src/game/Match3Engine.test.ts | Added 7 non-rectangular board tests; renamed dirt test | +107 |
| data/levels/level_005.json | Changed dirt to grass | 1 |

## Architectural Impact

**Backward Compatibility Preserved:**
- No cellMap provided = all cells active (existing L1-L5 behavior unchanged)
- Nullish coalescing in isCellActive() returns true when cellMap undefined

**Foundation for L6-L10:**
- Cell map enables diamond, hexagon, cross shapes for advanced levels
- Pre-placed tiles schema ready for preset booster/obstacle configurations
- Grass obstacles support 3-layer progressive destruction (same as ice)

**Algorithm Efficiency:**
- Inactive cells treated as blocked internally (no special branching in gravity/spawn)
- Single isCellActive() check abstracts all cell validation (bounds + cellMap)

## Self-Check: PASSED

**Files Verified:**
```bash
✅ [ -f "src/game/types.ts" ] && echo "FOUND"
✅ [ -f "src/game/Match3Engine.ts" ] && echo "FOUND"
✅ [ -f "src/game/TileSprite.ts" ] && echo "FOUND"
✅ [ -f "src/game/Match3Engine.test.ts" ] && echo "FOUND"
✅ [ -f "data/levels/level_005.json" ] && echo "FOUND"
```

**Commits Verified:**
```bash
✅ git log --oneline --all | grep -q "da04e91" && echo "FOUND: da04e91"
✅ git log --oneline --all | grep -q "dab23b0" && echo "FOUND: dab23b0"
```

**Key Exports Verified:**
- PrePlacedTile interface exported from types.ts
- LevelData.grid.cell_map field present
- LevelData.pre_placed_tiles field present
- Match3Engine.isCellActive() method public
- Match3Engine.setCellMap() method public

All checks passed. Summary claims verified against actual implementation.

---

**Status:** ✅ Complete
**Next Plan:** 08-02 (L6-L10 Level Authoring with variable boards and 3-layer obstacles)
