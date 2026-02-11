---
phase: 20-level-select-improvements
plan: 02
subsystem: ui
tags: [phaser, level-select, responsive, mobile, viewport, camera, scrolling]

# Dependency graph
requires:
  - phase: 20-01
    provides: Mobile-first dynamic vertical positioning (incorrect - removed in this plan)
provides:
  - Horizontal viewport width clamping for narrow mobile screens
  - Restored vertical scrolling through Kyiv journey map (MAP_HEIGHT 2200)
  - Original y-position layout (L1 at y=2050 bottom to L10 at y=250 top)
affects: [level-select-improvements, mobile-ux]

# Tech tracking
tech-stack:
  added: []
  patterns: [horizontal-clamping-with-scaling, viewport-width-adaptation]

key-files:
  created: []
  modified:
    - src/game/constants.ts
    - src/scenes/LevelSelect.ts

key-decisions:
  - "Reverted 20-01's vertical compression - requirement was horizontal (x-axis) clamping, not vertical (y-axis)"
  - "Horizontal clamping: center node range (260-650) on screen, clamp to padding if too narrow"
  - "Fallback scaling for extremely narrow viewports: scale x-positions proportionally if nodes can't fit even with clamping"

patterns-established:
  - "calculateNodeOffsetX(): Center node range, apply left/right edge clamping, fallback to scaling if needed"
  - "getNodeScreenX(): Transforms static x-positions with offset + optional scaling for narrow viewports"

# Metrics
duration: 152s
completed: 2026-02-11
---

# Phase 20 Plan 02: Gap Closure - Horizontal Width Clamping

**Restored vertical scrolling through Kyiv journey map (MAP_HEIGHT 2200) with horizontal clamping to fit all nodes within mobile viewport width**

## Performance

- **Duration:** 2 min 32 sec (152s)
- **Started:** 2026-02-11T13:57:47Z
- **Completed:** 2026-02-11T14:00:19Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Reverted Phase 20-01's incorrect vertical positioning changes - requirement was horizontal clamping, not vertical compression
- Restored MAP_HEIGHT: 2200 and original y-positions (L1 at y=2050 to L10 at y=250) for vertical scrolling
- Added horizontal clamping logic via calculateNodeOffsetX() to center nodes and clamp to viewport edges on narrow screens
- Fallback x-position scaling for extremely narrow viewports (< 468px game width)
- Camera bounds now use worldHeight >= MAP_HEIGHT (restored vertical scrolling capability)

## Task Commits

Each task was committed atomically:

1. **Task 1: Restore original vertical layout and add horizontal clamping** - `691ee8a` (fix)

## Files Created/Modified
- `src/game/constants.ts` - Restored MAP_HEIGHT: 2200, added original y-positions to all LEVEL_NODES (2050 -> 250)
- `src/scenes/LevelSelect.ts` - Removed calculateNodePositions(), added calculateNodeOffsetX() and getNodeScreenX(), restored camera bounds to use MAP_HEIGHT, updated all node positioning to use MAP_CONFIG.LEVEL_NODES with .x and .y directly

## Decisions Made

**Key decision: Phase 20-01 misinterpreted the requirement**
- Original issue: Level nodes clipped horizontally on narrow mobile screens (375px CSS width = 750px game width)
- 20-01 solution: Changed vertical (y-axis) node distribution to eliminate scrolling
- Correct solution: Horizontal (x-axis) clamping/scaling to fit nodes within viewport WIDTH, preserve vertical scrolling

**Horizontal clamping approach:**
- Node x-range in constants: 260-650 (390px span)
- Default: Center this range on screen width
- Clamp left: If leftmost node would clip left edge, shift right
- Clamp right: If rightmost node would clip right edge, shift left
- Fallback: If viewport SO narrow that both clamps conflict (< 468px game width), scale x-positions proportionally

**Preserved from 20-01:**
- Container-level click handlers (not reverted to scene-level tap detection)
- Simplified setupDragScrolling() without handleTap() method

## Deviations from Plan

None - plan executed exactly as written. This was a gap closure plan to fix 20-01's incorrect implementation.

## Issues Encountered

None - straightforward revert of vertical changes + addition of horizontal clamping logic.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Level Select improvements complete:
- Vertical scrolling through Kyiv journey map restored (MAP_HEIGHT 2200)
- Horizontal clamping ensures all nodes visible on narrow mobile screens
- Container-level click handlers work reliably across scene transitions
- UAT verification criteria met: all nodes fit within viewport width, vertical scrolling works, buttons clickable, road path renders correctly

Ready for Phase 21 (Game Screen Polish).

## Self-Check

Verifying claimed changes:

- File exists: src/game/constants.ts - FOUND
- File exists: src/scenes/LevelSelect.ts - FOUND
- Commit exists: 691ee8a - FOUND
- MAP_HEIGHT: 2200 in constants.ts - FOUND
- All 10 LEVEL_NODES have x, y, label - FOUND
- calculateNodePositions() removed from LevelSelect.ts - VERIFIED (no matches)
- calculateNodeOffsetX() exists in LevelSelect.ts - FOUND
- Container-level click handlers preserved - FOUND (container.on('pointerup'))
- Camera bounds use MAP_CONFIG.MAP_HEIGHT - FOUND

**Self-Check: PASSED**

---
*Phase: 20-level-select-improvements*
*Completed: 2026-02-11*
