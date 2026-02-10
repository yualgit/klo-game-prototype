---
phase: 08-advanced-level-mechanics
plan: 02
subsystem: scenes-levels
tags: [Game, Boot, LevelSelect, level-design, variable-boards, pre-placed-tiles]
dependency_graph:
  requires: [08-01]
  provides: [L6-L10-levels, 10-level-progression, variable-board-rendering]
  affects: [Game, Boot, LevelSelect, level-data]
tech_stack:
  added: []
  patterns: [dynamic-grid-dimensions, inactive-cell-masking, pre-placed-booster-spawning]
key_files:
  created:
    - data/levels/level_006.json
    - data/levels/level_007.json
    - data/levels/level_008.json
    - data/levels/level_009.json
    - data/levels/level_010.json
  modified:
    - src/scenes/Game.ts
    - src/scenes/Boot.ts
    - src/scenes/LevelSelect.ts
decisions:
  - "Read gridWidth/gridHeight from level data instead of hardcoded constants"
  - "tileSprites array changed to (TileSprite | null)[][] to handle inactive cells"
  - "Inactive cells masked with scene background color (0xFFFBF0) in drawGridBackground"
  - "All rendering methods (animate*, sync*, getTileAtPointer) skip null sprites with guards"
  - "Coupon trigger moved from level 5 to level 10 (final challenge)"
  - "LevelSelect checkpoints redistributed from 5 to 10 positions with tighter vertical spacing"
metrics:
  duration_minutes: 4
  tasks_completed: 2
  files_modified: 8
  levels_created: 5
  commits: 2
completed_date: 2026-02-10
---

# Phase 08 Plan 02: L6-L10 Level Authoring & Variable Board Integration Summary

**One-liner:** Wired cell_map and pre-placed tiles into Game scene, created 5 new levels (L6-L10) showcasing diamond/hourglass/cross/wide-center/L-shaped boards with 3-layer obstacles and pre-placed boosters, expanded Boot/LevelSelect to 10 levels.

## What Was Built

### Task 1: Wire cell_map and pre-placed tiles into Game scene

**Updated Game.ts to support variable boards:**

1. **Dynamic grid dimensions:**
   - Read `gridWidth` and `gridHeight` from `this.levelData.grid.width/height` (stored as instance properties)
   - Replaced all hardcoded `GRID_WIDTH` and `GRID_HEIGHT` constants with instance properties throughout scene
   - Updated grid offset calculation, cascade VFX positioning, booster line lengths

2. **Cell map integration (in `create()`):**
   - After `engine.generateGrid()`, apply cell map via `engine.setCellMap(this.levelData.grid.cell_map)`
   - Cell map marks inactive cells as blocked internally (handled by engine)

3. **Pre-placed tiles (in `create()`):**
   - After `engine.initializeObstacles()`, loop through `this.levelData.pre_placed_tiles`
   - Check `engine.isCellActive()` before placing tile
   - Use `engine.setTileAt()` to inject pre-placed boosters/obstacles into grid

4. **TileSprite array type change:**
   - Changed `tileSprites: TileSprite[][]` to `tileSprites: (TileSprite | null)[][]`
   - Inactive cells store `null` (no TileSprite created, no rendering, no interaction)

5. **Skip inactive cells in rendering:**
   - `createTilesFromEngine()`: Check `isCellActive()` before creating sprite, store null for inactive cells
   - `drawGridBackground()`: After drawing board background, mask inactive cells with scene background color (0xFFFBF0)
   - `syncSpritesToEngine()`: Check `if (!sprite)` before accessing
   - `animateMatchRemoval()`, `animateMovements()`, `animateNewTiles()`: Check `sprite` exists before tweening
   - `getTileAtPointer()`: Return null if `!isCellActive(row, col)`

6. **Skip inactive cells in input:**
   - `setupInput()` swipe handling: Compute target row/col, check `isCellActive()` before accessing `tileSprites`
   - Prevents swipes into inactive cells

7. **Updated constants:**
   - `MAX_LEVELS` from 5 to 10
   - Coupon trigger changed from `this.currentLevel === 5` to `this.currentLevel === 10`

**Commit:** 9398ea6

### Task 2: Create L6-L10 level JSONs and expand Boot/LevelSelect

**Created 5 new level JSON files:**

**Level 6 - "Діамантове поле" (Diamond Field):**
- Diamond-shaped board (8x8 grid, 36 active cells)
- 3-layer ice obstacles at center (3 cells)
- Goals: Collect 25 fuel, destroy 9 ice layers
- 20 moves, medium difficulty

**Level 7 - "Трав'яне поле" (Grass Field):**
- Hourglass-shaped board (8x8 grid, 36 active cells)
- 3-layer grass obstacles at top/bottom (4 cells)
- Goals: Destroy 12 grass layers, collect 15 coffee
- 22 moves, medium difficulty

**Level 8 - "Подарунок на старті" (Gift at Start):**
- Cross-shaped board (8x8 grid, 48 active cells)
- Pre-placed boosters: linear_horizontal at [3,3], linear_vertical at [4,4]
- Goals: Collect 30 snacks, create 2 bombs
- 18 moves, medium difficulty

**Level 9 - "Льодяна фортеця" (Ice Fortress):**
- Wide-center board (8x8 grid, 60 active cells)
- Mixed obstacles: 3-layer ice (3 cells), 3-layer grass (2 cells), 1-layer crate (2 cells)
- Goals: Destroy 9 ice layers, destroy 6 grass layers
- 25 moves, hard difficulty

