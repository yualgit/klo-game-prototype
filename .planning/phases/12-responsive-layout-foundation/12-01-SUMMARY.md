---
phase: 12-responsive-layout-foundation
plan: 01
subsystem: core-rendering
tags: [scale-mode, viewport, mobile-first, ios-notch]

dependency_graph:
  requires:
    - phase: 11
      reason: "Asset upgrade provides 1024px art matching design resolution"
  provides:
    - "Fixed 1024x1820 design coordinate space across all devices"
    - "iOS safe-area support for notch/home indicator"
    - "Scale.FIT letterboxing for consistent layout"
  affects:
    - scene: Menu
      impact: "Fixed coordinates (512, 607) for title, no resize needed"
    - scene: LevelSelect
      impact: "Parallax recalculated for 1820 viewport height"
    - scene: Game
      impact: "Grid centering at 1024x1820 provides optimal spacing"

tech_stack:
  added:
    - technology: "Phaser Scale.FIT"
      reason: "Fixed internal resolution with browser-level scaling"
    - technology: "CSS safe-area-inset"
      reason: "iOS notch/home indicator avoidance"
  patterns:
    - "Design resolution normalization (1024x1820 matches MAP_WIDTH)"
    - "No DPR multiplication in canvas config (browser handles retina)"
    - "Dark letterbox bars (#1A1A1A) for professional mobile feel"

key_files:
  created: []
  modified:
    - path: "src/utils/constants.ts"
      lines_changed: 4
      summary: "Added DESIGN_WIDTH=1024, DESIGN_HEIGHT=1820 exports"
    - path: "src/main.ts"
      lines_changed: 12
      summary: "Scale.FIT config with fixed design resolution, removed DPR zoom"
    - path: "index.html"
      lines_changed: 6
      summary: "viewport-fit=cover and safe-area CSS insets"
    - path: "src/scenes/LevelSelect.ts"
      lines_changed: 8
      summary: "Parallax calculations adapted for 1820 viewport height"

decisions:
  - decision: "Use 1024x1820 as design resolution (not 1024x768)"
    rationale: "1024 matches MAP_WIDTH and level select world. 1820 is ~16:9 portrait, matches iPhone SE aspect ratio (0.562), minimal letterboxing on mobile"
    alternatives:
      - option: "1024x768 landscape"
        rejected: "Wrong orientation for mobile-first game"
      - option: "750x1334 (iPhone 6/7/8)"
        rejected: "Requires scaling MAP_WIDTH and all world coordinates"
    impact: "All existing world coordinates (MAP_WIDTH=1024, level nodes x:260-650) work without changes"

  - decision: "Remove DPR multiplication from canvas config"
    rationale: "DPR zoom trick (width*dpr + zoom:1/dpr) changes internal coordinate space to 2048x3640 at dpr=2, creating mismatch with world coordinates. Without DPR, cameras.main.width=1024 matches all assets and positions. Browser CSS-scales canvas for retina quality."
    alternatives:
      - option: "Keep DPR zoom pattern from Phase 11"
        rejected: "Coordinate space mismatch breaks fixed layout assumptions"
    impact: "Canvas renders at 1024x1820 internally, browser upscales. Adequate quality for demo. Retina optimization deferred to future phase if needed."

  - decision: "Dark letterbox bars (#1A1A1A) instead of white"
    rationale: "Professional mobile game aesthetic. White bars were jarring against KLO branding. Dark bars blend with device bezels."
    impact: "Better visual polish on devices with significant letterboxing (wide tablets, desktop)"

metrics:
  duration_seconds: 120
  duration_human: "2 minutes"
  completed_at: "2026-02-10T19:04:29Z"
  tasks_completed: 2
  files_modified: 4
  commits: 2
  deviations: 0
---

# Phase 12 Plan 01: Scale.FIT Migration Summary

**One-liner:** Migrated from Scale.RESIZE to Scale.FIT with fixed 1024x1820 portrait design resolution and iOS safe-area support

## What Was Built

### 1. Fixed Design Resolution (1024x1820)
- Added `DESIGN_WIDTH=1024` and `DESIGN_HEIGHT=1820` constants to `src/utils/constants.ts`
- Updated Phaser config in `src/main.ts` to use `Scale.FIT` mode with fixed design resolution
- Removed DPR multiplication (`window.innerWidth * dpr`) and zoom trick (`zoom: 1/dpr`)
- Changed letterbox background from white (`#F9F9F9`) to dark (`#1A1A1A`)

**Result:** All devices now render at a fixed internal coordinate space of 1024x1820. Phaser scales the canvas to fit the viewport with letterboxing where needed. Camera width and height are always 1024x1820, eliminating device-specific coordinate systems.

### 2. iOS Safe-Area Support
- Added `viewport-fit=cover` to HTML `<meta name="viewport">` tag
- Applied CSS safe-area insets to `body` padding (top/bottom/left/right)
- Applied safe-area calc adjustments to `#game-container` width/height

**Result:** On iOS devices with notches or home indicators, the game canvas is positioned within the safe area, preventing content from being hidden behind hardware cutouts.

### 3. Scene Layout Adaptation
- **LevelSelect.ts:** Updated parallax background calculations for 1820-height viewport
  - `maxScroll` now uses `this.cameras.main.height` (1820) instead of hardcoded 768
  - Sky layer positioned at viewport center (512, 910) with scale adjusted for 1024x1820
  - Far layer effective range: `380 * 0.25 + 1820 = 1915`
  - Mid layer effective range: `380 * 0.6 + 1820 = 2048`
