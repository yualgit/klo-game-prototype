# Phase 20: Level Select Improvements - Research

**Researched:** 2026-02-11
**Domain:** Phaser 3 responsive layout, mobile viewport adaptation, input event handling
**Confidence:** HIGH

## Summary

Phase 20 addresses two distinct issues in the LevelSelect scene: (1) level nodes currently span 1800px vertically but need to fit within typical mobile viewports (667-844px), requiring reduced spacing, and (2) level button interactivity breaks after scene transitions due to stale input event listeners and camera viewport issues.

The current implementation uses a scrollable map (MAP_CONFIG.MAP_HEIGHT = 2200px) with 10 level nodes spaced ~200px apart (y: 2050 down to y: 250), requiring vertical scrolling on mobile. LVLS-01 requires eliminating scroll by compacting nodes to fit within viewport height. LVLS-02 addresses a known Phaser 3 pattern where scene-level pointer listeners (`this.input.on('pointerup')`) and container interactivity persist incorrectly after scene restart/stop/start cycles, causing tap detection to fail.

**Primary recommendation:** For LVLS-01, reduce MAP_CONFIG node spacing dynamically based on viewport height (detect mobile via height < 800px threshold, apply 50-60% spacing reduction). For LVLS-02, replace custom tap detection with direct container event handlers (container.on('pointerup')) which are properly cleaned up on scene shutdown, and ensure handleResize updates camera viewport on every resize event.

## Current State Analysis

### Existing Layout (from codebase)

Current MAP_CONFIG.LEVEL_NODES spacing:
- Total vertical span: 1800px (y: 2050 → 250)
- Average spacing between nodes: ~200px
- Map height: 2200px (includes 150px bottom padding)
- Nodes positioned along winding horizontal path (x: 260-650)

Mobile viewport constraints (from web search):
- iPhone SE (smallest common): 375x667 viewport
- iPhone 15/16 base: 390x844 viewport
- Mid-range Android: 360x740-800 viewport
- Coverage: 360px and 375px widths represent 50%+ of traffic

**Current behavior:** All 10 nodes require scrolling on mobile (1800px span vs 667-844px viewport).

### Interaction Pattern Issues

Current implementation in LevelSelect.ts:
```typescript
// Lines 196-223: Scene-level pointer event listeners
this.input.on('pointerdown', ...);
this.input.on('pointermove', ...);
this.input.on('pointerup', (pointer) => {
  if (!this.isDragging && !this.overlayActive) {
    this.handleTap(pointer);
  }
});

// Lines 226-259: handleTap converts screen → world coords, checks bounds
private handleTap(pointer: Phaser.Input.Pointer): void {
  const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
  for (let i = 0; i < this.levelNodes.length; i++) {
    const container = this.levelNodes[i];
    const bounds = container.getBounds();
    if (Phaser.Geom.Rectangle.Contains(bounds, worldPoint.x, worldPoint.y)) {
      // Start level
    }
  }
}

// Lines 497-499: Containers set interactive but no event handlers
if (unlocked) {
  container.setInteractive({ useHandCursor: true });
}

// Lines 562-565: Cleanup in shutdown
this.input.off('pointerdown');
this.input.off('pointermove');
this.input.off('pointerup');
```

**Known issues from Phaser community:**
- Scene-level input listeners can persist incorrectly after `scene.stop()` / `scene.start()` cycles
- Camera viewport must be updated via `setViewport()` on resize for input coordinate translation to work
- Container `getBounds()` can return stale values if camera viewport not updated
- Direct container event handlers (container.on('pointerup')) are safer than scene-level listeners

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser 3 | 3.85.0 | Game engine with scene management, input system, camera controls | Industry standard for 2D HTML5 games |
| Phaser.Scale.RESIZE | Built-in | Dynamic viewport resizing for mobile | Recommended for responsive games (vs FIT which scales uniformly) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| cssToGame() / getDpr() | Custom util | DPR-aware coordinate conversion | Already in use; every CSS pixel → game coordinate conversion |
| getResponsiveLayout() | Custom util | Compute responsive sizing based on viewport | Already in use; provides layout breakpoints |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dynamic spacing based on viewport | Fixed smaller spacing (e.g., 120px) | Fixed spacing is simpler but may not work on all devices; dynamic ensures optimal fit |
| Scene-level input handlers | Container-level event handlers | Container handlers are more reliable but require careful depth/z-order management |
| Single MAP_CONFIG | Device-specific configs | Multiple configs add complexity; single dynamic config is maintainable |

