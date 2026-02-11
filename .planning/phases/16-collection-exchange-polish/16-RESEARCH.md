# Phase 16: Collection Exchange & Polish - Research

**Researched:** 2026-02-11
**Domain:** Collection exchange mechanics, exchange animations, notification badges, event-driven UI updates
**Confidence:** HIGH

## Summary

Phase 16 implements the final piece of the collection system: exchanging complete collections (6/6) for coupons. The exchange button activates when all 6 cards are owned, deducts exactly 6 cards (one of each, preserving duplicates), plays a multi-stage animation (fold → compress → explode → coupon reveal), and allows repeatable exchanges. A notification dot appears on the Collections tab in the bottom nav whenever at least one collection is ready for exchange.

The technical foundation leverages existing patterns: CollectionsManager gains event emission (extending EventEmitter like EconomyManager), UIScene subscribes to collection state changes for reactive notification dot updates, and exchange animations use Phaser's tween system (proven in CardPickOverlay flip animations). The challenge lies in defining the exchange flow (what happens to cards, how state updates), animating the multi-stage sequence smoothly, and managing the notification dot lifecycle (show when ready, hide after exchange).

**Primary recommendation:** Extend CollectionsManager to emit 'collection-exchangeable' event when any collection reaches 6/6, add exchange button to Collections scene that triggers multi-stage animation sequence using Phaser tweens, deduct one of each card ID from owned_cards array (preserving duplicates), and add notification dot to UIScene that reactively shows/hides based on CollectionsManager state.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser | 3.90.0 | Tween-based exchange animations | Already in project, proven animation patterns in CardPickOverlay and VFXManager |
| TypeScript | 5.7.0 | Type-safe exchange logic and state management | Project standard, prevents exchange bugs |
| Firebase Firestore | 11.0.0 | Persist collection state after exchange | Already integrated, CollectionsManager uses it |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | - | All features built-in | Event emission, tweens, and state management use Phaser + TypeScript |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| EventEmitter pattern | Custom callback system | EventEmitter is proven in EconomyManager, supports multiple subscribers |
| Phaser tweens | CSS animations | CSS breaks Phaser rendering model; tweens are GPU-accelerated and consistent |
| Notification dot in UIScene | Separate notification service | UIScene already manages bottom nav; adding dot there keeps logic centralized |
| Per-card deduction | Reset entire collection | Per-card deduction preserves duplicates (COL-11 requirement) |

**Installation:**
```bash
# No additional packages needed - all features built into Phaser 3.90.0
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── game/
│   └── CollectionsManager.ts      # Add EventEmitter extension, exchangeCollection() method
├── scenes/
│   ├── Collections.ts              # Add exchange button, exchange animation overlay
│   └── UIScene.ts                  # Add notification dot, subscribe to collection events
└── firebase/
    └── firestore.ts                # No changes needed, saveCollections() already exists
```

### Pattern 1: CollectionsManager Event Emission

**What:** Extend CollectionsManager to inherit from Phaser.Events.EventEmitter and emit 'collection-exchangeable' event when any collection reaches 6/6 completion. UIScene subscribes to this event to show/hide notification dot.

**When to use:** When UI needs to reactively update based on manager state changes.

