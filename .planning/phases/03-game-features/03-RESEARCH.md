# Phase 3: Game Features - Research

**Researched:** 2026-02-06
**Domain:** Match-3 Boosters, Obstacles, Level Goals, and Game State Management
**Confidence:** HIGH

## Summary

Phase 3 implements the complete match-3 game feature set: booster creation (4 types), obstacles (4 types), and level goals with move tracking. Research confirms that booster systems follow well-established pattern detection algorithms, obstacle systems use layer-based damage models, and level goals require event-driven tracking separate from core match logic.

The recommended architecture extends the existing Match3Engine with booster detection during match analysis, obstacle data in grid tiles, and a separate LevelManager class for goal tracking. Boosters are created by analyzing match geometry (4-in-a-row → line clear, L/T-shape → bomb, 5-in-a-row → color clear), obstacles are damaged by adjacent matches, and goals track match/spawn/booster events to determine win/lose conditions.

Key implementation insights: (1) Booster detection happens DURING match finding by analyzing match shape and size, returning both standard tile removal AND special tile spawns; (2) Obstacles are tile properties with layer counts that decrement on adjacent match damage; (3) Level goals use an event-driven observer pattern to avoid coupling game logic with UI; (4) Move counter decrements ONLY on valid swaps, not reverted ones; (5) Booster combos use a lookup table mapping booster type pairs to combined effects.

**Primary recommendation:** Extend Match3Engine with booster detection in findMatches(), add obstacle layer tracking to TileData, create LevelManager class for goal/move tracking, and implement booster activation as cascading match events that feed back into the standard cascade loop.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser 3 | 3.90.0 | Rendering, animations | Already in project, used in Phase 2 |
| TypeScript | 5.7.x | Type safety for complex logic | Already configured, essential for booster combo matrix |
| Jest | Latest | Unit testing game logic | Already in project for TDD approach |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None required | - | - | Existing stack sufficient |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom booster system | Match-3 library (Pixi.js Match3 plugin) | Libraries add dependencies; pattern is well-documented enough to implement |
| Manual goal tracking | State machine library (XState) | Overkill for linear goal tracking; simple event observer sufficient |

**Installation:**
```bash
# No additional packages needed - using existing stack
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── game/
│   ├── Match3Engine.ts          # Extended with booster detection
│   ├── types.ts                 # Add BoosterType, ObstacleType, LevelGoal
│   ├── TileSprite.ts            # Extended with booster/obstacle visuals
│   ├── BoosterActivator.ts      # Booster activation logic (NEW)
│   ├── LevelManager.ts          # Goal tracking, move counter (NEW)
│   └── constants.ts             # Booster combos, obstacle configs
├── scenes/
│   └── Game.ts                  # Integration with LevelManager
└── data/
    └── boosterCombos.ts         # Lookup table for booster interactions
```

### Pattern 1: Booster Detection in Match Analysis
**What:** During match finding, analyze match geometry to determine if special tiles should spawn.
**When to use:** Always for match-3 boosters - detection must happen before tile removal.
**Example:**
```typescript
// In Match3Engine.ts
interface MatchResult {
  tilesToRemove: TileData[];
  boostersToSpawn: BoosterSpawn[];
}

interface BoosterSpawn {
  row: number;
  col: number;
  boosterType: 'linear_horizontal' | 'linear_vertical' | 'bomb' | 'rocket' | 'klo_sphere';
  baseType: TileType; // Color of booster
}

findMatchesWithBoosters(): MatchResult {
  const matches = this.findMatches(); // Existing O(n) streaming algorithm
  const tilesToRemove: TileData[] = [];
  const boostersToSpawn: BoosterSpawn[] = [];

  matches.forEach(match => {
    const matchLength = match.tiles.length;
    const matchType = match.type;

    // Check for L/T-shape (tile in both horizontal and vertical match)
    const intersectionTile = this.findIntersectionTile(matches);
    if (intersectionTile) {
      // L/T-shape detected → Bomb
      boostersToSpawn.push({
        row: intersectionTile.row,
        col: intersectionTile.col,
        boosterType: 'bomb',
        baseType: matchType
      });
      tilesToRemove.push(...this.getTilesInBothMatches(matches, intersectionTile));
      return; // Don't process as separate matches
    }

    // Linear matches
    if (matchLength === 4) {
      // 4-in-a-row → Line clear booster
      const spawnPos = Math.floor(matchLength / 2); // Middle position
      const tile = match.tiles[spawnPos];
      boostersToSpawn.push({
        row: tile.row,
        col: tile.col,
        boosterType: match.direction === 'horizontal' ? 'linear_horizontal' : 'linear_vertical',
        baseType: matchType
      });
    } else if (matchLength === 5) {
      // 5-in-a-row → KLO-sphere (color clear)
      const spawnPos = Math.floor(matchLength / 2);
      const tile = match.tiles[spawnPos];
      boostersToSpawn.push({
        row: tile.row,
        col: tile.col,
        boosterType: 'klo_sphere',
        baseType: matchType
      });
    }

    tilesToRemove.push(...match.tiles);
  });

  return { tilesToRemove, boostersToSpawn };
}

// Helper to find tiles that exist in both horizontal AND vertical matches
private findIntersectionTile(matches: Match[]): TileData | null {
  const horizontalMatches = matches.filter(m => m.direction === 'horizontal');
  const verticalMatches = matches.filter(m => m.direction === 'vertical');

  for (const hMatch of horizontalMatches) {
    for (const vMatch of verticalMatches) {
      for (const hTile of hMatch.tiles) {
        for (const vTile of vMatch.tiles) {
          if (hTile.row === vTile.row && hTile.col === vTile.col) {
            return hTile; // Intersection point
          }
        }
      }
    }
  }
  return null;
}
```

