---
phase: 15-card-acquisition-flow
plan: 02
subsystem: ui-scenes
tags: [card-pick-overlay, flip-animation, bonus-levels, ux, collections]

# Dependency graph
requires:
  - phase: 15-card-acquisition-flow
    plan: 01
    provides: Card drop logic with rollCard(), selectCard(), collection rotation
provides:
  - CardPickOverlay scene with 2-card pick UX
  - Flip animation revealing card fronts
  - Bonus level trigger in Game.ts win overlay
  - Procedural card back texture (KLO-branded)
affects: [game-loop, collections, card-acquisition]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Flip animation with scaleX tween (scale to 0, swap content, scale to 1)"
    - "Procedural Graphics texture for card backs (KLO yellow border + dark bg)"
    - "scene.start() for full scene transition (not launch) from Game to CardPickOverlay"

key-files:
  created:
    - src/scenes/CardPickOverlay.ts
  modified:
    - src/scenes/index.ts
    - src/main.ts
    - src/scenes/Game.ts

key-decisions:
  - "Procedural card back instead of asset (card_back.png doesn't exist) - avoids missing asset error"
  - "scene.start() for CardPickOverlay (not launch) - Game scene stops, overlay becomes active scene"
  - "Bonus hint text shown on win overlay - 'Бонус: обери картку!' prepares player for card pick"
  - "CardPickOverlay handles next level navigation - simplifies control flow"

patterns-established:
  - "Flip animation: scaleX tween with content swap at scaleX=0"
  - "Interactive backdrop with Geom.Rectangle hit area blocks click-through (Phaser gotcha)"
  - "async onCardPicked with Promise-based flip animations - sequential reveal"

# Metrics
duration: 166s
completed: 2026-02-11
---

# Phase 15 Plan 02: Card Reveal UX Summary

**CardPickOverlay scene with 2-card pick-one-of-two UX, flip animation (scaleX tween), and bonus level integration in Game.ts win flow**

## Performance

- **Duration:** 2min 46s
- **Started:** 2026-02-11T08:30:04Z
- **Completed:** 2026-02-11T08:32:50Z
- **Tasks:** 2
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments
- Created CardPickOverlay scene with 2-card pick UX (tap to pick, both flip to reveal)
- Implemented flip animation using scaleX tween (200ms shrink, swap content, 200ms expand)
- Procedural card back texture with KLO yellow border and dark background (no asset dependency)
- Integrated bonus level detection in Game.ts win overlay
- Added "Бонус: обери картку!" hint text for bonus levels
- Bonus level "Далі" button triggers CardPickOverlay, non-bonus proceeds normally
- Rarity labels with Phase 14 badge colors (common=#888888, rare=#4488FF, epic=#AA44FF, legendary=#FFB800)
- Continue button navigates to next level or LevelSelect after card selection

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CardPickOverlay scene with flip animation** - `1f98557` (feat)
2. **Task 2: Register CardPickOverlay and integrate bonus level trigger** - `fb9831a` (feat)

## Files Created/Modified

- `src/scenes/CardPickOverlay.ts` - Full overlay scene with 2-card pick UX, flip animation, continue button
- `src/scenes/index.ts` - Added CardPickOverlay export
- `src/main.ts` - Registered CardPickOverlay in Phaser scene config
- `src/scenes/Game.ts` - Added bonus level detection and CardPickOverlay trigger in showWinOverlay()

## Decisions Made

1. **Procedural card back (not asset):** card_back.png doesn't exist in assets/collections/. Created procedural Graphics texture with KLO yellow border and dark background. Avoids missing asset error, provides branded design without art dependency.

2. **scene.start() instead of scene.launch():** CardPickOverlay is a full scene transition, not parallel overlay. Game scene stops when CardPickOverlay starts. This simplifies state management and ensures clean scene lifecycle.

3. **Bonus hint text on win overlay:** Added "Бонус: обери картку!" subtitle to win overlay for bonus levels. Prepares player for card pick experience, clarifies that "Далі" will not go directly to next level.

4. **CardPickOverlay handles navigation:** Continue button logic lives in CardPickOverlay, not Game.ts. Decouples scenes and follows single-responsibility principle.

## Deviations from Plan

None - plan executed exactly as written. Procedural card back was anticipated in plan as fallback if asset doesn't exist.

## Issues Encountered

None - all implementations compiled and built successfully on first attempt. TypeScript and Vite build passed without errors.

## User Setup Required

None - no external service configuration or asset creation required.

## Next Phase Readiness

**Phase 15 complete - card acquisition flow fully implemented:**
- Bonus level wins trigger CardPickOverlay (L3, L6, L9)
- Player picks 1 of 2 cards with visual flip reveal
- Picked card saved to collection via selectCard() with pity tracking
- Collection rotation working (coffee → food → car)
- Non-bonus levels unaffected (proceed to next level as before)

**Ready for Phase 16 (future):** Could add notification dots, collection completion rewards, or extended card acquisition features.

**No blockers or concerns.**

## Self-Check: PASSED

All claims verified:
- ✓ Created file exists: src/scenes/CardPickOverlay.ts
- ✓ Modified files exist: index.ts, main.ts, Game.ts
- ✓ Commits exist: 1f98557, fb9831a
- ✓ CardPickOverlay exported from scenes barrel
- ✓ CardPickOverlay registered in Phaser config
- ✓ Game.ts contains isBonusLevel check and CardPickOverlay trigger
- ✓ TypeScript compilation passed
- ✓ Vite build succeeded

---
*Phase: 15-card-acquisition-flow*
*Completed: 2026-02-11*
