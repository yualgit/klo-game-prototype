# Phase 14: Collection Data Model & Viewing - Research

**Researched:** 2026-02-10
**Domain:** Collection card system data model, Firestore persistence, Phaser 3 scrollable UI layouts
**Confidence:** HIGH

## Summary

Phase 14 establishes the collection viewing infrastructure: a CollectionsManager singleton for data model and persistence, enhanced Collections scene with scrollable vertical layout displaying 3 collections (Coffee/Food/Cars), and Firestore schema for card inventory tracking. Each collection shows name, reward description, 6-card grid with grayscale silhouette for uncollected cards, and progress tracking (X/6).

The technical foundation builds on proven project patterns: Manager singleton in registry (like EconomyManager), Firestore merge-based persistence, camera scrolling for vertical layouts (proven in Phase 9's LevelSelect), and Phaser's built-in shader pipeline for grayscale effects.

**Primary recommendation:** Use native Phaser camera scrolling (no plugins needed), extend existing Firestore schema with nested `collections` map (avoid subcollections for card arrays), implement grayscale via custom pipeline or tint approximation, store card rarity metadata as TypeScript string literal unions (not enums) for zero JS bundle cost.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser | 3.90.0 | Game engine with camera scrolling and shader support | Already in project, camera scrolling proven in Phase 9 |
| TypeScript | 5.7.0 | Type safety for collection data model | Project standard, prevents data model bugs |
| Firebase Firestore | 11.0.0 | Collection state persistence | Already integrated, proven pattern from EconomyManager |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | - | All features built-in | Camera scrolling, grayscale effects, and data persistence use Phaser + Firebase APIs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Camera scrolling | phaser3-rex-plugins ScrollablePanel | Rex UI adds 15KB+ and is designed for UI panels with masks; camera scrolling simpler for full-scene vertical scroll |
| String literal unions | TypeScript enums | Enums emit JS code (bundle bloat); string unions are type-only with zero runtime cost |
| Nested Firestore map | Firestore subcollection | Subcollections add query complexity and don't auto-delete with parent; nested map simpler for <20 items |
| Custom grayscale pipeline | CSS filter via DOM overlay | DOM layer breaks Phaser rendering model; pipeline is native and GPU-accelerated |

**Installation:**
```bash
# No additional packages needed - all features built into Phaser 3.90.0 + Firebase 11.0.0
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── game/
│   └── CollectionsManager.ts    # Singleton: card inventory + Firestore persistence
├── scenes/
│   └── Collections.ts            # Enhanced scene with scrollable collection grid
├── firebase/
│   └── firestore.ts              # Add CollectionState interface + save/load methods
└── assets/collections/
    ├── coffee/                   # 6 card PNGs (01_espresso.png, etc.)
    ├── food/                     # 6 card PNGs
    └── car/                      # 6 card PNGs
```

### Pattern 1: Manager Singleton in Registry

**What:** CollectionsManager extends no base class, stores collection state, exposes card inventory queries, persists to Firestore via FirestoreService.

**When to use:** When state must be shared across scenes and persisted to backend.

**Example:**
```typescript
// Proven pattern from EconomyManager
export class CollectionsManager {
  private firestoreService: FirestoreService;
  private uid: string;
  private state: CollectionState;

  constructor(firestoreService: FirestoreService, uid: string, initialState: CollectionState) {
    this.firestoreService = firestoreService;
    this.uid = uid;
    this.state = initialState;
  }

  getOwnedCards(collectionId: string): string[] {
    return this.state.collections[collectionId]?.owned_cards || [];
  }

  getProgress(collectionId: string): { owned: number; total: number } {
    const owned = this.getOwnedCards(collectionId).length;
    return { owned, total: 6 };
  }

  private async save(): Promise<void> {
    await this.firestoreService.saveCollections(this.uid, this.state);
  }
}

// In main.ts (same pattern as EconomyManager):
const collectionsManager = new CollectionsManager(firestoreService, uid, collectionState);
game.registry.set('collections', collectionsManager);

// In scene:
const collections = this.registry.get('collections') as CollectionsManager;
const progress = collections.getProgress('coffee');
```

**Source:** Project pattern from `/src/game/EconomyManager.ts` and `/src/game/ProgressManager.ts`

### Pattern 2: Camera Scrolling for Vertical Layout

**What:** Extend camera bounds beyond viewport height, scroll camera position on pointer drag. Collections stack vertically within scrollable world.

**When to use:** Full-scene scrolling (not just a UI panel).

**Example:**
```typescript
// Proven pattern from Phase 9 LevelSelect scene
create(): void {
  const width = this.cameras.main.width;
  const height = this.cameras.main.height;

  // Calculate total height needed for 3 collections
  const collectionHeight = cssToGame(500); // ~500px per collection
  const worldHeight = collectionHeight * 3 + cssToGame(100); // +padding

  // Extend camera bounds
  this.cameras.main.setBounds(0, 0, width, worldHeight);

  // Create collections at stacked Y positions
  this.createCollection('coffee', 0, cssToGame(50));
  this.createCollection('food', 0, cssToGame(50) + collectionHeight);
  this.createCollection('car', 0, cssToGame(50) + collectionHeight * 2);

  // Setup drag scrolling
  this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
    if (pointer.isDown) {
      const deltaY = pointer.y - pointer.prevPosition.y;
      this.cameras.main.scrollY -= deltaY;
    }
  });
}
```

**Source:** Project pattern from `/src/scenes/LevelSelect.ts` (Phase 9), documented in `.planning/phases/09-kyiv-map-experience/09-RESEARCH.md`

### Pattern 3: Firestore Nested Map for Card Inventory

**What:** Store collections as nested map in user document: `users/{uid}/collections/{collectionId}/owned_cards[]`. Avoids subcollections.

**When to use:** When data size is <1MB per document and <20 items in array.

**Example:**
```typescript
// Firestore schema (users/{uid} document)
interface CollectionState {
  collections: {
    coffee: {
      owned_cards: string[];      // ['coffee_01', 'coffee_02', ...]
      pity_streak: number;         // For Phase 15
    };
    food: {
      owned_cards: string[];
      pity_streak: number;
    };
    car: {
      owned_cards: string[];
      pity_streak: number;
    };
  };
}

// FirestoreService (add to existing firestore.ts)
async saveCollections(uid: string, state: CollectionState): Promise<void> {
  const userDocRef = doc(this.db, 'users', uid);
  await setDoc(
    userDocRef,
    { collections: state.collections },
    { merge: true }
  );
}

async loadCollections(uid: string): Promise<CollectionState | null> {
  const userDocRef = doc(this.db, 'users', uid);
  const docSnap = await getDoc(userDocRef);
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    collections: data.collections || {
      coffee: { owned_cards: [], pity_streak: 0 },
      food: { owned_cards: [], pity_streak: 0 },
      car: { owned_cards: [], pity_streak: 0 },
    },
  };
}
```

**Why nested map over subcollection:**
- Firestore documents support up to 1MB (18 cards × 3 collections × ~50 bytes = ~2.7KB, well under limit)
- Single read operation vs. 3 subcollection queries
- Atomic updates via merge
- Auto-deleted when user document deleted
- Simpler queries

**Source:** [Firebase: Choose a data structure](https://firebase.google.com/docs/firestore/manage-data/structure-data), [Arrays vs subcollections](https://saturncloud.io/blog/arrays-vs-maps-vs-subcollections-for-a-set-of-objects-on-cloud-firestore/)

### Pattern 4: Grayscale Effect for Uncollected Cards

**What:** Display uncollected cards as grayscale silhouette. Two implementation options.

**When to use:** Visual distinction between owned and missing cards.

**Option A: Tint Approximation (simple, good enough for silhouettes)**
```typescript
// Fast, no shader needed
const cardSprite = this.add.image(x, y, 'coffee_01');
if (!isOwned) {
  cardSprite.setTint(0x808080); // Gray tint
  cardSprite.setAlpha(0.4);     // Reduced opacity
}
```

**Option B: Custom Grayscale Pipeline (true grayscale)**
```typescript
// Register pipeline once in Boot scene
const grayscaleFrag = `
precision mediump float;
uniform sampler2D uMainSampler;
varying vec2 outTexCoord;
void main(void) {
  vec4 color = texture2D(uMainSampler, outTexCoord);
  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  gl_FragColor = vec4(vec3(gray), color.a);
}
`;

this.renderer.pipelines.add('Grayscale', new Phaser.Renderer.WebGL.Pipelines.SinglePipeline({
  game: this.game,
  fragShader: grayscaleFrag,
}));

// Apply to sprite
const cardSprite = this.add.image(x, y, 'coffee_01');
if (!isOwned) {
  cardSprite.setPipeline('Grayscale');
}
```

**Recommendation:** Use Option A (tint) for this phase unless client requires true grayscale. Tint is simpler, sufficient for silhouette effect, and WebGL-compatible fallback.

**Source:** [Phaser grayscale shader](https://www.stephengarside.co.uk/blog/phaser-3-black-and-white-or-greyscale-sprites/), [Rex UI grayscale](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/shader-grayscale/)

### Pattern 5: Card Rarity as String Literal Union

**What:** Define rarity as TypeScript union type, not enum. Zero JS bundle cost.

**When to use:** When you need type safety for predefined string values.

**Example:**
```typescript
// Don't use enum (emits JS code):
// enum Rarity { COMMON = 'common', RARE = 'rare', ... } // BAD

// Use string literal union (type-only, zero JS):
export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary'; // GOOD

// Card metadata config
interface CardDefinition {
  id: string;
  rarity: CardRarity;
  collectionId: string;
  textureKey: string;
  nameUk: string;
}

const CARD_DEFINITIONS: Record<string, CardDefinition> = {
  coffee_01: { id: 'coffee_01', rarity: 'common', collectionId: 'coffee', textureKey: 'coffee/01_espresso', nameUk: 'Еспресо' },
  coffee_02: { id: 'coffee_02', rarity: 'common', collectionId: 'coffee', textureKey: 'coffee/02_americano', nameUk: 'Американо' },
  coffee_03: { id: 'coffee_03', rarity: 'rare', collectionId: 'coffee', textureKey: 'coffee/03_latte', nameUk: 'Лате' },
  // ... etc.
};

// Rarity distribution per collection (for Phase 15 drop logic)
const RARITY_DISTRIBUTION: Record<CardRarity, number> = {
  common: 2,    // 2 common cards per collection
  rare: 2,      // 2 rare
  epic: 1,      // 1 epic
  legendary: 1, // 1 legendary
};
```

**Why string literals over enums:**
- String literals don't emit JS (TypeScript type-only)
- Enums emit JS objects and increase bundle size
- String literals can be extended via union (`type ExtendedRarity = CardRarity | 'mythic'`)
- No import needed to use string values (just type annotations)

**Source:** [TypeScript: Enums vs String Literal Unions](https://www.typescriptcourse.com/string-literal-unions-over-enums), [Union Types vs Enums](https://medium.com/@soroushysf/union-types-vs-enums-in-typescript-choosing-the-right-approach-for-your-codebase-dcc7238b3522)

### Anti-Patterns to Avoid

- **Subcollections for card arrays:** Adds query complexity, requires separate deletes, overkill for <20 items per collection. Use nested map instead.
- **Rex UI plugin for full-scene scroll:** Camera scrolling is simpler and proven in Phase 9. Rex UI is for masked panels with scroll bars, not full-scene vertical layouts.
- **TypeScript enums for rarity:** Enums emit JS code and increase bundle. String literal unions are type-only.
- **Storing card metadata in Firestore:** Card names, textures, rarity are static config, not user state. Store only `owned_cards[]` array in Firestore.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Vertical scrolling | Custom scroll container with mask + drag | Phaser camera scrolling | Camera bounds + scrollY already implemented in LevelSelect (Phase 9), handles edge cases like momentum, bounds clamping |
| Grayscale effect | Canvas pixel manipulation | Phaser tint or pipeline | Tint is GPU-accelerated and one-liner; pipelines are reusable |
| Card rarity distribution | Custom random picker with weights | Standard weighted random selection | Phase 15 will need proper pity system; weighted picker is textbook algorithm, don't reinvent |
| Firestore schema | Custom subcollection structure | Firebase official patterns | Firestore docs provide battle-tested schemas for nested arrays vs subcollections |

**Key insight:** This phase is 80% data modeling (what to store, how to query) and 20% UI rendering (layout, grayscale). Don't over-engineer rendering — use proven camera scroll pattern from Phase 9.

## Common Pitfalls

### Pitfall 1: Firestore Subcollections Over-Engineering
**What goes wrong:** Developer creates `users/{uid}/collections/{collectionId}` subcollection, then realizes queries require 3 separate fetches and deleting user doesn't cascade-delete subcollections.

**Why it happens:** Subcollections feel "cleaner" conceptually, but Firestore charges per read and requires manual cascade deletes.

**How to avoid:** Use nested map in user document for collections with <20 items per array. Reserve subcollections for unbounded data (e.g., user's match history).

**Warning signs:** If you're writing a loop to query 3 subcollections, you should be using a nested map instead.

### Pitfall 2: Camera Scroll Bounds Too Tight
**What goes wrong:** Camera bounds exactly match content height, so last collection at bottom is cut off or inaccessible.

**Why it happens:** Camera centers on scrollY but needs padding at bottom for viewport height.

**How to avoid:** Add `height` to total world height: `worldHeight = contentHeight + this.cameras.main.height`.

**Warning signs:** Last collection only partially visible, can't scroll far enough to see bottom.

### Pitfall 3: Grayscale Pipeline Applied Multiple Times
**What goes wrong:** Pipeline registered in scene `create()` every time scene starts, causing "Pipeline already exists" errors.

**Why it happens:** Pipelines are global to the game instance, not per-scene.

**How to avoid:** Register pipeline once in Boot scene, or check `this.renderer.pipelines.has('Grayscale')` before adding.

**Warning signs:** Console errors about duplicate pipeline names after scene restart.

### Pitfall 4: Card Texture Loading Without Atlas
**What goes wrong:** Loading 18 individual card PNGs (6 per collection × 3) creates 18 separate HTTP requests and texture uploads.

**Why it happens:** Developer loads each card as separate image instead of using texture atlas.

**How to avoid:** This phase doesn't require atlas (only 18 cards), but document that Phase 15 should batch-load. For now, load collections on-demand per scene.

**Warning signs:** Network tab shows 18 separate asset requests. (Acceptable for now; optimize in Phase 15 if loading is slow.)

### Pitfall 5: Collection State Not Initialized on First Load
**What goes wrong:** `loadCollections()` returns `null`, scene crashes trying to access `state.collections.coffee`.

**Why it happens:** New users have no Firestore document yet.

**How to avoid:** CollectionsManager constructor must accept `initialState`, which is `loadCollections() ?? defaultState` from main.ts. Same pattern as EconomyManager.

**Warning signs:** Runtime error "Cannot read property 'coffee' of null" on new user first run.

## Code Examples

Verified patterns from official sources and project codebase:

### Collection Data Model
```typescript
// src/game/CollectionsManager.ts - following EconomyManager pattern
export interface CollectionProgress {
  owned_cards: string[];  // ['coffee_01', 'coffee_02', ...]
  pity_streak: number;    // For Phase 15 pity mechanic
}

export interface CollectionState {
  collections: {
    coffee: CollectionProgress;
    food: CollectionProgress;
    car: CollectionProgress;
  };
}

export class CollectionsManager {
  private firestoreService: FirestoreService;
  private uid: string;
  private state: CollectionState;

  constructor(firestoreService: FirestoreService, uid: string, initialState: CollectionState) {
    this.firestoreService = firestoreService;
    this.uid = uid;
    this.state = initialState;
  }

  isCardOwned(collectionId: string, cardId: string): boolean {
    const owned = this.state.collections[collectionId]?.owned_cards || [];
    return owned.includes(cardId);
  }

  getProgress(collectionId: string): { owned: number; total: number } {
    const owned = this.state.collections[collectionId]?.owned_cards.length || 0;
    return { owned, total: 6 };
  }

  getState(): CollectionState {
    return { ...this.state };
  }

  private async save(): Promise<void> {
    await this.firestoreService.saveCollections(this.uid, this.state);
  }
}
```

### Scrollable Collection Grid Layout
```typescript
// src/scenes/Collections.ts - camera scroll pattern from LevelSelect
create(): void {
  const width = this.cameras.main.width;
  const height = this.cameras.main.height;

  // Calculate world height for 3 collections
  const collectionHeight = cssToGame(500);
  const totalHeight = collectionHeight * 3 + cssToGame(150);
  this.cameras.main.setBounds(0, 0, width, totalHeight);

  // Create collections vertically
  const collections = ['coffee', 'food', 'car'];
  const startY = cssToGame(100); // Below UIScene header
  collections.forEach((id, index) => {
    const y = startY + index * collectionHeight;
    this.createCollectionCard(id, width / 2, y);
  });

  // Drag scrolling (same as LevelSelect)
  this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
    if (pointer.isDown && !this.overlayActive) {
      const deltaY = pointer.y - pointer.prevPosition.y;
      this.cameras.main.scrollY -= deltaY;
    }
  });
}

private createCollectionCard(collectionId: string, x: number, y: number): void {
  const collections = this.registry.get('collections') as CollectionsManager;
  const progress = collections.getProgress(collectionId);

  // Collection container
  const container = this.add.container(x, y);

  // Title
  const title = this.add.text(0, -200, this.getCollectionName(collectionId), {
    fontFamily: 'Arial, sans-serif',
    fontSize: `${cssToGame(24)}px`,
    fontStyle: 'bold',
    color: '#1a1a1a',
  });
  title.setOrigin(0.5);
  container.add(title);

  // Card grid (2 rows × 3 cols)
  const cardIds = this.getCardIds(collectionId);
  const cardSize = cssToGame(80);
  const gap = cssToGame(10);
  for (let i = 0; i < 6; i++) {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const cardX = (col - 1) * (cardSize + gap);
    const cardY = row * (cardSize + gap) - cssToGame(80);

    const cardId = cardIds[i];
    const isOwned = collections.isCardOwned(collectionId, cardId);
    const cardSprite = this.add.image(cardX, cardY, isOwned ? `${collectionId}/${cardId}` : 'blank');
    cardSprite.setDisplaySize(cardSize, cardSize);

    if (!isOwned) {
      cardSprite.setTint(0x808080);
      cardSprite.setAlpha(0.4);
      // Add "?" overlay
      const questionMark = this.add.text(cardX, cardY, '?', {
        fontSize: `${cssToGame(32)}px`,
        color: '#ffffff',
      });
      questionMark.setOrigin(0.5);
      container.add(questionMark);
    }

    container.add(cardSprite);
  }

  // Progress text
  const progressText = this.add.text(0, cssToGame(100), `${progress.owned}/6`, {
    fontFamily: 'Arial, sans-serif',
    fontSize: `${cssToGame(18)}px`,
    color: '#666666',
  });
  progressText.setOrigin(0.5);
  container.add(progressText);
}
```

### Asset Loading
```typescript
// src/scenes/Boot.ts - add to existing preload()
preload(): void {
  // ... existing assets ...

  // Collection card assets (load all 18 cards)
  const collections = ['coffee', 'food', 'car'];
  const cardCounts = [6, 6, 6]; // Each collection has 6 cards

  collections.forEach((collection, index) => {
    for (let i = 1; i <= cardCounts[index]; i++) {
      const cardId = String(i).padStart(2, '0');
      this.load.image(
        `${collection}/${cardId}`,
        `assets/collections/${collection}/${cardId}_*.png`
      );
    }
  });

  // Blank card placeholder for uncollected cards
  this.load.image('blank', 'assets/collections/blank.png');
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Firestore subcollections for all nested data | Nested maps for bounded arrays (<20 items) | Firebase docs updated 2022 | Single read instead of multiple queries; atomic updates |
| TypeScript enums for string constants | String literal unions | TypeScript 2.0 (2016), popularized 2020+ | Zero JS bundle cost vs enum objects |
| DOM overlays for grayscale | WebGL shader pipelines | Phaser 3.50+ (2020) | GPU-accelerated, no DOM/canvas context switching |
| Rex UI plugins for all scrolling | Native camera scrolling for full-scene layouts | Phaser 3 best practices 2021+ | Simpler code, fewer dependencies |

**Deprecated/outdated:**
- Firestore REST API: Use Firebase SDK 11.0.0+ (modular imports, tree-shakable)
- Phaser 2 filters: Phaser 3 uses WebGL pipelines instead (API changed in v3.0)
- `setVisible(false)` for invisible hit areas: Breaks input (documented in project MEMORY.md), use `setAlpha(0.001)` instead

## Open Questions

1. **Should card textures be atlased?**
   - What we know: 18 cards × ~50KB each = ~900KB total. Assets already exist as separate PNGs.
   - What's unclear: Whether network latency or texture memory is a concern on 3G mobile.
   - Recommendation: Load separate PNGs for Phase 14 (simpler). If loading time >2s on 3G during testing, create atlas in Phase 15.

2. **Should collections be lazy-loaded per scene entry?**
   - What we know: Collections scene may not be visited in every session.
   - What's unclear: Whether loading 18 cards upfront (Boot) or on-demand (Collections.create) is better.
   - Recommendation: Load in Boot scene alongside other assets for Phase 14 (simpler, consistent with existing pattern). Optimize in Phase 15 if performance issues arise.

3. **Should CollectionsManager emit events like EconomyManager?**
   - What we know: Phase 16 will need notification dot when collection reaches 6/6.
   - What's unclear: Whether events should be added now or in Phase 16.
   - Recommendation: Add event emission in Phase 16 when notification dot is implemented. Don't over-engineer Phase 14.

## Sources

### Primary (HIGH confidence)
- Project codebase: `/src/game/EconomyManager.ts`, `/src/game/ProgressManager.ts`, `/src/firebase/firestore.ts` - Proven manager + Firestore patterns
- Project codebase: `/src/scenes/LevelSelect.ts`, `.planning/phases/09-kyiv-map-experience/09-RESEARCH.md` - Camera scrolling pattern
- [Firebase: Choose a data structure](https://firebase.google.com/docs/firestore/manage-data/structure-data) - Official Firestore schema guidance
- [Firebase: Data model](https://firebase.google.com/docs/firestore/data-model) - Document limits and best practices

### Secondary (MEDIUM confidence)
- [Arrays vs Maps vs Subcollections](https://saturncloud.io/blog/arrays-vs-maps-vs-subcollections-for-a-set-of-objects-on-cloud-firestore/) - Practical tradeoffs verified with official docs
- [TypeScript: String Literal Unions Over Enums](https://www.typescriptcourse.com/string-literal-unions-over-enums) - Bundle size comparison
- [Phaser 3 Grayscale Sprites](https://www.stephengarside.co.uk/blog/phaser-3-black-and-white-or-greyscale-sprites/) - Shader implementation example
- [Rex UI: Gray scale shader](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/shader-grayscale/) - Alternative implementation reference

### Tertiary (LOW confidence)
- [Card Rarity Systems in TCGs](https://www.hicreategames.com/card-rarity-systems-how-to-implement-them-in-your-tcg/) - Game design context (not implementation)
- [Rex UI: Scrollable Panel](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/ui-scrollablepanel/) - Noted as alternative but not recommended for this use case

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Phaser 3.90, Firebase 11.0, TypeScript 5.7 already in project
- Architecture: HIGH - Manager pattern, Firestore schema, camera scrolling all proven in existing phases
- Pitfalls: HIGH - Subcollection issues, pipeline registration, scroll bounds all verified in official docs + project history

**Research date:** 2026-02-10
**Valid until:** 2026-03-12 (30 days for stable APIs; Phaser 3.90 and Firebase 11 are mature)
