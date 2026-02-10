# Domain Pitfalls

**Domain:** Match-3 game with collection cards, persistent UI navigation, art upgrades
**Researched:** 2026-02-10
**Context:** Adding collection/gacha system, persistent UI (bottom nav, header), 1024px art assets, responsive layout fixes to existing Phaser 3.90 match-3 game

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Scene Registry String Key Inconsistencies
**What goes wrong:** Using inconsistent key naming (camelCase in one scene, kebab-case in another) creates duplicate states in the registry without noticing. EconomyManager state becomes out of sync across scenes, causing duplicate purchases, lost progress, or incorrect currency display.

**Why it happens:** Phaser's registry offers no validation or type safety. String keys are silent failures - the game doesn't break, it just doesn't work as expected.

**Consequences:**
- Collection card unlock state in one scene doesn't reflect in another
- Economy currency values diverge between LevelSelect and Game scenes
- Lives count shows different values in different UI locations
- Firestore persistence saves incorrect state

**Prevention:**
- Define registry keys as TypeScript constants in a shared file:
  ```typescript
  // src/constants/RegistryKeys.ts
  export const REGISTRY_KEYS = {
    ECONOMY_MANAGER: 'economyManager',
    SETTINGS_MANAGER: 'settingsManager',
    COLLECTION_MANAGER: 'collectionManager',
  } as const;
  ```
- Use type-safe wrapper:
  ```typescript
  // Type-safe get/set
  getManager<T>(key: string): T {
    return this.registry.get(key);
  }
  ```
- Validate keys exist during Boot scene initialization
- Consider phaser-hooks library for type-safe state management

**Detection:**
- Registry values not updating across scenes
- "Undefined" errors when accessing manager methods
- Duplicate manager instances created
- State resets unexpectedly during scene transitions

**Phase:** Phase 04-01 (Bottom Navigation) - Set up registry key constants before implementing persistent nav state

---

### Pitfall 2: Scene Transition Event Listener Memory Leaks
**What goes wrong:** Adding event listeners for collection card unlocks, economy updates, or navigation state in scenes without proper cleanup causes memory leaks. Transition events are cleared when scene shuts down, but NOT when sent to sleep. Parallel scenes (UI overlay + Game) accumulate listeners.

**Why it happens:** Persistent UI scenes use `scene.sleep()` / `scene.wake()` instead of `scene.stop()` / `scene.start()`. Listeners from previous wake cycles never get removed. Each scene wake adds duplicate listeners.

**Consequences:**
- Collection card unlock triggers multiple times
- Economy deduction happens 2x, 3x, 4x for single action
- Navigation handlers fire multiple times per click
- Performance degrades over time (event handler bloat)
- Firestore writes multiply exponentially

**Prevention:**
- Use named event handler references (not inline functions):
  ```typescript
  // BAD - creates new function each time
  this.events.on('collection-unlock', () => this.handleUnlock());

  // GOOD - reusable reference
  private boundHandleUnlock = this.handleUnlock.bind(this);
  this.events.on('collection-unlock', this.boundHandleUnlock);
  ```
- Clean up in scene sleep handler:
  ```typescript
  this.events.on('sleep', () => {
    this.events.off('collection-unlock', this.boundHandleUnlock);
    this.economyManager.unsubscribe('lives', this.livesCallback);
  });
  ```
- Use `once()` instead of `on()` for one-time handlers
- Implement manager unsubscribe methods (SettingsManager pattern):
  ```typescript
  unsubscribe(key: string, callback: Function) {
    const listeners = this.subscriptions.get(key);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) listeners.splice(index, 1);
    }
  }
  ```

**Detection:**
- Same action logs multiple times in console
- Economy values change by multiples of expected amount
- Performance FPS drops over time in dev tools
- Chrome DevTools Memory Profiler shows growing listener count

**Phase:** Phase 04-01 (Bottom Navigation) and Phase 04-04 (Collection Cards) - Critical for persistent UI and collection event handling

---

### Pitfall 3: High-Resolution Asset Memory Explosion on Mobile
**What goes wrong:** Upgrading from 512px to 1024px tile assets increases texture memory by 4x (2x width × 2x height). With 30+ tile types + backgrounds + UI, memory exceeds mobile device limits (especially iOS Safari ~300-500MB cap). Game crashes on level load or during collection card reveal animations.

**Why it happens:** Texture atlases load entire atlas into memory even if only using subset of frames. High DPR devices (iPhone, iPad) multiply texture memory requirements. Poor WebGL performance on high resolutions compounds the issue.

