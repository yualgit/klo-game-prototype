# Phase 12: Responsive Layout Foundation - Research

**Researched:** 2026-02-10
**Domain:** Mobile responsive layout for Phaser 3 games across diverse viewport sizes
**Confidence:** HIGH

## Summary

Phase 12 requires implementing proper responsive scaling across all mobile viewports (iPhone SE 375x667, Android ~360x740, iPhone 14 Pro, etc.) to ensure the Level Select scene displays completely without cropping road/checkpoints/CTAs, the Game Board remains fully visible with accessible edge cells, and HUD elements never overlap the grid. Current implementation uses `Phaser.Scale.RESIZE` with manual DPR handling (capped at 2x) and scene-level `handleResize()` methods, but has layout constraints that assume certain minimum viewport dimensions.

**Key findings:**
- The game already uses `Scale.RESIZE` mode (implemented in Phase 10), which correctly resizes canvas to fill viewport
- All three scenes (Menu, LevelSelect, Game) already have `handleResize()` handlers that reposition UI elements
- **Critical issue**: LevelSelect uses a fixed 1024px world width (MAP_WIDTH) and Game uses a fixed 8x8 grid at 64px tiles (512px width), which can overflow narrow viewports like iPhone SE (375px)
- iPhone SE at 375x667 with 2x DPR yields canvas of 750x1334, but UI is positioned assuming ~1024px minimum width
- Game HUD currently hard-coded at 52px height with grid offset +30px, which may not leave enough room on very short viewports

**Primary recommendation:** Implement viewport-relative scaling strategy with min-width constraints on game world elements. Use `Scale.FIT` mode with explicit min/max bounds, or continue with `Scale.RESIZE` but add conditional layout strategies for narrow/wide aspect ratios. Add safe-area viewport meta tag for notch handling.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser 3 | 3.90.0 | Game engine with Scale Manager | Built-in responsive scaling via Scale modes (RESIZE, FIT, ENVELOP) and resize events |
| N/A | N/A | No external responsive libraries | Phaser 3 Scale Manager sufficient for game UI needs |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CSS env() variables | Native | Safe area insets for notches | Add viewport-fit=cover + CSS padding with env(safe-area-inset-*) for iOS notch support |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Scale.RESIZE | Scale.FIT | FIT maintains aspect ratio, adds letterboxing but prevents overflow — better for fixed-layout games, worse for "fill screen" PWA feel |
| Fixed MAP_WIDTH | Responsive MAP_WIDTH | Flexible map width adapts to viewport but requires rewriting parallax layers and level node positions — high complexity, risky for Phase 12 |
| Fixed grid size | Variable grid size | Could scale grid smaller on tiny screens but breaks level design (pre-placed tiles, obstacles) and tile touch targets — not viable |

**Installation:**
No additional packages required. All features provided by Phaser 3.90.0 core.

## Architecture Patterns

### Pattern 1: Scale.RESIZE with Conditional Layout (Current Approach)

**What:** Canvas resizes to fill all available parent space, scene `handleResize()` methods reposition UI elements proportionally

**When to use:** Games with adaptive UI that should fill screen (PWA-style), where letterboxing is undesirable

**Current implementation:**
```typescript
// main.ts (already implemented in Phase 10)
const dpr = Math.min(window.devicePixelRatio || 1, 2);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth * dpr,
  height: window.innerHeight * dpr,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: 1 / dpr,
  },
  // ...
};
```

**Strengths:**
- Already implemented, no config changes needed
- Fills screen completely on all devices (no letterboxing)
- Scene resize handlers already written for Menu, LevelSelect, Game

**Weaknesses:**
- Fixed-width elements (MAP_WIDTH=1024, grid=512px) overflow narrow viewports (iPhone SE=375px)
- Requires conditional layout logic to handle narrow vs wide aspect ratios
- No built-in safe area support for iOS notches

### Pattern 2: Scale.FIT with Min/Max Constraints (Alternative Approach)

