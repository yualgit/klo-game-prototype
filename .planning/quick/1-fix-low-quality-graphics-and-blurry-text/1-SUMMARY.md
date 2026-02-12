---
phase: quick-fix
plan: 01
subsystem: ui
tags: [phaser, dpr, high-dpi, responsive, text-rendering]

# Dependency graph
requires:
  - phase: 25-new-levels
    provides: Current game with Scale.RESIZE + DPR-aware layout system
provides:
  - Fixed DPR cap mismatch between main.ts and responsive.ts (both now cap at 3)
  - Automatic text resolution injection for crisp rendering on high-DPI devices
  - Correct UI element sizing on DPR 3 devices (iPhone 12/13/14/15 Pro models)
affects: [all phases using responsive.ts utilities, all text rendering]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Text factory override pattern for global Phaser object configuration"
    - "Consistent DPR capping across game initialization and layout utilities"

key-files:
  created: []
  modified:
    - src/utils/responsive.ts
    - src/main.ts

key-decisions:
  - "Text resolution always set to DPR (no per-call-site override) - no existing call sites set resolution and we want consistent crisp rendering everywhere"
  - "Factory override placed immediately after Game creation to ensure it applies before any scenes create text objects"

patterns-established:
  - "Factory override pattern: Store original, replace prototype method, enhance parameters, delegate to original"

# Metrics
duration: 1.8min
completed: 2026-02-12
---

# Quick Fix 1: Fix Low-Quality Graphics and Blurry Text Summary

**DPR cap synchronized between main.ts and responsive.ts (both now cap at 3), plus automatic text resolution injection for crisp rendering on high-DPI devices**

## Performance

- **Duration:** 1.8 min (108s)
- **Started:** 2026-02-12T[timestamp]
- **Completed:** 2026-02-12T[timestamp]
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Fixed DPR cap mismatch causing UI elements to render at 2/3 intended size on DPR 3 devices
- Eliminated blurry text on high-DPI displays via automatic resolution injection
- All cssToGame() calculations now work correctly on DPR 3 devices (iPhone 12/13/14/15 Pro)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix DPR cap mismatch in responsive.ts** - `69cf873` (fix)
2. **Task 2: Add automatic text resolution for crisp rendering** - `05d7460` (feat)

## Files Created/Modified
- `src/utils/responsive.ts` - Fixed getDpr() to cap at 3 instead of 2, matching main.ts DPR calculation
- `src/main.ts` - Added text factory override to auto-inject resolution: dpr into all Text objects

## Decisions Made

**Text resolution strategy:**
- Decided to set `resolution: dpr` AFTER spreading style object so DPR always applies
- No existing call sites set resolution explicitly, and we want consistent crisp rendering everywhere
- Factory override pattern avoids modifying 40+ text creation call sites across the codebase

**Factory override placement:**
- Placed immediately after `const game = new Phaser.Game(config);` to ensure it's active before Boot scene creates text objects
- Scenes don't start until after constructor returns, so placement is safe

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - straightforward fix with clear root cause.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

All UI elements and text now render correctly on high-DPI devices. No blockers or concerns.

## Self-Check: PASSED

**Files verified:**
- FOUND: src/utils/responsive.ts (getDpr() caps at 3)
- FOUND: src/main.ts (text factory override present)

**Commits verified:**
- FOUND: 69cf873 (Task 1 - DPR cap fix)
- FOUND: 05d7460 (Task 2 - Text resolution)

**Verification commands passed:**
- TypeScript compilation: PASSED (npx tsc --noEmit)
- Production build: PASSED (npx vite build)
- DPR cap grep check: PASSED (both files show cap of 3)
- Text resolution grep check: PASSED (factory override present)

---
*Quick Fix: 01*
*Completed: 2026-02-12*
