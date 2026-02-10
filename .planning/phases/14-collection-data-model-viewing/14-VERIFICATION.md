---
phase: 14-collection-data-model-viewing
verified: 2026-02-10T14:30:00Z
status: human_needed
score: 5/5
re_verification: false
human_verification:
  - test: "Visual verification of 3 collections with scrollable layout"
    expected: "All 3 collections (Coffee/Food/Cars) visible with smooth drag scrolling"
    why_human: "Scrolling behavior and visual layout require human testing"
  - test: "Card visual states for unowned cards"
    expected: "All cards show as grayscale with 0x808080 tint, alpha 0.4, and centered '?' text"
    why_human: "Grayscale visual appearance and overlay positioning need visual confirmation"
  - test: "UIScene integration across scenes"
    expected: "Header (lives/bonuses/settings) and bottom nav (Levels/Collections/Shop) visible and functional"
    why_human: "Cross-scene navigation and UI persistence requires interactive testing"
  - test: "Portrait aspect ratio preservation"
    expected: "Card images display at 696:1158 aspect ratio (not square), no distortion"
    why_human: "Visual aspect ratio accuracy requires human inspection"
  - test: "Firestore persistence after refresh"
    expected: "Collection state (currently 0/6 for all) restored correctly after app refresh"
    why_human: "Persistence across app reloads requires browser refresh testing"
---

# Phase 14: Collection Data Model & Viewing Verification Report