**Example:**
```typescript
// src/game/CollectionsManager.ts - add EventEmitter like EconomyManager
import Phaser from 'phaser';

export class CollectionsManager extends Phaser.Events.EventEmitter {
  private firestoreService: FirestoreService;
  private uid: string;
  private state: CollectionState;

  constructor(firestoreService: FirestoreService, uid: string, initialState: CollectionState) {
    super(); // EventEmitter constructor
    this.firestoreService = firestoreService;
    this.uid = uid;
    this.state = initialState;
  }

  /**
   * Check if any collection is ready for exchange (6/6 complete).
   */
  hasExchangeableCollection(): boolean {
    const collectionIds = ['coffee', 'food', 'car'];
    return collectionIds.some(id => this.isCollectionComplete(id));
  }

  /**
   * Exchange a complete collection for a coupon.
   * Deducts exactly 6 cards (one of each), preserving duplicates.
   * Emits 'collection-exchanged' event after successful exchange.
   */
  async exchangeCollection(collectionId: string): Promise<boolean> {
    if (!this.isCollectionComplete(collectionId)) {
      console.error('[CollectionsManager] Cannot exchange incomplete collection:', collectionId);
      return false;
    }

    const collection = this.state.collections[collectionId];
    const allCards = getCardsForCollection(collectionId);

    // Deduct one of each card (6 total)
    allCards.forEach(card => {
      const index = collection.owned_cards.indexOf(card.id);
      if (index !== -1) {
        collection.owned_cards.splice(index, 1); // Remove first occurrence
      }
    });

    console.log('[CollectionsManager] Exchanged collection:', collectionId);

    // Emit event for UI updates (notification dot, exchange button state)
    this.emit('collection-exchanged', collectionId);

    // Check if any collections still exchangeable (for notification dot)
    if (!this.hasExchangeableCollection()) {
      this.emit('no-exchangeable-collections');
    }

    await this.save();
    return true;
  }

  // Call after adding cards to check if collection just became complete
  private checkExchangeableState(): void {
    if (this.hasExchangeableCollection()) {
      this.emit('collection-exchangeable');
    }
  }
}
```

**Source:** Project pattern from `/src/game/EconomyManager.ts` (extends EventEmitter, emits 'lives-changed' and 'bonuses-changed' events)

### Pattern 2: Notification Dot in UIScene

**What:** Add small colored circle (notification dot) to Collections tab icon when at least one collection is 6/6 ready for exchange. Dot appears/disappears reactively based on CollectionsManager events.

**When to use:** Visual indicator of pending actions without navigating to screen.

**Example:**
```typescript
// src/scenes/UIScene.ts - add notification dot to Collections tab
export class UIScene extends Phaser.Scene {
  private collectionsNotificationDot: Phaser.GameObjects.Circle | null = null;
  private collections: CollectionsManager | null = null;

  create(): void {
    // ... existing header and bottom nav creation ...

    // Subscribe to collection events
    this.collections = this.registry.get('collections') as CollectionsManager;
    if (this.collections) {
      this.collections.on('collection-exchangeable', this.showNotificationDot, this);
      this.collections.on('collection-exchanged', this.updateNotificationDot, this);
      this.collections.on('no-exchangeable-collections', this.hideNotificationDot, this);

      // Initial check
      if (this.collections.hasExchangeableCollection()) {
        this.showNotificationDot();
      }
    }
  }

  private createTabButton(x: number, navCenterY: number, label: string, icon: string, tabId: string): void {
    // ... existing tab button creation ...

    // Add notification dot for Collections tab
    if (tabId === 'collections') {
      const dotX = x + cssToGame(12); // Top-right of icon
      const dotY = navCenterY - cssToGame(12);
      this.collectionsNotificationDot = this.add.circle(dotX, dotY, cssToGame(4), 0xff4444, 1);
      this.collectionsNotificationDot.setScrollFactor(0);
      this.collectionsNotificationDot.setDepth(202);
      this.collectionsNotificationDot.setVisible(false); // Hidden by default
    }
  }

  private showNotificationDot = (): void => {
    if (this.collectionsNotificationDot) {
      this.collectionsNotificationDot.setVisible(true);
    }
  };

  private hideNotificationDot = (): void => {
    if (this.collectionsNotificationDot) {
      this.collectionsNotificationDot.setVisible(false);
    }
  };

  private updateNotificationDot = (): void => {
    if (this.collections) {
      const hasExchangeable = this.collections.hasExchangeableCollection();
      if (this.collectionsNotificationDot) {
        this.collectionsNotificationDot.setVisible(hasExchangeable);
      }
    }
  };

  private onShutdown = (): void => {
    // Remove collection event listeners
    if (this.collections) {
      this.collections.off('collection-exchangeable', this.showNotificationDot);
      this.collections.off('collection-exchanged', this.updateNotificationDot);
      this.collections.off('no-exchangeable-collections', this.hideNotificationDot);
    }
    // ... existing cleanup ...
  };
}
```

**Source:** Project pattern from `/src/scenes/UIScene.ts` (reactive header updates from EconomyManager events)

### Pattern 3: Exchange Button State Management

**What:** Exchange button in Collections scene is only interactive when collection is 6/6 complete. Button has active (gold, interactive) and disabled (gray, non-interactive) states.

