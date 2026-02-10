# Technology Stack Additions

**Project:** KLO Match-3 Demo — Milestone 2
**Researched:** 2026-02-10
**Confidence:** HIGH

## Executive Summary

New features (lives system, settings, variable boards, scrollable map, canvas DPI) require **NO additional npm packages**. All capabilities exist within the current stack: Phaser 3.90, TypeScript, Firebase 11.0, and native Web APIs. Implementation is architecture and API usage, not dependency changes.

---

## Validated Current Stack (No Changes)

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **Phaser** | ^3.90.0 | Game framework | Handles all new features natively: variable grid rendering, camera scrolling with parallax, canvas DPI configuration, scene registry for global state |
| **Firebase** | ^11.0.0 | Auth + Firestore persistence | Existing `UserProgress` interface extends cleanly for lives/bonuses, Firestore TTL policies available for timer cleanup |
| **TypeScript** | ^5.7.0 | Type safety | Strong typing for new data structures (lives state, settings schema, level metadata) |
| **Vite** | ^6.0.0 | Build tooling | No changes needed, dev server remains fast with new assets |

**Result:** No `npm install` commands required. All new features use existing dependencies.

---

## NEW Capabilities by Feature

### 1. Lives System with Progressive Regeneration

**Stack:** Firestore + TypeScript + Web APIs (performance.now)

#### Firestore Schema Extension
Extend `UserProgress` interface (no new collections):

```typescript
interface UserProgress {
  // Existing fields...
  current_level: number;
  completed_levels: number[];
  stars: number;
  level_stars: Record<string, number>;
  last_seen: Date | Timestamp;

  // NEW: Lives system
  lives: number;                    // Current lives (0-5)
  max_lives: number;                // Cap (default: 5)
  last_life_lost: Timestamp | null; // When last life was consumed
  next_life_at: Timestamp | null;   // When next life regenerates
}
```

**Why no separate collection:** Lives are user-scoped state, not shared data. Storing in `users/{uid}` doc avoids joins, reduces Firestore reads (cost optimization), and simplifies offline handling.

#### Timer Implementation: performance.now() + Phaser Scene Update Loop

**Why NOT setInterval:**
- setInterval drifts over time (system clock adjustments)
- Not paused when browser tab backgrounded (battery drain)
- Requires manual cleanup to avoid memory leaks