### Pattern 2: Obstacle Layer System
**What:** Obstacles are tile properties with layer counts that decrement when adjacent matches occur.
**When to use:** Required for ice, dirt, crates - standard match-3 obstacle pattern.
**Example:**
```typescript
// In types.ts
export interface ObstacleData {
  type: 'ice' | 'dirt' | 'crate' | 'none';
  layers: number; // How many hits to destroy
}

export interface TileData {
  row: number;
  col: number;
  type: TileType;
  isEmpty: boolean;
  id: string;
  obstacle?: ObstacleData; // NEW: Optional obstacle on tile
  booster?: BoosterType; // NEW: Optional booster type
}

// In Match3Engine.ts
damageObstacles(matches: Match[]): ObstacleData[] {
  const damagedObstacles: ObstacleData[] = [];

  matches.forEach(match => {
    match.tiles.forEach(tile => {
      // Damage obstacle on matched tile
      if (tile.obstacle && tile.obstacle.layers > 0) {
        tile.obstacle.layers--;
        damagedObstacles.push(tile.obstacle);

        if (tile.obstacle.layers === 0) {
          tile.obstacle.type = 'none';
        }
      }

      // Damage adjacent obstacles (for dirt, ice behavior)
      const adjacentTiles = this.getAdjacentTiles(tile.row, tile.col);
      adjacentTiles.forEach(adjTile => {
        if (adjTile.obstacle && adjTile.obstacle.layers > 0) {
          // Ice and dirt take damage from adjacent matches
          if (adjTile.obstacle.type === 'ice' || adjTile.obstacle.type === 'dirt') {
            adjTile.obstacle.layers--;
            damagedObstacles.push(adjTile.obstacle);

            if (adjTile.obstacle.layers === 0) {
              adjTile.obstacle.type = 'none';
            }
          }
        }
      });
    });
  });

  return damagedObstacles;
}

// Gravity respects obstacles
applyGravity(): Movement[] {
  const movements: Movement[] = [];

  for (let col = 0; col < this.cols; col++) {
    let writeRow = this.rows - 1;

    for (let readRow = this.rows - 1; readRow >= 0; readRow--) {
      const tile = this.grid[readRow][col];

      // Skip blocked cells (permanent obstacles)
      if (tile.obstacle?.type === 'blocked') {
        writeRow--;
        continue;
      }

      // Tiles with ice/dirt/crate obstacles don't move
      if (tile.obstacle && tile.obstacle.type !== 'none' && tile.obstacle.type !== 'blocked') {
        // Obstacle blocks movement - tile stays in place
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

          this.grid[writeRow][col] = { ...tile, row: writeRow };
          this.grid[readRow][col] = {
            row: readRow,
            col,
            type: 'empty',
            isEmpty: true,
            id: this.generateTileId(),
          };
        }
        writeRow--;
      }
    }
  }

  return movements;
}
```

### Pattern 3: Level Goal Tracking with Event Observer
**What:** LevelManager listens to game events (matches, spawns, boosters) and tracks progress toward goals.
**When to use:** Always for level systems - decouples goal logic from game mechanics.
**Example:**
```typescript
// In types.ts
export interface LevelGoal {
  type: 'collect' | 'destroy_obstacle' | 'create_booster';
  item?: TileType; // For collect goals
  obstacleType?: ObstacleType; // For obstacle goals
  boosterType?: BoosterType; // For booster goals
  count: number;
  current: number; // Progress tracking
  description: string;
}

export interface LevelData {
  level_id: number;
  moves: number;
  goals: LevelGoal[];
  spawn_rules: SpawnRules;
  obstacles: ObstacleConfig[];
}

// In LevelManager.ts
export class LevelManager {
  private levelData: LevelData;
  private movesRemaining: number;
  private goals: LevelGoal[];
  private listeners: Array<(event: LevelEvent) => void> = [];

  constructor(levelData: LevelData) {
    this.levelData = levelData;
    this.movesRemaining = levelData.moves;
    this.goals = levelData.goals.map(g => ({ ...g, current: 0 }));
  }

  // Called by Game scene after valid swap
  decrementMoves(): void {
    this.movesRemaining--;
    this.notifyListeners({ type: 'moves_changed', movesRemaining: this.movesRemaining });

    if (this.movesRemaining <= 0) {
      this.checkWinLoseCondition();
    }
  }

  // Called when tiles are matched and removed
  onTilesMatched(tiles: TileData[]): void {
    const tileCounts = new Map<TileType, number>();

    tiles.forEach(tile => {
      const count = tileCounts.get(tile.type) || 0;
      tileCounts.set(tile.type, count + 1);
    });

    // Update collect goals
    this.goals.forEach(goal => {
      if (goal.type === 'collect' && goal.item) {
        const matched = tileCounts.get(goal.item) || 0;
        goal.current = Math.min(goal.current + matched, goal.count);
      }
    });

    this.notifyListeners({ type: 'goals_updated', goals: this.goals });
    this.checkWinLoseCondition();
  }

  // Called when obstacles are destroyed
  onObstaclesDestroyed(obstacles: ObstacleData[]): void {
    const obstacleCounts = new Map<ObstacleType, number>();

    obstacles.forEach(obs => {
      if (obs.layers === 0) { // Fully destroyed
        const count = obstacleCounts.get(obs.type) || 0;
        obstacleCounts.set(obs.type, count + 1);
      }
    });

    // Update destroy obstacle goals
    this.goals.forEach(goal => {
      if (goal.type === 'destroy_obstacle' && goal.obstacleType) {
        const destroyed = obstacleCounts.get(goal.obstacleType) || 0;
        goal.current = Math.min(goal.current + destroyed, goal.count);
      }
    });

    this.notifyListeners({ type: 'goals_updated', goals: this.goals });
    this.checkWinLoseCondition();
  }

  // Called when booster is created
  onBoosterCreated(boosterType: BoosterType): void {
    this.goals.forEach(goal => {
      if (goal.type === 'create_booster' && goal.boosterType === boosterType) {
        goal.current = Math.min(goal.current + 1, goal.count);
      }
    });

    this.notifyListeners({ type: 'goals_updated', goals: this.goals });
    this.checkWinLoseCondition();
  }

  private checkWinLoseCondition(): void {
    const allGoalsComplete = this.goals.every(g => g.current >= g.count);

    if (allGoalsComplete) {
      this.notifyListeners({ type: 'level_won' });
    } else if (this.movesRemaining <= 0) {
      this.notifyListeners({ type: 'level_lost' });
    }
  }

  subscribe(listener: (event: LevelEvent) => void): void {
    this.listeners.push(listener);
  }

  private notifyListeners(event: LevelEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  getGoals(): LevelGoal[] {
    return [...this.goals];
  }

  getMovesRemaining(): number {
    return this.movesRemaining;
  }
}
```

