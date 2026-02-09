# Phase 5: Assets & Polish - Research

**Researched:** 2026-02-09
**Domain:** Phaser 3 asset integration, animation polish, VFX
**Confidence:** HIGH

## Summary

Phase 5 replaces programmatic placeholder graphics with real sprite assets from `assets/` folder and adds animation polish for client-demo quality. The existing codebase uses Phaser 3.90.0 with TypeScript, has programmatic TileSprite class, and follows the Boot → Menu → LevelSelect → Game → Win/Lose flow.

Research focused on Phaser 3 asset loading patterns, texture/sprite management, particle systems for VFX, tween-based animations, and mobile performance optimization. The standard approach is to load PNG assets in Boot scene preload, create Image/Sprite objects from loaded textures, use ParticleEmitter for explosions/confetti, and use Tween system for micro-interactions and transitions.

Key findings: Phaser 3 provides built-in particle system with flexible configuration, tween animations with easing functions (including bounce/elastic), camera fade transitions, and audio manager for sound effects. Assets are available: 5 tile PNGs, 7 blocker PNGs (ice/grass progression), 50+ GUI elements, and 7 sound effects. The primary challenge is mapping 5 available tiles to 4 game types and creating booster overlays programmatically since no separate booster PNGs exist.

**Primary recommendation:** Load all assets in Boot.preload(), extend TileSprite to use Image sprites instead of Graphics drawing, add ParticleEmitter pool for match/booster effects, use Tween system for all animations with easing, and add AudioManager wrapper for sound playback.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Asset Sourcing:**
- Assets provided by user in `assets/` folder — use these as primary source
- **Booster visuals**: Overlay effects on top of tile sprites — arrows for line boosters, glow/pulse for bombs, etc. No separate booster sprite PNGs needed
- **Obstacle mapping**:
  - `bubble.png` = 1-hit blocker (single match to clear)
  - `ice01.png → ice02.png → ice03.png` = multi-hit ice with visual damage progression (3 stages)
  - `grss01.png → grss02.png → grss03.png` = multi-hit grass/dirt with visual damage progression (3 stages)
  - Blocked cells and crates: use programmatic drawing or closest available asset
- **GUI elements**: Full button set available in `assets/gui/` (multiple colors, progress bars, crowns, hearts, goal flag, map pointer, lock, switches). Use orange/yellow buttons for primary actions per KLO branding
- **Sound effects**: Available in `assets/sound/` (match, bomb, sphere, horizontal, level_win, level_loose). Integrate these into gameplay
- For anything missing: Claude generates programmatically or finds suitable alternatives

**Animation & VFX:**
- **Match clearing**: Organic micro-interactions — small bounce on swap, satisfying pop on clear, subtle particles. Not flashy but tactile and responsive
- **Booster activation**: ESSENTIAL — big wow moment for the demo. Line sweep, explosion radius, color wave — these are demo highlight moments that impress the client
- **Screen transitions**: Slide/swipe transitions between scenes (menu → level select → game → win/lose). Dynamic, app-like feel
- **Win celebration**: Stars animate in (1-3 based on performance) + confetti burst + score counter rolls up. Classic premium mobile game feel
- **General principle**: Organic animation with micro-interactions throughout — slight bounces, easing, responsive feedback on every interaction

**Scene Backgrounds:**
- **Level select**: Mini road map with 5 checkpoint buttons along a short path, KLO-themed decor. Premium feel even for 5 levels
- **Main menu**: Animated title screen — KLO logo with subtle animation (glow, floating tiles in background), Play button with bounce effect

### Claude's Discretion

- **Tile mapping**: Map the 5 available tiles (coffee, fuel_can, fuel-2, light, wheel) to the 4 game tile types. Best fit from available assets; if something doesn't fit, use programmatic fallback
- **Game board background**: Keep tiles readable while looking polished (soft gradient or subtle themed scene)
- **Win/Lose overlay style**: Pick approach that feels best for client demo presentation (dimmed board + card vs full overlay)
- **Blocked cell and crate visual approach**: Use programmatic drawing or closest available asset
- **Particle effect details**: Colors, count, spread for match/booster particles
- **Any missing asset gaps**: Programmatic or sourced alternatives

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser 3 | 3.90.0 | Game framework with asset loading, rendering, animation | Industry standard for 2D web games, comprehensive built-in systems |
| TypeScript | Latest | Type-safe development | Already used in Phases 1-4 |
| Vite | Latest | Build system | Already configured in project |

**No additional libraries needed.** Phaser 3 includes:
- Texture Manager for sprite/image asset management
- ParticleEmitter for VFX (explosions, confetti)
- Tween system for animations (scale, rotation, position, alpha)
- Camera effects (fade, shake, flash)
- Audio Manager for sound playback

### Asset Loading Pattern

**Standard Phaser 3 approach:**
```typescript
// In Boot.ts preload()
this.load.setPath('assets/tiles/');
this.load.image('coffee', 'coffee.png');
this.load.image('wheel', 'wheel.png');
// etc.

this.load.setPath('assets/blockers/');
this.load.image('ice01', 'ice01.png');
this.load.image('ice02', 'ice02.png');
// etc.

this.load.setPath('assets/sound/');
this.load.audio('match', 'match.wav');
this.load.audio('bomb', 'bomb.wav');
// etc.
```

**Asset access after loading:**
```typescript
// Create sprite from loaded texture
const tileSprite = this.add.image(x, y, 'coffee');

// Play sound
this.sound.play('match');

// Create particles from texture
const particles = this.add.particles(x, y, 'particle_texture', config);
```

### Installation

No additional packages required. All functionality is built into Phaser 3.90.0 already installed.

---

## Architecture Patterns

### Pattern 1: Asset Preloading in Boot Scene

**What:** Load all assets once in Boot scene before transitioning to Menu. Assets remain in memory across all scenes.

**When to use:** For games with small-to-medium asset footprint (this demo has <50 image assets + 7 audio files = well under mobile texture limits).

**Why standard:** Phaser's global Texture Manager and Cache make all loaded assets available to all scenes. Single-load approach prevents loading delays during gameplay.

