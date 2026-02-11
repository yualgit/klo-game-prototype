# Phase 22: Collections UX Upgrade - Research

**Researched:** 2026-02-11
**Domain:** Phaser 3 camera bounds, horizontal swiper UI patterns, container layout
**Confidence:** HIGH

## Summary

Phase 22 upgrades the Collections scene from vertical-only scrolling to a modern horizontal card swiper with three distinct improvements: (1) fix camera bounds calculation to prevent over-scroll, (2) implement horizontal snap-to-card navigation for each collection's 6 cards, and (3) add visual polish with colored card container backgrounds.

The current Collections scene (Phase 14) displays 3 collections vertically with 6 cards each in a 2x3 grid layout. The "infinite scroll bug" stems from incorrect camera bounds calculation that adds viewport height to content height, allowing scroll beyond actual content. The horizontal swiper requirement calls for modern carousel UX where each collection's cards display in a single horizontal row (1x6) with swipe-to-navigate and snap-to-card behavior.

**Primary recommendation:** Fix camera bounds by removing `+ height` from worldHeight calculation (Line 90, Collections.ts). Refactor each collection's card layout from vertical 2x3 grid to horizontal 1x6 row using Phaser Container with custom swipe gesture detection (pointer drag) and momentum-snap physics via tweens. Use colored Graphics rectangle (0xffb800, 0.15 alpha) behind card row. No external libraries needed—Phaser's built-in input and tween system handles all requirements.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser 3 | 3.90.0 | Game framework with camera, input, container APIs | Project foundation, already handles drag scroll pattern in LevelSelect |
| TypeScript | 5.7.0 | Type safety for complex layout calculations | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | - | No additional libraries needed | Phaser's camera, container, input, and tween APIs cover all requirements |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom swipe + snap | rexUI ScrollablePanel plugin | rexUI provides built-in snap but adds 50KB+ bundle size and introduces new API to learn. Custom implementation reuses existing project patterns (setupDragScrolling from LevelSelect/Collections). |
| Custom swipe + snap | Swiper.js (DOM library) | Swiper is DOM-based; mixing DOM overlays with Phaser canvas creates z-index conflicts, touch event conflicts, and complicates mobile testing. Phaser-native solution avoids these issues. |
| Container for cards | Grid GameObject | Grid is for visual grids (tiles), not layout management. Container allows grouping, positioning, and scroll transform as single unit. |

**Installation:**
```bash
# No new dependencies required
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── scenes/
│   └── Collections.ts        # Refactor: vertical→horizontal, add snap logic
├── game/
│   └── collectionConfig.ts   # Existing: card metadata, no changes
└── utils/
    └── responsive.ts          # Existing: cssToGame(), no changes
```

### Pattern 1: Camera Bounds for Scrollable Content

**What:** Set camera bounds to match actual content dimensions, not content + viewport.

**When to use:** Any scrollable scene where camera should stop at content edges.

**Example:**
```typescript
// WRONG (current Collections.ts line 90): adds viewport height, causing over-scroll
const worldHeight = contentHeight + height; // allows scroll beyond content

// CORRECT: bounds = content only
const worldHeight = contentHeight; // camera stops at content bottom
this.cameras.main.setBounds(0, 0, width, worldHeight);
```

