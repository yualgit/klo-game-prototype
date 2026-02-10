---
phase: 06-economy-system
plan: 01
subsystem: game-logic
tags: [economy, lives-system, firestore, singleton, typescript]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Firebase initialization and Firestore service"
  - phase: 02-core-mechanics
    provides: "ProgressManager singleton pattern"
provides:
  - "EconomyManager singleton with lives regeneration logic"
  - "EconomyState interface and Firestore persistence methods"
  - "Lives gating foundation for level entry"
  - "Bonus currency system with refill capability"
affects: [06-02, 07-settings, 08-level-mechanics]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Lives regeneration using Firebase server timestamps"
    - "Throttled recalculation pattern for performance"
    - "Fire-and-forget save pattern for background updates"

key-files:
  created:
    - src/game/EconomyManager.ts
  modified:
    - src/firebase/firestore.ts
    - src/main.ts

key-decisions:
  - "Use Firebase Timestamp (not Date) for server-side lives regeneration to prevent multi-device desync"
  - "Throttle lives recalculation to max once per second to avoid performance impact"
  - "Default to 5 lives and 500 bonuses for new users via nullish coalescing in loadEconomy"
  - "15 bonus cost for full lives refill (MAX_LIVES = 5)"

patterns-established:
  - "Pattern 1: Economy manager follows ProgressManager singleton pattern (constructor with service, uid, initial state)"
  - "Pattern 2: Lives regeneration uses Timestamp.fromMillis() to advance timer without drift"
  - "Pattern 3: Backward compatibility via ?? defaults in loadEconomy (existing users get defaults for new fields)"

# Metrics
duration: 8min
completed: 2026-02-10
---

# Phase 06 Plan 01: Economy Foundation Summary

**EconomyManager singleton with lives regeneration (1 per 30min to max 5), bonus currency system, and Firestore persistence using Firebase server timestamps**

## Performance

- **Duration:** 8 minutes
- **Started:** 2026-02-10T12:04:55Z
- **Completed:** 2026-02-10T12:12:55Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created EconomyManager singleton with complete lives and bonus API
- Implemented lives regeneration logic using Firebase Timestamps for server-side accuracy
- Extended FirestoreService with economy persistence methods (saveEconomy/loadEconomy)
- Integrated economy manager into app startup with default initialization for new users
- Established foundation for lives gating, countdown timers, and bonus spending

## Task Commits

Each task was committed atomically:

1. **Task 1: Create EconomyManager and extend FirestoreService** - `b5727d8` (feat)
2. **Task 2: Wire EconomyManager into app startup** - `7a449ed` (feat)

## Files Created/Modified

### Created
- `src/game/EconomyManager.ts` - Singleton managing lives (max 5), bonuses (default 500), and regeneration (1 life per 30 minutes)

### Modified
- `src/firebase/firestore.ts` - Added EconomyState interface and saveEconomy/loadEconomy methods with nullish coalescing defaults
- `src/main.ts` - Added economy initialization after progress loading, stores EconomyManager in Phaser registry as 'economy'

## API Surface

**EconomyManager Public Methods:**
- `getLives(): number` - Returns current lives count (auto-recalculates regeneration)
- `getBonuses(): number` - Returns current bonus count
- `canStartLevel(): boolean` - Checks if user has at least 1 life
- `getSecondsUntilNextLife(): number` - Returns countdown timer value (0 if at max or not regenerating)
- `loseLife(): Promise<boolean>` - Consumes 1 life, starts regeneration timer if needed
- `spendBonusesForRefill(): Promise<boolean>` - Costs 15 bonuses to refill to max 5 lives
- `getState(): EconomyState` - Returns shallow copy of state

**Constants:**
- MAX_LIVES = 5
- REGEN_INTERVAL_MS = 1,800,000 (30 minutes)
- REFILL_COST = 15 bonuses
- DEFAULT_LIVES = 5
- DEFAULT_BONUSES = 500

## Technical Implementation Details

**Lives Regeneration Logic:**
1. When lives drop below MAX_LIVES, set `lives_regen_start` to `Timestamp.now()`
2. On each `getLives()` call (throttled to 1/sec), calculate elapsed time from regen_start
3. Award lives for each completed 30-minute interval
4. Advance regen_start by awarded intervals using `Timestamp.fromMillis()` to prevent drift
5. Stop regeneration (set regen_start = null) when reaching MAX_LIVES

**Backward Compatibility:**
- Existing users with progress but no economy fields: loadEconomy uses `?? defaults` (lives ?? 5, bonuses ?? 500)
- No migration needed - defaults handle missing fields transparently

**Performance Optimization:**
- Throttled recalculation: max once per second via `lastRecalcTime` check
- Fire-and-forget saves: regeneration saves don't block with `.catch()` error handling

## Decisions Made

1. **Firebase Timestamp over Date:** Using `Timestamp.fromMillis()` ensures server-side time consistency across devices, preventing exploits via local time manipulation
2. **Throttle recalculation to 1/sec:** Prevents performance impact from excessive getLives() calls in game loop
3. **Nullish coalescing for defaults:** Backward-compatible approach - existing users automatically get economy defaults without migration
4. **Fire-and-forget regeneration saves:** Non-blocking background saves improve UX, errors logged but don't interrupt gameplay

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - TypeScript compilation passed, all methods follow established patterns from ProgressManager.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 06 Plan 02 (Lives UI integration):**
- EconomyManager accessible via `game.registry.get('economy')` in all scenes
- Lives gating API ready: `canStartLevel()`, `loseLife()`
- Countdown timer API ready: `getSecondsUntilNextLife()`
- Bonus refill API ready: `spendBonusesForRefill()`

**Blockers:** None

**Dependencies satisfied:**
- Firebase Timestamp available from existing firebase/firestore imports
- ProgressManager pattern established and verified

## Self-Check: PASSED

All claims verified:
- File exists: src/game/EconomyManager.ts
- Commit exists: b5727d8 (Task 1)
- Commit exists: 7a449ed (Task 2)

---
*Phase: 06-economy-system*
*Completed: 2026-02-10*
