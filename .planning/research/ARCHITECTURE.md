# Architecture Patterns: Collection Cards, Persistent UI, Art Pipeline

**Domain:** Match-3 with collection card meta-progression and persistent navigation UI
**Researched:** 2026-02-10
**Confidence:** HIGH

---

## Executive Summary

Integration of collection cards, bottom navigation, global header, and art pipeline upgrades into existing Phaser 3 match-3 architecture requires **three new major components** and **modifications to existing scene lifecycle**. The research identifies proven Phaser patterns for persistent UI (dedicated UI scene pattern), singleton manager architecture for collections (consistent with existing ProgressManager/EconomyManager), and art pipeline considerations for higher-resolution sprites.

**Critical architectural decision:** Persistent UI elements (bottom nav, global header) should live in a **dedicated UI Scene** running parallel to game scenes, NOT recreated per-scene. This prevents duplication and maintains state across transitions.

**Integration complexity:** MEDIUM. New systems integrate cleanly with existing registry-based singleton pattern. Main risk: scene lifecycle coordination between UI scene and game scenes.

---

## Current Architecture (Baseline)

### Scene Flow
```
Boot → Menu → LevelSelect → Game
         ↑_______________|
```

**Characteristics:**
- Linear scene transitions via `scene.start()` (destroys previous scene)
- Each scene recreates UI elements in `create()`
- Camera fade transitions (300ms black fade)
- No scene parallelism currently

### Singleton Manager Pattern
```
main.ts:
  ├─ initFirebase() → FirestoreService
  ├─ ProgressManager(firestoreService, uid, progress)
  ├─ EconomyManager(firestoreService, uid, economy)
  ├─ SettingsManager(localStorage)
  └─ game.registry.set('progress'|'economy'|'settings', manager)

Scenes access via:
  const progress = this.registry.get('progress') as ProgressManager
```

**Storage:**
- Firestore: user progress, economy, (future: collection cards)
- localStorage: settings only

### Overlay Pattern (Current)
```typescript
// LevelSelect.ts, Game.ts pattern for modals
private overlayElements: Phaser.GameObjects.GameObject[] = [];

showOverlay() {
  this.overlayActive = true; // Block scene input
  const backdrop = this.add.graphics()...;
  overlayElements.push(backdrop, panel, buttons...);
}

closeOverlay() {
  overlayElements.forEach(el => el.destroy());
  this.overlayActive = false;
}
```

**Limitations:**
- Overlays destroyed on scene transition
- Cannot persist across scenes (e.g., notification banner)
- Each scene reimplements overlay logic

### Asset Loading (Current)
```typescript
// Boot.ts
this.load.image('tile_fuel_can', 'assets/tiles/fuel_can.png');
this.load.image('obstacle_ice01', 'assets/blockers/ice01.png');
```

**Characteristics:**
- All assets loaded upfront in Boot scene
- PNG sprites loaded as-is (no atlases)
- DPR-aware rendering (zoom: 1/dpr, capped at 2x)

---

## Recommended Architecture: Collection Cards System

### Component: CollectionManager Singleton

**Responsibility:** Card inventory, drop probability, unlock tracking, Firestore persistence

```typescript
// src/game/CollectionManager.ts
export class CollectionManager {
  private firestoreService: FirestoreService;
  private uid: string;
  private inventory: CardInventory; // { [cardId]: { count, unlocked_at } }
  private metadata: CardMetadata[];  // Static card definitions

  constructor(firestoreService, uid, inventory, metadata) {...}

  // Card drop logic
  rollForCard(context: DropContext): CardDrop | null {
    // context: { levelId, stars, isFirstWin, ... }
    // Probability engine: weighted random, pity counter
  }

  // Inventory management
  hasCard(cardId: string): boolean {...}
  getCardCount(cardId: string): number {...}
  addCard(cardId: string): void {...}

  // Firestore persistence
  async saveInventory(): Promise<void> {...}

  // Card metadata queries
  getCardsByRarity(rarity: CardRarity): Card[] {...}
  getCollectionProgress(): { owned: number, total: number } {...}
}
```

**Integration points:**
1. **Initialization:** Load in `main.ts` alongside ProgressManager
   ```typescript
   const cardMetadata = await fetch('/data/cards.json').then(r => r.json());
   const cardInventory = await firestoreService.loadCardInventory(uid);
   const collectionManager = new CollectionManager(firestoreService, uid, cardInventory, cardMetadata);
   game.registry.set('collection', collectionManager);
   ```

2. **Drop trigger:** Game scene win overlay
   ```typescript
   // Game.ts - in showVictoryOverlay()
   const collection = this.registry.get('collection') as CollectionManager;
   const drop = collection.rollForCard({
     levelId,
     stars,
     isFirstWin: !progress.getStars(levelId)
   });
   if (drop) {
     this.showCardDropAnimation(drop);
     await collection.saveInventory();
   }
   ```

