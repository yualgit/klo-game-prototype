---
status: diagnosed
phase: 20-level-select-improvements
source: 20-01-SUMMARY.md, 20-02-SUMMARY.md
started: 2026-02-11T19:00:00Z
updated: 2026-02-11T19:05:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Horizontal clamping on mobile
expected: On a mobile-sized viewport (375px wide), all level nodes fit within the screen width — no horizontal clipping or overflow. Nodes should be visible without horizontal scrolling.
result: issue
reported: "Зараз дорога рівнів зміщена на мобілці вправу сторону, дорога рівнів повинна бути розміщена по центру екрану (по ширині)"
severity: major

### 2. Vertical scrolling preserved
expected: The Level Select screen has a tall scrollable map (Kyiv journey). You can drag/scroll vertically to see all 10 level nodes spread from bottom (L1) to top (L10). The map is NOT compressed to fit one screen vertically.
result: pass

### 3. Level buttons clickable after tab navigation
expected: Navigate to Collections tab (bottom nav), then back to Levels tab. Level buttons respond to taps immediately — no page reload needed.
result: pass

### 4. Level buttons clickable after returning from game
expected: Start and complete (or exit) a level, return to Level Select. Level buttons respond to taps immediately without page reload.
result: pass

## Summary

total: 4
passed: 3
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "All level nodes and road path centered horizontally on mobile screen width"
  status: failed
  reason: "User reported: Зараз дорога рівнів зміщена на мобілці вправу сторону, дорога рівнів повинна бути розміщена по центру екрану (по ширині)"
  severity: major
  test: 1
  root_cause: "calculateNodeOffsetX() centers the node RANGE (260-650, center=455) on viewport instead of centering the MAP_WIDTH (1024, center=512). This shifts nodes 57px right of where they should be. Fix: use width/2 - MAP_CONFIG.MAP_WIDTH/2 instead of width/2 - nodeRangeCenter."
  artifacts:
    - path: "src/scenes/LevelSelect.ts"
      issue: "Line 63: offsetX = width/2 - nodeRangeCenter centers node range, not world"
    - path: "src/game/constants.ts"
      issue: "MAP_WIDTH (512) needed as reference for correct centering"
  missing:
    - "Change offsetX formula to width/2 - MAP_CONFIG.MAP_WIDTH/2 to preserve original world-relative positioning"
  debug_session: ".planning/debug/level-road-shifted-right-mobile.md"
