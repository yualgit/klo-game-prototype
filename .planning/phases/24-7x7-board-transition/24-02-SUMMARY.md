---
phase: 24-7x7-board-transition
plan: 02
subsystem: game-content
tags: [levels, balance, board-size]
dependency_graph:
  requires: [24-01]
  provides: [7x7-level-data]
  affects: [game-scenes, level-loading]
tech_stack:
  added: []
  patterns: [proportional-scaling, shape-preservation]
key_files:
  created: []
  modified:
    - public/data/levels/level_001.json
    - public/data/levels/level_002.json
    - public/data/levels/level_003.json
    - public/data/levels/level_004.json
    - public/data/levels/level_005.json
    - public/data/levels/level_006.json
    - public/data/levels/level_007.json
    - public/data/levels/level_008.json
    - public/data/levels/level_009.json
    - public/data/levels/level_010.json
decisions:
  - decision: Scale goals to ~75-80% for 7x7 (49 vs 64 cells)
    rationale: Proportional reduction maintains similar difficulty feel
    alternatives: [fixed-reduction, difficulty-curve-based]
    selected: proportional-scaling
  - decision: Preserve original cell_map shape aesthetics at 7x7
    rationale: Players recognize levels by visual shape, not exact dimensions
    alternatives: [new-shapes, simplify-shapes]
    selected: shape-preservation
  - decision: Adjust obstacle positions to fit active cells in new maps
    rationale: Obstacles must land on playable cells (cell_map==1)
    alternatives: [remove-obstacles, reduce-count]
    selected: reposition-in-active-cells
metrics:
  duration_seconds: 162
  duration_human: 2.7 min
  tasks_completed: 2
  files_modified: 10
  commits: 2
  completed_date: 2026-02-11
---

# Phase 24 Plan 02: Retrofit All Levels to 7x7 Summary

All 10 levels retrofitted from 8x8 (or 6x8) to 7x7 boards with balanced goals, redesigned cell_maps preserving shape aesthetics, and repositioned obstacles on active cells.

## Tasks Completed

### Task 1: Retrofit L1-L5 (Simple Boards) to 7x7
**Status:** Complete
**Commit:** ddb3439
**Files modified:** level_001.json through level_005.json

Updated simple rectangular levels to 7x7 dimensions:

- **Level 1** (Tutorial): 6x8 (48 cells) → 7x7 (49 cells)
  - Goals/moves unchanged (similar size)
  - Maintains gentle tutorial pacing

- **Level 2** (Dual collect): 8x8 → 7x7
  - Burger/hotdog: 15 → 12 each (80% scaling)
  - Moves: 15 → 13

- **Level 3** (First ice): 8x8 → 7x7
  - Burger: 20 → 15 (75% scaling)
  - Moves unchanged (14)
  - Ice positions [3,3], [4,3], [3,4] remain valid

- **Level 4** (Ice destruction): 8x8 → 7x7
  - Hotdog: 15 → 12 (80% scaling)
  - Ice destroy goal unchanged (5 obstacles)
  - All 5 ice positions remain within 0-6 range

- **Level 5** (First booster): 8x8 → 7x7
  - Snack: 20 → 15 (75% scaling)
  - Moves: 15 → 13
  - Grass positions [3,3], [4,3], [3,4] remain valid

### Task 2: Retrofit L6-L10 (Shaped Boards) to 7x7
**Status:** Complete
**Commit:** 1a21723
**Files modified:** level_006.json through level_010.json

Redesigned cell_map arrays to 7x7 while preserving original shape aesthetics:

- **Level 6** (Diamond): 8x8 (24 active) → 7x7 (25 active)
  - Cell_map: Symmetric diamond pattern preserved
  - Burger: 25 → 20 (80% scaling)
  - Moves: 20 → 18
  - Ice repositioned: [[3,3],[3,4],[4,3]] → [[3,2],[3,3],[3,4]] (center row)

