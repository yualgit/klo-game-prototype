---
phase: 15-card-acquisition-flow
plan: 03
subsystem: ui-polish
tags: [uat-fixes, text-positioning, duplicate-tracking, collections-badge, gap-closure]

# Dependency graph
requires:
  - phase: 15-card-acquisition-flow
    plan: 02
    provides: CardPickOverlay scene with win overlay bonus hint
  - phase: 14-collections-system
    plan: 02
    provides: Collections screen with card rendering
provides:
  - Fixed text overlap issues in win overlay and card reveal
  - Duplicate card count tracking in CollectionProgress
  - Visual duplicate count badge ("xN") on Collections screen
affects: [collections, game-loop, card-acquisition]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "card_counts: Record<string, number> tracking per-card acquisition count"
    - "getCardCount() accessor method for duplicate count queries"
    - "Backward-compatible Firestore migrations (default empty object for missing fields)"

key-files:
  created: []
  modified:
    - src/scenes/Game.ts
    - src/scenes/CardPickOverlay.ts
    - src/firebase/firestore.ts
    - src/game/CollectionsManager.ts
    - src/scenes/Collections.ts
    - src/main.ts

key-decisions:
  - "Bonus hint Y=75 (was 42) places text below stars at all star counts (45 for 1-2 stars, 60 for 3 stars)"
  - "Rarity label Y offset=140 (was 110) gives 33.5px clearance from card name for 14px text + gap"
  - "card_counts field added to CollectionProgress interface for duplicate tracking"
  - "Backward compatibility: existing users without card_counts get empty object default"
  - "Duplicate badge positioned at top-right corner with 'xN' format (x2, x3, etc.)"

patterns-established:
  - "CSS pixel spacing calculations (cssToGame multiplier) for text positioning"
  - "Per-card acquisition counting separate from owned_cards array (supports duplicates)"
  - "Firestore migration pattern: Object.entries + reduce with fallback defaults"

# Metrics
duration: 114s
completed: 2026-02-11
---

# Phase 15 Plan 03: UAT Gap Closure Summary

**Fixed 3 UAT issues: bonus hint text positioning (Y=75), rarity label spacing (Y offset=140), and duplicate card count tracking with "xN" badge display**

## Performance

- **Duration:** 1min 54s
- **Started:** 2026-02-11T09:33:00Z
- **Completed:** 2026-02-11T09:34:54Z
- **Tasks:** 2
- **Files modified:** 6 (0 created, 6 modified)

## Accomplishments
- Fixed bonus hint text overlap with star icons on win overlay (moved from Y=42 to Y=75)
- Fixed rarity label overlap with card name on CardPickOverlay (offset from 110 to 140 CSS pixels)
- Added card_counts field to CollectionProgress for tracking duplicate acquisitions
- Implemented getCardCount() method in CollectionsManager for duplicate count queries
- Rendered "xN" badge on top-right of duplicate cards in Collections scene
- Ensured backward compatibility for existing users without card_counts field

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix text overlap issues in Game.ts and CardPickOverlay.ts** - `499e91a` (fix)
2. **Task 2: Add duplicate card count tracking and display** - `107ab90` (feat)

## Files Created/Modified

- `src/scenes/Game.ts` - Bonus hint Y position changed from cssToGame(42) to cssToGame(75)
- `src/scenes/CardPickOverlay.ts` - Rarity label Y offset changed from cssToGame(110) to cssToGame(140)
- `src/firebase/firestore.ts` - Added card_counts field to CollectionProgress interface, updated default states
- `src/game/CollectionsManager.ts` - Added getCardCount() method, track counts in selectCard() and addCard()
- `src/scenes/Collections.ts` - Render "xN" badge on top-right corner of owned cards when count > 1
- `src/main.ts` - Updated default collection states with card_counts: {} for new users

## Decisions Made

1. **Bonus hint positioning (Y=75):** Stars appear at Y=45 for 1-2 star completions and Y=60 for 3 stars. Placing bonus hint at Y=75 ensures at least 15 CSS pixels of clearance from stars at their lowest position, preventing overlap in all cases.

2. **Rarity label spacing (Y offset=140):** Card name is positioned at cardHeight/2 + cssToGame(15), which is approximately Y=106.5 (card half-height is 91.5px). Rarity label at offset 140 gives 33.5 CSS pixels between name and label, sufficient for 14px fontSize + comfortable gap.

3. **card_counts field for duplicate tracking:** Separate from owned_cards array to track per-card acquisition count. Supports duplicate card acquisition without polluting the owned_cards unique list. Stored as Record<string, number> in CollectionProgress interface.

4. **Backward compatibility:** Existing Firestore documents without card_counts field get empty object default during loadCollections(). Object.entries + reduce pattern ensures safe migration without data loss.

5. **Duplicate badge styling:** Small "xN" text badge at top-right corner with white text on dark background (#333333), 10px font size, aligned with setOrigin(1, 0) for top-right positioning. Only shown when count > 1.

## Deviations from Plan

None - plan executed exactly as written. All 3 UAT gaps addressed with precise positioning fixes and duplicate count tracking implementation.

## Issues Encountered

None - all implementations compiled and built successfully. TypeScript compilation passed without errors. Vite production build succeeded with no new warnings.

## User Setup Required

None - no external service configuration required. Firestore schema migration is automatic via backward-compatible defaults.

## Next Phase Readiness

**Phase 15 complete - all UAT gaps closed:**
- Text overlaps resolved on win overlay and card reveal screens
- Duplicate card count tracking functional and persisted to Firestore
- Collections screen shows visual duplicate count badge for cards owned multiple times
- Backward compatibility ensures existing users without card_counts field work seamlessly

**Ready for Phase 16 (if planned):** Could add notification dots for new cards, collection completion rewards, or extended card acquisition features.

**No blockers or concerns.**

## Self-Check: PASSED

All claims verified:
- ✓ Modified file exists: src/scenes/Game.ts (bonus hint at cssToGame(75))
- ✓ Modified file exists: src/scenes/CardPickOverlay.ts (rarity label at cssToGame(140))
- ✓ Modified file exists: src/firebase/firestore.ts (card_counts field in CollectionProgress)
- ✓ Modified file exists: src/game/CollectionsManager.ts (getCardCount method, count tracking in selectCard/addCard)
- ✓ Modified file exists: src/scenes/Collections.ts (duplicate count badge rendering)
- ✓ Modified file exists: src/main.ts (card_counts in default states)
- ✓ Commits exist: 499e91a, 107ab90
- ✓ TypeScript compilation passed
- ✓ Vite build succeeded

---
*Phase: 15-card-acquisition-flow*
*Completed: 2026-02-11*
