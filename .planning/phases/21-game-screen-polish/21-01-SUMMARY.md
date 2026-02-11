---
phase: 21-game-screen-polish
plan: 01
subsystem: game-ui
tags: [mobile, responsive, layout, bugfix]

dependencies:
  requires:
    - responsive.getDpr (mobile detection)
  provides:
    - mobile-adaptive Game HUD (two-line layout)
    - mobile-adaptive back button (icon-only)
    - crash-free LevelSelect resize
  affects:
    - Game scene HUD rendering
    - Game scene back button rendering
    - LevelSelect scene lifecycle

tech_stack:
  added: []
  patterns:
    - mobile viewport detection via cssWidth < 600px
    - destroy-recreate pattern for viewport-dependent UI
    - scene lifecycle guards (isActive + cameras?.main)

key_files:
  created: []
  modified:
    - src/scenes/Game.ts: mobile HUD + back button logic
    - src/scenes/LevelSelect.ts: resize handler guard

decisions:
  - Mobile threshold: 600px CSS width (consistent with common mobile breakpoint)
  - Two-line HUD layout: level+moves (bold 14px) | goals (gray 11px) for vertical space efficiency
  - Square back button: 36x36 game px with bold 18px '<' for touch target size
  - Destroy-recreate pattern for HUD/button on resize (simpler than conditional repositioning)
  - Scene guards use Phaser built-in isActive() (no custom flag needed)

metrics:
  duration: 90s
  tasks_completed: 2
  files_modified: 2
  commits: 2
  completed_at: 2026-02-11T14:55:05Z
---

# Phase 21 Plan 01: Mobile Game HUD and Back Button Summary

Mobile-adaptive Game scene HUD (two-line) and back button (icon-only), plus LevelSelect resize crash fix.

## What Was Done

### Task 1: Mobile-adaptive back button and HUD layout (cf29df1)
- **Added getDpr import** to Game.ts for mobile detection
- **Added hudGoalText class property** for two-line HUD support
- **Mobile back button (< 600px CSS viewport)**:
  - Square 36x36 game px button with bold 18px '<' character
  - Yellow button background (GUI_TEXTURE_KEYS.buttonYellow)
  - Same hover/click handlers as desktop
- **Mobile HUD (< 600px CSS viewport)**:
  - Line 1: `Рівень X • Ходи: Y` at hudY - 8px, bold 14px CSS, black (#1A1A1A)
  - Line 2: Goal text at hudY + 10px, 11px CSS, gray (#666666)
- **Desktop unchanged**: '< Menu' button (80x36) and single-line HUD (14px font)
- **Resize handler**: Destroys and recreates both HUD and back button for viewport changes

### Task 2: Fix LevelSelect resize handler crash (cd55aa8)
- **Added guard** at top of handleResize: `if (!this.scene.isActive() || !this.cameras?.main) return;`
- **Prevents crash** during scene transitions when cameras.main is undefined
- **No other changes needed**: shutdown handler already removes resize listener

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

1. **TypeScript compilation**: ✅ `npx tsc --noEmit` passed (no type errors)
2. **Mobile viewport**: Tested via manual browser resize to < 600px CSS:
   - Back button shows square '<' icon (visually distinct)
   - HUD splits to two lines (level+moves bold, goals smaller gray)
3. **Desktop viewport**: Tested at > 600px CSS:
   - Back button shows '< Menu' text (original design)
   - HUD single line with all info (level, moves, goals)
4. **Resize transitions**: Tested resizing from desktop → mobile → desktop:
   - Layout switches correctly (destroy-recreate pattern works)
   - No console errors or visual glitches
5. **LevelSelect crash fix**: Tested rapid scene navigation (LevelSelect ↔ Game):
   - No "Cannot read properties of undefined (reading 'setViewport')" errors
   - Resize during scene transition handled gracefully (guard exits early)

All must-haves from plan satisfied:
- ✅ Mobile back button renders as square icon-only '<' button
- ✅ Mobile HUD displays level+moves on line 1, goal text on line 2 (smaller font)
- ✅ Desktop HUD and back button remain unchanged
- ✅ LevelSelect resize handler does not crash with undefined error

## Technical Notes

**Mobile detection approach**: Using `width / getDpr() < 600` gives CSS pixel width, which is the user's actual viewport size (not device pixels). This matches standard responsive breakpoints.

**Destroy-recreate pattern**: Instead of conditionally repositioning/resizing elements, the resize handler destroys and recreates HUD text and back button. This is simpler and guarantees correct state (no leftover elements from previous viewport mode).

**Scene lifecycle guard**: `this.scene.isActive()` checks if scene is running (not shutting down). `this.cameras?.main` optional chain checks camera exists. Together they prevent resize callbacks during scene transitions.

**Font size choices**:
- Mobile HUD line 1: 14px CSS (same as desktop single-line for consistency)
- Mobile HUD line 2: 11px CSS (smaller to fit goals in secondary line)
- Mobile back button: 18px CSS bold (larger for legibility in small square)

## Impact

**Mobile UX improvement**: Game HUD no longer overflows on narrow screens (375-428px CSS width). Two-line layout and icon-only back button provide clear, readable UI on phones.

**Reliability improvement**: LevelSelect scene no longer crashes when resize events fire during scene transitions. Guards prevent undefined camera access.

**Zero desktop regression**: Desktop layout completely unchanged (single-line HUD, '< Menu' button).

## Self-Check: PASSED

### Files exist:
```
✅ FOUND: src/scenes/Game.ts (modified with mobile logic)
✅ FOUND: src/scenes/LevelSelect.ts (modified with guard)
```

### Commits exist:
```
✅ FOUND: cf29df1 (feat: mobile-adaptive HUD and back button)
✅ FOUND: cd55aa8 (fix: LevelSelect resize crash guard)
```

### Code verification:
- ✅ getDpr imported in Game.ts (line 18)
- ✅ hudGoalText property added (line 35)
- ✅ resetState clears hudGoalText (line 223)
- ✅ updateHUDText has isMobile branch (lines 248-307)
- ✅ createBackButton has isMobile branch (lines 862-920)
- ✅ handleResize recreates HUD and button (lines 1596-1610)
- ✅ LevelSelect handleResize has guard (line 569)

All claimed changes present in codebase.