**Consequences:**
- Safari crashes with "A problem repeatedly occurred" on level start
- Android Chrome kills tab with "Out of memory"
- Frame rate drops below 30 FPS on mid-range devices
- Collection card reveal animations stutter or freeze
- Canvas becomes blurry due to resolution scaling fallback

**Prevention:**
- Use multi-atlas strategy - split by feature/scene:
  ```typescript
  // Boot scene
  this.load.atlas('tiles-core', 'tiles-core.png', 'tiles-core.json'); // 10 most common

  // LevelSelect scene
  this.load.atlas('ui-navigation', 'ui-nav.png', 'ui-nav.json');

  // Game scene (lazy load by level)
  this.load.atlas(`tiles-level-${levelId}`, ...);

  // Collection scene
  this.load.atlas('cards-pack-1', ...); // Load cards on demand
  ```
- Compress textures:
  - Use WebP with fallback to PNG (50-80% size reduction)
  - Enable Texture Packer's "Scale" option to generate @2x and @1x versions
  - Detect device capability and load appropriate resolution:
    ```typescript
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
    const isLowEnd = navigator.hardwareConcurrency <= 4;
    const suffix = (isMobile || isLowEnd) ? '@1x' : '@2x';
    this.load.atlas('tiles', `tiles${suffix}.png`, `tiles${suffix}.json`);
    ```
- Destroy unused atlases after scene transition:
  ```typescript
  this.events.on('shutdown', () => {
    this.textures.remove('tiles-level-3');
  });
  ```
- Cap canvas resolution:
  ```typescript
  const config = {
    scale: {
      mode: Phaser.Scale.FIT,
      width: 1080, // Max logical width
      height: 1920, // Max logical height
      // Don't exceed 2x DPR even on high-end devices
      resolution: Math.min(window.devicePixelRatio, 2)
    }
  };
  ```
- Monitor texture memory in dev:
  ```typescript
  console.log('Texture memory:', this.textures.getTextureKeys().length, 'atlases');
  ```

**Detection:**
- Chrome DevTools Performance: Check GPU memory usage
- Safari crashes on iOS devices but not desktop
- Texture Packer output size > 2048x2048 (triggers multiple draw calls)
- FPS counter shows < 30 FPS on mobile after asset load
- White screen flash before crash

**Phase:** Phase 04-03 (Art & Asset Quality) - Must implement before rolling out 1024px assets

---

### Pitfall 4: Responsive Layout Retrofit - Scale Mode Conflicts
**What goes wrong:** Existing game uses `Phaser.Scale.FIT` for desktop. Adding responsive layout requires `Phaser.Scale.RESIZE` to handle mobile orientations. But `RESIZE` makes fullscreen non-responsive, while `FIT`/`ENVELOP` don't trigger resize events needed for repositioning persistent nav/header. Neither mode works for both cases.

**Why it happens:** Phaser's scale modes are mutually exclusive trade-offs. Changing scale mode mid-project affects all scenes, requiring repositioning logic in every scene's resize handler. Existing scene layouts assume fixed aspect ratio.

**Consequences:**
- Bottom nav appears off-screen on certain mobile aspect ratios
- Global header overlaps game board on narrow screens
- Level Select grid breaks layout on orientation change
- Collection card grid doesn't reflow properly
- Match-3 board tiles overlap UI elements

**Prevention:**
- Use RESIZE mode + manual letterboxing:
  ```typescript
  const config = {
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: 1080,
      height: 1920,
      // Handle aspect ratio manually in scenes
    }
  };
  ```
- Implement responsive layout utility:
  ```typescript
  // src/utils/ResponsiveLayout.ts
  export class ResponsiveLayout {
    static readonly DESIGN_WIDTH = 1080;
    static readonly DESIGN_HEIGHT = 1920;

    static getSafeArea(scene: Phaser.Scene) {
      const { width, height } = scene.scale;
      const designRatio = this.DESIGN_WIDTH / this.DESIGN_HEIGHT;
      const screenRatio = width / height;

      if (screenRatio > designRatio) {
        // Wider than design - pillarbox
        const safeWidth = height * designRatio;
        const offsetX = (width - safeWidth) / 2;
        return { x: offsetX, y: 0, width: safeWidth, height };
      } else {
        // Taller than design - letterbox
        const safeHeight = width / designRatio;
        const offsetY = (height - safeHeight) / 2;
        return { x: 0, y: offsetY, width, height: safeHeight };
      }
    }

    static anchorBottom(scene: Phaser.Scene, element: Phaser.GameObjects.GameObject, offset = 0) {
      const safe = this.getSafeArea(scene);
      element.setPosition(safe.x + safe.width / 2, safe.y + safe.height - offset);
    }
  }
  ```