### Pattern 4: Booster Activation System
**What:** When booster is matched or swapped with another booster, activate its effect as a new cascade event.
**When to use:** Required for booster mechanics - activation triggers tile removal like normal matches.
**Example:**
```typescript
// In BoosterActivator.ts
export class BoosterActivator {
  constructor(private engine: Match3Engine) {}

  activateBooster(booster: TileData): TileData[] {
    const tilesToRemove: TileData[] = [];

    switch (booster.booster) {
      case 'linear_horizontal':
        // Remove entire row
        tilesToRemove.push(...this.engine.getTilesInRow(booster.row));
        break;

      case 'linear_vertical':
        // Remove entire column
        tilesToRemove.push(...this.engine.getTilesInColumn(booster.col));
        break;

      case 'bomb':
        // Remove 3×3 area
        tilesToRemove.push(...this.engine.getTilesInRadius(booster.row, booster.col, 1));
        break;

      case 'rocket':
        // Remove cross (row + column)
        tilesToRemove.push(...this.engine.getTilesInRow(booster.row));
        tilesToRemove.push(...this.engine.getTilesInColumn(booster.col));
        break;

      case 'klo_sphere':
        // Remove all tiles of same base color
        tilesToRemove.push(...this.engine.getTilesByType(booster.type));
        break;
    }

    return tilesToRemove;
  }

  activateBoosterCombo(booster1: TileData, booster2: TileData): TileData[] {
    const combo = this.getComboType(booster1.booster!, booster2.booster!);
    const tilesToRemove: TileData[] = [];

    switch (combo) {
      case 'linear_linear':
        // Two line clears → Rocket (cross)
        tilesToRemove.push(...this.engine.getTilesInRow(booster1.row));
        tilesToRemove.push(...this.engine.getTilesInColumn(booster1.col));
        break;

      case 'bomb_bomb':
        // Two bombs → Larger explosion (5×5)
        tilesToRemove.push(...this.engine.getTilesInRadius(booster1.row, booster1.col, 2));
        break;

      case 'linear_bomb':
        // Line clear + bomb → Clear 3 rows/cols
        if (booster1.booster === 'linear_horizontal') {
          for (let i = -1; i <= 1; i++) {
            tilesToRemove.push(...this.engine.getTilesInRow(booster1.row + i));
          }
        } else {
          for (let i = -1; i <= 1; i++) {
            tilesToRemove.push(...this.engine.getTilesInColumn(booster1.col + i));
          }
        }
        break;

      case 'klo_sphere_any':
        // KLO-sphere + any booster → Convert all tiles of that color to boosters, then activate
        const targetType = booster2.type;
        const allTiles = this.engine.getTilesByType(targetType);
        // This creates cascading booster activations
        allTiles.forEach(tile => {
          tile.booster = booster2.booster;
        });
        tilesToRemove.push(...allTiles);
        break;

      default:
        // No special combo - activate both separately
        tilesToRemove.push(...this.activateBooster(booster1));
        tilesToRemove.push(...this.activateBooster(booster2));
    }

    return tilesToRemove;
  }

  private getComboType(type1: BoosterType, type2: BoosterType): string {
    if (type1 === 'klo_sphere' || type2 === 'klo_sphere') {
      return 'klo_sphere_any';
    }

    const sorted = [type1, type2].sort().join('_');
    const comboMap: Record<string, string> = {
      'linear_horizontal_linear_vertical': 'linear_linear',
      'linear_horizontal_linear_horizontal': 'linear_linear',
      'linear_vertical_linear_vertical': 'linear_linear',
      'bomb_bomb': 'bomb_bomb',
      'bomb_linear_horizontal': 'linear_bomb',
      'bomb_linear_vertical': 'linear_bomb',
    };

    return comboMap[sorted] || 'default';
  }
}
```

