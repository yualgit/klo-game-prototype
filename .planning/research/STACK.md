# Technology Stack

**Project:** KLO Match-3 Collection Cards Milestone
**Researched:** 2026-02-10

## Recommended Stack

### Core Framework (No Changes)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Phaser | 3.90.0 | Game engine | Already validated, DPR-aware rendering working (zoom: 1/dpr) |
| TypeScript | 5.7.0 | Type safety | Already in use, continue with existing setup |
| Vite | 6.0.0 | Build tool | Already in use, fast HMR for dev workflow |
| Firebase | 11.0.0 | Backend (Auth, Firestore) | Already validated for progress/economy persistence |

**Rationale:** Existing stack handles current features well. NO framework changes needed.

### Collection Cards — Gacha/Probability Engine

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| random-seed-weighted-chooser | ^1.1.1 | Weighted random selection | Mature, TypeScript support, custom seed for reproducibility, zero dependencies |

**Why NOT custom implementation:** Gacha probability is error-prone. Existing library handles edge cases (empty arrays, zero weights, floating-point precision). Custom PRNG seed support enables server-side validation if needed later.

**Why NOT other alternatives:**
- `weighted` — No TypeScript types by default
- `random-weighted-choice` — Older, fewer features
- Custom math — Reinventing wheel, pity system math is complex

**Integration pattern:**
```typescript
// In new CollectionManager.ts
import { weightedChooseIndex } from 'random-seed-weighted-chooser';

class CollectionManager {
  private pityCounter: Record<string, number> = {}; // Track pity per collection

  pickCard(collectionId: string): CardData {
    // Increase rarity weights based on pity counter
    const weights = this.calculateWeights(collectionId);
    const index = weightedChooseIndex(weights);
    // Reset pity if rare obtained, increment otherwise
  }
}
```

Store in Phaser registry like existing managers: `game.registry.set('collection', collectionManager)`.

### UI Navigation — Bottom Nav + Global Header

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| phaser3-rex-plugins | ^1.80.18 | UI components (tabs, badges, containers) | Actively maintained, Phaser 3.80+ compatible, comprehensive UI toolkit |

**Why rexUI:** Official Phaser examples recommend separate UI scene pattern. RexUI provides production-ready components (Buttons, Sizer, Label, BadgeLabel) that integrate seamlessly with Phaser scene system.

**Why NOT custom UI:** Bottom nav requires complex layout logic (responsive sizing, active state management, icon positioning). RexUI solves this with Sizer containers and event emitters.

**Why NOT HTML overlay:** Mixing DOM and Canvas breaks Phaser's rendering pipeline, complicates touch handling, and creates z-index issues. Pure Phaser UI maintains consistent DPR scaling.

**Integration pattern:**
```typescript
// New scene: src/scenes/UI.ts
export class UI extends Phaser.Scene {
  create() {
    // Persistent UI scene runs alongside Game/LevelSelect/Menu
    this.createBottomNav(); // Using rexUI.Buttons container
    this.createGlobalHeader(); // Lives, bonuses, settings icon

    // Listen to scene changes via registry events
    this.game.events.on('scenechange', this.updateNavState, this);
  }
}

// In main.ts config:
scene: [Boot, UI, Menu, LevelSelect, Game],

// Boot scene launches UI:
this.scene.launch('UI'); // Runs concurrently
this.scene.start('Menu');
```

**Installation:**
```bash
npm install phaser3-rex-plugins
```

**Key components for milestone:**
- `Sizer` — Layout container for responsive bottom nav
- `Buttons` — Radio-button group for nav tabs
- `Label` — Icon + text combos for nav items
- `BadgeLabel` — Notification badges on tabs

### Art Pipeline — 1024px Retina Tiles

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Free Texture Packer | Web app | Sprite sheet generation | Free, open-source, supports Phaser 3 JSON format, rotation/trimming |

**Current state:** Assets are 1024x1024 PNG (tiles), 696x1158 PNG (collection cards), 256x256 PNG (GUI). Already retina-ready.

**Why NOT TexturePacker Pro:** $40 license unnecessary for 100-asset project. Free Texture Packer handles rotation, trimming, multiple formats.