- Add resize handler to EVERY scene:
  ```typescript
  // In create()
  this.scale.on('resize', this.handleResize, this);

  // In shutdown()
  this.scale.off('resize', this.handleResize, this);

  private handleResize(gameSize: Phaser.Structs.Size) {
    ResponsiveLayout.anchorBottom(this, this.bottomNav, 100);
    // Reposition all anchored elements
  }
  ```
- Test on device matrix:
  - iPhone SE (375x667, small)
  - iPhone 14 Pro (393x852, notch)
  - iPad (768x1024, tablet)
  - Android tablet landscape (1280x800)

**Detection:**
- UI elements appear partially off-screen
- Resize event doesn't fire when expected
- Elements positioned at (0,0) instead of anchored position
- Layout looks correct on one device but broken on another

**Phase:** Phase 04-02 (Global Header & Layout) - Must establish responsive foundation before adding persistent UI

---

### Pitfall 5: Persistent UI Input Blocking with Graphics Objects
**What goes wrong:** Bottom nav and global header use `Graphics` objects for backgrounds. Graphics fills don't block input by default - clicks pass through to game board underneath. Player clicks nav button but also triggers tile match. Or clicks through modal backdrop.

**Why it happens:** Phaser's input system only blocks for interactive objects. Graphics must explicitly call `setInteractive()` with hit area. Forgetting this (or copying non-interactive Graphics code) creates click-through bugs.

**Consequences:**
- Clicking bottom nav also matches tiles in Game scene
- Collection card modal allows clicking game board behind it
- Header buttons trigger level select icons underneath
- Impossible to determine intended click target
- User frustration from accidental actions

**Prevention:**
- Make Graphics interactive with explicit hit area:
  ```typescript
  // Create modal backdrop
  const backdrop = this.add.graphics();
  backdrop.fillStyle(0x000000, 0.7);
  backdrop.fillRect(0, 0, this.scale.width, this.scale.height);

  // CRITICAL: Make it block input
  backdrop.setInteractive(
    new Phaser.Geom.Rectangle(0, 0, this.scale.width, this.scale.height),
    Phaser.Geom.Rectangle.Contains
  );

  // Consume click events so they don't propagate
  backdrop.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    // Optionally close modal on backdrop click
    // But most importantly, prevent event from reaching objects behind
  });
  ```
- Layer persistent UI scenes above game scenes:
  ```typescript
  // In Boot scene
  this.scene.launch('BottomNavScene'); // Starts parallel scene
  this.scene.bringToTop('BottomNavScene'); // Ensures it's above

  // When launching Game scene
  this.scene.start('GameScene');
  this.scene.bringToTop('BottomNavScene'); // Keep nav on top
  ```
- Use scene sleep to disable input on background scenes:
  ```typescript
  // When showing modal
  this.scene.sleep('GameScene'); // Stops input processing
  this.scene.launch('CollectionModal');

  // When closing modal
  this.scene.stop('CollectionModal');
  this.scene.wake('GameScene'); // Re-enables input
  ```
- Create reusable ModalScene base class:
  ```typescript
  export class ModalScene extends Phaser.Scene {
    protected backdrop!: Phaser.GameObjects.Graphics;

    create() {
      this.createBackdrop();
    }

    private createBackdrop() {
      const { width, height } = this.scale;
      this.backdrop = this.add.graphics();
      this.backdrop.fillStyle(0x000000, 0.7);
      this.backdrop.fillRect(0, 0, width, height);
      this.backdrop.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, width, height),
        Phaser.Geom.Rectangle.Contains
      );
      this.backdrop.on('pointerdown', () => {
        // Consume event
      });
    }
  }
  ```

**Detection:**
- Clicking UI triggers game actions simultaneously
- Console shows multiple objects handling same click event
- Input debugger shows hit test passing through Graphics
- `willRender()` returns true but `input.enabled` is false for Graphics

**Phase:** Phase 04-01 (Bottom Navigation) and Phase 04-04 (Collection Cards) - Critical for modal and persistent UI

---

### Pitfall 6: Collection Economy Integration - Duplicate Currency Deduction
**What goes wrong:** Collection card pulls deduct coins from EconomyManager. If pull animation fails mid-way (user backgrounds app, network timeout during Firestore sync), retry logic deducts coins again. User loses 2x-5x currency for single pull.

**Why it happens:** Economy deduction happens immediately on button press, before async operations (animation, Firestore save, card reveal) complete. No transaction rollback mechanism. Firestore save failures are silent.

**Consequences:**
- User reports losing coins without receiving cards
- Pity counter increments but card collection doesn't update
- Firestore shows inconsistent state (coins deducted, no card added)
- Refund requests, negative reviews
- Game economy breaks (inflation from duplicate deductions)