### Pattern 5: Booster Visual States in TileSprite
**What:** Extend TileSprite to render booster overlays and obstacle layers.
**When to use:** Required for visual feedback of game state.
**Example:**
```typescript
// In TileSprite.ts extension
export class TileSprite extends Phaser.GameObjects.Container {
  private graphics: Phaser.GameObjects.Graphics;
  private boosterGraphics?: Phaser.GameObjects.Graphics; // NEW
  private obstacleGraphics?: Phaser.GameObjects.Graphics; // NEW

  private draw(): void {
    // Clear all graphics
    this.graphics.clear();
    this.boosterGraphics?.clear();
    this.obstacleGraphics?.clear();

    // Draw base tile
    const tileSize = TILE_SIZE - TILE_GAP;
    const halfSize = tileSize / 2;
    const color = TILE_COLORS[this.type];

    this.graphics.fillStyle(color, 1);
    this.graphics.fillRoundedRect(-halfSize, -halfSize, tileSize, tileSize, 8);

    // Draw booster overlay if present
    if (this.booster) {
      this.drawBooster(this.booster);
    }

    // Draw obstacle overlay if present
    if (this.obstacle && this.obstacle.type !== 'none') {
      this.drawObstacle(this.obstacle);
    }
  }

  private drawBooster(boosterType: BoosterType): void {
    if (!this.boosterGraphics) {
      this.boosterGraphics = this.scene.add.graphics();
      this.add(this.boosterGraphics);
    }

    const tileSize = TILE_SIZE - TILE_GAP;
    const halfSize = tileSize / 2;

    this.boosterGraphics.lineStyle(3, 0xffffff, 1);

    switch (boosterType) {
      case 'linear_horizontal':
        // Horizontal arrow
        this.boosterGraphics.strokeRect(-halfSize + 10, -5, tileSize - 20, 10);
        this.boosterGraphics.fillTriangle(halfSize - 5, 0, halfSize - 15, -8, halfSize - 15, 8);
        break;

      case 'linear_vertical':
        // Vertical arrow
        this.boosterGraphics.strokeRect(-5, -halfSize + 10, 10, tileSize - 20);
        this.boosterGraphics.fillTriangle(0, halfSize - 5, -8, halfSize - 15, 8, halfSize - 15);
        break;

      case 'bomb':
        // Star/explosion symbol
        this.boosterGraphics.fillStar(0, 0, 5, 15, 8, 0xffffff);
        break;

      case 'rocket':
        // Cross symbol
        this.boosterGraphics.strokeRect(-halfSize + 10, -3, tileSize - 20, 6);
        this.boosterGraphics.strokeRect(-3, -halfSize + 10, 6, tileSize - 20);
        break;

      case 'klo_sphere':
        // Glowing circle
        this.boosterGraphics.fillStyle(0xffffff, 0.8);
        this.boosterGraphics.fillCircle(0, 0, 20);
        break;
    }
  }

  private drawObstacle(obstacle: ObstacleData): void {
    if (!this.obstacleGraphics) {
      this.obstacleGraphics = this.scene.add.graphics();
      this.add(this.obstacleGraphics);
    }

    const tileSize = TILE_SIZE - TILE_GAP;
    const halfSize = tileSize / 2;

    switch (obstacle.type) {
      case 'ice':
        // Frosted glass effect with layer indicator
        this.obstacleGraphics.fillStyle(0x87ceeb, 0.5);
        this.obstacleGraphics.fillRoundedRect(-halfSize, -halfSize, tileSize, tileSize, 8);
        this.obstacleGraphics.fillStyle(0xffffff, 0.3);
        this.obstacleGraphics.fillRoundedRect(-halfSize + 4, -halfSize + 4, tileSize / 2, tileSize / 3, 4);

        // Layer count
        if (obstacle.layers > 1) {
          this.drawLayerCount(obstacle.layers);
        }
        break;

      case 'dirt':
        // Brown overlay
        this.obstacleGraphics.fillStyle(0x8b4513, 0.7);
        this.obstacleGraphics.fillRoundedRect(-halfSize, -halfSize, tileSize, tileSize, 8);
        break;

      case 'crate':
        // Box pattern with layer count
        this.obstacleGraphics.lineStyle(4, 0x8b4513, 1);
        this.obstacleGraphics.strokeRoundedRect(-halfSize, -halfSize, tileSize, tileSize, 4);
        this.obstacleGraphics.lineBetween(-halfSize, 0, halfSize, 0);
        this.obstacleGraphics.lineBetween(0, -halfSize, 0, halfSize);

        if (obstacle.layers > 1) {
          this.drawLayerCount(obstacle.layers);
        }
        break;

      case 'blocked':
        // Dark X pattern
        this.obstacleGraphics.fillStyle(0x333333, 0.9);
        this.obstacleGraphics.fillRoundedRect(-halfSize, -halfSize, tileSize, tileSize, 8);
        this.obstacleGraphics.lineStyle(4, 0xff0000, 1);
        this.obstacleGraphics.lineBetween(-halfSize + 10, -halfSize + 10, halfSize - 10, halfSize - 10);
        this.obstacleGraphics.lineBetween(-halfSize + 10, halfSize - 10, halfSize - 10, -halfSize + 10);
        break;
    }
  }

  private drawLayerCount(layers: number): void {
    // Draw layer count badge in corner
    this.obstacleGraphics!.fillStyle(0x000000, 0.7);
    this.obstacleGraphics!.fillCircle(15, -15, 10);
    // Note: For actual text, use Phaser.GameObjects.Text added to container
  }
}
```

### Anti-Patterns to Avoid
- **Booster detection after tile removal:** Analyze match shape BEFORE removing tiles to know where to spawn booster
- **Coupling goal tracking to engine:** LevelManager should observe events, not be called directly from engine
- **Synchronous booster activation:** Treat booster activation as new match event that feeds into cascade loop
- **Hardcoding booster combos:** Use lookup table for maintainability and design iteration
- **Move counter decrement on revert:** Only count valid swaps that create matches, not invalid ones

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| L/T-shape detection | Nested loops checking all combinations | Set intersection: tiles in BOTH horizontal AND vertical matches | Proven pattern, O(n) complexity |
| Booster combo effects | Switch statement per combo | Lookup table/matrix mapping type pairs to effects | More maintainable, easier to extend |
| Goal progress UI | Manual DOM manipulation | Phaser events with scene listener pattern | Decouples logic from rendering |
| Obstacle damage calculation | Custom logic per obstacle type | Layer-based damage model with type-specific rules | Standard pattern across all match-3 games |

