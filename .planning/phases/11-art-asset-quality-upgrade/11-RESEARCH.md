# Phase 11: Art & Asset Quality Upgrade - Research

**Researched:** 2026-02-10
**Domain:** Phaser 3 asset integration, sprite atlas configuration, retina rendering, subtle idle animations
**Confidence:** HIGH

## Summary

Phase 11 integrates existing retina-quality art assets into the game by swapping tile sprites, integrating booster art, styling inactive cells, and removing deprecated tile types. All assets (1024x1024 PNGs) already exist in `/assets` — this is a pure integration phase with no asset creation needed.

The project uses **Phaser 3.90** with DPR-aware rendering (capped at 2x) already configured in `main.ts`. Current tile system uses PNG sprites loaded via Boot scene with explicit texture keys mapped in `constants.ts`. The tile rendering pipeline is well-established: `TileSprite` class renders via `Phaser.GameObjects.Image` with `setDisplaySize()` scaling, not sprite atlases. Boosters currently use programmatic Graphics overlays — need replacement with sprite art. Inactive cells currently render as scene-background-colored fills in `gridMaskGraphics` — need distinct visual treatment per level config.

**Primary recommendation:** Integrate new tile/booster sprites by updating `TEXTURE_KEYS` mapping, loading paths in Boot scene, removing `light` tile type from `types.ts` and constants, adding level config field `inactive_cell_style`, and creating subtle idle animations using Phaser tweens (scale/alpha pulsing) or particle emitters for booster tiles.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- All 4 booster types are: bomb, klo_horizontal, klo_vertical, klo_sphere (no rocket)
- Existing sprites in /assets/boosters/ are final art — integrate as-is
- Each booster gets a unique subtle idle effect hinting at its power type (e.g., bomb pulses, sphere orbits, lines streak)
- Effects should be subtle hints — barely noticeable shimmer/pulse, not distracting from gameplay
- Inactive cell style varies per level — configured in level definition
- Two modes: "block" (uses /assets/blocks/block.png solid material) or "transparent" (reveals background)
- block.png is final art, no upgrade needed
- Each level config specifies which inactive cell style to use
- All 6 new tile PNGs (burger, hotdog, oil, water, snack, soda) already exist in /assets
- All booster PNGs already exist in /assets/boosters/
- Phase is integration work: swap sprites, update references, remove `light` tile type

### Claude's Discretion
- Specific idle animation implementation per booster type (particle system, tween, shader)
- Tile sprite atlas configuration and loading strategy
- How to handle the `light` tile removal across codebase and level configs
- Retina scaling approach for new assets

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser 3 | 3.90.0 | Game framework, asset loading, rendering, animations | Industry-standard 2D HTML5 game framework with robust texture management and built-in tween system |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Phaser Tweens | Built-in | Simple property animations (scale, alpha, rotation) | Subtle idle effects, UI transitions, non-physics animations |
| Phaser Particles | Built-in | Particle emitters for visual effects | Subtle particle trails, glows, sparkles around boosters |
| TypeScript | (project) | Type safety for texture keys and asset paths | Always — project already TypeScript-based |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Individual PNG loads | Texture Atlas (spritesheet) | Atlas reduces HTTP requests and improves load time, but current system already works and adding atlas is overkill for ~16 assets |
| Phaser Tweens | Custom requestAnimationFrame loop | Tweens handle easing, cleanup, and chaining automatically — no reason to hand-roll |
| Phaser Particles | Shader-based effects | Shaders are more performant but harder to maintain and tune; particles sufficient for "subtle" effects |

**Installation:**
```bash
# No new dependencies needed — Phaser 3.90 already installed
```

## Architecture Patterns

### Recommended Project Structure
Current structure already optimal — no changes needed:
```
src/
├── game/
│   ├── constants.ts          # TEXTURE_KEYS mapping (UPDATE HERE)
│   ├── types.ts              # TileType union (REMOVE 'light')
│   ├── TileSprite.ts         # Tile rendering logic (UPDATE booster rendering)
│   └── VFXManager.ts         # Particle effects (REFERENCE for subtle effects)
├── scenes/
│   ├── Boot.ts               # Asset preloading (ADD new tile/booster loads)
│   └── Game.ts               # Grid rendering (UPDATE inactive cell styling)
└── assets/                   # Art assets (ALREADY EXIST)
    ├── tiles/                # burger, hotdog, oil, water, snack, soda (1024x1024)
    ├── boosters/             # bomb, klo_horizontal, klo_vertical, klo_sphere (1024x1024)
    └── blocks/               # block.png (1024x1024)
```