**When to use:** Action buttons that depend on state conditions.

**Example:**
```typescript
// src/scenes/Collections.ts - add exchange button per collection
private createCollectionBlock(collectionId: string, y: number): void {
  const collections = this.registry.get('collections') as CollectionsManager;
  const isComplete = collections.isCollectionComplete(collectionId);

  // ... render collection cards ...

  // Exchange button
  const buttonY = y + cssToGame(300); // Below card grid
  const button = this.createExchangeButton(width / 2, buttonY, collectionId, isComplete);
  this.allElements.push(button);
}

private createExchangeButton(
  x: number,
  y: number,
  collectionId: string,
  isActive: boolean
): Phaser.GameObjects.Container {
  const container = this.add.container(x, y);

  // Button background
  const bg = this.add.graphics();
  const color = isActive ? 0xffb800 : 0xaaaaaa; // Gold if active, gray if disabled
  bg.fillStyle(color, 1);
  bg.fillRoundedRect(-cssToGame(100), -cssToGame(20), cssToGame(200), cssToGame(40), cssToGame(8));
  container.add(bg);

  // Button text
  const text = this.add.text(0, 0, 'Обміняти на купон', {
    fontFamily: 'Arial, sans-serif',
    fontSize: `${cssToGame(14)}px`,
    color: isActive ? '#1A1A1A' : '#666666',
    fontStyle: 'bold',
  });
  text.setOrigin(0.5);
  container.add(text);

  // Make interactive only if active
  if (isActive) {
    container.setSize(cssToGame(200), cssToGame(40));
    container.setInteractive({ useHandCursor: true });
    container.on('pointerup', () => this.startExchangeAnimation(collectionId));

    // Hover effect
    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.05, duration: 150 });
    });
    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1.0, duration: 150 });
    });
  }

  return container;
}
```

**Source:** Project pattern from `/src/scenes/CardPickOverlay.ts` (button creation with KLO_YELLOW styling)

### Pattern 4: Multi-Stage Exchange Animation Sequence

**What:** Exchange animation plays in overlay: cards fold → compress to center → explode with particles → coupon reveal → "Забрати купон" button. Uses Phaser tween chains with delayedCall for sequencing.

**When to use:** Complex animation sequences with multiple stages.