**Example:**
```typescript
// Boot.ts
preload(): void {
  // Set up progress bar (already implemented)

  // Load tile sprites
  this.load.setPath('assets/tiles/');
  this.load.image('tile_coffee', 'coffee.png');
  this.load.image('tile_wheel', 'wheel.png');
  this.load.image('tile_fuel_can', 'fuel_can.png');
  this.load.image('tile_fuel_2', 'fuel-2.png');
  this.load.image('tile_light', 'light.png');

  // Load obstacle sprites
  this.load.setPath('assets/blockers/');
  this.load.image('obstacle_bubble', 'bubble.png');
  this.load.image('obstacle_ice01', 'ice01.png');
  this.load.image('obstacle_ice02', 'ice02.png');
  this.load.image('obstacle_ice03', 'ice03.png');
  this.load.image('obstacle_grss01', 'grss01.png');
  this.load.image('obstacle_grss02', 'grss02.png');
  this.load.image('obstacle_grss03', 'grss03.png');

  // Load GUI elements
  this.load.setPath('assets/gui/');
  this.load.image('btn_orange', 'Button Orange.png');
  this.load.image('btn_yellow', 'Button Yellow.png');
  this.load.image('crown1', 'Crown 1.png');
  this.load.image('crown2', 'Crown 2.png');
  this.load.image('heart', 'Heart.png');
  this.load.image('goal_flag', 'Goal.png');
  // etc.

  // Load sounds
  this.load.setPath('assets/sound/');
  this.load.audio('sfx_match', 'match.wav');
  this.load.audio('sfx_bomb', 'bomb.wav');
  this.load.audio('sfx_sphere', 'sphere.wav');
  this.load.audio('sfx_horizontal', 'horizontal.wav');
  this.load.audio('sfx_level_win', 'level_win.wav');
  this.load.audio('sfx_level_loose', 'level_loose.wav');
}
```

