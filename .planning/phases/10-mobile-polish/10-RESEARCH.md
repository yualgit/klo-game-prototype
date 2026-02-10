# Phase 10: Mobile Polish - Research

**Researched:** 2026-02-10
**Domain:** Phaser 3 responsive scaling and DPI handling
**Confidence:** MEDIUM-HIGH

## Summary

Phase 10 requires implementing mobile-responsive layouts (VISL-04) and crisp retina rendering (VISL-05) across all scenes. Phaser 3 provides Scale Manager with multiple modes (FIT, RESIZE, ENVELOP) and DPI handling through zoom/width/height multiplication.

**Key challenge**: Phaser 3's `resolution` property has known issues (deprecated/broken since v3.16), requiring manual DPR handling via `zoom: 1/window.devicePixelRatio` and dimension multiplication. Current project uses `Phaser.Scale.FIT` on fixed 1024x768 canvas, which maintains aspect ratio but doesn't adapt layout — scenes hard-code positions assuming fixed dimensions.

**Primary recommendation:** Migrate to `Phaser.Scale.RESIZE` with `scale.on('resize', callback)` listeners in each scene, implementing `resize(gameSize)` methods to reposition UI elements proportionally. Cap DPR at 2x via `Math.min(window.devicePixelRatio, 2)` to prevent performance collapse on 3-4x Android devices.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser 3 | 3.85.0+ | Game engine with Scale Manager | Built-in responsive scaling, no additional libraries needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | N/A | DPI handled natively | Phaser 3 Scale Manager sufficient for requirements |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Phaser.Scale.RESIZE | Phaser.Scale.FIT | FIT maintains aspect ratio but letterboxes, doesn't reflow layout — works for fixed-layout games, not adaptive UIs |
| Manual zoom/DPR | CSS scaling | CSS scaling doesn't give true pixel density, remains blurry on retina — only use if performance critical |

**Installation:**
No additional packages required. Phaser 3 already installed.

## Architecture Patterns

### Recommended Scale Configuration (main.ts)

**Current config:**
```typescript
scale: {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
}
```

**Target responsive + DPI config:**
```typescript
// Cap DPR at 2x for performance (per phase decision)
const dpr = Math.min(window.devicePixelRatio, 2);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth * dpr,
  height: window.innerHeight * dpr,
  parent: 'game-container',
  backgroundColor: '#F9F9F9',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: 1 / dpr,
  },
  render: {
    pixelArt: false, // Project uses smooth tile sprites, not pixel art
    roundPixels: true, // Prevent subpixel blur on cameras
  },
  scene: [Boot, Menu, LevelSelect, Game],
};
```

**Reasoning:**
- `width/height * dpr`: Canvas context renders at device pixel density
- `zoom: 1/dpr`: Scales canvas back to CSS logical pixels
- `Phaser.Scale.RESIZE`: Canvas resizes to fit parent, triggers resize events
- `pixelArt: false`: Project uses smooth gradients/tiles (not nearest-neighbor sprites)
- `roundPixels: true`: Snap camera rendering to whole pixels (prevents blur)

### Pattern 1: Scene Resize Handler

**What:** Each scene implements `resize(gameSize)` method called on scale manager resize event

**When to use:** Required for all scenes with positioned UI elements (Menu, LevelSelect, Game)

**Example:**
```typescript
// Source: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/scalemanager/
export class Menu extends Phaser.Scene {
  private playButton: Phaser.GameObjects.Container;
  private title: Phaser.GameObjects.Text;

  create(): void {
    // Initial positioning
    this.createUI();

    // Listen for resize events
    this.scale.on('resize', this.resize, this);
  }

  resize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;

    // Update camera viewport (required for all scenes)
    this.cameras.main.setViewport(0, 0, width, height);

    // Reposition UI elements proportionally
    if (this.title) {
      this.title.setPosition(width / 2, height / 3);
    }
    if (this.playButton) {
      this.playButton.setPosition(width / 2, height / 2 + 50);
    }

    // Redraw gradient backgrounds (Graphics don't auto-resize)
    this.redrawBackground(width, height);
  }

  private redrawBackground(width: number, height: number): void {
    // Graphics fillRect doesn't scale — must clear and redraw
    this.bgGraphics.clear();
    this.bgGraphics.fillGradientStyle(0xF9F9F9, 0xF9F9F9, 0xFFF5E0, 0xFFF5E0, 1);
    this.bgGraphics.fillRect(0, 0, width, height);
  }
}
```