**Prevention:**
- Implement transaction-based economy updates:
  ```typescript
  class EconomyManager {
    async executeTransaction(
      cost: { coins?: number; gems?: number },
      operation: () => Promise<void>,
      rollback: () => Promise<void>
    ): Promise<boolean> {
      // 1. Validate sufficient funds
      if (!this.canAfford(cost)) return false;

      // 2. Deduct optimistically (local state only)
      const previousState = this.snapshot();
      this.deduct(cost);

      try {
        // 3. Execute operation (animation, Firestore, etc)
        await operation();

        // 4. Persist to Firestore
        await this.saveToFirestore();

        return true;
      } catch (error) {
        // 5. Rollback on failure
        this.restore(previousState);
        await rollback();
        console.error('Transaction failed:', error);
        return false;
      }
    }
  }
  ```
- Use idempotency keys for Firestore writes:
  ```typescript
  async recordCardPull(pullId: string, card: CollectionCard) {
    const pullRef = doc(this.db, 'pulls', pullId);

    // Check if pull already processed
    const existing = await getDoc(pullRef);
    if (existing.exists()) {
      console.warn('Duplicate pull detected:', pullId);
      return existing.data();
    }

    // Atomic write - either all succeed or all fail
    const batch = writeBatch(this.db);
    batch.set(pullRef, { cardId: card.id, timestamp: Date.now() });
    batch.update(doc(this.db, 'economy', this.userId), {
      coins: increment(-card.cost),
    });
    batch.update(doc(this.db, 'collection', this.userId), {
      [`cards.${card.id}`]: true,
    });
    await batch.commit();
  }
  ```
- Disable pull button during transaction:
  ```typescript
  async handlePullCard() {
    this.pullButton.setInteractive(false); // Disable
    this.pullButton.setAlpha(0.5);

    const success = await this.economyManager.executeTransaction(
      { coins: 100 },
      async () => {
        await this.playPullAnimation();
        const card = await this.collectionManager.pullCard();
        await this.revealCard(card);
      },
      async () => {
        await this.showErrorMessage('Pull failed. Please try again.');
      }
    );

    this.pullButton.setInteractive(true); // Re-enable
    this.pullButton.setAlpha(1.0);
  }
  ```
- Add pull history validation:
  ```typescript
  // Before allowing pull
  const lastPullTime = this.collectionManager.getLastPullTime();
  const timeSinceLastPull = Date.now() - lastPullTime;
  if (timeSinceLastPull < 500) { // 500ms debounce
    console.warn('Duplicate pull attempt blocked');
    return;
  }
  ```

**Detection:**
- Economy coins decrease faster than pull count increases
- Firestore shows pulls without corresponding collection entries
- User reports "I clicked once but lost coins twice"
- Network tab shows multiple identical Firestore requests

**Phase:** Phase 04-04 (Collection Cards) - Must implement before collection pull feature goes live

---

## Moderate Pitfalls

### Pitfall 7: Parallel Scene Lifecycle Race Conditions
**What goes wrong:** Boot scene launches BottomNavScene in parallel with LevelSelect. BottomNavScene tries to access EconomyManager from registry before Boot finishes initializing it. Results in `undefined` errors or stale state.

**Prevention:**
- Use scene launch callbacks with dependencies:
  ```typescript
  // In Boot scene - ensure managers initialized first
  this.registry.set(REGISTRY_KEYS.ECONOMY_MANAGER, new EconomyManager());
  this.registry.set(REGISTRY_KEYS.COLLECTION_MANAGER, new CollectionManager());

  // Then launch dependent scenes
  this.scene.launch('BottomNavScene');
  this.scene.start('LevelSelect');
  ```
- Validate registry dependencies in scene create():
  ```typescript
  create() {
    const economy = this.registry.get(REGISTRY_KEYS.ECONOMY_MANAGER);
    if (!economy) {
      console.error('EconomyManager not initialized!');
      this.scene.start('Boot'); // Restart from boot
      return;
    }
    // Continue scene setup
  }
  ```
- Use events for late-binding dependencies:
  ```typescript
  // BottomNavScene
  create() {
    if (this.registry.get(REGISTRY_KEYS.ECONOMY_MANAGER)) {
      this.setupEconomyDisplay();
    } else {
      // Wait for ready event
      this.registry.events.once('economy-ready', () => {
        this.setupEconomyDisplay();
      });
    }
  }

  // Boot scene
  this.registry.set(REGISTRY_KEYS.ECONOMY_MANAGER, economy);
  this.registry.events.emit('economy-ready');
  ```