**Source:** [Phaser Loader Documentation](https://docs.phaser.io/phaser/concepts/loader)

### Pattern 2: Replace Graphics with Image Sprites in TileSprite

**What:** Replace `Phaser.GameObjects.Graphics` drawing with `Phaser.GameObjects.Image` using loaded textures.

**When to use:** When transitioning from prototype (programmatic) to production (asset-based) graphics.

**Current implementation:** TileSprite extends Container and uses Graphics.fillRoundedRect() to draw colored tiles.

**Target implementation:** TileSprite uses Image sprite as child, sets texture based on type.

**Example:**
```typescript
// Current (programmatic):
this.graphics.clear();
this.graphics.fillStyle(TILE_COLORS[this.type], 1);
this.graphics.fillRoundedRect(-halfSize, -halfSize, tileSize, tileSize, 8);

// Target (asset-based):
if (!this.tileImage) {
  this.tileImage = this.scene.add.image(0, 0, this.getTextureKey());
  this.add(this.tileImage);
}
this.tileImage.setTexture(this.getTextureKey());
this.tileImage.setDisplaySize(TILE_SIZE - TILE_GAP, TILE_SIZE - TILE_GAP);

private getTextureKey(): string {
  const mapping: Record<TileType, string> = {
    'fuel': 'tile_fuel_can',
    'coffee': 'tile_coffee',
    'snack': 'tile_wheel',  // Best fit mapping
    'road': 'tile_light',   // Best fit mapping
  };
  return mapping[this.type];
}
```

**Why this pattern:** Preserves existing TileSprite API (setType, setGridPosition, reset) while swapping rendering backend. Game.ts code unchanged.

### Pattern 3: Particle System for VFX

**What:** Use Phaser.GameObjects.ParticleEmitter for match explosions, booster effects, and confetti.

**When to use:** Any visual effect requiring multiple short-lived animated objects (sparks, stars, confetti, smoke).

**Configuration approach:** Create emitter configs as constants, instantiate emitters in scene create(), trigger with explode() or emit().

**Example:**
```typescript
// VFX config constants
const MATCH_POP_CONFIG = {
  speed: { min: 100, max: 200 },
  scale: { start: 0.8, end: 0 },
  lifespan: 400,
  gravityY: 300,
  quantity: 8,
  tint: [0xFFD700, 0xFFB800, 0xFFA500], // Yellow/orange tones
};

const BOMB_EXPLOSION_CONFIG = {
  speed: { min: 200, max: 400 },
  scale: { start: 1, end: 0 },
  lifespan: 600,
  quantity: 30,
  tint: [0xFF6600, 0xFFAA00, 0xFFFFFF],
};

const WIN_CONFETTI_CONFIG = {
  speed: { min: 300, max: 500 },
  scale: { start: 1, end: 0.5 },
  gravityY: 500,
  lifespan: 2000,
  quantity: 50,
  angle: { min: 265, max: 275 }, // Mostly upward
  tint: [0xFFD700, 0xFF69B4, 0x00D4FF, 0x00FF88],
};

// In Game.ts create():
// Create particle texture programmatically
const particleGraphics = this.make.graphics({ x: 0, y: 0, add: false });
particleGraphics.fillStyle(0xFFFFFF);
particleGraphics.fillCircle(8, 8, 8);
particleGraphics.generateTexture('particle', 16, 16);
particleGraphics.destroy();

// Create emitter (reusable, just move to position)
this.matchParticles = this.add.particles(0, 0, 'particle', MATCH_POP_CONFIG);
this.matchParticles.stop(); // Start stopped

// Trigger effect:
private playMatchEffect(x: number, y: number): void {
  this.matchParticles.setPosition(x, y);
  this.matchParticles.explode(MATCH_POP_CONFIG.quantity);
  this.sound.play('sfx_match');
}
```

**Source:** [Phaser Particles Documentation](https://docs.phaser.io/phaser/concepts/gameobjects/particles)

### Pattern 4: Tween System for Animations

**What:** Use `this.tweens.add()` for smooth property animations (scale, position, rotation, alpha).

**When to use:** All non-particle animations — tile swaps, button bounces, star reveal, score counter, scene transitions.

**Key easing functions:**
- `Bounce.Out` — satisfying pop for button presses, tile matches
- `Elastic.Out` — playful overshoot for star reveals
- `Back.Out` — slight overshoot for UI elements appearing
- `Cubic.InOut` — smooth tile swaps, scene transitions

**Example:**
```typescript
// Tile swap animation
this.tweens.add({
  targets: tile1,
  x: tile2.x,
  y: tile2.y,
  duration: 200,
  ease: 'Cubic.InOut',
});

// Button bounce on hover
this.tweens.add({
  targets: button,
  scaleX: 1.1,
  scaleY: 1.1,
  duration: 150,
  ease: 'Back.Out',
  yoyo: false,
});

// Match pop animation
this.tweens.add({
  targets: tile,
  scaleX: 1.2,
  scaleY: 1.2,
  alpha: 0,
  duration: 300,
  ease: 'Bounce.Out',
  onComplete: () => tile.destroy(),
});

// Star reveal (win screen)
stars.forEach((star, i) => {
  star.setScale(0);
  star.setAlpha(0);
  this.tweens.add({
    targets: star,
    scaleX: 1,
    scaleY: 1,
    alpha: 1,
    duration: 400,
    delay: i * 200,
    ease: 'Elastic.Out',
  });
});

// Score counter roll-up
this.tweens.addCounter({
  from: 0,
  to: finalScore,
  duration: 1500,
  ease: 'Cubic.Out',
  onUpdate: (tween) => {
    const value = Math.floor(tween.getValue());
    scoreText.setText(`${value}`);
  },
});
```

**Sources:**
- [Phaser Tween Animation Basics](https://developer.mozilla.org/en-US/docs/Games/Tutorials/2D_breakout_game_Phaser/Animations_and_tweens)
- [Phaser Easing Functions](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/ease-function/)

### Pattern 5: Scene Transitions with Camera Effects

**What:** Use `this.cameras.main.fade()` and tween-based slide effects for scene transitions.

**When to use:** All scene changes (Menu → LevelSelect → Game → Win/Lose).

**Built-in camera transitions:**
- `fadeOut(duration, r, g, b)` — fade to color
- `fadeIn(duration, r, g, b)` — fade from color
- `flash(duration, r, g, b)` — brief flash effect
- `shake(duration, intensity)` — screen shake (use sparingly)

**Custom slide transition:**
```typescript
// Slide scene in from right
startLevelSelect(): void {
  const width = this.cameras.main.width;

  // Fade out current scene
  this.cameras.main.fadeOut(200, 0, 0, 0);

  this.cameras.main.once('camerafadeoutcomplete', () => {
    // Start new scene
    this.scene.start('LevelSelect');
  });
}

// In LevelSelect.create():
// Start with camera offset, then slide into position
this.cameras.main.scrollX = this.cameras.main.width;
this.tweens.add({
  targets: this.cameras.main,
  scrollX: 0,
  duration: 300,
  ease: 'Cubic.Out',
});

// Or use fade in
this.cameras.main.fadeIn(200, 249, 249, 249); // Fade from KLO_WHITE
```

**Win/Lose overlay approach (RECOMMENDED):**
- Dim game board: Add semi-transparent black rectangle over board
- Slide card in from top: Create Container with card graphics, start above screen, tween into center
- This preserves game state visibility (player sees final board state)

```typescript
// Win overlay example
showWinOverlay(stars: number): void {
  // Dim background
  const dimRect = this.add.rectangle(
    this.cameras.main.width / 2,
    this.cameras.main.height / 2,
    this.cameras.main.width,
    this.cameras.main.height,
    0x000000,
    0.6
  );

  // Create card container
  const card = this.add.container(
    this.cameras.main.width / 2,
    -200 // Start above screen
  );

  // Card background
  const cardBg = this.add.graphics();
  cardBg.fillStyle(0xF9F9F9, 1);
  cardBg.fillRoundedRect(-150, -200, 300, 400, 20);
  card.add(cardBg);

  // "Victory!" text
  const title = this.add.text(0, -120, 'Victory!', {
    fontSize: '48px',
    color: '#1A1A1A',
    fontStyle: 'bold',
  }).setOrigin(0.5);
  card.add(title);

  // Stars (added later with delay)
  const starContainer = this.add.container(0, 0);
  card.add(starContainer);
  // ... add star images

  // Slide card in
  this.tweens.add({
    targets: card,
    y: this.cameras.main.height / 2,
    duration: 400,
    ease: 'Back.Out',
  });

  // Trigger confetti
  this.time.delayedCall(200, () => {
    this.playConfettiEffect();
  });
}
```

**Sources:**
- [Phaser Scene Transition with Fade](https://blog.ourcade.co/posts/2020/phaser-3-fade-out-scene-transition/)
- [GitHub: Phaser 3 Transitions Plugin](https://github.com/JHAvrick/phaser3-transitions)

### Pattern 6: Audio Manager Wrapper

**What:** Create simple AudioManager class to centralize sound playback with volume control and mute toggle.

**When to use:** Better than calling `this.sound.play()` directly — allows global mute, volume adjustment, prevents multiple overlapping sounds.

**Example:**
```typescript
// src/game/AudioManager.ts
export class AudioManager {
  private scene: Phaser.Scene;
  private isMuted: boolean = false;
  private volume: number = 1.0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  playMatch(): void {
    if (!this.isMuted) {
      this.scene.sound.play('sfx_match', { volume: this.volume * 0.5 });
    }
  }

  playBomb(): void {
    if (!this.isMuted) {
      this.scene.sound.play('sfx_bomb', { volume: this.volume * 0.7 });
    }
  }

  playSphere(): void {
    if (!this.isMuted) {
      this.scene.sound.play('sfx_sphere', { volume: this.volume * 0.8 });
    }
  }

  playHorizontal(): void {
    if (!this.isMuted) {
      this.scene.sound.play('sfx_horizontal', { volume: this.volume * 0.7 });
    }
  }

  playLevelWin(): void {
    if (!this.isMuted) {
      this.scene.sound.play('sfx_level_win', { volume: this.volume });
    }
  }

  playLevelLose(): void {
    if (!this.isMuted) {
      this.scene.sound.play('sfx_level_loose', { volume: this.volume });
    }
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  setVolume(volume: number): void {
    this.volume = Phaser.Math.Clamp(volume, 0, 1);
  }
}

// Usage in Game.ts:
this.audioManager = new AudioManager(this);

// On match:
this.audioManager.playMatch();
```

**Source:** [Phaser Audio Management](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/audio/)

### Anti-Patterns to Avoid

- **Loading assets in Game scene preload():** Causes loading delay every time player starts a level. Load once in Boot scene instead.
- **Creating new particles every frame:** Use object pooling pattern — create emitters once, reuse with setPosition() and explode().
- **Animating with setInterval/setTimeout:** Use Phaser's tween system and time.delayedCall() for frame-rate independent animations.
- **Playing sounds without checking mute state:** Always gate sound playback through AudioManager or check global mute flag.
- **Overusing particle effects:** "Organic micro-interactions" means subtle. Don't spawn 100 particles for every match — 8-12 is enough for match pop, 30 for bomb, 50 for win confetti.
- **Using separate texture per tile instance:** All tiles of same type share one texture — this is automatic with Phaser's Texture Manager, but don't manually create duplicate Image objects.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Particle explosions | Custom sprite animation loops | `Phaser.GameObjects.ParticleEmitter` | Phaser's particle system handles pooling, physics, fade-out, cleanup automatically. Custom sprite loops leak memory. |
| Smooth animations | Manual interpolation in update() | `this.tweens.add()` | Tween system handles easing, frame-rate independence, promise-like callbacks. Manual interpolation has timing bugs. |
| Scene fade transitions | Manual alpha interpolation | `this.cameras.main.fadeOut()` | Built-in camera effects are optimized, handle edge cases, and work across all renderers. |
| Sound playback throttling | Timestamp checks to prevent overlaps | `Phaser.Sound.BaseSoundManager` with `config` | Sound manager has built-in rate limiting, overlap prevention, and pooling. |
| Sprite atlas creation | Manual frame definitions | Texture Packer or Shoebox | Tools generate optimized atlases with proper metadata. Hand-rolled atlases waste texture memory. |
| Object pooling for particles | Custom pool array management | ParticleEmitter's built-in pooling | Emitters automatically pool particles, handle allocation/deallocation, prevent memory leaks. |

**Key insight:** Phaser 3 has mature built-in systems for all common game polish tasks. The framework has spent years optimizing these systems for mobile performance, memory management, and edge cases. Custom implementations rarely match this quality and always take longer to develop.

---

## Common Pitfalls

### Pitfall 1: Asset Path Mismatches

**What goes wrong:** Texture keys don't match loaded keys, causing "Texture not found" errors at runtime.

**Why it happens:** Using `this.load.image('coffee', 'coffee.png')` then referencing `'tile_coffee'` in sprite creation. Or forgetting `setPath()` and providing wrong relative path.

**How to avoid:**
1. Create constants file for all texture keys: `src/game/textureKeys.ts`
2. Use consistent naming: `tile_coffee`, `obstacle_ice01`, `btn_orange`, `sfx_match`
3. Document mapping in Boot.ts comments
4. Use TypeScript string literal types for texture keys

**Example:**
```typescript
// src/game/textureKeys.ts
export const TEXTURE_KEYS = {
  TILES: {
    COFFEE: 'tile_coffee',
    WHEEL: 'tile_wheel',
    FUEL_CAN: 'tile_fuel_can',
    FUEL_2: 'tile_fuel_2',
    LIGHT: 'tile_light',
  },
  OBSTACLES: {
    BUBBLE: 'obstacle_bubble',
    ICE_01: 'obstacle_ice01',
    ICE_02: 'obstacle_ice02',
    ICE_03: 'obstacle_ice03',
    // ...
  },
  // ...
} as const;

// Boot.ts
this.load.image(TEXTURE_KEYS.TILES.COFFEE, 'coffee.png');

// TileSprite.ts
this.tileImage.setTexture(TEXTURE_KEYS.TILES.COFFEE);
```

**Warning signs:** Console errors "Texture [key] not found" or blank sprites at runtime.

### Pitfall 2: Particle Performance on Mobile

**What goes wrong:** Spawning hundreds of particles causes frame drops to <30fps on mobile devices.

**Why it happens:** Mobile GPUs have limited fill-rate. Each particle is a rendered quad. 500 particles = 500 draw calls or 500 quads in single batch (still expensive).

**How to avoid:**
1. Hard limit particles: `maxParticles: 50` in emitter config
2. Use small particle textures: 16x16 or 32x32 max
3. Reduce lifespan: 400-600ms is plenty for match pop
4. Lower quantity: 8-12 particles for match, 30 for bomb, 50 for win confetti
5. Use `reserve()` to preallocate particle pool on scene create

**Example:**
```typescript
const MATCH_POP_CONFIG = {
  // ... other config
  lifespan: 400,        // Short lifespan
  quantity: 8,          // Modest quantity
  maxParticles: 50,     // Hard cap
};

// Preallocate pool
this.matchParticles = this.add.particles(0, 0, 'particle', MATCH_POP_CONFIG);
this.matchParticles.reserve(50); // Allocate 50 particles upfront
```

**Warning signs:** FPS drops when multiple matches occur simultaneously, especially on older mobile devices.

**Source:** [Phaser 3 Mobile Performance Discussion](https://phaser.discourse.group/t/phaser-3-mobile-performance-ios-android/1435)

### Pitfall 3: Texture Size Limits

**What goes wrong:** Textures larger than device's max texture size fail to load or render as black squares.

**Why it happens:** Mobile GPUs have texture size limits: 2048x2048 on older devices, 4096x4096 on newer. WebGL `MAX_TEXTURE_SIZE` varies by device.

**How to avoid:**
1. Keep individual assets ≤ 1024x1024 (safe for all devices)
2. Check available assets: tiles are ~512x512, blockers are ~512x512, GUI elements vary
3. Use texture atlases for small assets (buttons, icons) but NOT needed for this demo (only 50 assets)
4. Check max size programmatically: `this.renderer.getMaxTextureSize()`

**Example:**
```typescript
// Boot.create() — log max texture size
console.log('[Boot] Max texture size:', this.renderer.getMaxTextureSize());
// Typical output: 4096 (desktop), 2048 (older mobile)
```

**For this project:** Available assets are all <2000x2000, so no issues expected. If generating new assets, keep under 1024x1024.

**Warning signs:** Black squares instead of sprites, console warnings about texture size.

**Source:** [Phaser Texture Documentation](https://docs.phaser.io/phaser/concepts/textures)

### Pitfall 4: Audio Playback on Mobile (Autoplay Restrictions)

**What goes wrong:** Sound effects don't play on mobile Safari or Chrome mobile until user interacts with page.

**Why it happens:** Browser autoplay policies require user gesture (tap, click) before any audio can play. This prevents annoying auto-playing ads.

**How to avoid:**
1. First sound must be triggered by user interaction (button click)
2. After first user interaction, all sounds work normally
3. Add "Unmute" button if needed (but not required for this demo)
4. Test on actual mobile devices (desktop dev tools don't reproduce this)

**Example:**
```typescript
// Menu.ts — Play button click
this.playButton.on('pointerup', () => {
  // This user interaction unlocks audio for entire session
  this.sound.play('sfx_match'); // Dummy sound to unlock (optional)
  this.scene.start('LevelSelect');
});
```

**For this project:** Play button in Menu scene provides required user interaction. Sounds in Game scene will work normally.

**Warning signs:** Sounds work on desktop but not on mobile. Console warnings "The AudioContext was not allowed to start."

**Source:** [Phaser Audio Notes](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/audio/)

### Pitfall 5: Memory Leaks from Undestroyed Tweens/Particles

**What goes wrong:** Game slows down over time as player replays levels. Memory usage increases until browser tab crashes.

**Why it happens:** Tweens and particles reference scene objects. If scene restarts without cleanup, old objects stay in memory.

**How to avoid:**
1. Phaser automatically cleans up scene objects on scene shutdown (if using `this.add.X()`)
2. Manually destroy objects created with `new`: `this.myCustomObject.destroy()`
3. For scene restarts (retry level), use `this.scene.restart()` not `this.scene.start('Game')`
4. Remove event listeners in `shutdown()` lifecycle method

**Example:**
```typescript
// Game.ts
shutdown(): void {
  // Phaser auto-cleans scene objects (tweens, particles, sprites)
  // But clean up custom event listeners:
  this.input.off('pointerdown');
  this.input.off('pointermove');
  this.input.off('pointerup');
}

// Win/Lose overlay — retry button
retryButton.on('pointerup', () => {
  this.scene.restart(); // Proper cleanup + restart
  // NOT: this.scene.start('Game', { levelId: this.currentLevel });
});
```

**Warning signs:** Memory usage increases in DevTools Memory Profiler on level restart. FPS degrades after 5-10 level replays.

**Source:** [Phaser Scene Lifecycle](https://docs.phaser.io/phaser/concepts/loader)

### Pitfall 6: Tile Mapping Confusion (5 Assets → 4 Types)

**What goes wrong:** Unclear which tile asset maps to which game tile type, leading to inconsistent visuals or logic errors.

**Why it happens:** User provided 5 tile PNGs (coffee, fuel_can, fuel-2, light, wheel) but game has 4 tile types (fuel, coffee, snack, road) from STYLE_GUIDE.md.

**How to avoid:**
1. Establish mapping early and document in constants
2. Use most semantically appropriate assets
3. Accept that some assets may not have perfect semantic match

**Recommended mapping:**
```typescript
// src/game/textureKeys.ts
export const TILE_TYPE_TO_TEXTURE: Record<TileType, string> = {
  'fuel': 'tile_fuel_can',    // Semantic match
  'coffee': 'tile_coffee',    // Semantic match
  'snack': 'tile_wheel',      // Wheel as "road trip item" (weak match)
  'road': 'tile_light',       // Light as "road/driving" (weak match)
};

// Unused: 'fuel-2' — could be variant, but not needed for 4-type game
```

**Alternative mapping:**
```typescript
// If wheel/light don't feel right, use fuel-2 as variant
export const TILE_TYPE_TO_TEXTURE: Record<TileType, string> = {
  'fuel': 'tile_fuel_can',
  'coffee': 'tile_coffee',
  'snack': 'tile_fuel_2',     // Fuel variant for snack (also weak)
  'road': 'tile_wheel',       // Wheel fits "road" theme better
};
// Unused: 'light'
```

**For this project:** Claude's discretion per CONTEXT.md. Recommend first mapping (fuel_can, coffee, wheel, light) as starting point. Planner should decide final mapping.

**Warning signs:** None — this is a planning decision, not a runtime error. But inconsistent visuals will confuse players if mapping is poor.

---

## Code Examples

### Example 1: Loading Assets in Boot Scene

```typescript
// src/scenes/Boot.ts (EXTENDED from current implementation)

preload(): void {
  const width = this.cameras.main.width;
  const height = this.cameras.main.height;

  // Create progress bar (already implemented)
  // ... existing progress bar code ...

  // Listen to loading progress (already implemented)
  // ... existing progress listeners ...

  // Load level JSON data (already implemented)
  this.load.setPath('data/levels/');
  this.load.json('level_001', 'level_001.json');
  this.load.json('level_002', 'level_002.json');
  this.load.json('level_003', 'level_003.json');
  this.load.json('level_004', 'level_004.json');
  this.load.json('level_005', 'level_005.json');

  // NEW: Load tile sprites
  this.load.setPath('assets/tiles/');
  this.load.image('tile_coffee', 'coffee.png');
  this.load.image('tile_wheel', 'wheel.png');
  this.load.image('tile_fuel_can', 'fuel_can.png');
  this.load.image('tile_fuel_2', 'fuel-2.png');
  this.load.image('tile_light', 'light.png');

  // NEW: Load obstacle sprites
  this.load.setPath('assets/blockers/');
  this.load.image('obstacle_bubble', 'bubble.png');
  this.load.image('obstacle_ice01', 'ice01.png');
  this.load.image('obstacle_ice02', 'ice02.png');
  this.load.image('obstacle_ice03', 'ice03.png');
  this.load.image('obstacle_grss01', 'grss01.png');
  this.load.image('obstacle_grss02', 'grss02.png');
  this.load.image('obstacle_grss03', 'grss03.png');

  // NEW: Load GUI elements (selective — only what's needed)
  this.load.setPath('assets/gui/');
  this.load.image('btn_orange', 'Button Orange.png');
  this.load.image('btn_yellow', 'Button Yellow.png');
  this.load.image('crown1', 'Crown 1.png');
  this.load.image('crown2', 'Crown 2.png');
  this.load.image('heart', 'Heart.png');
  this.load.image('goal_flag', 'Goal.png');
  this.load.image('map_pointer', 'map pointer.png');
  this.load.image('gold_lock', 'Gold Lock.png');

  // NEW: Load sound effects
  this.load.setPath('assets/sound/');
  this.load.audio('sfx_match', 'match.wav');
  this.load.audio('sfx_bomb', 'bomb.wav');
  this.load.audio('sfx_sphere', 'sphere.wav');
  this.load.audio('sfx_horizontal', 'horizontal.wav');
  this.load.audio('sfx_level_win', 'level_win.wav');
  this.load.audio('sfx_level_loose', 'level_loose.wav');
}
```

**Source:** Existing Boot.ts + [Phaser Loader Documentation](https://docs.phaser.io/phaser/concepts/loader)

### Example 2: Extending TileSprite to Use Image Assets

```typescript
// src/game/TileSprite.ts (MODIFIED)

import Phaser from 'phaser';
import { TILE_SIZE, TILE_GAP, TileType } from './constants';
import { BoosterType, ObstacleData } from './types';

const TILE_TYPE_TO_TEXTURE: Record<TileType, string> = {
  'fuel': 'tile_fuel_can',
  'coffee': 'tile_coffee',
  'snack': 'tile_wheel',
  'road': 'tile_light',
};

export class TileSprite extends Phaser.GameObjects.Container {
  // ... existing properties ...

  // NEW: Image sprite for tile texture
  private tileImage: Phaser.GameObjects.Image;

  // MODIFIED: Obstacle uses Image sprite instead of Graphics
  private obstacleImage?: Phaser.GameObjects.Image;

  constructor(
    scene: Phaser.Scene,
    row: number,
    col: number,
    type: TileType,
    offsetX: number = DEFAULT_OFFSET_X,
    offsetY: number = DEFAULT_OFFSET_Y
  ) {
    super(scene, 0, 0);

    this.row = row;
    this.col = col;
    this.type = type;
    this.offsetX = offsetX;
    this.offsetY = offsetY;

    // Create image sprite for tile
    this.tileImage = scene.add.image(0, 0, this.getTextureKey());
    this.tileImage.setDisplaySize(TILE_SIZE - TILE_GAP, TILE_SIZE - TILE_GAP);
    this.add(this.tileImage);

    // Create graphics for booster overlay (still programmatic)
    this.boosterGraphics = scene.add.graphics();
    this.add(this.boosterGraphics);

    // Calculate initial position and draw
    this.updatePosition();

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Get texture key for current tile type.
   */
  private getTextureKey(): string {
    return TILE_TYPE_TO_TEXTURE[this.type];
  }

  /**
   * Update tile type and change texture.
   */
  public setType(type: TileType): void {
    this.type = type;
    this.tileImage.setTexture(this.getTextureKey());
  }

  /**
   * Set obstacle data and display obstacle sprite.
   */
  public setObstacle(obstacle?: ObstacleData): void {
    this.obstacleData = obstacle;

    // Remove old obstacle image
    if (this.obstacleImage) {
      this.obstacleImage.destroy();
      this.obstacleImage = undefined;
    }

    if (!obstacle) return;

    // Create obstacle image overlay
    const textureKey = this.getObstacleTextureKey(obstacle);
    if (textureKey) {
      this.obstacleImage = this.scene.add.image(0, 0, textureKey);
      this.obstacleImage.setDisplaySize(TILE_SIZE - TILE_GAP, TILE_SIZE - TILE_GAP);
      this.obstacleImage.setAlpha(0.9); // Slight transparency to see tile underneath
      this.add(this.obstacleImage);
    }

    // Update layer count text if multi-layer
    this.updateLayerCountText();
  }

  /**
   * Get texture key for obstacle type and layer count.
   */
  private getObstacleTextureKey(obstacle: ObstacleData): string | null {
    switch (obstacle.type) {
      case 'ice':
        // Map layer count to texture: 3 layers = ice01, 2 = ice02, 1 = ice03
        if (obstacle.layers >= 3) return 'obstacle_ice01';
        if (obstacle.layers === 2) return 'obstacle_ice02';
        return 'obstacle_ice03';

      case 'dirt':
        // Map layer count to texture: 3 layers = grss01, 2 = grss02, 1 = grss03
        if (obstacle.layers >= 3) return 'obstacle_grss01';
        if (obstacle.layers === 2) return 'obstacle_grss02';
        return 'obstacle_grss03';

      case 'blocked':
        // No specific asset — use programmatic drawing (Graphics)
        // OR use bubble.png as fallback
        return 'obstacle_bubble';

      case 'crate':
        // No specific asset — use programmatic drawing or bubble as placeholder
        return null; // Will draw programmatically in drawObstacle()

      default:
        return null;
    }
  }

  /**
   * Update layer count text for multi-layer obstacles.
   */
  private updateLayerCountText(): void {
    if (this.layerCountText) {
      this.layerCountText.destroy();
      this.layerCountText = undefined;
    }

    if (this.obstacleData && this.obstacleData.layers > 1) {
      const halfSize = (TILE_SIZE - TILE_GAP) / 2;
      this.layerCountText = this.scene.add.text(
        halfSize - 15,
        halfSize - 15,
        String(this.obstacleData.layers),
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          color: '#ffffff',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3,
        }
      );
      this.add(this.layerCountText);
    }
  }

  /**
   * Set selected state with scale animation.
   */
  public setSelected(selected: boolean): void {
    this.selected = selected;

    // Animate selection with tween
    if (selected) {
      this.scene.tweens.add({
        targets: this,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 100,
        ease: 'Back.Out',
      });
    } else {
      this.scene.tweens.add({
        targets: this,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 100,
        ease: 'Back.In',
      });
    }
  }

  /**
   * Reset tile for object pooling reuse.
   */
  public reset(type: TileType, row: number, col: number): void {
    this.type = type;
    this.row = row;
    this.col = col;
    this.selected = false;
    this.boosterType = undefined;
    this.obstacleData = undefined;
    this.setScale(1.0);

    // Update texture
    this.tileImage.setTexture(this.getTextureKey());

    // Clear booster graphics
    this.boosterGraphics.clear();

    // Remove obstacle image
    if (this.obstacleImage) {
      this.obstacleImage.destroy();
      this.obstacleImage = undefined;
    }

    // Remove layer count text
    if (this.layerCountText) {
      this.layerCountText.destroy();
      this.layerCountText = undefined;
    }

    this.updatePosition();
  }

  // ... rest of existing methods (drawBooster, updatePosition, etc.)
}
```

**Source:** Existing TileSprite.ts + [Phaser Image Documentation](https://docs.phaser.io/phaser/concepts/textures)

### Example 3: Particle System for Match Effects

```typescript
// src/game/VFXManager.ts (NEW FILE)

import Phaser from 'phaser';

export class VFXManager {
  private scene: Phaser.Scene;

  // Particle emitters (pooled, reusable)
  private matchParticles: Phaser.GameObjects.ParticleEmitter;
  private bombParticles: Phaser.GameObjects.ParticleEmitter;
  private confettiParticles: Phaser.GameObjects.ParticleEmitter;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createParticleSystems();
  }

  private createParticleSystems(): void {
    // Create particle texture programmatically (small circle)
    const particleGraphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
    particleGraphics.fillStyle(0xFFFFFF);
    particleGraphics.fillCircle(8, 8, 8);
    particleGraphics.generateTexture('particle_circle', 16, 16);
    particleGraphics.destroy();

    // Create square particle for confetti
    const squareGraphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
    squareGraphics.fillStyle(0xFFFFFF);
    squareGraphics.fillRect(0, 0, 12, 12);
    squareGraphics.generateTexture('particle_square', 12, 12);
    squareGraphics.destroy();

    // Match pop particles (subtle, organic)
    this.matchParticles = this.scene.add.particles(0, 0, 'particle_circle', {
      speed: { min: 100, max: 200 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 400,
      gravityY: 300,
      quantity: 10,
      maxParticles: 50,
      tint: [0xFFD700, 0xFFB800, 0xFFA500], // Yellow/orange KLO colors
    });
    this.matchParticles.stop();

    // Bomb explosion particles (dramatic)
    this.bombParticles = this.scene.add.particles(0, 0, 'particle_circle', {
      speed: { min: 200, max: 400 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      quantity: 30,
      maxParticles: 50,
      tint: [0xFF6600, 0xFFAA00, 0xFFFFFF], // Orange/white explosion
    });
    this.bombParticles.stop();

    // Confetti particles (celebration)
    this.confettiParticles = this.scene.add.particles(0, 0, 'particle_square', {
      speed: { min: 300, max: 500 },
      scale: { start: 1, end: 0.5 },
      alpha: { start: 1, end: 0.7 },
      gravityY: 500,
      lifespan: 2000,
      quantity: 50,
      maxParticles: 100,
      angle: { min: 265, max: 275 }, // Mostly upward
      rotate: { min: 0, max: 360 },
      tint: [0xFFD700, 0xFF69B4, 0x00D4FF, 0x00FF88, 0xAA00FF], // Rainbow
    });
    this.confettiParticles.stop();
  }

  /**
   * Play match pop effect at position.
   */
  playMatchPop(x: number, y: number): void {
    this.matchParticles.setPosition(x, y);
    this.matchParticles.explode(10);
  }

  /**
   * Play bomb explosion at position.
   */
  playBombExplosion(x: number, y: number): void {
    this.bombParticles.setPosition(x, y);
    this.bombParticles.explode(30);
  }

  /**
   * Play confetti burst (for win screen).
   */
  playConfetti(x: number, y: number): void {
    this.confettiParticles.setPosition(x, y);
    this.confettiParticles.explode(50);
  }

  /**
   * Clean up particle systems.
   */
  destroy(): void {
    this.matchParticles.destroy();
    this.bombParticles.destroy();
    this.confettiParticles.destroy();
  }
}

// Usage in Game.ts:
// In create():
this.vfxManager = new VFXManager(this);

// On match:
this.vfxManager.playMatchPop(tileX, tileY);
this.audioManager.playMatch();

// On bomb activation:
this.vfxManager.playBombExplosion(tileX, tileY);
this.audioManager.playBomb();

// On win:
this.vfxManager.playConfetti(centerX, centerY);
this.audioManager.playLevelWin();
```

**Source:** [Phaser Particles Documentation](https://docs.phaser.io/phaser/concepts/gameobjects/particles)

### Example 4: Win Screen with Star Animation

```typescript
// src/scenes/Game.ts (ADD METHOD)

/**
 * Show win overlay with animated stars and confetti.
 */
private showWinOverlay(stars: number, score: number): void {
  const width = this.cameras.main.width;
  const height = this.cameras.main.height;

  // Dim background
  const dimRect = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);

  // Create card container (starts above screen)
  const card = this.add.container(width / 2, -300);

  // Card background (rounded white rectangle)
  const cardBg = this.add.graphics();
  cardBg.fillStyle(0xF9F9F9, 1);
  cardBg.fillRoundedRect(-200, -250, 400, 500, 20);
  card.add(cardBg);

  // "Victory!" title
  const title = this.add.text(0, -180, 'ПЕРЕМОГА!', {
    fontFamily: 'Arial, sans-serif',
    fontSize: '48px',
    color: '#1A1A1A',
    fontStyle: 'bold',
  }).setOrigin(0.5);
  card.add(title);

  // Stars container (3 crown images)
  const starSpacing = 80;
  const starY = -60;
  const starImages: Phaser.GameObjects.Image[] = [];

  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * starSpacing;
    const starImg = this.add.image(x, starY, i < stars ? 'crown2' : 'crown1');
    starImg.setDisplaySize(60, 60);
    starImg.setScale(0); // Start invisible
    starImg.setAlpha(0);
    card.add(starImg);
    starImages.push(starImg);
  }

  // Score text
  const scoreText = this.add.text(0, 60, '0', {
    fontFamily: 'Arial, sans-serif',
    fontSize: '64px',
    color: '#FFB800',
    fontStyle: 'bold',
  }).setOrigin(0.5);
  card.add(scoreText);

  const scoreLabel = this.add.text(0, 120, 'Очки', {
    fontFamily: 'Arial, sans-serif',
    fontSize: '24px',
    color: '#666666',
  }).setOrigin(0.5);
  card.add(scoreLabel);

  // Buttons
  const retryBtn = this.createButton(0, 200, 'СПРОБУВАТИ ЩЕ', 0xCCCCCC);
  card.add(retryBtn);
  retryBtn.on('pointerup', () => {
    this.scene.restart();
  });

  // Slide card in from top
  this.tweens.add({
    targets: card,
    y: height / 2,
    duration: 500,
    ease: 'Back.Out',
    onComplete: () => {
      // Animate stars in sequence
      this.animateStarsIn(starImages, stars);

      // Confetti burst
      this.time.delayedCall(300, () => {
        this.vfxManager.playConfetti(width / 2, height / 3);
      });

      // Score counter roll-up
      this.time.delayedCall(800, () => {
        this.tweens.addCounter({
          from: 0,
          to: score,
          duration: 1500,
          ease: 'Cubic.Out',
          onUpdate: (tween) => {
            const value = Math.floor(tween.getValue());
            scoreText.setText(String(value));
          },
        });
      });
    },
  });

  // Play win sound
  this.audioManager.playLevelWin();
}

/**
 * Animate stars in with staggered elastic bounce.
 */
private animateStarsIn(starImages: Phaser.GameObjects.Image[], earnedStars: number): void {
  starImages.forEach((star, i) => {
    this.tweens.add({
      targets: star,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 500,
      delay: i * 150, // Stagger by 150ms
      ease: 'Elastic.Out',
    });
  });
}

/**
 * Helper: Create button container.
 */
private createButton(x: number, y: number, label: string, color: number): Phaser.GameObjects.Container {
  const btn = this.add.container(x, y);

  const bg = this.add.graphics();
  bg.fillStyle(color, 1);
  bg.fillRoundedRect(-100, -25, 200, 50, 12);
  btn.add(bg);

  const text = this.add.text(0, 0, label, {
    fontFamily: 'Arial, sans-serif',
    fontSize: '20px',
    color: '#1A1A1A',
    fontStyle: 'bold',
  }).setOrigin(0.5);
  btn.add(text);

  btn.setSize(200, 50);
  btn.setInteractive({ useHandCursor: true });

  btn.on('pointerover', () => btn.setScale(1.05));
  btn.on('pointerout', () => btn.setScale(1));
  btn.on('pointerdown', () => btn.setScale(0.95));
  btn.on('pointerup', () => btn.setScale(1.05));

  return btn;
}
```

**Source:** Phaser Tween examples + existing win/lose overlay patterns

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Phaser 2 Particle Storm plugin | Built-in ParticleEmitter in Phaser 3 | Phaser 3.0 (2018) | No external plugin needed, better performance, simpler API |
| Manual tween easing calculations | Built-in easing library (Bounce, Elastic, Back, etc.) | Phaser 3.0 (2018) | Cleaner code, consistent easing curves |
| Separate texture atlases required | Individual images fine for small games | Always valid | For 50 assets, individual PNGs are simpler than atlas creation |
| `this.load.start()` manual call | Automatic loader start in preload() | Phaser 3.0 (2018) | Less boilerplate, fewer errors |
| Global sound manager pattern | Per-scene sound manager | Phaser 3.0 (2018) | Sounds auto-cleanup on scene shutdown |

**Current best practices (2025-2026):**
- **Asset loading:** Preload all assets in Boot scene for small games (<100MB)
- **Particle systems:** Use built-in ParticleEmitter, hard limit quantities for mobile
- **Animations:** Tween system with easing functions (not manual interpolation)
- **Scene transitions:** Camera fade effects + Container tweens for overlays
- **Audio:** Scene-local sound playback, check autoplay restrictions on mobile
- **Performance:** Test on real mobile devices, use FPS counter, limit particles

**Deprecated/outdated:**
- Texture atlases for small games (overhead not worth it for <50 assets)
- Phaser 2 plugins (Particle Storm, State Transition) — built into Phaser 3
- Manual easing math — use built-in easing functions
- Global texture cache clearing — Phaser 3 auto-manages memory better

---

## Open Questions

### 1. Exact tile-to-type mapping

**What we know:** 5 tile PNGs available (coffee, fuel_can, fuel-2, light, wheel), 4 game types needed (fuel, coffee, snack, road).

**What's unclear:** Which asset maps to which type? Semantic vs. visual preference?

**Recommendation:**
- OPTION A: `fuel=fuel_can, coffee=coffee, snack=wheel, road=light`
- OPTION B: `fuel=fuel_can, coffee=coffee, snack=fuel_2, road=wheel`

Planner should choose based on visual coherence. Either works technically.

### 2. Crate and blocked cell visuals

**What we know:** No specific PNGs for crate or blocked cell in `assets/blockers/`. Only bubble, ice (3 stages), grass (3 stages).

**What's unclear:** Should crates use programmatic drawing (existing Graphics code) or repurpose bubble.png?

**Recommendation:** Keep existing programmatic drawing for crates (brown border + cross lines). Use bubble.png for blocked cells (better than red X on dark gray). This preserves visual distinction between obstacle types.

### 3. Level select "mini road map" implementation

**What we know:** User wants "mini road map with 5 checkpoint buttons along a short path, KLO-themed decor".

**What's unclear:** Should this use `map pointer.png` asset? Should path be drawn programmatically or use image asset?

**Recommendation:**
- Draw path with Graphics (curved line)
- Use existing circular button containers for level checkpoints
- Add `map pointer.png` on current level
- Add small decorative elements (programmatic trees, KLO logo)
- This creates "premium feel" without requiring new assets

### 4. Menu background animation details

**What we know:** "Animated title screen — KLO logo with subtle animation (glow, floating tiles in background)".

**What's unclear:** Should floating tiles use actual tile sprites or decorative shapes? Should glow be particle effect or tween alpha?

**Recommendation:**
- Glow: Tween alpha + scale on "KLO Match-3" title text (0.9 to 1.1 scale, 0.8 to 1.0 alpha, 2 seconds loop)
- Floating tiles: 3-5 tile Image sprites in background, gentle float with tween (moveY by ±20px, 3-5 seconds, staggered)
- Simple, premium feel without heavy particle usage on menu

---

## Sources

### Primary (HIGH confidence)

- [Phaser Particles Documentation](https://docs.phaser.io/phaser/concepts/gameobjects/particles) — Particle system capabilities
- [Phaser Textures Documentation](https://docs.phaser.io/phaser/concepts/textures) — Texture/sprite management
- [Phaser Loader Documentation](https://docs.phaser.io/phaser/concepts/loader) — Asset preloading
- [Phaser 3 Rex Notes - Particles](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/particles/) — Particle configuration examples
- [Phaser 3 Rex Notes - Tween](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/tween/) — Tween system examples
- [Phaser 3 Rex Notes - Ease Functions](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/ease-function/) — Easing function reference
- [Phaser 3 Rex Notes - Audio](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/audio/) — Audio manager patterns

### Secondary (MEDIUM confidence)

- [MDN: Animations and Tweens (Phaser)](https://developer.mozilla.org/en-US/docs/Games/Tutorials/2D_breakout_game_Phaser/Animations_and_tweens) — Tween basics
- [Ourcade: Scene Transition with Fade](https://blog.ourcade.co/posts/2020/phaser-3-fade-out-scene-transition/) — Camera fade pattern
- [Ourcade: Particle Trail Effect](https://blog.ourcade.co/posts/2020/how-to-make-particle-trail-effect-phaser-3/) — Particle animation technique
- [Medium: Working with Texture Atlases](https://airum82.medium.com/working-with-texture-atlases-in-phaser-3-25c4df9a747a) — Atlas loading (not needed but reference)
- [GitHub: Phaser 3 Transitions Plugin](https://github.com/JHAvrick/phaser3-transitions) — Scene transition examples

### Tertiary (LOW confidence — community discussions)

- [Phaser Discourse: Mobile Performance](https://phaser.discourse.group/t/phaser-3-mobile-performance-ios-android/1435) — Performance discussion (2018, some outdated info)
- [Phaser Discourse: Best Way to Increase Performance](https://phaser.discourse.group/t/best-way-to-increase-performance-in-general/5948) — Performance tips (mixed quality)
- [GitHub Gist: Tips on Speeding Up Phaser Games](https://gist.github.com/MarcL/748f29faecc6e3aa679a385bffbdf6fe) — Performance checklist (Phaser 2 era, some still relevant)

---

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — Phaser 3 built-in systems verified with official docs
- Architecture patterns: **HIGH** — Patterns verified with official docs and existing codebase
- Asset integration: **HIGH** — Asset files confirmed present, Phaser texture loading is standard
- Animation/VFX: **HIGH** — Particle/tween systems documented, examples from official sources
- Mobile performance: **MEDIUM** — General best practices verified, but no device-specific testing yet
- Tile mapping decision: **MEDIUM** — Claude's discretion, visual quality not verifiable without seeing actual PNGs

**Research date:** 2026-02-09
**Valid until:** 2026-03-09 (30 days — Phaser 3 API stable, mobile browser policies stable)

**Assets confirmed present:**
- ✅ 5 tile PNGs: coffee, wheel, fuel_can, fuel-2, light
- ✅ 7 obstacle PNGs: bubble, ice01-03, grss01-03
- ✅ 50+ GUI PNGs: buttons (multiple colors), crowns, hearts, progress bars, etc.
- ✅ 7 sound effects: match, bomb, sphere, horizontal, level_win, level_loose

**Technical environment:**
- Phaser 3.90.0 (current stable)
- TypeScript
- Existing codebase: Boot → Menu → LevelSelect → Game → Win/Lose flow
- TileSprite class using Graphics (to be extended for Image sprites)
- ProgressManager, AudioManager patterns partially implemented