3. **Viewing:** New scene or overlay
   - Option A: `CollectionScene` (full screen, launched from menu)
   - Option B: Collection button in persistent bottom nav → overlay

**Probability Engine Pattern:**

```typescript
interface DropContext {
  levelId: number;
  stars: number;
  isFirstWin: boolean;
  pityCounter: number; // Increments on no-drop, resets on drop
}

interface CardRarity {
  type: 'common' | 'rare' | 'epic' | 'legendary';
  baseDropRate: number; // 0.0-1.0
}

rollForCard(context: DropContext): CardDrop | null {
  // 1. Check if drop occurs (base rate + pity modifier)
  const dropChance = this.calculateDropChance(context);
  if (Math.random() > dropChance) {
    this.pityCounter++;
    return null;
  }

  // 2. Select rarity tier (weighted random)
  const rarity = this.selectRarity();

  // 3. Select card from rarity pool (avoid duplicates, weighted by theme)
  const card = this.selectCardFromPool(rarity, context);

  this.pityCounter = 0; // Reset pity
  return { card, isNew: !this.hasCard(card.id) };
}
```

**Pity System:**
- Common pattern: guarantee drop after N consecutive no-drops
- Example: 5 wins without drop → 100% drop on 6th win
- Implementation: `pityCounter` in Firestore, checked in `calculateDropChance()`

**Firestore Schema:**

```typescript
// Collection: users/{uid}
interface UserDoc {
  // ... existing progress, economy fields ...
  card_inventory: {
    [cardId: string]: {
      count: number;
      unlocked_at: Timestamp;
    }
  };
  card_pity_counter: number;
}

// Collection: card_metadata (static, shared across users)
interface CardDoc {
  id: string; // 'kyiv_fuel_01', 'lviv_coffee_02'
  name: string; // 'Києва заправка'
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  theme: 'kyiv' | 'lviv' | 'fuel' | 'coffee'; // For thematic drops
  art_url: string; // 'assets/cards/kyiv_fuel_01.png'
}
```

**Why subcollection vs nested field:**
- **Nested field** (card_inventory as map): RECOMMENDED for this use case
  - Pros: Atomic updates, single document read, simpler queries
  - Cons: 1MB document size limit (not a concern for ~100 cards)
- **Subcollection** (users/{uid}/cards/{cardId}):
  - Only needed if 100+ cards or cards have complex nested data