- **Menu.ts:** No changes needed (uses relative positioning `width/2`, `height/3`)
- **Game.ts:** No changes needed (grid centers perfectly in 1024x1820 layout)

**Result:** All three scenes render correctly at the fixed 1024x1820 coordinate space with proper centering and spacing.

## Deviations from Plan

None - plan executed exactly as written.

## Technical Notes

### Why 1024x1820?
- **Width 1024:** Matches `MAP_CONFIG.MAP_WIDTH` from LevelSelect world. Level nodes positioned at x:260-650 are all within 0-1024 range.
- **Height 1820:** Aspect ratio ~0.563 (16:9 portrait), nearly identical to iPhone SE (375/667 = 0.562). Minimal letterboxing on standard mobile phones.
- **Grid centering:** Game grid (512px wide) centers perfectly in 1024px width with 256px margins each side. With 1820px height, grid centers at y=684 with adequate HUD space above.

### Why No DPR Multiplication?
The previous DPR zoom pattern (`width: window.innerWidth * dpr`, `zoom: 1/dpr`) was designed for Scale.RESIZE to achieve retina rendering. With Scale.FIT and fixed design resolution:
- **Problem:** Multiplying by DPR (e.g., dpr=2) would set internal resolution to 2048x3640, creating coordinate mismatch with existing world coordinates (MAP_WIDTH=1024, level node positions, etc.)
- **Solution:** Use raw design constants (1024x1820) so `cameras.main.width` = 1024 matches all world coordinates
- **Quality:** Canvas renders at 1024x1820 internally; browser CSS-scales the canvas element to fit viewport, providing adequate quality on retina displays for demo purposes
- **Future:** If higher fidelity is needed, a different approach (texture atlases at 2x scale, shader-based upscaling) can be explored in a future phase

### Safe-Area Implementation
CSS `env(safe-area-inset-*)` values are provided by the browser on iOS 11+ when `viewport-fit=cover` is set. The values are 0px on devices without notches. The `calc()` expressions in `#game-container` dimensions ensure the canvas never extends into unsafe areas.

## Verification

**TypeScript compilation:** `npx tsc --noEmit` passed with no errors
**Production build:** `npx vite build` succeeded
**Scene rendering:** All three scenes (Menu, LevelSelect, Game) display correctly at 1024x1820

Expected behavior in Chrome DevTools mobile emulation:
- iPhone SE (375x667): Minimal letterboxing, near-perfect aspect ratio match
- Android (360x740): Slight letterboxing top/bottom, game fully visible
- Desktop (1920x1080): Dark letterbox bars on sides, game centered

## Files Modified

1. **src/utils/constants.ts** (Task 1)
   - Added `DESIGN_WIDTH = 1024`
   - Added `DESIGN_HEIGHT = 1820`

2. **src/main.ts** (Task 1)
   - Imported `DESIGN_WIDTH, DESIGN_HEIGHT`
   - Changed `width: window.innerWidth * dpr` → `width: DESIGN_WIDTH`
   - Changed `height: window.innerHeight * dpr` → `height: DESIGN_HEIGHT`
   - Changed `mode: Phaser.Scale.RESIZE` → `mode: Phaser.Scale.FIT`
   - Changed `backgroundColor: '#F9F9F9'` → `backgroundColor: '#1A1A1A'`
   - Removed `zoom: 1 / dpr` property

3. **index.html** (Task 1)
   - Added `viewport-fit=cover` to viewport meta tag
   - Added safe-area padding to `body` CSS
   - Added safe-area calc adjustments to `#game-container` CSS

4. **src/scenes/LevelSelect.ts** (Task 2)
   - Updated `maxScroll` calculation from `MAP_CONFIG.MAP_HEIGHT - 768` to `MAP_CONFIG.MAP_HEIGHT - this.cameras.main.height`
   - Updated sky layer position from `(512, 384)` to `(this.cameras.main.width / 2, this.cameras.main.height / 2)`
   - Updated sky scale calculation to use `this.cameras.main.height` instead of hardcoded `768`
   - Updated far layer effective range calculation to use `this.cameras.main.height`
   - Updated mid layer effective range calculation to use `this.cameras.main.height`

## Commits

| Commit | Message | Files |
|--------|---------|-------|
| `fa3b540` | feat(12-01): migrate to Scale.FIT with fixed 1024x1820 design resolution | index.html, src/main.ts, src/utils/constants.ts |
| `aba5485` | feat(12-01): adapt LevelSelect parallax for 1024x1820 viewport | src/scenes/LevelSelect.ts |

## Impact on Next Plans

**Phase 12 Plan 02 (HUD scaling):** Can now assume fixed 1024x1820 coordinate space. HUD elements can be positioned using absolute coordinates (e.g., lives display at x=924, title at x=512) without resize handlers.

**Phase 13 (Settings overlay):** Fixed coordinates simplify overlay positioning. Modal panels can be centered at (512, 910) regardless of device.

**Phase 15 (Collection rewards):** Reward animations can use fixed world coordinates for predictable visual effects.

## Self-Check: PASSED

All expected files created/modified:
- ✓ src/utils/constants.ts (modified, contains DESIGN_WIDTH/DESIGN_HEIGHT)
- ✓ src/main.ts (modified, contains Scale.FIT config)
- ✓ index.html (modified, contains viewport-fit=cover and safe-area CSS)
- ✓ src/scenes/LevelSelect.ts (modified, parallax adapted for 1820 height)

All commits exist:
- ✓ fa3b540 (Task 1: Scale.FIT migration)
- ✓ aba5485 (Task 2: Scene layout adaptation)

TypeScript compilation: PASSED
Vite build: PASSED
No errors or warnings related to scale/layout changes
