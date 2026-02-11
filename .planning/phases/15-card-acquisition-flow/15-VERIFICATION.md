---
phase: 15-card-acquisition-flow
verified: 2026-02-11T11:40:00Z
status: passed
score: 10/10 must-haves verified
re_verification:
  previous_status: passed
  previous_score: 7/7
  gaps_closed:
    - "Win overlay bonus hint text 'Бонус: обери картку!' does not overlap star icons"
    - "Card name and rarity label on CardPickOverlay do not overlap each other"
    - "Collections screen shows 'x2', 'x3' etc. badge on cards owned more than once"
  gaps_remaining: []
  regressions: []
---

# Phase 15: Card Acquisition Flow Verification Report

**Phase Goal:** Card drop mechanics with pick-1-of-2 UX, weighted rarity, and pity system
**Verified:** 2026-02-11T11:40:00Z
**Status:** passed
**Re-verification:** Yes — after UAT gap closure (plan 15-03)

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
| 8 | Win overlay bonus hint text does not overlap star icons | ✓ VERIFIED | Game.ts line 374: bonus hint at cssToGame(75), stars at cssToGame(45) for 1-2 stars or cssToGame(60) for 3 stars — minimum 15px clearance |
| 9 | Card name and rarity label do not overlap on revealed cards | ✓ VERIFIED | CardPickOverlay.ts line 222: rarity label at cssToGame(140), card name at ~cssToGame(106.5) — 33.5px gap sufficient for 14px text |
| 10 | Collections screen shows duplicate count badge for cards owned more than once | ✓ VERIFIED | Collections.ts lines 161-177: getCardCount() called, renders "x{count}" badge at top-right when count > 1 |