**Example:**
```typescript
// src/scenes/Collections.ts - exchange animation overlay
private async startExchangeAnimation(collectionId: string): Promise<void> {
  const width = this.cameras.main.width;
  const height = this.cameras.main.height;
  const overlayElements: Phaser.GameObjects.GameObject[] = [];

  // Disable input during animation
  this.input.enabled = false;

  // Dark backdrop
  const backdrop = this.add.graphics();
  backdrop.fillStyle(0x000000, 0.75);
  backdrop.fillRect(0, 0, width, height);
  backdrop.setDepth(500);
  backdrop.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
  overlayElements.push(backdrop);

  // Get all 6 cards for animation
  const cards = getCardsForCollection(collectionId);
  const cardContainers: Phaser.GameObjects.Container[] = [];

  // Stage 1: Show 6 cards in grid (same layout as collection display)
  const cardSize = cssToGame(80);
  const gap = cssToGame(12);
  const gridWidth = 3 * cardSize + 2 * gap;
  const startX = (width - gridWidth) / 2;
  const startY = height * 0.35;

  for (let i = 0; i < 6; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cardX = startX + col * (cardSize + gap) + cardSize / 2;
    const cardY = startY + row * (cardSize + gap) + cardSize / 2;

    const container = this.add.container(cardX, cardY);
    const cardImage = this.add.image(0, 0, cards[i].textureKey);
    cardImage.setDisplaySize(cardSize, cardSize * 1.66); // 696:1158 aspect ratio
    container.add(cardImage);
    container.setDepth(501);
    cardContainers.push(container);
    overlayElements.push(container);
  }

  // Wait 300ms, then start fold animation
  await new Promise(resolve => this.time.delayedCall(300, resolve));

  // Stage 2: Fold cards (scale down + rotate slightly)
  const foldPromises = cardContainers.map((container, i) => {
    return new Promise<void>(resolve => {
      this.tweens.add({
        targets: container,
        scaleX: 0.2,
        scaleY: 0.8,
        angle: (i % 2 === 0) ? -15 : 15, // Alternate tilt
        duration: 400,
        ease: 'Quad.In',
        onComplete: () => resolve(),
      });
    });
  });
  await Promise.all(foldPromises);

  // Stage 3: Compress to center
  const centerX = width / 2;
  const centerY = height / 2;
  const compressPromises = cardContainers.map(container => {
    return new Promise<void>(resolve => {
      this.tweens.add({
        targets: container,
        x: centerX,
        y: centerY,
        scale: 0,
        duration: 500,
        ease: 'Cubic.In',
        onComplete: () => resolve(),
      });
    });
  });
  await Promise.all(compressPromises);

  // Stage 4: Explode with particles (VFXManager pattern)
  this.cameras.main.flash(150, 255, 184, 0); // Gold flash
  this.cameras.main.shake(200, 0.008);

  const emitter = this.add.particles(centerX, centerY, 'particle_white', {
    speed: { min: 100, max: 300 },
    scale: { start: 0.8, end: 0 },
    lifespan: { min: 400, max: 800 },
    tint: [0xffb800, 0xffffff, 0xff6600],
    maxParticles: 50,
    emitting: false,
  });
  emitter.setDepth(502);
  emitter.explode(50);
  overlayElements.push(emitter);

  await new Promise(resolve => this.time.delayedCall(600, resolve));

  // Stage 5: Coupon reveal (fade in + scale up)
  const meta = getCollectionMeta(collectionId);
  const couponText = this.add.text(centerX, centerY - cssToGame(50), `${meta.nameUk} — Купон`, {
    fontFamily: 'Arial, sans-serif',
    fontSize: `${cssToGame(24)}px`,
    color: '#FFB800',
    fontStyle: 'bold',
  });
  couponText.setOrigin(0.5);
  couponText.setDepth(501);
  couponText.setAlpha(0);
  couponText.setScale(0.5);
  overlayElements.push(couponText);

  const rewardText = this.add.text(centerX, centerY, meta.rewardDescription, {
    fontFamily: 'Arial, sans-serif',
    fontSize: `${cssToGame(16)}px`,
    color: '#F9F9F9',
  });
  rewardText.setOrigin(0.5);
  rewardText.setDepth(501);
  rewardText.setAlpha(0);
  rewardText.setScale(0.5);
  overlayElements.push(rewardText);

  this.tweens.add({
    targets: [couponText, rewardText],
    alpha: 1,
    scale: 1,
    duration: 500,
    ease: 'Back.Out',
  });

  await new Promise(resolve => this.time.delayedCall(600, resolve));

  // Stage 6: Show "Забрати купон" button
  const button = this.createClaimButton(centerX, centerY + cssToGame(80), overlayElements, collectionId);
  button.setDepth(501);
  overlayElements.push(button);

  // Re-enable input for button
  this.input.enabled = true;
}

private createClaimButton(
  x: number,
  y: number,
  overlayElements: Phaser.GameObjects.GameObject[],
  collectionId: string
): Phaser.GameObjects.Container {
  const container = this.add.container(x, y);

  // Button background
  const bg = this.add.graphics();
  bg.fillStyle(0xffb800, 1);
  bg.fillRoundedRect(-cssToGame(90), -cssToGame(22), cssToGame(180), cssToGame(44), cssToGame(8));
  container.add(bg);

  // Button text
  const text = this.add.text(0, 0, 'Забрати купон', {
    fontFamily: 'Arial, sans-serif',
    fontSize: `${cssToGame(16)}px`,
    color: '#1A1A1A',
    fontStyle: 'bold',
  });
  text.setOrigin(0.5);
  container.add(text);

  // Make interactive
  container.setSize(cssToGame(180), cssToGame(44));
  container.setInteractive({ useHandCursor: true });

  container.on('pointerup', async () => {
    // Execute exchange in CollectionsManager
    const collections = this.registry.get('collections') as CollectionsManager;
    await collections.exchangeCollection(collectionId);

    // Clean up overlay
    overlayElements.forEach(el => el.destroy());

    // Rebuild UI to reflect new state (collection no longer 6/6)
    this.buildCollectionsUI();
  });

  // Hover effect
  container.on('pointerover', () => {
    this.tweens.add({ targets: container, scale: 1.05, duration: 150 });
  });

  container.on('pointerout', () => {
    this.tweens.add({ targets: container, scale: 1.0, duration: 150 });
  });

  return container;
}
```

