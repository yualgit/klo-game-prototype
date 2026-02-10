# Phase 7: Settings - Research

**Researched:** 2026-02-10
**Domain:** User settings persistence (audio, visual effects) with localStorage + reactive manager pattern
**Confidence:** HIGH

## Summary

Phase 7 implements a settings system allowing users to customize audio and visual preferences that persist across sessions. The core technical challenge is creating a reactive settings manager that persists to localStorage, integrates with existing AudioManager and VFXManager, and provides a clean UI overlay accessible from the level select screen.

The implementation follows the established manager pattern in the codebase: a singleton SettingsManager stored in Phaser registry (parallel to ProgressManager and EconomyManager), with localStorage for persistence. Settings changes propagate reactively to managers via a subscription pattern, allowing AudioManager to respond to volume changes and VFXManager to skip animations when effects are disabled.

Key architectural decisions: Settings use localStorage (not Firestore) because they're device-specific preferences, not user profile data. The settings overlay is a modal UI component within LevelSelect scene, not a separate Phaser scene, keeping the implementation simple and avoiding scene lifecycle complexity.

**Primary recommendation:** Use localStorage with reactive subscription pattern. Extend existing AudioManager and VFXManager with settings hooks. Create a simple overlay modal in LevelSelect scene rather than a dedicated settings scene.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| localStorage API | Browser native | Persist settings across sessions | Standard web storage, 5-10MB quota, synchronous API, works offline |
| Phaser 3 | 3.90.0 | UI overlay, tweens control, sound.mute API | Project's game engine, already has sound management |
| TypeScript | 5.7.0 | Type-safe settings interface, subscription pattern | Project language |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | — | Native JavaScript sufficient | localStorage is built-in, no serialization library needed for simple JSON |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| localStorage | Firestore persistence | Firestore adds latency, requires auth, overkill for device preferences. localStorage is instant and offline-first |
| Separate settings scene | Modal overlay in current scene | Separate scene adds complexity (scene lifecycle, transitions). Overlay is simpler for a single settings screen |
| rex-ui slider plugin | Custom slider with Phaser graphics | rex-ui adds 200KB+ dependency. Custom slider using rectangles is 50 lines and sufficient for 2 settings |
| Global event emitter | Direct manager references | Event emitter decouples but adds indirection. Direct references simpler when managers are singletons in registry |

**Installation:**
```bash
# No new dependencies needed
# localStorage and Phaser already available
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── game/
│   ├── SettingsManager.ts      # NEW: Singleton managing settings + localStorage
│   ├── AudioManager.ts         # MODIFY: Subscribe to settings changes
│   ├── VFXManager.ts           # MODIFY: Check settings before playing effects
├── scenes/
│   ├── LevelSelect.ts          # MODIFY: Add gear icon + settings overlay
```

### Pattern 1: Reactive Settings Manager with localStorage
**What:** Centralized settings manager with subscription callbacks, persists to localStorage on every change
**When to use:** Any game settings or preferences that need to persist and notify multiple systems
**Example:**
```typescript
// src/game/SettingsManager.ts
export interface SettingsData {
  sfxEnabled: boolean;
  sfxVolume: number;        // 0.0 to 1.0
  animationsEnabled: boolean;
  version: number;          // For future schema migrations
}

export class SettingsManager {
  private static readonly STORAGE_KEY = 'klo_match3_settings';
  private data: SettingsData;
  private listeners: Map<keyof SettingsData, Set<(value: any) => void>> = new Map();

  constructor(initialData?: SettingsData) {
    this.data = initialData || this.getDefaults();
  }

  private getDefaults(): SettingsData {
    return {
      sfxEnabled: true,
      sfxVolume: 0.5,
      animationsEnabled: true,
      version: 1,
    };
  }

  get<K extends keyof SettingsData>(key: K): SettingsData[K] {
    return this.data[key];
  }

  set<K extends keyof SettingsData>(key: K, value: SettingsData[K]): void {
    this.data[key] = value;
    this.save();
    this.notify(key, value);
  }

  subscribe<K extends keyof SettingsData>(
    key: K,
    callback: (value: SettingsData[K]) => void
  ): void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);
  }

  private notify<K extends keyof SettingsData>(key: K, value: SettingsData[K]): void {
    this.listeners.get(key)?.forEach(cb => cb(value));
  }

  private save(): void {
    try {
      localStorage.setItem(
        SettingsManager.STORAGE_KEY,
        JSON.stringify(this.data)
      );
    } catch (e) {
      console.warn('[SettingsManager] localStorage unavailable (private browsing?)', e);
    }
  }

  static load(): SettingsData {
    try {
      const stored = localStorage.getItem(SettingsManager.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Version migration logic here if needed
        if (parsed.version === 1) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[SettingsManager] Failed to load settings, using defaults', e);
    }
    return new SettingsManager().data;
  }
}
```