**No installation needed** — all solutions use existing Phaser 3 APIs and project utilities.

## Architecture Patterns

### Pattern 1: Dynamic Responsive Spacing

**What:** Adjust MAP_CONFIG.LEVEL_NODES spacing at runtime based on viewport height.

**When to use:** When a fixed layout designed for one viewport must adapt to multiple device sizes without scrolling.

**Example:**
```typescript
// Detect mobile viewport (height < threshold)
const isMobile = height < 800;

// Calculate spacing reduction factor
const totalNodes = 10;
const nodeHeight = cssToGame(38 + 25 + 25); // button + stars + label
const availableHeight = height - cssToGame(60); // minus header
const targetSpacing = (availableHeight - (totalNodes * nodeHeight)) / (totalNodes - 1);
const spacingFactor = targetSpacing / 200; // 200 = current avg spacing

// Apply to drawRoadPath and node positioning
```

**Source:** Derived from Phaser Scale.RESIZE best practices ([Scale Manager Docs](https://docs.phaser.io/phaser/concepts/scale-manager), [Scale Manager Notes](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/scalemanager/))

### Pattern 2: Container Direct Event Handlers

**What:** Replace scene-level tap detection with direct container event handlers.

**When to use:** When interactive containers need reliable input across scene transitions.

**Example:**
```typescript
// INSTEAD OF: scene-level listener + manual bounds checking
this.input.on('pointerup', this.handleTap);

// USE: direct container handler
container.on('pointerup', () => {
  // Handle click directly
  this.startLevel(levelId);
});

// Containers auto-cleanup their listeners on destroy
```

**Source:** Phaser community patterns ([How to set container interactive](https://phaser.discourse.group/t/how-to-set-container-interactive/2967), [Container Notes](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/container/))

### Pattern 3: Camera Viewport Update on Resize

**What:** Call `camera.setViewport()` in resize handler to ensure input coordinate translation works.

**When to use:** Always, when using Scale.RESIZE mode with interactive game objects.

**Example:**
```typescript
private handleResize(gameSize: Phaser.Structs.Size): void {
  const { width, height } = gameSize;

  // CRITICAL: Update camera viewport for input to work
  this.cameras.main.setViewport(0, 0, width, height);

  // Then update bounds, scroll, etc.
  this.cameras.main.setBounds(0, 0, width, worldHeight);
}
```

**Source:** Phaser camera API docs ([setViewport](https://newdocs.phaser.io/docs/3.54.0/focus/Phaser.Cameras.Scene2D.Camera-setViewport), [Camera Docs](https://docs.phaser.io/api-documentation/class/cameras-scene2d-camera))

**Already implemented:** LevelSelect.ts line 543 correctly calls `setViewport()` in handleResize.

### Anti-Patterns to Avoid

- **Don't rely on scene-level input.on() for per-object interaction:** Scene-level listeners can persist incorrectly after scene stop/start cycles. Use container.on() for object-specific handlers.
- **Don't skip camera.setViewport() on resize:** Input coordinate translation (screen → world) breaks without viewport updates.
- **Don't use getBounds() without recent camera update:** Bounds calculations depend on current camera state; stale camera = wrong bounds.
- **Don't hardcode spacing for "mobile":** Viewport heights vary widely (667-932px); use dynamic calculation based on actual available height.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mobile viewport detection | Custom device sniffing, UA parsing | Compare viewport dimensions (width < 600, height < 800) | Viewport size is direct, reliable, forward-compatible; UA parsing breaks with new devices |
| Responsive spacing calculation | Manually tuned breakpoints (if < 700: 100px, if < 800: 150px) | Formula: (availableHeight - totalNodeHeight) / (nodeCount - 1) | Formula adapts to ANY viewport height automatically |
| Input event cleanup | Manual tracking of handlers to remove | Container event handlers + destroy() | Containers auto-cleanup listeners on destroy; manual tracking is error-prone |
| Coordinate translation (screen → world) | Custom math based on camera position/scroll | `camera.getWorldPoint(x, y)` | Phaser handles all camera transforms (scroll, zoom, rotation); manual math will break |

**Key insight:** Phaser's input system and camera API are battle-tested for edge cases (multi-touch, zoom, rotation, parallax). Custom implementations miss these cases and break on resize/navigation.

## Common Pitfalls

### Pitfall 1: Input Events Stop Firing After Scene Restart

**What goes wrong:** Level buttons work initially, but after navigating away and back (scene.stop → scene.start), taps are ignored.

**Why it happens:**
- Scene-level `this.input.on()` listeners can persist incorrectly or reference stale camera state
- `camera.getWorldPoint()` returns wrong coordinates if viewport not updated after resize
- Container `getBounds()` uses stale transform data if camera changed but bounds not recalculated

**How to avoid:**
1. Use container.on('pointerup') instead of scene-level input.on('pointerup')
2. Call `camera.setViewport()` in handleResize (already done in line 543)
3. Ensure containers are destroyed (via this.levelNodes = [] in shutdown) so listeners clean up
4. Test navigation: LevelSelect → Collections → LevelSelect → tap level button

**Warning signs:**
- Buttons work on first visit but not after returning from another scene
- `console.log()` in handleTap shows it's not being called
- Setting cursor: pointer works but click doesn't fire

**Source:** [Problem with setInteractive function](https://phaser.discourse.group/t/problem-with-setinteractive-function/3261), [Interactive object inside invisible container](https://github.com/photonstorm/phaser/issues/3620)

### Pitfall 2: Fixed Spacing Clips Nodes Off-Screen on Small Devices

**What goes wrong:** On small viewports (e.g., iPhone SE 375x667), nodes at the top or bottom are cut off, requiring scroll despite "fit all nodes" goal.

**Why it happens:**
- Fixed 200px spacing assumes ~2000px available height (10 nodes × 200px spacing)
- Actual mobile viewports: 600-850px available height (minus header)
- Fixed spacing doesn't adapt; nodes overflow viewport

**How to avoid:**
1. Calculate available height: `viewport height - header height - bottom nav height - padding`
2. Calculate total node height: `node count × (button size + star text + label height + internal padding)`
3. Divide remaining space by (node count - 1) to get dynamic spacing
4. Use Math.max(minSpacing, calculatedSpacing) to prevent nodes from overlapping on tiny screens

**Warning signs:**
- Scroll is still required on mobile despite "all nodes fit" goal
- Top or bottom nodes are partially off-screen
- Spacing looks cramped on large screens or too loose on desktop

### Pitfall 3: Drag Scroll Interferes with Tap Detection

**What goes wrong:** User taps a level button, but because of slight finger movement, `isDragging` becomes true and tap is ignored.

**Why it happens:**
- Drag threshold (MAP_CONFIG.DRAG_THRESHOLD = 10px) is checked in pointermove
- If finger moves >10px between pointerdown and pointerup, isDragging = true
- handleTap only fires if `!isDragging`

**How to avoid:**
1. Keep current pattern (already correct): only set isDragging if threshold exceeded
2. Ensure threshold is reasonable (10px is good; <5px causes false drags, >20px misses real drags)
3. Test on real mobile devices (emulators don't simulate finger jitter accurately)

**Warning signs:**
- Buttons sometimes respond, sometimes don't
- More failures when user is moving (e.g., on a bus)
- Issue disappears on desktop/mouse but fails on touch

**Already implemented correctly:** LevelSelect.ts lines 207-209 check threshold before enabling drag mode.

## Code Examples

Verified patterns from official sources and current codebase:

### Dynamic Spacing Calculation (Mobile Adaptation)

```typescript
// Calculate spacing to fit all nodes in viewport
function calculateNodeSpacing(viewportHeight: number): number {
  const headerHeight = cssToGame(50);
  const bottomNavHeight = cssToGame(60);
  const topPadding = cssToGame(20);
  const bottomPadding = cssToGame(20);

  const availableHeight = viewportHeight - headerHeight - bottomNavHeight - topPadding - bottomPadding;

  // Node visual height: button (38) + star text (10) + label (8) + spacing between elements (25+10)
  const nodeVisualHeight = cssToGame(38 + 25 + 10 + 10);
  const nodeCount = 10;

  const totalNodeHeight = nodeCount * nodeVisualHeight;
  const remainingHeight = availableHeight - totalNodeHeight;

  // Divide remaining space among gaps (nodeCount - 1 gaps between 10 nodes)
  const spacing = remainingHeight / (nodeCount - 1);

  // Clamp to prevent overlap (min 80px) or excessive spacing (max 250px)
  return Math.max(80, Math.min(250, spacing));
}
```

### Container Direct Event Handler (Replacing Scene-Level Tap Detection)

```typescript
// Current pattern (scene-level, can break on restart):
this.input.on('pointerup', (pointer) => {
  if (!this.isDragging) {
    this.handleTap(pointer); // Manual bounds checking
  }
});

// Recommended pattern (container-level, reliable):
private createLevelCheckpoint(...) {
  const container = this.add.container(x, y, children);

  if (unlocked) {
    container.setInteractive({ useHandCursor: true });

    // Direct handler on container
    container.on('pointerup', () => {
      if (!this.isDragging && !this.overlayActive) {
        this.startLevel(levelId);
      }
    });
  }

  // Container.destroy() auto-removes listeners
}

// Separate method for level start logic
private startLevel(levelId: number): void {
  const economy = this.registry.get('economy') as EconomyManager;

  if (!economy.canStartLevel()) {
    this.showNoLivesPrompt(economy);
    return;
  }

  this.cameras.main.fadeOut(300, 0, 0, 0);
  this.cameras.main.once('camerafadeoutcomplete', () => {
    this.scene.start('Game', { levelId });
  });
}
```

**Source:** [Container Interactive](https://phaser.discourse.group/t/how-to-set-container-interactive/2967), [Touch Events](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/touchevents/)

### Camera Viewport Update on Resize (Already Implemented)

```typescript
// From LevelSelect.ts lines 536-553
private handleResize(gameSize: Phaser.Structs.Size): void {
  const { width, height } = gameSize;

  // Recompute layout
  this.layout = getResponsiveLayout(width, height);

  // CRITICAL: Update camera viewport for input coordinate translation
  this.cameras.main.setViewport(0, 0, width, height);

  // Update world bounds
  const firstLevelY = MAP_CONFIG.LEVEL_NODES[0].y;
  const worldBottom = firstLevelY + Math.round(height * 0.3);
  const worldHeight = Math.max(MAP_CONFIG.MAP_HEIGHT, worldBottom);
  this.cameras.main.setBounds(0, 0, width, worldHeight);

  // Preserve Y scroll position
  this.cameras.main.setScroll(0, this.cameras.main.scrollY);
}
```

**Source:** [Camera setViewport](https://newdocs.phaser.io/docs/3.54.0/focus/Phaser.Cameras.Scene2D.Camera-setViewport)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Scale.FIT (uniform scale, letterboxing) | Scale.RESIZE (native resolution, responsive layout) | v1.2 (Phase 12) | Better mobile UX; text readable; requires responsive sizing logic |
| Fixed 1024x768 design resolution | Dynamic viewport with DPR awareness | v1.2 (Phase 12) | Crisp rendering on retina; coordinates = device pixels |
| Scene-level input handlers for all interactions | Mixed: scene-level for drag scroll, container-level for buttons | v1.1 (Phase 9) | Drag scroll works but button tap detection fragile on restart |
| Fixed viewport layouts | cssToGame() + getResponsiveLayout() | v1.2 (Phase 12) | Consistent sizing across devices; DPR-aware |

**Current state (v1.3):**
- Drag scrolling: Scene-level input.on() — works reliably
- Button taps: Scene-level input.on('pointerup') + manual bounds checking — breaks on scene restart
- Spacing: Fixed 200px from MAP_CONFIG — requires scroll on mobile

**Recommended evolution:**
- Keep drag scroll handlers as-is (working)
- Move button taps to container.on('pointerup') (reliable)
- Add dynamic spacing calculation for mobile viewports

**Deprecated/outdated:**
- ~~Using scene.pause() for overlays~~ → Use depth + interactive backdrop (blocks input to lower layers)
- ~~Hardcoded 1024x768 positions~~ → Use responsive utilities (cssToGame, getResponsiveLayout)

## Open Questions

1. **Should spacing reduce uniformly or preserve top/bottom padding?**
   - What we know: Current nodes span y: 2050 → 250 with ~200px spacing
   - What's unclear: Should mobile reduce all spacing equally, or keep extra padding at top (for map pointer visibility) and bottom (for thumb reach)?
   - Recommendation: Reduce spacing uniformly but ensure minimum 60px top padding for map pointer and 40px bottom padding for thumb reach. Calculate dynamic spacing from remaining height.

2. **What's the minimum acceptable spacing before UX degrades?**
   - What we know: Current 200px spacing is generous; nodes are clearly distinct
   - What's unclear: At what spacing do users struggle to tap individual nodes? 80px? 100px?
   - Recommendation: Use 80px as minimum (allows ~40px touch target + 40px visual gap). Test on real device (iPhone SE) to validate.

3. **Should we remove scrolling entirely or just reduce it?**
   - What we know: LVLS-01 says "all nodes fit on screen without scrolling"
   - What's unclear: Is scroll ever acceptable, or must it be 100% eliminated?
   - Recommendation: Eliminate scroll completely for viewports ≥667px height (iPhone SE). For extremely small viewports (<600px), allow minimal scroll rather than cramming nodes (preserves usability).

4. **Does handleResize need to recreate all level nodes with new spacing?**
   - What we know: Resize event fires on orientation change, browser zoom, etc.
   - What's unclear: Can we just reposition existing containers, or must we destroy and recreate with new spacing?
   - Recommendation: Destroy and recreate on resize if spacing changes (cleanest, avoids position drift). Cache current scroll position and restore after recreation.

## Sources

### Primary (HIGH confidence)
- Phaser 3 Scale Manager: [Official Docs](https://docs.phaser.io/phaser/concepts/scale-manager), [Rex Notes](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/scalemanager/)
- Phaser 3 Camera API: [setViewport](https://newdocs.phaser.io/docs/3.54.0/focus/Phaser.Cameras.Scene2D.Camera-setViewport), [Camera Class](https://docs.phaser.io/api-documentation/class/cameras-scene2d-camera)
- Phaser 3 Container: [Container Notes](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/container/), [Official Docs](https://docs.phaser.io/api-documentation/class/gameobjects-container)
- Mobile Viewport Sizes: [BrowserStack 2026](https://www.browserstack.com/guide/common-screen-resolutions), [Screen Sizes](https://screensiz.es/phone), [YesViz](https://yesviz.com/viewport/)
- Current codebase: src/scenes/LevelSelect.ts, src/game/constants.ts, src/utils/responsive.ts

### Secondary (MEDIUM confidence)
- Phaser Community: [Container Interactive](https://phaser.discourse.group/t/how-to-set-container-interactive/2967), [setInteractive Problem](https://phaser.discourse.group/t/problem-with-setinteractive-function/3261)
- Phaser GitHub Issues: [Interactive inside invisible container](https://github.com/photonstorm/phaser/issues/3620), [Graphics setInteractive](https://github.com/photonstorm/phaser/issues/4194)
- Touch Events: [Rex Notes](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/touchevents/)

### Tertiary (LOW confidence)
- None; all findings verified with official docs or codebase inspection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing Phaser 3 APIs already in project
- Architecture: HIGH - Patterns verified in codebase (Phase 12, 19) and Phaser docs
- Pitfalls: HIGH - Confirmed via codebase analysis (handleResize pattern at line 543 correct, scene-level tap detection at lines 218-223 matches reported issue pattern)

**Research date:** 2026-02-11
**Valid until:** 60 days (stable Phaser 3 APIs, mobile viewport distributions change slowly)