**Source:** Animation pattern inspired by `/src/scenes/CardPickOverlay.ts` (flip animation), `/src/game/VFXManager.ts` (particle effects), and `/src/scenes/Game.ts` (tween chains for booster effects)

### Pattern 5: Duplicate Preservation During Exchange

**What:** When exchanging 6/6 collection, deduct exactly one instance of each card ID. If user has duplicates (e.g., 3x coffee_01), only 1 is removed, 2 remain.

**When to use:** Inventory deduction that preserves extras.

**Example:**
```typescript
// src/game/CollectionsManager.ts - exchange logic
async exchangeCollection(collectionId: string): Promise<boolean> {
  if (!this.isCollectionComplete(collectionId)) {
    return false;
  }

  const collection = this.state.collections[collectionId];
  const allCards = getCardsForCollection(collectionId); // 6 unique cards

  // Deduct one of each card
  allCards.forEach(card => {
    const index = collection.owned_cards.indexOf(card.id);
    if (index !== -1) {
      collection.owned_cards.splice(index, 1); // Remove first occurrence only
    }
  });

  // Example state before exchange:
  // owned_cards: ['coffee_01', 'coffee_01', 'coffee_02', 'coffee_03', 'coffee_04', 'coffee_05', 'coffee_06']
  // After exchange:
  // owned_cards: ['coffee_01'] (duplicate preserved)

  console.log('[CollectionsManager] Exchanged collection:', collectionId, 'Remaining:', collection.owned_cards);

  this.emit('collection-exchanged', collectionId);
  await this.save();
  return true;
}
```

**Source:** Standard array manipulation, requirement COL-11 specifies "deducts exactly 6 cards, keeps duplicates"

### Anti-Patterns to Avoid

- **Clearing entire collection on exchange:** COL-11 requires keeping duplicates. Don't reset `owned_cards` array to `[]`.
- **Blocking exchange during animation:** User should not be able to click exchange button on other collections while animation plays. Disable input globally during animation.
- **Hardcoding notification dot position:** Use cssToGame() for responsive positioning relative to Collections tab icon.
- **Not unsubscribing from events:** UIScene must remove CollectionsManager event listeners on shutdown to prevent memory leaks.
- **Animating too slowly:** Exchange animation should feel snappy (total <3 seconds). Long animations frustrate users.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Event-driven state updates | Custom callback registry | Phaser.Events.EventEmitter | EventEmitter proven in EconomyManager, supports multiple subscribers, standard pattern |
| Animation sequencing | Custom promise chain manager | Phaser tween chains + time.delayedCall | Built-in, proven in CardPickOverlay flip animations |
| Notification dot lifecycle | Manual show/hide logic per scene | Reactive subscription to manager events | Single source of truth, UIScene auto-updates when state changes |
| Duplicate card tracking | Custom inventory deduction logic | Array.splice() with indexOf() | Standard JS, removes first occurrence only (preserves duplicates) |

**Key insight:** This phase is 60% state management (when to show button/dot, how to deduct cards) and 40% animation polish. Don't over-engineer animation — use proven tween patterns from CardPickOverlay and VFXManager.

## Common Pitfalls

### Pitfall 1: Exchange Button Not Disabled After Click
**What goes wrong:** User clicks exchange button multiple times rapidly before animation completes, triggering multiple exchanges.

**Why it happens:** Button remains interactive during animation.

**How to avoid:** Disable scene input (`this.input.enabled = false`) immediately when exchange starts, re-enable only after "Забрати купон" button appears.

**Warning signs:** Console logs show multiple exchange calls, user loses more than 6 cards.

### Pitfall 2: Notification Dot Not Hiding After Exchange
**What goes wrong:** Notification dot remains visible after exchanging last complete collection.

**Why it happens:** UIScene not subscribed to 'collection-exchanged' event, or event not emitted after exchange.

**How to avoid:** CollectionsManager must emit 'collection-exchanged' event after successful exchange, UIScene subscribes and checks `hasExchangeableCollection()` to update dot visibility.

**Warning signs:** Dot visible when all collections are incomplete.

