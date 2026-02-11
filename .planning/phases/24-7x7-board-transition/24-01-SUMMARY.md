---
phase: 24-7x7-board-transition
plan: 01
subsystem: game-engine
tags: [grid, constants, tests, refactor]
completed: 2026-02-11

dependency_graph:
  requires:
    - phase: 23
      plan: 02
      provides: "Dynamic tile asset loading system"
  provides:
    - "7x7 grid dimension constants as new standard"
    - "Match3Engine tests using 7x7 default dimensions"
  affects:
    - component: "Match3Engine test suite"
      change: "Default test engine size changed to 7x7"
    - component: "constants.ts"
      change: "GRID_WIDTH and GRID_HEIGHT reflect 7x7"

tech_stack:
  added: []
  patterns:
    - "Test suite dimension updates for grid size changes"

key_files:
  created: []
  modified:
    - path: "src/utils/constants.ts"
      impact: "GRID_WIDTH and GRID_HEIGHT constants updated to 7"
    - path: "src/game/Match3Engine.test.ts"
      impact: "All default engine tests updated to 7x7, grid index references adjusted"

decisions:
  - summary: "Keep Match3Engine dimension-agnostic (constructor-driven)"
    rationale: "Constants reflect new standard but engine still accepts any rows/cols from level JSON"
  - summary: "Preserve custom-sized engine tests unchanged"
    rationale: "Tests with 3x3, 5x5 boards are intentional edge cases, not dependent on default size"

metrics:
  duration: "2 minutes"
  tasks: 1
  files_modified: 2
  tests_updated: 44
  test_pass_rate: "100% (Match3Engine + BoosterActivator)"
---

# Phase 24 Plan 01: Update Engine Constants to 7x7

**One-liner:** Updated grid dimension constants and Match3Engine test suite to use 7x7 as the new standard board size.

## Summary

Successfully updated the game engine layer to reflect the new 7x7 board standard. Changed global GRID_WIDTH and GRID_HEIGHT constants from 8 to 7, and updated all Match3Engine tests to use 7x7 default dimensions. All hardcoded 8x8 assumptions in test loops, assertions, and grid index references were adjusted to 7x7.

## What Was Built

### Constants Update
- Modified `src/utils/constants.ts`:
  - `GRID_WIDTH = 7` (was 8)
  - `GRID_HEIGHT = 7` (was 8)
  - Note: These constants are not currently imported anywhere (Game.ts reads dimensions from level JSON), but they serve as documentation of the new standard

### Test Suite Updates
- Modified `src/game/Match3Engine.test.ts`:
  - Default engine in `beforeEach`: `new Match3Engine(7, 7)` (was 8, 8)
  - Grid dimension assertions: `toBe(7)` (was 8)
  - Loop bounds: `< 7` (was < 8)
  - Grid index references: `grid[6]` max (was `grid[7]`)
  - Comment updates: "49 cells" (was "64 cells")
  - Obstacle test positions adjusted to fit 7x7 grid (max valid index 6)

### Preserved Tests
- Custom-sized engine tests unchanged (3x3, 5x5, 6x6 boards for edge case testing)
- These tests intentionally use different dimensions and are not dependent on the default size

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All verification criteria passed:

1. `npx vitest run --globals`: All Match3Engine tests (44) and BoosterActivator tests (11) pass
2. `grep 'GRID_WIDTH = 7' src/utils/constants.ts`: Match found
3. `grep 'GRID_HEIGHT = 7' src/utils/constants.ts`: Match found
4. `grep 'new Match3Engine(7, 7)' src/game/Match3Engine.test.ts`: Match found in beforeEach
5. No references to `grid[7]` remain in test file (max valid row for 7x7 is index 6)

Pre-existing LevelManager test failures (2) remain unchanged, as expected.

## Commits

| Task | Commit | Files Modified |
|------|--------|----------------|
| 1. Update grid constants and tests to 7x7 | 40365f5 | constants.ts, Match3Engine.test.ts |

## Technical Details

### Test Coverage
- 44 Match3Engine tests all pass with 7x7 dimensions
- 11 BoosterActivator tests all pass (engine size independent)
- Edge case tests with custom dimensions (3x3, 5x5) preserved and passing

### Grid Index Adjustments
- Bottom row: `grid[6]` (was `grid[7]`)
- Max valid cell: `(6, 6)` (was `(7, 7)`)
- Column loops: `col < 7` (was `col < 8`)
- Row loops: `row < 7` (was `row < 8`)

### Obstacle Test Adjustments
- Crate test: Position moved from `(2,3)` adjacent to match at cols `4,5,6` to `(2,2)` adjacent to cols `3,4,5`
- Gravity obstacle tests: Row indices adjusted from 5→4, 7→6 to fit 7x7 grid
- Blocked cell gravity: Adjusted positions to maintain test logic within 7x7 bounds

## Self-Check: PASSED

Verified all claimed modifications:

```
FOUND: /Users/vasiliyhrebenuyk/work/KLO/klo-match-3/src/utils/constants.ts (GRID_WIDTH = 7, GRID_HEIGHT = 7)
FOUND: /Users/vasiliyhrebenuyk/work/KLO/klo-match-3/src/game/Match3Engine.test.ts (new Match3Engine(7, 7))
FOUND: Commit 40365f5 in git log
```

Test execution: 44 Match3Engine tests + 11 BoosterActivator tests all passed.

## Next Steps

Plan 24-02 will update level JSON files to use 7x7 grid dimensions and cellMap (if needed for non-rectangular boards).