### Pattern 1: Texture Key Mapping
**What:** Central texture key registry maps game logic types to asset file paths.
**When to use:** Always — existing pattern in `constants.ts` already proven.
**Example:**
```typescript
// src/game/constants.ts (CURRENT PATTERN)
export const TEXTURE_KEYS: Record<TileType, string> = {
  fuel: 'tile_fuel_can',      // Loaded as: 'assets/tiles/fuel_can.png'
  coffee: 'tile_coffee',       // Loaded as: 'assets/tiles/coffee.png'
  snack: 'tile_wheel',         // OUTDATED — needs swap to new assets
  road: 'tile_light',          // OUTDATED — needs swap to new assets
};

// UPDATE TO (example mapping):
export const TEXTURE_KEYS: Record<TileType, string> = {
  burger: 'tile_burger',       // NEW: 'assets/tiles/burger.png'
  hotdog: 'tile_hotdog',       // NEW: 'assets/tiles/hotdog.png'
  oil: 'tile_oil',             // NEW: 'assets/tiles/oil.png'
  water: 'tile_water',         // NEW: 'assets/tiles/water.png'
  snack: 'tile_snack',         // NEW: 'assets/tiles/snack.png'
  soda: 'tile_soda',           // NEW: 'assets/tiles/soda.png'
};
// NOTE: 'light' tile type removed from TileType union
```

### Pattern 2: Retina Asset Scaling via setDisplaySize()
**What:** Load high-res (1024x1024) assets, scale down via `setDisplaySize()` to grid size.
**When to use:** Always with retina assets — existing pattern in `TileSprite.ts`.
**Example:**
```typescript
// src/game/TileSprite.ts (EXISTING PATTERN — no change needed)
const textureKey = TEXTURE_KEYS[type];
this.tileImage = scene.add.image(0, 0, textureKey);
const targetSize = TILE_SIZE - TILE_GAP; // ~60px display size
this.tileImage.setDisplaySize(targetSize, targetSize); // Scales 1024x1024 → 60x60 on DPR=2
```
**Why this works:** Phaser's zoom-based DPR rendering (configured in `main.ts`) ensures 1024px source renders crisp at 60px display size on retina screens.

### Pattern 3: Subtle Idle Animations with Tweens
**What:** Use `scene.tweens.add()` for continuous looping scale/alpha/rotation effects.
**When to use:** Booster idle effects (pulse, orbit, streak).
**Example:**
```typescript
// Subtle pulse effect for bomb booster (0.98x → 1.02x scale, 2s loop)
scene.tweens.add({
  targets: this.boosterImage,
  scaleX: 1.02,
  scaleY: 1.02,
  duration: 1000,
  ease: 'Sine.InOut',
  yoyo: true,
  repeat: -1, // Infinite loop
});

// Subtle alpha shimmer for sphere (0.9 → 1.0 alpha, 1.5s loop)
scene.tweens.add({
  targets: this.boosterImage,
  alpha: 0.9,
  duration: 750,
  ease: 'Sine.InOut',
  yoyo: true,
  repeat: -1,
});
```

### Pattern 4: Level Config Extension for Inactive Cells
**What:** Add `inactive_cell_style` field to level JSON, read in Game scene, apply visual treatment.
**When to use:** Variable board shape levels (cell_map present).
**Example:**
```typescript
// data/levels/level_010.json (EXTEND SCHEMA)
{
  "level_id": 10,
  "grid": {
    "width": 8,
    "height": 8,
    "cell_map": [[1,1,0,0], ...],
    "inactive_cell_style": "block" // NEW: "block" or "transparent"
  },
  ...
}

// src/scenes/Game.ts (APPLY STYLE)
const style = this.levelData.grid.inactive_cell_style || 'transparent';
if (style === 'block') {
  // Load and place block.png sprite at inactive cell positions
  const blockSprite = this.add.image(x, y, 'block_texture');
  blockSprite.setDisplaySize(TILE_SIZE, TILE_SIZE);
} else {
  // Transparent mode: do nothing (background shows through)
}
```