### Pattern 2: Responsive Grid Positioning (Game scene)

**What:** Grid offset centers on available canvas space dynamically

**Current approach (fixed):**
```typescript
// Assumes 1024x768 canvas
this.gridOffsetX = (width - (gridWidth * TILE_SIZE)) / 2;
this.gridOffsetY = 140; // Fixed top margin
```

**Responsive approach:**
```typescript
resize(gameSize: Phaser.Structs.Size): void {
  const { width, height } = gameSize;
  this.cameras.main.setViewport(0, 0, width, height);

  // Center grid horizontally, position relative to viewport height
  const gridPixelWidth = this.gridWidth * TILE_SIZE;
  const gridPixelHeight = this.gridHeight * TILE_SIZE;

  this.gridOffsetX = (width - gridPixelWidth) / 2;
  this.gridOffsetY = Math.max(140, height * 0.15); // 15% from top or 140px min

  // Reposition all tile sprites (if mid-game resize)
  this.repositionGrid();
}

private repositionGrid(): void {
  for (let row = 0; row < this.gridHeight; row++) {
    for (let col = 0; col < this.gridWidth; col++) {
      const sprite = this.tileSprites[row]?.[col];
      if (sprite) {
        sprite.x = this.gridOffsetX + col * TILE_SIZE + TILE_SIZE / 2;
        sprite.y = this.gridOffsetY + row * TILE_SIZE + TILE_SIZE / 2;
      }
    }
  }
}
```

### Pattern 3: Fixed HUD Elements with setScrollFactor(0)

**What:** LevelSelect scene uses scrollable world with fixed HUD overlay

**Current approach:**
```typescript
const hudBg = this.add.graphics();
hudBg.fillRect(0, 0, width, 120);
hudBg.setScrollFactor(0); // Fixed to camera
```

**Resize handling:**
```typescript
resize(gameSize: Phaser.Structs.Size): void {
  const { width, height } = gameSize;
  this.cameras.main.setViewport(0, 0, width, height);

  // Redraw HUD background to new width
  this.hudBg.clear();
  this.hudBg.fillStyle(0xFFFFFF, 0.8);
  this.hudBg.fillRect(0, 0, width, 120);

  // Reposition fixed UI (title, economy HUD, settings button)
  this.title.setPosition(width / 2, 60);
  this.updateEconomyHUDPositions(width);
}
```

### Pattern 4: Orientation Change Handling

**What:** Detect and respond to portrait/landscape orientation changes

**Example:**
```typescript
// Source: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/orientation/
create(): void {
  // Listen for orientation change
  this.scale.on('orientationchange', this.handleOrientation, this);
}

handleOrientation(orientation: string): void {
  if (orientation === Phaser.Scale.PORTRAIT || orientation === Phaser.Scale.PORTRAIT_SECONDARY) {
    console.log('[Scene] Portrait mode detected');
    // Adjust layout for vertical orientation (optional)
  } else {
    console.log('[Scene] Landscape mode detected');
  }

  // Resize handler already repositions elements
}
```

### Anti-Patterns to Avoid

