---
phase: 25-new-levels
verified: 2026-02-11T19:25:00Z
status: passed
score: 6/6 must-haves verified
re_verification: false
---

# Phase 25: New Levels Verification Report

**Phase Goal:** 10 new levels with progressive difficulty using all tile types

**Verified:** 2026-02-11T19:25:00Z

**Status:** passed

**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | 10 new level JSON files (L11-L20) exist in public/data/levels/ | ✓ VERIFIED | All 10 files exist: level_011.json through level_020.json |
| 2 | All 9 tile types appear across the new levels | ✓ VERIFIED | All 9 types (burger, coffee, fuel_can, hotdog, oil, snack, soda, water, wheel) present. L11 introduces coffee, L12 introduces fuel_can, L13 introduces wheel, L13-L20 use all 9 types |
| 3 | New levels use 7x7 grids with varied cell_map shapes | ✓ VERIFIED | All levels have width:7, height:7. 6 unique shapes (T, octagon, arrow, cross, ring, zigzag) + 4 full boards |
| 4 | Progressive difficulty from medium to expert across L11-L20 | ✓ VERIFIED | L11-L13: medium (fail rate 0.20-0.22), L14-L15: medium-hard (0.25), L16-L18: hard (0.30), L19-L20: expert (0.35-0.40) |
| 5 | Obstacle variety increases: ice, grass, crate with multi-layer variants | ✓ VERIFIED | L11 starts with 1-layer ice, L19-L20 combine 3-layer ice + 3-layer grass + 2-layer crates |
| 6 | Some new levels are bonus_level:true for card pick flow | ✓ VERIFIED | L11, L14, L16, L19 marked as bonus levels (every 3rd level pattern) |

**Score:** 6/6 truths verified

### Observable Truths (Plan 25-02)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Level select map displays all 20 level nodes with Kyiv landmarks | ✓ VERIFIED | MAP_CONFIG.LEVEL_NODES has 20 entries with Ukrainian landmark labels |
| 2 | Boot.ts loads all 20 level JSON files | ✓ VERIFIED | Boot.ts contains level_011 through level_020 load statements |
| 3 | Player can navigate to and play levels 11-20 | ✓ VERIFIED | getCurrentLevel() loops to i<=20, LEVEL_NAMES has entries 1-20 |
| 4 | Winning level 20 shows 'Меню' button (last level detection works) | ✓ VERIFIED | MAX_LEVELS=20 in Game.ts, isLastLevel check uses >=MAX_LEVELS |
| 5 | Card pick overlay navigates correctly for levels beyond 10 | ✓ VERIFIED | MAX_LEVELS=20 in CardPickOverlay.ts |
| 6 | Road path connects all 20 nodes on the scrollable map | ✓ VERIFIED | MAP_HEIGHT=4400, nodes span y:4050 to y:250 with consistent spacing |

