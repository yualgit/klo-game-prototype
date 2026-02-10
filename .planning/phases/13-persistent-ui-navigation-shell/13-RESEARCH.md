# Phase 13: Persistent UI Navigation Shell - Research

**Researched:** 2026-02-10
**Domain:** Phaser 3 multi-scene UI architecture, mobile navigation patterns, reactive state updates
**Confidence:** MEDIUM

## Summary

Phase 13 implements a persistent UI navigation shell with bottom navigation tabs and a global header that remain visible across multiple scenes. The recommended architecture uses a dedicated UI Scene that runs in parallel with game scenes, communicating via events. This approach is the standard pattern in Phaser 3 for persistent HUD/navigation elements.

The project already has reactive manager patterns (EconomyManager, SettingsManager) with subscription systems that can be leveraged for header updates. The responsive layout foundation from Phase 12 provides utilities (cssToGame, DPR handling) for consistent sizing. Bottom navigation should account for iOS safe area insets using env(safe-area-inset-bottom) for PWA compatibility.

Key challenges: managing scene transitions, preventing input conflicts between UI and game scenes, and ensuring the navigation shell properly hides during gameplay while keeping the header visible.

**Primary recommendation:** Create a separate UIScene that launches in parallel with LevelSelect/Collections/Shop scenes, use Phaser's scene event system for communication, and subscribe to EconomyManager state changes for reactive header updates.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser 3 | 3.85+ | Multi-scene management | Built-in scene orchestration with launch/sleep/wake APIs |
| TypeScript | 5.x | Type-safe scene communication | Strong typing prevents inter-scene contract errors |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| EventEmitter | Built-in | Cross-scene communication | When scenes need to notify UI of state changes |
| Phaser Registry | Built-in | Shared manager access | For accessing EconomyManager/SettingsManager across scenes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Parallel UI Scene | Recreate UI in each scene | Parallel scene reuses code, avoids duplication, but adds scene management complexity |
| Event communication | Direct scene references | Events are loosely coupled (better), direct refs tightly couple scenes (worse maintainability) |

**Installation:**
```bash
# No new dependencies required - using Phaser 3 built-in features
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── scenes/
│   ├── UIScene.ts           # Persistent UI shell (header + bottom nav)
│   ├── LevelSelect.ts        # Strips out HUD, launches UIScene
│   ├── Collections.ts        # New scene for collection view
│   ├── Shop.ts               # Stub/future scene
│   ├── Game.ts               # Keeps own HUD, stops UIScene during gameplay
│   └── Menu.ts               # No UIScene (standalone)
├── game/
│   ├── EconomyManager.ts     # Already has reactive state
│   └── SettingsManager.ts    # Already has subscription pattern
└── utils/
    └── responsive.ts         # Phase 12 utilities (cssToGame, getDpr)
```

### Pattern 1: Parallel UI Scene Architecture

**What:** Run a dedicated UIScene in parallel with game/menu scenes, positioned above them in the scene stack.

**When to use:** When you need persistent UI elements (header, navigation) visible across multiple scenes without recreating them.

**Example:**
```typescript
// In LevelSelect.create()
this.scene.launch('UIScene', {
  currentTab: 'levels',
  showBottomNav: true
});

// In Game.create()
this.scene.launch('UIScene', {
  showBottomNav: false,  // Hide nav during gameplay
  showHeader: true        // Keep header visible
});

// UIScene listens for tab changes and emits events
this.events.emit('tab-changed', 'collections');
```