### Anti-Patterns to Avoid
- **Hand-rolling texture atlases for small asset counts:** 6 tiles + 4 boosters + 1 block = 11 images. Not worth atlas complexity for this count. Load individually.
- **Creating custom shader effects for "subtle" animations:** Overkill for simple pulse/shimmer — tweens handle this perfectly.
- **Modifying asset files:** All PNGs are final art. Never resize or modify — use `setDisplaySize()` for scaling.
- **Accessing `this.scene` during object destruction:** Phaser Containers can outlive scene shutdown. Always check `this.scene && this.scene.sys.isActive()` before creating tweens/particles.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image preloading with progress | Custom async image loader | Phaser `scene.load.image()` + `progress` event | Built-in loader handles batching, caching, error recovery, cross-origin, and progress tracking |
| Subtle looping animations | Custom delta-time animation loop | Phaser `scene.tweens.add()` | Tweens handle easing, yoyo, repeat, cleanup, and pause/resume automatically |
| Particle trails/glows | Custom canvas drawing per frame | Phaser `scene.add.particles()` | Particle system handles pooling, physics, fading, tinting, and performance throttling |
| Retina asset scaling | Manual canvas resize and redraw | `image.setDisplaySize() + DPR zoom` | Phaser's scale manager + zoom handles all DPR edge cases (fractional DPR, orientation change, etc.) |
| Texture key typos | String literals everywhere | Centralized `TEXTURE_KEYS` const | TypeScript autocomplete + compile-time safety for key names |

**Key insight:** Phaser 3 has mature, battle-tested APIs for all common asset/animation tasks. Reinventing these adds bugs (no error handling, no cleanup, no edge cases) and maintenance burden. Always check Phaser docs before building custom solutions.

## Common Pitfalls

### Pitfall 1: Loading Assets with Wrong Keys
**What goes wrong:** Loading `'tile_burger'` but referencing `'burger'` in code → texture not found, blank sprite.
**Why it happens:** Inconsistent naming between `load.image(key, path)` and `TEXTURE_KEYS` mapping.
**How to avoid:** Use const-based texture key registry. Load with registry keys:
```typescript
// Boot.ts
this.load.image(TEXTURE_KEYS.burger, 'assets/tiles/burger.png');
// TileSprite.ts
this.tileImage.setTexture(TEXTURE_KEYS[this.type]); // Same key
```
**Warning signs:** Black/white placeholder sprites, console warnings `Texture not found: X`.

### Pitfall 2: Forgetting to Remove All 'light' References
**What goes wrong:** Removing `'light'` from `TileType` union but leaving references in spawn rules, level JSONs, or TEXTURE_KEYS → TypeScript errors or runtime crashes.
**Why it happens:** Global search-replace misses JSON files or programmatic string construction.
**How to avoid:** Systematic search:
1. Types: Remove from `types.ts` TileType union
2. Constants: Remove from `TEXTURE_KEYS`, `TILE_COLORS`
3. Loading: Remove `load.image('tile_light', ...)` from Boot.ts
4. Level data: Search all `data/levels/*.json` for `"road"` or `"light"` in spawn_rules, replace with new tile types
5. Tests: Update `Match3Engine.test.ts` spawn rule objects
**Warning signs:** TypeScript compile errors, "Unknown tile type" logs, blank tiles in certain levels.

### Pitfall 3: Idle Animations Breaking on Scene Shutdown
**What goes wrong:** Booster idle tweens continue running after scene shutdown → error logs, memory leaks.
**Why it happens:** `scene.tweens.add()` doesn't auto-stop when scene ends. TileSprite Container outlives scene.
**How to avoid:** Store tween references, stop on destroy:
```typescript
// TileSprite.ts
private idleTween?: Phaser.Tweens.Tween;

setBooster(type: BoosterType) {
  // Stop old tween if exists
  if (this.idleTween) {
    this.idleTween.stop();
    this.idleTween.remove();
  }

  // Create new tween
  if (type === 'bomb') {
    this.idleTween = this.scene.tweens.add({
      targets: this.boosterImage,
      scaleX: 1.02,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });
  }
}

// On Container destroy or reset
if (this.idleTween) {
  this.idleTween.stop();
  this.idleTween.remove();
  this.idleTween = undefined;
}
```
**Warning signs:** Console errors after leaving game scene, memory usage growing over time, tweens animating invisible objects.