### Pattern 2: Manager Integration via Subscription
**What:** Existing managers subscribe to settings changes and react immediately
**When to use:** When settings affect behavior of existing systems (audio, VFX, UI)
**Example:**
```typescript
// src/game/AudioManager.ts - MODIFY constructor
import { SettingsManager } from './SettingsManager';

export class AudioManager {
  private scene: Phaser.Scene;
  private muted: boolean = false;
  private volume: number = 0.5;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Integrate with settings manager
    const settings = scene.registry.get('settings') as SettingsManager;
    if (settings) {
      // Set initial state from settings
      this.muted = !settings.get('sfxEnabled');
      this.volume = settings.get('sfxVolume');

      // Subscribe to live changes
      settings.subscribe('sfxEnabled', (enabled: boolean) => {
        this.muted = !enabled;
        console.log('[AudioManager] SFX enabled:', enabled);
      });

      settings.subscribe('sfxVolume', (vol: number) => {
        this.volume = vol;
        console.log('[AudioManager] Volume changed to:', vol);
      });
    }
  }

  play(key: string, volumeOverride?: number): void {
    if (this.muted) return;
    if (!this.scene || !this.scene.sys || !this.scene.sys.isActive()) return;
    try {
      this.scene.sound.play(key, { volume: volumeOverride ?? this.volume });
    } catch (e) {
      console.warn('[AudioManager] Failed to play sound:', key, e);
    }
  }

  // ... rest of AudioManager methods
}
```

### Pattern 3: VFXManager Conditional Effect Playback
**What:** Check settings flag before playing expensive animation effects
**When to use:** When animations are non-critical and can be disabled for accessibility or performance
**Example:**
```typescript
// src/game/VFXManager.ts - MODIFY methods
import { SettingsManager } from './SettingsManager';

export class VFXManager {
  private scene: Phaser.Scene;
  private animationsEnabled: boolean = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createParticleTextures();

    // Integrate with settings
    const settings = scene.registry.get('settings') as SettingsManager;
    if (settings) {
      this.animationsEnabled = settings.get('animationsEnabled');
      settings.subscribe('animationsEnabled', (enabled: boolean) => {
        this.animationsEnabled = enabled;
        console.log('[VFXManager] Animations enabled:', enabled);
      });
    }
  }

  /** Particle burst when tiles are matched - skip if animations disabled */
  matchPop(x: number, y: number, color: number): void {
    if (!this.animationsEnabled) return;  // Early exit
    if (!this.active) return;

    const emitter = this.scene.add.particles(x, y, 'particle_white', {
      speed: { min: 40, max: 120 },
      scale: { start: 0.5, end: 0 },
      lifespan: { min: 200, max: 400 },
      tint: color,
      gravityY: 80,
      maxParticles: 10,
      emitting: false,
    });
    emitter.explode(10);
    this.scene.time.delayedCall(500, () => emitter.destroy());
  }

  /** Line sweep effect - skip if animations disabled */
  boosterLineSweep(startX: number, startY: number, direction: 'horizontal' | 'vertical', length: number): void {
    if (!this.animationsEnabled) return;  // Early exit
    // ... rest of implementation
  }

  // Similar early exits in all VFX methods
}
```

