---
phase: 25-new-levels
plan: 01
subsystem: content
tags: [levels, game-design, tile-types, difficulty-progression]
dependency_graph:
  requires: [23-tile-expansion, 24-7x7-board-transition]
  provides: [levels-11-20, expanded-content]
  affects: [Game.ts, level-loading]
tech_stack:
  added: []
  patterns: [progressive-difficulty, shaped-boards, obstacle-variety]
key_files:
  created:
    - public/data/levels/level_011.json
    - public/data/levels/level_012.json
    - public/data/levels/level_013.json
    - public/data/levels/level_014.json
    - public/data/levels/level_015.json
    - public/data/levels/level_016.json
    - public/data/levels/level_017.json
    - public/data/levels/level_018.json
    - public/data/levels/level_019.json
    - public/data/levels/level_020.json
  modified: []
decisions:
  - title: Progressive tile type introduction
    rationale: L11 introduces coffee, L12 introduces fuel_can, L13 introduces wheel and uses all 9 types - gives players time to recognize new tiles before mixing them all
    alternatives: [introduce-all-at-once, random-distribution]
  - title: Bonus level rotation pattern
    rationale: L11, L14, L16, L19 marked as bonus_level (every 3rd level continues pattern from L1-L10) - maintains card collection mechanic cadence
    alternatives: [different-interval, all-bonus, no-bonus]
  - title: Board shape variety
    rationale: 6 unique cell_map shapes (T-shape, octagon, arrow, cross, ring, zigzag) plus 4 full boards - visual variety prevents monotony across 10 new levels
    alternatives: [all-full-boards, random-shapes, theme-based-shapes]
  - title: Multi-obstacle finale levels
    rationale: L19-L20 combine ice + grass + crate obstacles to create ultimate challenge - tests all player skills learned in L1-L18
    alternatives: [single-obstacle-focus, new-obstacle-types]
metrics:
  duration: 2.1
  completed: 2026-02-11
---

# Phase 25 Plan 01: Create 10 New Level JSONs Summary

**One-liner:** 10 new levels (L11-L20) doubling game content from 10 to 20 levels, introducing coffee/fuel_can/wheel tiles progressively across medium-to-expert difficulty with unique board shapes and escalating obstacle challenges.

## What Was Built

Created 10 level JSON files expanding the game from 10 to 20 levels, designed with:

- **Progressive tile introduction**: L11 debuts coffee, L12 debuts fuel_can, L13 debuts wheel (starting L13, all 9 types active)
- **Difficulty curve**: L11-L13 medium (0.20-0.22 fail rate) → L14-L15 medium-hard (0.25) → L16-L18 hard (0.30) → L19-L20 expert (0.35-0.40)
- **Board variety**: 6 unique shaped boards (T-shape, octagon, arrow, cross, fortress ring, zigzag staircase) + 4 full 7x7 boards
- **Obstacle escalation**: Single-layer ice in L11 → multi-layer ice/grass/crate combos in L19-L20
- **Bonus levels**: L11, L14, L16, L19 continue every-3rd-level pattern for card collection flow
- **Dramatic finale**: L20 "Фінал KLO" with KLO-logo shaped board and pre-placed klo_sphere booster

All levels use 7x7 grid dimensions, all 9 tile types appear across the set, spawn_rules sum to 1.0 for valid probability distributions.

## Implementation Details

### Task 1: Create L11-L15 (Medium to Medium-Hard)

**Files created:**
- `level_011.json` - "Кавовий ранок" (Coffee Morning): Introduces coffee tile, bonus level, simple ice obstacles
- `level_012.json` - "Паливна станція" (Fuel Station): Introduces fuel_can tile, T-shaped board
- `level_013.json` - "Колесо фортуни" (Wheel of Fortune): Introduces wheel tile, octagon shape, first level with all 9 types
- `level_014.json` - "Крижана дорога" (Icy Road): Arrow-shaped board, bonus level, pre-placed bomb booster
- `level_015.json` - "Бульбашкове поле" (Bubble Field): Full board, triple goals (coffee + fuel_can + crates)