**Key insight:** Booster detection is NOT a separate pass - it happens during the same match analysis that already runs. The streaming algorithm in Phase 2 returns matches; extend it to ALSO analyze match geometry and return booster spawn instructions. Don't rewrite match detection; extend the existing proven implementation.

## Common Pitfalls

### Pitfall 1: Detecting Boosters After Tile Removal
**What goes wrong:** Tiles are removed, then code tries to figure out where to spawn booster - but position data is lost.
**Why it happens:** Separating match detection from booster detection into two phases.
**How to avoid:** Analyze match geometry DURING findMatches() and return both removal list AND spawn instructions.
**Warning signs:** Boosters spawn in wrong positions, edge cases where booster position is ambiguous.

```typescript
// WRONG: Detect after removal
const matches = engine.findMatches();
engine.removeMatches(matches);
const boosterPos = calculateBoosterPosition(matches); // Position data lost!

// CORRECT: Detect during match analysis
const result = engine.findMatchesWithBoosters();
const { tilesToRemove, boostersToSpawn } = result;
engine.removeMatches(tilesToRemove);
engine.spawnBoosters(boostersToSpawn);
```

### Pitfall 2: Not Handling Booster Swap (No Match)
**What goes wrong:** Player swaps two boosters adjacent to each other - no match occurs, but boosters should activate.
**Why it happens:** Booster activation only checked in match detection, not in swap validation.
**How to avoid:** Special case in swap logic: if BOTH tiles are boosters, activate combo regardless of match result.
**Warning signs:** Boosters don't activate when swapped together, player confusion.

```typescript
// In Game scene onTileSwap
private async onTileSwap(tile1: TileSprite, tile2: TileSprite): Promise<void> {
  // Perform swap in engine
  this.engine.swapTiles(tile1.row, tile1.col, tile2.row, tile2.col);

  // Animate swap
  await this.animateSwap(tile1, tile2);

  // Check if BOTH are boosters
  const tile1Data = this.engine.getTileAt(tile1.row, tile1.col);
  const tile2Data = this.engine.getTileAt(tile2.row, tile2.col);

  if (tile1Data.booster && tile2Data.booster) {
    // Booster combo! Activate regardless of match
    await this.activateBoosterCombo(tile1Data, tile2Data);
    await this.processCascade();
    return;
  }

  // Normal match checking
  const matches = this.engine.findMatches();
  if (matches.length === 0) {
    // Invalid swap - revert
    await this.revertSwap(tile1, tile2);
  } else {
    await this.processCascade();
  }
}
```

### Pitfall 3: Obstacles Blocking Gravity Incorrectly
**What goes wrong:** Tiles don't fall properly around obstacles, or obstacles fall when they shouldn't.
**Why it happens:** Gravity algorithm doesn't distinguish between obstacle types (some block, some don't).
**How to avoid:** Blocked cells (permanent obstacles) create gaps in column; layered obstacles (ice/dirt/crate) prevent tile underneath from moving but don't create gaps.
**Warning signs:** Visual glitches with falling tiles, tiles "jumping" over obstacles.

```typescript
// Obstacle behavior in gravity:
// - 'blocked': Creates permanent gap, tiles above fall past it
// - 'ice'/'dirt'/'crate': Tile with obstacle stays in place, blocks column above it
// - Destroyed obstacles (layers === 0): Behave like normal tiles

applyGravity(): Movement[] {
  const movements: Movement[] = [];

  for (let col = 0; col < this.cols; col++) {
    let writeRow = this.rows - 1;

    for (let readRow = this.rows - 1; readRow >= 0; readRow--) {
      const tile = this.grid[readRow][col];

      // Permanent blocked cell - skip it as landing spot
      if (tile.obstacle?.type === 'blocked') {
        writeRow = readRow - 1; // Move write pointer above blocked cell
        continue;
      }

      // Tile with active obstacle doesn't move
      if (tile.obstacle && tile.obstacle.layers > 0 && tile.obstacle.type !== 'blocked') {
        writeRow = readRow - 1; // This tile stays, next tile writes above it
        continue;
      }

      // Normal tile or destroyed obstacle tile
      if (!tile.isEmpty) {
        if (readRow !== writeRow) {
          movements.push(/* ... */);
          // Move tile down
        }
        writeRow--;
      }
    }
  }

  return movements;
}
```

### Pitfall 4: Move Counter Decrements on Invalid Swaps
**What goes wrong:** Player loses a move even when swap is reverted (no match created).
**Why it happens:** Move counter decremented in swap function before match validation.
**How to avoid:** Only decrement moves AFTER confirming swap creates match OR activates booster combo.
**Warning signs:** Players complain moves run out too fast, unfair gameplay feel.

```typescript
// WRONG: Decrement before validation
private async onTileSwap(tile1: TileSprite, tile2: TileSprite): Promise<void> {
  this.levelManager.decrementMoves(); // BAD: Too early!

  this.engine.swapTiles(tile1.row, tile1.col, tile2.row, tile2.col);
  const matches = this.engine.findMatches();

  if (matches.length === 0) {
    // Oops, player already lost a move
    this.revertSwap(tile1, tile2);
  }
}

// CORRECT: Decrement only after validation
private async onTileSwap(tile1: TileSprite, tile2: TileSprite): Promise<void> {
  this.engine.swapTiles(tile1.row, tile1.col, tile2.row, tile2.col);
  await this.animateSwap(tile1, tile2);

  const matches = this.engine.findMatches();

  if (matches.length === 0 && !this.isBothBoosters(tile1, tile2)) {
    // Invalid swap - revert WITHOUT decrementing moves
    await this.revertSwap(tile1, tile2);
    this.isProcessing = false;
    return;
  }

  // Valid swap - NOW decrement
  this.levelManager.decrementMoves();
  await this.processCascade();
}
```