### Pattern 4: Settings Overlay Modal in Scene
**What:** Create settings UI as an overlay within existing scene, not a separate Phaser scene
**When to use:** Simple settings menu with few options, accessed from one screen
**Example:**
```typescript
// src/scenes/LevelSelect.ts - ADD method
private showSettingsOverlay(): void {
  const width = this.cameras.main.width;
  const height = this.cameras.main.height;
  const settings = this.registry.get('settings') as SettingsManager;

  // Store overlay elements for cleanup
  const overlayElements: Phaser.GameObjects.GameObject[] = [];

  // Dark backdrop
  const backdrop = this.add.graphics();
  backdrop.fillStyle(0x000000, 0.7);
  backdrop.fillRect(0, 0, width, height);
  backdrop.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
  overlayElements.push(backdrop);

  // White panel
  const panelW = 350;
  const panelH = 400;
  const panelX = (width - panelW) / 2;
  const panelY = (height - panelH) / 2;

  const panel = this.add.graphics();
  panel.fillStyle(0xF9F9F9, 1);
  panel.fillRoundedRect(panelX, panelY, panelW, panelH, 16);
  overlayElements.push(panel);

  // Title
  const title = this.add.text(width / 2, panelY + 50, 'Налаштування', {
    fontFamily: 'Arial, sans-serif',
    fontSize: '32px',
    color: '#1A1A1A',
    fontStyle: 'bold',
  });
  title.setOrigin(0.5);
  overlayElements.push(title);

  // SFX Toggle
  const sfxEnabled = settings.get('sfxEnabled');
  const sfxToggle = this.createToggle(
    width / 2,
    panelY + 120,
    'Звукові ефекти',
    sfxEnabled,
    (enabled: boolean) => {
      settings.set('sfxEnabled', enabled);
    }
  );
  overlayElements.push(...sfxToggle);

  // SFX Volume Slider (only if SFX enabled)
  if (sfxEnabled) {
    const volumeSlider = this.createSlider(
      width / 2,
      panelY + 180,
      'Гучність',
      settings.get('sfxVolume'),
      (value: number) => {
        settings.set('sfxVolume', value);
      }
    );
    overlayElements.push(...volumeSlider);
  }

  // Animation Toggle
  const animationsEnabled = settings.get('animationsEnabled');
  const animToggle = this.createToggle(
    width / 2,
    panelY + 240,
    'Анімації бустерів',
    animationsEnabled,
    (enabled: boolean) => {
      settings.set('animationsEnabled', enabled);
    }
  );
  overlayElements.push(...animToggle);

  // Close button
  const closeBtn = this.createOverlayButton(
    width / 2,
    panelY + 330,
    'Закрити',
    () => {
      overlayElements.forEach(el => el.destroy());
    }
  );
  overlayElements.push(closeBtn);
}

private createToggle(
  x: number,
  y: number,
  label: string,
  initialState: boolean,
  onChange: (enabled: boolean) => void
): Phaser.GameObjects.GameObject[] {
  const elements: Phaser.GameObjects.GameObject[] = [];

  // Label
  const labelText = this.add.text(x - 120, y, label, {
    fontFamily: 'Arial, sans-serif',
    fontSize: '20px',
    color: '#1A1A1A',
  });
  labelText.setOrigin(0, 0.5);
  elements.push(labelText);

  // Toggle background
  const toggleBg = this.add.rectangle(x + 80, y, 60, 30, initialState ? 0x4CAF50 : 0xCCCCCC);
  toggleBg.setStrokeStyle(2, 0x999999);
  elements.push(toggleBg);

  // Toggle thumb
  const thumbX = initialState ? x + 95 : x + 65;
  const thumb = this.add.circle(thumbX, y, 12, 0xFFFFFF);
  elements.push(thumb);

  // Interactive behavior
  toggleBg.setInteractive({ useHandCursor: true });
  toggleBg.on('pointerup', () => {
    const newState = !initialState;
    onChange(newState);

    // Animate toggle
    toggleBg.setFillStyle(newState ? 0x4CAF50 : 0xCCCCCC);
    this.tweens.add({
      targets: thumb,
      x: newState ? x + 95 : x + 65,
      duration: 200,
      ease: 'Cubic.Out',
    });
  });

  return elements;
}

private createSlider(
  x: number,
  y: number,
  label: string,
  initialValue: number,
  onChange: (value: number) => void
): Phaser.GameObjects.GameObject[] {
  const elements: Phaser.GameObjects.GameObject[] = [];

  // Label
  const labelText = this.add.text(x - 120, y, label, {
    fontFamily: 'Arial, sans-serif',
    fontSize: '20px',
    color: '#1A1A1A',
  });
  labelText.setOrigin(0, 0.5);
  elements.push(labelText);

  // Slider track
  const trackW = 140;
  const track = this.add.rectangle(x + 80, y, trackW, 6, 0xDDDDDD);
  elements.push(track);

  // Slider fill
  const fillW = trackW * initialValue;
  const fill = this.add.rectangle(x + 80 - (trackW - fillW) / 2, y, fillW, 6, 0xFFB800);
  elements.push(fill);

  // Slider thumb
  const thumbX = x + 80 - trackW / 2 + trackW * initialValue;
  const thumb = this.add.circle(thumbX, y, 10, 0xFFFFFF);
  thumb.setStrokeStyle(2, 0xFFB800);
  elements.push(thumb);

  // Interactive behavior (simplified - drag thumb to change volume)
  thumb.setInteractive({ draggable: true, useHandCursor: true });
  this.input.setDraggable(thumb);

  thumb.on('drag', (pointer: Phaser.Input.Pointer, dragX: number) => {
    const minX = x + 80 - trackW / 2;
    const maxX = x + 80 + trackW / 2;
    const clampedX = Phaser.Math.Clamp(dragX, minX, maxX);
    thumb.x = clampedX;

    const value = (clampedX - minX) / trackW;
    const newFillW = trackW * value;
    fill.setSize(newFillW, 6);
    fill.x = x + 80 - (trackW - newFillW) / 2;

    onChange(value);
  });

  return elements;
}
```

