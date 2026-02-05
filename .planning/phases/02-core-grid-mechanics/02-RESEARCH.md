# Phase 2: Core Grid Mechanics - Research

**Researched:** 2026-02-05
**Domain:** Match-3 Game Mechanics with Phaser 3 + TypeScript
**Confidence:** HIGH

## Summary

Phase 2 implements the core match-3 game mechanics: tile representation, swap detection (tap/swipe), match detection, gravity/falling tiles, cascade chains, and no-valid-moves detection with board reshuffle. The research confirms that match-3 game logic follows well-established algorithmic patterns that can be implemented with pure TypeScript, while Phaser 3 handles rendering and animations.

The recommended architecture separates game logic (Model) from visualization (View). A `Match3Engine` class handles grid state, match detection, and cascade resolution as pure data operations, returning movement instructions to the Phaser scene for animation. This decoupled approach enables unit testing, prevents animation timing bugs, and allows reuse across frameworks.

Key implementation insights: (1) Use a 2D array for grid state with tile objects containing type, isEmpty flag, and optional obstacle data; (2) Implement swap as data operation first, validate match result, then trigger animations or revert; (3) Use Phaser `tweens.chain()` for sequential animations (swap, fall, cascade); (4) Prevent player input during cascade resolution with a `processing` flag; (5) Use object pooling via Phaser Groups to avoid GC pauses.

**Primary recommendation:** Implement a pure TypeScript `Match3Engine` class that handles all game logic and returns movement arrays, with the Phaser `Game` scene handling input and animations via tweens. Use the "process until stable" pattern for cascades with a depth counter (max 20) to prevent infinite loops.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser 3 | 3.90.0 | Rendering, tweens, input | Already in project, handles sprites, Groups for pooling, built-in tween chaining |
| TypeScript | 5.7.x | Type safety | Already configured, essential for complex game logic |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| phaser3-rex-plugins | Latest | Advanced gestures | Optional: only if built-in swipe detection is insufficient |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom engine class | Existing match-3 library | Libraries add dependencies; custom class gives full control and is small enough (~300 lines) |
| Phaser built-in input | Rex plugins swipe | Built-in is sufficient for tap+swipe, Rex adds features we don't need |

**Installation:**
```bash
# No additional packages needed - using existing Phaser 3
# Optionally for advanced gestures:
npm install phaser3-rex-plugins
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── game/
│   ├── Match3Engine.ts      # Pure logic: grid state, matches, gravity
│   ├── Tile.ts              # Tile data class (type, position, isEmpty)
│   ├── TileSprite.ts        # Phaser sprite wrapper for tiles
│   └── constants.ts         # Tile types, colors, grid dimensions
├── scenes/
│   └── Game.ts              # Input handling, animation, calls Engine
└── utils/
    └── helpers.ts           # Grid math utilities
```

### Pattern 1: Model-View Separation
**What:** Game logic (Match3Engine) manages grid state as pure data. Phaser scene reads state and renders, listens for events, triggers animations.
**When to use:** Always for match-3 games - prevents animation timing bugs, enables testing.
**Example:**
```typescript
// src/game/Match3Engine.ts
export interface TileData {
  type: string;         // 'fuel' | 'coffee' | 'snack' | 'road'
  row: number;
  col: number;
  isEmpty: boolean;
}

export interface Movement {
  row: number;
  col: number;
  deltaRow: number;     // How many rows to move
  deltaCol: number;     // How many cols to move
}

export class Match3Engine {
  private grid: TileData[][];
  private rows: number;
  private cols: number;
  private tileTypes: string[];

  constructor(rows: number, cols: number, spawnRules: Record<string, number>) {
    this.rows = rows;
    this.cols = cols;
    this.tileTypes = Object.keys(spawnRules);
    this.grid = this.generateGrid(spawnRules);
  }

  // Returns movements for animation, does NOT animate
  swapTiles(r1: number, c1: number, r2: number, c2: number): Movement[] {
    const temp = this.grid[r1][c1];
    this.grid[r1][c1] = this.grid[r2][c2];
    this.grid[r2][c2] = temp;

    // Update tile internal positions
    this.grid[r1][c1].row = r1;
    this.grid[r1][c1].col = c1;
    this.grid[r2][c2].row = r2;
    this.grid[r2][c2].col = c2;

    return [
      { row: r1, col: c1, deltaRow: r2 - r1, deltaCol: c2 - c1 },
      { row: r2, col: c2, deltaRow: r1 - r2, deltaCol: c1 - c2 }
    ];
  }
}
```