### Pitfall 3: Animation Overlay Not Cleaning Up
**What goes wrong:** Exchange animation elements (backdrop, cards, particles) remain visible after closing overlay, blocking input.

**Why it happens:** Overlay elements not tracked in array for batch destroy.

**How to avoid:** Store all overlay elements in `overlayElements[]` array, destroy all at once when closing overlay. Same pattern as CardPickOverlay.

**Warning signs:** Dark backdrop persists after exchange, Collections scene elements not interactive.

### Pitfall 4: Particle Emitter Not Self-Cleaning
**What goes wrong:** Particle emitter continues running after animation completes, consuming memory.

**Why it happens:** Emitter created but never destroyed.

**How to avoid:** Add emitter to `overlayElements[]` array or call `emitter.destroy()` after explosion completes (use time.delayedCall). Follow VFXManager pattern.

**Warning signs:** Increasing memory usage after multiple exchanges, particles appearing in wrong scenes.

### Pitfall 5: Exchange State Not Persisted
**What goes wrong:** User exchanges collection, refreshes page, collection is still 6/6.

**Why it happens:** `exchangeCollection()` doesn't call `save()` to persist state to Firestore.

**How to avoid:** Always call `await this.save()` after modifying collection state. Same pattern as `addCard()` and `selectCard()`.

**Warning signs:** Exchange works in-session but reverts after refresh.

## Code Examples

Verified patterns from official sources and project codebase:

### CollectionsManager with EventEmitter
```typescript
// src/game/CollectionsManager.ts - extend EventEmitter like EconomyManager
import Phaser from 'phaser';
import { FirestoreService, CollectionState } from '../firebase/firestore';
import { getCardsForCollection } from './collectionConfig';

export class CollectionsManager extends Phaser.Events.EventEmitter {
  private firestoreService: FirestoreService;
  private uid: string;
  private state: CollectionState;

  constructor(firestoreService: FirestoreService, uid: string, initialState: CollectionState) {
    super(); // EventEmitter constructor
    this.firestoreService = firestoreService;
    this.uid = uid;
    this.state = initialState;
    console.log('[CollectionsManager] Initialized with EventEmitter');
  }

  /**
   * Check if any collection is ready for exchange.
   */
  hasExchangeableCollection(): boolean {
    return ['coffee', 'food', 'car'].some(id => this.isCollectionComplete(id));
  }

  /**
   * Exchange complete collection for coupon.
   * Deducts one of each card, preserving duplicates.
   */
  async exchangeCollection(collectionId: string): Promise<boolean> {
    if (!this.isCollectionComplete(collectionId)) {
      console.error('[CollectionsManager] Cannot exchange incomplete collection');
      return false;
    }

    const collection = this.state.collections[collectionId];
    const allCards = getCardsForCollection(collectionId);

    // Deduct one of each card
    allCards.forEach(card => {
      const index = collection.owned_cards.indexOf(card.id);
      if (index !== -1) {
        collection.owned_cards.splice(index, 1);
      }
    });

    console.log('[CollectionsManager] Exchanged:', collectionId, 'Remaining:', collection.owned_cards);

    // Emit events for reactive UI updates
    this.emit('collection-exchanged', collectionId);
    if (!this.hasExchangeableCollection()) {
      this.emit('no-exchangeable-collections');
    }

    await this.save();
    return true;
  }

  // Override selectCard to emit exchangeable event when collection completes
  async selectCard(collectionId: string, cardId: string): Promise<boolean> {
    const wasComplete = this.isCollectionComplete(collectionId);
    const isNew = !this.state.collections[collectionId].owned_cards.includes(cardId);

    // ... existing selectCard logic ...

    // Check if collection just became complete
    if (!wasComplete && this.isCollectionComplete(collectionId)) {
      this.emit('collection-exchangeable');
    }

    return isNew;
  }

  private async save(): Promise<void> {
    await this.firestoreService.saveCollections(this.uid, this.state);
  }
}
```