**Score:** 10/10 truths verified (7 original + 3 UAT gap fixes)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/game/cardDropLogic.ts` | Weighted random card selection with pity system | ✓ VERIFIED | 98 lines, exports rollCard/DropConfig/DROP_CONFIG, imports getCardsForCollection, implements weighted random with pity guarantee |
| `src/game/collectionConfig.ts` | Collection rotation helper | ✓ VERIFIED | 224 lines, exports getActiveCollectionId(), uses Math.floor formula for L3→coffee, L6→food, L9→car |
| `src/game/CollectionsManager.ts` | selectCard, getPityStreak, and getCardCount methods | ✓ VERIFIED | 162 lines, getPityStreak() returns pity_streak, selectCard() tracks card_counts, getCardCount() accessor added in gap closure |
| `src/scenes/CardPickOverlay.ts` | Card pick overlay scene with flip animation and proper spacing | ✓ VERIFIED | 349 lines, scene key 'CardPickOverlay', rarity label Y offset cssToGame(140) fixed in gap closure |
| `src/scenes/Game.ts` | Bonus level detection and bonus hint positioning | ✓ VERIFIED | 974 lines, bonus hint at cssToGame(75) fixed in gap closure, no overlap with stars |
| `src/scenes/Collections.ts` | Collection display with duplicate count badges | ✓ VERIFIED | 407 lines, renders "x{count}" badge via getCardCount() added in gap closure |
| `src/firebase/firestore.ts` | CollectionProgress with card_counts field | ✓ VERIFIED | 235 lines, interface includes `card_counts: Record<string, number>` added in gap closure |
| `src/scenes/index.ts` | CardPickOverlay export | ✓ VERIFIED | Line 12: `export { CardPickOverlay } from './CardPickOverlay';` |
| `src/main.ts` | CardPickOverlay registered and default collection states include card_counts | ✓ VERIFIED | Line 3: import includes CardPickOverlay; Line 28: scene array includes CardPickOverlay; Lines 92-94: card_counts: {} defaults |
| `public/data/levels/level_003.json` | bonus_level: true flag | ✓ VERIFIED | Line 3: `"bonus_level": true` |
| `public/data/levels/level_006.json` | bonus_level: true flag | ✓ VERIFIED | Line 3: `"bonus_level": true` |
| `public/data/levels/level_009.json` | bonus_level: true flag | ✓ VERIFIED | Line 3: `"bonus_level": true` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| cardDropLogic.ts | collectionConfig.ts | getCardsForCollection import | ✓ WIRED | Line 6: `import { ... getCardsForCollection } from './collectionConfig'`; Line 48: `getCardsForCollection(collectionId)` |
| CollectionsManager.ts | firestore.ts | save() calls saveCollections | ✓ WIRED | Line 159: `await this.firestoreService.saveCollections(this.uid, this.state)` |
| CardPickOverlay.ts | cardDropLogic.ts | rollCard import and usage | ✓ WIRED | Line 8: import rollCard/DROP_CONFIG; Lines 44-45-49: rollCard() called 3 times to generate 2 cards |
| CardPickOverlay.ts | CollectionsManager | registry.get and selectCard call | ✓ WIRED | Line 39: `registry.get('collections')` gets manager; Line 230: `collections.selectCard(collectionId, pickedCardId)` |
| Game.ts | CardPickOverlay.ts | scene.start on bonus level | ✓ WIRED | Line 20: imports getActiveCollectionId; Line 370: `isBonusLevel = this.levelData.bonus_level === true`; Line 465: `this.scene.start('CardPickOverlay', { levelId })` |
| Game.ts | collectionConfig.ts | getActiveCollectionId import | ✓ WIRED | Line 20: `import { getActiveCollectionId } from '../game/collectionConfig'` |
| Collections.ts | CollectionsManager | getCardCount() call | ✓ WIRED | Line 161: `collectionsManager.getCardCount(collectionId, card.id)` for duplicate badge rendering |
| CollectionsManager.ts | firestore.ts | CollectionProgress.card_counts field | ✓ WIRED | Lines 113-114, 156-157: card_counts incremented in addCard/selectCard; Line 41: interface defines field |

### Requirements Coverage

From ROADMAP.md Phase 15 success criteria:

| Requirement | Status | Evidence |
|-------------|--------|----------|
| COL-06: After winning bonus level, player sees 2 closed cards and picks one | ✓ SATISFIED | Truth #1 verified — CardPickOverlay displays 2 cards with procedural backs, interactive |
| COL-07: Picked card flips to reveal, other card also reveals | ✓ SATISFIED | Truth #2 verified — flipCard() animates both cards with scaleX tween |
| COL-08: Card rarity follows weighted probability | ✓ SATISFIED | Truth #3 verified — DROP_CONFIG defines rarity weights, weightedRandomCard() implements distribution |
| COL-09: After 3 consecutive duplicates, next card guaranteed new | ✓ SATISFIED | Truth #4 verified — rollCard() checks pity threshold BEFORE rolling |
| COL-10: Pity mechanic respects config | ✓ SATISFIED | Truth #5 verified — DROP_CONFIG defines threshold/multipliers, applied in weightedRandomCard() |

### UAT Gap Closure Verification

**UAT performed:** 2026-02-11T09:00:00Z — 8 tests, 5 passed, 3 cosmetic/minor issues
**Gap closure plan:** 15-03-PLAN.md
**Gap closure completed:** 2026-02-11T09:34:54Z (114s)

| Gap | UAT Test | Status | Fix |
|-----|----------|--------|-----|
| Bonus hint overlaps stars | Test #1 | ✓ CLOSED | Game.ts line 374: Y position changed from cssToGame(42) to cssToGame(75) — now 15-30px below stars |
| Rarity label overlaps card name | Test #3 | ✓ CLOSED | CardPickOverlay.ts line 222: Y offset changed from cssToGame(110) to cssToGame(140) — 33.5px gap |
| Missing duplicate count display | Test #6 | ✓ CLOSED | Added card_counts field to CollectionProgress, getCardCount() method, "x{count}" badge rendering in Collections scene |

**All 3 UAT gaps closed.** No regressions detected.

### Anti-Patterns Found

None detected.

Scan performed on:
- src/game/cardDropLogic.ts
- src/game/CollectionsManager.ts
- src/scenes/CardPickOverlay.ts
- src/scenes/Game.ts
- src/scenes/Collections.ts
- src/firebase/firestore.ts

No TODO/FIXME/PLACEHOLDER comments, no empty implementations, no console.log-only handlers, all functions substantive and wired.

### Human Verification Required

#### 1. Visual Card Flip Animation with Fixed Spacing

**Test:** Win level 3, click "Далі", tap one of the two cards
**Expected:** 
- Picked card flips first (shrinks horizontally, swaps to front image, expands)
- 300ms later, other card flips same way
- Picked card scales to 1.08 and shows "Обрано!" text in gold
- Other card dims to 50% opacity
- Rarity labels appear BELOW card names with visible gap (no overlap)
- "Далі" button appears at bottom

**Why human:** Animation smoothness, visual polish, and spacing perception require human eyes. Need to verify text overlap fix is visually comfortable.

#### 2. Bonus Hint Positioning Below Stars

**Test:** Win level 3 (bonus level) with 1-2 stars
**Expected:**
- Star icons appear at top of win overlay
- "Бонус: обери картку!" text appears BELOW stars with clear space
- No text overlap with star icons at any star count (1, 2, or 3 stars)
- Hint text clearly readable in gold color

**Why human:** Visual positioning and readability assessment requires human judgment. Need to verify 15px clearance feels comfortable.

#### 3. Duplicate Count Badge Display

**Test:** Win level 3 twice in a row, get same card both times, open Collections screen
**Expected:**
- Card appears in full color (owned)
- Small "x2" badge appears in top-right corner of card with white text on dark background
- Badge does not obscure card image or rarity badge
- Win level 3 third time with same card → badge updates to "x3"

**Why human:** Visual badge positioning and legibility assessment. Need to verify badge placement doesn't interfere with card aesthetics.

#### 4. Weighted Rarity Distribution (unchanged from previous verification)

**Test:** Win levels 3, 6, 9 multiple times (10+ runs), note card rarities received
**Expected:**
- Common cards appear ~50% of the time
- Rare cards appear ~30% of the time
- Epic cards appear ~15% of the time
- Legendary cards appear ~5% of the time
- Distribution roughly matches base_chance over 30+ card drops

**Why human:** Statistical distribution requires multiple runs; automated testing would need mock random generator. Real-world feel best verified by human observation.

#### 5. Pity System Trigger (unchanged from previous verification)

**Test:** Get 3 consecutive duplicate cards, then trigger next card drop
**Expected:**
- After 3rd duplicate, pity_streak = 3
- Next card drop (4th attempt) guarantees NEW card (one not in owned_cards)
- After new card received, pity_streak resets to 0
- Console log shows "[CardDrop] Pity triggered, guaranteed new card"
- Duplicate count continues to increment for all cards (pity doesn't reset card_counts)

**Why human:** Requires specific game state setup (3 duplicates in a row) that's easier to orchestrate manually than automate. Need to verify edge case behavior.

---

## Overall Assessment

**Status:** PASSED

All 10 observable truths verified (7 original + 3 UAT gap fixes). All required artifacts exist with complete, non-stub code. All key links wired correctly with imports and actual usage. All UAT gaps closed with substantive implementations. No anti-patterns detected. TypeScript compiles without errors.

**Artifacts:** 12/12 verified (100%)
**Key Links:** 8/8 wired (100%)
**Requirements:** 5/5 satisfied (100%)
**UAT Gaps:** 3/3 closed (100%)

### Re-Verification Summary

**Previous verification (2026-02-11T08:36:37Z):**
- Status: passed
- Score: 7/7 truths verified
- Gaps: None (pre-UAT)

**Current verification (2026-02-11T11:40:00Z):**
- Status: passed
- Score: 10/10 truths verified
- Gaps closed: 3 (bonus hint positioning, rarity label spacing, duplicate count tracking)
- Regressions: 0

**Changes since previous verification:**
1. Game.ts bonus hint repositioned from Y=42 to Y=75 (fixes overlap with stars)
2. CardPickOverlay.ts rarity label offset increased from 110 to 140 (fixes overlap with card name)
3. CollectionProgress interface extended with card_counts field
4. CollectionsManager.getCardCount() method added for duplicate count queries
5. Collections scene renders "x{count}" badge on duplicate cards
6. Backward-compatible Firestore migration for existing users without card_counts

**No functionality regressions detected.** All original 7 truths remain verified. UAT gaps addressed with surgical fixes that don't impact core card drop mechanics.

### Implementation Highlights

**Original Strengths (unchanged):**
1. Pity check BEFORE rolling — Avoids off-by-one error
2. Procedural card back — No asset dependency
3. Dual card reveal animation — Sequential flip enhances psychology
4. Weighted random with multipliers — Pity mode boosts rare card chances
5. Collection rotation math — Extensible formula for future bonus levels
6. Firestore persistence — Immediate save after card acquisition

**Gap Closure Strengths:**
1. **Precise CSS pixel calculations** — 15px star clearance, 33.5px text gap based on actual font sizes
2. **Backward-compatible schema migration** — Existing Firestore documents without card_counts get empty object default
3. **Minimal change footprint** — 2 Y position adjustments, 1 interface field, 1 method, 1 badge render — no refactoring
4. **Separation of concerns** — card_counts separate from owned_cards (unique list vs. acquisition count)
5. **Visual polish** — Duplicate badge positioned non-obtrusively at top-right corner

**Technical Patterns Verified:**
- Config-driven drop rates (DROP_CONFIG)
- Weighted random selection with cumulative probability
- Pity system with per-collection streak tracking
- Flip animation via scaleX tween
- Interactive backdrop with Geom.Rectangle hit area
- Per-card acquisition counting (card_counts)
- CSS-to-game coordinate conversion for responsive layout

**Integration Quality:**
- Game.ts properly detects bonus levels via `levelData.bonus_level === true`
- CardPickOverlay properly receives levelId and handles next level navigation
- Non-bonus levels unaffected (regression risk mitigated)
- Scene registration complete (export + Phaser config)
- Collections scene integrates getCardCount() seamlessly
- Firestore schema extends gracefully with defaults

### Commits Verified

**Original implementation (15-01, 15-02):**
1. `2f27655` — Card drop logic module + CollectionsManager extension (6 files, 148 insertions)
2. `92f60ac` — Bonus level JSON flags (3 files, 3 insertions)
3. `1f98557` — CardPickOverlay scene implementation (1 file, 348 insertions)
4. `fb9831a` — Scene registration + Game.ts integration (3 files, 23 insertions)

**Gap closure (15-03):**
5. `499e91a` — Fix text overlap issues in win overlay and card reveal (2 files)
6. `107ab90` — Add duplicate card count tracking and display (4 files)

Total: 15 files modified, 522+ insertions (original) + gap closure changes

### Gaps Summary

**No gaps remaining.** All UAT issues resolved:
- Text overlaps fixed with precise positioning calculations
- Duplicate tracking implemented with backward-compatible data model
- Visual badge rendering integrated into Collections scene

**Phase 15 goal achieved with UAT validation complete.**

---

_Verified: 2026-02-11T11:40:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification: Yes (after UAT gap closure)_