**What:** Game scales to fit within viewport while maintaining aspect ratio, optional min/max size limits prevent extreme scaling

**When to use:** Games with fixed layout that can tolerate letterboxing, simpler to implement than responsive layouts

**Example:**
```typescript
// Source: https://phaser.io/examples/v3.55.0/scalemanager/view/resize-min-max
const config: Phaser.Types.Core.GameConfig = {
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 800,
      height: 600,
    },
    max: {
      width: 1600,
      height: 1200,
    },
  },
};
```

**Strengths:**
- Guarantees no overflow (content always fits within viewport)
- Simpler scene code (positions remain relative to fixed game dimensions)
- Works well with fixed-size grids and maps

**Weaknesses:**
- Letterboxing (black bars) on aspect ratios that don't match game aspect ratio
- Less "native app" feel on mobile (unused screen space)
- Min/max constraints can cause extreme scaling on outlier devices

### Pattern 3: Adaptive Layout with Breakpoints

**What:** Scene detects viewport dimensions and switches between layout strategies (e.g., portrait vs landscape, narrow vs wide)

**When to use:** Games with complex UI that need different layouts for drastically different screen sizes

**Example:**
```typescript
// Source: Community pattern from https://medium.com/@mattcolman/responsive-phaser-game-54a0e2dafba7
class Game extends Phaser.Scene {
  private layout: 'narrow' | 'wide' = 'wide';

  handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;

    // Determine layout strategy
    const aspectRatio = width / height;
    this.layout = aspectRatio < 0.75 ? 'narrow' : 'wide';

    if (this.layout === 'narrow') {
      // Stack HUD above grid, use full width
      this.positionHUDTop(width);
      this.centerGridBelow(width, height);
    } else {
      // HUD on side, grid centered
      this.positionHUDSide(width, height);
      this.centerGrid(width, height);
    }
  }
}
```

**Strengths:**
- Optimal use of screen real estate on all devices
- Prevents overflow by adapting layout to constraints
- Can support both portrait and landscape well

**Weaknesses:**
- Requires maintaining multiple layout strategies
- More complex scene code, harder to test
- May require redesigning UI for narrow layouts

### Recommended Approach for Phase 12

**Use Scale.FIT with min/max constraints:**
- Set min width to 800px, min height to 600px
- Set max width to 1600px, max height to 1200px
- Accept letterboxing as acceptable tradeoff for guaranteed visibility
- Avoids major refactoring of LevelSelect map and Game grid

**Why not continue with Scale.RESIZE:**
- LevelSelect MAP_WIDTH (1024px) and MAP_HEIGHT (2200px) are fixed in parallax layers and level node positions
- Game grid is 512px wide (8 tiles × 64px), needs ~80px margins = ~672px minimum
- iPhone SE portrait (375px) cannot fit these elements without scaling down
- Refactoring to fluid layouts would require Phase 12 scope expansion (parallax rewrite, grid scaling logic, touch target validation)

**Why FIT works:**
- Game aspect ratio is ~4:3 (1024x768 reference design)
- iPhone SE (375x667) is ~9:16, FIT will scale game to fit within viewport (likely constrained by width)
- Effective game size on iPhone SE: ~375x281 (scaled from 1024x768 to fit 375px width), leaving vertical letterboxes
- All content remains visible, no overflow, no refactoring needed

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Responsive positioning | Manual coordinate calculations per device | Phaser Scale Manager + relative positioning | Scale Manager handles viewport changes, window.innerWidth/height unreliable after orientation change |
| DPI scaling | Custom canvas resolution switching | Phaser zoom + dimension multiplication | Phaser's zoom property correctly handles DPI, manual resolution switching breaks input coordinates |
| Safe area insets | JavaScript-based notch detection | CSS env(safe-area-inset-*) | Native browser APIs provide accurate safe areas, JS detection fragile and incomplete |
| Orientation locking | JavaScript screen.orientation.lock() | Phaser Scale Manager orientation config | Scale Manager handles orientation changes internally, JS APIs require fullscreen mode and have poor browser support |