### Notification Dot in UIScene
```typescript
// src/scenes/UIScene.ts - add notification dot to Collections tab
private collectionsNotificationDot: Phaser.GameObjects.Circle | null = null;

private createTabButton(x: number, navCenterY: number, label: string, icon: string, tabId: string): void {
  // ... existing tab button creation ...

  // Add notification dot for Collections tab
  if (tabId === 'collections') {
    const dotX = x + cssToGame(12);
    const dotY = navCenterY - cssToGame(12);
    this.collectionsNotificationDot = this.add.circle(dotX, dotY, cssToGame(4), 0xff4444, 1);
    this.collectionsNotificationDot.setScrollFactor(0);
    this.collectionsNotificationDot.setDepth(202);
    this.collectionsNotificationDot.setVisible(false);
  }
}

private setupReactiveUpdates(): void {
  // ... existing economy subscriptions ...

  // Subscribe to collection events
  const collections = this.registry.get('collections') as CollectionsManager;
  if (collections) {
    collections.on('collection-exchangeable', this.showNotificationDot, this);
    collections.on('collection-exchanged', this.updateNotificationDot, this);
    collections.on('no-exchangeable-collections', this.hideNotificationDot, this);

    // Initial check
    if (collections.hasExchangeableCollection()) {
      this.showNotificationDot();
    }
  }
}

private showNotificationDot = (): void => {
  if (this.collectionsNotificationDot) {
    this.collectionsNotificationDot.setVisible(true);
  }
};

private hideNotificationDot = (): void => {
  if (this.collectionsNotificationDot) {
    this.collectionsNotificationDot.setVisible(false);
  }
};

private updateNotificationDot = (): void => {
  const collections = this.registry.get('collections') as CollectionsManager;
  if (collections && this.collectionsNotificationDot) {
    this.collectionsNotificationDot.setVisible(collections.hasExchangeableCollection());
  }
};

private onShutdown = (): void => {
  // Remove collection event listeners
  const collections = this.registry.get('collections') as CollectionsManager;
  if (collections) {
    collections.off('collection-exchangeable', this.showNotificationDot);
    collections.off('collection-exchanged', this.updateNotificationDot);
    collections.off('no-exchangeable-collections', this.hideNotificationDot);
  }
  // ... existing cleanup ...
};
```

