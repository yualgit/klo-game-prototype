# Phase 21: Game Screen Polish - Research

**Researched:** 2026-02-11
**Domain:** Mobile-adaptive UI for Phaser 3 game screen (responsive HUD, back button, board sizing)
**Confidence:** HIGH

## Summary

Phase 21 targets four game screen responsive improvements: (1) mobile back button should be icon-only square instead of text, (2) mobile HUD should wrap level/moves to new line with smaller goal text, (3) game board should size dynamically with 16px padding and max-width cap, and (4) fix LevelSelect.ts viewport undefined error on resize.

The game currently uses `Scale.RESIZE` mode (established in Phase 12) with DPR capping at 2x, and all scenes implement `handleResize()` methods. The Game scene's HUD displays level info, moves, and goals in a single line, which overflows on narrow mobile viewports. The back button uses "< Menu" text suitable for desktop but cramped on mobile. The game board uses fixed tile sizing from `getResponsiveLayout()` but doesn't implement board-level width constraints with padding. The viewport error is a known Phaser pattern where `cameras.main` might be undefined during scene initialization race conditions.

**Primary recommendation:** Implement viewport width detection (e.g., `width < 600`) to conditionally render mobile vs desktop HUD layouts. Use container-based HUD structure to enable easy repositioning. Apply max-width capping logic similar to LevelSelect's horizontal clamping pattern. Ensure `cameras.main.setViewport()` is called before any camera property access in resize handlers.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser 3 | 3.85.0 | Game engine with responsive Scale Manager | Industry standard for 2D HTML5 games |
| Phaser.Scale.RESIZE | Built-in | Dynamic viewport resizing | Already in use (Phase 12); standard for responsive games |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| cssToGame() / getDpr() | Custom util | DPR-aware coordinate conversion (CSS pixels → Phaser pixels) | Already in use; every responsive sizing calculation |
| getResponsiveLayout() | Custom util | Compute responsive element sizes based on viewport | Already in use; returns tile size, HUD sizing, button dimensions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Conditional HUD layout | Fixed smaller font sizes | Fixed fonts don't adapt to extreme viewports; conditional layout handles iPhone SE to iPad cleanly |
| Hard-coded mobile detection | User-agent parsing | Viewport width is direct and reliable; UA parsing breaks with new devices and is less maintainable |
| Fixed board size | Scale board uniformly | Uniform scaling breaks tile touch targets on tiny screens; fixed size with padding maintains playability |

**No installation needed** — all solutions use existing Phaser 3 APIs and project utilities.

## Architecture Patterns

### Pattern 1: Viewport-Based Conditional UI Layout

**What:** Detect viewport width and render different UI structures for mobile vs desktop.

**When to use:** When a single layout doesn't work across all viewports (text wrapping, button labels, multi-line HUD).

**Example:**
```typescript
// Detect mobile viewport (width threshold in CSS pixels)
const isMobile = width / this.layout.dpr < 600;

if (isMobile) {
  // Mobile HUD: level/moves on line 1, goals on line 2
  this.createMobileHUD(width);
} else {
  // Desktop HUD: single line (current pattern)
  this.createDesktopHUD(width);
}
```

**Source:** Common responsive pattern, verified in Phase 12 and Phase 20 research (mobile threshold 600-800px)

### Pattern 2: Container-Based HUD for Easy Repositioning

**What:** Group HUD elements in a Container to enable atomic repositioning on resize.

**When to use:** Multi-line or complex HUD layouts that need to adapt to viewport changes.

**Example:**
```typescript
// Create HUD container
this.hudContainer = this.add.container(0, hudY);

// Add elements to container (relative positions within container)
const levelText = this.add.text(paddingLeft, 0, `Рівень ${this.currentLevel}`, style);
const movesText = this.add.text(paddingLeft, 20, `Ходи: ${moves}`, style);
this.hudContainer.add([levelText, movesText]);

// Resize: just update container position
private handleResize(gameSize: Phaser.Structs.Size): void {
  const hudY = cssToGame(50) + this.layout.hudHeight / 2;
  this.hudContainer.setPosition(0, hudY);
}
```

**Source:** Phaser Container best practices ([Container Notes](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/container/))

### Pattern 3: Board Width Constraint with Max-Width Capping

**What:** Calculate board width as `min(viewport width - padding, MAX_WIDTH)` and derive tile size from constrained width.

**When to use:** Game boards that should scale with viewport but have maximum playable size.