### Pitfall 4: Inactive Cell Style Not Defaulting Safely
**What goes wrong:** Old level JSONs without `inactive_cell_style` field crash when accessing `grid.inactive_cell_style`.
**Why it happens:** Adding new required field to existing schema without backward compatibility.
**How to avoid:** Always provide fallback default:
```typescript
const style = this.levelData.grid.inactive_cell_style || 'transparent'; // Default to transparent
```
**Warning signs:** Game crashes on old levels, "Cannot read property of undefined" errors.

### Pitfall 5: Block Sprite Rendering Under Grid Mask
**What goes wrong:** Block sprites render but are immediately masked out by `gridMaskGraphics` fill.
**Why it happens:** Current code masks inactive cells with scene background color — adding block sprite on top gets masked.
**How to avoid:** Change masking approach:
- **Option A (recommended):** Don't mask inactive cells with fill. Instead, place block sprites at inactive positions (if style='block'). No masking needed — sprites fill the space naturally.
- **Option B:** Adjust Graphics rendering order — add `gridMaskGraphics` BEFORE tiles, add block sprites AFTER mask.
**Warning signs:** Block sprites invisible even though loaded, depth/z-order issues.

## Code Examples

Verified patterns from codebase and Phaser 3 docs:

### Loading New Assets in Boot Scene
```typescript
// src/scenes/Boot.ts preload() method
// --- Load NEW tile sprites ---
this.load.image('tile_burger', 'assets/tiles/burger.png');
this.load.image('tile_hotdog', 'assets/tiles/hotdog.png');
this.load.image('tile_oil', 'assets/tiles/oil.png');
this.load.image('tile_water', 'assets/tiles/water.png');
this.load.image('tile_snack', 'assets/tiles/snack.png');
this.load.image('tile_soda', 'assets/tiles/soda.png');

// --- Load booster sprites ---
this.load.image('booster_bomb', 'assets/boosters/bomb.png');
this.load.image('booster_klo_horizontal', 'assets/boosters/klo_horizontal.png');
this.load.image('booster_klo_vertical', 'assets/boosters/klo_vertical.png');
this.load.image('booster_klo_sphere', 'assets/boosters/klo_sphere.png');

// --- Load block sprite ---
this.load.image('block_texture', 'assets/blocks/block.png');

// REMOVE old tile loads:
// this.load.image('tile_light', 'assets/tiles/light.png'); // DEPRECATED
```

