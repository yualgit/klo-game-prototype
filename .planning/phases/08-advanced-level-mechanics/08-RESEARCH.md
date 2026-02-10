# Phase 08: Advanced Level Mechanics - Research

**Researched:** 2026-02-10
**Domain:** Match-3 game mechanics, non-rectangular boards, progressive obstacles, level data schemas
**Confidence:** MEDIUM-HIGH

## Summary

Phase 8 extends the existing Match3Engine and level data schema to support advanced mechanics: variable board shapes (non-rectangular grids), progressive multi-layer obstacles (3-state ice and grass), and pre-placed tiles (blockers and boosters at fixed positions). The codebase already has multi-layer obstacle infrastructure (`ObstacleData.layers`, damage mechanics, visual state rendering) and a robust Match3Engine with obstacle-aware gravity. The primary work is schema extension (adding `cell_map` and `pre_placed_tiles` to LevelData), algorithm adaptation (match detection and gravity for irregular shapes), and creating 5 new level JSONs (L6-L10) that showcase these mechanics.

The research reveals that modern match-3 games handle non-rectangular boards through cell state management (active/inactive flags or explicit cell maps) rather than requiring rectangular 2D arrays. Phaser 3 doesn't have native non-rectangular grid support, so custom logic is standard. Progressive obstacle visuals use state-based sprite swapping (already implemented: ice01→ice02→ice03 based on layers). Pre-placed tiles are JSON-defined initial board states that override random generation.

**Primary recommendation:** Extend the LevelData JSON schema with `cell_map` (per-row active cell configuration) and `pre_placed_tiles` (initial tile/booster positions). Modify Match3Engine methods (wouldCreateMatch, findMatches, applyGravity, hasValidMoves) to skip inactive cells. Rename `dirt` obstacle type to `grass` in code and assets. Create 5 new levels (L6-L10) demonstrating diamond/triangle/irregular shapes, 3-layer ice/grass obstacles, and pre-placed boosters.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser 3 | 3.85.0+ | Game framework | Industry standard for 2D HTML5 games, built-in tilemap/grid utilities |
| TypeScript | 5.x | Type safety | Prevents runtime errors in complex grid algorithms, self-documenting code |
| Vitest | Latest | Unit testing | Fast, TypeScript-native, already used for Match3Engine tests |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Phaser rex-plugins | Latest (optional) | Board/grid plugins | Only if custom grid logic becomes too complex (NOT NEEDED for this phase) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom cell map | Phaser Tilemap | Tilemap adds overhead for simple cell flags; current 2D array approach is lightweight and sufficient |
| JSON schema | TypeScript config | JSON allows non-developers to design levels; TypeScript requires code changes |
| Sparse matrix library | Custom 2D array with flags | External library is overkill; flag-based approach is simpler and performant |

**Installation:**
No new dependencies required. Existing Phaser 3 + TypeScript stack handles all requirements.

## Architecture Patterns

### Recommended Project Structure
```
data/levels/
├── level_001.json          # Existing rectangular levels
├── ...
├── level_006.json          # NEW: Diamond board + 3-layer ice
├── level_007.json          # NEW: Triangle board + 3-layer grass
├── level_008.json          # NEW: Irregular shape + pre-placed boosters
├── level_009.json          # NEW: Complex multi-obstacle
└── level_010.json          # NEW: Challenge level combining all mechanics

src/game/
├── types.ts                # Extend LevelData schema
├── Match3Engine.ts         # Adapt algorithms for non-rectangular boards
├── Match3Engine.test.ts    # Add tests for irregular boards
└── constants.ts            # Update OBSTACLE_TEXTURE_KEYS (rename dirt→grass)

src/scenes/
└── Game.ts                 # Handle pre-placed tiles on level init
```

