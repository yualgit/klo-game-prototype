---
phase: 25-new-levels
plan: 02
subsystem: game-structure
tags: [levels, map, navigation, ui]
dependency_graph:
  requires: [25-01]
  provides: [20-level-map, 20-level-navigation]
  affects: [level-select, game-scene, card-overlay]
tech_stack:
  added: []
  patterns: [map-scaling, responsive-layout]
key_files:
  created: []
  modified:
    - src/game/constants.ts
    - src/scenes/Boot.ts
    - src/scenes/LevelSelect.ts
    - src/scenes/Game.ts
    - src/scenes/CardPickOverlay.ts
decisions:
  - decision: "Shift existing L1-L10 nodes down by 2000px instead of changing coordinates"
    rationale: "Preserves original path pattern, places new levels above existing ones on scrollable map"
    impact: "MAP_HEIGHT doubled to 4400, all node y-coordinates shifted"
metrics:
  duration_minutes: 2
  tasks_completed: 2
  files_modified: 5
  commits: 2
  completed_date: "2026-02-11"
---

# Phase 25 Plan 02: Wire 20-Level Support Summary

**One-liner:** Extended level select map, loading, and navigation to support 20 levels with Kyiv landmarks spanning doubled map height.

## What Was Built

### Task 1: MAP_CONFIG and Boot.ts Extension
- **MAP_HEIGHT**: Increased from 2200 to 4400 (doubled for 20 nodes)
- **LEVEL_NODES**: Extended from 10 to 20 entries
  - L1-L10: Shifted down to y:4050-2250 (bottom half)
  - L11-L20: New nodes at y:2050-250 (top half)
  - Added 10 new Kyiv landmarks: Мистецький Арсенал, Ботанічний сад, Видубичі, Родина-Мати, Олімпійський, Палац Україна, Університет, Софія Київська, Михайлівський, Арка Свободи
- **Boot.ts**: Added loading for level_011.json through level_020.json

### Task 2: Scene Updates for 20-Level Navigation
- **LevelSelect.ts**:
  - Extended `LEVEL_NAMES` with 10 new Ukrainian names (Кавовий ранок → Фінал KLO)
  - Updated `getCurrentLevel()` loop: `i <= 10` → `i <= 20`, return `20` for all unlocked
  - Updated `scrollToCurrentLevel()` range check: `<= 10` → `<= 20`
  - Updated map pointer conditional: `<= 10` → `<= 20`
  - Fixed `calculateNodeOffsetX()`: maxNodeX from 520 to 480 (matches actual node positions)
- **Game.ts**: Changed `MAX_LEVELS` from 10 to 20
- **CardPickOverlay.ts**: Changed `MAX_LEVELS` from 10 to 20

## Deviations from Plan

None. Plan executed exactly as written.

## Key Technical Decisions

**Decision:** Shift existing nodes down by 2000px rather than changing coordinate system
- **Context**: Needed to add 10 new levels while maintaining existing winding path pattern
- **Approach**: All existing L1-L10 nodes moved from y:2050-250 to y:4050-2250, new L11-L20 placed in vacated y:2050-250 range
- **Benefit**: Preserves original path aesthetics, map scrolls naturally from bottom (L1) to top (L20)

**Decision:** Fix maxNodeX from 520 to 480 in calculateNodeOffsetX
- **Context**: Comment referenced max x:520 but actual nodes use x:480
- **Impact**: Corrects horizontal clamp calculation for narrow viewports

## Verification

All verification criteria passed:
- ✅ `npx tsc --noEmit` passes with zero errors
- ✅ MAP_CONFIG.LEVEL_NODES has exactly 20 entries (verified: 20 labels)
- ✅ LEVEL_NAMES has entries for levels 1-20 (verified: 'Фінал KLO' exists)
- ✅ Boot.ts loads level_001 through level_020 (verified: 20 load statements)
- ✅ MAX_LEVELS = 20 in both Game.ts and CardPickOverlay.ts
- ✅ LevelSelect getCurrentLevel() iterates through 20 levels (`i <= 20`)
- ✅ Map pointer works for levels 1-20 (conditional updated)

## Impact Assessment

**Immediate Effects:**
- Level select map now displays all 20 level nodes
- Players can navigate to and select levels 11-20
- Game scene correctly identifies L20 as final level (shows "Меню" button)
- Card pick overlay navigates correctly for levels beyond 10

**Integration Points:**
- LevelSelect → constants.ts: MAP_CONFIG.LEVEL_NODES array length drives node creation loop
- Game → Boot.ts: cache.json.get(level_NNN) loads level data for L11-L20
- CardPickOverlay → Game: MAX_LEVELS determines last level navigation

**Testing Surface:**
- Level select map scrolling with 20 nodes
- Level unlocking progression through L11-L20
- Win overlay navigation at L20 (shows "Меню" instead of "Далі")
- Card pick bonus levels 12, 15, 18 (every 3rd level pattern)

## Commits

1. **cdf87a7** - `feat(25-02): extend MAP_CONFIG and Boot.ts for 20 levels`
   - Updated MAP_HEIGHT to 4400
   - Shifted L1-L10 nodes, added L11-L20 nodes
   - Added 10 level JSON load statements

2. **14b5a9b** - `feat(25-02): update LevelSelect, Game, and CardPickOverlay for 20 levels`
   - Extended LEVEL_NAMES with 10 new names
   - Updated all "10" references to "20"
   - Fixed maxNodeX coordinate comment/value

## Files Modified

| File | Changes | Lines |
|------|---------|-------|
| src/game/constants.ts | Extended MAP_CONFIG (height + 10 nodes) | +21 / -11 |
| src/scenes/Boot.ts | Added 10 level JSON loads | +10 / -0 |
| src/scenes/LevelSelect.ts | Extended LEVEL_NAMES, updated loops + conditionals | +16 / -6 |
| src/scenes/Game.ts | MAX_LEVELS constant | +1 / -1 |
| src/scenes/CardPickOverlay.ts | MAX_LEVELS constant | +1 / -1 |

**Total:** 5 files modified, 49 insertions, 19 deletions

## Self-Check

Verifying claimed artifacts exist:

```bash
# Check constants.ts has 20 nodes
grep -c "label:" src/game/constants.ts
# Output: 20 ✅

# Check MAP_HEIGHT is 4400
grep "MAP_HEIGHT" src/game/constants.ts
# Output: MAP_HEIGHT: 4400 ✅

# Check Boot.ts loads 20 levels
grep -c "level_0" src/scenes/Boot.ts
# Output: 20 ✅

# Check commits exist
git log --oneline | grep -E "cdf87a7|14b5a9b"
# Output: Both commits found ✅
```

## Self-Check: PASSED

All claimed files, changes, and commits verified.

---

**Status:** ✅ Complete
**Duration:** 2 minutes
**Quality:** All verification passed, no deviations, TypeScript clean
