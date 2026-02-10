---
phase: 14-collection-data-model-viewing
plan: 01
subsystem: collections
tags: [data-model, firestore, singleton-pattern]
dependency-graph:
  requires: [phase-6-economy, firebase-firestore]
  provides: [collections-manager-singleton, card-definitions-config, collection-persistence]
  affects: [phase-15-card-acquisition, phase-16-notification-dot]
tech-stack:
  added: [CollectionsManager, collectionConfig]
  patterns: [registry-singleton, firestore-merge, default-state-initialization]
key-files:
  created:
    - src/game/collectionConfig.ts
    - src/game/CollectionsManager.ts
  modified:
    - src/firebase/firestore.ts
    - src/main.ts
decisions:
  - "CollectionsManager does NOT extend EventEmitter yet (Phase 16 will add notification dot events)"
  - "Collection state stored as nested map in existing user document (not subcollection)"
  - "Default state uses empty owned_cards arrays with pity_streak: 0"
  - "Card rarity distribution: 2 common + 2 rare + 1 epic + 1 legendary per collection"
metrics:
  duration: 156
  tasks: 2
  files: 4
  completed: 2026-02-10
---

# Phase 14 Plan 01: Collection Data Model Summary

**One-liner:** Collection state management with 18 card definitions (3 collections × 6 cards), CollectionsManager singleton following EconomyManager pattern, and Firestore persistence with merge semantics.

## Objective Achieved

Created the foundational data layer for the collections feature:
- Static card definitions config with 18 cards across 3 collections (coffee, food, car)
- CollectionsManager singleton accessible via registry for collection state queries and mutations
- Firestore persistence layer with saveCollections/loadCollections methods using merge semantics
- Integrated into app startup following proven EconomyManager initialization pattern

This establishes the data foundation that Phase 14 Plan 02 (Collections UI scene) will render and Phase 15 (card acquisition) will mutate.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create card definitions config and CollectionsManager with Firestore persistence | d12886a | src/game/collectionConfig.ts, src/game/CollectionsManager.ts, src/firebase/firestore.ts |
| 2 | Wire CollectionsManager into app startup | c74c55b | src/main.ts |

## Implementation Details

### Card Definitions Config (collectionConfig.ts)

**18 cards total** with correct rarity distribution:
- Coffee collection: 6 cards (Еспресо, Американо, Лате, Капучіно, Флет Вайт, Раф)
- Food collection: 6 cards (Хот-дог, Круасан, Бургер, Піца, Комбо, KLO Хот-дог)
- Car collection: 6 cards (Червоне авто, Синє авто, Позашляховик, Аутлендер, Спорткар, Люкс авто)

Each collection has exactly: **2 common + 2 rare + 1 epic + 1 legendary**

**Exports:**
- `CardRarity`, `CardDefinition`, `CollectionMeta` types
- `CARD_DEFINITIONS`: Record<string, CardDefinition> with all 18 cards
- `COLLECTION_META`: Record<string, CollectionMeta> with 3 collections
- `getCardsForCollection()`, `getCollectionIds()`, `getCollectionMeta()` helper functions

### CollectionsManager Singleton

**Pattern:** Follows EconomyManager architecture but does NOT extend EventEmitter yet (Phase 16).

**Query Methods:**
- `isCardOwned(collectionId, cardId)`: Check if card is owned
- `getOwnedCards(collectionId)`: Get array of owned card IDs
- `getProgress(collectionId)`: Get { owned, total } progress object
- `isCollectionComplete(collectionId)`: Check if all 6 cards owned
- `getState()`: Get shallow copy of collection state

**Mutation Methods:**
- `addCard(collectionId, cardId)`: Add card with duplicate check, save to Firestore
  - Returns false if already owned
  - Phase 15 will use this for card acquisition

**Persistence:**
- Private `save()` method calls `firestoreService.saveCollections()`

### Firestore Persistence Layer

**New interfaces added to firestore.ts:**
```typescript
export interface CollectionProgress {
  owned_cards: string[];
  pity_streak: number;  // For Phase 15
}

export interface CollectionState {
  collections: {
    [key: string]: CollectionProgress;
  };
}
```

**New methods on FirestoreService:**
- `saveCollections(uid, state)`: Saves to users/{uid} document with `{ merge: true }`
- `loadCollections(uid)`: Returns CollectionState or null if no document exists
  - Returns default state if document exists but collections field missing
  - Default state: empty owned_cards arrays with pity_streak: 0 for all 3 collections

**Storage pattern:** Collection state stored as nested map inside existing user document (NOT a subcollection). Uses merge semantics to avoid overwriting progress/economy fields.

### App Startup Wiring (main.ts)

**Initialization sequence** (after EconomyManager, before SettingsManager):
1. Load collection state from Firestore
2. If no state exists (new user), create default empty state and save
3. Create CollectionsManager singleton with loaded state
4. Register in Phaser registry as 'collections'

**Registry access pattern:** `game.registry.get('collections')` returns CollectionsManager instance in any scene.

## Deviations from Plan

None - plan executed exactly as written.

## Success Criteria Met

- [x] CollectionsManager singleton created and registered in Phaser registry
- [x] 18 card definitions with correct rarity distribution (2c/2r/1e/1l per collection)
- [x] Firestore persistence with saveCollections/loadCollections methods
- [x] Default state for new users (empty owned_cards, pity_streak: 0)
- [x] TypeScript compiles without errors
- [x] App initializes successfully with CollectionsManager logs visible

## Verification Results

**1. TypeScript compilation:** PASS (no errors)

**2. Card definitions count:**
- Total cards: 18
- Coffee collection: 6 cards
- Food collection: 6 cards
- Car collection: 6 cards

**3. Rarity distribution verification:**
Each collection has exactly 2 common + 2 rare + 1 epic + 1 legendary cards as specified.

**4. Exports verification:**
- collectionConfig.ts: CardRarity, CardDefinition, CollectionMeta, CARD_DEFINITIONS, COLLECTION_META, helper functions
- CollectionsManager.ts: CollectionsManager class
- firestore.ts: CollectionState, CollectionProgress interfaces, saveCollections/loadCollections methods

**5. App startup:** Dev server starts successfully on port 5177

## Next Steps

**Phase 14 Plan 02:** Create Collections UI scene
- Render card grid with placeholder sprites
- Show collection progress (X/6 cards)
- Display owned vs locked states
- Wire into persistent navigation shell

**Phase 15:** Card acquisition system
- Win screen card reveal with rarity-weighted random selection
- Pity system implementation (streak tracking)
- Duplicate handling with bonus conversion

**Phase 16:** Notification dot for Collections tab
- Extend CollectionsManager with EventEmitter
- Emit 'new-card' event on addCard()
- UIScene listens and shows/hides notification dot

## Self-Check: PASSED

**Created files exist:**
- FOUND: src/game/collectionConfig.ts
- FOUND: src/game/CollectionsManager.ts

**Modified files exist:**
- FOUND: src/firebase/firestore.ts
- FOUND: src/main.ts

**Commits exist:**
- FOUND: d12886a (Task 1: collection data model with Firestore persistence)
- FOUND: c74c55b (Task 2: wire CollectionsManager into app startup)

**TypeScript compilation:** PASS

All artifacts delivered as specified in plan must_haves.
