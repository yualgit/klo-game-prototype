---
status: diagnosed
phase: 20-level-select-improvements
source: 20-01-SUMMARY.md
started: 2026-02-11T18:00:00Z
updated: 2026-02-11T18:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. All level nodes visible on mobile
expected: On a mobile-sized viewport (375x667), all 10 level nodes are visible on the Level Select screen without needing to scroll. Nodes are evenly distributed vertically with L1 at bottom and L10 at top.
result: issue
reported: "Ні, задача виконана не правильно. Потрібно щоб рівні помстились по ширині еркану, але по висоті вони можуть бути як і були раніше"
severity: blocker

### 2. Level buttons clickable after navigation
expected: Navigate from Level Select to Collections tab (bottom nav), then back to Level Select. Level buttons should respond to taps immediately — no page reload needed.
result: pass

### 3. Level buttons clickable after completing a level
expected: Start and complete (or exit) a level, return to Level Select. Level buttons should respond to taps immediately without page reload.
result: pass

### 4. Road path renders between nodes
expected: A winding road/path connects all level nodes visually. The path follows the nodes correctly with no gaps or misalignment.
result: pass

### 5. Resize repositions nodes correctly
expected: Resize the browser window (or rotate device). Level nodes reposition to fill the new viewport height evenly. Road path updates to match.
result: pass

## Summary

total: 5
passed: 4
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "All level nodes fit within mobile screen width; vertical scrolling can remain as before"
  status: failed
  reason: "User reported: Ні, задача виконана не правильно. Потрібно щоб рівні помстились по ширині еркану, але по висоті вони можуть бути як і були раніше"
  severity: blocker
  test: 1
  root_cause: "Phase 20 misinterpreted requirement — changed vertical positioning (y-axis) instead of horizontal fit (x-axis). Removed original MAP_HEIGHT:2200 and static y-positions, replaced with dynamic vertical distribution eliminating scrolling. Original x-range 260-650 needs clamping for narrow screens."
  artifacts:
    - path: "src/game/constants.ts"
      issue: "MAP_HEIGHT and y-positions removed from LEVEL_NODES — needs restoration"
    - path: "src/scenes/LevelSelect.ts"
      issue: "calculateNodePositions() dynamically distributes y — should be removed; camera bounds changed to viewport-only — should restore scrollable"
  missing:
    - "Restore MAP_HEIGHT: 2200 and original static y-positions in constants.ts"
    - "Remove calculateNodePositions(), restore original vertical scrolling camera bounds"
    - "Add horizontal clamping: scale nodeOffsetX so x-positions fit within viewport width on narrow screens"
  debug_session: ".planning/debug/phase-20-width-not-height.md"