### Pattern 2: State Machine for Game Flow
**What:** Use a state flag to prevent input during cascades. Process until board stabilizes.
**When to use:** Always - prevents race conditions between input and animations.
**Example:**
```typescript
// In Game scene
export class Game extends Phaser.Scene {
  private engine: Match3Engine;
  private isProcessing: boolean = false;

  private async onTileSwap(tile1: TileSprite, tile2: TileSprite): Promise<void> {
    if (this.isProcessing) return; // Ignore input during cascade

    this.isProcessing = true;

    // 1. Perform swap in engine
    const movements = this.engine.swapTiles(
      tile1.row, tile1.col, tile2.row, tile2.col
    );

    // 2. Animate swap
    await this.animateMovements(movements);

    // 3. Check for matches
    const matches = this.engine.findMatches();

    if (matches.length === 0) {
      // No match - swap back
      const revertMovements = this.engine.swapTiles(
        tile1.row, tile1.col, tile2.row, tile2.col
      );
      await this.animateMovements(revertMovements);
    } else {
      // Process cascade until stable
      await this.processCascade();
    }

    this.isProcessing = false;
  }
}
```

### Pattern 3: Cascade Loop with Depth Limit
**What:** After matches clear, apply gravity and refill, then check again. Repeat until stable or depth limit reached.
**When to use:** Required for cascade mechanics.
**Example:**
```typescript
// In Game scene
private async processCascade(): Promise<void> {
  let depth = 0;
  const MAX_DEPTH = 20; // From requirements

  while (depth < MAX_DEPTH) {
    depth++;

    // 1. Find and clear matches
    const matches = this.engine.findMatches();
    if (matches.length === 0) break; // Board stable

    // 2. Score points (multiplier increases with depth)
    this.addScore(matches, depth);

    // 3. Remove matched tiles (animate destruction)
    await this.animateMatchRemoval(matches);
    this.engine.removeMatches(matches);

    // 4. Apply gravity (get movements, animate)
    const fallMovements = this.engine.applyGravity();
    await this.animateMovements(fallMovements);

    // 5. Spawn new tiles from top
    const spawnData = this.engine.spawnNewTiles();
    await this.animateNewTiles(spawnData);

    // Loop continues - check for new matches
  }

  // After cascade, check for valid moves
  if (!this.engine.hasValidMoves()) {
    await this.reshuffleBoard();
  }
}
```

### Pattern 4: Object Pooling for Tiles
**What:** Use Phaser Group as object pool to reuse tile sprites instead of creating/destroying.
**When to use:** Always for tiles - prevents GC pauses, improves performance.
**Example:**
```typescript
// In Game scene create()
this.tilePool = this.add.group({
  classType: TileSprite,
  maxSize: 64 + 16, // 8x8 grid + buffer for spawning
  runChildUpdate: false
});

// Get tile from pool
private getTile(type: string, row: number, col: number): TileSprite {
  const tile = this.tilePool.get() as TileSprite;
  if (tile) {
    tile.reset(type, row, col); // Reset properties for reuse
    tile.setActive(true);
    tile.setVisible(true);
  }
  return tile;
}

// Return tile to pool
private recycleTile(tile: TileSprite): void {
  tile.setActive(false);
  tile.setVisible(false);
  this.tilePool.killAndHide(tile);
}
```

### Pattern 5: Promise-Wrapped Tweens for Async Flow
**What:** Wrap Phaser tweens in Promises to use async/await for animation sequencing.
**When to use:** For all animation chains - cleaner than callback hell.
**Example:**
```typescript
private tweenAsync(config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
  return new Promise(resolve => {
    this.tweens.add({
      ...config,
      onComplete: () => resolve()
    });
  });
}

private async animateMovements(movements: Movement[]): Promise<void> {
  const promises = movements.map(m => {
    const tile = this.getTileAt(m.row, m.col);
    return this.tweenAsync({
      targets: tile,
      x: tile.x + m.deltaCol * TILE_SIZE,
      y: tile.y + m.deltaRow * TILE_SIZE,
      duration: 150, // Fast swap animation
      ease: 'Power2'
    });
  });
  await Promise.all(promises); // Wait for all to complete
}
```