### Exchange Animation Sequence
```typescript
// src/scenes/Collections.ts - multi-stage exchange animation
private async startExchangeAnimation(collectionId: string): Promise<void> {
  const width = this.cameras.main.width;
  const height = this.cameras.main.height;
  const overlayElements: Phaser.GameObjects.GameObject[] = [];

  // Disable input during animation
  this.input.enabled = false;

  // Dark backdrop
  const backdrop = this.add.graphics();
  backdrop.fillStyle(0x000000, 0.75);
  backdrop.fillRect(0, 0, width, height);
  backdrop.setDepth(500);
  backdrop.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
  overlayElements.push(backdrop);

  // Stage 1: Show cards in grid
  const cards = getCardsForCollection(collectionId);
  const cardContainers: Phaser.GameObjects.Container[] = [];
  const cardSize = cssToGame(80);

  // Create card grid (same as collection display)
  // ... card creation logic ...

  // Stage 2: Fold animation (scale down + rotate)
  await Promise.all(cardContainers.map(container => {
    return new Promise<void>(resolve => {
      this.tweens.add({
        targets: container,
        scaleX: 0.2,
        scaleY: 0.8,
        angle: 15,
        duration: 400,
        ease: 'Quad.In',
        onComplete: () => resolve(),
      });
    });
  }));

  // Stage 3: Compress to center
  const centerX = width / 2;
  const centerY = height / 2;
  await Promise.all(cardContainers.map(container => {
    return new Promise<void>(resolve => {
      this.tweens.add({
        targets: container,
        x: centerX,
        y: centerY,
        scale: 0,
        duration: 500,
        ease: 'Cubic.In',
        onComplete: () => resolve(),
      });
    });
  }));

  // Stage 4: Explode with particles
  this.cameras.main.flash(150, 255, 184, 0);
  const emitter = this.add.particles(centerX, centerY, 'particle_white', {
    speed: { min: 100, max: 300 },
    scale: { start: 0.8, end: 0 },
    lifespan: 600,
    tint: [0xffb800, 0xffffff],
    maxParticles: 50,
    emitting: false,
  });
  emitter.explode(50);
  overlayElements.push(emitter);

  await new Promise(resolve => this.time.delayedCall(600, resolve));

  // Stage 5: Coupon reveal (fade in + scale up)
  const meta = getCollectionMeta(collectionId);
  const couponText = this.add.text(centerX, centerY, meta.nameUk, {
    fontSize: `${cssToGame(24)}px`,
    color: '#FFB800',
    fontStyle: 'bold',
  });
  couponText.setOrigin(0.5);
  couponText.setDepth(501);
  couponText.setAlpha(0);
  overlayElements.push(couponText);

  this.tweens.add({
    targets: couponText,
    alpha: 1,
    scale: 1,
    duration: 500,
    ease: 'Back.Out',
  });

  // Stage 6: Show "Забрати купон" button
  const button = this.createClaimButton(centerX, centerY + cssToGame(80), overlayElements, collectionId);
  overlayElements.push(button);

  // Re-enable input for button
  this.input.enabled = true;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual state polling | Event-driven reactive UI | Phaser 3 EventEmitter (2018+) | UI auto-updates when state changes, no polling needed |
| CSS animations in overlays | Phaser tween system | Phaser 3.0 (2018) | GPU-accelerated, consistent with game rendering |
| Notification badges as images | Runtime graphics circles | Phaser 3 Graphics API | No asset loading, scalable, easy to theme |
| Hard-reset inventory on exchange | Per-item deduction | Modern inventory systems 2020+ | Preserves duplicates, fairer to players |

**Deprecated/outdated:**
- Manual state synchronization: Use EventEmitter for reactive updates (proven in EconomyManager)
- Scene transition for exchanges: Use overlay pattern (keeps context, no scene switching)
- Hardcoded animation timings: Use config-driven delays for easy tuning

## Open Questions

1. **Should exchange animation be skippable?**
   - What we know: Animation is ~2.5 seconds total. Some users may want instant exchange.
   - What's unclear: User testing needed to see if animation feels too slow.
   - Recommendation: Implement full animation for Phase 16. Add skip option (tap backdrop to skip) in future polish phase if users complain.

2. **Should notification dot pulse/animate?**
   - What we know: Static red dot is simplest implementation. Pulsing dot is more eye-catching.
   - What's unclear: Whether static dot is noticeable enough.
   - Recommendation: Start with static dot. Add pulse tween (scale 1.0 → 1.2 loop) in future if dot is too subtle.

3. **Should CollectionsManager track exchange history?**
   - What we know: COL-13 allows repeatable exchanges. No requirement to track exchange count.
   - What's unclear: Whether analytics or future features need exchange history.
   - Recommendation: Don't track history in Phase 16. Add if analytics requirement added later.

## Sources

### Primary (HIGH confidence)
- Project codebase: `/src/game/EconomyManager.ts` - EventEmitter pattern with reactive subscriptions
- Project codebase: `/src/scenes/UIScene.ts` - Reactive header updates from manager events
- Project codebase: `/src/scenes/CardPickOverlay.ts` - Multi-stage animation with tween chains
- Project codebase: `/src/game/VFXManager.ts` - Particle effects with self-cleanup
- Project codebase: `/src/game/CollectionsManager.ts` - Collection state management
- Requirement spec: `.planning/REQUIREMENTS.md` - COL-11, COL-12, COL-13, NAV-03 requirements

### Secondary (MEDIUM confidence)
- [Phaser 3 EventEmitter API](https://newdocs.phaser.io/docs/3.90.0/Phaser.Events.EventEmitter) - Event emission patterns
- [Phaser 3 Tweens](https://newdocs.phaser.io/docs/3.90.0/Phaser.Tweens.TweenManager) - Animation sequencing
- Design spec: `docs/COLLECTIONS.md` - Exchange UX flow and animation stages

### Tertiary (LOW confidence)
- [Notification badge UX patterns](https://www.nngroup.com/articles/notification-badges/) - Best practices for notification dots (general UX, not game-specific)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Phaser 3.90, EventEmitter, tweens all proven in existing project code
- Architecture: HIGH - EventEmitter pattern, animation sequences, overlay pattern all established in Phases 13-15
- Pitfalls: HIGH - Input disabling, event cleanup, overlay element tracking all verified in CardPickOverlay and UIScene

**Research date:** 2026-02-11
**Valid until:** 2026-03-13 (30 days for stable APIs; Phaser 3.90 and Firebase 11 are mature)