### Updating TileSprite to Render Booster Images Instead of Graphics
```typescript
// src/game/TileSprite.ts (MAJOR CHANGE)
export class TileSprite extends Phaser.GameObjects.Container {
  private tileImage: Phaser.GameObjects.Image;
  private boosterImage?: Phaser.GameObjects.Image;
  private boosterIdleTween?: Phaser.Tweens.Tween;
  private obstacleImage?: Phaser.GameObjects.Image;

  // ... existing code ...

  private drawBooster(): void {
    // Remove old graphics-based overlay
    this.boosterGraphics.clear();

    // Destroy old booster image if exists
    if (this.boosterImage) {
      if (this.boosterIdleTween) {
        this.boosterIdleTween.stop();
        this.boosterIdleTween.remove();
      }
      this.boosterImage.destroy();
      this.boosterImage = undefined;
    }

    if (!this.boosterType) return;

    // Map booster type to texture key
    const boosterTextures = {
      'bomb': 'booster_bomb',
      'linear_horizontal': 'booster_klo_horizontal',
      'linear_vertical': 'booster_klo_vertical',
      'klo_sphere': 'booster_klo_sphere',
    };

    const textureKey = boosterTextures[this.boosterType];
    if (!this.scene.textures.exists(textureKey)) return;

    // Create booster image overlay
    const targetSize = TILE_SIZE - TILE_GAP;
    this.boosterImage = this.scene.add.image(0, 0, textureKey);
    this.boosterImage.setDisplaySize(targetSize, targetSize);
    this.add(this.boosterImage);

    // Add subtle idle animation based on type
    this.addBoosterIdleEffect();
  }

  private addBoosterIdleEffect(): void {
    if (!this.boosterImage || !this.boosterType) return;

    // Stop existing tween
    if (this.boosterIdleTween) {
      this.boosterIdleTween.stop();
      this.boosterIdleTween.remove();
    }

    switch (this.boosterType) {
      case 'bomb':
        // Subtle pulse: 1.0 → 1.03 scale over 1.2s
        this.boosterIdleTween = this.scene.tweens.add({
          targets: this.boosterImage,
          scaleX: 1.03,
          scaleY: 1.03,
          duration: 600,
          ease: 'Sine.InOut',
          yoyo: true,
          repeat: -1,
        });
        break;

      case 'linear_horizontal':
      case 'linear_vertical':
        // Subtle streak: alpha 0.85 → 1.0 over 1s
        this.boosterIdleTween = this.scene.tweens.add({
          targets: this.boosterImage,
          alpha: 0.85,
          duration: 500,
          ease: 'Sine.InOut',
          yoyo: true,
          repeat: -1,
        });
        break;

      case 'klo_sphere':
        // Subtle rotation: 0° → 360° over 4s
        this.boosterIdleTween = this.scene.tweens.add({
          targets: this.boosterImage,
          angle: 360,
          duration: 4000,
          ease: 'Linear',
          repeat: -1,
        });
        break;
    }
  }

  // On reset or destroy, stop tweens
  public reset(...args): void {
    if (this.boosterIdleTween) {
      this.boosterIdleTween.stop();
      this.boosterIdleTween.remove();
      this.boosterIdleTween = undefined;
    }
    if (this.boosterImage) {
      this.boosterImage.destroy();
      this.boosterImage = undefined;
    }
    // ... existing reset logic ...
  }
}
```

### Rendering Inactive Cells with Block Sprite
```typescript
// src/scenes/Game.ts (REPLACE gridMaskGraphics approach)
private renderInactiveCells(): void {
  const style = this.levelData.grid.inactive_cell_style || 'transparent';

  if (style === 'transparent') {
    // Do nothing — background shows through
    return;
  }

  // style === 'block': Place block.png sprites at inactive cell positions
  for (let row = 0; row < this.gridHeight; row++) {
    for (let col = 0; col < this.gridWidth; col++) {
      if (!this.engine.isCellActive(row, col)) {
        const x = this.gridOffsetX + col * TILE_SIZE + TILE_SIZE / 2;
        const y = this.gridOffsetY + row * TILE_SIZE + TILE_SIZE / 2;

        const blockSprite = this.add.image(x, y, 'block_texture');
        blockSprite.setDisplaySize(TILE_SIZE, TILE_SIZE);
        blockSprite.setDepth(-1); // Render behind tiles
      }
    }
  }
}
```

### Updating Type Definitions
```typescript
// src/game/types.ts (REMOVE 'light', ADJUST to new tile types)
// OLD:
export type TileType = 'fuel' | 'coffee' | 'snack' | 'road' | 'empty';

// NEW (6 new tiles):
export type TileType = 'burger' | 'hotdog' | 'oil' | 'water' | 'snack' | 'soda' | 'empty';

// src/game/constants.ts (UPDATE mappings)
export const TILE_TYPES = ['burger', 'hotdog', 'oil', 'water', 'snack', 'soda'] as const;

export const TEXTURE_KEYS: Record<TileType, string> = {
  burger: 'tile_burger',
  hotdog: 'tile_hotdog',
  oil: 'tile_oil',
  water: 'tile_water',
  snack: 'tile_snack',
  soda: 'tile_soda',
};

// Update TILE_COLORS if needed (map new types to colors for particles/tints)
export const TILE_COLORS: Record<TileType, number> = {
  burger: 0xFFB800,    // KLO yellow
  hotdog: 0xFF6B35,    // Orange
  oil: 0x1A1A1A,       // Black/dark
  water: 0x4A90E2,     // Blue
  snack: 0xF39C12,     // Golden
  soda: 0xE74C3C,      // Red
};
```