**Source:** [Phaser Documentation - Scenes](https://docs.phaser.io/phaser/concepts/scenes) and [Persistent UI objects/components on scenes](https://phaser.discourse.group/t/persistent-ui-objects-components-on-scenes/2359)

### Pattern 2: Reactive UI Updates via Subscriptions

**What:** UI elements subscribe to manager state changes rather than polling or manual updates.

**When to use:** When managers (EconomyManager, SettingsManager) already implement subscription patterns and UI needs real-time updates.

**Example:**
```typescript
// In UIScene.create()
const economy = this.registry.get('economy') as EconomyManager;

// Subscribe to state changes
this.updateLivesDisplay = () => {
  const lives = economy.getLives();
  this.livesText.setText(`${lives}/5`);
};

// EconomyManager needs to expose subscribe/emit pattern
economy.on('lives-changed', this.updateLivesDisplay);
economy.on('bonuses-changed', this.updateBonusesDisplay);
```

**Note:** Current EconomyManager doesn't expose events - will need enhancement to emit state change events.

### Pattern 3: Scene Communication via EventEmitter

**What:** Create a shared EventEmitter instance for cross-scene communication.

**When to use:** When UI scene needs to notify game scenes of user actions (tab changes, settings open, etc.) without tight coupling.

**Example:**
```typescript
// utils/EventsCenter.ts
import Phaser from 'phaser';
const eventsCenter = new Phaser.Events.EventEmitter();
export default eventsCenter;

// In UIScene
import eventsCenter from '../utils/EventsCenter';
eventsCenter.emit('navigate-to', 'collections');

// In LevelSelect
import eventsCenter from '../utils/EventsCenter';
eventsCenter.on('navigate-to', (scene: string) => {
  this.scene.start(scene);
});
```

**Source:** [How to Communicate Between Scenes in Phaser 3](https://blog.ourcade.co/posts/2020/phaser3-how-to-communicate-between-scenes/)

### Pattern 4: Fixed Position with setScrollFactor(0)

**What:** Make UI elements fixed to camera by setting scrollFactor to 0.

**When to use:** For all HUD/navigation elements that should remain stationary regardless of camera movement.

**Example:**
```typescript
// Already used in LevelSelect.ts for HUD
this.headerBg.setScrollFactor(0);
this.headerBg.setDepth(100);
this.bottomNav.setScrollFactor(0);
this.bottomNav.setDepth(100);
```

**Source:** Project patterns from Phase 12 implementation

### Anti-Patterns to Avoid

- **Recreating UI in every scene:** Leads to code duplication, inconsistent styling, and harder maintenance
- **Accessing scene.scene.get() for direct references:** Creates tight coupling, breaks when scenes are renamed or restructured
- **Polling manager state in update():** Inefficient compared to reactive subscriptions, causes unnecessary recalculations
- **Forgetting to stop UIScene during transitions:** Can cause input conflicts and visual glitches if UI stays active during scene switches

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bottom tab navigation | Custom tab state machine | Container with interactive buttons + event system | Tab state is simple (active/inactive), no need for FSM complexity |
| Safe area detection | JavaScript viewport measurements | CSS env(safe-area-inset-bottom) | CSS handles iOS safe areas automatically, more reliable than JS detection |
| Input event routing | Manual z-order hit testing | Phaser's scene depth + setDepth() | Phaser already handles input priority based on depth and scene order |
| Responsive sizing | Custom DPR calculations | Phase 12's cssToGame() utility | Already implemented, tested, and handles DPR edge cases |

**Key insight:** Phaser 3's scene system is designed for this use case - don't fight it with custom solutions. The built-in launch/sleep/wake APIs and event system provide all necessary tools.

## Common Pitfalls

### Pitfall 1: Input Events Reaching Wrong Scene

**What goes wrong:** Clicking bottom nav button also triggers level selection behind it.

**Why it happens:** Multiple scenes running in parallel with overlapping interactive areas, Phaser processes input top-down through scene stack.

**How to avoid:**
1. Set UIScene depth higher than game scenes
2. Make nav background graphics interactive with `setInteractive()` to block click-through
3. Use `setAlpha(0.001)` instead of `setVisible(false)` for invisible hit areas (Phaser gotcha from MEMORY.md)

**Warning signs:** Clicking UI causes unintended actions in underlying scene, buttons trigger multiple callbacks.

### Pitfall 2: Scene Launch/Stop Timing Issues

**What goes wrong:** UIScene launched before target scene is ready, or UI persists when starting new scene.

**Why it happens:** Scene lifecycle events (create, wake, sleep) fire asynchronously, scene.start() immediately stops calling scene.

**How to avoid:**
```typescript
// BAD: UIScene might launch before LevelSelect is ready
this.scene.start('LevelSelect');
this.scene.launch('UIScene');

// GOOD: Launch UIScene from within LevelSelect.create()
// In LevelSelect.create()
this.scene.launch('UIScene', { currentTab: 'levels' });

// GOOD: Stop UIScene when switching scenes
// In UIScene
eventsCenter.on('navigate-to', (scene: string) => {
  this.scene.stop('UIScene');  // Stop self first
  this.callingScene.scene.start(scene);
});
```

**Warning signs:** UI appears with missing state, UI duplicates on screen, UI shows wrong tab on scene load.

### Pitfall 3: iOS Safe Area Not Applied

**What goes wrong:** Bottom navigation gets covered by iOS home indicator bar on iPhone X+.

**Why it happens:** PWAs need explicit opt-in for safe area support via viewport meta and CSS env() function.

**How to avoid:**
```html
<!-- In index.html -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

```css
/* In global CSS or apply via Phaser positioning */
.bottom-nav {
  position: fixed;
  bottom: env(safe-area-inset-bottom, 0);
  /* Phaser equivalent: */
  /* bottomNavY = gameHeight - navHeight - env(safe-area-inset-bottom) */
}
```

**Note:** Phaser doesn't directly access env() - must calculate safe area offset in JavaScript via `getComputedStyle` or add padding to parent HTML container.

**Warning signs:** Bottom nav overlapped by iPhone home indicator, nav cuts off on notched devices, buttons unreachable.

**Source:** [Using Bottom Tab Bars on Safari iOS 15](https://samuelkraft.com/blog/safari-15-bottom-tab-bars-web) and [Make Your PWAs Look Handsome on iOS](https://itnext.io/make-your-pwas-look-handsome-on-ios-fd8fdfcd5777)

### Pitfall 4: Manager State Not Emitting Events

**What goes wrong:** Header shows stale lives/bonuses counts after economy changes.

**Why it happens:** Current EconomyManager updates state but doesn't emit events that UI can subscribe to.

**How to avoid:** Enhance EconomyManager to extend EventEmitter or use internal event system:

```typescript
// Option A: Extend EventEmitter
export class EconomyManager extends Phaser.Events.EventEmitter {
  async loseLife(): Promise<boolean> {
    if (this.state.lives <= 0) return false;
    this.state.lives--;
    await this.save();
    this.emit('lives-changed', this.state.lives);  // NEW
    return true;
  }
}

// Option B: Use scene registry event system
// In EconomyManager
private scene: Phaser.Scene;  // Store scene reference
async loseLife(): Promise<boolean> {
  // ... existing logic
  this.scene.events.emit('economy:lives-changed', this.state.lives);
}
```

**Warning signs:** Header doesn't update after level start, bonuses don't refresh after refill, countdown timer stuck.

## Code Examples

Verified patterns from project context and Phaser documentation:

### Creating Parallel UI Scene

```typescript
// src/scenes/UIScene.ts
export class UIScene extends Phaser.Scene {
  private bottomNav: Phaser.GameObjects.Container;
  private headerContainer: Phaser.GameObjects.Container;
  private currentTab: string;

  constructor() {
    super({ key: 'UIScene' });
  }

  init(data: { currentTab?: string; showBottomNav?: boolean; showHeader?: boolean }) {
    this.currentTab = data.currentTab || 'levels';
    this.showBottomNav = data.showBottomNav !== false;
    this.showHeader = data.showHeader !== false;
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Create header (always visible)
    if (this.showHeader) {
      this.createHeader(width);
    }

    // Create bottom navigation (conditional)
    if (this.showBottomNav) {
      this.createBottomNav(width, height);
    }

    // Fixed to camera
    this.cameras.main.setScroll(0, 0);

    // Register resize handler
    this.scale.on('resize', this.handleResize, this);
  }

  private createHeader(width: number): void {
    // Implementation using cssToGame() from Phase 12
    const headerHeight = cssToGame(50);
    const bg = this.add.graphics();
    bg.fillStyle(0xFFFFFF, 0.95);
    bg.fillRect(0, 0, width, headerHeight);
    bg.setScrollFactor(0);
    bg.setDepth(100);

    // Lives, bonuses, settings (use patterns from LevelSelect)
    // Subscribe to EconomyManager for reactive updates
  }

  private createBottomNav(width: number, height: number): void {
    const navHeight = cssToGame(60);
    const navY = height - navHeight;

    const bg = this.add.graphics();
    bg.fillStyle(0xFFFFFF, 0.95);
    bg.fillRect(0, navY, width, navHeight);
    bg.setInteractive(new Phaser.Geom.Rectangle(0, navY, width, navHeight),
                      Phaser.Geom.Rectangle.Contains);
    bg.setScrollFactor(0);
    bg.setDepth(100);

    // Create tab buttons
    this.createTabButton(width * 0.2, navY + navHeight/2, 'Рівні', 'levels');
    this.createTabButton(width * 0.5, navY + navHeight/2, 'Колекції', 'collections');
    this.createTabButton(width * 0.8, navY + navHeight/2, 'Магазин', 'shop');
  }

  private createTabButton(x: number, y: number, label: string, tab: string): void {
    const isActive = tab === this.currentTab;
    const color = isActive ? '#FFB800' : '#999999';

    const text = this.add.text(x, y, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(14)}px`,
      color: color,
      fontStyle: isActive ? 'bold' : 'normal',
    });
    text.setOrigin(0.5);
    text.setScrollFactor(0);
    text.setDepth(101);
    text.setInteractive({ useHandCursor: true });

    text.on('pointerup', () => {
      this.onTabClicked(tab);
    });
  }

  private onTabClicked(tab: string): void {
    if (tab === this.currentTab) return;

    // Emit navigation event
    import eventsCenter from '../utils/EventsCenter';
    eventsCenter.emit('navigate-to', tab);
  }
}
```

**Source:** Pattern adapted from [Phaser UI Scene Example](https://phaser.io/examples/v3/view/scenes/ui-scene) and project patterns from Phase 12

### Launching UI Scene from Other Scenes

```typescript
// src/scenes/LevelSelect.ts (modifications)
create(): void {
  // ... existing setup code

  // Launch UI Scene in parallel
  this.scene.launch('UIScene', {
    currentTab: 'levels',
    showBottomNav: true,
    showHeader: true
  });

  // Listen for navigation events
  import eventsCenter from '../utils/EventsCenter';
  eventsCenter.on('navigate-to', this.handleNavigation, this);

  // Cleanup on shutdown
  this.events.once('shutdown', () => {
    eventsCenter.off('navigate-to', this.handleNavigation, this);
  });
}

private handleNavigation(target: string): void {
  // Stop UI scene before transition
  this.scene.stop('UIScene');

  // Navigate to target
  switch (target) {
    case 'levels':
      // Already here, do nothing or refresh
      break;
    case 'collections':
      this.scene.start('Collections');
      break;
    case 'shop':
      this.scene.start('Shop');
      break;
  }
}
```

### Reactive Header Updates

```typescript
// In UIScene.create()
private livesText: Phaser.GameObjects.Text;
private bonusText: Phaser.GameObjects.Text;
private updateTimer: Phaser.Time.TimerEvent;

private setupReactiveUpdates(): void {
  const economy = this.registry.get('economy') as EconomyManager;

  // OPTION 1: If EconomyManager extends EventEmitter
  economy.on('lives-changed', this.updateLivesDisplay, this);
  economy.on('bonuses-changed', this.updateBonusesDisplay, this);

  // OPTION 2: Polling fallback (use until manager events implemented)
  this.updateTimer = this.time.addEvent({
    delay: 1000,  // Update every second
    callback: () => {
      this.updateLivesDisplay();
      this.updateBonusesDisplay();
    },
    callbackScope: this,
    loop: true
  });

  // Initial update
  this.updateLivesDisplay();
  this.updateBonusesDisplay();

  // Cleanup
  this.events.once('shutdown', () => {
    if (this.updateTimer) {
      this.updateTimer.remove();
    }
  });
}

private updateLivesDisplay(): void {
  const economy = this.registry.get('economy') as EconomyManager;
  const lives = economy.getLives();
  this.livesText.setText(`${lives}/5`);
}

private updateBonusesDisplay(): void {
  const economy = this.registry.get('economy') as EconomyManager;
  const bonuses = economy.getBonuses();
  this.bonusText.setText(`${bonuses}`);
}
```

### iOS Safe Area Handling

```typescript
// utils/safeArea.ts
export function getSafeAreaInsets(): { top: number; bottom: number; left: number; right: number } {
  // Read CSS env() values via computed style on body
  const style = getComputedStyle(document.documentElement);

  return {
    top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
    bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
    left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
    right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
  };
}

// In global CSS (public/style.css)
:root {
  --safe-area-inset-top: env(safe-area-inset-top, 0px);
  --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-inset-left: env(safe-area-inset-left, 0px);
  --safe-area-inset-right: env(safe-area-inset-right, 0px);
}

// In UIScene.createBottomNav()
import { getSafeAreaInsets } from '../utils/safeArea';
const insets = getSafeAreaInsets();
const navHeight = cssToGame(60) + insets.bottom;  // Add safe area padding
const navY = height - navHeight;
```

**Source:** [Adjusting padding bottom for navigation in iOS and Android](https://blog.oxyconit.com/adjusting-padding-bottom-for-navigation-in-ios-and-android/)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single scene with all UI | Parallel UI scene | Phaser 3.0+ (2018) | Cleaner separation, reusable UI, easier maintenance |
| Manual scene references | EventEmitter communication | Best practice since 3.0 | Loose coupling, easier to refactor scenes |
| Phaser.Data for state | Manager classes with subscriptions | Modern pattern (2020+) | Type-safe, reactive updates, better encapsulation |
| Scale.FIT with fixed resolution | Scale.RESIZE + responsive utils | Mobile-first era (2022+) | Better mobile UX, readable text, proper safe areas |

**Deprecated/outdated:**
- Using `game.scene.getScene()` for cross-scene access - Use events instead
- Recreating managers in each scene - Use registry for shared instances
- Hardcoded pixel values - Use responsive utilities (cssToGame)

## Open Questions

1. **Collections Scene Implementation**
   - What we know: Phase 14 will create Collections scene
   - What's unclear: Whether Collections needs special UIScene config (different header content?)
   - Recommendation: Keep UIScene generic, pass tab context via init data, Collections scene can customize if needed

2. **Shop Scene Stub**
   - What we know: Shop tab in bottom nav, but no implementation planned yet
   - What's unclear: Should clicking Shop show "coming soon" modal, or navigate to stub scene?
   - Recommendation: Create stub Shop scene with "Coming Soon" message to maintain navigation consistency

3. **Game Scene Header Content**
   - What we know: Header stays visible during gameplay, bottom nav hidden
   - What's unclear: Should header show lives/bonuses during gameplay, or switch to level-specific info?
   - Recommendation: Keep lives/bonuses visible (player context), level info stays in game HUD below header

4. **Transition Animations**
   - What we know: Need smooth tab switches
   - What's unclear: Should scenes fade/slide when switching tabs?
   - Recommendation: Start with instant scene.start(), add fade transitions in polish phase if time permits

5. **EconomyManager Event Enhancement**
   - What we know: Current implementation doesn't emit events for state changes
   - What's unclear: Best approach - extend EventEmitter or use scene event bus?
   - Recommendation: Extend EventEmitter (cleaner API), fallback to polling if enhancement delayed

## Sources

### Primary (HIGH confidence)
- [Phaser Scenes Documentation](https://docs.phaser.io/phaser/concepts/scenes) - Multi-scene architecture, launch/sleep/wake APIs
- [Phaser UI Scene Example](https://phaser.io/examples/v3/view/scenes/ui-scene) - Official parallel UI scene pattern
- Project codebase - Existing manager patterns (EconomyManager, SettingsManager), Phase 12 responsive utilities

### Secondary (MEDIUM confidence)
- [Persistent UI objects/components on scenes - Phaser Forums](https://phaser.discourse.group/t/persistent-ui-objects-components-on-scenes/2359) - Community discussion on parallel UI scenes
- [How to Communicate Between Scenes in Phaser 3 - Ourcade](https://blog.ourcade.co/posts/2020/phaser3-how-to-communicate-between-scenes/) - Event-based scene communication pattern
- [Using Bottom Tab Bars on Safari iOS 15 - Samuel Kraft](https://samuelkraft.com/blog/safari-15-bottom-tab-bars-web) - iOS safe area handling for bottom navigation
- [Make Your PWAs Look Handsome on iOS - ITNEXT](https://itnext.io/make-your-pwas-look-handsome-on-ios-fd8fdfcd5777) - PWA safe area best practices
- [Mobile Navigation Patterns That Work in 2026 - Phone Simulator](https://phone-simulator.com/blog/mobile-navigation-patterns-in-2026) - Bottom tab bar UX patterns

### Tertiary (LOW confidence - needs validation)
- [Rex UI Plugin - Tabs](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/ui-tabs/) - Third-party tab component (not needed, can build with native Phaser)
- Various GitHub issues on safe area handling - Implementation details may vary

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Phaser 3 built-in features, no external dependencies, proven patterns
- Architecture: MEDIUM - Parallel scene pattern well-documented, but project-specific integration not yet tested
- Pitfalls: MEDIUM - Based on documented issues and project MEMORY.md gotchas, real pitfalls will emerge during implementation

**Research date:** 2026-02-10
**Valid until:** 60 days (stable domain - Phaser 3 scene system unchanged since 3.0, mobile patterns mature)

**Key risks:**
1. EconomyManager enhancement might introduce breaking changes if done incorrectly
2. iOS safe area detection may need testing across multiple devices
3. Scene transition timing could cause edge cases during navigation

**Next steps for planner:**
1. Review codebase scenes (LevelSelect, Game, Menu) for HUD extraction patterns
2. Design UIScene API (init data format, event contracts)
3. Plan EconomyManager event enhancement (breaking change scope)
4. Verify responsive utility compatibility with UIScene fixed positioning