### Pattern 1: Cell Map Schema
**What:** JSON array defining active cells per row to create non-rectangular boards
**When to use:** For levels with diamond, triangle, hexagonal, or irregular board shapes
**Example:**
```json
{
  "level_id": 6,
  "grid": {
    "width": 8,
    "height": 8,
    "cell_map": [
      [0, 0, 0, 1, 1, 0, 0, 0],  // Row 0: 2 active cells (diamond top)
      [0, 0, 1, 1, 1, 1, 0, 0],  // Row 1: 4 active cells
      [0, 1, 1, 1, 1, 1, 1, 0],  // Row 2: 6 active cells
      [1, 1, 1, 1, 1, 1, 1, 1],  // Row 3: 8 active cells (widest)
      [1, 1, 1, 1, 1, 1, 1, 1],  // Row 4: 8 active cells
      [0, 1, 1, 1, 1, 1, 1, 0],  // Row 5: 6 active cells
      [0, 0, 1, 1, 1, 1, 0, 0],  // Row 6: 4 active cells
      [0, 0, 0, 1, 1, 0, 0, 0]   // Row 7: 2 active cells (diamond bottom)
    ],
    "blocked_cells": []
  }
}
```
**Implementation:**
- 1 = active/playable cell (tiles can exist, spawn, fall through)
- 0 = inactive cell (no tile, no rendering, skipped by algorithms)
- Default (no `cell_map`): all cells active (backward compatible with L1-L5)

### Pattern 2: Pre-Placed Tiles Schema
**What:** JSON array defining initial board state tiles at fixed positions
**When to use:** For tutorial levels, guaranteed booster starts, or designed puzzle boards
**Example:**
```json
{
  "level_id": 8,
  "pre_placed_tiles": [
    {
      "row": 3,
      "col": 3,
      "type": "fuel",
      "booster": "linear_horizontal"
    },
    {
      "row": 4,
      "col": 4,
      "type": "coffee",
      "booster": "bomb"
    },
    {
      "row": 0,
      "col": 0,
      "type": "blocked",
      "obstacle": { "type": "blocked", "layers": 1 }
    }
  ]
}
```
**Implementation:**
- After `engine.generateGrid()`, iterate `pre_placed_tiles` and call `engine.setTileAt(row, col, tileData)`
- Pre-placed tiles override random generation
- Validate positions against `cell_map` (must be active cells)

### Pattern 3: Progressive Obstacle States (Already Implemented)
**What:** Multi-layer obstacles with visual state progression based on remaining layers
**Example:** Ice obstacle with 3 layers
```typescript
// TileSprite.ts (existing implementation)
case 'ice': {
  const iceKeys = OBSTACLE_TEXTURE_KEYS.ice; // ['ice01', 'ice02', 'ice03']
  // layers 3→ice01 (full), 2→ice02 (cracked), 1→ice03 (most broken)
  const idx = Math.max(0, Math.min(2, 3 - this.obstacleData.layers));
  const key = iceKeys[idx];
  this.obstacleImage = this.scene.add.image(0, 0, key);
  // ... render sprite
}
```
**Current state:** Already works for ice. Need to rename `dirt` → `grass` and verify 3-state assets exist.

### Pattern 4: Non-Rectangular Gravity Algorithm
**What:** Column-based gravity that skips inactive cells and handles irregular board edges
**When to use:** When `cell_map` defines non-rectangular boards
**Example:**
```typescript
// Modified applyGravity() pseudocode
for (let col = 0; col < this.cols; col++) {
  let writeRow = this.rows - 1;

  // Skip to lowest ACTIVE cell in this column
  while (writeRow >= 0 && !this.isCellActive(writeRow, col)) {
    writeRow--;
  }

  for (let readRow = writeRow; readRow >= 0; readRow--) {
    if (!this.isCellActive(readRow, col)) continue; // Skip inactive cells

    const tile = this.grid[readRow][col];
    if (tile.obstacle && tile.obstacle.layers > 0) {
      // Obstacle blocks gravity - update writeRow
      writeRow = readRow - 1;
      while (writeRow >= 0 && !this.isCellActive(writeRow, col)) {
        writeRow--;
      }
      continue;
    }

    if (!tile.isEmpty && readRow !== writeRow) {
      // Drop tile to writeRow
      // ... movement logic
    }
    writeRow--;
    while (writeRow >= 0 && !this.isCellActive(writeRow, col)) {
      writeRow--;
    }
  }
}
```
**Key insight:** Always check `isCellActive()` before reading/writing cells. Inactive cells are never read or written.

