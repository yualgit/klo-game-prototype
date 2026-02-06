---
phase: 03-game-features
plan: 03
title: "Booster Activation System"
one-liner: "Individual booster effects and combo matrix with cross-clear rocket, 5x5 mega-bomb, triple-line, and KLO-sphere combos"
subsystem: game-logic
tags: [boosters, combos, game-mechanics, tdd]

requires:
  - 03-01 # Types and engine helpers (BoosterType, getTilesInRow, getTilesInColumn, getTilesInRadius, getTilesByType)
  - 02-01 # Match3Engine core logic

provides:
  - BoosterActivator class for individual and combo activation
  - Booster combo lookup table (BOOST-05 spec)
  - Deduplication logic for overlapping tile removal

affects:
  - 03-04 # Obstacle system will integrate with booster activation
  - 04-01 # UI layer will trigger booster activation

tech-stack:
  added: []
  patterns:
    - TDD methodology (RED-GREEN cycles)
    - Lookup table pattern for combo resolution
    - Pure function approach for game logic

key-files:
  created:
    - src/game/BoosterActivator.ts
    - src/game/BoosterActivator.test.ts
  modified: []

decisions:
  - id: BOOST-COMBO-TABLE
    what: Use static lookup table for booster combos vs dynamic resolution
    why: Simpler, more testable, and explicit about all combo effects
    when: 2026-02-06
  - id: BOOST-DEDUPE-BY-ID
    what: Deduplicate tiles by ID not by position
    why: Tiles can move during animations, ID is stable identifier
    when: 2026-02-06
  - id: BOOST-EDGE-HANDLING
    what: Triple-line combos check bounds before accessing rows/columns
    why: Prevents crashes when boosters are near board edges
    when: 2026-02-06

metrics:
  duration: 7 min
  completed: 2026-02-06
  tests_added: 11
  files_created: 2
  commits: 4
---

# Phase 03 Plan 03: Booster Activation System Summary

## Objective Completed

Implemented booster activation and combo system using TDD. Each booster type has a distinct activation effect, and swapping two boosters creates combo effects per the game design spec (BOOST-01 through BOOST-05).

## What Was Built

### Individual Booster Activation

1. **Linear Horizontal** - Clears entire row
2. **Linear Vertical** - Clears entire column
3. **Bomb** - Clears 3x3 area (radius 1)
4. **KLO-sphere** - Clears all tiles of same type

### Booster Combo Matrix

| Combo | Effect | Description |
|-------|--------|-------------|
| Linear + Linear | Rocket | Cross clear (row + column) |
| Bomb + Bomb | Mega Bomb | 5x5 area (radius 2) |
| Linear + Bomb | Triple Line | 3 rows or 3 columns |
| KLO-sphere + Any | Convert & Remove | All tiles of target type |
| KLO-sphere + KLO-sphere | Clear All | Entire board |
| Fallback | Activate Both | Individual activation + deduplicate |

### Edge Cases Handled

- Boosters near board edges (no out-of-bounds access)
- Tile deduplication when effects overlap
- Empty tiles excluded from clear-all operations

## Task Commits

| Task | Name | Commits | Files |
|------|------|---------|-------|
| 1 | TDD individual booster activation | `249f364` (test), `093e3de` (feat) | BoosterActivator.ts, BoosterActivator.test.ts |
| 2 | TDD booster combo system | `0beb47d` (test), `349df70` (feat) | BoosterActivator.ts, BoosterActivator.test.ts |

### Commit Details

**Task 1 (RED):** `249f364` - test(03-03): add failing test for individual booster activation
**Task 1 (GREEN):** `093e3de` - feat(03-03): implement individual booster activation

**Task 2 (RED):** `0beb47d` - test(03-03): add failing tests for booster combo system
**Task 2 (GREEN):** `349df70` - feat(03-03): implement booster combo system

## TDD Approach