### Pitfall 5: Goal Tracking Misses Cascade Matches
**What goes wrong:** Level goal progress doesn't count tiles cleared in cascade chains, only initial swap.
**Why it happens:** Goal tracking called once after swap, not for each cascade iteration.
**How to avoid:** LevelManager listens to ALL match events, including cascades. Call onTilesMatched() in each cascade loop iteration.
**Warning signs:** Goal progress slower than expected, players can't complete collect goals.

```typescript
// In Game scene processCascade
private async processCascade(): Promise<void> {
  let depth = 0;
  const MAX_DEPTH = 20;

  while (depth < MAX_DEPTH) {
    const matches = this.engine.findMatches();
    if (matches.length === 0) break;

    depth++;

    // Track goal progress for EVERY cascade level
    const matchedTiles = matches.flatMap(m => m.tiles);
    this.levelManager.onTilesMatched(matchedTiles); // IMPORTANT: Call for each iteration

    // Animate and process
    await this.animateMatchRemoval(matches);
    this.engine.removeMatches(matches);

    const damagedObstacles = this.engine.damageObstacles(matches);
    this.levelManager.onObstaclesDestroyed(damagedObstacles); // Track obstacle destruction

    const movements = this.engine.applyGravity();
    await this.animateMovements(movements);

    const spawns = this.engine.spawnNewTiles(spawnRules);
    await this.animateNewTiles(spawns);
  }
}
```

### Pitfall 6: Booster Combos Create Infinite Loops
**What goes wrong:** KLO-sphere + booster combo converts all tiles to boosters, which then activate, converting more tiles... infinite loop.
**Why it happens:** Booster activation doesn't check for MAX_CASCADE_DEPTH or doesn't prevent re-conversion.
**How to avoid:** Treat booster activation as ONE cascade event, not recursive. Mark tiles as "activated" to prevent re-activation in same turn.
**Warning signs:** Browser freeze, game crash, cascade depth exceeds 20.

```typescript
// In BoosterActivator.ts
activateBoosterCombo(booster1: TileData, booster2: TileData): ActivationResult {
  if (booster1.booster === 'klo_sphere' || booster2.booster === 'klo_sphere') {
    const otherBooster = booster1.booster === 'klo_sphere' ? booster2 : booster1;
    const targetType = otherBooster.type;

    // Get all tiles of target type
    const allTiles = this.engine.getTilesByType(targetType);

    // Convert to boosters BUT mark as "pre-activated"
    // They will be removed immediately, not activate again
    allTiles.forEach(tile => {
      tile.booster = otherBooster.booster;
      tile.preActivated = true; // Prevent recursive activation
    });

    // Return tiles for removal, they won't trigger new activations
    return {
      tilesToRemove: allTiles,
      cascadeChain: true // Signal to process as batch removal
    };
  }

  // Other combos...
}
```

## Code Examples

Verified patterns from research sources:

### L/T-Shape Detection Algorithm
```typescript
// Source: Key Algorithmic Tricks for Match-3, Azumo Logic article
// Detects tiles that exist in BOTH horizontal and vertical matches
function findLTShapeMatches(matches: Match[]): BoosterSpawn[] {
  const boostersToSpawn: BoosterSpawn[] = [];
  const horizontalMatches = matches.filter(m => m.direction === 'horizontal');
  const verticalMatches = matches.filter(m => m.direction === 'vertical');

  // Create sets of tile positions for fast lookup
  const horizontalTileSet = new Set<string>();
  horizontalMatches.forEach(match => {
    match.tiles.forEach(tile => {
      horizontalTileSet.add(`${tile.row},${tile.col}`);
    });
  });

  const verticalTileSet = new Set<string>();
  verticalMatches.forEach(match => {
    match.tiles.forEach(tile => {
      verticalTileSet.add(`${tile.row},${tile.col}`);
    });
  });

  // Find intersection - tiles in BOTH sets
  horizontalTileSet.forEach(posStr => {
    if (verticalTileSet.has(posStr)) {
      const [row, col] = posStr.split(',').map(Number);
      const tile = this.grid[row][col];

      boostersToSpawn.push({
        row,
        col,
        boosterType: 'bomb',
        baseType: tile.type
      });
    }
  });

  return boostersToSpawn;
}
```

### Booster Combo Lookup Table
```typescript
// Source: Royal Match, Homescapes booster combo patterns
// Lookup table for maintainable combo system
const BOOSTER_COMBO_TABLE: Record<string, BoosterComboEffect> = {
  'linear_horizontal+linear_horizontal': {
    effect: 'rocket',
    description: 'Two horizontal lines → Cross clear'
  },
  'linear_horizontal+linear_vertical': {
    effect: 'rocket',
    description: 'Horizontal + Vertical → Cross clear'
  },
  'linear_vertical+linear_vertical': {
    effect: 'rocket',
    description: 'Two vertical lines → Cross clear'
  },
  'bomb+bomb': {
    effect: 'mega_bomb',
    description: 'Two bombs → 5×5 explosion'
  },
  'bomb+linear_horizontal': {
    effect: 'triple_line_horizontal',
    description: 'Bomb + horizontal line → Clear 3 rows'
  },
  'bomb+linear_vertical': {
    effect: 'triple_line_vertical',
    description: 'Bomb + vertical line → Clear 3 columns'
  },
  'bomb+rocket': {
    effect: 'mega_cross',
    description: 'Bomb + rocket → Cross explosion with blast radius'
  },
  'klo_sphere+linear_horizontal': {
    effect: 'convert_and_activate_horizontal',
    description: 'Convert all matching tiles to horizontal line boosters and activate'
  },
  'klo_sphere+linear_vertical': {
    effect: 'convert_and_activate_vertical',
    description: 'Convert all matching tiles to vertical line boosters and activate'
  },
  'klo_sphere+bomb': {
    effect: 'convert_and_activate_bombs',
    description: 'Convert all matching tiles to bombs and activate'
  },
  'klo_sphere+rocket': {
    effect: 'convert_and_activate_rockets',
    description: 'Convert all matching tiles to rockets and activate'
  },
  'klo_sphere+klo_sphere': {
    effect: 'clear_all',
    description: 'Two color bombs → Clear entire board'
  },
};

function getComboKey(type1: BoosterType, type2: BoosterType): string {
  // Normalize order for lookup
  const sorted = [type1, type2].sort();
  return `${sorted[0]}+${sorted[1]}`;
}

function activateCombo(booster1: TileData, booster2: TileData): TileData[] {
  const comboKey = getComboKey(booster1.booster!, booster2.booster!);
  const combo = BOOSTER_COMBO_TABLE[comboKey];

  if (!combo) {
    // No special combo - activate both separately
    return [
      ...this.activateBooster(booster1),
      ...this.activateBooster(booster2)
    ];
  }

  // Execute combo effect
  return this.executeComboEffect(combo.effect, booster1, booster2);
}
```

