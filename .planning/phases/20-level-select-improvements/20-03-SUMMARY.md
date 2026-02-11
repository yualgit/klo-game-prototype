---
phase: 20-level-select-improvements
plan: 03
subsystem: ui
tags: [phaser, responsive, mobile, coordinate-systems]

# Dependency graph
requires:
  - phase: 20-02
    provides: Horizontal clamping with edge detection and fallback scaling
provides:
  - Correct horizontal centering of level nodes using MAP_WIDTH coordinate space center
  - Fixed 57px rightward shift on mobile devices
affects: [level-select, mobile-ux]

# Tech tracking
tech-stack:
  added: []
  patterns: [coordinate-space-centering]

key-files:
  created: []
  modified: [src/scenes/LevelSelect.ts]

key-decisions:
  - "Center on MAP_WIDTH coordinate space (512) not node range center (455)"

patterns-established:
  - "Coordinate centering: Use design coordinate space center, not content bounds center, for consistent visual centering"

# Metrics
duration: 47s
completed: 2026-02-11
---

# Phase 20 Plan 03: Map Width Centering Summary

**Fixed horizontal centering by using MAP_WIDTH center (512) instead of node range center (455), correcting 57px rightward shift on mobile**

## Performance

- **Duration:** 47s
- **Started:** 2026-02-11T14:34:08Z
- **Completed:** 2026-02-11T14:34:55Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Changed horizontal offset calculation to center on MAP_CONFIG.MAP_WIDTH/2 (512) instead of nodeRangeCenter (455)
- Eliminated 57px rightward shift on mobile devices where road/nodes appeared off-center
- Preserved edge clamping and narrow viewport scaling functionality

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix horizontal centering to use MAP_WIDTH center** - `92f88b7` (fix)

## Files Created/Modified
- `src/scenes/LevelSelect.ts` - Updated calculateNodeOffsetX() to center on MAP_WIDTH coordinate space instead of node x-range

## Decisions Made

**Center on MAP_WIDTH coordinate space (512) not node range center (455)**
- Rationale: The level nodes exist within a 1024px wide coordinate system (MAP_WIDTH). Centering on the node range center (260-650, avg 455) caused a 57px rightward shift because the node range is not centered within MAP_WIDTH.
- Impact: On a 375px CSS-width mobile device (750px game width), offset changes from -80px to -137px, shifting nodes 57px leftward to proper visual center.
- Preserved: Edge clamping logic still uses minNodeX/maxNodeX constants, narrow viewport scaling unchanged.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Level Select horizontal centering now correct on all viewport widths
- Phase 20 complete - ready for Phase 21 (Game Screen Polish)

## Self-Check

Verifying file existence and commit integrity.

**File checks:**
- ✓ FOUND: src/scenes/LevelSelect.ts

**Commit checks:**
- ✓ FOUND: 92f88b7

## Self-Check: PASSED

All files and commits verified successfully.
