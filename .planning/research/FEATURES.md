# Match-3 Implementation Patterns

**Project:** KLO Match-3 Demo
**Researched:** 2026-02-05

## Core Algorithms

### Match Detection: Line Scan (Recommended)

**Complexity:** O(64) for 8x8 grid

```typescript
function detectMatches(grid: Tile[][]): Match[] {
  const matches: Match[] = [];

  // Horizontal scan
  for (let y = 0; y < 8; y++) {
    let count = 1;
    for (let x = 1; x < 8; x++) {
      if (grid[y][x].type === grid[y][x-1].type) {
        count++;
      } else {
        if (count >= 3) {
          matches.push({ tiles: getTiles(y, x-count, count, 'horizontal') });
        }
        count = 1;
      }
    }
    if (count >= 3) matches.push({ tiles: getTiles(y, 8-count, count, 'horizontal') });
  }

  // Vertical scan (similar)
  return matches;
}
```

### Cascade Loop Pattern

```typescript
async function processTurn() {
  do {
    const matches = grid.detectMatches();
    if (matches.length === 0) break;

    await clearMatches(matches);      // Animate destruction
    await applyGravity();             // Tiles fall
    await spawnNewTiles();            // Fill from top
  } while (true);
}
```

**Critical:** Use `do-while` with depth limit (max 20) to prevent infinite loops.

### Gravity: Column-Based Fall

```typescript
function applyGravity(): GravityResult {
  const moves: TileMove[] = [];

  for (let x = 0; x < 8; x++) {
    let writeY = 7; // Bottom of column

    for (let y = 7; y >= 0; y--) {
      if (grid[y][x].isBlocked) {
        writeY = y - 1; // Start new segment above blocked
        continue;
      }
      if (grid[y][x].tile) {
        if (y !== writeY) {
          moves.push({ from: {x, y}, to: {x, y: writeY} });
        }
        writeY--;
      }
    }
  }

  return { moves };
}
```

### Booster Creation Detection

| Pattern | Booster |
|---------|---------|
| 4 in row/column | Linear (clears row OR column) |
| 5 in L/T shape | Bomb (3×3 explosion) |
| 5 in row/column | Color bomb (all of one type) |
| Linear + Linear combo | Rocket (clears cross) |

### State Machine for Turn Flow

```typescript
enum TurnState {
  WAITING_INPUT,
  SWAPPING,
  MATCHING,
  GRAVITY,
  SPAWNING,
  CHECKING_WIN,
  WIN,
  LOSE
}
```

## Critical Pitfalls

1. **Input during animations** — Block input until cascade complete
2. **Double-counting matches** — Use Set for cleared tiles
3. **Cascade infinite loops** — Add depth limit
4. **Animation/logic desync** — Separate visual state from grid state

## Implementation Sequence

1. **Core Grid** — 8×8 array, tile types, basic rendering
2. **Match Detection** — Line scan algorithm
3. **Swap & Validate** — Adjacent check, match-required swap
4. **Cascade Loop** — Clear → gravity → spawn → repeat
5. **Boosters** — Creation detection, effect execution
6. **Obstacles** — Damage on adjacent match

---
*Confidence: HIGH — standard match-3 patterns*
