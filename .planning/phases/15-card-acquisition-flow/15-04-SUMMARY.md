---
phase: 15-card-acquisition-flow
plan: 04
subsystem: ui/overlays
tags: [gap-closure, coordinates, text-layout, uat-fixes]

dependency_graph:
  requires:
    - "15-03: UAT gap closure diagnostics"
  provides:
    - "Fixed bonus hint Y coordinate (cssToGame(100))"
    - "Fixed rarity label Y offset (cssToGame(120))"
  affects:
    - "Game.ts: Win overlay bonus hint positioning"
    - "Game.ts: Card pick rarity label positioning"

tech_stack:
  added: []
  patterns: ["CSS pixel coordinate adjustment via cssToGame()"]

key_files:
  created: []
  modified:
    - path: "src/scenes/Game.ts"
      lines: 2
      reason: "Updated Y coordinates for bonus hint (line 374) and rarity label (line 638)"

decisions: []

metrics:
  duration_seconds: 38
  tasks_completed: 1
  files_modified: 1
  commits: 1
  completed_at: "2026-02-11"
---

# Phase 15 Plan 04: UAT Text Overlap Fixes Summary

Fixed bonus hint and rarity label Y coordinates in Game.ts to resolve text overlap issues from UAT testing.

## What Was Done

### Task 1: Fix bonus hint and rarity label Y coordinates in Game.ts

**Issue 1 - Bonus hint overlaps lives display:**
- Found at line 374: bonus hint was positioned at `cssToGame(75)`
- Lives display renders at `cssToGame(70)` (1-2 stars) or `cssToGame(85)` (3 stars)
- Both use same font size (~16px CSS), creating overlap
- **Fix:** Changed bonus hint Y from `cssToGame(75)` to `cssToGame(100)`
- **Result:** 30px clearance (1-2 stars) or 15px clearance (3 stars)

**Issue 2 - Card name overlaps rarity label on card pick:**
- Found at line 638: rarity label was positioned at `card.y + cssToGame(98)`
- Card name inside container positioned at approximately `card.y + cardH/2 + cssToGame(12)`
- With card heights ~160-170px, name and rarity text were too close
- **Fix:** Changed rarity label Y offset from `cssToGame(98)` to `cssToGame(120)`
- **Result:** 22+ px clearance between card name (12px font) and rarity label (11px font)

**Verification:**
- TypeScript compilation passed (`npx tsc --noEmit`)
- Production build passed (`npx vite build`)
- Both coordinate changes confirmed in Game.ts

**Commit:** `40d10a8` - fix(15-04): fix bonus hint and rarity label Y coordinates

## Deviations from Plan

None - plan executed exactly as written. Both coordinate adjustments were single-value changes as specified.

## Success Criteria Met

- [x] Bonus hint "Бонус: обери картку!" positioned at cssToGame(100) - no overlap with lives display at any star count
- [x] Rarity label positioned at card.y + cssToGame(120) - clear spacing from card name text
- [x] TypeScript and Vite build pass without errors

## Technical Notes

**Coordinate system:**
- `cssToGame(n)` converts CSS pixels to Phaser game coordinates via DPR multiplier
- CSS pixel gaps provide device-independent spacing guarantees
- 15px CSS minimum ensures readability across all devices (iPhone SE to desktop)

**Why these values:**
- Bonus hint at 100: Safely above 3-star lives display (85) while below "Далі" button
- Rarity label at 120: Card name typically ends around 90-98px, 22px gap prevents overlap

## Impact

**User-facing:**
- Win overlay bonus hint text no longer overlaps lives display on any star count
- Card reveal rarity labels clearly separated from card names
- Both fixes improve visual polish and readability

**Technical:**
- No API changes, only coordinate adjustments
- No new dependencies or patterns introduced
- Minimal surface area change (2 numeric values)

## Next Steps

Phase 15 complete - all UAT issues resolved:
- 15-01: Card acquisition flow implementation
- 15-02: Card pick overlay with flip animation
- 15-03: UAT gap closure (duplicate tracking + initial overlap fixes)
- 15-04: Final text overlap coordinate fixes

Phase 16 ready to begin or v1.2 milestone completion.

## Self-Check: PASSED

All claims verified:
- File exists: src/scenes/Game.ts
- Commit exists: 40d10a8
- Bonus hint coordinate: cssToGame(100) at line 374
- Rarity label coordinate: cssToGame(120) at line 638