**Example:**
```typescript
// Constants
const PADDING = cssToGame(16 * 2); // 16px each side
const MAX_BOARD_WIDTH = cssToGame(1024);

// Calculate constrained board width
const availableWidth = width - PADDING;
const boardWidth = Math.min(availableWidth, MAX_BOARD_WIDTH);

// Derive tile size from board width
const tileSize = boardWidth / this.gridWidth; // gridWidth = 8 for 8x8 grid

// Center board in viewport
this.gridOffsetX = (width - boardWidth) / 2;
```

**Source:** Similar pattern used in LevelSelect.ts Phase 20 horizontal clamping (lines 52-90)

### Pattern 4: Camera Viewport Initialization Before Property Access

**What:** Always call `cameras.main.setViewport()` before accessing camera properties like `width`, `scrollX`, etc.

**When to use:** In every resize handler and scene create method to prevent "undefined" errors.

**Example:**
```typescript
private handleResize(gameSize: Phaser.Structs.Size): void {
  const { width, height } = gameSize;

  // CRITICAL: Set viewport FIRST before accessing camera properties
  this.cameras.main.setViewport(0, 0, width, height);

  // NOW safe to use camera properties
  this.cameras.main.setBounds(0, 0, width, worldHeight);
  this.cameras.main.setScroll(0, this.cameras.main.scrollY);
}
```