### Anti-Patterns to Avoid
- **Storing settings in Firestore:** Settings are device-specific preferences, not user profile data. localStorage is faster, works offline, and doesn't require authentication.
- **Creating separate settings scene:** Adds unnecessary scene lifecycle management. Overlay modal is simpler for a single settings screen.
- **Polling settings on every frame:** Use subscription pattern so managers only react when settings change, not on every update loop.
- **Not handling localStorage failures:** Private browsing mode blocks localStorage. Always wrap in try-catch and provide defaults.
- **Complex UI library for 3 settings:** rex-ui slider is overkill. Simple toggle and slider using Phaser graphics is 100 lines and sufficient.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Settings persistence | Custom file I/O, cookies, IndexedDB | localStorage API | Browser native, 5-10MB quota, synchronous API, works in all modern browsers |
| Reactive updates | Manual manager polling, global event bus | Subscription pattern with callbacks | Simple, type-safe, no external dependencies, follows existing manager pattern |
| Toggle UI components | HTML overlay, DOM elements | Phaser graphics primitives | Consistent with game UI, no CSS/layout issues, works on all Phaser platforms |
| Volume slider | Third-party UI library | Custom draggable circle on rectangle | 50 lines of code, no dependencies, full control over styling |

**Key insight:** Settings systems are deceptively simple in scope but easy to over-engineer. Three boolean/numeric settings don't justify a UI framework. localStorage + subscription pattern + simple Phaser graphics covers all requirements with zero dependencies.

## Common Pitfalls

### Pitfall 1: Not Handling localStorage Quota/Availability
**What goes wrong:** localStorage.setItem() throws in private browsing mode or when quota exceeded. Game crashes on settings change.
**Why it happens:** Developers assume localStorage always works. Safari private mode and Firefox private mode block it entirely.
**How to avoid:** Wrap all localStorage calls in try-catch. Log warning and continue with in-memory settings if save fails.
**Warning signs:** Settings save fine in normal browser but crash in private/incognito mode.

### Pitfall 2: Forgetting to Clean Up Overlay Elements
**What goes wrong:** Close settings overlay, open again, see duplicate UI elements stacked on top of each other. Memory leak over time.
**Why it happens:** Phaser GameObjects persist until explicitly destroyed. Forgot to call .destroy() on overlay elements.
**How to avoid:** Store all overlay elements in an array, call .forEach(el => el.destroy()) when closing overlay.
**Warning signs:** Settings overlay looks glitchy after opening multiple times. Phaser scene inspector shows duplicate objects.

