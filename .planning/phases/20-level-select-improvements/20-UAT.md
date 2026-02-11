---
status: complete
phase: 20-level-select-improvements
source: 20-01-SUMMARY.md, 20-02-SUMMARY.md
started: 2026-02-11T19:00:00Z
updated: 2026-02-11T19:03:00Z
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
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
