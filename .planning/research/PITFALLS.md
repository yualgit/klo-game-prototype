# Common Pitfalls

**Project:** KLO Match-3 Demo
**Researched:** 2026-02-05

## Critical Pitfalls

### 1. Input During Animations

**Problem:** Player swaps tiles while cascade is running → state corruption, duplicate scoring

**Solution:**
```typescript
enum TurnState { WAITING_INPUT, PROCESSING }

onTileClick(tile) {
  if (this.state !== TurnState.WAITING_INPUT) return; // Block input
  this.processSwap(tile);
}
```

### 2. Sprite Pool Exhaustion (Mobile)

**Problem:** Creating new sprites for every spawn → memory leaks, crashes on mobile

**Solution:**
```typescript
// Object pooling
class TilePool {
  private pool: Phaser.GameObjects.Sprite[] = [];

  get(): Sprite {
    return this.pool.pop() || this.scene.add.sprite(0, 0, 'tile');
  }

  release(sprite: Sprite) {
    sprite.setActive(false).setVisible(false);
    this.pool.push(sprite);
  }
}
```

### 3. Cascade Infinite Loops

**Problem:** Spawn creates match → match creates spawn → infinite

**Solution:**
```typescript
let depth = 0;
const MAX_DEPTH = 20;

while (hasMatches() && depth < MAX_DEPTH) {
  processMatches();
  depth++;
}
```

### 4. Animation/Logic Desync

**Problem:** Visual state doesn't match grid state after interruption

**Solution:**
- Grid is source of truth (logical state)
- Sprites mirror grid (visual state)
- On desync: rebuild sprites from grid

```typescript
syncSpritesToGrid() {
  this.tileSprites.forEach((sprite, tile) => {
    sprite.setPosition(tile.x * CELL_SIZE, tile.y * CELL_SIZE);
  });
}
```

### 5. Touch Swipe Ambiguity

**Problem:** Swipe direction unclear, wrong tile selected

**Solution:**
```typescript
const MIN_SWIPE_DISTANCE = 20;
const direction = getDirection(startPos, endPos);

function getDirection(start, end): Direction | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  if (Math.abs(dx) < MIN_SWIPE_DISTANCE && Math.abs(dy) < MIN_SWIPE_DISTANCE) {
    return null; // Too short
  }

  return Math.abs(dx) > Math.abs(dy)
    ? (dx > 0 ? 'right' : 'left')
    : (dy > 0 ? 'down' : 'up');
}
```

### 6. Firebase Blocking Game Loop

**Problem:** `await saveProgress()` in game loop causes stutter

**Solution:**
```typescript
// Fire and forget for non-critical saves
saveProgress(data).catch(console.error);

// Only await for critical operations
await generateCoupon(data); // Must succeed before showing reward
```

## Moderate Pitfalls

| Pitfall | Prevention |
|---------|------------|
| Invalid swap not animated | Always animate swap back on invalid |
| Hardcoded animation durations | Use constants, configurable |
| Z-index issues with boosters | Set depth explicitly: `sprite.setDepth(10)` |
| Match detection edge cases | Unit test all directions, corners |
| Particle memory leaks | Use particle manager, set max particles |

## Performance Guidelines

| Concern | Limit | Action if Exceeded |
|---------|-------|-------------------|
| Active sprites | 100 | Use object pooling |
| Particles | 200 | Reduce on mobile |
| Tweens | 50 concurrent | Queue animations |
| Firestore writes | 1/second | Batch at level end |

---
*Confidence: MEDIUM — based on common Phaser patterns*