**Sources:**
- [Firestore Data Structure](https://firebase.google.com/docs/firestore/manage-data/structure-data)
- [Firestore Data Model](https://cloud.google.com/firestore/docs/concepts/structure-data)

---

## Recommended Architecture: Persistent UI Navigation

### Component: UI Scene (Dedicated Persistent Layer)

**Pattern:** Parallel UI scene that runs alongside game scenes, managing persistent navigation elements.

**Justification:** Phaser best practice for persistent UI is a **dedicated UI scene** rendered above game scenes. From official patterns:
> "A common practice is to have a Scene dedicated entirely to handling the UI for your game, that is rendered above all other Scenes."

**Architecture:**

```typescript
// src/scenes/UIOverlay.ts
export class UIOverlay extends Phaser.Scene {
  private bottomNav: Phaser.GameObjects.Container;
  private globalHeader: Phaser.GameObjects.Container;
  private activeSceneName: string;

  constructor() {
    super({ key: 'UIOverlay', active: false });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Create bottom navigation bar (60px height)
    this.createBottomNav(width, height);

    // Create global header (lives/bonuses HUD, 80px height)
    this.createGlobalHeader(width);

    // Fixed to camera, depth above all game content
    this.bottomNav.setScrollFactor(0).setDepth(1000);
    this.globalHeader.setScrollFactor(0).setDepth(1000);

    // Listen for scene transitions to update visibility
    this.game.events.on('scenechange', this.handleSceneChange, this);

    // Register resize handler
    this.scale.on('resize', this.handleResize, this);
  }

  private createBottomNav(width: number, height: number): void {
    const navY = height - 30; // Center of 60px bottom bar

    // Navigation container
    this.bottomNav = this.add.container(0, 0);

    // Background bar
    const bg = this.add.graphics();
    bg.fillStyle(0xFFFFFF, 0.95);
    bg.fillRect(0, height - 60, width, 60);
    bg.lineStyle(1, 0xDDDDDD, 1);
    bg.strokeRect(0, height - 60, width, 1);

    // Navigation buttons (icon + label)
    const buttons = [
      { x: width * 0.2, icon: '🏠', label: 'Головна', scene: 'Menu' },
      { x: width * 0.4, icon: '🗺️', label: 'Рівні', scene: 'LevelSelect' },
      { x: width * 0.6, icon: '🎴', label: 'Колекція', scene: 'Collection' },
      { x: width * 0.8, icon: '⚙️', label: 'Налаштування', scene: 'Settings' },
    ];

    buttons.forEach(btn => {
      const container = this.createNavButton(btn.x, navY, btn.icon, btn.label, btn.scene);
      this.bottomNav.add(container);
    });

    this.bottomNav.add(bg); // Add bg last so buttons are on top
  }

  private createNavButton(x: number, y: number, icon: string, label: string, targetScene: string): Phaser.GameObjects.Container {
    const iconText = this.add.text(0, -10, icon, { fontSize: '24px' }).setOrigin(0.5);
    const labelText = this.add.text(0, 12, label, { fontSize: '12px', color: '#666' }).setOrigin(0.5);

    const container = this.add.container(x, y, [iconText, labelText]);
    container.setSize(60, 50);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerup', () => {
      this.scene.start(targetScene); // Transition to target scene
    });

    return container;
  }

  private createGlobalHeader(width: number): void {
    // Similar to current LevelSelect HUD but persistent across scenes
    this.globalHeader = this.add.container(0, 0);

    const bg = this.add.graphics();
    bg.fillStyle(0xFFFFFF, 0.9);
    bg.fillRect(0, 0, width, 80);

    // Lives counter (right side)
    const livesIcon = this.add.text(width - 100, 40, '❤', { fontSize: '24px' }).setOrigin(0.5);
    const livesText = this.add.text(width - 60, 40, '5/5', { fontSize: '20px', color: '#1A1A1A' }).setOrigin(0, 0.5);

    // Bonuses counter (below lives)
    const bonusIcon = this.add.text(width - 100, 65, '💎', { fontSize: '18px' }).setOrigin(0.5);
    const bonusText = this.add.text(width - 60, 65, '500', { fontSize: '18px', color: '#FFB800' }).setOrigin(0, 0.5);

    this.globalHeader.add([bg, livesIcon, livesText, bonusIcon, bonusText]);

    // Reactive update via timer
    this.time.addEvent({
      delay: 1000,
      callback: this.updateGlobalHeader,
      callbackScope: this,
      loop: true,
    });
  }

  private updateGlobalHeader(): void {
    const economy = this.registry.get('economy') as EconomyManager;
    // Update lives/bonuses text elements
    // (Store references to text objects during createGlobalHeader)
  }

  private handleSceneChange(scene: Phaser.Scene): void {
    this.activeSceneName = scene.scene.key;

    // Hide bottom nav on Game scene (needs full screen)
    if (this.activeSceneName === 'Game') {
      this.bottomNav.setVisible(false);
    } else {
      this.bottomNav.setVisible(true);
    }

    // Hide global header on Boot/Menu (has own branding)
    if (this.activeSceneName === 'Boot' || this.activeSceneName === 'Menu') {
      this.globalHeader.setVisible(false);
    } else {
      this.globalHeader.setVisible(true);
    }
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;
    // Reposition bottom nav and global header
    // (Destroy and recreate, or use explicit positioning)
  }
}
```

**Integration into main.ts:**

```typescript
// main.ts
const config: Phaser.Types.Core.GameConfig = {
  // ... existing config ...
  scene: [Boot, Menu, LevelSelect, Game, UIOverlay], // Add UIOverlay
};

// After Phaser game created:
game.events.on('ready', () => {
  game.scene.start('Boot');
  // Launch UIOverlay in parallel (it will handle visibility per scene)
  game.scene.launch('UIOverlay');
});
```

**Scene Lifecycle Coordination:**

| Scene        | UIOverlay Bottom Nav | UIOverlay Global Header | Notes |
|--------------|---------------------|------------------------|-------|
| Boot         | Hidden              | Hidden                 | Loading screen |
| Menu         | Hidden              | Hidden                 | Full-screen branding |
| LevelSelect  | Visible             | Visible                | Navigation available |
| Game         | Hidden              | Visible (lives/bonuses)| Bottom nav hides for full grid view |
| Collection   | Visible             | Visible                | New scene for card viewing |

**Input Handling:**
- UIOverlay scene processes input FIRST (top-most scene in scene list)
- If UIOverlay handles input (e.g., nav button tap), event stops propagating
- Game scenes receive input only if UIOverlay doesn't consume it
- **Critical:** UIOverlay must have transparent backdrop to allow game scene input passthrough

**Alternative Considered: Per-Scene Nav Recreation**
- **Why rejected:** Violates DRY, state coordination nightmare, animation jank on transitions
- **When viable:** If nav bar needs per-scene customization (not the case here)

**Sources:**
- [Phaser UI Scene Pattern](https://phaser.io/examples/v3/view/scenes/ui-scene)
- [Phaser Persistent UI Discussion](https://phaser.discourse.group/t/persistent-ui-objects-components-on-scenes/2359)
- [Cross-Scene Communication](https://docs.phaser.io/phaser/concepts/scenes/cross-scene-communication)

---

## Recommended Architecture: Art Pipeline Integration

### Higher Resolution Tiles

**Current state:**
- Tiles loaded as individual PNGs (128x128px assumed)
- DPR capped at 2x for performance (zoom: 1/dpr)
- No texture atlases

**Upgrade path for higher-res tiles:**

**Option A: Replace PNGs with 256x256px versions (RECOMMENDED)**
- **Pros:** Zero code changes, instant upgrade, preserves existing load logic
- **Cons:** Larger file sizes (mitigated by Vite compression)
- **Implementation:**
  1. Replace assets in `assets/tiles/` with 256x256px versions
  2. Update `TileSprite.ts` scale if needed: `setDisplaySize(TILE_SIZE, TILE_SIZE)`
  3. Test on 1x and 2x DPR devices

**Option B: Texture atlas (Shoebox, TexturePacker)**
- **Pros:** Single HTTP request, reduced memory, easier to manage hundreds of sprites
- **Cons:** Build step complexity, requires atlas JSON generation
- **When to use:** When tile count exceeds 50+ or adding animations
- **Implementation:**
  ```typescript
  // Boot.ts
  this.load.atlas('tiles', 'assets/tiles.png', 'assets/tiles.json');

  // TileSprite.ts
  this.setTexture('tiles', `tile_${this.tileType}`); // Frame name from atlas
  ```

**Option C: SVG tiles (NOT RECOMMENDED for match-3)**
- **Reason:** Phaser SVG support limited, rasterization overhead, no perf benefit

**Recommendation:** **Option A** for immediate v1.2 milestone. Migrate to **Option B** (atlas) if tile count exceeds 50.

### New Tile Types Integration

**Current tile registration:**
```typescript
// constants.ts
export const TILE_TYPES = ['fuel', 'coffee', 'snack', 'road'] as const;
export const TEXTURE_KEYS: Record<TileType, string> = {
  fuel: 'tile_fuel_can',
  coffee: 'tile_coffee',
  snack: 'tile_wheel',
  road: 'tile_light',
};

// Boot.ts
this.load.image('tile_fuel_can', 'assets/tiles/fuel_can.png');
```

**Adding new tile type (e.g., 'bonus'):**

1. **Update constants:**
   ```typescript
   export const TILE_TYPES = ['fuel', 'coffee', 'snack', 'road', 'bonus'] as const;
   export const TEXTURE_KEYS: Record<TileType, string> = {
     // ... existing ...
     bonus: 'tile_bonus_star',
   };
   ```

2. **Load asset in Boot:**
   ```typescript
   this.load.image('tile_bonus_star', 'assets/tiles/bonus_star.png');
   ```

3. **Update spawn rules in level JSON:**
   ```json
   {
     "spawn_rules": {
       "fuel": 0.25,
       "coffee": 0.25,
       "snack": 0.25,
       "road": 0.20,
       "bonus": 0.05
     }
   }
   ```

**No engine changes needed:** `Match3Engine` uses generic `TileType`, handles any type in `TILE_TYPES`.

### Collection Card Art

**New asset category:** 512x512px card art (portrait orientation)

**Loading strategy:**
```typescript
// Boot.ts - load card metadata
this.load.json('card_metadata', 'data/cards.json');

// Lazy-load card images on demand (NOT in Boot)
// Collection scene loads only visible cards
export class CollectionScene extends Phaser.Scene {
  preload() {
    const cards = this.cache.json.get('card_metadata');
    // Load only first 10 cards (scrollable view)
    cards.slice(0, 10).forEach(card => {
      this.load.image(card.id, card.art_url);
    });
  }
}
```

**Why lazy loading:**
- 100 cards × 512×512px = ~25MB uncompressed
- Boot scene would hang for 5+ seconds
- Users rarely view full collection in one session

**Progressive loading pattern:**
```typescript
// As user scrolls, load next batch
onScroll(visibleRange: { start: number, end: number }) {
  const cardsToLoad = this.cards.slice(visibleRange.start, visibleRange.end)
    .filter(card => !this.textures.exists(card.id));

  if (cardsToLoad.length > 0) {
    this.load.reset(); // Clear previous loader queue
    cardsToLoad.forEach(card => {
      this.load.image(card.id, card.art_url);
    });
    this.load.once('complete', () => {
      this.renderVisibleCards();
    });
    this.load.start();
  }
}
```

---

## Component Boundaries and Data Flow

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ main.ts (Initialization)                                     │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│ │ Firebase    │  │ ProgressMgr  │  │ EconomyMgr       │    │
│ │ Auth/FS     │─>│ (registry)   │  │ (registry)       │    │
│ └─────────────┘  └──────────────┘  └──────────────────┘    │
│                                                               │
│ ┌──────────────┐  ┌──────────────┐                          │
│ │ CollectionMgr│  │ SettingsMgr  │                          │
│ │ (registry)   │  │ (registry)   │                          │
│ └──────────────┘  └──────────────┘                          │
└─────────────────────────────────────────────────────────────┘
                          ↓ Launch scenes
┌─────────────────────────────────────────────────────────────┐
│ Scene Layer                                                  │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────┐  ┌──────────────┐  ┌──────┐  ┌────────────┐   │
│ │ Boot    │→ │ Menu         │→ │ Level│→ │ Game       │   │
│ │         │  │              │  │Select│  │            │   │
│ └─────────┘  └──────────────┘  └──────┘  └────────────┘   │
│                     ↓                          ↓             │
│               ┌────────────┐           ┌──────────────┐    │
│               │ Collection │           │ Win Overlay  │    │
│               │ Scene      │           │ (card drop)  │    │
│               └────────────┘           └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ↑
┌─────────────────────────────────────────────────────────────┐
│ UIOverlay Scene (Parallel, depth: 1000)                     │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────┐  ┌─────────────────────────────────┐     │
│ │ Global Header │  │ Bottom Navigation Bar           │     │
│ │ Lives/Bonuses │  │ [Home] [Levels] [Cards] [Gear]  │     │
│ └───────────────┘  └─────────────────────────────────┘     │
│                                                               │
│ Visibility controlled by activeSceneName                    │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow: Card Drop

```
1. Game scene: Win condition met
   └─> showVictoryOverlay()

2. Victory overlay:
   ├─> ProgressManager.completeLevel(levelId) → stars
   ├─> CollectionManager.rollForCard({ levelId, stars, isFirstWin })
   │   ├─> Calculate drop chance (base + pity)
   │   ├─> Select rarity tier (weighted random)
   │   └─> Select card from pool → CardDrop | null
   │
   └─> if (drop):
       ├─> Show card reveal animation
       ├─> CollectionManager.addCard(drop.card.id)
       └─> CollectionManager.saveInventory() → Firestore

3. Firestore update:
   users/{uid}/card_inventory[cardId] = { count: 1, unlocked_at: now() }
   users/{uid}/card_pity_counter = 0
```

### Data Flow: Navigation Tap

```
1. User taps "Колекція" in bottom nav (UIOverlay scene)
   └─> UIOverlay.handleNavTap('Collection')

2. UIOverlay:
   └─> this.scene.start('Collection')
       ├─> Stops current game scene (e.g., LevelSelect)
       └─> Starts Collection scene

3. Collection scene:
   ├─> preload(): Lazy-load visible card images
   ├─> create():
   │   ├─> Get CollectionManager from registry
   │   ├─> Render card grid (owned cards highlighted)
   │   └─> Setup scroll listener for progressive loading
   │
   └─> UIOverlay automatically shows bottom nav (scene != 'Game')
```

---

## Integration Points with Existing Architecture

### Modifications to Existing Components

#### 1. main.ts
**Change:** Add CollectionManager initialization, launch UIOverlay scene

```typescript
// BEFORE (current)
const progressManager = new ProgressManager(...);
const economyManager = new EconomyManager(...);
game.registry.set('progress', progressManager);
game.registry.set('economy', economyManager);

// AFTER (with collections + UI overlay)
const progressManager = new ProgressManager(...);
const economyManager = new EconomyManager(...);

// NEW: Load card metadata and initialize CollectionManager
const cardMetadata = await fetch('/data/cards.json').then(r => r.json());
const cardInventory = await firestoreService.loadCardInventory(uid) || {};
const collectionManager = new CollectionManager(firestoreService, uid, cardInventory, cardMetadata);

game.registry.set('progress', progressManager);
game.registry.set('economy', economyManager);
game.registry.set('collection', collectionManager); // NEW

// NEW: Launch UIOverlay in parallel with Boot
game.events.on('ready', () => {
  game.scene.start('Boot');
  game.scene.launch('UIOverlay'); // Persistent UI layer
});
```

#### 2. LevelSelect Scene
**Change:** Remove duplicate HUD elements (now in UIOverlay global header)

```typescript
// BEFORE: LevelSelect creates own lives/bonuses HUD
createEconomyHUD(width, economy) {
  this.livesText = this.add.text(...);
  // ... full HUD implementation
}

// AFTER: Delegate to UIOverlay global header
// Option A: Remove HUD entirely (rely on UIOverlay)
// Option B: Keep local HUD for scenes where UIOverlay hidden (Menu)
```

**Decision:** Keep minimal HUD in LevelSelect for v1.2, remove in v1.3 after UIOverlay proven stable.

#### 3. Game Scene Win Overlay
**Change:** Add card drop logic after star calculation

```typescript
// BEFORE (current)
private async showVictoryOverlay(stars: number) {
  // ... show stars, XP, etc.
  await progress.saveProgress();
}

// AFTER (with card drops)
private async showVictoryOverlay(stars: number) {
  const progress = this.registry.get('progress') as ProgressManager;
  const collection = this.registry.get('collection') as CollectionManager;

  // Calculate stars
  const result = progress.completeLevel(levelId, movesUsed, totalMoves);

  // Roll for card drop
  const drop = collection.rollForCard({
    levelId: this.currentLevel,
    stars: result.stars,
    isFirstWin: result.isNewBest,
  });

  // Show victory UI
  this.showStarsAnimation(result.stars);

  // If card dropped, show reveal animation
  if (drop) {
    await this.showCardRevealAnimation(drop);
    await collection.saveInventory();
  }

  // ... save progress, return to map
}
```

#### 4. Boot Scene
**Change:** Load card metadata JSON (NOT card images—those lazy-load)

```typescript
// BEFORE
this.load.json('level_001', 'data/levels/level_001.json');

// AFTER
this.load.json('level_001', 'data/levels/level_001.json');
this.load.json('card_metadata', 'data/cards.json'); // NEW
```

---

## New Components to Build

### 1. CollectionManager (src/game/CollectionManager.ts)
- **LOC estimate:** ~200
- **Dependencies:** FirestoreService
- **Test coverage:** Unit tests for probability engine (deterministic seeding)

### 2. UIOverlay Scene (src/scenes/UIOverlay.ts)
- **LOC estimate:** ~300
- **Dependencies:** EconomyManager, SettingsManager (for reactive updates)
- **Responsive:** Yes (resize handler repositions nav/header)

### 3. Collection Scene (src/scenes/Collection.ts)
- **LOC estimate:** ~250
- **Dependencies:** CollectionManager
- **Features:** Scrollable card grid, rarity filters, card detail modal

### 4. Card Metadata Schema (data/cards.json)
- **Format:** JSON array of CardDoc objects
- **Size:** ~100 cards × 150 bytes = ~15KB
- **Source:** Designed by product/AD, generated from spreadsheet

### 5. Firestore Schema Migration
- **New fields in users/{uid}:**
  - `card_inventory: { [cardId]: { count, unlocked_at } }`
  - `card_pity_counter: number`
- **Migration:** Auto-initialize on first access (no breaking change)

---

## Build Order Considering Dependencies

### Phase 1: Foundation (No UI changes, backend only)
**Duration:** 1-2 days

1. **CollectionManager skeleton**
   - Constructor, basic inventory methods (hasCard, getCardCount)
   - Firestore save/load stubs (no-op)
   - No probability engine yet

2. **Card metadata JSON**
   - Create `data/cards.json` with 10 example cards
   - Schema: `{ id, name, rarity, theme, art_url }`

3. **Firestore schema update**
   - Add `card_inventory` and `card_pity_counter` fields to users doc
   - Test with Firebase emulator

4. **Integration into main.ts**
   - Load card metadata
   - Initialize CollectionManager
   - Register in game.registry

**Validation:** `console.log(collectionManager.getCollectionProgress())` shows { owned: 0, total: 10 }

### Phase 2: Probability Engine (Backend logic)
**Duration:** 1 day

5. **Implement rollForCard() logic**
   - Weighted random rarity selection
   - Card pool filtering (avoid duplicates)
   - Pity counter increment/reset

6. **Unit tests**
   - Test drop rates with fixed random seed
   - Verify pity counter triggers at threshold

**Validation:** 1000 simulated rolls → rarity distribution matches config ±5%

### Phase 3: Card Drops in Game (Game scene integration)
**Duration:** 1 day

7. **Modify Game scene win overlay**
   - Call `rollForCard()` after star calculation
   - Show card reveal animation (simple fade-in for now)
   - Save inventory to Firestore

8. **Create card reveal animation**
   - Placeholder: show card sprite with glow effect
   - Audio: special "card get" SFX

**Validation:** Win 5 levels → verify card_inventory in Firestore, pity counter increments

### Phase 4: Collection Viewing (New scene)
**Duration:** 2 days

9. **Collection scene skeleton**
   - Basic card grid layout (3 columns)
   - Owned cards show full color, locked cards grayscale
   - No lazy loading yet (load all 10 test cards)

10. **Card detail modal**
    - Tap card → show full-size view with description
    - Close button returns to grid

**Validation:** Navigate Menu → Collection → see cards, tap for details

### Phase 5: Persistent UI Navigation (UIOverlay scene)
**Duration:** 2-3 days

11. **UIOverlay scene creation**
    - Bottom nav bar with 4 buttons (Home, Levels, Cards, Settings)
    - Global header with lives/bonuses (reactive update via timer)
    - Visibility logic based on activeSceneName

12. **Integrate UIOverlay into main.ts**
    - Launch in parallel with Boot scene
    - Test scene transitions don't break UIOverlay

13. **Remove duplicate HUD from LevelSelect**
    - Verify UIOverlay global header shows correctly
    - Fix any input handling conflicts

**Validation:** Navigate between all scenes → bottom nav persists, header shows/hides correctly

### Phase 6: Art Pipeline Upgrades
**Duration:** 1 day (asset replacement) + ongoing (new types)

14. **Replace tile PNGs with 256×256px versions**
    - Test on 1x and 2x DPR devices
    - Verify no visual regression

15. **Add new tile type (example: 'bonus')**
    - Update constants, load asset, test spawn in level

16. **Create 10 collection card art assets**
    - 512×512px PNGs, place in `assets/cards/`
    - Update `cards.json` with art URLs

**Validation:** Visual QA on multiple devices, card art renders crisp

---

## Patterns to Follow

### Pattern 1: Registry-Based Singleton Access
**What:** All managers stored in `game.registry`, accessed by scenes via type-safe getters

**When:** Any new singleton manager (CollectionManager, future: MissionsManager)

**Example:**
```typescript
// main.ts
game.registry.set('collection', collectionManager);

// Any scene
const collection = this.registry.get('collection') as CollectionManager;
```

**Why:** Avoids global variables, consistent with existing ProgressManager/EconomyManager pattern

### Pattern 2: Reactive Manager Updates
**What:** Managers notify scenes of state changes via subscriptions (not polling)

**When:** Manager state changes frequently (economy lives regeneration, collection progress)

**Example:**
```typescript
// CollectionManager
private subscribers: ((event: CollectionEvent) => void)[] = [];

subscribe(callback: (event: CollectionEvent) => void) {
  this.subscribers.push(callback);
}

private notify(event: CollectionEvent) {
  this.subscribers.forEach(cb => cb(event));
}

// UIOverlay scene
const collection = this.registry.get('collection');
collection.subscribe(event => {
  if (event.type === 'card_added') {
    this.showNotification(`Нова картка: ${event.card.name}!`);
  }
});
```

**Why:** Decouples managers from UI, enables real-time updates without polling

### Pattern 3: Lazy Asset Loading
**What:** Load assets on-demand in scene `preload()`, not upfront in Boot

**When:** Assets not needed immediately (collection cards, future levels)

**Example:**
```typescript
// Collection scene
preload() {
  const visibleCards = this.getVisibleCards(); // Based on scroll position
  visibleCards.forEach(card => {
    if (!this.textures.exists(card.id)) {
      this.load.image(card.id, card.art_url);
    }
  });
}
```

**Why:** Reduces Boot scene load time, improves perceived performance

### Pattern 4: Scene Visibility Coordination
**What:** UIOverlay scene shows/hides elements based on active game scene

**When:** Persistent UI that shouldn't appear in all scenes (bottom nav hidden in Game)

**Example:**
```typescript
// UIOverlay
this.game.events.on('scenechange', (scene: Phaser.Scene) => {
  const key = scene.scene.key;
  this.bottomNav.setVisible(key !== 'Game');
  this.globalHeader.setVisible(key !== 'Boot' && key !== 'Menu');
});
```

**Why:** Avoids UI clutter, respects per-scene layout needs

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Recreating Nav in Every Scene
**What goes wrong:** Each scene creates own bottom nav → duplicate code, state coordination bugs

**Why it happens:** Doesn't know about UIOverlay scene pattern

**Prevention:** Use dedicated UIOverlay scene for all persistent UI

**Detection:** If you find yourself copying navigation code between scenes → refactor to UIOverlay

### Anti-Pattern 2: Synchronous Firestore in Game Loop
**What goes wrong:** `await firestoreService.saveInventory()` in match cascade → 200ms lag spike

**Why it happens:** Saving after every card add without batching

**Prevention:** Batch Firestore writes, use fire-and-forget for non-critical saves

**Example:**
```typescript
// BAD: Save after every card add
addCard(cardId) {
  this.inventory[cardId] = { count: 1, unlocked_at: Timestamp.now() };
  await this.saveInventory(); // BLOCKS RENDER
}

// GOOD: Fire-and-forget, batch on scene transition
addCard(cardId) {
  this.inventory[cardId] = { count: 1, unlocked_at: Timestamp.now() };
  this.isDirty = true;
}

async shutdown() {
  if (this.isDirty) {
    await this.saveInventory(); // Save on scene exit
  }
}
```

### Anti-Pattern 3: Loading All Card Art in Boot
**What goes wrong:** Boot scene hangs for 5+ seconds loading 100 cards

**Why it happens:** Treating cards like tiles (which DO load in Boot)

**Prevention:** Lazy-load card art per-scene, only visible cards

**Detection:** Boot scene `progress` callback stalls at 0.8 → too many assets

### Anti-Pattern 4: Hardcoded Drop Rates
**What goes wrong:** Can't A/B test drop rates without code changes

**Why it happens:** Drop rates in TypeScript constants instead of data

**Prevention:** Store drop rates in `cards.json` or Remote Config

**Example:**
```typescript
// BAD: Hardcoded
const RARITY_DROP_RATES = { common: 0.6, rare: 0.3, epic: 0.09, legendary: 0.01 };

// GOOD: Data-driven
interface CardMetadata {
  rarity_drop_rates: { common: number, rare: number, ... };
}
// Load from cards.json or Remote Config
```

---

## Scalability Considerations

| Concern | At 10 Cards | At 100 Cards | At 500 Cards |
|---------|-------------|--------------|--------------|
| **Firestore doc size** | <1KB (nested map) | ~10KB (nested map OK) | ~50KB (consider subcollection migration) |
| **Boot load time** | +50ms (metadata JSON) | +100ms (metadata JSON) | +200ms (split metadata into chunks) |
| **Collection scene render** | Instant (all loaded) | 1-2s (lazy load batches) | 5s+ (virtualized scroll) |
| **Card drop query time** | <1ms (filter array) | <5ms (filter array) | <20ms (indexed lookup) |

**Optimization triggers:**
- **>100 cards:** Implement virtualized scrolling in Collection scene (only render visible cards)
- **>200 cards:** Migrate Firestore schema to subcollection (`users/{uid}/cards/{cardId}`)
- **>500 cards:** Add Firestore indexes for rarity/theme queries

**Current recommendation:** Nested map in user doc sufficient for v1.2-v1.5 (estimated <100 cards)

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| CollectionManager architecture | **HIGH** | Proven singleton pattern, similar to existing managers |
| Probability engine | **MEDIUM** | Standard gacha math, needs playtesting for balance |
| UIOverlay scene pattern | **HIGH** | Official Phaser best practice, well-documented |
| Firestore schema | **HIGH** | Nested map validated for <100 cards, migration path clear |
| Art pipeline (higher res) | **HIGH** | Drop-in PNG replacement, zero risk |
| Art pipeline (new types) | **HIGH** | Extensible constants pattern already proven |
| Build order dependencies | **HIGH** | Phased approach isolates risks, early validation |
| Scene lifecycle coordination | **MEDIUM** | UIOverlay visibility logic needs manual QA, potential edge cases |

**Overall confidence:** **HIGH** (8/10)

**Risk areas needing validation:**
- UIOverlay input passthrough (ensure game scenes still receive taps)
- Card drop animation performance on low-end devices (512×512 PNG decode)
- Firestore write frequency (card drops + progress + economy = 3 writes per level win)

---

## Sources

**Phaser Architecture Patterns:**
- [Phaser UI Scene Example](https://phaser.io/examples/v3/view/scenes/ui-scene)
- [Persistent UI Objects Discussion](https://phaser.discourse.group/t/persistent-ui-objects-components-on-scenes/2359)
- [Phaser 3 UI Level Scene on Top](https://phaser.discourse.group/t/phaser-3-ui-level-scene-on-top/4792)
- [Cross-Scene Communication](https://docs.phaser.io/phaser/concepts/scenes/cross-scene-communication)
- [Phaser Scenes Overview](https://docs.phaser.io/phaser/concepts/scenes)

**Firestore Schema Design:**
- [Choose a Data Structure - Firestore](https://firebase.google.com/docs/firestore/manage-data/structure-data)
- [Cloud Firestore Data Model](https://firebase.google.com/docs/firestore/data-model)
- [Structure Data - Firestore](https://cloud.google.com/firestore/docs/concepts/structure-data)

**Game Design References:**
- [Match-3 Games Metrics Guide](https://www.gameanalytics.com/blog/match-3-games-metrics-guide)
- [Marvel Snap Collector's Reserves](https://gamerant.com/marvel-snap-collectors-reserve-rate-odds-math-boxes-pity-system/)

---

**Research completed:** 2026-02-10
**Confidence:** HIGH
**Ready for roadmap creation:** YES