**Commit:** 8e82941 - `feat(25-01): create L11-L15 level JSONs with new tile types`

### Task 2: Create L16-L20 (Hard to Expert)

**Files created:**
- `level_016.json` - "Льодяний хрест" (Icy Cross): Cross-shaped board, bonus level, 15 ice layers + 18 wheels
- `level_017.json` - "Подвійний удар" (Double Strike): Full board, triple goals (coffee + fuel_can + grass)
- `level_018.json` - "Фортеця KLO" (KLO Fortress): Ring/fortress shape, pre-placed linear horizontal booster
- `level_019.json` - "Останній рубіж" (Last Stand): Zigzag staircase shape, bonus level, all 3 obstacle types (ice + grass + crate)
- `level_020.json` - "Фінал KLO" (KLO Finale): KLO-logo inspired shape, pre-placed klo_sphere booster at center

**Commit:** 5512dff - `feat(25-01): create L16-L20 level JSONs with expert difficulty`

## Deviations from Plan

None - plan executed exactly as written.

All specifications followed precisely: Ukrainian names, exact spawn_rules distributions, specified cell_map layouts, obstacle positions, pre-placed boosters, bonus_level flags, and difficulty ratings all match plan requirements.

## Verification Results

**JSON validity:** All 10 files parse correctly as valid JSON.

**Grid dimensions:** All 10 levels use 7x7 grids (width:7, height:7).

**Tile type coverage:** All 9 types (burger, coffee, fuel_can, hotdog, oil, snack, soda, water, wheel) appear across L11-L20. Progressive introduction: coffee in L11, fuel_can in L12, wheel in L13, then all 9 types in L13-L20.

**Spawn rules:** All levels have spawn_rules that sum to 1.00 (±0.00 tolerance achieved).

**Difficulty progression:**
- L11-L13: medium (fail rate 0.20-0.22)
- L14-L15: medium-hard (fail rate 0.25)
- L16-L18: hard (fail rate 0.30)
- L19-L20: expert (fail rate 0.35-0.40)

**Bonus levels:** L11, L14, L16, L19 correctly flagged as bonus_level:true (maintains every-3rd-level pattern).

**Pre-placed boosters:** L14 has bomb booster, L18 has linear_horizontal booster, L20 has klo_sphere booster as specified.

**Board variety:** 6 unique cell_map shapes + 4 full boards across the 10 levels.

## Testing Recommendations

**Manual gameplay testing:**
1. Play L11 to verify coffee tile spawning and collection goals work
2. Play L12 to verify fuel_can tile spawning and T-shaped board rendering
3. Play L13 to verify wheel tile spawning and all 9 types appear correctly
4. Play L14 to verify pre-placed bomb booster activates properly
5. Test bonus levels (L11, L14, L16, L19) to ensure card pick overlay triggers
6. Play L20 to verify klo_sphere booster is pre-placed at center and activates

**Difficulty validation:**
- Track fail rates for L11-L15 (should be 20-25%)
- Track fail rates for L16-L18 (should be 30%)
- Track fail rates for L19-L20 (should be 35-40%)
- Adjust target_fail_rate if actual rates deviate significantly

**Visual QA:**
- Verify all 6 shaped boards render correctly with inactive_cell_style:"block"
- Ensure obstacle positions are on active cells (cell_map==1)
- Check that KLO-logo shape in L20 is visually recognizable

## Self-Check: PASSED

**Created files verified:**
```
FOUND: public/data/levels/level_011.json
FOUND: public/data/levels/level_012.json
FOUND: public/data/levels/level_013.json
FOUND: public/data/levels/level_014.json
FOUND: public/data/levels/level_015.json
FOUND: public/data/levels/level_016.json
FOUND: public/data/levels/level_017.json
FOUND: public/data/levels/level_018.json
FOUND: public/data/levels/level_019.json
FOUND: public/data/levels/level_020.json
```

**Commits verified:**
```
FOUND: 8e82941 (Task 1 - L11-L15)
FOUND: 5512dff (Task 2 - L16-L20)
```

All files created, all commits exist, plan execution complete.