### RED Phase
- Created comprehensive tests for all 4 individual booster types
- Created tests for all 6 combo scenarios (5 specific + 1 fallback)
- Verified tests failed before implementation existed

### GREEN Phase
- Implemented activateBooster() with switch statement for individual effects
- Implemented activateBoosterCombo() with special handling for KLO-sphere
- Created BOOSTER_COMBO_TABLE for combo lookup
- Created executeComboEffect() to execute combo logic
- Added helper methods: getComboKey, getAllNonEmptyTiles, deduplicateTiles

### Test Coverage
- 5 individual activation tests (all types + edge case)
- 6 combo tests (all combo types + fallback)
- 11 tests total, all passing

## Deviations from Plan

None - plan executed exactly as written.

## Integration Points

### Uses from 03-01 (Types & Engine Helpers)
- BoosterType, TileData types with booster field
- Match3Engine.getTilesInRow(row)
- Match3Engine.getTilesInColumn(col)
- Match3Engine.getTilesInRadius(row, col, radius)
- Match3Engine.getTilesByType(type)

### Provides for Future Plans
- BoosterActivator.activateBooster(tile) - single booster activation
- BoosterActivator.activateBoosterCombo(tile1, tile2) - combo activation
- Both methods return TileData[] for removal

## Next Phase Readiness

### Ready for 03-04 (Obstacle System)
- Booster activation returns tiles to remove
- Obstacle system can check if obstacles are in removal set
- No blocking dependencies

### Ready for 04-01 (Game Scene UI)
- BoosterActivator can be instantiated with Match3Engine reference
- Public methods have clean interfaces (accept TileData, return TileData[])
- Ready for integration with user input handlers

### No Blockers or Concerns

All must-haves verified:
- ✅ Linear horizontal booster clears entire row
- ✅ Linear vertical booster clears entire column
- ✅ Bomb booster clears 3x3 area around it
- ✅ KLO-sphere clears all tiles of a chosen type
- ✅ Two linear boosters swapped together clear cross (row + column)
- ✅ Two bombs swapped together clear 5x5 area
- ✅ KLO-sphere + any booster converts all tiles of target color to that booster type then removes
- ✅ Two KLO-spheres clear entire board

## Files Created

```
src/game/
├── BoosterActivator.ts          # Main booster activation logic (119 lines)
└── BoosterActivator.test.ts     # Comprehensive test suite (217 lines)
```

## Implementation Highlights

**Combo Lookup Table:**
```typescript
const BOOSTER_COMBO_TABLE: Record<string, ComboEffect> = {
  'linear_horizontal+linear_horizontal': 'rocket',
  'linear_horizontal+linear_vertical': 'rocket',
  'linear_vertical+linear_vertical': 'rocket',
  'bomb+bomb': 'mega_bomb',
  'bomb+linear_horizontal': 'triple_line_horizontal',
  'bomb+linear_vertical': 'triple_line_vertical',
};
```

**Edge Handling Example (triple-line):**
```typescript
const rows = [b1.row - 1, b1.row, b1.row + 1];
const tiles: TileData[] = [];
rows.forEach(row => {
  if (row >= 0 && row < 8) {  // Bounds check
    tiles.push(...this.engine.getTilesInRow(row));
  }
});
```

**Deduplication by ID:**
```typescript
private deduplicateTiles(tiles: TileData[]): TileData[] {
  const seen = new Set<string>();
  const result: TileData[] = [];
  for (const tile of tiles) {
    if (!seen.has(tile.id)) {
      seen.add(tile.id);
      result.push(tile);
    }
  }
  return result;
}
```

## Verification Complete

✅ All 11 tests pass
✅ TypeScript compilation clean (npx tsc --noEmit)
✅ Individual activation for all 4 booster types returns correct tile sets
✅ Combo activation follows lookup table with correct effects
✅ Edge cases handled (boosters near board edges, deduplication)

## Self-Check: PASSED