### Pattern 5: Match Detection for Non-Rectangular Boards
**What:** Horizontal/vertical streaming match detection that terminates at inactive cells
**When to use:** Always run findMatches() after swaps and spawns
**Example:**
```typescript
// Modified findMatches() horizontal scan pseudocode
for (let row = 0; row < this.rows; row++) {
  let startCol = 0;

  // Find first active cell in row
  while (startCol < this.cols && !this.isCellActive(row, startCol)) {
    startCol++;
  }

  if (startCol >= this.cols) continue; // Row is entirely inactive

  let currentType = this.grid[row][startCol].type;
  let matchLength = 1;

  for (let col = startCol + 1; col <= this.cols; col++) {
    const isActive = col < this.cols && this.isCellActive(row, col);
    const tile = isActive ? this.grid[row][col] : null;

    if (tile && !tile.isEmpty && tile.type === currentType && currentType !== 'empty') {
      matchLength++;
    } else {
      // Sequence ended (inactive cell, different type, or end of row)
      if (matchLength >= 3 && currentType !== 'empty') {
        // Found match - add to results
      }

      // Start new sequence (skip to next active cell)
      if (isActive && tile) {
        currentType = tile.type;
        startCol = col;
        matchLength = 1;
      } else {
        // Find next active cell
        col++;
        while (col < this.cols && !this.isCellActive(row, col)) {
          col++;
        }
        if (col < this.cols) {
          currentType = this.grid[row][col].type;
          startCol = col;
          matchLength = 1;
        }
      }
    }
  }
}
// Similar logic for vertical scans
```

### Anti-Patterns to Avoid
- **Hard-coding rectangular assumptions:** Don't assume `grid[r][c]` always exists or is playable. Always check `isCellActive()` or equivalent.
- **Spawning on inactive cells:** Don't spawn tiles on cells where `cell_map[r][c] === 0`.
- **Rendering invisible tiles:** Don't create TileSprite objects for inactive cells (waste of memory/performance).
- **Breaking backward compatibility:** If `cell_map` is missing, default to all cells active (rectangular board).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Grid coordinate math | Custom xy↔index conversion | Existing 2D array `grid[row][col]` | Already implemented, tested, and working |
| Obstacle damage tracking | Custom state machine per obstacle | Existing `ObstacleData.layers` + `damageObstacles()` | Already handles multi-layer logic, goal tracking, visual updates |
| Visual state progression | Frame-based animations | Sprite swapping based on `layers` count | TileSprite already implements this (lines 292-334) |
| Level data loading | Custom parser | Phaser's `cache.json.get()` | Already integrated in Game.ts |
| Cell activity checks | Multiple flag fields | Single `cell_map` array or `isCellActive()` helper | Simpler, faster, less error-prone |

**Key insight:** The codebase already has 80% of the infrastructure. Extend existing patterns rather than introducing new systems.

## Common Pitfalls

### Pitfall 1: Off-by-One Errors in Cell Map Indexing
**What goes wrong:** Accessing `cell_map[row][col]` with swapped row/col or without bounds checking causes crashes.
**Why it happens:** Cell map is `[row][col]` but some devs think in `[x][y]` (col/row).
**How to avoid:**
- Always use `grid[row][col]` pattern (vertical first, horizontal second)
- Validate `row < height` and `col < width` before accessing
- Write `isCellActive(row, col)` helper that handles bounds + map checks
**Warning signs:** "Cannot read property of undefined" errors in Match3Engine methods.

### Pitfall 2: Gravity Algorithm Doesn't Handle Irregular Shapes
**What goes wrong:** Tiles fall through inactive cells or get stuck at irregular board edges.
**Why it happens:** Original gravity algorithm assumes rectangular grid with all cells active.
**How to avoid:**
- Before reading/writing `grid[row][col]`, check `isCellActive(row, col)`
- When scanning for `writeRow`, skip inactive cells: `while (!isCellActive(writeRow, col)) writeRow--;`
- Test with extreme shapes (single-column boards, zigzag edges) to catch edge cases
**Warning signs:** Tiles vanishing, spawning in wrong locations, or frozen on irregular edges.