**Phase:** Phase 04-01 (Bottom Navigation) - When implementing parallel persistent UI scenes

---

### Pitfall 8: Texture Atlas Fragmentation with Incremental Art Updates
**What goes wrong:** Upgrading tiles from 512px to 1024px one-by-one creates mixed-resolution atlases. Some tiles @1x, some @2x in same atlas. Texture Packer generates inefficient packing. Visual inconsistency (some tiles crisp, others blurry).

**Prevention:**
- Batch art updates by atlas:
  ```
  Phase 04-03-01: tiles-basic atlas (all basic tiles @2x)
  Phase 04-03-02: tiles-special atlas (boosters, blockers @2x)
  Phase 04-03-03: ui-game atlas (all game UI @2x)
  ```
- Use Texture Packer "Scale" variants:
  ```bash
  # Generate both resolutions from source
  TexturePacker source/*.png \
    --format phaser3 \
    --scale 1.0 \
    --data tiles@2x.json \
    --sheet tiles@2x.png

  TexturePacker source/*.png \
    --format phaser3 \
    --scale 0.5 \
    --data tiles@1x.json \
    --sheet tiles@1x.png
  ```
- Version atlases in file names:
  ```
  tiles-v2-basic@2x.png  (1024px tiles)
  tiles-v1-basic@1x.png  (512px tiles, legacy)
  ```
- Update loading logic to prefer latest version:
  ```typescript
  const version = 'v2';
  const resolution = this.isHighEnd() ? '@2x' : '@1x';
  this.load.atlas('tiles', `tiles-${version}-basic${resolution}.png`, ...);
  ```

**Phase:** Phase 04-03 (Art & Asset Quality) - Plan before starting art upgrades

---

### Pitfall 9: Pity System State Desync Between Local and Firestore
**What goes wrong:** Pity counter increments locally after each pull. Firestore write batches every 5 pulls for performance. App crashes before batch write. User reopens app, pity counter resets to last saved value. User loses progress toward guaranteed card.

**Prevention:**
- Write pity counter immediately:
  ```typescript
  async incrementPityCounter() {
    this.pityCount++;
    this.emit('pity-updated', this.pityCount);

    // Don't batch pity writes - too important
    await updateDoc(doc(this.db, 'collection', this.userId), {
      pityCount: this.pityCount,
    });
  }
  ```
- Implement offline queue for critical writes:
  ```typescript
  class FirestoreQueue {
    private queue: Array<() => Promise<void>> = [];

    async enqueue(operation: () => Promise<void>, priority: 'high' | 'low') {
      if (priority === 'high') {
        // Execute immediately
        await operation();
      } else {
        // Batch later
        this.queue.push(operation);
      }
    }

    async flush() {
      await Promise.all(this.queue.map(op => op()));
      this.queue = [];
    }
  }

  // Pity counter = high priority
  await firestoreQueue.enqueue(() => this.savePityCount(), 'high');

  // Card view count = low priority (can batch)
  await firestoreQueue.enqueue(() => this.saveViewCount(), 'low');
  ```
- Add reconciliation on app start:
  ```typescript
  async reconcileState() {
    const [localPity, remotePity] = await Promise.all([
      this.getLocalPityCount(),
      this.getRemotePityCount(),
    ]);

    if (localPity !== remotePity) {
      console.warn(`Pity desync: local=${localPity}, remote=${remotePity}`);
      // Trust remote (server is source of truth)
      this.pityCount = remotePity;
      this.saveLocalPityCount(remotePity);
    }
  }
  ```

**Phase:** Phase 04-04 (Collection Cards) - Implement with pity system

---

### Pitfall 10: New Tile Types Break Existing Match-3 Engine Assumptions
**What goes wrong:** Adding new special tiles (from collections) assumes match-3 engine handles arbitrary tile types. Existing engine hard-codes tile sprite keys (tile_01, tile_02, etc). New tiles use different naming (tile_rare_01). Matching logic breaks, tiles don't render, or game crashes.

**Prevention:**
- Abstract tile rendering from tile type:
  ```typescript
  class Tile {
    constructor(
      public type: TileType, // enum: BASIC, RARE, EPIC, etc
      public variant: number, // 0-9 for color
      public x: number,
      public y: number
    ) {}

    getSpriteKey(): string {
      const prefix = {
        [TileType.BASIC]: 'tile',
        [TileType.RARE]: 'tile_rare',
        [TileType.EPIC]: 'tile_epic',
      }[this.type];

      return `${prefix}_${String(this.variant).padStart(2, '0')}`;
    }
  }
  ```
