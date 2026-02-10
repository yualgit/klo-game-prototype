---
phase: 14-collection-data-model-viewing
plan: 02
subsystem: collections-ui
tags: [collections-scene, card-grid, scrolling, ui-scene-integration]
dependency-graph:
  requires: [phase-14-plan-01, phase-13-ui-scene, phase-12-responsive]
  provides: [collections-viewing-ui, card-texture-loading]
  affects: [phase-15-card-reveal, phase-16-exchange-animation]
tech-stack:
  added: []
  patterns: [camera-scroll, card-grid-layout, grayscale-tint, aspect-ratio-preserve]
key-files:
  created: []
  modified:
    - src/scenes/Boot.ts
    - src/scenes/Collections.ts
    - src/scenes/Shop.ts
decisions:
  - "Card images preserve natural aspect ratio (696:1158 portrait) instead of forced square"
  - "Camera scroll pattern from LevelSelect reused for vertical collection browsing"
  - "Uncollected cards use same texture with gray tint (0x808080) + alpha(0.4) + '?' overlay"
  - "scene.bringToTop('UIScene') ensures header/nav render above content scenes"
  - "Rarity badge: small colored dot at bottom-right corner of owned cards"
  - "No Rex UI plugins — camera scroll is simpler and proven"
metrics:
  duration: ~180
  tasks: 2
  files: 3
  completed: 2026-02-10
---

# Phase 14 Plan 02: Collections Scene UI Summary

**One-liner:** Scrollable Collections scene with 3 collection grids (Coffee/Food/Cars), grayscale uncollected cards with "?" overlay, portrait aspect ratio cards, and UIScene integration (header + bottom nav).

## Objective Achieved

Replaced the Collections stub scene with a fully functional collection viewing UI:
- 18 card textures loaded in Boot scene
- Scrollable vertical layout with 3 collections
- Card grid (2×3) per collection with owned/unowned visual states
- Progress tracking (X/6) per collection
- UIScene header and bottom nav visible and functional
- Drag scrolling for navigating between collections

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Load card textures in Boot and implement Collections scene UI | 05a1790 | src/scenes/Boot.ts, src/scenes/Collections.ts |
| 2 | Visual verification of Collections UI | 3d05364 (fixes) | src/scenes/Collections.ts, src/scenes/Shop.ts |

## Implementation Details

### Card Texture Loading (Boot.ts)

18 card PNGs loaded with texture keys matching `CARD_DEFINITIONS`:
- `collection_coffee_01` through `collection_coffee_06`
- `collection_food_01` through `collection_food_06`
- `collection_car_01` through `collection_car_06`
- `collection_blank` placeholder

### Collections Scene (Collections.ts)

**Layout:**
- Header offset (60px CSS) → collection blocks → bottom nav safe area
- Each collection: title → reward description → 2×3 card grid → progress counter
- Cards display at 80px CSS width with preserved 696:1158 portrait aspect ratio

**Card States:**
- Owned: full-color image + rarity badge (colored dot at bottom-right)
- Unowned: same texture with `setTint(0x808080)` + `setAlpha(0.4)` + centered "?" text

**Rarity Badge Colors:**
- Common: gray (#888)
- Rare: blue (#4488FF)
- Epic: purple (#AA44FF)
- Legendary: gold (#FFB800)

**Scrolling:** Camera-based drag scroll following LevelSelect pattern (pointerdown/pointermove/pointerup with delta tracking).

**UIScene Integration:**
- Launches UIScene with `currentTab: 'collections'`, `showBottomNav: true`, `showHeader: true`
- `bringToTop('UIScene')` ensures UI renders above content
- Navigation via EventsCenter (navigate-to, open-settings)
- Proper shutdown cleanup (off events, stop UIScene, off resize)

### UIScene Visibility Fix

Added `this.scene.bringToTop('UIScene')` after launch in both Collections and Shop scenes to ensure header and bottom navigation always render above content.

## Deviations from Plan

- **Aspect ratio fix:** Plan specified `cardSize × cardSize` (square). Changed to preserve natural 696:1158 portrait ratio per user feedback.
- **bringToTop added:** UIScene needed explicit `bringToTop` call to render above content scenes consistently.

## Success Criteria Met

- [x] 3 collections visible on scrollable page (Coffee/Food/Cars)
- [x] Each collection shows Ukrainian name, reward description, 6-card grid, progress X/6
- [x] Uncollected cards shown as grayscale silhouette with "?" overlay
- [x] Card images preserve natural aspect ratio
- [x] Drag scrolling works, last collection fully accessible
- [x] UIScene integration preserved (header, bottom nav, navigation)
- [x] Human verification passed

## Self-Check: PASSED

**Modified files exist:**
- FOUND: src/scenes/Boot.ts
- FOUND: src/scenes/Collections.ts
- FOUND: src/scenes/Shop.ts

**Commits exist:**
- FOUND: 05a1790 (Task 1: card textures + Collections scene UI)
- FOUND: 3d05364 (Task 2: aspect ratio fix + UIScene bringToTop)

**TypeScript compilation:** PASS
