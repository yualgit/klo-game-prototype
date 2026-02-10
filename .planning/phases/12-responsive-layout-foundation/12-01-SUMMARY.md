---
phase: 12-responsive-layout-foundation
plan: 01
subsystem: core-ui
tags: [responsive, dpr-aware, layout, mobile-first]
dependency_graph:
  requires: []
  provides:
    - src/utils/responsive.ts (responsive layout utility)
    - Game scene responsive adaptation
  affects:
    - TileSprite (accepts dynamic tile size)
    - All Game scene UI elements (HUD, overlays, buttons)
tech_stack:
  added: []
  patterns:
    - DPR-aware sizing (CSS px × DPR = Phaser px)
    - Responsive layout utility pattern
    - Dynamic tile sizing
key_files:
  created:
    - src/utils/responsive.ts
  modified:
    - src/game/TileSprite.ts
    - src/scenes/Game.ts
decisions:
  - Tile size range: 36-60px CSS (72-120px Phaser on 2x DPR)
  - HUD font minimum: 14px CSS (28px Phaser on 2x DPR)
  - Overlay panel max width: 90% viewport, min 280px CSS
  - Button touch targets: 44px CSS height minimum
  - Grid positioning: HUD at top + 10px padding, grid below
metrics:
  duration: 385
  completed: 2026-02-10T19:34:25Z
  tasks: 1
  files: 3
---

# Phase 12 Plan 01: Responsive Layout Foundation Summary

DPR-aware responsive layout utility with adaptive Game scene - all UI elements scale correctly across device sizes

## What Was Built

Created responsive layout system that solves the DPR scaling problem. With `zoom: 1/dpr`, all Phaser coordinates are in device pixels, but UI must be sized in CSS pixels. The utility multiplies CSS sizes by DPR to get correct Phaser coordinates (e.g., 16px CSS font → 32px Phaser on 2x device).

### Core Implementation

**src/utils/responsive.ts:**
- `getDpr()`: Returns capped DPR (max 2x)
- `cssToGame(cssPx)`: Converts CSS pixels to Phaser coordinates
- `getResponsiveLayout(width, height)`: Calculates all responsive dimensions
  - Tile size: 36-60px CSS based on viewport width (fits 8 tiles + padding)
  - HUD height: 60px CSS, font: 14px CSS
  - Overlay panel width: min(380px CSS, 90% viewport)
  - Button dimensions: 180×44px CSS
  - Title/subtitle fonts: 28px/16px CSS

**TileSprite updates:**
- Added `tileSize` constructor parameter (defaults to TILE_SIZE constant)
- Store `this.tileSize` as instance property
- Use `this.tileSize` everywhere instead of constant: draw(), updatePosition(), drawBooster(), drawObstacle()
- Updated `setOffset(offsetX, offsetY, tileSize?)` to accept optional tile size
- Added `getTileSize()` getter method

**Game scene updates:**
- Import responsive utilities, compute `this.layout = getResponsiveLayout(width, height)` in create()
- Use `this.layout.tileSize` for all grid calculations (replaces TILE_SIZE constant throughout)
- Grid offsets: `gridOffsetY = hudHeight + 10px CSS` (HUD at top, grid below)
- HUD: height = `layout.hudHeight`, font = `layout.hudFontSize`, all padding scaled
- Back button: dimensions from layout, positioned relative to HUD
- Overlay panels: width = `layout.overlayPanelWidth` (90% max), all fonts/spacing responsive
- Buttons: use `layout.buttonWidth/Height/FontSize`
- All animations (swap, match, cascade, spawn) use `layout.tileSize` instead of constant
- Resize handler: recompute layout, update all element positions/sizes
- Pass `layout.tileSize` to TileSprite constructor and setOffset()

## Deviations from Plan

None - plan executed exactly as written.

## Key Technical Decisions

**Tile sizing strategy:** Min 36px CSS (touch-friendly), max 60px CSS (visual clarity), computed to fit 8 tiles + padding in viewport width. This ensures grid always fits on narrow screens while maximizing size on wider viewports.

**HUD layout change:** Positioned HUD at top with fixed height instead of floating. Grid positioned below with 10px CSS padding. This prevents overlap on any viewport size and provides clear visual hierarchy.

**Overlay panel sizing:** 90% viewport max width prevents edge overflow on narrow screens (iPhone SE 375px → 337.5px panel). Min 280px CSS via layout calculation ensures content remains readable.

**DPR multiplier pattern:** All spacing, fonts, and element sizes specified in CSS pixels, then multiplied by DPR via `cssToGame()`. This makes responsive values easy to reason about (human-scale CSS pixels) while ensuring correct rendering at device DPR.

## Testing Notes

TypeScript compiles with no errors (`npx tsc --noEmit` passes).
Vite builds successfully (`npx vite build` completes).

Game scene now adapts to any viewport size:
- iPhone SE (375px × 667px at 2x DPR): Grid tiles ~36px CSS, HUD text 14px CSS
- iPad (1024px wide): Grid tiles scale up (still capped at 60px CSS for visual consistency)
- Desktop (1920px wide): Grid tiles at 60px CSS max, panel width capped

No manual device testing performed in this phase (compiler verification only).

## Files Changed

**Created:**
- src/utils/responsive.ts (82 lines)

**Modified:**
- src/game/TileSprite.ts (+21 lines, adapted for dynamic tile size)
- src/scenes/Game.ts (+155 lines, -149 lines, full responsive adaptation)

## Commits

- d4271e4: feat(12-01): implement responsive layout with DPR-aware UI scaling

## Self-Check: PASSED

- FOUND: src/utils/responsive.ts
- FOUND: d4271e4 (commit hash)
- VERIFIED: All exports present (getResponsiveLayout, cssToGame, getDpr)
- VERIFIED: Game.ts imports responsive utilities

## Next Steps

Phase 12 Plan 02 will adapt Menu and LevelSelect scenes with same responsive approach.