**Score:** 6/6 truths verified (Plan 25-02)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| public/data/levels/level_011.json | Level 11 data | ✓ VERIFIED | 724 bytes, valid JSON, level_id:11, contains coffee tile, bonus_level:true |
| public/data/levels/level_012.json | Level 12 data | ✓ VERIFIED | Valid JSON, level_id:12, contains fuel_can tile, T-shaped cell_map |
| public/data/levels/level_013.json | Level 13 data | ✓ VERIFIED | Valid JSON, level_id:13, contains wheel tile, 9 tile types, octagon shape |
| public/data/levels/level_014.json | Level 14 data | ✓ VERIFIED | Valid JSON, level_id:14, bonus_level:true, pre_placed bomb booster |
| public/data/levels/level_015.json | Level 15 data | ✓ VERIFIED | Valid JSON, level_id:15, triple goals (coffee+fuel_can+crate) |
| public/data/levels/level_016.json | Level 16 data | ✓ VERIFIED | Valid JSON, level_id:16, bonus_level:true, cross-shaped cell_map |
| public/data/levels/level_017.json | Level 17 data | ✓ VERIFIED | Valid JSON, level_id:17, triple goals (coffee+fuel_can+grass) |
| public/data/levels/level_018.json | Level 18 data | ✓ VERIFIED | Valid JSON, level_id:18, ring shape, pre_placed linear_horizontal booster |
| public/data/levels/level_019.json | Level 19 data | ✓ VERIFIED | Valid JSON, level_id:19, bonus_level:true, zigzag shape, all 3 obstacle types |
| public/data/levels/level_020.json | Level 20 data | ✓ VERIFIED | 1636 bytes, valid JSON, level_id:20, KLO-logo shape, pre_placed klo_sphere booster |
| src/game/constants.ts | MAP_CONFIG with 20 LEVEL_NODES | ✓ VERIFIED | LEVEL_NODES array has 20 entries, MAP_HEIGHT=4400, nodes span y:4050-250 |
| src/scenes/Boot.ts | Level JSON loading for L11-L20 | ✓ VERIFIED | 10 load statements for level_011 through level_020 |
| src/scenes/LevelSelect.ts | Level names for 20 levels | ✓ VERIFIED | LEVEL_NAMES has entries 1-20, includes "Кавовий ранок" through "Фінал KLO" |
| src/scenes/Game.ts | MAX_LEVELS=20 | ✓ VERIFIED | MAX_LEVELS constant set to 20 |
| src/scenes/CardPickOverlay.ts | MAX_LEVELS=20 | ✓ VERIFIED | MAX_LEVELS constant set to 20 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| level JSONs | tileConfig.ts | spawn_rules keys match TILE_CONFIG keys | ✓ WIRED | All tile types in spawn_rules (coffee, fuel_can, wheel) exist in TILE_CONFIG |
| LevelSelect.ts | constants.ts | MAP_CONFIG.LEVEL_NODES array drives node creation | ✓ WIRED | LEVEL_NODES imported and used in create() method |
| Game.ts | Boot.ts | cache.json.get(level_NNN) loads level data | ✓ WIRED | MAX_LEVELS=20 matches 20 level JSON files loaded in Boot.ts |
| CardPickOverlay.ts | Game.ts | MAX_LEVELS determines last level navigation | ✓ WIRED | Both files use MAX_LEVELS=20 for navigation logic |
| LevelSelect.ts | LEVEL_NAMES | getCurrentLevel() loop iterates 1-20 | ✓ WIRED | Loop uses i<=20, LEVEL_NAMES has all 20 entries |

### Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| LVL-01: 10 new levels (L11-L20) with 7x7 boards | ✓ SATISFIED | All 10 level files exist, all have width:7, height:7 |
| LVL-02: New levels use all 9 tile types | ✓ SATISFIED | All 9 types (burger, coffee, fuel_can, hotdog, oil, snack, soda, water, wheel) appear across L11-L20 |
| LVL-03: Progressive difficulty (more obstacles, harder goals) | ✓ SATISFIED | Difficulty curve: medium (L11-L13) → medium-hard (L14-L15) → hard (L16-L18) → expert (L19-L20). Obstacle layers escalate from 1 to 3. Moves decrease relative to board complexity |
| LVL-04: Level select map shows all 20 level nodes | ✓ SATISFIED | MAP_CONFIG has 20 LEVEL_NODES, MAP_HEIGHT=4400, all nodes positioned on Kyiv journey map |

### Anti-Patterns Found

**No blocking anti-patterns found.**

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/scenes/Boot.ts | 133 | "Blank card placeholder" comment | ℹ️ Info | Pre-existing comment, not related to this phase |

All modified files are free of TODOs, FIXMEs, placeholder implementations, or stub code.

### Human Verification Required

#### 1. Visual Board Rendering

**Test:** Open level select, navigate to levels 11-20, and start each level. Verify all 6 shaped boards render correctly (T-shape L12, octagon L13, arrow L14, cross L16, ring L18, zigzag L19) with inactive cells displayed as blocks.

**Expected:** 
- Inactive cells (cell_map==0) display as "block" style (solid gray tiles)
- Active cells form the expected shape
- Board is centered and fits within game viewport
- No cells overlap or appear outside grid bounds

**Why human:** Visual appearance and layout correctness require human judgment. Grep can verify cell_map exists but can't confirm visual rendering.

#### 2. Progressive Difficulty Feel

**Test:** Play through levels 11-20 in sequence. Note the perceived difficulty increase.

**Expected:**
- L11-L13 feel achievable with moderate effort (medium)
- L14-L15 require more planning and strategy (medium-hard)
- L16-L18 feel challenging, may require multiple attempts (hard)
- L19-L20 feel very difficult, demanding optimal moves (expert)

**Why human:** Difficulty perception and game balance require actual gameplay experience, cannot be verified programmatically.