### Pitfall 3: Animations Disabled but Tweens Still Running
**What goes wrong:** User disables animations, but some effects still play (fades, scales, screen shake). Performance doesn't improve as expected.
**Why it happens:** VFXManager checks animationsEnabled but forgot to check in scene tween calls (like button hover animations).
**How to avoid:** Create a helper method shouldPlayAnimation() that checks settings. Use it before all tweens, not just VFXManager effects.
**Warning signs:** Disabling animations only affects particles but buttons still animate. Users report "animations still on."

### Pitfall 4: Settings Don't Persist After Refresh
**What goes wrong:** User changes settings, closes browser, reopens game, settings reset to defaults.
**Why it happens:** Forgot to call save() after changing settings in SettingsManager, or localStorage key name mismatch on load.
**How to avoid:** Always call this.save() in the set() method. Test full browser close/reopen, not just scene transitions.
**Warning signs:** Settings work during session but reset after closing browser.

### Pitfall 5: Volume Slider Jumps When Dragging
**What goes wrong:** Drag volume slider thumb, it jumps erratically or doesn't follow pointer smoothly.
**Why it happens:** Forgot to clamp dragX position to slider track bounds, or using wrong coordinate space (screen vs scene).
**How to avoid:** Use Phaser.Math.Clamp(dragX, minX, maxX) on drag event. Test dragging at different speeds.
**Warning signs:** Slider thumb position doesn't match pointer position during drag.

### Pitfall 6: Subscription Callbacks Fire During Initialization
**What goes wrong:** AudioManager constructor subscribes to settings, callback fires immediately with initial value, causes unexpected behavior or duplicate initialization.
**Why it happens:** Subscription pattern fires callback on subscribe in some implementations. Manager expects callback only on changes.
**How to avoid:** Don't fire callbacks in subscribe(), only in notify(). Apply initial settings in constructor before subscribing.
**Warning signs:** Console logs show "SFX enabled: true" twice on startup.

## Code Examples

Verified patterns from existing codebase and established practices:

### Initializing SettingsManager at App Startup (Parallel to EconomyManager Pattern)
```typescript
// src/main.ts - extend existing init logic
import { SettingsManager } from './game/SettingsManager';

async function initGame() {
  // ... existing auth and progress init ...

  // Load settings from localStorage (or use defaults)
  const settingsData = SettingsManager.load();
  const settingsManager = new SettingsManager(settingsData);

  // Store in Phaser registry for scene access
  const game = new Phaser.Game(config);
  game.registry.set('settings', settingsManager);

  // ... existing progress and economy manager setup ...
}
```

### Adding Settings Gear Icon to LevelSelect (UI Pattern)
```typescript
// src/scenes/LevelSelect.ts - in create() method
create(): void {
  const width = this.cameras.main.width;
  const height = this.cameras.main.height;

  // ... existing level select UI ...

  // Settings gear icon (top-right)
  this.createSettingsButton(width, height);
}

private createSettingsButton(width: number, height: number): void {
  // Simple gear icon using text (can replace with sprite later)
  const gearIcon = this.add.text(width - 50, 30, '⚙', {
    fontFamily: 'Arial, sans-serif',
    fontSize: '32px',
    color: '#1A1A1A',
  });
  gearIcon.setOrigin(0.5);
  gearIcon.setInteractive({ useHandCursor: true });

  gearIcon.on('pointerover', () => {
    this.tweens.add({
      targets: gearIcon,
      scale: 1.1,
      duration: 100,
    });
  });

  gearIcon.on('pointerout', () => {
    this.tweens.add({
      targets: gearIcon,
      scale: 1,
      duration: 100,
    });
  });

  gearIcon.on('pointerup', () => {
    console.log('[LevelSelect] Opening settings overlay');
    this.showSettingsOverlay();
  });
}
```