### Level JSON Integration
```typescript
// Source: Existing level_001.json, level_003.json, level_005.json
// Load level and initialize game state from JSON
async function loadLevel(levelId: number, scene: Phaser.Scene): Promise<void> {
  // Level JSON loaded in Boot scene
  const levelData = scene.cache.json.get(`level_${String(levelId).padStart(3, '0')}`);

  // Initialize engine with spawn rules
  const engine = new Match3Engine(
    levelData.grid.height,
    levelData.grid.width
  );
  engine.generateGrid(levelData.spawn_rules);

  // Place obstacles from level data
  levelData.obstacles.forEach((obstacleConfig: any) => {
    obstacleConfig.positions.forEach((pos: [number, number]) => {
      const [row, col] = pos;
      const tile = engine.getTileAt(row, col);
      tile.obstacle = {
        type: obstacleConfig.type,
        layers: obstacleConfig.layers
      };
    });
  });

  // Place blocked cells
  levelData.grid.blocked_cells?.forEach((pos: [number, number]) => {
    const [row, col] = pos;
    const tile = engine.getTileAt(row, col);
    tile.obstacle = {
      type: 'blocked',
      layers: 999 // Permanent
    };
    tile.isEmpty = true; // No tile can exist here
  });

  // Initialize level manager with goals
  const levelManager = new LevelManager(levelData);

  // Subscribe to level events
  levelManager.subscribe((event) => {
    switch (event.type) {
      case 'goals_updated':
        this.updateGoalsUI(event.goals);
        break;
      case 'moves_changed':
        this.updateMovesUI(event.movesRemaining);
        break;
      case 'level_won':
        this.showWinScreen(levelData.rewards);
        break;
      case 'level_lost':
        this.showLoseScreen();
        break;
    }
  });

  // Create sprites from engine state
  this.createTilesFromEngine(engine);
}
```

### Obstacle Damage on Adjacent Matches
```typescript
// Source: Fishdom, Homescapes obstacle mechanics documentation
// Ice and dirt take damage from adjacent matches, crates from direct hits
function damageObstaclesFromMatch(match: Match): ObstacleData[] {
  const damagedObstacles: ObstacleData[] = [];

  match.tiles.forEach(matchedTile => {
    // Damage obstacle ON the matched tile (crates)
    if (matchedTile.obstacle && matchedTile.obstacle.layers > 0) {
      matchedTile.obstacle.layers--;
      damagedObstacles.push(matchedTile.obstacle);

      if (matchedTile.obstacle.layers === 0) {
        matchedTile.obstacle.type = 'none';
      }
    }

    // Damage adjacent obstacles (ice, dirt)
    const adjacent = [
      { row: matchedTile.row - 1, col: matchedTile.col }, // Up
      { row: matchedTile.row + 1, col: matchedTile.col }, // Down
      { row: matchedTile.row, col: matchedTile.col - 1 }, // Left
      { row: matchedTile.row, col: matchedTile.col + 1 }, // Right
    ];

    adjacent.forEach(pos => {
      if (this.isValidPosition(pos.row, pos.col)) {
        const adjacentTile = this.grid[pos.row][pos.col];

        if (adjacentTile.obstacle && adjacentTile.obstacle.layers > 0) {
          // Ice and dirt take adjacent damage
          if (adjacentTile.obstacle.type === 'ice' || adjacentTile.obstacle.type === 'dirt') {
            adjacentTile.obstacle.layers--;
            damagedObstacles.push(adjacentTile.obstacle);

            if (adjacentTile.obstacle.layers === 0) {
              adjacentTile.obstacle.type = 'none';
            }
          }
        }
      }
    });
  });

  return damagedObstacles;
}
```