#### 3. New Tile Type Introduction

**Test:** Play L11 (first coffee level), L12 (first fuel_can level), L13 (first wheel level). Observe tile spawning and collection.

**Expected:**
- Coffee tiles spawn in L11, animate and collect properly
- Fuel_can tiles spawn in L12, visually distinct from coffee
- Wheel tiles spawn in L13, all 9 types appear simultaneously without visual conflicts
- New tiles match/swap mechanics work identically to existing tiles

**Why human:** Tile visual identity, animation smoothness, and UX feel require human observation during gameplay.

#### 4. Pre-Placed Booster Activation

**Test:** Play L14 (pre-placed bomb), L18 (pre-placed linear_horizontal), L20 (pre-placed klo_sphere). Verify boosters are present at level start and activate correctly.

**Expected:**
- L14: Bomb booster at row:3, col:6 (wheel tile with bomb icon)
- L18: Linear horizontal booster at row:0, col:0 (coffee tile with horizontal stripe)
- L20: KLO-sphere booster at row:3, col:3 (wheel tile with sphere icon)
- Matching pre-placed boosters triggers booster effect (bomb explodes 3x3, linear clears row, sphere clears all of type)

**Why human:** Booster presence, visual indicators, and activation effects require gameplay observation.

#### 5. Bonus Level Card Pick Flow

**Test:** Complete L11, L14, L16, L19. Verify card pick overlay appears after win screen.

**Expected:**
- Completing bonus level shows win overlay, then card pick overlay
- Player can select 1 of 3 random cards
- Navigation proceeds to next level after card selection
- Non-bonus levels (L12, L13, L15, L17, L18, L20) go directly to next level without card pick

**Why human:** Multi-screen flow and overlay transitions require end-to-end gameplay testing.

#### 6. Level 20 Final Level Behavior

**Test:** Complete level 20 and observe the win overlay.

**Expected:**
- Win overlay shows "Меню" button instead of "Далі" button
- Clicking "Меню" returns to main menu or level select (not attempting to start L21)
- No crash or error when finishing the last level

**Why human:** Last level edge case behavior requires manual end-to-end testing.

#### 7. Map Scrolling with 20 Nodes

**Test:** Open level select map. Scroll from bottom (L1) to top (L20). Verify all nodes are visible and properly positioned.

**Expected:**
- Map scrolls smoothly from y:4050 (L1) to y:250 (L20)
- All 20 level nodes visible with correct Kyiv landmark labels
- Winding path connects all nodes
- No nodes overlap or render offscreen
- Current level pointer appears at correct node

**Why human:** Scrolling smoothness, visual layout, and path aesthetics require human judgment.

---

## Summary

**All automated verification PASSED.**

Phase 25 successfully achieved its goal: 10 new levels (L11-L20) with progressive difficulty using all 9 tile types.

**Key achievements:**
- ✓ 10 level JSON files created with valid schema
- ✓ All levels use 7x7 boards with varied cell_map shapes
- ✓ All 9 tile types appear (coffee introduced in L11, fuel_can in L12, wheel in L13)
- ✓ Progressive difficulty curve: medium → medium-hard → hard → expert
- ✓ Obstacle variety escalates: single-layer ice → multi-layer ice+grass+crate combos
- ✓ Bonus levels (L11, L14, L16, L19) continue every-3rd-level pattern
- ✓ Pre-placed boosters in L14, L18, L20
- ✓ L20 finale has KLO-sphere booster and KLO-logo shaped board
- ✓ Level select map extended to 20 nodes with Kyiv landmarks
- ✓ Boot.ts loads all 20 level JSONs
- ✓ MAX_LEVELS updated to 20 in Game.ts and CardPickOverlay.ts
- ✓ All spawn_rules sum to 1.0 (valid probability distributions)
- ✓ TypeScript compilation clean (no errors)

**Human verification required:** 7 items covering visual rendering, difficulty feel, tile introduction UX, booster activation, card pick flow, last level behavior, and map scrolling. All automated checks passed; these items need gameplay testing to confirm UX quality.

**Requirements coverage:** All 4 requirements (LVL-01, LVL-02, LVL-03, LVL-04) satisfied.

**No gaps found.** Phase goal achieved.

---

_Verified: 2026-02-11T19:25:00Z_
_Verifier: Claude (gsd-verifier)_