### Settings Data Schema with Version Migration
```typescript
// src/game/SettingsManager.ts
export interface SettingsData {
  sfxEnabled: boolean;
  sfxVolume: number;        // 0.0 to 1.0
  animationsEnabled: boolean;
  version: number;
}

static load(): SettingsData {
  try {
    const stored = localStorage.getItem(SettingsManager.STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);

      // Version migration example
      if (parsed.version === 1) {
        return parsed;
      } else if (!parsed.version) {
        // Migrate from version 0 (no version field)
        return {
          sfxEnabled: parsed.soundEnabled ?? true,  // Renamed field
          sfxVolume: parsed.volume ?? 0.5,
          animationsEnabled: true,  // New field with default
          version: 1,
        };
      }
    }
  } catch (e) {
    console.warn('[SettingsManager] Failed to load settings, using defaults', e);
  }

  return new SettingsManager().getDefaults();
}
```

### AudioManager Integration (Full Pattern)
```typescript
// src/game/AudioManager.ts - complete integration
export class AudioManager {
  private scene: Phaser.Scene;
  private muted: boolean = false;
  private volume: number = 0.5;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const settings = scene.registry.get('settings') as SettingsManager;
    if (settings) {
      // Apply initial settings
      this.muted = !settings.get('sfxEnabled');
      this.volume = settings.get('sfxVolume');

      // Subscribe to live changes
      settings.subscribe('sfxEnabled', (enabled: boolean) => {
        this.muted = !enabled;
        console.log('[AudioManager] SFX enabled:', enabled);
      });

      settings.subscribe('sfxVolume', (vol: number) => {
        this.volume = vol;
        console.log('[AudioManager] Volume changed to:', vol);
      });
    }
  }

  play(key: string, volumeOverride?: number): void {
    if (this.muted) return;
    if (!this.scene || !this.scene.sys || !this.scene.sys.isActive()) return;
    try {
      this.scene.sound.play(key, { volume: volumeOverride ?? this.volume });
    } catch (e) {
      console.warn('[AudioManager] Failed to play sound:', key, e);
    }
  }

  // Existing methods unchanged
  playMatch(): void { this.play(SOUND_KEYS.match); }
  playBomb(): void { this.play(SOUND_KEYS.bomb, 0.6); }
  // ... etc
}
```

