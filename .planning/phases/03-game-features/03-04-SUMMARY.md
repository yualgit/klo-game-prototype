---
phase: 03
plan: 04
subsystem: game-logic
tags: [level-manager, goal-tracking, win-lose-conditions, tdd, typescript]

requires:
  - phases: ["02-grid-mechanics"]
    reason: "Core game types (TileData, TileType) used for goal tracking"
  - files: ["src/game/types.ts"]
    types: ["LevelGoal", "LevelEvent", "LevelData", "BoosterType", "ObstacleType", "ObstacleData"]
    note: "Parallel plan 03-01 provides level types"

provides:
  - component: "LevelManager"
    exports: ["LevelManager"]
    capabilities:
      - "Goal tracking (collect, destroy_obstacle, create_booster)"
      - "Move counter with decrement"
      - "Win/lose condition evaluation"
      - "Event emission via observer pattern"

affects:
  - phases: ["03-game-features"]
    plans: ["03-02", "03-03", "03-05"]
    reason: "LevelManager will be integrated into Game.ts to manage level state"

tech-stack:
  added: []
  patterns:
    - "Observer pattern for event subscription"
    - "TDD red-green-refactor cycle"
    - "Pure state management (no side effects)"

key-files:
  created:
    - path: "src/game/LevelManager.ts"
      loc: 161
      exports: ["LevelManager"]
      purpose: "Manages level state, goals, moves, and win/lose conditions"
    - path: "src/game/LevelManager.test.ts"
      loc: 407
      coverage: "14 tests covering all goal types and win/lose conditions"
      purpose: "Validates LevelManager functionality"

  modified: []

decisions:
  - id: "level-manager-constructor"
    question: "What should LevelManager constructor accept?"
    choice: "Simplified { moves, goals } object instead of full LevelData"
    rationale: "Decouples LevelManager from level JSON structure, easier to test and use"
    alternatives:
      - option: "Accept full LevelData"
        rejected: "Too much coupling, LevelManager doesn't need grid/spawn_rules/obstacles"

  - id: "goal-completion-immediate"
    question: "When should level_won be emitted?"
    choice: "Immediately when all goals complete (not waiting for moves to exhaust)"
    rationale: "Better UX - player sees win screen immediately, matches mobile game standards"
    alternatives:
      - option: "Wait for moves to exhaust"
        rejected: "Poor UX, players confused why they can't see win screen"

  - id: "obstacle-destroy-criteria"
    question: "What counts as a destroyed obstacle?"
    choice: "Only obstacles with layers === 0"
    rationale: "Partial damage shouldn't count toward goal - only fully destroyed obstacles"
    alternatives:
      - option: "Count any damage"
        rejected: "Makes goals too easy, reduces challenge"

metrics:
  duration: "2 minutes"
  completed: "2026-02-06"
  commits: 2
  tests_added: 14
  tests_passing: 14
  loc_added: 568
---

# Phase 3 Plan 04: Level Manager Summary

**One-liner:** Observer-based LevelManager with goal tracking (collect/destroy/create), move counter, and immediate win/lose evaluation

## What Was Built

LevelManager class that decouples level state management from game engine and rendering using an observer pattern. Implements three goal types (collect tiles, destroy obstacles, create boosters), move counting with decrement, and win/lose condition evaluation.

**Key capabilities:**
- Track progress toward collect goals (caps at goal count)
- Track fully destroyed obstacles (layers === 0 only)
- Track booster creation
- Move counter with event emission
- Win condition: all goals complete (immediate)
- Lose condition: moves exhausted with incomplete goals
- Observer pattern for event subscription

## Implementation Details

### Goal Tracking System

**Collect Goals:**
- Counts tiles matched by type
- Caps progress at goal count (no over-collection)
- Ignores tiles not in goals
- Supports multiple collect goals independently

**Destroy Obstacle Goals:**
- Only counts fully destroyed obstacles (layers === 0)
- Ignores partially damaged obstacles
- Tracks by obstacle type

**Create Booster Goals:**
- Tracks booster creation by type
- Caps at goal count

### Win/Lose Logic

**Win Condition:**
- Triggers immediately when all goals complete
- Does NOT wait for moves to exhaust
- Sets levelComplete flag to prevent double-emit

**Lose Condition:**
- Triggers when moves reach 0 with incomplete goals
- Checked in decrementMoves() after move counter updated
- Edge case handled: completing goals on last move is a win (not a loss)

**Critical ordering:** checkWin() is called in onTilesMatched/onObstaclesDestroyed/onBoosterCreated BEFORE decrementMoves(), ensuring goals completed on last move trigger win (not lose).

### Event System

Observer pattern implementation:
- `subscribe(listener)` - Register event listener
- `notify(event)` - Emit to all listeners
- Events: moves_changed, level_won, level_lost

## Testing

All 14 tests pass:

**Move Counter (3 tests):**
- Initialization
- Decrement
- Event emission

**Collect Goals (4 tests):**
- Basic tracking
- Capping at goal count
- Ignoring non-goal tiles
- Multiple goals independently

**Destroy Obstacle Goals (2 tests):**
- Fully destroyed (layers=0)
- Ignoring partial damage

**Create Booster Goals (1 test):**
- Booster creation tracking

**Win/Lose Conditions (4 tests):**
- Win on goal completion
- Win immediately (not waiting for moves)
- Lose on move exhaustion
- Edge case: win on last move

## Task Commits

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 (RED) | Add failing tests for LevelManager | e994b24 | LevelManager.test.ts |
| 1 (GREEN) | Implement LevelManager class | 6e99f42 | LevelManager.ts |

## Deviations from Plan

None - plan executed exactly as written using TDD red-green cycle.

## Next Phase Readiness

**Dependencies satisfied:**
- ✅ Plan 03-01 types available (LevelGoal, LevelEvent, LevelData, BoosterType, ObstacleType, ObstacleData)

**Blockers:** None

**Integration notes:**
- LevelManager ready for integration into Game.ts
- Game.ts will need to:
  - Instantiate LevelManager with level data
  - Subscribe to events (moves_changed, level_won, level_lost)
  - Call onTilesMatched after cascade completes
  - Call onObstaclesDestroyed when obstacles destroyed
  - Call onBoosterCreated when boosters spawned
  - Call decrementMoves after valid swap

**Follow-up work:**
- Plans 03-02, 03-03, 03-05 will integrate LevelManager into Game.ts
- UI layer will subscribe to events to update move counter and goal displays

## Self-Check: PASSED

All created files exist:
- ✅ src/game/LevelManager.ts
- ✅ src/game/LevelManager.test.ts

All commits exist:
- ✅ e994b24
- ✅ 6e99f42
