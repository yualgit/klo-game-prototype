---
phase: 19-settings-overlay-fixes
plan: 01
subsystem: ui-global
tags: [settings, overlay, z-order, mobile-responsive, singleton]

dependency-graph:
  requires:
    - UIScene (parallel scene architecture)
    - SettingsManager (registry-based reactive settings)
    - GUI_TEXTURE_KEYS (button assets)
  provides:
    - Centralized settings overlay accessible from all screens
    - Z-order correct overlay (depth 300+ above all UI)
    - Mobile-responsive settings panel
    - Singleton guard preventing duplicate overlays
  affects:
    - All content scenes (LevelSelect, Collections, Shop, Game)
    - UIScene (now owns settings overlay)

tech-stack:
  added: []
  patterns:
    - Settings overlay owned by UIScene (parallel scene pattern)
    - Direct method call instead of eventsCenter emission
    - Singleton guard pattern (settingsOpen flag)
    - Depth-based z-ordering (300+ for overlays)
    - Mobile-responsive sizing (panel capped at 85% viewport width)

key-files:
  created: []
  modified:
    - src/scenes/UIScene.ts
    - src/scenes/LevelSelect.ts
    - src/scenes/Collections.ts
    - src/scenes/Shop.ts

decisions:
  - decision: "Move settings overlay from LevelSelect to UIScene"
    rationale: "UIScene runs in parallel with all content scenes, ensuring overlay works from any screen with consistent z-ordering"
    alternatives: "Keep per-scene implementation (rejected due to z-order issues and duplication)"
  - decision: "Use depth 300+ for settings overlay"
    rationale: "UIScene header is at depth 200, content scene overlays typically 100-200. Depth 300+ guarantees settings renders above everything"
  - decision: "Panel width capped at 85% viewport (not 90%)"
    rationale: "Tighter cap ensures adequate margins on very small screens; panel height reduced from 380 to 340 for better fit"
  - decision: "Direct method call instead of eventsCenter"
    rationale: "Settings button lives in UIScene, overlay now in UIScene - no need for event bus hop"
  - decision: "Singleton guard (settingsOpen flag)"
    rationale: "Prevents duplicate overlays if user rapidly clicks gear button"

metrics:
  duration: 291s
  tasks-completed: 2
  files-modified: 4
  lines-added: 291
  lines-removed: 277
  commits: 2
  completed-date: 2026-02-11

verification-results:
  - "TypeScript compilation: PASSED (npx tsc --noEmit)"
  - "Production build: PASSED (npx vite build)"
  - "Settings overlay method exists in UIScene: CONFIRMED"
  - "Singleton guard (settingsOpen flag) present: CONFIRMED"
  - "All overlay elements at depth 300+: CONFIRMED"
  - "No 'open-settings' eventsCenter listeners remain: CONFIRMED"
  - "showSettingsOverlay removed from LevelSelect: CONFIRMED"
  - "showSettings removed from Collections and Shop: CONFIRMED"
---

# Phase 19 Plan 01: Settings Overlay Centralization Summary

**One-liner:** Settings overlay moved to UIScene for universal access, correct z-ordering (depth 300+), mobile scaling, and singleton protection.

## What Was Done

Moved the settings overlay implementation from LevelSelect.ts into UIScene.ts, eliminating per-scene duplication and solving 4 critical issues:

1. **Universal access**: Settings now work from ALL screens (LevelSelect, Game, Collections, Shop) via UIScene gear button
2. **Z-order fix**: Overlay at depth 300+ renders above UIScene header (200) and content scene overlays (100-200)
3. **Mobile scaling**: Panel width capped at 85% viewport, height reduced to 340px, font sizes reduced for better fit
4. **Singleton protection**: `settingsOpen` flag prevents duplicate overlays from rapid clicks

### Key Implementation Details

**UIScene.ts changes:**
- Added `settingsOpen: boolean` flag and `settingsOverlayElements: GameObject[]` array
- Replaced `eventsCenter.emit('open-settings')` with direct `this.showSettingsOverlay()` call
- Ported full overlay from LevelSelect with fixes:
  - All elements at depth 300+ (backdrop 300, panel 301, controls 302-303)
  - Panel sizing: `Math.min(cssToGame(340), width * 0.85)` width, `cssToGame(340)` height
  - Tighter row spacing (SFX at +80, Volume at +145, Animation at +210, Close at +280)
  - Font sizes reduced (labels 15px, title 22px)