**Key insight:** Phaser 3's Scale Manager is mature and handles most responsive layout needs. Custom solutions for viewport sizing, DPI handling, or orientation management are more complex and error-prone than built-in APIs. The complexity comes from layout adaptation (deciding what to show where), not from detecting viewport size.

## Common Pitfalls

### Pitfall 1: Fixed-Width Elements Overflow Narrow Viewports

**What goes wrong:** Game designed for 1024px viewport is unplayable on iPhone SE (375px) — level select map crops, game grid extends offscreen, buttons unreachable

**Why it happens:** Using absolute pixel dimensions (MAP_WIDTH=1024, TILE_SIZE=64) assumes minimum viewport width. Scale.RESIZE fills viewport but doesn't scale content — on narrow screens, fixed-width elements simply overflow.

**How to avoid:**
- Use Scale.FIT mode with min/max constraints to scale game to fit viewport
- OR implement responsive layout with conditional sizing (grid scales smaller on narrow screens)
- OR set minimum supported resolution (e.g., 768px width) and accept some devices won't be fully supported

**Warning signs:**
- Level select road disappears off left/right edges on iPhone SE
- Game grid cells unreachable on far right column
- HUD text overlaps grid because viewport too narrow for side-by-side layout

### Pitfall 2: HUD Overlaps Grid on Short Viewports

**What goes wrong:** Game HUD (goals, moves) positioned at top, grid centered below — on short screens (Android ~360x640), grid pushes up into HUD area, overlapping text and making top row tiles untappable

**Why it happens:** Fixed HUD height (52px) + fixed grid size (512px + margins) + padding doesn't fit in short viewports. Grid offset calculation `(height - gridHeight) / 2 + 30` assumes enough vertical space.

**How to avoid:**
- Calculate minimum required viewport height: HUD + grid + margins + safe spacing
- Use conditional layout: reduce HUD size or move to side on short screens
- OR use Scale.FIT with min height constraint to guarantee vertical space
- Test on shortest target device (360x640 Android)

**Warning signs:**
- Top row of grid tiles partially hidden behind HUD
- Goal text overlaps top tiles
- Level text unreadable due to grid background bleeding through

### Pitfall 3: Input Coordinates Broken After Resize

**What goes wrong:** After device rotation or browser resize, tapping tiles doesn't register correctly — input is offset or selects wrong tile

**Why it happens:** Forgetting to call `this.cameras.main.setViewport(0, 0, width, height)` in resize handler. Camera uses stale viewport bounds, causing pointer coordinate transformation to be incorrect.

**How to avoid:**
- ALWAYS call `setViewport()` as first line in every scene's `handleResize()` method
- Verify all scenes have resize handlers attached: `this.scale.on('resize', this.handleResize, this)`
- Clean up listeners on shutdown: `this.events.once('shutdown', () => { this.scale.off('resize', ...) })`

**Warning signs:**
```typescript
// BAD - missing setViewport call
handleResize(gameSize: Phaser.Structs.Size): void {
  const { width, height } = gameSize;
  this.repositionUI(width, height);
}

// GOOD - updates camera viewport first
handleResize(gameSize: Phaser.Structs.Size): void {
  const { width, height } = gameSize;
  this.cameras.main.setViewport(0, 0, width, height); // CRITICAL
  this.repositionUI(width, height);
}
```

### Pitfall 4: Forgetting Safe Area Insets for iOS Notch

**What goes wrong:** Game renders behind iPhone notch/Dynamic Island, making top HUD elements unreadable or inaccessible. Or game content hidden behind home indicator bar at bottom.

**Why it happens:** Default viewport meta tag doesn't extend content into safe areas. Without `viewport-fit=cover` and CSS safe-area-inset padding, game renders only in "safe" rectangular area, wasting screen space. Or with `viewport-fit=cover`, game renders full-screen but doesn't account for notch obstruction.