### Anti-Patterns to Avoid
- **Mixing logic and animation:** Don't modify grid state inside tween callbacks - update state first, then animate
- **Processing input during cascade:** Always check `isProcessing` flag before accepting swaps
- **Creating sprites in loops:** Use object pooling, not `this.add.sprite()` in game loop
- **Hardcoding grid to visual positions:** Store row/col in data, calculate pixels on demand
- **Recursive cascade without depth limit:** Always limit cascade depth to prevent infinite loops

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Swipe gesture detection | Custom touch velocity tracking | Phaser pointer.velocity + angle | Built-in handles edge cases, works on mobile |
| Animation sequencing | Nested callbacks | tweens.chain() or Promise.all() | Cleaner code, easier to debug |
| Sprite reuse | Manual create/destroy | Phaser Group with get()/killAndHide() | Built-in pool management, prevents GC |
| Random weighted selection | Custom probability code | Weighted random from spawn_rules | Simple algorithm, but avoid reimplementing |

**Key insight:** Phaser 3 provides Groups (object pooling), tweens.chain() (animation sequences), and pointer velocity (swipe detection). Use these instead of building custom solutions. The Match3Engine class IS custom code, but it's the core game logic that has no library alternative - and it's well-documented enough to implement correctly.

## Common Pitfalls

### Pitfall 1: Animation-State Desync
**What goes wrong:** Visual tile positions don't match grid array after animations, causing wrong match detection or swap targets.
**Why it happens:** Modifying grid during or after animation without proper sequencing. Tween callback fires but grid already changed.
**How to avoid:** Always update grid state BEFORE starting animation. Grid is source of truth, sprites just reflect it.
**Warning signs:** Tiles visually in wrong place, clicking tile selects neighbor, matches not detected on screen.

### Pitfall 2: Input During Processing
**What goes wrong:** Player swaps during cascade, causing double-swaps, corrupted state, or visual glitches.
**Why it happens:** No guard against input while cascade is running.
**How to avoid:** Set `isProcessing = true` before cascade, `false` after. Check this flag in input handlers.
**Warning signs:** Intermittent bugs, tiles "jumping" unexpectedly, score anomalies.

### Pitfall 3: Initial Board Has Matches
**What goes wrong:** Game starts, immediately triggers cascade, player confused.
**Why it happens:** Random generation doesn't check for existing matches.
**How to avoid:** In generateGrid(), after placing each tile, check if it creates a match. If so, pick different type.
**Warning signs:** Level starts with explosions, score at level start > 0.

```typescript
// Correct board generation
private generateGrid(spawnRules: Record<string, number>): TileData[][] {
  const grid: TileData[][] = [];

  for (let row = 0; row < this.rows; row++) {
    grid[row] = [];
    for (let col = 0; col < this.cols; col++) {
      let type: string;
      let attempts = 0;

      do {
        type = this.getRandomType(spawnRules);
        attempts++;
      } while (this.wouldCreateMatch(grid, row, col, type) && attempts < 100);

      grid[row][col] = { type, row, col, isEmpty: false };
    }
  }
  return grid;
}

private wouldCreateMatch(grid: TileData[][], row: number, col: number, type: string): boolean {
  // Check left 2
  if (col >= 2 &&
      grid[row][col-1]?.type === type &&
      grid[row][col-2]?.type === type) {
    return true;
  }
  // Check up 2
  if (row >= 2 &&
      grid[row-1]?.[col]?.type === type &&
      grid[row-2]?.[col]?.type === type) {
    return true;
  }
  return false;
}
```

### Pitfall 4: No Valid Moves Deadlock
**What goes wrong:** Board reaches state with no possible matches, player stuck.
**Why it happens:** Cascade fills board with tiles that can't form matches.
**How to avoid:** After every cascade completes, run hasValidMoves(). If false, reshuffle.
**Warning signs:** Player tries many swaps, none work. Board looks "stuck."

