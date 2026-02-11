---
phase: 18-welcome-screen-refinement
plan: 01
subsystem: scenes
tags: [ui, navigation, responsive, mobile]
dependency_graph:
  requires: []
  provides:
    - one-way navigation flow (Menu -> LevelSelect)
    - responsive title sizing for narrow viewports
  affects:
    - src/scenes/Menu.ts
    - src/scenes/LevelSelect.ts
tech_stack:
  added: []
  patterns:
    - responsive font sizing with viewport-width calculation
    - word wrap as overflow safety net
key_files:
  created: []
  modified:
    - src/scenes/LevelSelect.ts
    - src/scenes/Menu.ts
decisions:
  - "Removed back-to-menu button from LevelSelect to enforce one-way flow after PLAY"
  - "Title font size capped at 18% of viewport width (scales down on narrow screens)"
  - "Word wrap set to 85% of viewport width as safety net for overflow prevention"
metrics:
  duration_seconds: 88
  tasks_completed: 2
  files_modified: 2
  commits: 2
  completed_date: 2026-02-11
---

# Phase 18 Plan 01: Welcome Screen Refinement Summary

**One-liner:** Enforced one-way navigation from Menu to LevelSelect and made title responsive on narrow mobile screens.

## What Was Built

This plan refined the welcome screen flow by:

1. **Removed back-to-menu button from LevelSelect**: Deleted the back button UI element and all associated code, ensuring users cannot navigate back to the Menu/welcome screen after pressing PLAY. Navigation within the app is now handled exclusively by UIScene bottom tabs (Levels, Collections).

2. **Made Menu title responsive**: Implemented dynamic font sizing for the "KLO Match-3" title that scales down on narrow viewports (320px+) to prevent horizontal clipping. The title now uses `Math.min(cssToGame(48), width * 0.18)` with word wrap at 85% viewport width as a safety net.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | f89ef94 | Removed back button from LevelSelect scene |
| 2 | cbb177f | Made Menu title responsive on mobile |

## Deviations from Plan

None - plan executed exactly as written.

## Technical Details

### Task 1: Remove Back Button
- Removed `backButton` property declaration
- Removed `createBackButton()` method and its call in `create()`
- Removed back button repositioning logic from `handleResize()`
- All references to "Меню" (Menu) button removed from LevelSelect

### Task 2: Responsive Title
- Added `getDpr` import to Menu.ts
- Dynamic font size calculation: `Math.min(cssToGame(48), width * 0.18)`
  - On 320px CSS-width phone (640px Phaser at 2x DPR): ~115px Phaser (~57px CSS)
  - On desktop/tablet: full 48px CSS size
- Word wrap at 85% viewport width prevents any overflow
- Updated `handleResize()` to recalculate font size and word wrap on viewport change

## Verification

All verification criteria passed:

- ✓ `npx tsc --noEmit` passes with no errors
- ✓ No "backButton", "createBackButton", or "Меню" references in LevelSelect.ts
- ✓ Menu title uses dynamic font sizing based on viewport width
- ✓ Menu handleResize updates font size on viewport change

## Self-Check

All claimed artifacts verified:

```bash
# Modified files exist
✓ src/scenes/LevelSelect.ts
✓ src/scenes/Menu.ts

# Commits exist
✓ f89ef94: feat(18-01): remove back-to-menu button from LevelSelect
✓ cbb177f: feat(18-01): make Menu title responsive on mobile
```

## Self-Check: PASSED

All files and commits verified successfully.