- Add tile type validation in level loader:
  ```typescript
  loadLevel(levelData: LevelData) {
    for (const tileData of levelData.tiles) {
      const spriteKey = this.getTileSpriteKey(tileData.type, tileData.variant);

      // Validate sprite exists before creating
      if (!this.textures.exists(spriteKey)) {
        console.error(`Missing tile sprite: ${spriteKey}`);
        // Fallback to basic tile
        spriteKey = 'tile_00';
      }

      const tile = this.createTile(spriteKey, tileData.x, tileData.y);
    }
  }
  ```
- Version level data schema:
  ```json
  {
    "version": 2,
    "tiles": [
      { "type": "rare", "variant": 3, "x": 2, "y": 4 }
    ]
  }
  ```
- Migration script for old levels:
  ```typescript
  function migrateLevelData(oldData: any): LevelData {
    if (oldData.version === 1) {
      // Convert old format to new
      return {
        version: 2,
        tiles: oldData.tiles.map((t: any) => ({
          type: 'basic',
          variant: t.type,
          x: t.x,
          y: t.y,
        })),
      };
    }
    return oldData;
  }
  ```

**Phase:** Phase 04-05 (New Tile Types) - Before integrating collection tiles into match-3

---

### Pitfall 11: Bottom Nav Depth Sorting with Tweens/Particles
**What goes wrong:** Bottom nav scene runs in parallel. Game scene creates particle effects (tile explosions, combo animations). Particles render above bottom nav because they're added after nav scene starts. Nav buttons become unclickable.

**Prevention:**
- Set explicit scene depth:
  ```typescript
  // In Boot scene
  this.scene.launch('GameScene');
  this.scene.launch('BottomNavScene');

  // In BottomNavScene.create()
  this.scene.setDepth(1000); // Always on top

  // In GameScene.create()
  this.scene.setDepth(0); // Below UI
  ```
- Use cameras for layering within scene:
  ```typescript
  // GameScene - separate camera for particles
  this.particleCamera = this.cameras.add(0, 0, width, height);
  this.particleCamera.setDepth(500); // Above game, below nav

  // Add particles to specific camera
  const emitter = this.add.particles(x, y, 'particle');
  emitter.setScrollFactor(0);
  this.particleCamera.ignore(this.gameBoard); // Only render particles
  ```
- Check scene depth when debugging:
  ```typescript
  console.log('Scene depths:', this.scene.manager.scenes.map(s =>
    `${s.scene.key}: ${s.scene.systems.depth}`
  ));
  ```

**Phase:** Phase 04-01 (Bottom Navigation) - Test with existing particle effects in Game scene

---

## Minor Pitfalls

### Pitfall 12: Global Header Z-Index Conflicts with Phaser Canvas
**What goes wrong:** Global header uses HTML/CSS (DOM) while game uses Canvas. Can't layer HTML between Phaser game objects. Header either fully above or fully below entire game canvas.

**Prevention:**
- Use DOMElement game objects for header:
  ```typescript
  const header = this.add.dom(centerX, 50).createFromHTML(`
    <div class="header">
      <div class="coins">1000</div>
      <div class="lives">5</div>
    </div>
  `);
  ```
- Or accept header as always-on-top overlay (simpler):
  ```css
  #game-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    pointer-events: auto; /* Blocks clicks */
  }

  #phaser-game {
    z-index: 1;
  }
  ```
- Reserve safe area in game layout:
  ```typescript
  // ResponsiveLayout.ts
  static readonly HEADER_HEIGHT = 80;

  static getGameArea(scene: Phaser.Scene) {
    const safe = this.getSafeArea(scene);
    return {
      ...safe,
      y: safe.y + this.HEADER_HEIGHT,
      height: safe.height - this.HEADER_HEIGHT,
    };
  }
  ```

**Phase:** Phase 04-02 (Global Header) - Decide DOM vs DOMElement approach early

---

### Pitfall 13: Collection Card Rarity Distribution Doesn't Feel Fair
**What goes wrong:** Implementing textbook gacha rates (70% common, 25% rare, 5% epic) feels worse than expected. Players perceive 3-4 consecutive common pulls as "rigged" even though statistically normal.

**Prevention:**
- Implement "bad luck protection" beyond pity:
  ```typescript
  class CollectionManager {
    private consecutiveCommons = 0;

    pullCard(): CollectionCard {
      const basePull = this.rollRarity();

      // After 3 commons, boost rare chance
      if (this.consecutiveCommons >= 3 && basePull === Rarity.COMMON) {
        const boosted = Math.random() < 0.3; // 30% upgrade chance
        if (boosted) {
          this.consecutiveCommons = 0;
          return this.getRandomCard(Rarity.RARE);
        }
      }

      if (basePull === Rarity.COMMON) {
        this.consecutiveCommons++;
      } else {
        this.consecutiveCommons = 0;
      }

      return this.getRandomCard(basePull);
    }
  }
  ```
