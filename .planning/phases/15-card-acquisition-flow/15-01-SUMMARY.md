---
phase: 15-card-acquisition-flow
plan: 01
subsystem: game-logic
tags: [card-drop, weighted-random, pity-system, collections, gacha-mechanics]

# Dependency graph
requires:
  - phase: 14-collection-data-model-viewing
    provides: CollectionsManager with pity_streak field, collection state in Firestore
provides:
  - Weighted random card selection with rarity-based probability
  - Pity system guaranteeing new cards after consecutive duplicates
  - Collection rotation logic mapping bonus levels to collections
  - Bonus level flags in level JSON files
affects: [16-card-reveal-ux, collections, game-loop]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Weighted random selection with rarity tiers"
    - "Pity system with per-collection streak tracking"
    - "Config-driven drop rates (DROP_CONFIG)"

key-files:
  created:
    - src/game/cardDropLogic.ts
  modified:
    - src/game/collectionConfig.ts
    - src/game/CollectionsManager.ts
    - public/data/levels/level_003.json
    - public/data/levels/level_006.json
    - public/data/levels/level_009.json

key-decisions:
  - "Pity threshold check happens BEFORE rolling card (avoids off-by-one error)"
  - "selectCard() differs from addCard() - handles pity tracking for card acquisition flow"
  - "Collection rotation: coffee (L3) -> food (L6) -> car (L9) based on level math"
  - "Bonus levels at 3, 6, 9 for balanced progression across 10-level journey"

patterns-established:
  - "DROP_CONFIG: Config-driven drop rates with rarity weights and pity multipliers"
  - "rollCard(): Check pity threshold, filter missing cards if pity triggered, weighted random selection"
  - "selectCard() vs addCard(): selectCard handles pity tracking, addCard is direct grant"

# Metrics
duration: 142s
completed: 2026-02-11
---

# Phase 15 Plan 01: Card Acquisition Flow Logic Summary

**Weighted random card drop with rarity-based probability (50% common → 5% legendary) and pity system guaranteeing new cards after 3 consecutive duplicates**

## Performance

- **Duration:** 2min 22s
- **Started:** 2026-02-11T08:24:41Z
- **Completed:** 2026-02-11T08:27:03Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Implemented weighted random card selection respecting rarity distribution (common 50%, rare 30%, epic 15%, legendary 5%)
- Built pity system with per-collection streak tracking (resets on new card, increments on duplicate)
- Created collection rotation logic mapping bonus levels to collections (L3→coffee, L6→food, L9→car)
- Marked levels 3, 6, 9 as bonus levels for card drop triggers

## Task Commits

Each task was committed atomically:

1. **Task 1: Create card drop logic module + extend CollectionsManager + collection rotation** - `2f27655` (feat)
2. **Task 2: Mark bonus levels in level JSON files** - `92f60ac` (feat)

## Files Created/Modified

- `src/game/cardDropLogic.ts` - Weighted random card selection with pity guarantee (rollCard, DROP_CONFIG)
- `src/game/collectionConfig.ts` - Added getActiveCollectionId() for level-based collection rotation
- `src/game/CollectionsManager.ts` - Added getPityStreak() and selectCard() for pity tracking
- `public/data/levels/level_003.json` - Added bonus_level: true flag
- `public/data/levels/level_006.json` - Added bonus_level: true flag
- `public/data/levels/level_009.json` - Added bonus_level: true flag

## Decisions Made

1. **Pity check BEFORE rolling (not after):** Research documented off-by-one error where pity triggers late if streak incremented before check. Implementation checks `pityStreak >= threshold` BEFORE calling rollCard().

2. **selectCard() vs addCard():** Kept both methods - addCard() for direct card grants (no pity context), selectCard() for acquisition flow with pity tracking. Different use cases, both needed.

3. **Collection rotation math:** Used `Math.floor((levelId - 1) / 3) % 3` to map L3→0→coffee, L6→1→food, L9→2→car. Handles any future bonus levels automatically.

4. **Bonus levels at 3, 6, 9:** Gives 3 card drops across 10-level demo (one per collection). Balanced progression without overwhelming player.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all implementations compiled and verified on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 15-02 (Card Reveal UX):**
- cardDropLogic.rollCard() ready to be called from CardPickOverlay scene
- CollectionsManager.selectCard() ready to persist card selection with pity tracking
- Bonus level detection ready via `levelData.bonus_level === true` check
- Collection rotation ready via getActiveCollectionId(levelId)

**No blockers or concerns.**

## Self-Check: PASSED

All claims verified:
- ✓ Created file exists: src/game/cardDropLogic.ts
- ✓ Modified files exist: collectionConfig.ts, CollectionsManager.ts, level_003/006/009.json
- ✓ Commits exist: 2f27655, 92f60ac
- ✓ Exports verified: rollCard, DROP_CONFIG, getActiveCollectionId, getPityStreak, selectCard
- ✓ Bonus level flags: L3, L6, L9 all have bonus_level: true

---
*Phase: 15-card-acquisition-flow*
*Completed: 2026-02-11*