**Source:** Phaser 3 Camera API - [setBounds documentation](https://docs.phaser.io/api-documentation/class/cameras-scene2d-camera#setBounds), verified in project's LevelSelect.ts (Phase 20) which correctly calculates `worldHeight = Math.max(MAP_HEIGHT, worldBottom)` without adding viewport height.

### Pattern 2: Horizontal Card Container with Manual Scroll

**What:** Group cards in a Phaser Container, translate container.x on drag, clamp to bounds manually since camera is vertical-only.

**When to use:** Horizontal scrolling within a vertical-scrolling scene (mixed-axis layout).

**Example:**
```typescript
// Create container for horizontal card row
const cardContainer = this.add.container(startX, centerY);
const cardWidth = cssToGame(80);
const cardGap = cssToGame(12);

// Add 6 cards horizontally
for (let i = 0; i < cards.length; i++) {
  const card = this.add.image(i * (cardWidth + cardGap), 0, cards[i].textureKey);
  cardContainer.add(card);
}

// Drag scrolling (horizontal)
let dragStartX = 0;
cardContainer.setSize(cardWidth * 6 + cardGap * 5, cardHeight); // hit area
cardContainer.setInteractive();

cardContainer.on('pointerdown', (pointer) => {
  dragStartX = pointer.x;
});

cardContainer.on('pointermove', (pointer) => {
  if (pointer.isDown) {
    const deltaX = pointer.x - pointer.prevPosition.x;
    cardContainer.x += deltaX; // scroll container

    // Clamp to bounds
    const minX = -(cardWidth * 5 + cardGap * 4); // rightmost position
    const maxX = 0; // leftmost position
    cardContainer.x = Phaser.Math.Clamp(cardContainer.x, minX, maxX);
  }
});
```

**Source:** Phaser Container API ([Container docs](https://docs.phaser.io/api-documentation/class/gameobjects-container)), input pattern adapted from project's setupDragScrolling (Collections.ts line 544-569, LevelSelect.ts line 230-271).

### Pattern 3: Snap-to-Card with Momentum Tween

**What:** On pointerup, calculate nearest card index, tween container to snap position with easing.

**When to use:** Carousel/swiper where content should align to discrete positions after drag.

**Example:**
```typescript
cardContainer.on('pointerup', () => {
  // Calculate snap position
  const cardWidth = cssToGame(80);
  const cardGap = cssToGame(12);
  const cardStride = cardWidth + cardGap;

  // Find nearest card index
  const offset = -cardContainer.x; // current scroll offset
  const nearestIndex = Math.round(offset / cardStride);
  const clampedIndex = Phaser.Math.Clamp(nearestIndex, 0, 5); // 6 cards

  // Snap to position
  const targetX = -clampedIndex * cardStride;

  this.tweens.add({
    targets: cardContainer,
    x: targetX,
    duration: 300,
    ease: 'Cubic.Out',
  });
});
```

**Source:** Phaser Tween API ([Tween docs](https://newdocs.phaser.io/docs/3.55.2/focus/Phaser.Tweens.Tween)), snap calculation pattern from [Phaser discourse: snap-to-grid on drag](https://phaser.discourse.group/t/snap-to-grid-on-drag-in-phaser-3/5062).

### Pattern 4: Colored Background Behind Container

**What:** Use Graphics object to draw rounded rectangle with fill style (color + alpha) positioned behind card container.

**When to use:** Visual polish for grouped elements, backdrop for horizontal rows.

**Example:**
```typescript
// Draw colored background (0xffb800, 0.15 alpha)
const bgWidth = cssToGame(6 * 80 + 5 * 12 + 20); // cards + gaps + padding
const bgHeight = cssToGame(cardHeight + 20); // card height + padding
const bgX = containerX - cssToGame(10); // center with padding
const bgY = containerY - bgHeight / 2;

const cardBg = this.add.graphics();
cardBg.fillStyle(0xffb800, 0.15);
cardBg.fillRoundedRect(bgX, bgY, bgWidth, bgHeight, cssToGame(8)); // 8px corner radius
this.allElements.push(cardBg);

// Add container AFTER background (z-order)
this.allElements.push(cardContainer);
```

**Source:** Phaser Graphics API ([Graphics docs](https://docs.phaser.io/api-documentation/class/gameobjects-graphics)), rounded rectangle pattern from project's UIScene.ts button rendering (Phase 13).

### Anti-Patterns to Avoid

- **Adding viewport dimensions to content bounds:** Camera bounds should equal content size, not content + viewport. Adding viewport height/width creates over-scroll "infinite scroll" bug.
- **Using camera.scrollX for horizontal sub-containers:** Camera scroll is scene-level; use Container.x translation for horizontal scrolling within vertical scene.
- **Hardcoding card positions without responsive calculation:** Always use cssToGame() for dimensions and calculate card positions dynamically based on viewport width.
- **Mixing vertical camera scroll with horizontal camera scroll:** Phaser camera is 2D but project uses vertical-only scroll pattern. Keep camera vertical, use Container translation for horizontal.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Gesture recognition (swipe/tap/long-press) | State machine tracking touch sequences | Phaser's built-in pointer events (pointerdown/move/up) with simple drag threshold | Project already uses this pattern in LevelSelect/Collections (10px drag threshold). Adding gesture library introduces complexity for already-solved problem. |
| Smooth scroll momentum physics | Custom velocity/friction simulation | Phaser tweens with easing curves (Cubic.Out, Quad.Out) | Tweens provide 60fps interpolation, automatic completion callbacks, and proven easing. Custom physics requires tuning, edge case handling, and performance optimization. |
| Horizontal card layout manager | Flexbox-style layout engine | Manual positioning via loop: `cardX = i * (cardWidth + gap)` | Only 6 cards, layout is trivial arithmetic. Layout engine adds abstraction overhead for 5 lines of positioning code. |

**Key insight:** For 6-card horizontal row with snap, Phaser's built-in Container + input + tweens provide everything needed. External libraries (rexUI, Swiper.js) solve problems we don't have (complex nested scrolling, DOM integration) while introducing bundle size, API learning curve, and potential version conflicts.

## Common Pitfalls

### Pitfall 1: Camera Bounds Includes Viewport Dimensions

**What goes wrong:** Camera allows scrolling beyond actual content, creating "infinite scroll" or over-scroll effect where user sees blank space below/above content.

**Why it happens:** Confusing content dimensions with visible area. Camera bounds define **world size**, not **visible size**. Viewport (camera dimensions) is separate concept.

**How to avoid:** Calculate content dimensions only: header + N×content blocks + footer. Do NOT add viewport height/width to this calculation.

**Warning signs:** Users report "scrolling too far" or seeing blank space; camera.scrollY exceeds logical content bounds.

**Example:**
```typescript
// WRONG: Collections.ts line 90
const worldHeight = headerOffset + cssToGame(20) + 3 * collectionBlockHeight
  + bottomNavSafeArea + height; // ← BUG: viewport height added

// CORRECT: remove viewport height
const worldHeight = headerOffset + cssToGame(20) + 3 * collectionBlockHeight
  + bottomNavSafeArea;
```

**Source:** Phaser Camera concepts ([Camera bounds documentation](https://docs.phaser.io/phaser/concepts/cameras)), verified by analyzing project's Collections.ts bug at line 90.

### Pitfall 2: Horizontal Container Scroll Conflicts with Vertical Camera Scroll

**What goes wrong:** Dragging horizontally on cards also scrolls camera vertically, making horizontal navigation frustrating.

**Why it happens:** Input events (pointermove) trigger both horizontal container translation and vertical camera scroll simultaneously.

**How to avoid:** Detect drag direction (horizontal vs vertical) and disable camera scroll when horizontal drag detected. Use threshold: if `abs(deltaX) > abs(deltaY)`, it's horizontal drag.

**Warning signs:** Users complain "swiping cards also scrolls the page" or "can't swipe cards without page jumping."

**Example:**
```typescript
// Prevent camera scroll during horizontal card swipe
this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
  if (pointer.isDown) {
    const deltaX = pointer.x - pointer.prevPosition.x;
    const deltaY = pointer.y - pointer.prevPosition.y;

    // Determine drag direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal drag: update card container only, skip camera scroll
      return;
    } else {
      // Vertical drag: update camera scroll
      this.cameras.main.scrollY -= deltaY;
    }
  }
});
```

**Source:** Mobile UX pattern from [Swiper.js touch angle](https://swiperjs.com/swiper-api#param-touchAngle), adapted to Phaser input system.

### Pitfall 3: Snap Position Calculation Ignores Container Origin

**What goes wrong:** Snap-to-card calculates target position incorrectly, causing cards to misalign or snap to wrong card.

**Why it happens:** Container origin (default 0, 0 = top-left) affects how `container.x` relates to child positions. Calculations assume centered origin.

**How to avoid:** Document container origin in comments, calculate snap positions relative to documented origin, or explicitly set origin with `container.setOrigin()` (not supported in Phaser 3—must track manually).

**Warning signs:** Cards snap to "between" positions or snap offset by half-card width.

**Example:**
```typescript
// Container with origin at left edge (x=0 means left edge at x=0)
const cardContainer = this.add.container(startX, centerY);
// Container children added at (0, 0), (cardStride, 0), (2*cardStride, 0), etc.

// CORRECT snap calculation (origin = left edge):
const offset = -cardContainer.x; // how far scrolled from start
const nearestIndex = Math.round(offset / cardStride);
const targetX = -nearestIndex * cardStride; // negative = scroll right

// WRONG if assuming centered origin:
const offset = cardContainer.x - centerX; // incorrect for left-origin container
```

**Source:** Phaser Container behavior ([Container limitations](https://photonstorm.github.io/phaser3-docs/Phaser.GameObjects.Container.html)), experienced from project debugging patterns.

### Pitfall 4: Resize Handler Doesn't Recalculate Horizontal Bounds

**What goes wrong:** After window resize, card container can scroll beyond new viewport width or cards clip off screen.

**Why it happens:** Horizontal bounds (min/max container.x) calculated in create() using initial viewport width. Resize changes width but bounds unchanged.

**How to avoid:** Recalculate horizontal bounds in resize handler, same logic as create(). Reposition card container if it's now out of bounds.

**Warning signs:** Cards disappear after device rotation; horizontal scroll behaves strangely on iOS resize.

**Example:**
```typescript
private handleResize = (gameSize: Phaser.Structs.Size): void => {
  const { width, height } = gameSize;

  // Update camera viewport
  this.cameras.main.setViewport(0, 0, width, height);

  // Recalculate vertical bounds
  const worldHeight = /* same calculation as create() */;
  this.cameras.main.setBounds(0, 0, width, worldHeight);

  // Recalculate horizontal container bounds for each collection
  // (if cards are full-width, bounds change with viewport width)
  this.updateHorizontalBounds(width);

  // Rebuild UI with new dimensions
  this.buildCollectionsUI();
};
```

**Source:** Project pattern from Collections.ts `handleResize` (line 587-595), LevelSelect.ts `handleResize` (line 582-611).

## Code Examples

Verified patterns from official sources and project:

### Camera Bounds for Vertical Scroll
```typescript
// Source: Collections.ts lines 70-96 (refactored)
const width = this.cameras.main.width;
const height = this.cameras.main.height;

// Layout constants
const headerOffset = cssToGame(60);
const bottomNavSafeArea = cssToGame(70);
const cardHeight = cssToGame(80 * (1158 / 696)); // aspect ratio

// Calculate total content height
const collectionBlockHeight = cssToGame(30) + cssToGame(30)
  + cardHeight + cssToGame(20) + cssToGame(50) + cssToGame(50);
const worldHeight = headerOffset + cssToGame(20)
  + 3 * collectionBlockHeight + bottomNavSafeArea;

// Set camera bounds (vertical scroll only)
this.cameras.main.setBounds(0, 0, width, worldHeight);
```

### Horizontal Card Container with Drag Scroll
```typescript
// Source: Adapted from Collections.ts setupDragScrolling + Container API
const cardContainer = this.add.container(startX, startY);
const cardWidth = cssToGame(80);
const cardGap = cssToGame(12);
const cardStride = cardWidth + cardGap;

// Add 6 cards horizontally
for (let i = 0; i < cards.length; i++) {
  const cardImage = this.add.image(i * cardStride, 0, cards[i].textureKey);
  cardImage.setDisplaySize(cardWidth, cardHeight);
  cardContainer.add(cardImage);
}

// Drag scrolling with bounds
let isDraggingCards = false;
let dragStartX = 0;

cardContainer.setSize(cardStride * 6, cardHeight); // interactive area
cardContainer.setInteractive();

cardContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
  isDraggingCards = false;
  dragStartX = pointer.x;
});

cardContainer.on('pointermove', (pointer: Phaser.Input.Pointer) => {
  if (pointer.isDown) {
    const deltaX = pointer.x - pointer.prevPosition.x;

    // Drag threshold
    if (Math.abs(pointer.x - dragStartX) > 10) {
      isDraggingCards = true;
    }

    if (isDraggingCards) {
      cardContainer.x += deltaX;

      // Clamp to bounds
      const minX = -(cardStride * 5); // 5 strides = 6 cards
      const maxX = 0;
      cardContainer.x = Phaser.Math.Clamp(cardContainer.x, minX, maxX);
    }
  }
});
```

### Snap-to-Card on Release
```typescript
// Source: Phaser Tween API + snap calculation pattern
cardContainer.on('pointerup', () => {
  if (isDraggingCards) {
    // Calculate nearest card
    const offset = -cardContainer.x;
    const nearestIndex = Math.round(offset / cardStride);
    const clampedIndex = Phaser.Math.Clamp(nearestIndex, 0, 5);

    // Snap animation
    const targetX = -clampedIndex * cardStride;
    this.tweens.add({
      targets: cardContainer,
      x: targetX,
      duration: 300,
      ease: 'Cubic.Out',
    });
  }

  isDraggingCards = false;
});
```

### Colored Background Rectangle
```typescript
// Source: Phaser Graphics API + project button pattern (UIScene.ts)
const bgWidth = cardStride * 6 + cssToGame(20); // cards + padding
const bgHeight = cardHeight + cssToGame(20);
const bgX = startX - cssToGame(10);
const bgY = startY - bgHeight / 2;

const cardBg = this.add.graphics();
cardBg.fillStyle(0xffb800, 0.15); // golden yellow, 15% opacity
cardBg.fillRoundedRect(bgX, bgY, bgWidth, bgHeight, cssToGame(8)); // 8px radius
this.allElements.push(cardBg); // cleanup tracking
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| DOM-based carousels (Swiper.js, Flickity) for game UI | Canvas-native containers with gesture handling | 2020+ (Phaser 3 maturity) | Eliminates canvas/DOM z-index conflicts, touch event conflicts, and memory overhead from parallel rendering pipelines |
| rexUI plugin for all scrolling | Built-in Phaser APIs for simple cases | 2022+ (bundle size awareness) | Reduces bundle size (rexUI is 50KB+), simpler debugging (no plugin abstraction), faster iteration (no external API learning) |
| Uniform card grid layouts | Mixed-axis layouts (vertical scene scroll + horizontal card rows) | 2024+ (mobile UX trends) | Better mobile UX—vertical scroll for browsing, horizontal swipe for exploring items within category. Matches App Store, Netflix, Spotify patterns. |

**Deprecated/outdated:**
- **Camera bounds = content + viewport:** Incorrect mental model from fixed-size game screens. Modern responsive games separate world size (bounds) from visible size (viewport).
- **External swipe libraries for simple carousels:** Overhead not justified for 6-item horizontal row. Use built-in input + tweens.
- **Grid layouts for all card displays:** Vertical 2x3 grids work on desktop but waste space on mobile (375px wide). Horizontal 1x6 with scroll uses full width, natural swipe gesture.

## Open Questions

1. **Should snap-to-card be always-on or velocity-based?**
   - What we know: Current Collections scene has no momentum/physics. LevelSelect drag scroll is 1:1 with finger (no inertia).
   - What's unclear: Does user expect "fling" gesture with velocity-based snapping, or just drag-and-snap?
   - Recommendation: Start with simple drag-and-snap (no velocity). If user feedback requests "flick" gesture, add velocity calculation on pointerup and adjust snap based on velocity direction/magnitude. Simple case covers 90% of use cases.

2. **Should horizontal swipe disable vertical camera scroll?**
   - What we know: Mobile UX pattern (Swiper.js) uses touch angle detection to disambiguate vertical vs horizontal intent.
   - What's unclear: Is this necessary for 3-collection page, or will natural "drag in primary direction" be sufficient?
   - Recommendation: Implement simple version first (no disambiguation). If user testing shows "fighting" between horizontal card swipe and vertical page scroll, add angle threshold (e.g., if `abs(deltaX) > 2 * abs(deltaY)`, treat as horizontal).

3. **Should card container width adapt to viewport or stay fixed?**
   - What we know: Each collection has 6 cards. Current card width is cssToGame(80) ≈ 160px on 2x DPR.
   - What's unclear: On narrow viewports (375px CSS width), should cards shrink to fit more on screen, or stay fixed and scroll more?
   - Recommendation: Keep fixed card width (80px CSS) for consistency with Phase 14 vertical grid. Cards scroll horizontally. On very wide viewports (tablets), consider max-width constraint on card container (similar to Phase 21 board max-width 1024px).

## Sources

### Primary (HIGH confidence)
- Phaser 3.90.0 Camera API: [setBounds](https://docs.phaser.io/api-documentation/class/cameras-scene2d-camera#setBounds), [scrollY](https://newdocs.phaser.io/docs/3.55.2/focus/Phaser.Cameras.Scene2D.Camera-scrollX)
- Phaser 3.90.0 Container API: [Container](https://docs.phaser.io/api-documentation/class/gameobjects-container)
- Phaser 3.90.0 Graphics API: [Graphics](https://docs.phaser.io/api-documentation/class/gameobjects-graphics)
- Phaser 3.90.0 Tween API: [Tween](https://newdocs.phaser.io/docs/3.55.2/focus/Phaser.Tweens.Tween)
- Project codebase: Collections.ts lines 544-569 (drag scrolling pattern), LevelSelect.ts lines 230-271 (drag pattern), UIScene.ts button rendering (rounded rect pattern)

### Secondary (MEDIUM confidence)
- [Swiper.js API](https://swiperjs.com/swiper-api) - Carousel UX patterns (touch angle, snap pagination)
- [Rex UI ScrollablePanel](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/ui-scrollablepanel/) - Alternative plugin approach (decided against for bundle size)
- [Phaser discourse: snap-to-grid](https://phaser.discourse.group/t/snap-to-grid-on-drag-in-phaser-3/5062) - Snap calculation pattern
- [Building modern sliders with Swiper](https://blog.logrocket.com/building-modern-sliders-html-css-swiper/) - 2025 carousel UX trends

### Tertiary (LOW confidence)
- None - all findings verified with official docs or project code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Phaser 3.90.0 APIs verified in official docs, no new dependencies needed
- Architecture: HIGH - Patterns adapted from existing project code (LevelSelect, Collections, UIScene)
- Pitfalls: HIGH - Camera bounds bug confirmed in Collections.ts line 90, other pitfalls from project debugging experience

**Research date:** 2026-02-11
**Valid until:** 2026-03-11 (30 days - stable Phaser 3 API, no fast-moving dependencies)