### Win/Lose Condition Check
```typescript
// Source: Match-3 Levels Awem documentation, Match-3 mechanics articles
// Check after every move decrement and goal update
class LevelManager {
  checkWinLoseCondition(): LevelState {
    // Check win condition: all goals completed
    const allGoalsComplete = this.goals.every(goal => goal.current >= goal.count);

    if (allGoalsComplete) {
      return { state: 'won', goals: this.goals, movesLeft: this.movesRemaining };
    }

    // Check lose condition: no moves left and goals incomplete
    if (this.movesRemaining <= 0) {
      return { state: 'lost', goals: this.goals, movesLeft: 0 };
    }

    // Game continues
    return { state: 'playing', goals: this.goals, movesLeft: this.movesRemaining };
  }

  // Win condition can be achieved BEFORE moves run out
  // Player gets win immediately when last goal completes, even if moves remain
  onGoalProgress(goalType: string, amount: number): void {
    this.goals.forEach(goal => {
      if (goal.type === goalType) {
        goal.current = Math.min(goal.current + amount, goal.count);
      }
    });

    // Check win immediately after goal update
    const state = this.checkWinLoseCondition();
    if (state.state === 'won') {
      this.notifyListeners({ type: 'level_won', goals: this.goals });
    }
  }

  // Move decrement only happens on VALID swaps
  onValidSwap(): void {
    this.movesRemaining--;
    this.notifyListeners({ type: 'moves_changed', movesRemaining: this.movesRemaining });

    // Check lose condition after move decrement
    const state = this.checkWinLoseCondition();
    if (state.state === 'lost') {
      this.notifyListeners({ type: 'level_lost', goals: this.goals });
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate booster detection pass | Detect during match analysis (same pass) | Always best practice | O(n) instead of O(2n), simpler code |
| Per-obstacle custom logic | Layer-based damage model | Industry standard since Candy Crush | Easier to add new obstacle types |
| Hardcoded combo effects | Lookup table/configuration | 2015+ | Design iteration without code changes |
| Synchronous booster activation | Activation as cascade event | Industry standard | Consistent animation flow, no special cases |
| Goal tracking in game logic | Event observer pattern | 2018+ (Unity events, React patterns) | Decoupled, testable, UI-independent |

**Deprecated/outdated:**
- **Manual pattern matching for boosters:** Use set intersection for L/T detection instead of nested loops
- **Recursive booster activation:** Use iterative cascade loop with activation events
- **Switch statement per combo:** Use lookup table for maintainability

## Open Questions

Things that couldn't be fully resolved:

1. **Rocket booster creation (combo of two linear boosters)**
   - What we know: Requirements say "Ракета (комбо двох лінійних) — чистить хрест", research shows rocket is created from 2 linear combos
   - What's unclear: Should rocket be CREATED by matching 2 linear boosters, or is it the EFFECT of swapping 2 linear boosters?
   - Recommendation: Rocket is NOT a tile type player can create by matching. It's the EFFECT name for combining two linear boosters (swap or adjacent match). Don't add 'rocket' as booster type in grid, use it as combo effect name only.

2. **Obstacle spawn during level play**
   - What we know: Level JSON has initial obstacles, research shows some games spawn obstacles mid-level
   - What's unclear: Do levels 1-5 spawn NEW obstacles during play, or only start with obstacles from JSON?
   - Recommendation: Phase 3 scope - only initial obstacles from JSON. Dynamic spawning is advanced feature for later levels.

3. **Booster activation vs booster matching**
   - What we know: Boosters can be matched like normal tiles OR swapped with other boosters
   - What's unclear: What happens if booster is in a normal 3-match (not swapped directly)?
   - Recommendation: Booster in 3-match activates its effect. Treat booster matching as activation trigger. This is standard behavior (verified in Royal Match patterns).

4. **Move count display timing**
   - What we know: Counter decrements on valid swap, level ends when moves reach 0
   - What's unclear: Does counter update BEFORE or AFTER cascade animations complete?
   - Recommendation: Update immediately after swap validation (before cascade), gives player clear feedback. Cascade is consequence of the move, not separate turn.

## Sources

### Primary (HIGH confidence)
- [Royal Match Power-Ups Guide](https://dreamgames.helpshift.com/hc/en/3-royal-match/faq/6-creating-and-using-the-power-ups/) - Verified booster creation patterns (4-match, 5-match, L/T-shape)
- [Azumo: Logic Behind Match-3 Games](https://azumo.com/insights/the-logic-behind-match-3-games) - Architecture patterns for state management and special tile creation
- [Key Algorithmic Tricks for Match-3](https://logicsimplified.com/newgames/key-algorithmic-tricks-for-match-3-game-development/) - Pattern detection algorithms, performance optimization
- [Fishdom Match-3 Elements](https://playrix.helpshift.com/hc/en/4-fishdom/section/130-match-3-elements/) - Obstacle mechanics (ice, crates layering)
- [45 Match-3 Mechanics](https://www.gamedeveloper.com/design/45-match-3-mechanics) - Comprehensive mechanics catalog including goals and obstacles

### Secondary (MEDIUM confidence)
- [Phaser Match-3 Combos Tutorial](https://phaser.io/news/2016/07/match-3-tutorial-combos) - Booster combo implementation patterns
- [Match-3 Level Goals](https://support.awem.com/hc/en-gb/articles/205773352-Match-3-Levels) - Win/lose conditions, goal types
- [Room 8 Studio: Match-3 Level Design](https://room8studio.com/news/smart-casual-the-state-of-tile-puzzle-games-level-design-part-1/) - Level goal balancing, difficulty progression

### Tertiary (LOW confidence)
- Various match-3 game help centers (Homescapes, Gardenscapes, Royal Kingdom) - Player-facing documentation, implementation details inferred
- GitHub repositories (Match-3 algorithms) - Code examples but not production-quality

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, extending Phase 2 architecture
- Booster patterns: HIGH - Verified across multiple authoritative sources (Royal Match, Fishdom)
- Obstacle system: HIGH - Layer-based model is industry standard, well-documented
- Level goals: HIGH - Event observer pattern is proven, goal types defined in existing JSON
- Booster combos: MEDIUM - Patterns verified, but specific effect implementations vary by game

**Research date:** 2026-02-06
**Valid until:** 2026-03-06 (30 days - core patterns are stable, implementation details may need iteration)

**Note:** This phase extends Phase 2's Match3Engine and TileSprite classes. The pure function/TDD approach continues. Booster and obstacle logic integrates with existing cascade system rather than replacing it.
