---
phase: 16-collection-exchange-polish
plan: 01
subsystem: collections
tags: [eventEmitter, reactive-ui, notification-dot, exchange-logic]
depends_on: []
provides:
  - CollectionsManager with EventEmitter pattern
  - hasExchangeableCollection() and exchangeCollection() methods
  - Notification dot on Collections tab
  - Reactive UI updates via events
affects:
  - src/game/CollectionsManager.ts
  - src/scenes/UIScene.ts
tech_stack:
  added: []
  patterns:
    - EventEmitter pattern for reactive manager updates
    - Notification badge UI component
key_files:
  created: []
  modified:
    - src/game/CollectionsManager.ts
    - src/scenes/UIScene.ts
decisions:
  - "Use Phaser.Events.EventEmitter for CollectionsManager (same pattern as EconomyManager)"
  - "Notification dot is Arc type (not Circle), positioned top-right of Collections tab icon"
  - "Dot only renders when bottom nav is visible (created inside createTabButton)"
metrics:
  duration_seconds: 169
  tasks_completed: 2
  files_modified: 2
  commits: 2
  completed_date: "2026-02-11"
---

# Phase 16 Plan 01: Collection Exchange Foundation Summary

**One-liner:** EventEmitter-based CollectionsManager with exchange logic and reactive notification dot on Collections tab

## What Was Built

Added EventEmitter capabilities to CollectionsManager for reactive UI updates and implemented a notification badge system for the Collections tab:

1. **CollectionsManager EventEmitter Extension:**
   - Extended `Phaser.Events.EventEmitter` (following EconomyManager pattern)
   - Added `hasExchangeableCollection()` to check if any collection is 6/6
   - Added `exchangeCollection()` to deduct cards while preserving duplicates
   - Emits 3 events: `collection-exchangeable`, `collection-exchanged`, `no-exchangeable-collections`
   - Modified `selectCard()` and `addCard()` to emit `collection-exchangeable` when collection completes

2. **UIScene Notification Dot:**
   - Added red notification dot (4px radius circle) on Collections tab
   - Positioned top-right of icon at depth 202
   - Subscribes to CollectionsManager events for reactive show/hide
   - Initial check on scene create shows dot if any collection is ready
   - Proper cleanup on shutdown and resize

## Task Breakdown

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend CollectionsManager with EventEmitter and exchange logic | a6fea11 | src/game/CollectionsManager.ts |
| 2 | Add notification dot to Collections tab in UIScene | b4221fc | src/scenes/UIScene.ts |

## Technical Implementation

**CollectionsManager Exchange Logic:**
- `exchangeCollection()` deducts one of each card from `card_counts`
- Removes cards from `owned_cards` only if `card_counts[cardId]` drops to 0
- Preserves duplicates: card with count=3 becomes count=2, stays in `owned_cards`
- Resets `pity_streak` to 0 for fresh re-collection
- Emits events in order: `collection-exchanged` → `no-exchangeable-collections` (if applicable)

**UIScene Notification Dot:**
- Type: `Phaser.GameObjects.Arc` (not Circle - TypeScript type requirement)
- Created inside `createTabButton()` for 'collections' tab only
- Visible state driven by `hasExchangeableCollection()` from manager
- Event listeners cleaned up in both `destroyAllElements()` and `onShutdown()`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type for notification dot**
- **Found during:** Task 2, TypeScript compilation
- **Issue:** `Phaser.GameObjects.Circle` type doesn't exist - Phaser circles are Arc objects
- **Fix:** Changed type from `Circle` to `Arc` for `collectionsNotificationDot` property
- **Files modified:** src/scenes/UIScene.ts
- **Commit:** b4221fc (included in task commit)

## Verification Results

✅ `npx tsc --noEmit` passes with zero errors
✅ CollectionsManager extends Phaser.Events.EventEmitter
✅ exchangeCollection() exists and handles card deduction with duplicate preservation
✅ hasExchangeableCollection() correctly checks all 3 collections
✅ UIScene creates notification dot for Collections tab
✅ Notification dot is reactive (shows on collection-exchangeable, hides on no-exchangeable-collections, updates on collection-exchanged)
✅ All event listeners cleaned up on shutdown

## Success Criteria Met

- ✅ CollectionsManager emits events on state changes (exchangeable, exchanged, no-exchangeable)
- ✅ Exchange logic correctly deducts 1 of each card, preserving duplicate counts
- ✅ Notification dot appears on Collections tab when any collection is 6/6
- ✅ Notification dot hides when no collections are 6/6
- ✅ No TypeScript errors

## Next Steps

This plan provides the foundation for Phase 16:
- Plan 02 will add the exchange button to CollectionsScene
- Plan 03 will implement the exchange reward flow (bonuses, animation)
- CollectionsManager event system is ready for future UI integration

## Self-Check: PASSED

**Created files:** None (all modifications)

**Modified files exist:**
```
FOUND: src/game/CollectionsManager.ts
FOUND: src/scenes/UIScene.ts
```

**Commits exist:**
```
FOUND: a6fea11
FOUND: b4221fc
```

All claimed artifacts verified successfully.