- Use "deck shuffle" method (no true duplicates until deck exhausted):
  ```typescript
  class DeckBasedGacha {
    private deck: CollectionCard[] = [];

    constructor() {
      this.resetDeck();
    }

    pullCard(): CollectionCard {
      if (this.deck.length === 0) {
        this.resetDeck();
      }

      const index = Math.floor(Math.random() * this.deck.length);
      return this.deck.splice(index, 1)[0];
    }

    private resetDeck() {
      // 70 commons, 25 rares, 5 epics per "deck"
      this.deck = [
        ...Array(70).fill(null).map(() => this.getRandomCard(Rarity.COMMON)),
        ...Array(25).fill(null).map(() => this.getRandomCard(Rarity.RARE)),
        ...Array(5).fill(null).map(() => this.getRandomCard(Rarity.EPIC)),
      ];
    }
  }
  ```

**Phase:** Phase 04-04 (Collection Cards) - Tune after initial implementation

---

### Pitfall 14: Asset Preloading Blocks Scene Transitions
**What goes wrong:** Loading 1024px art assets takes 3-5 seconds on slow connections. Showing loading bar in current scene while loading next scene's assets causes jarring wait. User clicks level, waits 5 seconds, then sees game.

**Prevention:**
- Preload critical assets in Boot scene (immediate levels 1-3):
  ```typescript
  // Boot scene
  this.load.atlas('tiles-core', ...); // Used in first 3 levels
  this.load.atlas('ui-common', ...); // Nav, header, buttons

  // LevelSelect scene
  this.load.atlas('tiles-extended', ...); // Levels 4-10 (background)

  // Game scene
  const levelAssets = this.getLevelAssets(levelId);
  if (!this.textures.exists(levelAssets.atlas)) {
    this.showLoadingBar();
    this.load.atlas(levelAssets.atlas, ...);
    this.load.start();
  }
  ```
- Show loading scene between transitions:
  ```typescript
  // LevelSelect - user clicks level
  this.scene.launch('LoadingScene', { levelId: 3 });
  this.scene.sleep('LevelSelect');

  // LoadingScene
  create(data: { levelId: number }) {
    this.load.atlas(`level-${data.levelId}-tiles`, ...);
    this.load.on('progress', (value: number) => {
      this.progressBar.setScale(value, 1);
    });
    this.load.on('complete', () => {
      this.scene.stop('LoadingScene');
      this.scene.start('GameScene', data);
    });
    this.load.start();
  }
  ```
- Use texture placeholder during load:
  ```typescript
  const tile = this.add.sprite(x, y, 'tile-placeholder'); // Low-res fallback

  this.load.atlas('tiles-hd', ...);
  this.load.once('complete', () => {
    tile.setTexture('tiles-hd', frameName);
  });
  this.load.start();
  ```

**Phase:** Phase 04-03 (Art & Asset Quality) - Test on 3G network throttling

---

### Pitfall 15: Responsive Resize Event Throttling Causes Jank
**What goes wrong:** Phaser fires `resize` event on every pixel change during orientation transition. Repositioning entire UI on every event (30-60 times during rotation) causes visible jank and performance drop.

**Prevention:**
- Debounce resize handler:
  ```typescript
  private resizeTimeout?: NodeJS.Timeout;

  create() {
    this.scale.on('resize', this.handleResizeDebounced, this);
  }

  private handleResizeDebounced(gameSize: Phaser.Structs.Size) {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    this.resizeTimeout = setTimeout(() => {
      this.handleResize(gameSize);
    }, 100); // Wait for resize to stabilize
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    // Reposition UI elements
    ResponsiveLayout.anchorBottom(this, this.bottomNav);
  }
  ```
- Use container-based layout (reposition container, not children):
  ```typescript
  create() {
    this.uiContainer = this.add.container(0, 0);
    this.uiContainer.add([this.nav, this.header, this.buttons]);

    this.scale.on('resize', () => {
      // Only reposition container
      const safe = ResponsiveLayout.getSafeArea(this);
      this.uiContainer.setPosition(safe.x, safe.y);
      this.uiContainer.setScale(safe.width / 1080);
    });
  }
  ```

