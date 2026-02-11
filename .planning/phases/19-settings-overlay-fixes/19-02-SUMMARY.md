---
phase: 19-settings-overlay-fixes
plan: 02
subsystem: ui
tags: [settings, overlay, mobile, responsive, uat-fix]
dependency_graph:
  requires: [19-01]
  provides: [mobile-sized-settings-controls]
  affects: [UIScene]
tech_stack:
  added: []
  patterns: [2-row-layout, responsive-sizing]
key_files:
  created: []
  modified: [src/scenes/UIScene.ts]
decisions:
  - "Title font reduced to 18px (from 22px) for narrow mobile panels"
  - "Toggle switches reduced to 44x22px (from 60x30px) with 9px thumbs (from 12px)"
  - "Volume control split into 2 rows: label at Y=140, slider at Y=170 (30px separation)"
  - "Slider track spans panel interior width (panelW - 60px) for full utilization"
  - "Panel height increased to 360px (from 340px) to accommodate extra row"
  - "All row positions adjusted: SFX 85, Volume 140/170, Animation 225, Close 290"
metrics:
  duration: 118s
  completed: 2026-02-11
  tasks: 1
  files_modified: 1
---

# Phase 19 Plan 02: Mobile Settings Sizing Summary

Resized settings overlay controls to fit narrow mobile panels (270-320 CSS px), fixing UAT Test #3 failures.

## Objective

Fix settings overlay mobile sizing issues: title too large, toggles oversized, volume slider overlapping label on narrow mobile screens.

## Tasks Completed

### Task 1: Resize settings overlay controls for mobile fit

**Changes made:**

1. **Title**: Reduced font size from `cssToGame(22)` to `cssToGame(18)` - fits "Налаштування" on narrow panels
2. **Toggle switches** (both SFX and Animation):
   - Width: 60px → 44px
   - Height: 30px → 22px
   - Thumb radius: 12px → 9px
   - Thumb offset: 16px → 11px (in all 4 locations)
3. **Volume control - 2-row layout**:
   - Label row: Y = 140 (previously at 145)
   - Slider row: Y = 170 (NEW - 30px below label)
   - Slider track: spans panel interior width (panelW - 60px) instead of fixed 140px
   - Thumb radius: 10px → 8px
   - Thumb stroke: 2px → 1.5px
4. **Panel height**: 340px → 360px (accommodates extra volume row)
5. **Row positions adjusted**:
   - SFX: 80 → 85 (breathing room from smaller title)
   - Volume label: 145 → 140
   - Volume slider: NEW at 170
   - Animation: 210 → 225 (pushed down for 2-row volume)
   - Close button: 280 → 290 (pushed down proportionally)

**Files modified:**
- `src/scenes/UIScene.ts` - `showSettingsOverlay()` method (lines 363-633)

**Verification:**
- TypeScript compilation: ✓ Passed
- Production build: ✓ Succeeded
- Grep checks: ✓ All new values confirmed
  - Title font: `cssToGame(18)` at line 409
  - Toggle width: `cssToGame(44)` at line 441
  - Toggle height: `cssToGame(22)` at line 442
  - Volume slider Y: `volumeSliderY` at line 484
  - Panel height: `cssToGame(360)` at line 394

**Commit:** `d5bbee1` - feat(19-02): resize settings overlay controls for mobile fit

## Deviations from Plan

None - plan executed exactly as written.

## Success Criteria

- [x] Title uses cssToGame(18) font size (down from 22)
- [x] Toggle dimensions are 44x22 CSS px (down from 60x30) with 9px thumb radius (down from 12)
- [x] Volume label and slider are on separate rows (volumeSliderY ~30px below volumeRowY)
- [x] Slider track spans panel interior width with 8px thumb radius
- [x] Panel height increased to 360 to accommodate extra row
- [x] All row Y positions adjusted for new layout
- [x] TypeScript compiles, Vite builds

## Key Decisions

1. **2-row volume layout**: Separating label and slider eliminates horizontal competition on narrow panels, improving usability
2. **Full-width slider track**: Using `panelW - 60px` instead of fixed width makes slider responsive to panel size
3. **Proportional sizing**: All control sizes reduced proportionally (toggles ~27% smaller, thumb ~25% smaller) maintains visual consistency

## Next Steps

Ready for UAT re-test on mobile device to verify:
- Title fits without overflow
- Toggles are appropriately sized (not too large for narrow panels)
- Volume slider doesn't overlap label (2-row layout eliminates conflict)
- All controls fit within panel with adequate spacing

## Self-Check: PASSED

Verified:
- FOUND: src/scenes/UIScene.ts
- FOUND: d5bbee1 (task commit)