**Level 10 - "Фінальний виклик" (Final Challenge):**
- L-shaped board (8x8 grid, 32 active cells)
- 3-layer ice (2 cells) + 3-layer grass (2 cells)
- Pre-placed bomb booster at [3,3]
- Goals: Collect 30 fuel, destroy 6 ice layers, destroy 6 grass layers
- 28 moves, hard difficulty

**Updated Boot.ts:**
- Added 5 new `load.json()` calls for level_006 through level_010

**Updated LevelSelect.ts:**
- Expanded `LEVEL_NAMES` record to include levels 6-10 with Ukrainian names
- Updated `checkpoints` array from 5 to 10 positions (tighter vertical spacing: y from 0.88 to 0.12)
- Changed level loop from `< 5` to `< 10`
- Updated `getCurrentLevel()` bounds from 5 to 10

**Commit:** abcb474

## Deviations from Plan

None - plan executed exactly as written.

## Testing Results

- **TypeScript compiles cleanly** - all null guards pass strict checks
- **All 5 JSON files valid** - validated via `node -e "require()"`
- **L1-L5 backward compatible** - no cell_map = full 8x8 board (existing behavior)
- **L6-L10 ready to play** - cell_map and pre_placed_tiles integrated

## Verification

✅ `npx tsc --noEmit` - compiles without errors
✅ `node -e "for(let i=6;i<=10;i++){require('./data/levels/level_'+String(i).padStart(3,'0')+'.json')}; console.log('All valid')"` - All valid JSON
✅ Boot.ts loads all 10 levels
✅ LevelSelect displays 10 level nodes with Ukrainian names
✅ Game.ts reads gridWidth/gridHeight from level data
✅ Cell map applied via `engine.setCellMap()`
✅ Pre-placed tiles applied via `engine.setTileAt()`
✅ Inactive cells skip rendering (null entries in tileSprites array)
✅ All animation methods guard against null sprites

## Files Modified

| File | Changes | Lines Modified |
|------|---------|----------------|
| src/scenes/Game.ts | Dynamic grid dimensions, cell_map integration, pre-placed tiles, null sprite guards | +112/-39 |
| src/scenes/Boot.ts | Added 5 level JSON loads | +5 |
| src/scenes/LevelSelect.ts | 10 checkpoints, 10 level names, updated bounds | +11/-6 |
| data/levels/level_006.json | Diamond board + 3-layer ice | +26 (new) |
| data/levels/level_007.json | Hourglass board + 3-layer grass | +27 (new) |
| data/levels/level_008.json | Cross board + pre-placed boosters | +28 (new) |
| data/levels/level_009.json | Wide-center board + mixed obstacles | +29 (new) |
| data/levels/level_010.json | L-shaped board + all mechanics | +33 (new) |

## Architectural Impact

**Backward Compatibility Preserved:**
- Levels without `cell_map` default to full grid (L1-L5 unaffected)
- No `pre_placed_tiles` = normal grid generation (L1-L7, L9 unaffected)

**Variable Board Support:**
- Game scene now fully dynamic: grid dimensions, offsets, VFX positioning all read from level data
- Inactive cells never create sprites, never respond to input, never animate

**Pre-Placed Tiles:**
- Level designers can inject boosters/obstacles at start for strategic play
- L8 starts with 2 linear boosters for teaching booster usage
- L10 starts with bomb booster for final challenge flavor

**Level Progression:**
- 10 levels provide richer content for demo: 5 basic levels (L1-L5) → 5 advanced levels (L6-L10)
- Difficulty curve: tutorial → easy → medium → hard (L9-L10)
- All Phase 8 mechanics demonstrated: variable boards, 3-layer ice, 3-layer grass, pre-placed boosters

## Self-Check: PASSED

**Files Verified:**
```bash
✅ [ -f "src/scenes/Game.ts" ] && echo "FOUND"
✅ [ -f "src/scenes/Boot.ts" ] && echo "FOUND"
✅ [ -f "src/scenes/LevelSelect.ts" ] && echo "FOUND"
✅ [ -f "data/levels/level_006.json" ] && echo "FOUND"
✅ [ -f "data/levels/level_007.json" ] && echo "FOUND"
✅ [ -f "data/levels/level_008.json" ] && echo "FOUND"
✅ [ -f "data/levels/level_009.json" ] && echo "FOUND"
✅ [ -f "data/levels/level_010.json" ] && echo "FOUND"
```

**Commits Verified:**
```bash
✅ git log --oneline --all | grep -q "9398ea6" && echo "FOUND: 9398ea6"
✅ git log --oneline --all | grep -q "abcb474" && echo "FOUND: abcb474"
```

**Key Integrations Verified:**
- Game.ts reads `this.gridWidth` and `this.gridHeight` from level data
- Game.ts calls `engine.setCellMap()` after `generateGrid()`
- Game.ts applies `pre_placed_tiles` via `engine.setTileAt()` after obstacles
- TileSprites array type is `(TileSprite | null)[][]`
- All rendering methods guard against null sprites
- Boot.ts loads level_006 through level_010
- LevelSelect displays 10 level nodes with Ukrainian names
- MAX_LEVELS = 10

All checks passed. Summary claims verified against actual implementation.

---

**Status:** ✅ Complete
**Next Plan:** Phase 08 complete - proceed to Phase 09 (Kyiv Map Experience) or Phase 10 (Mobile Polish)
