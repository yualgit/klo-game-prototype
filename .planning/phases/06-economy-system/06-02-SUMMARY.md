---
phase: 06-economy-system
plan: 02
subsystem: ui-integration
tags: [economy, lives-ui, countdown-timer, level-gating, refill-prompt, typescript]

# Dependency graph
requires:
  - phase: 06-economy-system
    plan: 01
    provides: "EconomyManager singleton with lives regeneration API"
  - phase: 02-core-mechanics
    provides: "LevelSelect and Game scene architecture"
provides:
  - "Lives HUD with countdown timer in LevelSelect scene"
  - "Level entry gating when lives = 0"
  - "Refill prompt UI in both LevelSelect and Game scenes"
  - "Life loss integration on level failure"
  - "Lives awareness display in win/lose overlays"
affects: [07-settings, 09-kyiv-map]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "1-second timer for real-time countdown updates"
    - "Inline refill prompt expansion within lose overlay"
    - "Modal overlay pattern with element cleanup"

key-files:
  created: []
  modified:
    - src/scenes/LevelSelect.ts
    - src/scenes/Game.ts

key-decisions:
  - "Lives HUD positioned in top-right corner (width-100, y=60) to avoid title overlap"
  - "Countdown text hidden when lives = 5 (setText('') instead of setVisible)"
  - "Inline refill prompt in Game lose overlay (expand panel vs separate modal) for better UX flow"
  - "Lives displayed in win overlay as informational (no life lost on win) for player awareness"

patterns-established:
  - "Pattern 1: Economy HUD timer pattern - 1-second callback with updateEconomyDisplay, cleanup on shutdown"
  - "Pattern 2: Modal overlay cleanup - store elements in array, destroy on close/button press"
  - "Pattern 3: Inline expansion UI - add elements to existing container vs creating new modal"

# Metrics
duration: 2min
completed: 2026-02-10
---

# Phase 06 Plan 02: Lives UI Integration Summary

**Lives system integrated into LevelSelect (HUD, countdown, level gating) and Game scene (life loss, retry gating, refill prompts) with full economy manager connectivity**

## Performance

- **Duration:** 2 minutes
- **Started:** 2026-02-10T12:09:58Z
- **Completed:** 2026-02-10T12:12:26Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Lives HUD with countdown timer added to LevelSelect scene
- Level start gated when lives = 0 with refill prompt modal
- Life loss integrated on level failure in Game scene
- Retry gated when 0 lives with inline refill option
- Lives awareness displayed in both win and lose overlays
- All 7 ECON requirements now fully implemented and user-facing

## Task Commits

Each task was committed atomically:

1. **Task 1: Add lives HUD and level gating to LevelSelect** - `1ddf150` (feat)
2. **Task 2: Integrate life loss and no-lives handling in Game scene** - `3fc81a9` (feat)

## Files Created/Modified

### Created
None - integrated into existing scenes

### Modified
- `src/scenes/LevelSelect.ts` - Added economy HUD (lives, bonuses, countdown), 1-second timer, level gating, no-lives modal prompt
- `src/scenes/Game.ts` - Added life loss on fail, lives display in overlays, retry gating, inline refill prompt

## UI Implementation Details

**LevelSelect Economy HUD (Top-Right):**
- Heart icon (❤) + lives text "X/5" in bold 24px #1A1A1A
- Countdown "Далі: MM:SS" in 16px #666666 (hidden when lives = 5)
- Bonus icon (💎) + bonus count in bold 20px #FFB800
- Positioned at (width-100, 60) to avoid title and back button overlap
- 1-second timer updates display automatically

**No-Lives Modal (LevelSelect):**
- Semi-transparent backdrop (0x000000, 0.6)
- White panel 300x250 centered
- Title "Немає життів!" in 32px bold
- Countdown "Наступне через: MM:SS"
- Refill button "Поповнити (15 бонусів)" - only interactive if bonuses >= 15
- Close button "Закрити" (secondary style)

**Lose Overlay Changes (Game):**
- Life deducted via `economy.loseLife()` at overlay start
- Lives info "Залишилось життів: X/5" in 18px #FFB800
- Panel height expanded to 380 (from 280) for refill section
- Retry button checks `canStartLevel()` before restart
- Inline refill section appears when retry blocked (shows at y=290)

**Win Overlay Changes (Game):**
- Lives display "❤ X/5" in 18px #FFB800 (informational only)
- Positioned 50px below stars for awareness

## API Usage

**EconomyManager Methods Called:**
- `getLives()` - HUD display, overlay text
- `getBonuses()` - HUD display, refill availability check
- `canStartLevel()` - Level gating (returns true if lives > 0)
- `getSecondsUntilNextLife()` - Countdown timer formatting
- `loseLife()` - Called once in `showLoseOverlay()` (fire-and-forget)
- `spendBonusesForRefill()` - Refill button handler (15 bonus cost)

## Decisions Made

1. **Top-right HUD placement:** Avoids overlap with "Оберіть рівень" title and back button, maintains visual balance
2. **Hidden countdown at max:** Using `setText('')` instead of `setVisible(false)` prevents layout shifts
3. **Inline refill in Game:** Expanding lose panel is more fluid than showing separate modal after retry click
4. **Lives in win overlay:** Informational awareness - player knows state before continuing, no life lost on win
5. **Timer cleanup on shutdown:** Prevents memory leaks and timer errors on scene restart

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - TypeScript compilation passed, all economy manager methods available from registry.

## User Setup Required

None - economy manager already initialized in main.ts from Phase 06-01.

## ECON Requirements Coverage

**Fully Implemented (7/7):**
- ECON-01: New user starts with 5 lives, 500 bonuses ✓ (Phase 06-01)
- ECON-02: Lose 1 life on level failure ✓ (Task 2: `loseLife()` in `showLoseOverlay`)
- ECON-03: Cannot start level with 0 lives ✓ (Task 1: `canStartLevel()` gating)
- ECON-04: 1 life regenerates per 30 minutes to max 5 ✓ (Phase 06-01: regeneration logic)
- ECON-05: Lives count and countdown visible ✓ (Task 1: HUD with timer)
- ECON-06: Spend 15 bonuses to refill lives ✓ (Task 1 + 2: refill prompts)
- ECON-07: State persists via Firestore ✓ (Phase 06-01: `saveEconomy/loadEconomy`)

## Next Phase Readiness

**Ready for Phase 07 (Settings):**
- Economy system complete and user-facing
- Lives gating validates persistence layer works
- UI patterns established for settings modal overlays

**Blockers:** None

**Dependencies satisfied:**
- EconomyManager accessible in all scenes via registry
- Lives regeneration timer runs independently
- Firestore persistence operational

## Self-Check: PASSED

All claims verified:
- File modified: src/scenes/LevelSelect.ts ✓
- File modified: src/scenes/Game.ts ✓
- Commit exists: 1ddf150 (Task 1) ✓
- Commit exists: 3fc81a9 (Task 2) ✓
- TypeScript compilation passes ✓

---
*Phase: 06-economy-system*
*Completed: 2026-02-10*