```typescript
// Check if any valid move exists
hasValidMoves(): boolean {
  for (let row = 0; row < this.rows; row++) {
    for (let col = 0; col < this.cols; col++) {
      // Try swap right
      if (col < this.cols - 1) {
        this.swapTiles(row, col, row, col + 1);
        const hasMatch = this.findMatches().length > 0;
        this.swapTiles(row, col, row, col + 1); // Swap back
        if (hasMatch) return true;
      }
      // Try swap down
      if (row < this.rows - 1) {
        this.swapTiles(row, col, row + 1, col);
        const hasMatch = this.findMatches().length > 0;
        this.swapTiles(row, col, row + 1, col); // Swap back
        if (hasMatch) return true;
      }
    }
  }
  return false;
}
```

### Pitfall 5: Cascade Infinite Loop
**What goes wrong:** Cascade never ends, game freezes.
**Why it happens:** Bug in match detection or gravity creates repeating state.
**How to avoid:** Always enforce depth limit (max 20 from requirements). Log warning if limit reached.
**Warning signs:** Browser tab freezes, CPU 100%, no animation progress.

### Pitfall 6: Spawn Probability Miscalculation
**What goes wrong:** Tile distribution doesn't match level config, goals too hard/easy.
**Why it happens:** spawn_rules probabilities not correctly normalized or implemented.
**How to avoid:** Use weighted random selection with proper normalization.
**Warning signs:** One tile type dominates, goals impossible to complete.

```typescript
// Correct weighted random
private getRandomType(spawnRules: Record<string, number>): string {
  const types = Object.keys(spawnRules);
  const weights = Object.values(spawnRules);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  let random = Math.random() * totalWeight;

  for (let i = 0; i < types.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return types[i];
    }
  }
  return types[types.length - 1]; // Fallback
}
```

## Code Examples

Verified patterns from research sources:

### Match Detection Algorithm (Horizontal + Vertical)
```typescript
// Source: Emanuele Feronato Match3 tutorials + CS50 Games lecture
interface Match {
  tiles: Array<{row: number, col: number}>;
  type: string;
}

findMatches(): Match[] {
  const matches: Match[] = [];

  // Horizontal matches
  for (let row = 0; row < this.rows; row++) {
    let matchStart = 0;
    let matchType = this.grid[row][0].type;

    for (let col = 1; col <= this.cols; col++) {
      const currentType = col < this.cols ? this.grid[row][col].type : null;

      if (currentType === matchType && !this.grid[row][col-1].isEmpty) {
        continue; // Match continues
      }

      // Match ended or col boundary
      const matchLength = col - matchStart;
      if (matchLength >= 3 && matchType) {
        const tiles = [];
        for (let i = matchStart; i < col; i++) {
          tiles.push({ row, col: i });
        }
        matches.push({ tiles, type: matchType });
      }

      // Start new match
      matchStart = col;
      matchType = currentType;
    }
  }

  // Vertical matches (same logic, swap row/col)
  for (let col = 0; col < this.cols; col++) {
    let matchStart = 0;
    let matchType = this.grid[0][col].type;

    for (let row = 1; row <= this.rows; row++) {
      const currentType = row < this.rows ? this.grid[row][col].type : null;

      if (currentType === matchType && !this.grid[row-1][col].isEmpty) {
        continue;
      }

      const matchLength = row - matchStart;
      if (matchLength >= 3 && matchType) {
        const tiles = [];
        for (let i = matchStart; i < row; i++) {
          tiles.push({ row: i, col });
        }
        matches.push({ tiles, type: matchType });
      }

      matchStart = row;
      matchType = currentType;
    }
  }

  return matches;
}
```

### Gravity/Falling Algorithm
```typescript
// Source: Catlike Coding Match-3 tutorial + CS50 Games
applyGravity(): Movement[] {
  const movements: Movement[] = [];

  // Process each column from bottom to top
  for (let col = 0; col < this.cols; col++) {
    let emptyRow = -1;

    // Find bottom-most empty cell
    for (let row = this.rows - 1; row >= 0; row--) {
      if (this.grid[row][col].isEmpty && emptyRow === -1) {
        emptyRow = row;
      } else if (!this.grid[row][col].isEmpty && emptyRow !== -1) {
        // Found tile above empty space - move it down
        const deltaRow = emptyRow - row;

        // Record movement for animation
        movements.push({
          row: row,
          col: col,
          deltaRow: deltaRow,
          deltaCol: 0
        });

        // Update grid state
        this.grid[emptyRow][col] = this.grid[row][col];
        this.grid[emptyRow][col].row = emptyRow;
        this.grid[row][col] = { type: '', row, col, isEmpty: true };

        emptyRow--; // Next empty is one row up
      }
    }
  }

  return movements;
}
```