**Phase:** Phase 04-02 (Global Header & Layout) - Implement with responsive foundation

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 04-01: Bottom Navigation | Registry key inconsistency, event listener leaks, input blocking | Establish registry key constants, implement cleanup in sleep handler, test Graphics interactivity |
| Phase 04-02: Global Header & Layout | Scale mode conflicts, resize event jank, DOM vs Canvas layering | Choose RESIZE mode + manual letterboxing, debounce resize, decide DOM/DOMElement early |
| Phase 04-03: Art & Asset Quality | Memory explosion on mobile, texture atlas fragmentation, preload blocking | Multi-atlas strategy, batch art updates, implement device-based resolution loading |
| Phase 04-04: Collection Cards | Duplicate currency deduction, pity state desync, rarity distribution feel | Transaction-based economy, immediate pity writes, bad luck protection |
| Phase 04-05: New Tile Types | Match-3 engine assumptions, sprite key mismatches | Abstract tile rendering, validate sprites, version level schema |
| Phase 04-06: Responsive Fixes | Resize handler in every scene, depth sorting with parallel scenes | ResponsiveLayout utility, scene depth management, container-based layout |

---

## Sources

### Phaser 3 Scene Transitions & Persistent UI
- [Persistent UI objects/components on scenes - Phaser](https://phaser.discourse.group/t/persistent-ui-objects-components-on-scenes/2359)
- [Understanding Scene Transitions - Phaser 3](https://phaser.discourse.group/t/understanding-scene-transitions/5652)
- [Scene Transition Issues - Phaser 3](https://phaser.discourse.group/t/scene-transition-issues/2256)
- [Scene manager - Notes of Phaser 3](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/scenemanager/)
- [Troubleshooting Phaser: Scene Transitions](https://www.mindfulchase.com/explore/troubleshooting-tips/game-development-tools/troubleshooting-phaser-fixing-asset-loading,-scene-transitions,-animation-bugs,-physics-errors,-and-browser-compatibility.html)

### Phaser 3 Performance & High-Resolution Assets
- [Phaser 3 Mobile Performance (iOS/Android)](https://phaser.discourse.group/t/phaser-3-mobile-performance-ios-android/1435)
- [How I optimized my Phaser 3 action game — in 2025](https://franzeus.medium.com/how-i-optimized-my-phaser-3-action-game-in-2025-5a648753f62b)
- [What resolution is more suitable for game development?](https://phaser.discourse.group/t/what-resolution-is-more-suitable-for-game-development/13542)
- [Poor WebGL performance on high resolutions](https://github.com/photonstorm/phaser/issues/2908)
- [Performance Issue on low end mobile devices](https://github.com/phaserjs/phaser/issues/6989)

### Phaser 3 Responsive Layout
- [Mobile Responsive - Phaser 3](https://phaser.discourse.group/t/mobile-responsive/12284)
- [Full-Screen Size and Responsive Game in Phaser 3](https://medium.com/@tajammalmaqbool11/full-screen-size-and-responsive-game-in-phaser-3-e563c2d60eab)
- [Responsive game size in mobile browser](https://phaser.discourse.group/t/responsive-game-size-in-mobile-browser/12088)
- [UIMode: Adaptive UI System for Responsive Games](https://phaser.discourse.group/t/phaser-3-plugin-uimode-adaptive-ui-system-for-responsive-games/15287)

### Phaser 3 State Management
- [Any tips for making a cross-scene manager / singleton?](https://phaser.discourse.group/t/any-tips-for-making-a-cross-scene-manager-singleton/4578)
- [Stop Struggling with State in Phaser js: How Phaser-Hooks Will Revolutionize Your Code](https://medium.com/@renatocassino/stop-struggling-with-state-in-phaser-js-how-phaser-hooks-will-revolutionize-your-code-7c68f972ce5a)
- [State manager - Notes of Phaser 3](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/statemanager/)

### Phaser 3 Texture Management
- [Textures | Phaser Help](https://docs.phaser.io/phaser/concepts/textures)
- [Working with Texture Atlases in Phaser 3](https://airum82.medium.com/working-with-texture-atlases-in-phaser-3-25c4df9a747a)
- [Texture atlas - Phaser 3](https://phaser.discourse.group/t/texture-atlas/13129)

### Phaser 3 DOM Elements
- [DOMElement | Phaser Help](https://docs.phaser.io/api-documentation/class/gameobjects-domelement)
- [Dom Element](https://docs.phaser.io/phaser/concepts/gameobjects/dom-element)
- [DOM element - Notes of Phaser 3](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/domelement/)

### Match-3 Meta Progression
- [How to Crack the Match 3 Code? - Part 2](https://www.gameanalytics.com/blog/crack-the-match-3-code-part-2)
- [Match3 – Meta Layers and Matching Types](https://www.gamerefinery.com/match3-meta-layers-matching-types/)
- [Casual Match3 + Meta Layer = New Winning Formula?](https://www.gamerefinery.com/casual-match3-meta-layer-new-winning-formula/)
