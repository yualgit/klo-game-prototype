---
status: diagnosed
trigger: "The Phase 20 implementation for Level Select incorrectly changed the vertical (y) positioning of level nodes to fit all nodes on screen without scrolling. The actual requirement is that level nodes should fit within the screen WIDTH (x-axis)"
created: 2026-02-11T00:00:00.000Z
updated: 2026-02-11T00:06:00.000Z
---

## Current Focus

hypothesis: CONFIRMED - Phase 20 changed vertical (y) positioning when requirement was for horizontal (x) fit
test: Complete - analyzed current and historical code
expecting: Document root cause and fix strategy
next_action: Write resolution with revert and correct implementation strategy

## Symptoms

expected: Level nodes should fit within screen WIDTH (x-axis) on mobile. Vertical layout and scrolling should remain unchanged.
actual: Implementation changed vertical (y) positioning to fit all nodes on screen without scrolling. Horizontal layout was not addressed.
errors: None - implementation works, but solves wrong axis
reproduction: Check current implementation in LevelSelect.ts - y-positions are dynamically calculated instead of static
started: Phase 20 implementation (commit 1a79438)

## Eliminated

## Evidence

- timestamp: 2026-02-11T00:01:00.000Z
  checked: src/game/constants.ts (current)
  found: MAP_HEIGHT removed, LEVEL_NODES changed from {x, y, label}[] to {x, label}[] (y removed)
  implication: Phase 20 removed all static y-positions

- timestamp: 2026-02-11T00:02:00.000Z
  checked: src/scenes/LevelSelect.ts (current)
  found: calculateNodePositions() method dynamically calculates y-positions based on viewport height, distributes nodes evenly from bottom to top
  implication: Vertical positioning now dynamic, eliminates scrolling

- timestamp: 2026-02-11T00:03:00.000Z
  checked: git history (commit 1a79438~1)
  found: Original MAP_HEIGHT = 2200, original y-positions ranged from 2050 (L1) to 250 (L10), nodes spaced ~200px apart vertically
  implication: Original design had tall scrollable world with fixed vertical positions

- timestamp: 2026-02-11T00:04:00.000Z
  checked: git history camera bounds
  found: Original used worldHeight = max(MAP_HEIGHT, firstLevelY + height*0.3) for scrollable vertical layout
  implication: Original allowed vertical scrolling with padding at bottom

- timestamp: 2026-02-11T00:05:00.000Z
  checked: x-coordinate range in LEVEL_NODES
  found: Original x range 260-650 (390px range), nodes already centered via nodeOffsetX = width/2 - 455
  implication: Horizontal positioning was ALREADY handled via centering - no scaling needed for width constraint

- timestamp: 2026-02-11T00:06:00.000Z
  checked: Current camera bounds
  found: Current uses viewport dimensions (width, height) - no scrolling possible
  implication: Phase 20 removed vertical scrolling capability entirely

## Resolution

root_cause: |
  Phase 20 misinterpreted the requirement "All level nodes fit on mobile screen without scrolling (reduced spacing)".

  The requirement meant: nodes should fit within mobile screen WIDTH (x-axis) - i.e., no horizontal scrolling needed.

  Phase 20 implemented: nodes fit within mobile screen HEIGHT (y-axis) - i.e., no vertical scrolling.

  EVIDENCE:
  - Removed MAP_HEIGHT (2200) and all static y-positions from constants.ts
  - Added calculateNodePositions() that distributes nodes vertically based on viewport height
  - Changed camera bounds from (width, 2200+) to (width, height) - eliminating vertical scrolling

  ANALYSIS:
  The original x-coordinates (260-650, range of 390px) were already being centered on screen via nodeOffsetX calculation.
  On narrow mobile screens (e.g., 375px width), nodes at x=650 would be positioned beyond the right edge, requiring horizontal scrolling or causing clipping.

  The requirement was likely asking to SCALE or REPOSITION x-coordinates to fit within mobile viewport width, NOT to change vertical layout.

fix: |
  REVERT vertical positioning changes:
  1. Restore MAP_HEIGHT: 2200 to constants.ts
  2. Restore original y-positions to LEVEL_NODES in constants.ts
  3. Remove calculateNodePositions() method from LevelSelect.ts
  4. Restore original camera bounds calculation (worldHeight based on MAP_HEIGHT)
  5. Use MAP_CONFIG.LEVEL_NODES[i].y directly (not dynamic calculation)

  ADD horizontal scaling/fitting:
  1. Calculate actual viewport width available for nodes (accounting for padding/margins)
  2. Determine original x-range (260-650 = 390px wide)
  3. If viewport width < 390px + margins, scale x-coordinates proportionally to fit
  4. Alternative: Keep centering approach but ensure nodeOffsetX doesn't push nodes off-screen

  STRATEGY:
  - Option A (Scaling): Scale x-coordinates by min(1.0, availableWidth / originalXRange)
  - Option B (Clamping): Adjust nodeOffsetX to ensure min x >= leftMargin and max x <= width - rightMargin
  - Option C (Hybrid): Use scaled x-coordinates on very narrow screens (<400px), center on wider screens

  RECOMMENDED: Option B (Clamping) is simplest and preserves original layout on most screens.

  Implementation pseudocode:
  ```typescript
  const originalXRange = { min: 260, max: 650 };
  const horizontalPadding = cssToGame(20); // margins
  const availableWidth = width - (2 * horizontalPadding);
  const nodeWidth = cssToGame(38); // size of node button

  // Calculate offset to center nodes, but clamp to keep all nodes on-screen
  const nodeRangeWidth = originalXRange.max - originalXRange.min;
  let offsetX = width / 2 - (originalXRange.min + originalXRange.max) / 2;

  // Clamp: ensure leftmost node >= padding
  const leftmostX = originalXRange.min + offsetX;
  if (leftmostX < horizontalPadding) {
    offsetX = horizontalPadding - originalXRange.min;
  }

  // Clamp: ensure rightmost node <= width - padding
  const rightmostX = originalXRange.max + offsetX;
  if (rightmostX > width - horizontalPadding - nodeWidth) {
    offsetX = width - horizontalPadding - nodeWidth - originalXRange.max;
  }

  // Use offsetX to position nodes
  ```

verification: |
  After fix:
  1. Vertical scrolling restored - can scroll from L1 (bottom) to L10 (top)
  2. All nodes use original y-positions (2050, 1850, 1650, etc.)
  3. On wide screens (>700px), nodes centered horizontally as before
  4. On narrow screens (<400px), all nodes visible horizontally without scrolling
  5. Camera bounds show worldHeight > viewport height (scrollable)

files_changed:
  - src/game/constants.ts: Restore MAP_HEIGHT and y-positions to LEVEL_NODES
  - src/scenes/LevelSelect.ts: Remove calculateNodePositions(), restore original camera bounds, add horizontal clamping logic