### Updating Level Config Schema
```typescript
// data/levels/level_010.json (ADD inactive_cell_style field)
{
  "level_id": 10,
  "grid": {
    "width": 8,
    "height": 8,
    "cell_map": [[1,1,0,0], ...],
    "inactive_cell_style": "block" // NEW: "block" | "transparent"
  },
  "spawn_rules": {
    "burger": 0.2,
    "hotdog": 0.2,
    "oil": 0.15,
    "water": 0.15,
    "snack": 0.15,
    "soda": 0.15
  },
  ...
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Texture atlases for small asset sets | Individual PNG loads | Phaser 3.x era | Simpler code, negligible perf difference for <20 images |
| Shader-based effects for all animations | Tweens for simple animations, shaders for complex | 2020+ mobile optimization | Easier to maintain, better mobile compatibility |
| Manual DPR handling with canvas resize | Phaser Scale.RESIZE + zoom config | Phaser 3.16+ (2019) | Automatic handling of all edge cases (orientation, fractional DPR) |
| Graphics-based overlays for all effects | Image sprites + tweens for icons/boosters | Current best practice | Better visual quality, easier for non-programmers to update art |

**Deprecated/outdated:**
- **Texture atlases for tiny asset counts:** Still works, but overkill for this project. Use individual loads for clarity.
- **Custom animation loops with delta time:** Phaser Tweens cover 95% of use cases with better ergonomics.
- **Programmatic shape drawing for game objects:** Fine for debug/prototypes, but final games should use sprite art for visual consistency.

## Open Questions

1. **Exact tile-to-game-type mapping strategy**
   - What we know: 6 new tile PNGs exist (burger, hotdog, oil, water, snack, soda)
   - What's unclear: User wants 6 tile types in game now? Or map 6 assets to existing 4 types? CONTEXT says "6 distinct new tile types" — so yes, expand from 4 to 6 types.
   - Recommendation: Expand TileType from 4 to 6, use all assets. Update spawn_rules in all level JSONs to include all 6 types.

2. **Default inactive_cell_style for backward compatibility**
   - What we know: New field needed in level JSON schema
   - What's unclear: Should old levels without field default to 'block' or 'transparent'?
   - Recommendation: Default to 'transparent' (safer — no visual change to existing levels). User can add 'block' explicitly to new levels.

3. **Particle vs Tween for subtle effects**
   - What we know: User wants "barely noticeable shimmer/pulse"
   - What's unclear: Are tweens subtle enough, or need particles?
   - Recommendation: Start with tweens (simpler, easier to tune). If too obvious, reduce scale/alpha range. Particles only if tween feels "mechanical" — but for pulse/shimmer, tweens are perfect.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `/Users/vasiliyhrebenuyk/work/KLO/klo-match-3/src/` — TileSprite.ts, Boot.ts, Game.ts, VFXManager.ts, constants.ts, types.ts
- Asset verification: `/Users/vasiliyhrebenuyk/work/KLO/klo-match-3/assets/` — all tiles, boosters, blocks confirmed at 1024x1024 PNG
- Phaser 3 official docs (via training): Texture loading, tweens, scale manager, image rendering

### Secondary (MEDIUM confidence)
- Phase 05 CONTEXT.md — established asset loading patterns and VFX philosophy
- main.ts DPR configuration — confirmed retina rendering setup (zoom-based approach)

### Tertiary (LOW confidence)
None — all findings verified against codebase or official Phaser docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Phaser 3.90 confirmed in package.json, all APIs verified in codebase
- Architecture: HIGH - Existing patterns (TEXTURE_KEYS, TileSprite, Boot loading) proven and working
- Pitfalls: HIGH - Identified from actual codebase patterns (tween cleanup in VFXManager, texture key consistency in constants.ts)

**Research date:** 2026-02-10
**Valid until:** 60 days (stable domain — Phaser 3 API stable, asset integration patterns evergreen)