- **Hard-coded positions assuming fixed canvas:** Current codebase uses `width / 2` from `this.cameras.main.width` in create() but never updates on resize — positions break if canvas changes
- **Ignoring Graphics redraw:** Phaser Graphics objects (gradients, rectangles) don't auto-resize — must `clear()` and redraw in resize handler
- **Missing camera viewport update:** Forgetting `this.cameras.main.setViewport(0, 0, width, height)` causes input hit testing misalignment
- **Using `setVisible(false)` for invisible hit areas:** Breaks input (from MEMORY.md) — use `setAlpha(0.001)` instead for invisible interactives

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Canvas DPI scaling | Custom CSS transform scaling | Phaser zoom + width/height * dpr | CSS scaling doesn't create true high-DPI canvas context — images remain blurry |
| Responsive layout plugin | Third-party grid system | Phaser Scale.RESIZE + scene resize() | Built-in Scale Manager handles window events, orientation, fullscreen — custom solutions duplicate effort |
| Orientation lock | Manual screen.orientation API | Phaser `scale.lockOrientation()` | Phaser polyfills browser inconsistencies, handles permissions |
| Viewport meta tags | Trial-and-error | Standard: `user-scalable=no, initial-scale=1.0, width=device-width` | Prevents zoom, enables proper DPR detection |

**Key insight:** Phaser 3's Scale Manager is mature (since v3.16) and handles edge cases (orientation lock permissions, fullscreen API differences, DPR detection). Custom solutions risk browser inconsistencies.

## Common Pitfalls

### Pitfall 1: Using `resolution` Config Property (Deprecated)

**What goes wrong:** Setting `resolution: window.devicePixelRatio` in game config causes blurry rendering or oversized canvas (not CSS dimensions).

**Why it happens:** Phaser 3.16+ locked `resolution` to 1 and removed the property due to rendering bugs. GitHub issue #3198 documents the regression.

**How to avoid:** Use `zoom: 1/dpr` pattern instead (see Architecture Patterns).

**Warning signs:** Canvas element in DOM shows doubled width/height attributes but normal CSS size, or crisp rendering only appears on 1x displays.

**Source:** https://github.com/photonstorm/phaser/issues/3198

### Pitfall 2: RESIZE Mode Without Resize Handlers

**What goes wrong:** Canvas resizes to fill parent, but UI elements remain at original positions — buttons/text appear off-center or clipped.

**Why it happens:** `Phaser.Scale.RESIZE` changes canvas dimensions but doesn't automatically reposition game objects. Unlike FIT mode (which scales everything via CSS), RESIZE gives 1:1 pixel mapping requiring manual repositioning.

**How to avoid:** Implement `resize(gameSize)` method in every scene with positioned UI. Listen to `this.scale.on('resize', this.resize, this)` in create().

**Warning signs:** UI looks correct on initial load but breaks after window resize, device rotation, or fullscreen toggle.

**Source:** https://rexrainbow.github.io/phaser3-rex-notes/docs/site/scalemanager/

### Pitfall 3: Forgetting to Redraw Graphics Objects

**What goes wrong:** Background gradients, HUD panels, or overlays remain at original size while rest of UI repositions — visual glitches appear.

**Why it happens:** Phaser `Graphics` objects draw to internal bitmap, don't scale automatically. Unlike Sprites/Text which have `setPosition()`, Graphics require `clear()` + redraw.

**How to avoid:** Store references to Graphics objects, call `clear()` in resize handler, then redraw with new width/height.

**Warning signs:** Rectangular backgrounds don't cover full canvas after resize, gradients appear stretched/cropped.

### Pitfall 4: Not Capping DPR on High-End Android

**What goes wrong:** Game runs at 3x or 4x DPR on flagship Android devices, canvas becomes 4000x6000+ pixels, frame rate collapses to <20fps.

**Why it happens:** `window.devicePixelRatio` returns native device scaling (often 3-4x on modern phones). Canvas size multiplies exponentially: 1080x1920 screen @ 4x DPR = 4320x7680 canvas = 33 megapixels per frame.

**How to avoid:** Cap DPR at 2x per phase decision: `const dpr = Math.min(window.devicePixelRatio, 2);`

**Warning signs:** Crisp rendering on desktop, silky smooth on iPhone, but laggy/choppy on Pixel 7/Samsung S23. Chrome DevTools performance profiler shows GPU bottleneck.