### VFXManager Integration (Performance Optimization)
```typescript
// src/game/VFXManager.ts - add settings check
export class VFXManager {
  private scene: Phaser.Scene;
  private animationsEnabled: boolean = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createParticleTextures();

    const settings = scene.registry.get('settings') as SettingsManager;
    if (settings) {
      this.animationsEnabled = settings.get('animationsEnabled');
      settings.subscribe('animationsEnabled', (enabled: boolean) => {
        this.animationsEnabled = enabled;
        console.log('[VFXManager] Animations enabled:', enabled);
      });
    }
  }

  // Add early return to ALL VFX methods
  matchPop(x: number, y: number, color: number): void {
    if (!this.animationsEnabled) return;
    // ... existing implementation
  }

  boosterLineSweep(startX: number, startY: number, direction: 'horizontal' | 'vertical', length: number): void {
    if (!this.animationsEnabled) return;
    // ... existing implementation
  }

  boosterBombExplosion(x: number, y: number): void {
    if (!this.animationsEnabled) return;
    // ... existing implementation
  }

  boosterSphereWave(x: number, y: number): void {
    if (!this.animationsEnabled) return;
    // ... existing implementation
  }

  confettiBurst(x: number, y: number): void {
    if (!this.animationsEnabled) return;
    // ... existing implementation
  }

  cascadeCombo(x: number, y: number, depth: number): void {
    if (!this.animationsEnabled) return;
    // ... existing implementation
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cookies for preferences | localStorage API | ~2010 (HTML5) | 10x storage quota (4KB → 5MB), cleaner API, no server round-trip |
| Polling settings on every frame | Reactive subscription pattern | ~2015 (modern frameworks) | Zero overhead when settings unchanged, immediate updates |
| Separate settings scene | Modal overlay in current scene | Phaser 3 best practices | Simpler lifecycle, faster transitions, less memory |
| Global mute flag | Per-manager volume control | Mobile game standards ~2018 | Granular control (SFX vs music), better UX |

**Deprecated/outdated:**
- **Using cookies for settings:** Limited to 4KB, sent on every HTTP request (waste). localStorage is standard.
- **HTML form overlays for game UI:** Requires CSS positioning, doesn't match game style. Use Phaser graphics.
- **Disabling only particles, not tweens:** Modern games disable all animations (particles, tweens, shakes) for accessibility. Check settings before all visual effects.

## Open Questions

1. **Should settings include music toggle separate from SFX toggle?**
   - What we know: Requirements specify "SFX volume" but game may have background music in future phases
   - What's unclear: Current phase has no music assets, only SFX
   - Recommendation: Implement SFX toggle/volume only for now. Add musicEnabled flag to schema with default true for future-proofing (no UI for it yet). When music added in later phase, settings UI already has the field.

2. **Should slider show percentage label (e.g. "50%") next to thumb?**
   - What we know: Mobile games typically show visual-only sliders to save space
   - What's unclear: User preference for explicit percentage vs visual thumb position
   - Recommendation: No percentage label for v1. Visual slider thumb is standard in mobile games and saves space. Can add later if user feedback requests it.

3. **Should animation disable affect button hover tweens and UI animations?**
   - What we know: Requirements say "disable booster animation effects" (VFXManager)
   - What's unclear: Whether button hover scales and menu transitions should also be disabled
   - Recommendation: Disable only VFXManager effects (particles, screen shake, explosions) for v1. Button animations are accessibility-friendly and important for interaction feedback. If user feedback requests full animation disable, add shouldPlayAnimation() helper for scene tweens in v2.

## Sources

### Primary (HIGH confidence)
- Project Codebase: `/Users/vasiliyhrebenuyk/work/KLO/klo-match-3/src/game/AudioManager.ts` - Existing audio management pattern
- Project Codebase: `/Users/vasiliyhrebenuyk/work/KLO/klo-match-3/src/game/VFXManager.ts` - VFX methods to modify
- Project Codebase: `/Users/vasiliyhrebenuyk/work/KLO/klo-match-3/src/game/EconomyManager.ts` - Manager singleton pattern reference
- Project Codebase: `/Users/vasiliyhrebenuyk/work/KLO/klo-match-3/.planning/research/ARCHITECTURE.md` - SettingsManager pattern documented
- MDN Web Docs: [Window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) - API documentation
- Phaser 3 Documentation: [Scene.sound](https://newdocs.phaser.io/docs/3.90.0/Phaser.Sound.BaseSoundManager) - Sound management API

### Secondary (MEDIUM confidence)
- [Slider - Notes of Phaser 3](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/ui-slider/) - rex-ui slider component (reference for custom implementation)
- [Persistent UI objects/components on scenes - Phaser 3](https://phaser.discourse.group/t/persistent-ui-objects-components-on-scenes/2359) - Overlay pattern discussion
- [Mobile Game Settings Checklist - Duelit](https://www.duelit.com/mobile-game-settings-checklist-a-handy-guide/) - Industry best practices for game settings
- [State Management in Vanilla JS: 2026 Trends | Medium](https://medium.com/@chirag.dave/state-management-in-vanilla-js-2026-trends-f9baed7599de) - Reactive patterns with Proxy
- [The Art of Persistent Local Storage | Medium](https://medium.com/@lcs2021021/the-art-of-persistent-local-storage-a-developers-guide-to-state-persistence-29ed77816ea6) - localStorage persistence patterns

### Tertiary (LOW confidence)
- [Game UI Database - Settings: Menu](https://www.gameuidatabase.com/index.php?scrn=26) - Visual reference for settings UI designs
- [Best Mobile Game UI Design and UX Design](https://aaagameartstudio.com/blog/mobile-games-ui-ux) - General UX guidance

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - localStorage is browser native, Phaser already in project, no new dependencies
- Architecture: HIGH - Pattern verified in existing EconomyManager and ProgressManager, localStorage well-documented
- Pitfalls: MEDIUM-HIGH - localStorage quota issues documented, overlay cleanup common in Phaser projects, animation disable logic straightforward

**Research date:** 2026-02-10
**Valid until:** 2026-03-12 (30 days - stable domain, localStorage and Phaser APIs mature)
