# Architecture Patterns

**Project:** KLO Match-3 Demo
**Researched:** 2026-02-05

## Layer Architecture

```
┌─────────────────────────────────────────────┐
│         Phaser 3 Scenes (Thin Layer)        │
│  Boot.ts  Menu.ts  Game.ts  UI.ts           │
└────────────┬────────────────────────────────┘
             │
    ┌────────▼───┐ ┌────────┐ ┌──────────┐
    │ Game Logic │ │  Data  │ │ Firebase │
    │ (Pure TS)  │ │ Loaders│ │ Services │
    │ Grid.ts    │ │ Level  │ │ auth.ts  │
    │ Match.ts   │ │ Loader │ │firestore │
    │ Booster.ts │ │        │ │analytics │
    └────────────┘ └────────┘ └──────────┘
```

**Key Principle:** Game logic knows nothing about Phaser. Scenes orchestrate, don't contain logic.

## Scene Structure

| Scene | Responsibility |
|-------|----------------|
| `Boot.ts` | Load assets, init Firebase, anonymous auth |
| `Menu.ts` | Level select, display progress |
| `Game.ts` | Render grid, handle input, animate |
| `UI.ts` | HUD overlay (moves, goals) |

## Game Logic Separation

**GOOD — Pure TypeScript class:**
```typescript
// src/game/Grid.ts
class Grid {
  private tiles: Tile[][];

  swap(a: Position, b: Position): SwapResult {
    // Pure logic, no Phaser dependencies
  }
}
```

**BAD — Logic in scene:**
```typescript
// Don't do this
class GameScene {
  update() {
    for (let y = 0; y < 8; y++) {
      // Game logic in update loop
    }
  }
}
```

## Firebase Service Pattern

```typescript
// src/firebase/firestore.ts
export async function updateProgress(uid: string, data: Partial<Progress>) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { ...data, last_seen: serverTimestamp() });
}

// Scene usage
await updateProgress(userId, { current_level: 5 });
```

## Data Flow: Player Move

1. Player taps tiles → Input handler in Game.ts
2. Call `grid.swap(a, b)` → Returns SwapResult
3. If valid: animate swap → call `grid.detectMatches()`
4. Clear matches → animate → call `grid.applyGravity()`
5. Animate fall → call `grid.spawn()`
6. Loop until no matches → update move counter

## Cross-Scene State

Use Phaser Registry:
```typescript
// Boot.ts
this.registry.set('userId', user.uid);
this.registry.set('userProgress', progress);

// Game.ts
const progress = this.registry.get('userProgress');
```

## File Structure

```
src/
├── main.ts              # Phaser instance
├── scenes/              # Thin orchestration
│   ├── Boot.ts
│   ├── Menu.ts
│   ├── Game.ts
│   └── UI.ts
├── game/                # Pure logic (testable)
│   ├── Grid.ts
│   ├── Tile.ts
│   ├── Match.ts
│   ├── Booster.ts
│   └── Obstacle.ts
├── firebase/            # Service layer
│   ├── auth.ts
│   ├── firestore.ts
│   └── analytics.ts
├── data/
│   └── LevelLoader.ts
└── utils/
    └── constants.ts
```

## Build Order

1. **Infrastructure** — Boot scene, Firebase init, asset loading
2. **Game Logic** — Grid, Match (pure TS, testable)
3. **Game Scene** — Connect logic to rendering
4. **Firebase Services** — Auth, persistence, analytics
5. **Advanced Features** — Boosters, obstacles, UI

---
*Confidence: HIGH — standard Phaser patterns*