**Source:** https://franzeus.medium.com/how-i-optimized-my-phaser-3-action-game-in-2025-5a648753f62b

### Pitfall 5: Assuming Camera Viewport Auto-Updates

**What goes wrong:** Input hit testing breaks after resize — clicks register at wrong coordinates, buttons become unresponsive.

**Why it happens:** Camera viewport defines clickable area for input events. If canvas resizes but viewport stays at old dimensions, input coordinate mapping fails.

**How to avoid:** First line of every resize handler: `this.cameras.main.setViewport(0, 0, width, height);`

**Warning signs:** Buttons clickable in top-left quadrant only, or clicks offset from visual position after resize.

### Pitfall 6: Testing Only on Desktop

**What goes wrong:** Game looks perfect on laptop (1x DPR, keyboard controls), but blurry on phones or layout breaks in portrait orientation.

**Why it happens:** Desktop browsers default to 1x DPR, wide landscape aspect ratio. Mobile introduces 2-4x DPR, portrait orientation, touch events, virtual keyboards.

**How to avoid:** Test on real devices (iPhone, Android) or Chrome DevTools mobile emulation with DPR override. Test portrait AND landscape.

**Warning signs:** QA reports blurry graphics, but dev sees crisp rendering locally. Layout assumes landscape, breaks in portrait.

## Code Examples

Verified patterns from official sources:

### Complete DPR Configuration (main.ts)
```typescript
// Source: https://supernapie.com/blog/support-retina-with-phaser-3/
const dpr = Math.min(window.devicePixelRatio, 2); // Cap at 2x per phase decision

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth * dpr,
  height: window.innerHeight * dpr,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: 1 / dpr,
  },
  render: {
    pixelArt: false,
    roundPixels: true,
  },
};

// Handle window resize
window.addEventListener('resize', () => {
  const newWidth = window.innerWidth * dpr;
  const newHeight = window.innerHeight * dpr;
  game.scale.resize(newWidth, newHeight);
});
```

### Scene Resize Handler Pattern
```typescript
// Source: https://medium.com/@tajammalmaqbool11/full-screen-size-and-responsive-game-in-phaser-3-e563c2d60eab
export class MyScene extends Phaser.Scene {
  create(): void {
    this.scale.on('resize', this.resize, this);
    this.createUI();
  }

  resize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;

    // CRITICAL: Update camera viewport first
    this.cameras.main.setViewport(0, 0, width, height);

    // Reposition UI elements
    this.repositionUI(width, height);

    // Redraw Graphics backgrounds
    this.redrawBackground(width, height);
  }
}
```

### Responsive Grid Centering (Game scene)
```typescript
resize(gameSize: Phaser.Structs.Size): void {
  const { width, height } = gameSize;
  this.cameras.main.setViewport(0, 0, width, height);

  const gridPixelWidth = this.gridWidth * TILE_SIZE;
  const gridPixelHeight = this.gridHeight * TILE_SIZE;

  // Center grid with responsive top margin
  this.gridOffsetX = (width - gridPixelWidth) / 2;
  this.gridOffsetY = Math.max(140, height * 0.15);

  // Update all tile positions
  this.tileSprites.forEach((row, r) => {
    row.forEach((sprite, c) => {
      if (sprite) {
        sprite.setPosition(
          this.gridOffsetX + c * TILE_SIZE + TILE_SIZE / 2,
          this.gridOffsetY + r * TILE_SIZE + TILE_SIZE / 2
        );
      }
    });
  });
}
```