### Pitfall 3: Match Detection Treats Inactive Cells as Gaps
**What goes wrong:** Matches stop at inactive cells when they should continue (or vice versa).
**Why it happens:** Streaming algorithm needs to distinguish "end of sequence" (inactive cell) from "continue sequence" (active cell).
**How to avoid:**
- Inactive cells always terminate match sequences (they're not part of the board)
- Don't count inactive cells in match length
- Reset `matchLength` and `startPos` when hitting inactive cell
**Warning signs:** Matches detected across gaps, or valid matches not detected near irregular edges.

### Pitfall 4: Pre-Placed Tiles Create Initial Matches
**What goes wrong:** Level starts with pre-placed tiles that form immediate matches, breaking game state.
**Why it happens:** Pre-placed tiles are set AFTER `generateGrid()` without checking for matches.
**How to avoid:**
- After applying pre-placed tiles, run `engine.findMatches()`
- If matches exist, either:
  - Modify pre-placed tile positions (design fix)
  - Run `processTurn()` immediately to clear them (gameplay fix)
- Better: Validate level JSONs offline with a test script
**Warning signs:** Level starts with cascading matches, incorrect move count on level load.

### Pitfall 5: Obstacle Type Renaming Breaks Assets
**What goes wrong:** Renaming `dirt` → `grass` in code but forgetting to update asset keys, level JSONs, or visual rendering causes missing textures.
**Why it happens:** String-based type systems are fragile; multiple places reference obstacle types.
**How to avoid:**
- Update `ObstacleType` enum in `types.ts`: `'dirt' | 'grass'` → just `'grass'`
- Update `OBSTACLE_TEXTURE_KEYS` in `constants.ts`: `dirt: [...]` → `grass: [...]`
- Search all level JSONs for `"type": "dirt"` and replace with `"type": "grass"`
- Update TileSprite.ts `drawObstacle()` case statement: `case 'dirt':` → `case 'grass':`
- Update GAME_DESIGN.md documentation
**Warning signs:** "Texture not found" console errors, obstacles rendering as fallback graphics.

### Pitfall 6: Forgetting Backward Compatibility
**What goes wrong:** Adding `cell_map` and `pre_placed_tiles` to schema breaks existing L1-L5 levels.
**Why it happens:** New required fields cause parsing errors on old JSONs.
**How to avoid:**
- Make new fields optional: `cell_map?: number[][]` and `pre_placed_tiles?: PrePlacedTile[]`
- Default behavior: if `cell_map` is undefined, treat all cells as active (rectangular board)
- If `pre_placed_tiles` is undefined, skip pre-placement step
**Warning signs:** Existing levels won't load, error logs mention missing properties.

## Code Examples

Verified patterns from existing codebase and standard match-3 implementations:

### Helper: Check Cell Activity
```typescript
// Add to Match3Engine class
private cellMap?: number[][]; // Set from LevelData.grid.cell_map

/**
 * Check if a cell is active (playable) on the board.
 * Returns false for out-of-bounds, inactive cells, or blocked obstacles.
 */
private isCellActive(row: number, col: number): boolean {
  // Bounds check
  if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
    return false;
  }

  // If no cell map, all cells are active (backward compatibility)
  if (!this.cellMap) {
    return true;
  }

  // Check cell map
  return this.cellMap[row][col] === 1;
}
```

### Initialize Cell Map from Level Data
```typescript
// In Match3Engine constructor or new method
public setCellMap(cellMap?: number[][]): void {
  this.cellMap = cellMap;

  // Mark inactive cells in grid as blocked obstacles
  if (cellMap) {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (cellMap[row][col] === 0) {
          // Mark as inactive - set empty with no spawn
          this.grid[row][col] = {
            row,
            col,
            type: 'empty',
            isEmpty: true,
            id: this.generateTileId(),
            obstacle: { type: 'blocked', layers: 1 }, // Treated as permanent blocker
          };
        }
      }
    }
  }
}
```

### Apply Pre-Placed Tiles (Game.ts)
```typescript
// After engine.generateGrid() and engine.initializeObstacles()
if (this.levelData.pre_placed_tiles) {
  this.levelData.pre_placed_tiles.forEach((prePlaced: any) => {
    const { row, col, type, booster, obstacle } = prePlaced;

    // Validate position is active
    if (!this.engine.isCellActive(row, col)) {
      console.warn(`[Game] Pre-placed tile at (${row},${col}) is on inactive cell - skipping`);
      return;
    }

    // Set tile data
    this.engine.setTileAt(row, col, {
      type: type as TileType,
      booster: booster as BoosterType | undefined,
      obstacle: obstacle as ObstacleData | undefined,
    });
  });

  // Check for accidental initial matches
  const initialMatches = this.engine.findMatches();
  if (initialMatches.length > 0) {
    console.warn('[Game] Pre-placed tiles created initial matches - processing immediately');
    this.engine.removeMatches(initialMatches);
    this.engine.applyGravity();
    this.engine.spawnNewTiles(this.levelData.spawn_rules);
  }
}
```

### Modified Gravity for Non-Rectangular Boards
```typescript
// In Match3Engine.applyGravity()
applyGravity(): Movement[] {
  const movements: Movement[] = [];

  for (let col = 0; col < this.cols; col++) {
    // Find lowest active cell in column
    let writeRow = this.rows - 1;
    while (writeRow >= 0 && !this.isCellActive(writeRow, col)) {
      writeRow--;
    }

    if (writeRow < 0) continue; // Column is entirely inactive

    for (let readRow = writeRow; readRow >= 0; readRow--) {
      if (!this.isCellActive(readRow, col)) continue; // Skip inactive cells

      const tile = this.grid[readRow][col];

      // Tiles with obstacles stay in place
      if (tile.obstacle && tile.obstacle.layers > 0 && tile.obstacle.type !== 'blocked') {
        if (readRow <= writeRow) {
          writeRow = readRow - 1;
          // Skip inactive cells above
          while (writeRow >= 0 && !this.isCellActive(writeRow, col)) {
            writeRow--;
          }
        }
        continue;
      }

      if (!tile.isEmpty) {
        if (readRow !== writeRow) {
          // Tile falls to writeRow
          movements.push({
            tileId: tile.id,
            fromRow: readRow,
            fromCol: col,
            toRow: writeRow,
            toCol: col,
          });

          this.grid[writeRow][col] = { ...tile, row: writeRow, col };
          this.grid[readRow][col] = {
            row: readRow,
            col,
            type: 'empty',
            isEmpty: true,
            id: this.generateTileId(),
          };
        }
        writeRow--;
        // Skip inactive cells above
        while (writeRow >= 0 && !this.isCellActive(writeRow, col)) {
          writeRow--;
        }
      }
    }
  }

  return movements;
}
```

### Modified Spawn for Non-Rectangular Boards
```typescript
// In Match3Engine.spawnNewTiles()
spawnNewTiles(spawnRules: SpawnRules): SpawnData[] {
  const spawns: SpawnData[] = [];

  for (let row = 0; row < this.rows; row++) {
    for (let col = 0; col < this.cols; col++) {
      // Skip inactive cells
      if (!this.isCellActive(row, col)) continue;

      const tile = this.grid[row][col];

      // Don't spawn on blocked cells
      if (tile.obstacle?.type === 'blocked') continue;

      if (tile.isEmpty) {
        const type = this.getRandomTileType(spawnRules);
        const tileId = this.generateTileId();

        this.grid[row][col] = {
          row,
          col,
          type,
          isEmpty: false,
          id: tileId,
        };

        spawns.push({ row, col, type, tileId });
      }
    }
  }

  return spawns;
}
```

### Rename Dirt to Grass (constants.ts)
```typescript
// Before:
export const OBSTACLE_TEXTURE_KEYS = {
  crate: 'obstacle_bubble',
  ice: ['obstacle_ice01', 'obstacle_ice02', 'obstacle_ice03'],
  grass: ['obstacle_grss01', 'obstacle_grss02', 'obstacle_grss03'], // Already named grass in assets!
} as const;

// Update types.ts:
export type ObstacleType = 'ice' | 'grass' | 'crate' | 'blocked'; // Remove 'dirt'

// Update TileSprite.ts drawObstacle():
case 'grass': { // Changed from 'dirt'
  const grassKeys = OBSTACLE_TEXTURE_KEYS.grass;
  const idx = Math.max(0, Math.min(2, 3 - this.obstacleData.layers));
  const key = grassKeys[idx];
  this.obstacleImage = this.scene.add.image(0, 0, key);
  this.obstacleImage.setDisplaySize(targetSize, targetSize);
  this.obstacleImage.setAlpha(0.85);
  this.add(this.obstacleImage);
  break;
}
```

### Level 6 JSON Example (Diamond Board + 3-Layer Ice)
```json
{
  "level_id": 6,
  "name": "Діамантове поле",
  "moves": 18,
  "grid": {
    "width": 8,
    "height": 8,
    "cell_map": [
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 0, 0, 0]
    ],
    "blocked_cells": []
  },
  "goals": [
    {
      "type": "collect",
      "item": "fuel",
      "count": 25,
      "description": "Зібрати 25 паливо"
    },
    {
      "type": "destroy_obstacle",
      "obstacleType": "ice",
      "count": 9,
      "description": "Знищити 9 шарів льоду"
    }
  ],
  "spawn_rules": {
    "fuel": 0.4,
    "coffee": 0.2,
    "snack": 0.2,
    "road": 0.2
  },
  "obstacles": [
    {
      "type": "ice",
      "layers": 3,
      "positions": [
        [3, 3],
        [3, 4],
        [4, 3]
      ],
      "description": "Лід має 3 шари - потрібно 3 матчі поряд"
    }
  ],
  "difficulty": "medium",
  "target_fail_rate": 0.20
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-hit obstacles | Multi-layer progressive obstacles (3 states) | Industry standard since ~2015 (Candy Crush) | More strategic gameplay, clearer visual feedback |
| Rectangular grids only | Variable board shapes with cell maps | Common in modern match-3 (~2018+) | Increased level variety, fresher gameplay |
| Hard-coded initial boards | JSON-defined pre-placed tiles | Standard since ~2016 | Level designers can create puzzle scenarios without code |
| Frame-based animations for damage | Sprite swapping based on state count | Performance optimization (~2020+) | Lower memory, faster rendering, easier to balance |
| Tiled/external map editor | In-game JSON schema | Shift toward data-driven design (~2019+) | Faster iteration, no external tool dependencies |

**Deprecated/outdated:**
- **Single-layer obstacles:** Modern match-3 games use 2-4 layer obstacles for progression depth. Single-hit is only for tutorial levels.
- **Phaser 2 Grid API:** Phaser 3's Grid GameObject is deprecated for game logic (only visual grid rendering). Use 2D arrays instead.
- **XML level definitions:** JSON is the standard for web-based games (easier parsing, better TypeScript integration).

## Open Questions

1. **Should cell_map support more than binary (0/1) values?**
   - What we know: Binary is standard for active/inactive. Some games use 0=inactive, 1=active, 2=special (e.g., no spawn but tiles can pass through)
   - What's unclear: Whether KLO Match-3 needs pass-through cells or other states
   - Recommendation: Start with binary (0/1). Extend to multi-value if Phase 9+ requires special cell types.

2. **How should gravity handle diagonal board edges?**
   - What we know: Column-based vertical gravity works for most irregular shapes (diamonds, triangles, zigzag edges)
   - What's unclear: Extremely complex shapes (e.g., inverted-L corridors) might need diagonal gravity
   - Recommendation: Use vertical-only gravity for Phase 8. If L6-L10 designs reveal issues, add diagonal fall logic in Phase 9.

3. **Should pre-placed tiles be validated at JSON load time or runtime?**
   - What we know: Runtime validation is simpler (happens in Game.ts). Offline validation prevents bad levels from shipping.
   - What's unclear: Whether we need a separate level validation script
   - Recommendation: Runtime validation for Phase 8 (faster development). Add offline validator if level design becomes complex (Phase 9+).

4. **Do we need a level editor UI?**
   - What we know: JSON editing is sufficient for 5 levels. Hand-editing is error-prone at scale (20+ levels).
   - What's unclear: Timeline for reaching 20+ levels, whether designer prefers UI vs JSON
   - Recommendation: JSON-only for Phase 8 (L6-L10). Evaluate editor UI in Phase 10 based on designer feedback.

5. **Should inactive cells be rendered (grayed out) or completely hidden?**
   - What we know: Completely hidden is cleaner (floating board effect). Grayed-out shows full grid shape (helps player understand boundaries).
   - What's unclear: User preference, whether transparency causes confusion
   - Recommendation: Start with completely hidden (don't render TileSprites for inactive cells). Add grayed-out background tiles if playtesting shows boundary confusion.

## Sources

### Primary (HIGH confidence)
- **Existing codebase analysis:**
  - `/src/game/types.ts` - Current LevelData and ObstacleData schema
  - `/src/game/Match3Engine.ts` - Gravity, match detection, obstacle damage algorithms
  - `/src/game/TileSprite.ts` - Visual obstacle state rendering (lines 266-361)
  - `/src/game/constants.ts` - Obstacle texture keys and type definitions
  - `/data/levels/level_001.json` - Current level JSON schema
  - `/GAME_DESIGN.md` - Level progression plan (L1-L20)

### Secondary (MEDIUM confidence)
- [45 Match-3 Mechanics](https://www.gamedeveloper.com/design/45-match-3-mechanics) - Multi-level element blocking (verified by multiple sources)
- [Flutter Crush: How to build a Match-3 game](https://medium.com/flutter-community/flutter-crush-debee5f389c3) - Board state representation with PLAYFIELD/BLOCK/GAP cell types
- [The Logic Behind Match-3 Games: Building with Unity & C#](https://azumo.com/insights/the-logic-behind-match-3-games) - 2D grid implementation using `array[x + y * width]` formula
- [Smart & Casual: Match 3 Games Level Design](https://room8studio.com/news/smart-casual-the-state-of-tile-puzzle-games-level-design-part-1/) - Pre-generated seed boards for solvability
- [Hexagon map - Notes of Phaser 3](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/board-hexagonmap/) - Phaser 3 support for non-rectangular tile geometries
- [Visual Feedback in Game Design](https://icon-era.com/blog/visual-feedback-in-game-design-why-animation-matters-for-engagement.532/) - State-based animations for progressive damage (2026 standards)
- [Match-3 puzzle game algorithms - GameDev.net](https://www.gamedev.net/forums/topic/677073-match-3-puzzle-game-algorithms/) - Gravity algorithm details (column scan, hole tracking)

### Tertiary (LOW confidence - needs verification)
- [Match 3 Puzzle Game Development Guide](https://nagorik.tech/blog/uncategorized/match-3-puzzle-game-development/) - General match-3 patterns (no specific non-rectangular board implementation details)
- [Phaser 3 API - Matrix Utils](https://photonstorm.github.io/phaser3-docs/Phaser.Utils.Array.Matrix.html) - Matrix utilities (sparse matrix not covered)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, existing Phaser 3 + TypeScript handles all requirements
- Architecture patterns (cell_map, pre_placed_tiles): HIGH - Verified by existing codebase + industry sources
- Architecture patterns (non-rectangular algorithms): MEDIUM - Conceptually sound, but not yet tested in this codebase
- Pitfalls: HIGH - Based on existing code analysis and common match-3 development issues documented in multiple sources
- Code examples: HIGH - Derived from existing Match3Engine.ts patterns (gravity, spawn, match detection)
- Open questions: MEDIUM - Strategic decisions requiring playtesting or designer input

**Research date:** 2026-02-10
**Valid until:** 60 days (stable domain - match-3 mechanics are mature, Phaser 3 API is stable)

**Key assumptions:**
1. Existing obstacle infrastructure (layers, damage, visuals) works correctly (verified by code review)
2. Phaser 3.85.0+ API remains stable for grid/sprite rendering (safe assumption - mature framework)
3. 5 new levels (L6-L10) are sufficient to validate mechanics before scaling to L11-L20
4. TypeScript strict mode catches most type-related bugs in grid algorithms (enabled in project)
5. Assets for 3-layer grass exist (`grss01.png`, `grss02.png`, `grss03.png`) - needs verification in Boot.ts asset loading

**Validation steps for planner:**
- Verify grass assets are loaded in Boot.ts preload() method
- Confirm existing L1-L5 JSONs don't have `cell_map` or `pre_placed_tiles` (backward compatibility check)
- Test existing gravity algorithm with extreme cases (1-column board, zigzag edges) to identify edge cases
- Review GAME_DESIGN.md L6-L10 descriptions to align with JSON designs