**Phase Goal:** Collection screen shows all 3 collections with card inventory and progress tracking  
**Verified:** 2026-02-10T14:30:00Z  
**Status:** human_needed  
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Collections screen shows 3 collections (Coffee/Food/Cars) on scrollable page | ✓ VERIFIED | Collections.ts lines 104-196: iterates `getCollectionIds()` rendering 3 collection blocks with camera bounds set for scroll |
| 2 | Each collection displays name, reward description, 6-card grid, and progress X/6 | ✓ VERIFIED | Collections.ts lines 110-193: renders nameUk (L110), rewardDescription (L122), 6-card loop (L136-177), progress text (L182-193) |
| 3 | Uncollected cards shown as grayscale silhouette with "?" overlay | ✓ VERIFIED | Collections.ts lines 160-175: unowned cards use setTint(0x808080), setAlpha(0.4), with "?" text overlay at card center |
| 4 | Each collection has 6 cards with correct rarity (2 common, 2 rare, 1 epic, 1 legendary) | ✓ VERIFIED | collectionConfig.ts lines 54-186: CARD_DEFINITIONS defines 18 cards, verified distribution per collection |
| 5 | Collection progress persists after app refresh (Firestore restores state correctly) | ✓ VERIFIED | main.ts lines 86-105: loadCollections() at startup, default state creation for new users, CollectionsManager.save() calls saveCollections() with merge |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/scenes/Boot.ts` | Card texture loading (18 card PNGs + blank placeholder) | ✓ VERIFIED | Lines 109-135: loads 18 collection card images plus blank.png with correct texture keys |
| `src/scenes/Collections.ts` | Full collection viewing UI with scrollable grid layout | ✓ VERIFIED | 257 lines: complete scene with buildCollectionsUI(), setupDragScrolling(), UIScene integration, resize handling |
| `src/game/CollectionsManager.ts` | Collection state management singleton | ✓ VERIFIED | 116 lines: isCardOwned(), getProgress(), addCard() methods, Firestore persistence via save() |
| `src/game/collectionConfig.ts` | Static card definitions and collection metadata | ✓ VERIFIED | 210 lines: CARD_DEFINITIONS (18 cards), COLLECTION_META (3 collections), helper functions |
| `src/firebase/firestore.ts` | saveCollections/loadCollections methods | ✓ VERIFIED | Lines 162-205: saveCollections() with merge semantics, loadCollections() with default state handling |
| `src/main.ts` | CollectionsManager initialization wiring | ✓ VERIFIED | Lines 86-105, 119: loads state, creates manager, registers in Phaser registry |
| Card image assets | 18 card PNGs + blank.png | ✓ VERIFIED | 6 coffee + 6 food + 6 car + 1 blank PNG files exist in public/assets/collections/ |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| Collections.ts | CollectionsManager | registry.get('collections') | ✓ WIRED | Line 74: retrieves manager, calls isCardOwned() (L143), getProgress() (L107) |
| Collections.ts | collectionConfig | imports card definitions | ✓ WIRED | Lines 10-16: imports getCollectionIds, getCollectionMeta, getCardsForCollection, uses in rendering loop |
| Boot.ts | card textures | this.load.image for 18 cards | ✓ WIRED | Lines 111-135: 19 load.image() calls (18 cards + blank) matching CARD_DEFINITIONS textureKey values |
| CollectionsManager | FirestoreService | saveCollections/loadCollections | ✓ WIRED | CollectionsManager line 113: save() calls firestoreService.saveCollections(); main.ts line 86: loadCollections() |
| main.ts | CollectionsManager | new CollectionsManager + registry.set | ✓ WIRED | Lines 103, 119: instantiates CollectionsManager, registers in Phaser registry as 'collections' |
| CollectionsManager | collectionConfig | imports for validation | ✓ WIRED | Line 10: imports getCardsForCollection, used in getProgress() method (L53) |

### Requirements Coverage

All Phase 14 requirements from ROADMAP.md success criteria:

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Collections screen shows 3 collections on scrollable page | ✓ SATISFIED | Collections.ts implements vertical scroll with camera bounds, renders 3 collections |
| Each collection displays name, reward, 6-card grid, progress X/6 | ✓ SATISFIED | All elements rendered in buildCollectionsUI() loop |
| Uncollected cards grayscale with "?", collected in full color | ✓ SATISFIED | Conditional rendering based on isCardOwned() with tint/alpha for unowned |
| 6 cards per collection with correct rarity distribution | ✓ SATISFIED | CARD_DEFINITIONS verified: 2 common + 2 rare + 1 epic + 1 legendary per collection |
| Collection progress persists after app refresh | ✓ SATISFIED | Firestore integration with merge semantics, loadCollections() at startup |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| Collections.ts | 244 | console.log in showSettings() | ℹ️ Info | Stub for settings overlay — acceptable placeholder, not a blocker |

No blocker or warning anti-patterns found. The console.log in showSettings() is an acceptable stub as settings overlay is not in Phase 14 scope.

### Human Verification Required

#### 1. Visual verification of 3 collections with scrollable layout

**Test:** Run `npm run dev`, navigate to Collections tab via bottom nav. Drag scroll vertically to view all 3 collections.

**Expected:** 
- All 3 collections (Coffee "Кава", Food "Їжа", Cars "Авто") visible
- Drag scrolling works smoothly with finger/mouse
- Last collection (Cars) fully accessible at bottom without cutting off
- UIScene header and bottom nav remain visible during scroll

**Why human:** Scrolling behavior, smooth drag interaction, and visual layout positioning require interactive testing.

#### 2. Card visual states for unowned cards

**Test:** Inspect each collection's 6-card grid (new user has 0 owned cards).

**Expected:**
- All cards show grayscale appearance (not bright colors)
- Cards have 0x808080 tint with alpha 0.4 (semi-transparent gray)
- White "?" text centered on each card (fontSize cssToGame(28)px, bold)
- Card aspect ratio preserved (portrait, not square)
- Progress shows "0/6" below each collection grid

**Why human:** Grayscale visual appearance, overlay positioning, and aspect ratio accuracy require visual inspection.

#### 3. UIScene integration across scenes

**Test:** Navigate between tabs: Collections → Levels → Shop → Collections.

**Expected:**
- Header (lives count, bonuses count, settings gear) always visible at top
- Bottom nav (Levels/Collections/Shop) always visible at bottom
- Active tab shows visual highlight (collections tab when on Collections scene)
- Navigation transitions work without errors or flashing

**Why human:** Cross-scene navigation behavior and UI persistence require interactive testing.

#### 4. Portrait aspect ratio preservation

**Test:** Inspect card image display size and proportions.

**Expected:**
- Cards display at 80px CSS width (via cssToGame(80))
- Card height = width * (1158/696) ≈ 133px (portrait ratio, not square)
- Card images not stretched or squished
- Gap between cards is 12px CSS (via cssToGame(12))

**Why human:** Visual aspect ratio accuracy and spacing require human measurement/inspection.

#### 5. Firestore persistence after refresh

**Test:** Refresh browser page (F5 or Cmd+R), navigate back to Collections.

**Expected:**
- Collection state restored: all cards still show 0/6 progress (for new user)
- No errors in console related to Firestore or CollectionsManager
- App initializes with logs: "[Main] Collections loaded: {...}" and "[Main] CollectionsManager initialized"

**Why human:** Persistence across app reloads requires browser refresh testing and console inspection.

### Gaps Summary

No gaps found. All automated verification checks passed:

1. **All 5 observable truths verified** — Collections UI renders correctly with all required elements
2. **All 7 artifacts verified** — Code files, exports, and card assets exist and are substantive (not stubs)
3. **All 6 key links verified** — Components properly wired: UI → Manager → Config → Firestore → Registry
4. **All 5 requirements satisfied** — ROADMAP success criteria met
5. **No blocker anti-patterns** — Only one info-level console.log stub for future settings overlay
6. **TypeScript compilation passes** — No compilation errors

**Phase 14 achieves its goal.** The Collections scene shows all 3 collections with card inventory (currently 0/6 for new users) and progress tracking. All data model components (CollectionsManager, collectionConfig, Firestore persistence) are implemented and wired correctly.

**Human verification recommended** to confirm visual appearance (grayscale cards, scrolling UX, aspect ratio) and cross-scene navigation behavior before proceeding to Phase 15.

---

_Verified: 2026-02-10T14:30:00Z_  
_Verifier: Claude (gsd-verifier)_
