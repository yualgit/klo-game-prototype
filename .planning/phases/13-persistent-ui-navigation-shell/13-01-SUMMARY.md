---
phase: 13-persistent-ui-navigation-shell
plan: 01
subsystem: ui

tags:
  - phaser3
  - eventemitter
  - cross-scene-communication
  - reactive-ui
  - responsive-layout

# Dependency graph
requires:
  - phase: 12-responsive-layout
    provides: cssToGame() DPR multiplier pattern for responsive sizing
  - phase: 11-art-and-polish
    provides: EconomyManager singleton with lives/bonuses state management
  - phase: 01-foundation
    provides: Phaser registry pattern for manager access

provides:
  - EventsCenter singleton for cross-scene event communication
  - EconomyManager event emission (lives-changed, bonuses-changed)
  - UIScene persistent shell with header and bottom navigation
  - Navigation event pattern (navigate-to, open-settings)
  - Reactive header updates via EconomyManager subscriptions

affects:
  - 13-02 (will implement navigation routing logic using UIScene + EventsCenter)
  - 14-collections-ui (will use bottom nav to reach collections tab)
  - 15-shop (will use bottom nav to reach shop tab)

# Tech tracking
tech-stack:
  added:
    - EventsCenter (Phaser EventEmitter singleton)
  patterns:
    - Cross-scene event bus via EventsCenter
    - EventEmitter extension for reactive state managers
    - Parallel scene architecture (UIScene + content scene)
    - Safe area inset CSS variables for bottom nav positioning
    - Interactive graphics for click-through blocking

key-files:
  created:
    - src/utils/EventsCenter.ts
    - src/scenes/UIScene.ts
  modified:
    - src/game/EconomyManager.ts

key-decisions:
  - "UIScene runs in parallel with content scenes, not as overlay or separate state"
  - "EventsCenter singleton pattern (not game.events) for cross-scene communication"
  - "EconomyManager extends EventEmitter for reactive UI updates"
  - "Bottom nav uses CSS custom properties for safe area inset (notch support)"
  - "Graphics backgrounds made interactive to block click-through (Phaser gotcha)"

patterns-established:
  - "EventsCenter: import eventsCenter from '../utils/EventsCenter'; eventsCenter.emit('event-name', data)"
  - "Manager event subscription: economy.on('lives-changed', handler) in create(), economy.off() in shutdown"
  - "Resize handling: destroy all elements, recreate with new dimensions, re-subscribe to events"
  - "Tab highlighting: active tab #FFB800 (KLO yellow), inactive #AAAAAA (dimmed gray)"

# Metrics
duration: 154s
completed: 2026-02-10
---

# Phase 13 Plan 01: Persistent UI Navigation Shell Summary

**EventsCenter singleton and reactive EconomyManager enable UIScene persistent header with live-updating lives/bonuses/countdown and bottom nav with 3 highlighted tabs**

## Performance

- **Duration:** 2 min 34s
- **Started:** 2026-02-10T20:28:10Z
- **Completed:** 2026-02-10T20:30:44Z
- **Tasks:** 2
- **Files modified:** 3 (1 new utility, 1 new scene, 1 enhanced manager)

## Accomplishments

- EventsCenter singleton provides Phaser EventEmitter for cross-scene communication (not game.events)
- EconomyManager enhanced to extend EventEmitter and emit 'lives-changed'/'bonuses-changed' on all state mutations
- UIScene displays persistent header (lives/bonuses/countdown/settings) with reactive updates from EconomyManager subscriptions
- Bottom navigation shows 3 tabs (Levels/Collections/Shop) with active tab highlighted yellow, inactive dimmed gray
- All UI elements camera-fixed (scrollFactor 0) at depth 200+, interactive backgrounds block click-through

## Task Commits

Each task was committed atomically:

1. **Task 1: Create EventsCenter and enhance EconomyManager with event emission** - `0a1b062` (feat)
   - Created EventsCenter.ts as Phaser EventEmitter singleton
   - Modified EconomyManager to extend EventEmitter
   - Added super() call to constructor
   - Emit 'lives-changed' in loseLife(), spendBonusesForRefill(), recalculateLives()
   - Emit 'bonuses-changed' in spendBonusesForRefill()
   - Added addBonuses() method for future collection exchange flow

2. **Task 2: Create UIScene with global header and bottom navigation** - `357c747` (feat)
   - Created UIScene.ts with header and bottom nav
   - Header: Lives/bonuses with emoji icons, countdown timer, settings gear
   - Bottom nav: 3 tabs with icons/labels, active tab highlighted with glow
   - Reactive subscriptions to economy.on('lives-changed'/'bonuses-changed')
   - 1-second timer for countdown text updates
   - Resize handling: destroy and recreate all elements
   - Shutdown cleanup: remove all listeners and timers
   - Emit 'navigate-to' and 'open-settings' via EventsCenter

## Files Created/Modified

- **src/utils/EventsCenter.ts** - Phaser EventEmitter singleton for cross-scene events
- **src/scenes/UIScene.ts** - Persistent UI scene with header and bottom navigation, reactive updates, responsive resize
- **src/game/EconomyManager.ts** - Enhanced to extend EventEmitter, emit events on all state mutations (loseLife, spendBonusesForRefill, recalculateLives, addBonuses)

## Decisions Made

1. **UIScene as parallel scene**: Launched alongside content scenes with scene.launch('UIScene'), not as overlay. This keeps UI and content separation clean.

2. **EventsCenter singleton (not game.events)**: Created dedicated EventEmitter for cross-scene communication. game.events is for scene lifecycle only (documented Phaser 3 pattern).

3. **EconomyManager extends EventEmitter**: Enhanced existing manager to emit reactive events rather than creating separate event bus. Keeps state and events co-located.

4. **Bottom nav safe area support**: Read --safe-area-inset-bottom CSS custom property and convert to Phaser coords (safeAreaBottomCss * getDpr()). Prevents nav overlap with iPhone notch.

5. **Interactive graphics for click-through blocking**: Graphics backgrounds (header, nav) made interactive via setInteractive(new Phaser.Geom.Rectangle(...), Contains). This is CRITICAL - Graphics don't block input by default (MEMORY.md gotcha).

6. **Active tab highlighting pattern**: Active tab uses #FFB800 (KLO yellow) with 0.15 alpha glow, inactive uses #AAAAAA (dimmed gray). Consistent with KLO brand.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation proceeded as planned with no compilation errors or Phaser runtime issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for 13-02 (Navigation Routing):**
- UIScene infrastructure complete and verified
- EventsCenter ready for navigation event routing
- EconomyManager reactive events proven via TypeScript compilation
- Bottom nav emits 'navigate-to' events for content scene switching

**No blockers.**

## Self-Check: PASSED

All SUMMARY claims verified:
- ✓ src/utils/EventsCenter.ts exists
- ✓ src/scenes/UIScene.ts exists
- ✓ src/game/EconomyManager.ts modified
- ✓ Commit 0a1b062 exists (Task 1)
- ✓ Commit 357c747 exists (Task 2)
- ✓ TypeScript compilation passes

---
*Phase: 13-persistent-ui-navigation-shell*
*Completed: 2026-02-10*
