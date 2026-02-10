---
phase: 12-responsive-layout-foundation
plan: 02
subsystem: scene-ui
tags: [responsive, levelselect, menu, safe-area, mobile]
dependency_graph:
  requires:
    - src/utils/responsive.ts (from plan 01)
  provides:
    - Responsive LevelSelect scene
    - Responsive Menu scene
    - iOS safe area support
  affects:
    - LevelSelect HUD, level nodes, overlays
    - Menu title, subtitle, play button
    - index.html viewport meta
key_files:
  created: []
  modified:
    - src/scenes/LevelSelect.ts
    - src/scenes/Menu.ts
    - index.html
    - src/game/TileSprite.ts
    - src/scenes/Game.ts
decisions:
  - LevelSelect HUD bar height: 50px CSS (compact for mobile)
  - Level checkpoint size: 38px CSS (reduced from 55 for mobile proportions)
  - Camera centers on node range X (260..650 midpoint = 455)
  - World bottom extends dynamically for first level at ~30% from bottom
  - Booster idle animations removed (too prominent at variable scales)
  - Game overlay buttons positioned relative to panel bottom with 55px CSS gap
metrics:
  completed: 2026-02-10
  tasks: 2
  files: 5
---

# Phase 12 Plan 02: LevelSelect + Menu Responsive + Verification

Responsive layout for LevelSelect and Menu scenes, iOS safe area support, visual verification with fixes.

## What Was Built

### LevelSelect Scene (responsive overhaul)
- **HUD bar**: reduced to 50px CSS height (was 100px min), compact layout
- **Title**: 16px CSS font (was 32px), properly centered in HUD
- **Economy HUD**: all icons/text at 12px CSS, laid out horizontally in single row
- **Back button**: 60x28px CSS (was 80x36), vertically centered in HUD
- **Settings button**: 18px CSS (was 24px), centered in HUD bar
- **Level checkpoints**: 38px CSS circles (was 55px), level numbers 18px, stars 10px, landmarks 8px
- **Map pointer**: 24px CSS (was 32px)
- **Overlay buttons**: 140x36px CSS (was 170x44)
- **Camera centering**: scrollX centers on node range (260..650), pan targets range center X
- **World bottom**: extends dynamically (`firstLevelY + 30% viewport`) so first level at ~30% from bottom
- **Parallax backgrounds**: sky uses aspect-fill to cover entire viewport, far/mid scale to fill width

### Menu Scene
- Title: 48px CSS, subtitle: 18px CSS, play button: 160x50px CSS
- Floating tiles: 36px CSS with 10px oscillation
- All using cssToGame() for DPR-aware sizing

### iOS Safe Area
- `viewport-fit=cover` added to viewport meta tag
- CSS `env(safe-area-inset-*)` padding on game container
- Prevents content from rendering behind iPhone notch/home bar

### Game Scene (overlay fix)
- Win/lose overlay buttons positioned relative to panel BOTTOM (not fixed from top)
- Lose overlay panel height increased to 250px CSS (was 190px)
- Button gap: 55px CSS between centers (was 30px — buttons were overlapping)
- Refill content positioned between lives info and action buttons

### TileSprite
- Booster idle micro-animations removed (pulse, shimmer, rotation were too prominent at variable scales)

## Deviations from Plan

**Significant deviation:** After initial implementation, human verification revealed multiple issues requiring a second pass:
1. Level Select elements were too large on mobile (cssToGame sizes appropriate for fixed viewports but disproportionate on narrow mobile screens)
2. First level too close to screen bottom — needed dynamic world bottom padding
3. Background images not covering full viewport — sky was sized for 1024x768 instead of actual viewport
4. Game overlay buttons overlapping — spacing insufficient for button height
5. Booster animations too prominent — removed entirely

All issues fixed in follow-up commit (16cb762).

## Testing Notes

Verified across target viewports in Chrome DevTools:
- iPhone SE (375x667): HUD compact, level nodes accessible, grid fits, overlays contained
- iPhone 14 Pro (393x852): Safe area padding works, no notch obstruction
- Android (360x740): Grid fits, text readable
- Desktop (1920x1080): No excessive scaling, proportions maintained
- Resize: Layout adapts smoothly

User approved after fix pass.

## Commits

- bf7b87c: feat(12-02): make LevelSelect and Menu responsive with iOS safe area support
- 16cb762: fix(12): responsive layout fixes from visual verification

## Self-Check: PASSED

- VERIFIED: LevelSelect imports responsive utilities
- VERIFIED: Menu imports responsive utilities
- VERIFIED: index.html has viewport-fit=cover
- VERIFIED: All commits present
- VERIFIED: User approved visual verification