**How to avoid:**
- Add `viewport-fit=cover` to viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">`
- Use CSS env() variables for safe spacing: `padding-top: env(safe-area-inset-top);`
- OR detect safe areas in game code via `window.screen.availHeight` vs `window.innerHeight` difference
- Test on iPhone X+ simulators or physical devices with notches

**Warning signs:**
- Game doesn't fill screen on iPhone X+ (black bars at top/bottom)
- HUD text overlaps notch area
- Bottom buttons hidden behind home indicator
- Game looks correct on iPhone 8 but broken on iPhone 14

### Pitfall 5: Parallax Layers Break on Dynamic MAP_WIDTH

**What goes wrong:** Attempting to make LevelSelect map width responsive causes parallax layers (sky, far, mid) to misalign, repeat incorrectly, or show gaps

**Why it happens:** Parallax layers are pre-rendered at specific dimensions with calculated scroll factors. Changing MAP_WIDTH breaks the math — e.g., far layer covers 3 segments of fixed height, mid layer covers 2 segments. If MAP_WIDTH changes, segment heights become incorrect.

**How to avoid:**
- Keep MAP_WIDTH fixed (accept horizontal letterboxing on narrow screens)
- OR pre-render parallax layers at multiple breakpoints (e.g., 768px, 1024px, 1280px) and swap based on viewport
- OR redesign parallax using tiled backgrounds that repeat seamlessly
- Avoid dynamic MAP_WIDTH changes unless willing to rewrite entire parallax system

**Warning signs:**
- Parallax layers show white gaps between segments
- Far/mid layers don't cover full scroll range (map scrolls past layer)
- Layer positions jump when viewport width changes
- Checkpoint buttons misaligned with road path

## Code Examples

Verified patterns from official sources and current codebase:

### Phaser Config with Scale.FIT and Constraints
```typescript
// Source: https://phaser.io/examples/v3/view/scalemanager/resize-min-max
const dpr = Math.min(window.devicePixelRatio || 1, 2);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth * dpr,
  height: window.innerHeight * dpr,
  parent: 'game-container',
  backgroundColor: '#F9F9F9',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: 1 / dpr,
    min: {
      width: 800,  // Ensures MAP_WIDTH (1024) scales down to fit
      height: 600, // Ensures grid (512 + HUD) fits vertically
    },
    max: {
      width: 1600,
      height: 1200,
    },
  },
  render: {
    pixelArt: false,
    roundPixels: true,
  },
  scene: [Boot, Menu, LevelSelect, Game],
};
```

### Scene Resize Handler Pattern (Already Implemented)
```typescript
// Source: Current codebase — src/scenes/Game.ts
export class Game extends Phaser.Scene {
  private hudBg: Phaser.GameObjects.Graphics;
  private gridOffsetX: number;
  private gridOffsetY: number;

  create(): void {
    // Initial layout
    this.setupInitialLayout();

    // Register resize handler
    this.scale.on('resize', this.handleResize, this);

    // Cleanup on shutdown
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.handleResize, this);
    });
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;

    // CRITICAL: Update camera viewport for correct input coordinates
    this.cameras.main.setViewport(0, 0, width, height);

    // Recalculate grid offset (center on viewport)
    const gridPixelWidth = this.gridWidth * TILE_SIZE;
    const gridPixelHeight = this.gridHeight * TILE_SIZE;
    this.gridOffsetX = (width - gridPixelWidth) / 2;
    this.gridOffsetY = (height - gridPixelHeight) / 2 + 30;

    // Redraw background to new size
    if (this.bg) {
      this.bg.clear();
      this.bg.fillGradientStyle(0xFFFBF0, 0xFFFBF0, 0xFFF0D0, 0xFFF0D0, 1);
      this.bg.fillRect(0, 0, width, height);
    }

    // Redraw HUD background bar
    if (this.hudBg) {
      this.hudBg.clear();
      this.hudBg.fillStyle(0xFFB800, 0.15);
      this.hudBg.fillRoundedRect(8, 8, width - 16, 52, 8);
    }

    // Reposition HUD text
    if (this.hudText) {
      this.hudText.setPosition(width / 2, 34);
    }

    // Redraw grid background and reposition all tiles
    this.redrawGridBackground();
    this.repositionAllTiles();
  }
}
```

