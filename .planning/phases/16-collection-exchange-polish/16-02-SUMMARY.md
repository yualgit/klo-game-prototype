---
phase: 16-collection-exchange-polish
plan: 02
subsystem: collections
tags: [exchange-animation, overlay-pattern, reactive-ui, vfx]
depends_on: ["16-01"]
provides:
  - Exchange button per collection (gold when 6/6, gray when incomplete)
  - Multi-stage exchange animation overlay (fold, compress, explode, coupon reveal)
  - Claim button for exchange execution
  - Repeatable collection exchange flow
affects:
  - src/scenes/Collections.ts
tech_stack:
  added: []
  patterns:
    - Overlay pattern with scrollFactor(0) for viewport-fixed elements
    - Multi-stage async animation with Promise-based sequencing
    - Particle explosion effect for reward reveal
key_files:
  created: []
  modified:
    - src/scenes/Collections.ts
decisions:
  - "Exchange button positioned below progress text, styled based on completion state"
  - "Animation uses viewport-fixed coordinates (setScrollFactor(0)) to avoid scroll interference"
  - "Input disabled during animation, re-enabled only for claim button to prevent double-exchange"
  - "Claim button is the only way to dismiss overlay (no tap-backdrop-to-close)"
  - "All overlay elements stored in overlayElements[] array for proper cleanup"
metrics:
  duration_seconds: 80
  tasks_completed: 1
  files_modified: 1
  commits: 1
  completed_date: "2026-02-11"
---

# Phase 16 Plan 02: Collection Exchange Animation Summary

**One-liner:** Multi-stage exchange animation with fold/compress/explode/reveal sequence, claim button, and repeatable collection flow

## What Was Built

Implemented exchange button and full animation overlay for Collections scene, enabling users to exchange complete collections for coupons with satisfying visual feedback:

1. **Exchange Button Per Collection:**
   - Positioned below progress text (6/6) in buildCollectionsUI()
   - Gold background (0xffb800) when collection is 6/6 complete
   - Gray background (0xaaaaaa) when collection is incomplete
   - Text: 'Обміняти на купон' (bold, 14px CSS)
   - Interactive with hover scale effect (1.0 -> 1.05) when active
   - Triggers startExchangeAnimation() on click

2. **Multi-Stage Exchange Animation:**
   - **Stage 1 - Setup (0ms):** Dark backdrop (0x000000 alpha 0.75), 6 cards in 3x2 grid, all elements viewport-fixed (setScrollFactor(0))
   - **Stage 2 - Fold (300ms mark, 400ms duration):** Cards tween to scaleX=0.2, scaleY=0.8, alternating angles -15/+15
   - **Stage 3 - Compress (700ms mark, 500ms duration):** Cards tween to center point, scale to 0
   - **Stage 4 - Explode (1200ms mark):** Camera flash (gold), camera shake, 50-particle explosion (gold/white/orange tints)
   - **Stage 5 - Coupon Reveal (1800ms mark, 500ms duration):** Collection name + "Купон" title, reward description, both fade/scale in with Back.Out easing
   - **Stage 6 - Claim Button (2400ms mark):** 'Забрати купон' button with hover effect, executes exchange on click

3. **Exchange Execution Flow:**
   - Claim button calls `collectionsManager.exchangeCollection(collectionId)`
   - Destroys all overlayElements (backdrop, cards, particles, texts, button)
   - Re-enables scene input
   - Rebuilds UI via buildCollectionsUI() to show updated collection state
   - Resets camera scroll to top (scrollY = 0)

4. **Input Management:**
   - Scene input disabled at animation start (prevents clicks during animation)
   - Input re-enabled only for claim button (prevents backdrop dismiss)
   - Input fully re-enabled after exchange completes

## Task Breakdown

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add exchange button per collection and exchange animation overlay | c36e564 | src/scenes/Collections.ts |

## Technical Implementation

**Exchange Button Logic:**
- Button state determined by `collectionsManager.isCollectionComplete(collectionId)`
- Button container with Graphics background + Text child
- Interactive only when collection is 6/6
- Positioned after progress text with proper spacing (50px CSS between elements)

**Animation Overlay Pattern:**
- All overlay elements stored in `overlayElements[]` array
- All elements use `setScrollFactor(0)` for viewport-fixed positioning
- All elements use `setDepth(500-502)` for proper layering
- Backdrop is interactive with Phaser.Geom.Rectangle to block clicks through
- Camera dimensions used for centering (not world coordinates)

**Particle Effect:**
- Uses 'particle_white' texture from VFXManager
- Explode mode with 50 particles
- Speed range: 100-300, scale: 0.8 -> 0
- Lifespan: 400-800ms, tints: gold/white/orange

**Promise-Based Sequencing:**
- Each stage uses `await new Promise<void>()` with `time.delayedCall()` or tween onComplete
- Stages run sequentially with precise timing control
- Allows for clean async/await flow in startExchangeAnimation method

**UI Rebuild After Exchange:**
- `buildCollectionsUI()` clears allElements and re-renders entire scene
- Collection state reflects exchange (cards deducted, duplicates preserved)
- Exchange button becomes gray/disabled if collection no longer 6/6
- Notification dot in UIScene hides if no collections are exchangeable (via event emission)

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

✅ `npx tsc --noEmit` passes with zero errors
✅ Exchange button renders below each collection with correct active/disabled state
✅ startExchangeAnimation() method exists and is called on button click
✅ 'Забрати купон' claim button text present in animation
✅ 'Обміняти на купон' exchange button text present in UI
✅ Animation sequence: fold -> compress -> explode -> coupon reveal -> claim button
✅ Input disabled during animation (prevents double-exchange)
✅ Claim button calls exchangeCollection() and rebuilds UI
✅ All overlay elements cleaned up on claim (overlayElements[] array pattern)
✅ Camera scroll resets to top after exchange

## Success Criteria Met

- ✅ Exchange button active (gold) only when collection is 6/6 complete
- ✅ Exchange animation plays all 6 stages in sequence (~2.5 seconds)
- ✅ Exchange deducts exactly 6 cards via CollectionsManager.exchangeCollection()
- ✅ After exchange, collection can be collected again (repeatable)
- ✅ No TypeScript errors
- ✅ No double-exchange possible (input disabled during animation)

## Next Steps

This completes the collection exchange UI flow:
- Exchange button provides clear affordance when collection is complete
- Animation provides satisfying feedback for exchange action
- Claim button executes exchange and updates UI reactively
- Notification dot (from Plan 01) hides after last collection is exchanged
- Collections are repeatable (users can re-collect after exchange)

Phase 16 may continue with additional polish plans or conclude here.

## Self-Check: PASSED

**Created files:** None (all modifications)

**Modified files exist:**
```
FOUND: src/scenes/Collections.ts
```

**Commits exist:**
```
FOUND: c36e564
```

All claimed artifacts verified successfully.