**Why sprite sheets NOW:** Collection cards milestone adds 18+ new card PNGs (3 collections × 6 cards). Individual image loading = 30+ HTTP requests. Atlas reduces to 1 JSON + 1 PNG.

**Migration strategy:**
1. Continue individual PNGs for tiles (only 10 tile types, already loaded)
2. **Create atlas for collection cards** (18+ cards, loaded on-demand)
3. **Create atlas for new GUI elements** (nav icons, collection UI)

**Workflow:**
1. AI-generate 1024x1024 PNGs (existing pipeline)
2. Upload to [free-tex-packer.com](https://free-tex-packer.com/app/)
3. Select "Phaser 3" format, enable trim/rotation
4. Download `cards.json` + `cards.png`
5. Load in Phaser: `this.load.atlas('cards', 'assets/cards.png', 'assets/cards.json')`

**Why 1024px:** DPR scaling (zoom: 1/dpr) means 1024px renders at 512px on 2x displays. Avoids blurriness on retina. File size acceptable (<200KB per PNG with compression).

**Optimization:** Use PNG-8 (indexed color) for flat-color GUI elements via Free Texture Packer export settings. Reduces file size 70% vs PNG-24.

### Responsive Layout Improvements

**No new dependencies.** Use existing Phaser scale system.

**Current approach (already validated):**
```typescript
// main.ts
const dpr = Math.min(window.devicePixelRatio || 1, 2);
scale: {
  mode: Phaser.Scale.RESIZE,
  autoCenter: Phaser.Scale.CENTER_BOTH,
  zoom: 1 / dpr,
}
```

**Enhancements for milestone:**
1. **Orientation handling:** Detect portrait/landscape, adjust UI scene layout
2. **Safe area insets:** Account for mobile notches in header/nav positioning
3. **Breakpoints:** Define layout constants for phone/tablet/desktop

**Implementation (no new libs):**
```typescript
// In UI scene resize handler
handleResize(gameSize: Phaser.Structs.Size) {
  const width = gameSize.width;
  const height = gameSize.height;
  const isPortrait = height > width;

  // Bottom nav: full width on portrait, sidebar on landscape
  if (isPortrait) {
    this.bottomNav.setPosition(0, height - NAV_HEIGHT);
    this.bottomNav.layout(); // rexUI reflow
  } else {
    this.bottomNav.setPosition(width - NAV_WIDTH, 0);
  }

  // Global header: account for safe area (iPhone notch = 44px)
  const safeTop = isPortrait ? 44 : 0;
  this.header.setPosition(0, safeTop);
}
```

**Why NOT viewport meta tag changes:** Already using `viewport-fit=cover` (checked in index.html). Phaser scale handles rest.

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | — | — | Milestone needs NO additional libraries beyond rexUI and random-seed-weighted-chooser |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Gacha engine | random-seed-weighted-chooser | Custom math | Error-prone, pity system requires complex probability curves |
| Gacha engine | random-seed-weighted-chooser | gacha-engine npm | Abandoned (last update 2023), no TypeScript types |
| UI components | phaser3-rex-plugins | HTML overlay (React/Vue) | Breaks DPR scaling, complicates touch handling, z-index hell |
| UI components | phaser3-rex-plugins | Custom Phaser UI | 500+ LOC for layout logic, rexUI solves this |
| Sprite sheets | Free Texture Packer | TexturePacker Pro | $40 license unnecessary, free tool sufficient |
| Sprite sheets | Free Texture Packer | Leshy SpriteSheet Tool | Less reliable, crashes on >50 images |
| State management | Existing registry pattern | Redux/MobX | Overkill, Phaser registry + manager singletons already working |

## Installation

```bash
# Collection cards — probability engine
npm install random-seed-weighted-chooser

# UI components — navigation + layout
npm install phaser3-rex-plugins

# Art pipeline — web-based, no install needed
# Visit https://free-tex-packer.com/app/
```

## Integration with Existing Architecture

### 1. New Manager: CollectionManager

**File:** `src/game/CollectionManager.ts`

**Pattern:** Singleton in Phaser registry (like ProgressManager, EconomyManager)

```typescript
// In main.ts after EconomyManager init:
const collectionManager = new CollectionManager(firestoreService, uid, collectionState);
game.registry.set('collection', collectionManager);
```

**Responsibilities:**
- Load collection state from Firestore (owned cards, pity counters)
- Pick random cards using weighted probability
- Track pity system (guarantee rare after X picks)
- Save collection progress to Firestore

**Firestore schema (new subcollection):**
```typescript
// users/{uid}/collections/{collectionId}
interface CollectionState {
  owned_cards: string[]; // ['coffee_01', 'coffee_02', ...]
  pity_counter: number;   // Increments on non-rare, resets on rare
  last_pick_at: Timestamp;
}
```

### 2. New Scene: UI (Persistent Overlay)

**File:** `src/scenes/UI.ts`

**Launch:** Boot scene launches UI, then starts Menu:
```typescript
// In Boot.create():
this.scene.launch('UI'); // Runs concurrently
this.scene.start('Menu');
```

**Components:**
- **Global header:** Lives counter, bonuses, settings icon (top-right)
- **Bottom nav:** 4 tabs (Map, Cards, Shop, Profile) with active state

**Communication with other scenes:**
```typescript
// UI scene listens to registry changes:
const economy = this.registry.get('economy') as EconomyManager;
economy.subscribe('lives', (lives) => this.updateLivesDisplay(lives));

// Other scenes emit events:
this.scene.get('Game').events.emit('level-complete');
// UI scene reacts (show animation, etc.)
```

### 3. rexUI Plugin Registration

**File:** `src/main.ts`

```typescript
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';

const config: Phaser.Types.Core.GameConfig = {
  // ... existing config
  plugins: {
    scene: [{
      key: 'rexUI',
      plugin: RexUIPlugin,
      mapping: 'rexUI'
    }]
  }
};
```

**Usage in scenes:**
```typescript
// In UI.ts
create() {
  const sizer = this.rexUI.add.sizer({
    orientation: 'horizontal',
    space: { item: 10 }
  });

  const navButton = this.rexUI.add.label({
    background: this.add.image(0, 0, 'gui_button_orange'),
    icon: this.add.image(0, 0, 'icon_map'),
    space: { icon: 10 }
  });

  sizer.add(navButton);
  sizer.layout();
}
```

### 4. Asset Loading Updates

**File:** `src/scenes/Boot.ts`

```typescript
preload() {
  // NEW: Load collection card atlas
  this.load.atlas('cards', 'assets/cards.png', 'assets/cards.json');

  // NEW: Load nav icons atlas
  this.load.atlas('nav', 'assets/nav.png', 'assets/nav.json');

  // Existing individual tile loads continue (no change)
}
```

**Why NOT load all atlases upfront:** Collection cards loaded on-demand when user opens Cards scene. Keeps initial boot fast.

```typescript
// In new Cards scene:
preload() {
  if (!this.textures.exists('cards')) {
    this.load.atlas('cards', 'assets/cards.png', 'assets/cards.json');
  }
}
```

## What NOT to Add

| Technology | Why Skip |
|-----------|----------|
| Zustand/Redux | Phaser registry + manager singletons already handle state. Adding external state = duplicate sources of truth. |
| React/Vue overlay | DPR scaling breaks, z-index issues, complicates touch handling. Pure Phaser UI maintains consistency. |
| Lodash | Only need weighted random (1 function). Full utility library = 70KB overhead. |
| GSAP | Phaser tweens handle all animation needs. GSAP = $99/year commercial license + learning curve. |
| Spine/DragonBones | No skeletal animation needed. Collection cards = static PNGs with scale/fade tweens. |
| Socket.io | Milestone has no multiplayer. Premature to add real-time infrastructure. |
| i18next | Game already Ukrainian-only per spec. Internationalization deferred to later milestone. |

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Gacha engine | HIGH | random-seed-weighted-chooser actively maintained, 1.1.1 released 2025, TypeScript support verified |
| UI components | HIGH | phaser3-rex-plugins 1.80.18 compatible with Phaser 3.90, official examples use UI scene pattern |
| Art pipeline | MEDIUM | Free Texture Packer works, but web-based = no CLI automation. Manual export OK for 18 cards, may need CLI tool if asset count grows >100. |
| Responsive | HIGH | Existing DPR scaling works. Orientation handling = standard Phaser resize events. |

## Gaps and Risks

### 1. Pity System Math Validation

**Gap:** random-seed-weighted-chooser handles weighted selection, but pity logic (increase weights after N failures) is custom business logic.

**Mitigation:** Unit test pity curves before integration. Validate with gacha math resources:
- [Gacha probability algorithms](https://kylechen.net/writing/gacha-probability/)
- [Genshin Impact pity system analysis](https://library.keqingmains.com/general-mechanics/gacha)

**Test case:** Guarantee rare card within 10 pulls (90% confidence interval).

### 2. rexUI Learning Curve

**Gap:** Team unfamiliar with rexUI API. Documentation is comprehensive but scattered across 100+ plugin pages.

**Mitigation:**
- Start with official examples: [UI Overview](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/ui-overview/)
- Prototype bottom nav in isolated scene BEFORE integrating with main game
- Budget 4-6 hours for experimentation

**Fallback:** If rexUI too complex, build custom bottom nav with 5 Image buttons + manual layout (fallback = +200 LOC, worse DX).

### 3. Atlas Generation Workflow

**Gap:** Free Texture Packer is web-based. No CLI = manual export on each art update.

**Risk:** Art iteration cycle slows (designer generates PNGs → dev manually exports atlas → commit).

**Mitigation (now):** Acceptable for milestone (18 cards = one-time export).

**Future:** If asset count grows >100, migrate to CLI tool:
- [free-tex-packer-core](https://github.com/odrick/free-tex-packer-core) — Node.js version, scriptable
- Or TexturePacker Pro ($40) with CLI

### 4. Scene Lifecycle with Persistent UI

**Gap:** UI scene runs concurrently with Game/Menu/LevelSelect. Potential race conditions if scenes emit events before UI scene ready.

**Mitigation:**
```typescript
// In UI scene:
create() {
  this.registry.set('uiReady', true); // Signal other scenes
}

// In other scenes:
create() {
  this.registry.events.once('changedata-uiReady', () => {
    // Safe to emit UI events now
  });
}
```

## Sources

### Gacha/Probability
- [random-seed-weighted-chooser npm](https://www.npmjs.com/package/random-seed-weighted-chooser)
- [Weighted Random in JavaScript](https://trekhleb.medium.com/weighted-random-in-javascript-4748ab3a1500)
- [Gacha probability algorithms](https://kylechen.net/writing/gacha-probability/)
- [Genshin Impact gacha mechanics](https://library.keqingmains.com/general-mechanics/gacha)

### Phaser UI
- [Phaser 3 persistent UI discussion](https://phaser.discourse.group/t/persistent-ui-objects-components-on-scenes/2359)
- [Phaser UI Scene example](https://phaser.io/examples/v3/view/scenes/ui-scene)
- [phaser3-rex-plugins npm](https://www.npmjs.com/package/phaser3-rex-plugins)
- [rexUI Overview](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/ui-overview/)

### Responsive/Retina
- [Phaser 3 retina support](https://supernapie.com/blog/support-retina-with-phaser-3/)
- [Responsive Phaser games](https://medium.com/@mattcolman/responsive-phaser-game-54a0e2dafba7)
- [Retina graphics in Phaser](https://www.joshmorony.com/how-to-use-retina-graphics-in-html5-phaser-games/)

### Art Pipeline
- [Free Texture Packer](https://free-tex-packer.com/app/)
- [TexturePacker Phaser 3 tutorial](https://phaser.io/news/2018/03/texturepacker-and-phaser-3-tutorial)
- [Sprite sheet optimization](https://www.codeandweb.com/texturepacker/tutorials/how-to-create-sprite-sheets-for-phaser)

---

**Version:** 1.0
**Confidence:** HIGH (gacha, UI, responsive), MEDIUM (art workflow automation)
**Researched:** 2026-02-10