**Why YES Phaser `this.time.now` (wrapper for performance.now):**
- Monotonic clock: never skips backward ([MDN High Precision Timing](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/High_precision_timing))
- Microsecond precision (vs Date.now's millisecond)
- Auto-pauses when scene inactive (built-in lifecycle)
- No cleanup needed (Phaser manages lifecycle)

**Pattern:**
```typescript
// In LevelSelect scene update loop
update(time: number) {
  const now = this.time.now; // performance.now() wrapper
  if (livesManager.shouldRegenerate(now)) {
    livesManager.regenerateLife();
    this.updateLivesDisplay();
  }
}
```

**Sources:**
- [Performance.now() method - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now)
- [Scheduling: setTimeout and setInterval](https://javascript.info/settimeout-setinterval)

#### Firestore TTL Policies (Optional Cleanup)

Use for expired bonus timers, not live regeneration (client-side calculation more responsive).

**Sources:**
- [Manage data retention with TTL policies | Firestore](https://firebase.google.com/docs/firestore/ttl)

---

### 2. Bonus Economy

**Stack:** Firestore (extend UserProgress)

```typescript
interface UserProgress {
  // NEW: Bonuses
  bonuses: {
    bomb: number;           // Count of available bomb boosters
    linear_h: number;       // Horizontal line boosters
    linear_v: number;       // Vertical line boosters
    klo_sphere: number;     // KLO-sphere boosters
  };
  bonus_history: {
    earned_total: number;   // Lifetime earned
    used_total: number;     // Lifetime used
  };
}
```

**Why separate from level stars:** Bonuses are consumable currency, stars are achievement markers. Decoupling enables future IAP (in-app purchases) for bonus packs without touching star logic.

**Sources:**
- [Firebase for games | Supercharge your games with Firebase](https://firebase.google.com/games)

---

### 3. Settings Menu with Persistence

**Stack:** localStorage (NOT Firestore)

#### Why localStorage over Firestore

| Criterion | localStorage | Firestore |
|-----------|--------------|-----------|
| **Latency** | 0ms (synchronous) | 50-200ms (network) |
| **Offline** | Always available | Requires cache setup |
| **Cost** | Free | $0.36/100K reads |
| **Use case** | UI preferences | Cross-device sync |

Settings are UI-scoped (volume, SFX on/off, language) — no cross-device sync needed. localStorage wins on speed and cost.

**Schema:**
```typescript
interface GameSettings {
  volume: number;         // 0.0 - 1.0
  sfx_enabled: boolean;
  music_enabled: boolean;
  language: 'uk' | 'en';  // Ukrainian (default) | English
  version: string;        // Schema version for migrations
}
```

**Implementation pattern:**
```typescript
// Singleton SettingsManager
class SettingsManager {
  private static readonly STORAGE_KEY = 'klo_match3_settings';

  load(): GameSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
    } catch (e) {
      console.warn('localStorage unavailable (private browsing?), using defaults');
      return DEFAULT_SETTINGS;
    }
  }

  save(settings: GameSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      // Quota exceeded or private browsing - fail silently
    }
  }
}
```

**Best practices enforced:**
- Try-catch for private browsing mode (localStorage throws)
- Version field for future schema migrations
- Default fallback when storage unavailable

**Storage quota:** 10 MiB max across all localStorage. Settings JSON ~200 bytes, no risk of quota issues.

**Sources:**
- [localStorage in JavaScript: A complete guide - LogRocket](https://blog.logrocket.com/localstorage-javascript-complete-guide/)
- [Using localStorage in Modern Applications - RxDB](https://rxdb.info/articles/localstorage.html)
- [Storage quotas and eviction criteria - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)

---

### 4. Variable-Size Game Boards

**Stack:** Phaser 3 (existing) + JSON level data

#### Current Implementation (Fixed 8x8)

```typescript
// main.ts
const GRID_WIDTH = 8;
const GRID_HEIGHT = 8;
```

#### NEW: Dynamic Grid from Level Data

```json
// level_006.json (NEW advanced level)
{
  "level_id": 6,
  "grid": {
    "width": 6,
    "height": 9,
    "blocked_cells": [[0,0], [0,5], [8,0], [8,5]]
  }
}
```

**Changes:**
1. Game scene reads `grid.width` and `grid.height` from level JSON
2. Match3Engine constructor takes dimensions as parameters (already does)
3. Grid rendering loop uses level dimensions instead of constants

**Phaser capabilities validated:**
- Grid rendering: Manual loop over `width × height`, no built-in Grid object needed ([Phaser Grid docs](https://docs.phaser.io/api-documentation/class/gameobjects-grid))
- Dynamic positioning: Centering calculation works for any dimensions

**No new dependencies.** Pure logic change.

**Sources:**
- [Grid - Phaser 3 API Documentation](https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.GameObjects.GameObjectFactory-grid)

---

### 5. Scrollable Kyiv Map Level Select

**Stack:** Phaser 3 Camera + TileSprite for parallax

#### Camera Scrolling (Built-in)

Phaser 3.90 cameras support scrolling natively:

```typescript
// LevelSelect scene
create() {
  // Set world bounds larger than viewport
  this.cameras.main.setBounds(0, 0, 2048, 1536); // Kyiv map size

  // Enable drag scrolling
  this.input.on('pointermove', (pointer) => {
    if (pointer.isDown) {
      this.cameras.main.scrollX -= pointer.velocity.x / 10;
      this.cameras.main.scrollY -= pointer.velocity.y / 10;
    }
  });
}
```

**Mobile touch:** Phaser unifies mouse and touch via `pointer` events — same code works on desktop and mobile ([Phaser Input docs](https://docs.phaser.io/phaser/concepts/input)).

#### Parallax Background (TileSprite + setScrollFactor)

```typescript
// Background layer (slow scroll)
const bg = this.add.tileSprite(0, 0, 2048, 1536, 'kyiv_map_bg');
bg.setScrollFactor(0.3); // Moves 3.3x slower than camera

// Mid-layer (landmarks)
const landmarks = this.add.image(1024, 768, 'kyiv_landmarks');
landmarks.setScrollFactor(0.6); // Moves 1.67x slower

// Foreground (level nodes) - default scrollFactor = 1
```

**setScrollFactor logic:** Value < 1 = slower than camera (background effect), Value = 1 = moves with camera (foreground).

**No plugins needed.** Phaser 3 core API.

**Sources:**
- [Add Pizazz with Parallax Scrolling in Phaser 3](https://blog.ourcade.co/posts/2020/add-pizazz-parallax-scrolling-phaser-3/)
- [Parallax Background with Zoom and Drag - Phaser 3](https://phaser.discourse.group/t/parallax-background-with-zoom-and-drag/11017)

---

### 6. Canvas DPI / High-Resolution Support

**Stack:** Phaser 3 config (resolution property)

#### Problem: Blurry on Retina Displays

Default Phaser canvas renders at CSS pixel size (e.g., 1024×768). On 2x DPI displays (Retina MacBook, high-end Android), canvas is upscaled by browser → blurry.

#### Solution: Phaser 3 `resolution` Config

```typescript
// main.ts
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,

  // NEW: Match device pixel ratio
  resolution: window.devicePixelRatio || 1,

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};
```

**What it does:**
- `resolution: 2` → Canvas internal size = 2048×1536 (2× game size)
- CSS size stays 1024×768 (via `scale.mode`)
- Result: Crisp rendering on 2× displays, no blurriness

**Device pixel ratios:**
- Standard displays: 1
- Retina MacBook / iPad: 2
- High-end Android: 2.5-3
- Desktop 4K monitors (150% scaling): 1.5

**Performance note:** Higher resolution = more pixels to render. Test on low-end devices. If FPS drops, clamp resolution:

```typescript
resolution: Math.min(window.devicePixelRatio, 2), // Cap at 2× for performance
```

**Sources:**
- [Support retina with Phaser 3](https://supernapie.com/blog/support-retina-with-phaser-3/)
- [Renderer resolution is blurry for devices with devicePixelRatio > 1](https://github.com/photonstorm/phaser/issues/3198)
- [How to Use Retina Graphics in HTML5 Phaser Games](https://www.joshmorony.com/how-to-use-retina-graphics-in-html5-phaser-games/)

---

## What NOT to Add

### ❌ RxJS for Timer Management
**Why avoid:** Adds 350KB bundle size for features already in Phaser (time.now, scene lifecycle). Overkill for simple regeneration timer.

### ❌ Redux / Zustand for State Management
**Why avoid:** Phaser registry (`this.registry.set/get`) provides global state already. Adding external state lib duplicates functionality, increases complexity.

**Existing pattern works:**
```typescript
// main.ts
game.registry.set('progress', progressManager);
game.registry.set('settings', settingsManager); // NEW
game.registry.set('lives', livesManager);       // NEW

// Any scene
const lives = this.registry.get('lives') as LivesManager;
```

**Sources:**
- [Phaser Scene Registry docs](https://docs.phaser.io/phaser/concepts/scenes)
- [Data Manager - Phaser](https://docs.phaser.io/phaser/concepts/data-manager)

### ❌ Moment.js / Day.js for Time Calculations
**Why avoid:** Lives regeneration uses duration math (ms since last life lost), not date formatting. Native `Date` + `Timestamp` sufficient.

```typescript
// Native solution (no lib needed)
const msSinceLastLife = Date.now() - lastLifeLost.toMillis();
const livesRegened = Math.floor(msSinceLastLife / LIFE_REGEN_MS);
```

### ❌ i18next for Localization
**Why avoid:** Only 2 languages (Ukrainian/English), 50-100 strings total. Simple object lookup faster and smaller than i18next (70KB).

**Lightweight pattern:**
```typescript
const STRINGS = {
  uk: { level_select: 'Вибрати рівень', lives: 'Життя' },
  en: { level_select: 'Select Level', lives: 'Lives' },
};
const t = (key: string) => STRINGS[settings.language][key];
```

---

## Integration Points

### Lives System ↔ Game Scene
**Entry point:** Game scene checks lives before start via `this.registry.get('lives')`.

**Flow:**
1. User taps level in LevelSelect
2. LevelSelect checks `livesManager.canPlay()` → returns boolean + remaining lives
3. If false, show "No Lives" overlay with regeneration timer
4. If true, `livesManager.consumeLife()` → decrement, update Firestore, start Game scene

**Exit point:** On level complete/fail, do NOT refund lives (consumed on entry, not exit).

### Settings ↔ Audio Managers
**Initialization:** Boot scene loads settings → passes to AudioManager singleton.

**Pattern:**
```typescript
// Boot scene
const settings = settingsManager.load();
const audioManager = new AudioManager(this, settings);
this.registry.set('audio', audioManager);

// Settings scene (when user changes volume slider)
audioManager.setVolume(newVolume);
settingsManager.save({ ...settings, volume: newVolume });
```

**Phaser Audio API:** `this.sound.volume = settings.volume` (global volume control).

**Sources:**
- [Web Audio API best practices - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)

### Variable Boards ↔ Match3Engine
**Current:** Engine constructor already accepts `(rows, cols)` parameters.

**Change:** Pass level data dimensions instead of constants.

```typescript
// Game scene create()
const levelData = this.cache.json.get(`level_${levelId}`);
const { width, height } = levelData.grid;

this.engine = new Match3Engine(height, width); // Already supports this
```

**Blocked cells:** Handled by existing `blocked_cells` array in level JSON, rendered as permanent obstacles.

### Scrollable Map ↔ Progress Manager
**Level unlock logic:** Unchanged (sequential unlock: level N requires level N-1 complete).

**Visual:** Camera centers on highest unlocked level node on scene start.

```typescript
// LevelSelect create()
const maxLevel = progressManager.getMaxUnlockedLevel();
const levelNode = this.levelNodes[maxLevel - 1]; // Array of level sprites
this.cameras.main.centerOn(levelNode.x, levelNode.y);
```

---

## Mobile Responsiveness Additions

### Touch Input (Already Handled)
Phaser unifies mouse/touch as `pointer` events — existing swipe code works on mobile without changes.

**Validation:** Current `input.on('pointerdown')` handlers in Game scene are touch-compatible.

**Sources:**
- [Phaser Input - Unified mouse/touch API](https://docs.phaser.io/phaser/concepts/input)

### Viewport Meta Tag (Already Set)
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```
Present in `index.html` — prevents mobile browser zoom issues.

### Scale Mode (Already Configured)
```typescript
scale: {
  mode: Phaser.Scale.FIT, // Maintains aspect ratio, fits in viewport
  autoCenter: Phaser.Scale.CENTER_BOTH,
}
```
Handles portrait/landscape orientation automatically.

**Sources:**
- [Responsive Phaser Game | Medium](https://medium.com/@mattcolman/responsive-phaser-game-54a0e2dafba7)
- [Full-Screen Size and Responsive Game in Phaser 3 | Medium](https://medium.com/@tajammalmaqbool11/full-screen-size-and-responsive-game-in-phaser-3-e563c2d60eab)

---

## Version Verification Summary

| Dependency | Current | Required | Status |
|------------|---------|----------|--------|
| Phaser | 3.90.0 | ≥3.80 (resolution, camera API) | ✅ Compatible |
| Firebase | 11.0.0 | ≥9.0 (Firestore modular SDK) | ✅ Compatible |
| TypeScript | 5.7.0 | ≥5.0 (strong typing) | ✅ Compatible |
| Vite | 6.0.0 | ≥5.0 (build perf) | ✅ Compatible |

**No upgrades needed.**

---

## Implementation Checklist

- [ ] Extend `UserProgress` interface in `firebase/firestore.ts` (lives, bonuses)
- [ ] Create `LivesManager` class using Phaser `time.now` for regeneration
- [ ] Create `SettingsManager` class with localStorage persistence
- [ ] Update Game scene to read grid dimensions from level JSON
- [ ] Convert LevelSelect scene to camera-scrollable world
- [ ] Add parallax background layers with `setScrollFactor`
- [ ] Add `resolution: window.devicePixelRatio` to Phaser config
- [ ] Test DPI rendering on 2× display (Retina MacBook or high-DPI Android)
- [ ] Wire lives check into level entry flow (LevelSelect → Game)
- [ ] Wire settings into AudioManager initialization (Boot → Scenes)

---

## Confidence Assessment

| Area | Level | Rationale |
|------|-------|-----------|
| **Lives/Bonus Persistence** | HIGH | Firestore schema extension is straightforward, validated pattern from existing `UserProgress` |
| **Timer Implementation** | HIGH | Phaser `time.now` (performance.now wrapper) is documented, battle-tested for game timers |
| **Settings Persistence** | HIGH | localStorage is standard Web API, 10 MiB quota exceeds needs by 50,000× |
| **Variable Boards** | HIGH | Match3Engine already supports dynamic dimensions, level JSON schema validated |
| **Scrollable Map** | HIGH | Phaser camera API is core framework feature, parallax via `setScrollFactor` is well-documented |
| **Canvas DPI** | HIGH | `resolution` config property exists since Phaser 3.16, widely used for Retina support |

**Overall Confidence: HIGH** — All features use existing stack capabilities, no experimental APIs or third-party libraries.

---

## Sources

### Phaser 3 Architecture & APIs
- [Phaser v3.90 Technical Preview 1](https://phaser.io/news/2024/05/phaser-390-technical-preview-1)
- [What are Phaser 3 bad/best practices?](https://phaser.discourse.group/t/what-are-phaser-3-bad-best-practices/5088)
- [Grid - Phaser 3 API Documentation](https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.GameObjects.GameObjectFactory-grid)
- [Phaser Input - Concepts](https://docs.phaser.io/phaser/concepts/input)
- [Phaser Scene Registry](https://docs.phaser.io/phaser/concepts/scenes)
- [Data Manager - Phaser](https://docs.phaser.io/phaser/concepts/data-manager)

### Parallax & Camera
- [Add Pizazz with Parallax Scrolling in Phaser 3](https://blog.ourcade.co/posts/2020/add-pizazz-parallax-scrolling-phaser-3/)
- [Parallax Background with Zoom and Drag - Phaser 3](https://phaser.discourse.group/t/parallax-background-with-zoom-and-drag/11017)

### Canvas DPI / Resolution
- [Support retina with Phaser 3](https://supernapie.com/blog/support-retina-with-phaser-3/)
- [Renderer resolution is blurry for devices with devicePixelRatio > 1](https://github.com/photonstorm/phaser/issues/3198)
- [How to Use Retina Graphics in HTML5 Phaser Games](https://www.joshmorony.com/how-to-use-retina-graphics-in-html5-phaser-games/)

### Firebase / Firestore
- [Manage data retention with TTL policies | Firestore](https://firebase.google.com/docs/firestore/ttl)
- [Firebase for games | Supercharge your games with Firebase](https://firebase.google.com/games)

### Web APIs
- [Performance.now() method - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now)
- [High precision timing - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/High_precision_timing)
- [localStorage in JavaScript: A complete guide - LogRocket](https://blog.logrocket.com/localstorage-javascript-complete-guide/)
- [Storage quotas and eviction criteria - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [Web Audio API best practices - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)

### Timers & Performance
- [Scheduling: setTimeout and setInterval](https://javascript.info/settimeout-setinterval)
- [Accurate Timing with performance.now in JavaScript](https://medium.com/@AlexanderObregon/getting-accurate-time-with-javascript-performance-now-ccd658a97ab3)

### Mobile Responsiveness
- [Responsive Phaser Game | Medium](https://medium.com/@mattcolman/responsive-phaser-game-54a0e2dafba7)
- [Full-Screen Size and Responsive Game in Phaser 3](https://medium.com/@tajammalmaqbool11/full-screen-size-and-responsive-game-in-phaser-3-e563c2d60eab)