### New Tile Spawning
```typescript
// Source: Level JSON spawn_rules integration
interface SpawnData {
  row: number;
  col: number;
  type: string;
  startY: number; // Y position above screen to animate from
}

spawnNewTiles(spawnRules: Record<string, number>): SpawnData[] {
  const spawns: SpawnData[] = [];

  for (let col = 0; col < this.cols; col++) {
    let spawnCount = 0;

    // Count and fill empty cells from top
    for (let row = 0; row < this.rows; row++) {
      if (this.grid[row][col].isEmpty) {
        const type = this.getRandomType(spawnRules);
        this.grid[row][col] = { type, row, col, isEmpty: false };

        spawns.push({
          row,
          col,
          type,
          startY: -(spawnCount + 1) * TILE_SIZE // Stack above screen
        });
        spawnCount++;
      }
    }
  }

  return spawns;
}
```

### Input Handling (Tap + Swipe)
```typescript
// Source: Phaser 3 input docs + Rex notes
// In Game scene create()
private setupInput(): void {
  let selectedTile: TileSprite | null = null;
  let dragStartX = 0;
  let dragStartY = 0;

  this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    if (this.isProcessing) return;

    const tile = this.getTileAtPointer(pointer);
    if (tile) {
      selectedTile = tile;
      dragStartX = pointer.x;
      dragStartY = pointer.y;
      tile.setSelected(true);
    }
  });

  this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
    if (this.isProcessing || !selectedTile) return;

    const dx = pointer.x - dragStartX;
    const dy = pointer.y - dragStartY;
    const SWIPE_THRESHOLD = 30;

    let targetTile: TileSprite | null = null;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
      // Horizontal swipe
      const direction = dx > 0 ? 1 : -1;
      targetTile = this.getTileAt(selectedTile.row, selectedTile.col + direction);
    } else if (Math.abs(dy) > SWIPE_THRESHOLD) {
      // Vertical swipe
      const direction = dy > 0 ? 1 : -1;
      targetTile = this.getTileAt(selectedTile.row + direction, selectedTile.col);
    } else {
      // Tap - wait for second tap
      const clickedTile = this.getTileAtPointer(pointer);
      if (clickedTile && clickedTile !== selectedTile && this.isAdjacent(selectedTile, clickedTile)) {
        targetTile = clickedTile;
      }
    }

    if (targetTile) {
      this.onTileSwap(selectedTile, targetTile);
    }

    selectedTile.setSelected(false);
    selectedTile = null;
  });
}

private isAdjacent(t1: TileSprite, t2: TileSprite): boolean {
  const rowDiff = Math.abs(t1.row - t2.row);
  const colDiff = Math.abs(t1.col - t2.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}
```