- **Level 7** (Hourglass): 8x8 (32 active) → 7x7 (25 active)
  - Cell_map: Hourglass/bowtie shape preserved
  - Grass destroy: 12 → 9 (75% scaling)
  - Hotdog: 15 → 12 (80% scaling)
  - Moves: 22 → 18
  - Grass repositioned: [[0,3],[0,4],[7,3],[7,4]] → [[0,2],[0,3],[6,3],[6,4]]

- **Level 8** (Cross/Plus): 8x8 (40 active) → 7x7 (33 active)
  - Cell_map: Cross shape preserved
  - Snack: 30 → 22 (73% scaling)
  - Moves: 18 → 15
  - Pre-placed tiles at [3,3] and [4,4] remain on active cells

- **Level 9** (Rounded Rectangle): 8x8 (60 active) → 7x7 (45 active)
  - Cell_map: Rounded corners preserved
  - Ice/grass destroy goals unchanged (9/6)
  - Moves: 25 → 20
  - Grass repositioned: [6,6] (now inactive) → [5,5] (active)
  - Crate positions [2,5], [5,2] remain valid

- **Level 10** (S-shape/Zigzag): 8x8 (48 active) → 7x7 (35 active)
  - Cell_map: S-shape flow preserved
  - Burger: 30 → 22 (73% scaling)
  - Ice/grass destroy unchanged (6/6)
  - Moves: 28 → 22
  - Grass repositioned: [[5,5],[6,6]] → [[4,5],[6,5]] (both active)
  - Pre-placed bomb at [3,3] remains on active cell

## Verification Results

All levels passed validation:

1. Grid dimensions: All 10 levels have `width: 7, height: 7`
2. Cell_maps: L6-L10 have exactly 7x7 arrays
3. Obstacle positions: All within 0-6 range and on active cells
4. Pre-placed tiles: All within 0-6 range and on active cells
5. TypeScript compilation: `npx tsc --noEmit` passes without errors

## Deviations from Plan

None. Plan executed exactly as written. All scaling percentages, cell_map designs, and obstacle repositioning followed the plan specifications precisely.

## Key Outcomes

**Balance Consistency:**
- Goal scaling maintained proportionally (73-80% for most collect goals)
- Move reduction balanced with smaller board (typically 10-20% fewer moves)
- Obstacle destroy goals unchanged where obstacle count stayed same

**Shape Preservation:**
- Diamond, hourglass, cross, rounded rectangle, and S-shape all recognizable at 7x7
- Active cell counts reduced but maintain similar difficulty feel
- Visual identity of each level preserved

**Technical Correctness:**
- All positions validated programmatically
- No out-of-bounds references
- No obstacles on inactive cells
- Spawn rules unchanged (weight-based, position-independent)

## Dependencies

**Requires:**
- 24-01-PLAN: Core game constants (GRID_WIDTH=7, GRID_HEIGHT=7) and Match3Engine tests updated

**Provides:**
- 7x7 level data for all 10 existing levels
- Balanced goals and moves for smaller board size
- Valid cell_maps and obstacle positions

**Affects:**
- Game.ts: Level loading uses new 7x7 dimensions automatically
- BoardController.ts: Renders 7x7 grid with new cell_maps
- Level progression: Players experience balanced difficulty on smaller boards

## Next Steps

With all levels now at 7x7, Phase 24 is complete. The game now runs on a 7x7 board throughout all 10 levels with properly scaled difficulty and preserved level aesthetics.

Future work could include:
- Adding new tile types to level spawn_rules (now enabled by Phase 23 dynamic system)
- Creating additional shaped levels at 7x7
- Fine-tuning goal counts based on player testing feedback

---

## Self-Check: PASSED

All files and commits verified:

- SUMMARY.md created
- All 10 level JSON files exist and modified
- Commit ddb3439 exists (Task 1)
- Commit 1a21723 exists (Task 2)

**Plan execution time:** 2.7 minutes
**Commits:** 2 (ddb3439, 1a21723)
**Files modified:** 10 level JSON files