### Safe Area Insets for iOS Notch
```html
<!-- Source: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env -->
<!-- index.html -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">

<style>
  body {
    /* Add safe padding around entire game container */
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }
</style>
```

### Conditional Layout Based on Aspect Ratio
```typescript
// Source: Pattern from https://medium.com/@mattcolman/responsive-phaser-game-54a0e2dafba7
export class Game extends Phaser.Scene {
  private layout: 'portrait' | 'landscape' = 'landscape';

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;

    // Update camera viewport
    this.cameras.main.setViewport(0, 0, width, height);

    // Detect layout mode
    const aspectRatio = width / height;
    this.layout = aspectRatio < 0.75 ? 'portrait' : 'landscape';

    if (this.layout === 'portrait') {
      // Portrait: Stack HUD above grid, use full width
      this.repositionHUDPortrait(width);
      this.repositionGridPortrait(width, height);
    } else {
      // Landscape: HUD in top bar, grid centered
      this.repositionHUDLandscape(width);
      this.repositionGridLandscape(width, height);
    }
  }

  private repositionHUDPortrait(width: number): void {
    // Move HUD to top, full width
    if (this.hudBg) {
      this.hudBg.clear();
      this.hudBg.fillStyle(0xFFB800, 0.15);
      this.hudBg.fillRoundedRect(8, 8, width - 16, 70, 8);
    }
  }

  private repositionGridPortrait(width: number, height: number): void {
    // Position grid below HUD, centered horizontally
    const gridPixelWidth = this.gridWidth * TILE_SIZE;
    this.gridOffsetX = (width - gridPixelWidth) / 2;
    this.gridOffsetY = 90; // Below HUD

    this.repositionAllTiles();
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Scale.FIT with fixed 1024x768 | Scale.RESIZE with resize handlers | Phase 10 (Feb 2026) | Enables full-screen PWA experience, requires per-scene resize logic |
| Phaser resolution property | Manual DPR via zoom + dimension multiplication | Phaser 3.16+ | resolution property deprecated/broken, manual DPR gives crisp rendering on retina displays |
| Single layout for all screens | Conditional layouts (narrow/wide breakpoints) | 2024-2025 | Mobile-first responsive games use breakpoint-based layouts instead of fixed designs |
| Letterboxing accepted | Full-screen with safe areas | 2020+ (iPhone X notch) | Modern PWAs extend into safe areas using CSS env() variables, providing native app feel |

**Deprecated/outdated:**
- **Phaser 2 ScaleManager**: Completely different API, not compatible with Phaser 3. Phaser 3 uses `this.scale` (Scale Manager singleton), not `game.scale`.
- **resolution property**: Deprecated since Phaser 3.16, broken in 3.17+. Use `zoom + width/height multiplication` instead.
- **Fixed mobile resolutions**: Old approach was to detect device and set fixed resolution (e.g., 750x1334 for iPhone). Modern approach is dynamic resize with scale modes.

## Open Questions

1. **Should we switch to Scale.FIT or keep Scale.RESIZE?**
   - What we know: Scale.FIT guarantees no overflow (letterboxing acceptable), Scale.RESIZE fills screen but requires layout adaptation
   - What's unclear: User preference — is letterboxing acceptable, or must game fill screen edge-to-edge?
   - Recommendation: Use Scale.FIT for Phase 12 (simplest, guaranteed success). If user rejects letterboxing, implement adaptive layouts in future phase.

2. **How to handle LevelSelect map on very narrow viewports (iPhone SE 375px)?**
   - What we know: MAP_WIDTH is 1024px, fixed in parallax layer math. Horizontal scroll is supported. Level nodes positioned at fixed world coordinates.
   - What's unclear: Is horizontal scroll acceptable on narrow screens (swipe left/right to see full map), or must entire map be visible at once?
   - Recommendation: Accept horizontal scroll if Scale.FIT is used (map scales down, remains navigable). If Scale.RESIZE kept, cap minimum supported width at 768px or implement responsive MAP_WIDTH (complex).

3. **Should we support portrait orientation for Game scene (grid)?**
   - What we know: Game grid is 8x8 at 64px tiles (512px square + margins). Portrait iPhone SE is 375x667. With HUD, grid fits vertically but not horizontally without scaling.
   - What's unclear: Is portrait gameplay important, or can we lock to landscape?
   - Recommendation: Lock Game scene to landscape orientation using Scale Manager's orientation constraint. Level Select and Menu can support both.

4. **How much HUD space to reserve for goal display?**
   - What we know: Current HUD is 52px height. Goals display as text: "burger: 10/20 | ice: 5/5". On narrow screens, text may overflow single line.
   - What's unclear: Maximum number of goals per level, length of goal descriptions
   - Recommendation: Review all level JSON files to find max goals per level. If >3 goals possible, increase HUD height or switch to wrapped/stacked layout on narrow screens.

## Sources

### Primary (HIGH confidence)
- [Phaser 3 Scale Manager Documentation](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/scalemanager/) - Official third-party documentation on Scale Manager modes, configuration, and methods
- [Phaser 3 API Documentation - ScaleManager](https://docs.phaser.io/api-documentation/class/scale-scalemanager) - Official API reference for scale configuration options
- [Phaser Examples - Resize Min Max](https://phaser.io/examples/v3/view/scalemanager/resize-min-max) - Official example demonstrating min/max scale constraints
- [MDN - CSS env() Safe Area Insets](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env) - Official documentation on CSS environment variables for safe areas

### Secondary (MEDIUM confidence)
- [Full-Screen Size and Responsive Game in Phaser 3 - Medium](https://medium.com/@tajammalmaqbool11/full-screen-size-and-responsive-game-in-phaser-3-e563c2d60eab) - Community tutorial on responsive scaling patterns
- [Responsive Phaser Game - Matt Colman](https://medium.com/@mattcolman/responsive-phaser-game-54a0e2dafba7) - Community pattern for conditional layouts based on aspect ratio
- [How to Scale a Game for All Device Sizes in Phaser - Josh Morony](https://www.joshmorony.com/how-to-scale-a-game-for-all-device-sizes-in-phaser/) - Community guide on scaling strategies
- [YesViz Device Viewport Sizes](https://yesviz.com/viewport/) - Reference database for device screen dimensions and viewport sizes

### Tertiary (LOW confidence)
- Current codebase - Existing Scale.RESIZE implementation in main.ts and resize handlers in Menu/LevelSelect/Game scenes (verified through code inspection)
- Phase 10 research document - Prior phase work on DPI scaling and Scale.RESIZE migration (internal project documentation)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Phaser 3 Scale Manager well-documented, no additional libraries needed
- Architecture: HIGH - Scale.FIT pattern proven, Scale.RESIZE pattern already implemented in codebase
- Pitfalls: MEDIUM - Common issues documented in community resources, specific project constraints (MAP_WIDTH, grid size) identified through code inspection

**Research date:** 2026-02-10
**Valid until:** 90 days (Phaser 3 scale system is stable, mobile viewport standards evolve slowly)

**Key decision points for planner:**
1. Scale mode choice: FIT (letterboxing, simpler) vs RESIZE (full-screen, complex)
2. Minimum supported viewport: 375px (iPhone SE) vs 768px (larger phones only)
3. Orientation support: landscape-only vs portrait + landscape
4. Safe area handling: CSS env() (recommended) vs JavaScript detection (fallback)