- Added `closeSettingsOverlay()` method for clean teardown
- Integrated cleanup into `destroyAllElements()` and `onShutdown()`

**Content scene cleanup:**
- LevelSelect: Removed ~250 lines (entire `showSettingsOverlay` method, SettingsManager import, event listeners)
- Collections: Removed `showSettings` stub and event listeners
- Shop: Removed `showSettings` stub, unused SettingsManager import, event listeners

## Task Execution

### Task 1: Add settings overlay to UIScene
**Status:** Complete
**Commit:** 0f7ad5e
**Files modified:** src/scenes/UIScene.ts

Added full settings overlay implementation:
- Singleton guard (settingsOpen flag)
- All elements at depth 300+ (above UIScene header at 200)
- Mobile-responsive panel (85% viewport width, 340px height)
- SFX toggle, volume slider, animation toggle (all functional)
- Close button (GUI_TEXTURE_KEYS.buttonYellow) and backdrop-click-to-close
- Clean teardown via closeSettingsOverlay()
- Direct method call from settings button (no eventsCenter hop)

### Task 2: Remove settings overlay code from content scenes
**Status:** Complete
**Commit:** 8ee9d7d
**Files modified:** src/scenes/LevelSelect.ts, src/scenes/Collections.ts, src/scenes/Shop.ts

Removed all per-scene settings handling:
- LevelSelect: Deleted showSettingsOverlay method (~250 lines), SettingsManager import, event listeners
- Collections: Deleted showSettings stub and event listeners
- Shop: Deleted showSettings stub, unused SettingsManager import, event listeners
- No scene listens for 'open-settings' eventsCenter event anymore

## Deviations from Plan

None - plan executed exactly as written.

## Verification

All verification checks passed:

1. **TypeScript compilation:** `npx tsc --noEmit` - PASSED (0 errors)
2. **Production build:** `npx vite build` - PASSED (built in 6.57s)
3. **Settings overlay accessible:** `showSettingsOverlay` method exists in UIScene
4. **Singleton guard:** `settingsOpen` flag present in UIScene (4 references found)
5. **Z-order correct:** All overlay elements at depth 300-303 (22 setDepth calls confirmed)
6. **Event cleanup:** 0 matches for 'open-settings' across all scene files
7. **LevelSelect cleanup:** 0 matches for 'showSettingsOverlay' in LevelSelect.ts
8. **Collections/Shop cleanup:** 0 matches for 'showSettings' in Collections.ts and Shop.ts

## Impact

### Fixed Issues

1. **SETT-01** (z-order): Overlay now renders at depth 300+, always above UIScene header (200)
2. **SETT-02** (mobile clipping): Panel capped at 85% viewport width, height reduced to 340px
3. **SETT-03** (universal access): Settings work from all screens (owned by parallel UIScene)
4. **SETT-04** (Game scene crash): Inherently fixed - UIScene always has valid cameras

### Code Quality

- Eliminated ~250 lines of duplication (was in LevelSelect, stubs in Collections/Shop)
- Simplified architecture (direct method call vs event bus)
- Single source of truth for settings overlay
- Clean separation of concerns (UI overlay in UI scene)

## Self-Check: PASSED

**Created files:** None (only modifications)

**Modified files exist:**
- `/Users/vasiliyhrebenuyk/work/KLO/klo-match-3/src/scenes/UIScene.ts` - FOUND
- `/Users/vasiliyhrebenuyk/work/KLO/klo-match-3/src/scenes/LevelSelect.ts` - FOUND
- `/Users/vasiliyhrebenuyk/work/KLO/klo-match-3/src/scenes/Collections.ts` - FOUND
- `/Users/vasiliyhrebenuyk/work/KLO/klo-match-3/src/scenes/Shop.ts` - FOUND

**Commits exist:**
- `0f7ad5e` (Task 1: feat(19-01): add settings overlay to UIScene) - FOUND
- `8ee9d7d` (Task 2: refactor(19-01): remove settings overlay code from content scenes) - FOUND

All claims verified. Plan execution complete.
