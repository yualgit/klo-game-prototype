# Phase 9: Kyiv Map Experience - Research

**Researched:** 2026-02-10
**Domain:** Phaser 3 camera scrolling, parallax backgrounds, touch/drag input
**Confidence:** HIGH

## Summary

This phase transforms the static LevelSelect scene into a vertically-scrollable Kyiv-themed map experience with parallax layers, drag/swipe gestures, and auto-scroll camera positioning. The implementation leverages Phaser 3's built-in camera system with scroll properties (`scrollX`, `scrollY`), parallax effects via `setScrollFactor()`, and input drag detection to distinguish taps from swipes.

**Core technical approach:** Extend camera bounds beyond viewport, implement drag-based camera scrolling with pointer events, apply scroll factors to create depth, and use camera pan effects for smooth auto-positioning to current level.

**Primary recommendation:** Use native Phaser 3 camera scrolling APIs (no external plugins needed). Implement custom drag handler that tracks pointer movement to distinguish tap (0 delta) vs. drag (>threshold delta). Apply different scroll factors (0.1-1.0) to background layers for parallax depth.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser | 3.90.0 | Game engine with camera system | Already in project, mature camera APIs |
| TypeScript | 5.7.0 | Type safety for complex input logic | Project standard, prevents input bugs |
| Vite | 6.0.0 | Build system | Current project setup |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | - | All features are built-in | Phaser 3 includes everything needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native camera scrolling | phaser3-scrolling-camera plugin | Plugin adds 3KB and wrapper abstraction; native APIs are sufficient for vertical-only scrolling |
| Native parallax (setScrollFactor) | Rex UI ScrollablePanel | Rex plugin is 15KB+ and designed for UI panels, not full-scene map backgrounds |
| Custom drag detection | Third-party gesture library | Adds dependencies; Phaser's pointer events + thresholds handle tap vs. drag well |

**Installation:**
```bash
# No additional packages needed - all features built into Phaser 3.90.0
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── scenes/
│   └── LevelSelect.ts        # Enhanced with scrolling + parallax
├── game/
│   └── constants.ts           # Add MAP_CONFIG with scroll bounds, parallax factors
└── assets/
    └── backgrounds/
        ├── kyiv_sky.png       # Scroll factor 0 (static)
        ├── kyiv_far.png       # Scroll factor 0.3 (distant landmarks)
        ├── kyiv_mid.png       # Scroll factor 0.6 (middle ground)
        └── kyiv_near.png      # Scroll factor 1.0 (foreground details)
```

### Pattern 1: Camera Scroll Bounds with Drag Handler

**What:** Set camera bounds larger than viewport, then scroll camera position based on pointer drag delta.

**When to use:** When entire scene must be draggable (not just specific objects).

**Example:**
```typescript
// Set camera bounds to accommodate tall map (10 levels vertically)
const mapHeight = 2000; // Tall enough for 10 level nodes + spacing
this.cameras.main.setBounds(0, 0, width, mapHeight);

// Track drag state
let isDragging = false;
let dragStartY = 0;

// Listen to pointer events on scene background
this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
  isDragging = false;
  dragStartY = pointer.y;
});

this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
  if (pointer.isDown) {
    const deltaY = pointer.y - pointer.prevPosition.y;
    // Threshold check: if moved >8px, it's a drag
    if (Math.abs(pointer.y - dragStartY) > 8) {
      isDragging = true;
    }
    // Scroll camera (invert delta for natural feel)
    this.cameras.main.scrollY -= deltaY;
  }
});

this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
  if (!isDragging) {
    // Was a tap - check if level node was tapped
    // Handle level selection
  }
  isDragging = false;
});
```

