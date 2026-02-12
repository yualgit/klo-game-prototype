---
phase: quick-2
plan: 01
subsystem: ui
tags: [phaser, parallax, level-select, dpr]

# Dependency graph
requires:
  - phase: quick-1
    provides: DPR rendering fixes that exposed parallax sizing issues
provides:
  - Rebalanced parallax background layers with correct positioning and sizing
affects: [level-select, ui-scaling]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Parallax layer positioning using effective range calculations
    - Image scale multipliers for post-DPR visual balance

key-files:
  created: []
  modified:
    - src/scenes/LevelSelect.ts

key-decisions:
  - "Mid-layer scale increased to 1.5x to compensate for DPR rendering changes"
  - "Far-layer scale increased to 1.4x to make silhouettes more prominent"
  - "Mid-layer positioning: kyiv_mid at bottom (0.75), kyiv_mid_0 at top (0.25)"
  - "Far-layer distribution: harmonious placement at 0.85, 0.50, 0.15 of scroll range"

patterns-established:
  - "Explicit position arrays for parallax images instead of uniform spacing"
  - "Scale multipliers applied to compensate for visual size changes from rendering updates"

# Metrics
duration: 1min
completed: 2026-02-12
---

# Quick Task 2: Fix Level Select Parallax Rebalance Summary

**Parallax background layers rebalanced with 1.4-1.5x larger images and repositioned mid/far parts for harmonious distribution across scrollable map**

## Performance

- **Duration:** <1 min (53 seconds)
- **Started:** 2026-02-12T07:33:05Z
- **Completed:** 2026-02-12T07:34:00Z
- **Tasks:** 2 (1 auto-executed, 1 pending user verification)
- **Files modified:** 1

## Accomplishments
- Rebalanced parallax mid-layer: kyiv_mid positioned at bottom (level 1 area), kyiv_mid_0 at top (level 20 area)
- Increased mid-layer image scale to 1.5x (with corrected denominator fix from 1536→1024)
- Increased far-layer image scale to 1.4x for more prominent silhouettes
- Distributed far-layer images harmoniously: bridge at bottom (0.85), monument at middle (0.50), Lavra at top (0.15)
- Reordered farParts array to match semantic positioning

## Task Commits

Each task was committed atomically:

1. **Task 1: Rebalance parallax layer positioning and sizing** - `ef069b5` (fix)
2. **Task 2: Visual verification** - Pending user verification (checkpoint:human-verify)

## Files Created/Modified
- `src/scenes/LevelSelect.ts` - Updated createParallaxBackground() method with rebalanced mid/far layer positioning and increased scale multipliers

## Decisions Made

**1. Mid-layer scale formula correction:**
- Fixed denominator from 1536 to 1024 for MAP_WIDTH comparison (images are 1024px wide)
- Applied 1.5x multiplier to compensate for DPR rendering making images appear smaller

**2. Explicit positioning arrays:**
- Replaced uniform spacing calculations with explicit position values
- Allows semantic control: "bottom", "middle", "top" positioning
- midPositions: [0.75, 0.25] places kyiv_mid at bottom, kyiv_mid_0 at top
- farPositions: [0.85, 0.50, 0.15] distributes skyline silhouettes harmoniously

**3. Far-layer reordering:**
- Reordered farParts array from ['kyiv_far_top', 'kyiv_far_mid', 'kyiv_far_bottom'] to ['kyiv_far_bottom', 'kyiv_far_mid', 'kyiv_far_top']
- Array order now matches positional semantics (bottom→middle→top)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - straightforward implementation following plan specification.

## User Verification Checkpoint

**Task 2 (checkpoint:human-verify) - Pending user approval:**

The parallax background has been rebalanced but requires visual verification:
- First midPart (kyiv_mid) should be visible at bottom of map (level 1 area)
- Second midPart (kyiv_mid_0) should be visible at top of map (level 20 area)
- Both mid-layer images should appear noticeably larger (~1.5x)
- Far-layer silhouettes should be harmoniously distributed with larger size (~1.4x)
- Smooth parallax scrolling with no visual gaps

**Verification steps:**
1. Run `npm run dev` and open level select screen
2. Scroll to bottom (level 1) - verify kyiv_mid watercolor landmarks visible
3. Scroll to top (level 20) - verify kyiv_mid_0 KLO gas station visible
4. Check increased image sizes throughout scroll range
5. Verify far-layer distribution: bridge at bottom, monument middle, Lavra top

User should type "approved" or describe needed adjustments.

## Next Steps

Awaiting user verification of visual quality. If approved, quick task complete. If adjustments needed, will iterate on positioning/sizing values.

## Self-Check: PASSED

All summary claims verified:
- File modified: src/scenes/LevelSelect.ts ✓
- Commit ef069b5 exists ✓
- Summary file created ✓

---
*Quick Task: 2*
*Completed: 2026-02-12*
