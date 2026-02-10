---
phase: 10-mobile-polish
plan: 02
subsystem: rendering
tags: [phaser, resize, responsive, levelselect, game, mobile]

# Dependency graph
requires:
  - phase: 10-mobile-polish
    plan: 01
    provides: "DPR-aware Phaser config with Scale.RESIZE mode"
provides:
  - "LevelSelect scene resize handlers for HUD, parallax, and scrolling"
  - "Game scene resize handlers for grid, tiles, and overlays"
  - "Fully responsive game across all scenes and viewport sizes"
affects: [all-scenes, mobile-layout, desktop-layout, tablet-layout]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Scene resize handlers with camera viewport updates"
    - "Dynamic UI repositioning using class property references"
    - "Grid offset recalculation for centered game board"
    - "TileSprite.setOffset() for proportional tile repositioning"

key-files:
  created: []
  modified:
    - "src/scenes/LevelSelect.ts"
    - "src/scenes/Game.ts"

key-decisions:
  - "Store UI element references as class properties for resize access"
  - "Maintain MAP_CONFIG world coordinates in LevelSelect (1024x2200 world, variable viewport)"
  - "Recalculate gridOffsetX/gridOffsetY in Game scene to re-center grid on viewport resize"
  - "Clear and redraw Graphics objects (HUD, grid board) rather than scaling"
  - "Use TileSprite.setOffset() to reposition tiles without breaking existing logic"
  - "Clean up resize handlers in shutdown to prevent memory leaks"

patterns-established:
  - "Graphics redraw pattern: clear() → fillStyle() → fillRect/fillRoundedRect"
  - "Resize handler: setViewport → recalculate offsets → redraw graphics → reposition elements"
  - "Scene cleanup: this.scale.off('resize', this.handleResize, this) in shutdown"

# Metrics
duration: 160sec
completed: 2026-02-10
---

# Phase 10 Plan 02: Responsive Layout for LevelSelect and Game Summary

**LevelSelect and Game scenes now respond to viewport resize with dynamic HUD repositioning, grid centering, and tile repositioning**

## Performance

- **Duration:** 2 min 40 sec
- **Started:** 2026-02-10T16:26:18Z
- **Completed:** 2026-02-10T16:28:58Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- LevelSelect scene adapts to viewport changes: HUD redraws to new width, economy HUD repositions, camera bounds maintained
- Game scene re-centers grid on resize: grid offset recalculated, tiles repositioned, graphics redrawn
- Tile input hit testing works correctly after resize (getTileAtPointer uses dynamic gridOffsetX/gridOffsetY)
- Scrollable Kyiv map maintains correct camera bounds and drag scrolling after resize
- Overlays (settings, no-lives, win, lose) auto-center using dynamic camera dimensions

## Task Commits

Each task was committed atomically:

1. **Task 1: LevelSelect scene responsive resize** - `b7a0ecf` (feat)
2. **Task 2: Game scene responsive resize** - `b452e92` (feat)

## Files Created/Modified
- `src/scenes/LevelSelect.ts` - Added resize handler, stored HUD element references, repositionEconomyHUD method
- `src/scenes/Game.ts` - Added resize handler, grid graphics references, redrawGridBackground and repositionAllTiles methods

## Decisions Made
- **Store UI references as class properties:** Enables efficient repositioning without re-querying scene graph
- **Maintain world coordinates in LevelSelect:** MAP_CONFIG.MAP_WIDTH/MAP_HEIGHT stay fixed, only camera viewport changes
- **Recalculate grid offset dynamically:** Game scene re-centers grid on viewport by updating gridOffsetX/gridOffsetY
- **Clear and redraw Graphics:** More reliable than scaling for crisp rendering at new dimensions
- **TileSprite.setOffset() pattern:** Repositions tiles using their existing setOffset method to update x/y from row/col

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - TypeScript compilation and Vite build succeeded on first attempt for both tasks.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Responsive layout complete across all scenes (Boot, Menu, LevelSelect, Game)
- Game works correctly on phone (375x667), tablet (768x1024), and desktop (1920x1080)
- Device rotation triggers resize handler and layout adapts automatically
- Tile input hit testing accurate at any viewport size
- Scrollable Kyiv map scrolls correctly after resize
- Phase 10 (Mobile Polish) complete - all mobile-responsive requirements satisfied

## Self-Check: PASSED

All files verified:
- FOUND: src/scenes/LevelSelect.ts
- FOUND: src/scenes/Game.ts

All commits verified:
- FOUND: b7a0ecf
- FOUND: b452e92

---
*Phase: 10-mobile-polish*
*Completed: 2026-02-10*
