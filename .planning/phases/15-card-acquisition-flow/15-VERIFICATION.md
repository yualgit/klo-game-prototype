---
phase: 15-card-acquisition-flow
verified: 2026-02-11T08:36:37Z
status: passed
score: 7/7 must-haves verified
re_verification: false
---

# Phase 15: Card Acquisition Flow Verification Report

**Phase Goal:** Card drop mechanics with pick-1-of-2 UX, weighted rarity, and pity system
**Verified:** 2026-02-11T08:36:37Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | After winning bonus level, player sees 2 closed cards and picks one | ✓ VERIFIED | CardPickOverlay.create() rolls 2 cards, displays side-by-side containers with procedural back, interactive with pointerup handler |
| 2 | Picked card flips to reveal, other card also reveals (show what could have been) | ✓ VERIFIED | onCardPicked() calls flipCard() for both cards with delay (0ms for picked, 300ms for other), scaleX tween animation swaps back→front |
| 3 | Card rarity follows weighted probability (common more frequent than legendary) | ✓ VERIFIED | DROP_CONFIG defines base_chance: common=0.50, rare=0.30, epic=0.15, legendary=0.05; weightedRandomCard() uses cumulative weight distribution |
| 4 | After 3 consecutive duplicates, next card guaranteed new if missing cards exist | ✓ VERIFIED | rollCard() checks `pityStreak >= config.pity.threshold` (3) BEFORE rolling; when triggered, calls weightedRandomCard(missingCards, ..., true) |
| 5 | Pity mechanic respects config (threshold, epic/legendary multipliers) | ✓ VERIFIED | DROP_CONFIG defines pity.threshold=3, epic_multiplier=1.5, legendary_multiplier=2.0; weightedRandomCard() applies multipliers in pityMode |
| 6 | Bonus levels (3, 6, 9) trigger card pick, non-bonus proceed normally | ✓ VERIFIED | level_003/006/009.json have bonus_level: true; Game.ts showWinOverlay() checks isBonusLevel, launches CardPickOverlay on bonus, next level otherwise |
| 7 | Collection rotation works (coffee→food→car for L3→L6→L9) | ✓ VERIFIED | getActiveCollectionId() uses `Math.floor((levelId-1)/3) % 3` formula; CardPickOverlay.create() calls it with data.levelId |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/game/cardDropLogic.ts` | Weighted random card selection with pity system | ✓ VERIFIED | 98 lines, exports rollCard/DropConfig/DROP_CONFIG, imports getCardsForCollection, implements weighted random with pity guarantee |
| `src/game/collectionConfig.ts` | Collection rotation helper | ✓ VERIFIED | 224 lines, exports getActiveCollectionId(), uses Math.floor formula for L3→coffee, L6→food, L9→car |
| `src/game/CollectionsManager.ts` | selectCard and getPityStreak methods | ✓ VERIFIED | 153 lines, getPityStreak() returns collection.pity_streak, selectCard() resets pity on new card, increments on duplicate, calls save() |
| `src/scenes/CardPickOverlay.ts` | Card pick overlay scene with flip animation | ✓ VERIFIED | 349 lines, scene key 'CardPickOverlay', creates 2 cards with procedural backs, flipCard() uses scaleX tween, onCardPicked() calls selectCard() |
| `src/scenes/index.ts` | CardPickOverlay export | ✓ VERIFIED | Line 12: `export { CardPickOverlay } from './CardPickOverlay';` |
| `src/main.ts` | CardPickOverlay registered in scene list | ✓ VERIFIED | Line 3: import includes CardPickOverlay; Line 28: scene array includes CardPickOverlay |
| `public/data/levels/level_003.json` | bonus_level: true flag | ✓ VERIFIED | Line 3: `"bonus_level": true` |
| `public/data/levels/level_006.json` | bonus_level: true flag | ✓ VERIFIED | Line 3: `"bonus_level": true` |
| `public/data/levels/level_009.json` | bonus_level: true flag | ✓ VERIFIED | Line 3: `"bonus_level": true` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| cardDropLogic.ts | collectionConfig.ts | getCardsForCollection import | ✓ WIRED | Line 6: `import { ... getCardsForCollection } from './collectionConfig'`; Line 48: `getCardsForCollection(collectionId)` |
| CollectionsManager.ts | firestore.ts | save() calls saveCollections | ✓ WIRED | Line 150: `await this.firestoreService.saveCollections(this.uid, this.state)` |
| CardPickOverlay.ts | cardDropLogic.ts | rollCard import and usage | ✓ WIRED | Line 8: import rollCard/DROP_CONFIG; Lines 44-45-49: rollCard() called 3 times to generate 2 cards |
| CardPickOverlay.ts | CollectionsManager | registry.get and selectCard call | ✓ WIRED | Line 39: `registry.get('collections')` gets manager; Line 230: `collections.selectCard(collectionId, pickedCardId)` |
| Game.ts | CardPickOverlay.ts | scene.start on bonus level | ✓ WIRED | Line 20: imports getActiveCollectionId; Line 368: `isBonusLevel = this.levelData.bonus_level === true`; Line 465: `this.scene.start('CardPickOverlay', { levelId })` |
| Game.ts | collectionConfig.ts | getActiveCollectionId import | ✓ WIRED | Line 20: `import { getActiveCollectionId } from '../game/collectionConfig'` |

### Requirements Coverage

From ROADMAP.md Phase 15 success criteria:

| Requirement | Status | Evidence |
|-------------|--------|----------|
| COL-06: After winning bonus level, player sees 2 closed cards and picks one | ✓ SATISFIED | Truth #1 verified — CardPickOverlay displays 2 cards with procedural backs, interactive |
| COL-07: Picked card flips to reveal, other card also reveals | ✓ SATISFIED | Truth #2 verified — flipCard() animates both cards with scaleX tween |
| COL-08: Card rarity follows weighted probability | ✓ SATISFIED | Truth #3 verified — DROP_CONFIG defines rarity weights, weightedRandomCard() implements distribution |
| COL-09: After 3 consecutive duplicates, next card guaranteed new | ✓ SATISFIED | Truth #4 verified — rollCard() checks pity threshold BEFORE rolling |
| COL-10: Pity mechanic respects config | ✓ SATISFIED | Truth #5 verified — DROP_CONFIG defines threshold/multipliers, applied in weightedRandomCard() |

### Anti-Patterns Found

None detected.

Scan performed on:
- src/game/cardDropLogic.ts
- src/game/CollectionsManager.ts
- src/scenes/CardPickOverlay.ts
- src/scenes/Game.ts

No TODO/FIXME/PLACEHOLDER comments, no empty implementations, no console.log-only handlers, all functions substantive and wired.

### Human Verification Required

#### 1. Visual Card Flip Animation

**Test:** Win level 3, click "Далі", tap one of the two cards
**Expected:** 
- Picked card flips first (shrinks horizontally, swaps to front image, expands)
- 300ms later, other card flips same way
- Picked card scales to 1.08 and shows "Обрано!" text in gold
- Other card dims to 50% opacity
- Rarity labels appear below both cards in correct colors
- "Далі" button appears at bottom

**Why human:** Animation smoothness, visual polish, and timing perception require human eyes. Automated tests can verify code structure but not perceived quality.

#### 2. Weighted Rarity Distribution

**Test:** Win levels 3, 6, 9 multiple times (10+ runs), note card rarities received
**Expected:**
- Common cards appear ~50% of the time
- Rare cards appear ~30% of the time
- Epic cards appear ~15% of the time
- Legendary cards appear ~5% of the time
- Distribution roughly matches base_chance over 30+ card drops

**Why human:** Statistical distribution requires multiple runs; automated testing would need mock random generator. Real-world feel best verified by human observation.

#### 3. Pity System Trigger

**Test:** Get 3 consecutive duplicate cards, then trigger next card drop
**Expected:**
- After 3rd duplicate, pity_streak = 3
- Next card drop (4th attempt) guarantees NEW card (one not in owned_cards)
- After new card received, pity_streak resets to 0
- Console log shows "[CardDrop] Pity triggered, guaranteed new card"

**Why human:** Requires specific game state setup (3 duplicates in a row) that's easier to orchestrate manually than automate. Need to verify edge case behavior.

#### 4. Collection Rotation Correctness

**Test:** Complete levels 1-9, observe which collection cards appear:
**Expected:**
- Level 3 win → Coffee collection cards offered
- Level 6 win → Food collection cards offered  
- Level 9 win → Car collection cards offered
- Card fronts match collection theme (coffee cups, burgers, cars)
- Collection progress updates in Collections tab after each pick

**Why human:** End-to-end flow across multiple levels requires full gameplay session. Visual verification that correct collection assets load for each bonus level.

#### 5. Non-Bonus Level Behavior Unchanged

**Test:** Win level 1 (non-bonus), click "Далі"
**Expected:**
- No card pick overlay appears
- Game proceeds directly to Level 2 as before Phase 15
- No bonus hint text on win overlay
- Gameplay identical to pre-Phase-15 behavior for non-bonus levels

**Why human:** Regression test ensuring existing behavior unchanged. Need human to confirm "feels the same" as before.

---

## Overall Assessment

**Status:** PASSED

All 7 observable truths verified with substantive implementations. All required artifacts exist with complete, non-stub code. All key links wired correctly with imports and actual usage. No anti-patterns detected. TypeScript compiles without errors.

**Artifacts:** 9/9 verified (100%)
**Key Links:** 6/6 wired (100%)
**Requirements:** 5/5 satisfied (100%)

### Implementation Highlights

**Strengths:**
1. **Pity check BEFORE rolling** — Avoids off-by-one error documented in research; pityStreak checked before rollCard() call, not incremented first
2. **Procedural card back** — No asset dependency; Graphics object with KLO branding (yellow border, dark bg) created at runtime
3. **Dual card reveal animation** — Sequential flip (picked first, other 300ms later) enhances "what could have been" psychological effect
4. **Weighted random with multipliers** — Pity mode applies epic_multiplier (1.5x) and legendary_multiplier (2.0x) to missing cards, increasing rare card chance after streak
5. **Collection rotation math** — Formula `Math.floor((levelId-1)/3) % 3` handles any future bonus levels beyond 9 automatically
6. **Firestore persistence** — selectCard() calls save() immediately; pity_streak and owned_cards persisted after every card acquisition

**Technical Patterns Verified:**
- Config-driven drop rates (DROP_CONFIG)
- Weighted random selection with cumulative probability
- Pity system with per-collection streak tracking
- Flip animation via scaleX tween (phase 1: scale to 0, swap content, phase 2: scale to 1)
- Interactive backdrop with Geom.Rectangle hit area (blocks click-through)

**Integration Quality:**
- Game.ts properly detects bonus levels via `levelData.bonus_level === true`
- CardPickOverlay properly receives levelId and handles next level navigation
- Non-bonus levels unaffected (regression risk mitigated)
- Scene registration complete (export + Phaser config)

### Commits Verified

All commits from SUMMARY files exist and contain expected changes:

1. `2f27655` — Card drop logic module + CollectionsManager extension (6 files, 148 insertions)
2. `92f60ac` — Bonus level JSON flags (3 files, 3 insertions)
3. `1f98557` — CardPickOverlay scene implementation (1 file, 348 insertions)
4. `fb9831a` — Scene registration + Game.ts integration (3 files, 23 insertions)

Total: 12 files modified, 522 insertions, 3 deletions

### Gaps Summary

No gaps found. All must-haves verified, all truths passed, all artifacts substantive and wired.

**Phase 15 goal achieved.**

---

_Verified: 2026-02-11T08:36:37Z_
_Verifier: Claude (gsd-verifier)_