### Board Reshuffle
```typescript
// Source: Match-3 development guides
reshuffleBoard(): void {
  // Collect all current tile types
  const tiles: string[] = [];
  for (let row = 0; row < this.rows; row++) {
    for (let col = 0; col < this.cols; col++) {
      tiles.push(this.grid[row][col].type);
    }
  }

  // Fisher-Yates shuffle
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }

  // Place shuffled tiles
  let index = 0;
  for (let row = 0; row < this.rows; row++) {
    for (let col = 0; col < this.cols; col++) {
      this.grid[row][col].type = tiles[index++];
    }
  }

  // Ensure no matches and valid moves exist
  while (this.findMatches().length > 0 || !this.hasValidMoves()) {
    // Re-shuffle if we created matches or no valid moves
    this.reshuffleBoard();
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Callbacks for animation chains | async/await with Promise-wrapped tweens | 2020+ | Much cleaner cascade code, easier debugging |
| Create/destroy sprites | Object pooling with Groups | Always best practice | Prevents GC pauses, smoother gameplay |
| Single monolithic game class | Model-View separation | Always best practice | Testable logic, cleaner code |
| Manual state tracking | State machine pattern | Industry standard | Prevents input/animation race conditions |

**Deprecated/outdated:**
- **Phaser 2 patterns:** Phaser 3 has different scene lifecycle and input system
- **Direct sprite manipulation in loops:** Use tweens for all animations
- **Recursive functions for cascade:** Use iterative loop with depth counter (safer)

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal animation durations for mobile feel**
   - What we know: Swap ~150ms, Fall ~100ms per row, Clear ~200ms from various tutorials
   - What's unclear: Best values for KLO's visual style, may need tuning
   - Recommendation: Start with these values, playtest and adjust

2. **Programmatic tile drawing details**
   - What we know: Phase 1 uses Graphics API for colored rounded rectangles
   - What's unclear: Exact visual approach for 4 tile types (fuel, coffee, snack, road)
   - Recommendation: Extend existing drawTile pattern with type-specific icons/shapes

3. **Special tile creation (4-in-a-row, L/T shapes, 5-in-a-row)**
   - What we know: Requirements mention boosters, Phase 2 scope says "basic tiles only"
   - What's unclear: If Phase 2 should detect booster-creation patterns (but not create boosters)
   - Recommendation: Implement detection for scoring, defer booster mechanics to later phase

4. **Blocked cells (obstacles) interaction with gravity**
   - What we know: Level JSON has blocked_cells and obstacles
   - What's unclear: Do tiles fall "around" blocked cells or stop above them?
   - Recommendation: Tiles stop above blocked cells (standard behavior), implement in gravity algorithm

## Sources

### Primary (HIGH confidence)
- [Emanuele Feronato Match3 Pure JS Class](https://emanueleferonato.com/2018/12/17/pure-javascript-class-to-handle-match3-games-like-bejeweled-ready-to-communicate-with-your-favorite-html5-framework-phaser-3-example-included/) - Complete architecture pattern for Match3Engine separation
- [CS50 Games Match-3 Lecture](https://cs50.harvard.edu/games/notes/3/) - Match detection, gravity, cascade algorithms
- [Catlike Coding Match-3 Tutorial](https://catlikecoding.com/unity/tutorials/prototypes/match-3/) - Comprehensive architecture, no-valid-moves detection
- [Phaser 3 Tween Notes](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/tween/) - Tween chaining, callbacks, async patterns
- [Phaser 3 Group Notes](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/group/) - Object pooling with Groups
- [Phaser 3 Touch Events](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/touchevents/) - Input handling patterns
- [Phaser 3 Swipe Gesture](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/gesture-swipe/) - Swipe detection configuration

### Secondary (MEDIUM confidence)
- [Ourcade Object Pool Tutorial](https://blog.ourcade.co/posts/2020/phaser-3-optimization-object-pool-basic/) - Phaser Group pooling patterns
- [Azumo Match-3 Logic Article](https://azumo.com/insights/the-logic-behind-match-3-games) - State machine, cascade flow
- [Rembound Match-3 Canvas Tutorial](https://rembound.com/articles/how-to-make-a-match3-game-with-html5-canvas) - Board generation, reshuffle algorithm
- [Logic Simplified Match-3 Tricks](https://logicsimplified.com/newgames/key-algorithmic-tricks-for-match-3-game-development/) - Algorithm optimizations

### Tertiary (LOW confidence - patterns verified but implementation varies)
- Various Phaser Discord/forum discussions on animation timing
- Community tutorials on mobile gesture detection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing Phaser 3, no new dependencies needed
- Architecture: HIGH - Model-View pattern verified across multiple authoritative sources
- Algorithms: HIGH - Match detection, gravity, cascade patterns well-documented
- Pitfalls: HIGH - Common issues documented in multiple tutorials and discussions
- Animation timings: MEDIUM - General guidelines exist, exact values need playtesting

**Research date:** 2026-02-05
**Valid until:** 2026-03-05 (30 days - core algorithms are stable, Phaser 3 API stable)

**Note:** This phase builds on Phase 1's foundation. The Phaser 3 scene structure and programmatic drawing approach are already established. This phase focuses on game logic implementation patterns.