**Source:** Phase 20 research, Phaser camera API ([setViewport](https://newdocs.phaser.io/docs/3.54.0/focus/Phaser.Cameras.Scene2D.Camera-setViewport)), already implemented correctly in LevelSelect.ts line 573

### Anti-Patterns to Avoid

- **Don't check user-agent for mobile detection:** Viewport width is more reliable and future-proof than UA strings.
- **Don't use fixed pixel positions for mobile HUD:** Use proportional positioning (e.g., `width / 2`, `height * 0.2`) or container-based layouts.
- **Don't skip camera.setViewport() on resize:** Input coordinate translation and camera bounds will break without viewport updates.
- **Don't hard-code tile size for all viewports:** Derive tile size from constrained board width for proper scaling.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mobile viewport detection | Custom device database, UA parsing | Compare `width / dpr < 600` | Viewport width is direct, reliable, works for future devices |
| Multi-line text wrapping | Manual line breaks based on string length | Container with multiple Text objects positioned vertically | Phaser Text doesn't auto-wrap multi-field content; manual positioning is cleaner |
| Responsive tile sizing | Hard-coded breakpoints (if mobile: 40px, if desktop: 60px) | Formula: `Math.min(maxBoardWidth, width - padding) / gridWidth` | Formula adapts to ANY viewport width; breakpoints miss edge cases |
| Input coordinate fixes | Custom event listener re-registration | Call `camera.setViewport()` in resize handler | Phaser handles all transforms automatically; manual fixes will break |

**Key insight:** Phaser's Scale Manager and Camera API handle the hard parts (DPR, transforms, input). Custom implementations miss edge cases (orientation change, browser zoom, multi-touch).

## Common Pitfalls

### Pitfall 1: Single-Line HUD Overflows on Narrow Mobile Viewports

**What goes wrong:** HUD text displays level number, moves counter, and goal descriptions in one line. On iPhone SE (375x667), text exceeds viewport width and gets clipped or wraps awkwardly.

**Why it happens:**
- Current implementation concatenates all info into single string: `Рівень ${n} • Ходи: ${m} • ${goals}`
- Desktop viewports (1024px+) have room; mobile viewports (375-428px) don't
- Single Text object doesn't adapt layout based on content width

**How to avoid:**
1. Detect mobile viewport: `const isMobile = width / getDpr() < 600`
2. Render multi-line HUD for mobile: level/moves on line 1, goals on line 2 (smaller font)
3. Use Container to group lines for atomic positioning
4. Test on iPhone SE (375x667) and iPhone 15 Pro (393x852) to verify readability

**Warning signs:**
- HUD text truncated with "..." on mobile
- Text wraps mid-word or overlaps game board
- Font size so small it's unreadable (< 12px CSS)

**Source:** Common responsive UI pattern, similar to Phase 20 Level Select spacing issues

### Pitfall 2: "< Menu" Back Button Text Cramped on Mobile

**What goes wrong:** Back button uses text label "< Menu" suitable for desktop but takes up horizontal space on mobile where every pixel counts.

**Why it happens:**
- Desktop has room for labeled buttons (80-120px width)
- Mobile needs compact UI; icon-only buttons (32-40px square) are standard
- Current implementation doesn't conditionally render button content

**How to avoid:**
1. Detect mobile viewport (same threshold as HUD)
2. Render icon-only button for mobile: just "<" character, square aspect ratio
3. Keep text button for desktop: "< Menu" (current pattern)
4. Adjust button container size: mobile uses square (e.g., 32x32), desktop uses rectangle (80x36)

**Warning signs:**
- Back button overlaps HUD elements on narrow screens
- Button text too small to read (< 14px CSS)
- User reports difficulty tapping back button (too small)

**Source:** Mobile UI standards (iOS Human Interface Guidelines, Material Design)

### Pitfall 3: Game Board Fixed Size Overflows Small Screens

**What goes wrong:** Board uses tile size from `getResponsiveLayout()` which caps at 60px CSS max, but doesn't account for viewport width constraints. On 320px wide screens, 8-tile board at 60px = 480px (exceeds viewport).

**Why it happens:**
- `getResponsiveLayout()` calculates tile size based on "maxGridCssWidth = cssWidth - 20px padding"
- But Game scene centers board without checking if it exceeds viewport bounds
- No max-width constraint on board itself

**How to avoid:**
1. Add board-level width constraint: `const maxBoardWidth = Math.min(width - cssToGame(32), cssToGame(1024))`
2. Derive tile size from constrained board width: `tileSize = maxBoardWidth / gridWidth`
3. Update `getResponsiveLayout()` or override tile size in Game scene
4. Ensure 16px padding on each side (32px total) as per GAME-03 requirement

**Warning signs:**
- Board tiles overlap viewport edges on narrow screens
- Horizontal scrolling appears on mobile (shouldn't be possible)
- Edge tiles cut off or hard to tap

### Pitfall 4: Camera Viewport Undefined Error on Resize

**What goes wrong:** `handleResize()` calls `this.cameras.main.setViewport()` but crashes with "Cannot read properties of undefined (reading 'setViewport')".

**Why it happens:**
- Scene lifecycle race condition: resize event fires before `cameras.main` is initialized
- Scene shutdown mid-resize: handler runs after cameras destroyed
- Missing scene active guard: handler runs on destroyed scene

**How to avoid:**
1. Add scene active guard at top of handleResize: `if (!this.sceneActive) return;`
2. Ensure resize listener registered AFTER camera ready (in `create()`, not `init()`)
3. Remove resize listener in shutdown: `this.scale.off('resize', this.handleResize, this);`
4. Check camera existence before use: `if (!this.cameras.main) return;`

**Warning signs:**
- Error only appears on specific device orientations (portrait ↔ landscape)
- Error appears when navigating away from scene quickly
- Error doesn't reproduce consistently (timing-dependent race condition)

**Source:** Phase 20 research (similar viewport error pattern), Phaser scene lifecycle docs

## Code Examples

Verified patterns from official sources and current codebase:

### Mobile-Adaptive HUD Layout

```typescript
// Detect mobile viewport (CSS pixels)
const isMobile = width / getDpr() < 600;

if (isMobile) {
  this.createMobileHUD(width);
} else {
  this.createDesktopHUD(width);
}

private createMobileHUD(width: number): void {
  const hudY = cssToGame(50) + this.layout.hudHeight / 2;

  // Line 1: Level and Moves (larger font)
  const line1 = this.add.text(
    width / 2,
    hudY - cssToGame(8),
    `Рівень ${this.currentLevel}  •  Ходи: ${this.levelManager.getMovesRemaining()}`,
    {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(14)}px`, // Readable size
      color: '#1A1A1A',
      fontStyle: 'bold',
    }
  );
  line1.setOrigin(0.5);

  // Line 2: Goals (smaller font)
  const goals = this.levelManager.getGoals();
  const goalText = goals
    .map(g => `${g.item || g.obstacleType || ''}: ${g.current}/${g.count}`)
    .join(' | ');

  const line2 = this.add.text(
    width / 2,
    hudY + cssToGame(10),
    goalText,
    {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(11)}px`, // Smaller to fit
      color: '#666666',
    }
  );
  line2.setOrigin(0.5);
}

private createDesktopHUD(width: number): void {
  // Single line (current pattern at Game.ts line 260)
  const hudY = cssToGame(50) + this.layout.hudHeight / 2;
  const moves = this.levelManager.getMovesRemaining();
  const goals = this.levelManager.getGoals();
  const goalText = goals
    .map(g => `${g.item || g.obstacleType || ''}: ${g.current}/${g.count}`)
    .join(' | ');

  const text = `Рівень ${this.currentLevel}  •  Ходи: ${moves}  •  ${goalText}`;

  this.hudText = this.add.text(width / 2, hudY, text, {
    fontFamily: 'Arial, sans-serif',
    fontSize: `${this.layout.hudFontSize}px`,
    color: '#1A1A1A',
    fontStyle: 'bold',
  });
  this.hudText.setOrigin(0.5);
}
```

### Mobile-Adaptive Back Button

```typescript
private createBackButton(): void {
  const isMobile = this.cameras.main.width / getDpr() < 600;

  const buttonBg = this.add.image(0, 0, GUI_TEXTURE_KEYS.buttonYellow);

  let buttonText: Phaser.GameObjects.Text;
  let buttonWidth: number;
  let buttonHeight: number;

  if (isMobile) {
    // Square icon-only button
    buttonWidth = cssToGame(32);
    buttonHeight = cssToGame(32);
    buttonBg.setDisplaySize(buttonWidth, buttonHeight);

    buttonText = this.add.text(0, 0, '<', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(18)}px`,
      color: '#1A1A1A',
      fontStyle: 'bold',
    });
  } else {
    // Rectangle text button
    buttonWidth = this.layout.backButtonWidth;
    buttonHeight = this.layout.backButtonHeight;
    buttonBg.setDisplaySize(buttonWidth, buttonHeight);

    buttonText = this.add.text(0, 0, '< Menu', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${this.layout.backButtonFontSize}px`,
      color: '#1A1A1A',
    });
  }

  buttonText.setOrigin(0.5);

  const buttonX = cssToGame(25) + buttonWidth / 2;
  const buttonY = cssToGame(50) + this.layout.hudHeight / 2;
  this.backButton = this.add.container(buttonX, buttonY, [buttonBg, buttonText]);
  this.backButton.setSize(buttonWidth, buttonHeight);
  this.backButton.setInteractive({ useHandCursor: true });

  this.backButton.on('pointerup', () => {
    this.scene.start('LevelSelect');
  });
}
```

### Board Width Constraint with Padding

```typescript
// In create() after layout computed
private calculateGridLayout(width: number, height: number): void {
  // Constants from GAME-03 requirement
  const PADDING = cssToGame(32); // 16px each side
  const MAX_BOARD_WIDTH = cssToGame(1024);

  // Calculate constrained board width
  const availableWidth = width - PADDING;
  const boardWidth = Math.min(availableWidth, MAX_BOARD_WIDTH);

  // Derive tile size from constrained board width
  const tileSize = Math.floor(boardWidth / this.gridWidth);

  // Update layout tile size (override getResponsiveLayout if needed)
  this.layout.tileSize = tileSize;

  // Recalculate grid dimensions
  const gridPixelWidth = this.gridWidth * tileSize;
  const gridPixelHeight = this.gridHeight * tileSize;

  // Center board horizontally in viewport
  this.gridOffsetX = (width - gridPixelWidth) / 2;

  // Position vertically (account for header + HUD)
  const topSpace = cssToGame(50) + this.layout.hudHeight + cssToGame(10);
  const availableHeight = height - topSpace;

  // Adjust if board too tall for viewport
  if (gridPixelHeight > availableHeight) {
    // Scale down tile size to fit height
    const maxTileByHeight = Math.floor(availableHeight / this.gridHeight);
    this.layout.tileSize = Math.min(tileSize, maxTileByHeight);

    // Recalculate with constrained tile size
    const finalGridWidth = this.gridWidth * this.layout.tileSize;
    this.gridOffsetX = (width - finalGridWidth) / 2;
  }

  this.gridOffsetY = topSpace;
}
```

### Resize Handler with Scene Active Guard (Fix for GAME-04)

```typescript
// Already implemented correctly in Game.ts line 1559
private handleResize(gameSize: Phaser.Structs.Size): void {
  // CRITICAL: Guard against resize events during scene shutdown
  if (!this.sceneActive) return;

  const { width, height } = gameSize;

  // Recompute responsive layout
  this.layout = getResponsiveLayout(width, height);

  // CRITICAL: Update camera viewport BEFORE accessing camera properties
  this.cameras.main.setViewport(0, 0, width, height);

  // Recalculate grid offset with new layout
  this.calculateGridLayout(width, height);

  // Redraw UI elements...
}

// In create() - set scene active flag
create(): void {
  this.sceneActive = true;
  // ... rest of create
}

// In shutdown event handler
this.events.once('shutdown', () => {
  this.sceneActive = false;
  this.scale.off('resize', this.handleResize, this);
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Scale.FIT (uniform scale, letterboxing) | Scale.RESIZE (native resolution, responsive layout) | v1.2 (Phase 12) | Better mobile UX; requires responsive sizing logic |
| Fixed 1024x768 design resolution | Dynamic viewport with DPR awareness | v1.2 (Phase 12) | Crisp rendering on retina; coordinates = device pixels |
| Single-line HUD for all viewports | (Needs improvement) → Multi-line mobile HUD | Phase 21 | Better readability on narrow screens |
| Text back buttons everywhere | (Needs improvement) → Icon-only mobile buttons | Phase 21 | Space-efficient mobile UI |
| Fixed tile size from getResponsiveLayout | (Needs improvement) → Board-constrained tile sizing | Phase 21 | Proper scaling with padding constraints |

**Current state (v1.3):**
- HUD: Single line, overflows on mobile (375-428px width)
- Back button: Text label "< Menu", cramped on mobile
- Board sizing: Uses responsive tile size but no board-level width constraint
- Resize handler: Has scene active guard but might access camera too early in some edge cases

**Recommended evolution:**
- Add viewport width detection (`width / dpr < 600`) for mobile conditionals
- Implement multi-line mobile HUD with Container-based structure
- Create icon-only mobile back button variant
- Add board width constraint with 16px padding (GAME-03)
- Ensure camera.setViewport() called before any camera property access

**Deprecated/outdated:**
- ~~Fixed HUD heights/positions~~ → Use responsive layout utilities (cssToGame, getResponsiveLayout)
- ~~Single resize handler for all layouts~~ → Conditional mobile/desktop rendering

## Open Questions

1. **Should mobile HUD split into 2 lines or 3 lines?**
   - What we know: Level + moves can fit on one line; goals text varies by level (1-3 goals)
   - What's unclear: Will 2 lines always be enough for goals, or do some levels need 3?
   - Recommendation: Start with 2 lines (level+moves, goals). Test with longest goal text (level 10) on iPhone SE. If overflow, reduce font size or abbreviate goal descriptions.

2. **What's the mobile breakpoint threshold for button/HUD conditionals?**
   - What we know: iPhone SE = 375px, most Android = 360-428px, tablets = 768px+
   - What's unclear: Should breakpoint be 600px (covers phones), 768px (includes small tablets), or dynamic based on aspect ratio?
   - Recommendation: Use 600px CSS width threshold (covers all phones, excludes tablets). Aligns with common responsive breakpoints. Test on 375px (iPhone SE) and 428px (iPhone 15 Pro Max).

3. **Should board scaling prefer width or height constraint when both are tight?**
   - What we know: Board must fit viewport with 16px padding (width) and below header+HUD (height)
   - What's unclear: On landscape narrow viewports (e.g., 1366x768 laptop), which constraint takes priority?
   - Recommendation: Calculate both constraints and use minimum (most restrictive). Preserve square tiles — don't stretch width differently from height. If board can't fit with readable tiles (< 40px), show warning or adjust HUD to reclaim space.

4. **Should resize handler recreate HUD elements or just reposition them?**
   - What we know: Current pattern destroys and recreates all elements on resize
   - What's unclear: Can we optimize by repositioning existing elements, or is full recreation safer?
   - Recommendation: Recreate HUD elements on resize (cleanest, avoids position drift). Optimization premature unless resize lag is measurable issue. Cache current game state (moves, goals) and restore after recreation.

## Sources

### Primary (HIGH confidence)
- Phaser 3 Scale Manager: [Official Docs](https://docs.phaser.io/phaser/concepts/scale-manager), [Rex Notes](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/scalemanager/)
- Phaser 3 Camera API: [setViewport](https://newdocs.phaser.io/docs/3.54.0/focus/Phaser.Cameras.Scene2D.Camera-setViewport), [Camera Class](https://docs.phaser.io/api-documentation/class/cameras-scene2d-camera)
- Current codebase: src/scenes/Game.ts (lines 862-898 back button, 226-274 HUD, 1559-1600 handleResize), src/utils/responsive.ts
- Phase 20 Research: LevelSelect horizontal clamping pattern (lines 52-90), viewport error fix pattern

### Secondary (MEDIUM confidence)
- Mobile viewport sizes: [BrowserStack 2026](https://www.browserstack.com/guide/common-screen-resolutions), [StatCounter Mobile](https://gs.statcounter.com/screen-resolution-stats/mobile/worldwide)
- iOS Human Interface Guidelines: Button sizing (44pt minimum touch target)
- Material Design: Compact mobile button standards (40dp minimum)

### Tertiary (LOW confidence)
- None; all findings verified with codebase analysis and official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing Phaser 3 APIs and project utilities established in Phase 12
- Architecture: HIGH - Patterns verified in Game.ts and LevelSelect.ts (viewport guards, responsive sizing)
- Pitfalls: HIGH - Confirmed via codebase analysis (single-line HUD at line 260, back button at line 862, resize pattern at line 1559)

**Research date:** 2026-02-11
**Valid until:** 60 days (stable Phaser 3 APIs, mobile viewport distributions change slowly)
