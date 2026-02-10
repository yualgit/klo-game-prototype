---
phase: 05-assets-polish
plan: 03
subsystem: ui
tags: [phaser, animation, tween, gui-sprites, scene-transition]

requires:
  - phase: 05-01
    provides: "Loaded PNG assets and texture constants"
  - phase: 05-02
    provides: "VFXManager and AudioManager for gameplay effects"
provides:
  - "Animated Menu with floating tiles and glow title"
  - "Road map LevelSelect with path and checkpoint buttons"
  - "Polished Game board with gradient background and GUI sprite buttons"
  - "Animated win overlay with sequential star reveal and confetti"
  - "Styled lose overlay with camera shake"
  - "Scene restart fix for Game-to-Game transitions"
affects: []

tech-stack:
  added: []
  patterns: ["sceneActive flag for async chain safety on scene restart", "resetState clears all game object references"]

key-files:
  created: []
  modified:
    - "src/scenes/Menu.ts"
    - "src/scenes/LevelSelect.ts"
    - "src/scenes/Game.ts"
    - "src/scenes/Boot.ts"
    - "src/game/VFXManager.ts"
    - "src/game/AudioManager.ts"

key-decisions:
  - "Direct scene.start() from overlays instead of fadeOut — avoids tween/shutdown race conditions"
  - "sceneActive flag guards async chains (processCascade, onTileSwap) during scene restart"
  - "resetState() must clear all game object references (hudText, backButton) to prevent stale reference crashes"
  - "VFXManager and AudioManager check scene.sys.isActive() before creating particles or playing sounds"

patterns-established:
  - "Scene restart safety: always null-out instance references to Phaser game objects in resetState()"
  - "Async chain guard: check sceneActive after every await to prevent operating on destroyed objects"

duration: ~20min
completed: 2026-02-10
---

# Plan 05-03: Scene Polish Summary

**Animated Menu/LevelSelect, polished Game overlays with star reveal and GUI sprites, scene restart fix for level transitions**

## Performance

- **Tasks:** 4 (3 auto + 1 checkpoint)
- **Files modified:** 6

## Accomplishments
- Menu scene with animated bouncing title, 6 floating tile decorations, orange GUI sprite Play button
- LevelSelect with winding road map path, 5 circular checkpoint buttons, map pointer, gold lock overlays, crown for 3-star levels
- Game board warm gradient background with shadow, all buttons use GUI PNG sprites
- Win overlay slides in with Bounce.Out, stars animate one-by-one with Elastic.Out, confetti on win, crown for 3 stars
- Lose overlay with camera shake, styled panel, GUI sprite buttons
- Scene transitions use camera fade (Boot→Menu, Menu→LevelSelect, LevelSelect→Game)
- Fixed critical scene restart crash when navigating between levels

## Task Commits

1. **Task 1: Polish Menu and LevelSelect scenes** - `9c3031d` (feat)
2. **Task 2: Polish Game scene board and GUI buttons** - `661821b` (feat)
3. **Task 3: Polish win/lose overlays with animated effects** - `c9e8412` (feat)
4. **Task 4: Visual quality verification** - approved by user

**Bug fixes during checkpoint:**
- `051fbfc` — Wrap scene transitions in fadeOut (initial attempt)
- `9dd4df0` — Add shutdown cleanup handler
- `ccb8945` — Guard async chains with sceneActive flag
- `5f83f26` — Simplify to direct scene.start from overlays
- `6c9e0e2` — Fix root cause: clear stale hudText reference in resetState

## Files Created/Modified
- `src/scenes/Menu.ts` - Animated title, floating tiles, GUI sprite Play button
- `src/scenes/LevelSelect.ts` - Road map with path, checkpoint buttons, map pointer, locks, crowns
- `src/scenes/Game.ts` - Board background, GUI buttons, animated overlays, scene restart safety
- `src/scenes/Boot.ts` - Fade transition to Menu
- `src/game/VFXManager.ts` - Scene active guard on all particle methods
- `src/game/AudioManager.ts` - Scene active guard on play method

## Decisions Made
- Removed fadeOut from overlay buttons — fadeOut + shutdown creates race condition where camera callback never fires
- Used sceneActive flag pattern to safely terminate async chains on scene restart
- Root cause of drawImage crash: stale `this.hudText` reference to destroyed Text object from previous scene run

## Deviations from Plan

### Auto-fixed Issues

**1. Scene restart crash (drawImage null)**
- **Found during:** Checkpoint verification
- **Issue:** Clicking "Далі" crashed with `Cannot read properties of null (reading 'drawImage')` — `this.hudText` referenced destroyed Text from previous scene
- **Fix:** resetState() clears hudText and backButton; sceneActive flag guards async chains; VFXManager/AudioManager check scene active
- **Files modified:** Game.ts, VFXManager.ts, AudioManager.ts
- **Verification:** User confirmed level transitions work correctly

---

**Total deviations:** 1 critical bug fix (scene restart safety)
**Impact on plan:** Essential fix for game to be playable across multiple levels

## Issues Encountered
- Scene restart in Phaser 3 doesn't reset class instance variables — stale references to destroyed game objects cause crashes. Established pattern: always null-out all Phaser game object references in resetState().

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 5 complete — all 3 plans executed
- Demo is client-presentation ready with full visual polish

---
*Phase: 05-assets-polish*
*Completed: 2026-02-10*