### Orientation Detection
```typescript
// Source: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/orientation/
create(): void {
  this.scale.on('orientationchange', (orientation: string) => {
    if (orientation === Phaser.Scale.PORTRAIT) {
      console.log('Portrait mode');
    } else {
      console.log('Landscape mode');
    }
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `resolution` property | `zoom + width/height * dpr` | v3.16 (2019) | Resolution locked at 1, manual DPR handling required |
| Fixed canvas size | Scale.RESIZE + resize handlers | v3.16+ (2019) | True responsive layouts possible, but requires per-scene implementation |
| CSS scaling only | Canvas context scaling | Ongoing | Sharp retina rendering, but higher GPU cost |

**Deprecated/outdated:**
- `resolution` config property: Broken since v3.16, don't use
- `Phaser.ScaleManager` (Phaser 2): Different API, use `Phaser.Scale.ScaleManager` for v3
- `game.scale.setGameSize()`: Use `game.scale.resize()` for RESIZE mode

## Open Questions

1. **LevelSelect scrollable map resize behavior**
   - What we know: Current map uses fixed world bounds (1024x2200), parallax layers positioned for 1024 width
   - What's unclear: Should map width scale to viewport (stretch parallax), or maintain fixed width with horizontal letterboxing on narrow screens?
   - Recommendation: Test both — if parallax looks acceptable stretched to 375px width, scale proportionally; otherwise, center fixed-width map and clip edges on mobile

2. **Performance impact of 2x DPR on older devices**
   - What we know: 2x cap prevents 4x Android collapse, but 2x still doubles pixel count (1024x768 → 2048x1536 = 3.1 megapixels)
   - What's unclear: Do older iPhone 8 / budget Androids maintain 60fps at 2x?
   - Recommendation: Implement adaptive DPR — detect low-end via performance heuristics (initial frame time), fallback to 1x if needed

3. **Mid-game resize handling (edge case)**
   - What we know: Resize handlers reposition UI, but what if user rotates device mid-match during tile animation?
   - What's unclear: Should animations pause/cancel during resize, or let them complete at old positions before repositioning?
   - Recommendation: Flag `isResizing`, queue position updates until animations settle, then batch-update positions

## Sources

### Primary (HIGH confidence)
- [Phaser Scale Manager Official Docs](https://docs.phaser.io/api-documentation/class/scale-scalemanager) - Scale mode behavior, API reference
- [Rex's Phaser 3 Notes - Scale Manager](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/scalemanager/) - Comprehensive scale mode explanations
- [Supernapie: Support Retina with Phaser 3](https://supernapie.com/blog/support-retina-with-phaser-3/) - DPR handling with zoom + width/height multiplication
- [GitHub Issue #3198](https://github.com/photonstorm/phaser/issues/3198) - Resolution property deprecation, current status

### Secondary (MEDIUM confidence)
- [Full-Screen Size and Responsive Game in Phaser 3](https://medium.com/@tajammalmaqbool11/full-screen-size-and-responsive-game-in-phaser-3-e563c2d60eab) - Resize event pattern
- [How I optimized my Phaser 3 action game — in 2025](https://franzeus.medium.com/how-i-optimized-my-phaser-3-action-game-in-2025-5a648753f62b) - DPR performance pitfalls
- [Rex's Phaser 3 Notes - Orientation](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/orientation/) - Orientation change events
- [Phaser Scale Manager Concept Guide](https://docs.phaser.io/phaser/concepts/scale-manager) - High-level overview

### Tertiary (LOW confidence)
- [Phaser Discourse: Mobile Responsive](https://phaser.discourse.group/t/mobile-responsive/12284) - Community patterns (not official)
- [Medium: Responsive Phaser Game](https://medium.com/@mattcolman/responsive-phaser-game-54a0e2dafba7) - Older article (pre-3.16), verify patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Phaser 3 built-in, no third-party libs needed, well-documented
- Architecture: MEDIUM-HIGH - Patterns verified from official docs + Rex notes, but edge cases (mid-animation resize) untested
- Pitfalls: HIGH - Resolution deprecation confirmed via GitHub issue, DPR performance issues documented in 2025 optimization article
- Code examples: HIGH - Sourced from official tutorials and verified community sources (Supernapie, Rex)

**Research date:** 2026-02-10
**Valid until:** 2026-03-12 (30 days — Phaser 3 stable, no fast-moving changes expected)