**Source:** Based on [Emanuele Feronato's Level Select Tutorial](https://emanueleferonato.com/2021/12/16/build-a-highly-customizable-mobile-friendly-html5-level-selection-screen-controllable-by-tap-and-swipe-written-in-typescript-and-powered-by-phaser/) and [Phaser scrolling camera examples](https://phaser.discourse.group/t/phaser-3-scrolling-camera-by-drag/2169)

### Pattern 2: Parallax Layers with setScrollFactor

**What:** Create multiple background sprites/images with different scroll factors to simulate depth.

**When to use:** For visual storytelling and depth perception in map backgrounds.

**Example:**
```typescript
// Layer 1: Static sky (doesn't scroll with camera)
const sky = this.add.image(width/2, 300, 'kyiv_sky');
sky.setScrollFactor(0); // Completely static

// Layer 2: Distant landmarks (Kyiv skyline, Golden Gate far away)
const farBg = this.add.image(width/2, 400, 'kyiv_far');
farBg.setScrollFactor(0.3); // Scrolls 30% as fast as camera

// Layer 3: Mid-ground (buildings, streets)
const midBg = this.add.image(width/2, 600, 'kyiv_mid');
midBg.setScrollFactor(0.6); // Scrolls 60% as fast

// Layer 4: Foreground elements move with camera
// (Level nodes, path, decorative trees)
// Default scrollFactor = 1.0
```

**Source:** [Ourcade Parallax Tutorial](https://blog.ourcade.co/posts/2020/add-pizazz-parallax-scrolling-phaser-3/) and [Rex's Phaser 3 Notes on Camera Effects](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/camera-effects/)

### Pattern 3: Auto-Scroll to Current Level on Scene Start

**What:** Use `camera.pan()` effect to smoothly scroll to the current unlocked level position when scene opens.

**When to use:** Initial camera positioning to focus user on their progress.

**Example:**
```typescript
create(): void {
  // ... setup camera bounds, background, level nodes ...

  // Determine current level node position
  const currentLevelId = this.getCurrentLevel(progress);
  const targetNode = this.levelNodes[currentLevelId - 1];

  // Pan camera to center on current level (smooth animation)
  this.cameras.main.pan(
    targetNode.x,
    targetNode.y,
    800,           // Duration: 800ms
    'Sine.easeInOut', // Smooth ease
    true,          // Force pan even if already close
    (camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress === 1) {
        console.log('[LevelSelect] Camera focused on current level');
      }
    }
  );
}
```

**Source:** [Phaser 3 Camera Pan API](https://newdocs.phaser.io/docs/3.60.0/focus/Phaser.Cameras.Scene2D.Camera-pan) and [Camera Effects documentation](https://docs.phaser.io/api-documentation/class/cameras-scene2d-effects-pan)

### Pattern 4: Distinguishing Tap from Drag

**What:** Track pointer movement distance; if delta is 0 or < threshold, treat as tap; otherwise, treat as drag.

**When to use:** When UI elements need to respond to taps while background needs drag scrolling.

**Example:**
```typescript
// Method from Emanuele Feronato's tutorial
private handlePointerUp(pointer: Phaser.Input.Pointer): void {
  const deltaX = pointer.downX - pointer.position.x;
  const deltaY = pointer.downY - pointer.position.y;

  // Calculate total movement
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  if (distance < 10) {
    // Tap detected (moved less than 10 pixels)
    this.handleTap(pointer);
  } else {
    // Drag detected
    this.handleDragEnd(pointer);
  }
}
```

**Source:** [Emanuele Feronato's implementation](https://emanueleferonato.com/2021/12/16/build-a-highly-customizable-mobile-friendly-html5-level-selection-screen-controllable-by-tap-and-swipe-written-in-typescript-and-powered-by-phaser/)

### Anti-Patterns to Avoid

- **Using `dragDistanceThreshold` on entire scene:** This is a per-game-object setting, not scene-wide. For scene dragging, manually track pointer deltas instead.
- **Creating camera bounds smaller than content:** Results in rubber-banding or inability to scroll to all levels. Always ensure bounds accommodate full map height.
- **Applying parallax to interactive elements:** Level nodes should have `scrollFactor = 1.0` (default) so they move 1:1 with camera; otherwise, tap hit detection breaks.
- **Setting TileSprite larger than canvas:** For repeating backgrounds, keep TileSprite at canvas size and scroll its `tilePosition`, not the sprite itself.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Camera scrolling system | Custom viewport + manual object repositioning | Phaser 3 `camera.scrollX/Y` + `setBounds()` | Camera handles culling, scroll clamping, and coordinate transforms automatically |
| Parallax depth effect | Manual layer speed calculations per frame | `gameObject.setScrollFactor(0-1)` | Built-in, performant, handles edge cases (zoom, shake) correctly |
| Smooth camera movement | Manual lerp/tween on camera position | `camera.pan(x, y, duration, ease)` | Pan effect is optimized, chainable, and includes completion callbacks |
| Drag inertia/momentum | Physics simulation for swipe deceleration | Simple `scrollY -= delta` or Phaser's built-in drag + friction if needed | Camera bounds automatically clamp; inertia adds complexity for vertical-only map |

**Key insight:** Phaser 3's camera system is a mature, well-tested abstraction. Custom implementations introduce bugs (hit testing breaks, culling fails, coordinate transforms drift). Always prefer camera APIs over manual scene scrolling.

## Common Pitfalls

### Pitfall 1: Interactive Elements Behind Draggable Background

**What goes wrong:** User tries to tap level node, but pointer events are consumed by background drag handler, preventing button clicks.

**Why it happens:** Pointer events bubble to all listeners; if scene-level drag handler is always active, it captures all pointer input.

**How to avoid:**
- Use a flag to track if pointer moved significantly (e.g., `>8px`) before enabling drag mode.
- Only trigger drag scrolling if `isDragging === true` (set when threshold exceeded).
- On `pointerup`, check `isDragging`: if false, process as tap and check hit testing for level nodes.

**Warning signs:** Level nodes appear interactive (hover effects work) but don't trigger on tap; console logs show drag handler always firing.

### Pitfall 2: Parallax Breaks Hit Testing

**What goes wrong:** Level node buttons with `scrollFactor !== 1.0` have misaligned hit areas—tap location doesn't match visual position.

**Why it happens:** Phaser's input system assumes `scrollFactor = 1.0` for coordinate transforms. When object has different factor, camera scrolling shifts visual position but hit area remains tied to original coordinates.

**How to avoid:**
- Always keep interactive game objects at `scrollFactor = 1.0` (default).
- Apply parallax only to non-interactive background layers.
- If you must have interactive parallax objects, use Phaser's Containers with custom hit area calculations (advanced).

**Warning signs:** Buttons become tappable offset from their visual position; hit areas "lag behind" when scrolling.

### Pitfall 3: Camera Bounds Too Small or Missing

**What goes wrong:** Camera scrolls "too far" and shows empty space, or can't scroll to all levels, creating invisible/unreachable content.

**Why it happens:** Forgetting to set `camera.setBounds()` or calculating map height incorrectly (e.g., forgetting spacing between level nodes).

**How to avoid:**
- Calculate total map height: `mapHeight = (numLevels * nodeSpacing) + topMargin + bottomMargin`.
- Set bounds before any scrolling: `this.cameras.main.setBounds(0, 0, width, mapHeight)`.
- Test by manually scrolling to top and bottom—ensure no "black void" appears.

**Warning signs:** Camera scrolls into black/empty space beyond last level; first/last level unreachable.

### Pitfall 4: Drag Threshold Too Sensitive or Too High

**What goes wrong:**
- **Too sensitive (e.g., 2px):** Every tap registers as drag; level nodes can't be clicked.
- **Too high (e.g., 50px):** Drag feels unresponsive; user must swipe aggressively before map scrolls.

**Why it happens:** No universal "correct" threshold—depends on device DPI and user expectations.

**How to avoid:**
- Start with **8-12 pixels** as threshold (works well for mobile and desktop).
- Test on real devices (mobile touch vs. desktop mouse feel different).
- Consider making it configurable in settings if users complain.

**Warning signs:** Playtest feedback: "Buttons don't work" (too sensitive) or "Map feels stuck" (too high).

### Pitfall 5: Forgetting to Clamp Camera Scroll

**What goes wrong:** User drags map beyond bounds, causing camera to show area outside setBounds (if bounds not enforced).

**Why it happens:** Manual `camera.scrollY -= delta` doesn't automatically respect bounds—it's just assignment.

**How to avoid:**
- Always call `camera.setBounds()` before any scrolling.
- Phaser's camera automatically clamps scroll if bounds are set.
- If manually overriding scroll, use `Phaser.Math.Clamp(scrollY, minY, maxY)`.

**Warning signs:** Camera scrolls into "undefined" areas; map background shows edge artifacts.

## Code Examples

Verified patterns from official sources:

### Vertical Scrolling Camera Setup

```typescript
// Source: Phaser 3 Camera API + community best practices
export class LevelSelect extends Phaser.Scene {
  private isDragging: boolean = false;
  private dragStartY: number = 0;

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Calculate map height (10 levels, ~180px spacing each)
    const mapHeight = 2000;

    // Set camera bounds to allow scrolling
    this.cameras.main.setBounds(0, 0, width, mapHeight);

    // Create parallax background layers
    this.createParallaxBackground(width, mapHeight);

    // Create level nodes (scrollFactor = 1.0 by default)
    this.createLevelNodes();

    // Auto-scroll to current level on scene start
    this.scrollToCurrentLevel();

    // Setup drag handlers
    this.setupDragScrolling();
  }

  private setupDragScrolling(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = false;
      this.dragStartY = pointer.y;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        const deltaY = pointer.y - pointer.prevPosition.y;
        const totalDelta = Math.abs(pointer.y - this.dragStartY);

        // Threshold: 8px movement = drag mode
        if (totalDelta > 8) {
          this.isDragging = true;
        }

        if (this.isDragging) {
          // Scroll camera (invert for natural feel)
          this.cameras.main.scrollY -= deltaY;
        }
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging) {
        // Was a tap - handle level selection via hit testing
        this.handleTap(pointer);
      }
      this.isDragging = false;
    });
  }
}
```

### Creating Parallax Background Layers

```typescript
// Source: https://blog.ourcade.co/posts/2020/add-pizazz-parallax-scrolling-phaser-3/
private createParallaxBackground(width: number, mapHeight: number): void {
  // Layer 1: Sky (static, doesn't scroll)
  const sky = this.add.rectangle(width / 2, mapHeight / 2, width, mapHeight, 0x87CEEB);
  sky.setScrollFactor(0);

  // Layer 2: Far background (distant Kyiv landmarks)
  // In production: this.add.image(x, y, 'kyiv_far_bg')
  const farBg = this.add.rectangle(width / 2, mapHeight / 2, width, mapHeight, 0xCCCCCC, 0.3);
  farBg.setScrollFactor(0.25); // Scrolls 25% speed

  // Layer 3: Mid background (streets, buildings)
  const midBg = this.add.rectangle(width / 2, mapHeight / 2, width, mapHeight, 0xAAAAAA, 0.2);
  midBg.setScrollFactor(0.6); // Scrolls 60% speed

  // Foreground elements (level path, nodes) use default scrollFactor = 1.0
}
```

### Auto-Scroll to Current Level with Pan Effect

```typescript
// Source: https://newdocs.phaser.io/docs/3.60.0/focus/Phaser.Cameras.Scene2D.Camera-pan
private scrollToCurrentLevel(): void {
  const progress = this.registry.get('progress') as ProgressManager;
  const currentLevelId = this.getCurrentLevel(progress);

  if (currentLevelId > 0 && currentLevelId <= 10) {
    const targetNode = this.levelNodes[currentLevelId - 1];

    // Pan camera to center level in viewport
    this.cameras.main.pan(
      targetNode.x,
      targetNode.y,
      800,              // 800ms smooth animation
      'Sine.easeInOut', // Smooth ease curve
      true              // Force pan
    );
  }
}
```

### Handling Tap vs. Drag

```typescript
// Source: https://emanueleferonato.com/2021/12/16/...
private handleTap(pointer: Phaser.Input.Pointer): void {
  // Check if pointer hit any level node
  const hitObjects = this.input.hitTestPointer(pointer);

  for (const obj of hitObjects) {
    // Check if it's a level container (you'd tag these with .setData('levelId', id))
    const levelId = obj.getData('levelId');
    if (levelId) {
      this.startLevel(levelId);
      return;
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual object repositioning for scrolling | Camera `scrollX/Y` with bounds | Phaser 3.0+ (2018) | Camera handles culling, transforms, effects automatically |
| Custom parallax math in update loop | `setScrollFactor()` per layer | Phaser 3.0+ | Declarative parallax, no performance cost |
| `setVisible(false)` for offscreen culling | Camera bounds auto-culling | Phaser 3.0+ | Camera culls based on bounds; no manual visibility management |
| Third-party gesture libraries | Native pointer events + thresholds | Phaser 3.10+ (2019) | Pointer API mature enough for tap/drag distinction |

**Deprecated/outdated:**
- **Phaser 2 `game.camera.follow()`:** Replaced by Phaser 3 `camera.startFollow(target, lerp)` with smoother API.
- **External scrolling plugins:** Most are unmaintained; Phaser 3's native camera system handles all use cases.
- **jQuery/Hammer.js for touch gestures:** Phaser 3's input system handles touch natively; external libs add bloat.

## Open Questions

1. **Should we implement swipe momentum/inertia for "fling" gestures?**
   - What we know: Phaser doesn't have built-in inertia; requires manual velocity + friction simulation.
   - What's unclear: Does vertical-only scrolling benefit from inertia, or is direct drag sufficient?
   - Recommendation: **Start without inertia** (simpler, less code). Add in Phase 10 if playtesting shows users expect "fling" behavior.

2. **How to handle very tall maps (50+ levels in future)?**
   - What we know: Camera bounds can be arbitrarily large; culling is automatic.
   - What's unclear: Performance impact of 50+ game objects (level nodes) in scene simultaneously.
   - Recommendation: **Current approach scales to ~30 levels** without issue. For 50+, consider object pooling or "lazy loading" level nodes as user scrolls.

3. **Should parallax layers be TileSprites (repeating) or single large images?**
   - What we know: TileSprites repeat seamlessly; single images are simpler but require tall assets.
   - What's unclear: Art pipeline—will designers provide tileable patterns or full-height map art?
   - Recommendation: **Start with single images** (simpler). If map grows very tall (>2000px), switch to TileSprites with `tilePositionY` scrolling.

## Sources

### Primary (HIGH confidence)
- [Phaser 3 Camera API - newdocs.phaser.io](https://newdocs.phaser.io/docs/3.55.2/Phaser.Cameras.Scene2D.Camera) - Official API docs for camera properties and methods
- [Phaser 3 Camera Effects - docs.phaser.io](https://docs.phaser.io/api-documentation/class/cameras-scene2d-effects-pan) - Pan effect documentation
- [Rex's Phaser 3 Notes: Camera Effects](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/camera-effects/) - Comprehensive community guide
- [Rex's Phaser 3 Notes: Drag Detection](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/drag/) - Drag configuration and events

### Secondary (MEDIUM confidence)
- [Ourcade: Parallax Scrolling Tutorial](https://blog.ourcade.co/posts/2020/add-pizazz-parallax-scrolling-phaser-3/) - Practical parallax implementation with setScrollFactor
- [Emanuele Feronato: Level Select Screen (Phaser 3 + TypeScript)](https://emanueleferonato.com/2021/12/16/build-a-highly-customizable-mobile-friendly-html5-level-selection-screen-controllable-by-tap-and-swipe-written-in-typescript-and-powered-by-phaser/) - Complete tap vs. swipe implementation
- [Phaser Examples: Drag Distance Threshold](https://phaser.io/examples/v3.85.0/input/dragging/view/drag-distance-threshold) - Official example for threshold configuration
- [Phaser Discourse: Scrolling Camera by Drag](https://phaser.discourse.group/t/phaser-3-scrolling-camera-by-drag/2169) - Community discussion on drag-based camera control

### Tertiary (LOW confidence)
- [Phaser News: Scrolling Level Map Tutorial (2015)](https://phaser.io/news/2015/01/create-scrolling-level-map) - Phaser 2 approach, concepts still relevant but API outdated
- [GitHub: phaser3-scrolling-camera plugin](https://github.com/jjcapellan/Phaser3-ScrollingCamera) - Community plugin showing drag patterns (not needed, but good reference)

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** - Phaser 3.90.0 includes all required APIs; no external dependencies needed
- Architecture: **HIGH** - Camera scrolling + parallax patterns are well-documented with official examples
- Pitfalls: **MEDIUM** - Tap vs. drag threshold is device-dependent; may need tuning during playtesting

**Research date:** 2026-02-10
**Valid until:** 2026-04-10 (60 days — Phaser 3 camera APIs are stable, unlikely to change)
