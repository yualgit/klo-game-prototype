# Architecture Integration Patterns

**Project:** KLO Match-3 Subsequent Milestone
**Researched:** 2026-02-10
**Confidence:** HIGH

## Executive Summary

This document details how new features (lives system, bonus economy, settings, variable boards, progressive obstacles, pre-placed tiles, Kyiv map level select, DPI scaling) integrate with the existing Phaser 3 architecture without requiring major refactoring. All additions are additive—extending existing managers or adding new ones—preserving the current scene flow and manager pattern.

**Key Integration Points:**
1. **Lives/Bonus Economy** → New `EconomyManager` singleton in registry (parallel to `ProgressManager`)
2. **Settings** → New `SettingsManager` using localStorage + Phaser registry
3. **Variable Boards** → Extend `LevelData` JSON format + Board class constructor params
4. **Progressive Obstacles** → Extend `ObstacleData` interface + modify `ObstacleManager`
5. **Pre-placed Tiles** → Extend level JSON + new `Board.initializeFromConfig()` method
6. **Kyiv Map** → Modify `LevelSelectScene` with camera + parallax layers
7. **DPI Scaling** → Modify `main.ts` config + scene responsive calculations

**Architecture Stability:** No changes to core Match3Engine, GravityEngine, MatchEngine. Only additive extensions to managers and scene presentation logic.

## Existing Architecture Recap

### Current Manager Pattern
```
Registry Singletons (created in main.ts, accessed via scene.registry):
├── ProgressManager (Firebase persistence, level unlock/stars)
├── [NEW] EconomyManager (lives, coins, bonus tracking)
└── [NEW] SettingsManager (audio, notifications, locale)

Per-Scene Managers (created in scene.create()):
├── LevelManager (goals, moves, win/lose)
├── BoosterActivator (booster logic)
├── AudioManager (sound playback)
├── VFXManager (particle effects)
└── [MODIFIED] ObstacleManager (progressive obstacles)

Game Engine (stateless logic classes):
├── Match3Engine (board state, match detection)
├── GravityEngine (tile falling physics)
└── BoosterManager (combo matrix)
```

### Current Scene Flow
```
Boot → Menu → LevelSelect → Game
         ↑        ↓           ↓
         └────────┴───────────┘
         (all can return to any)
```

### Current Data Flow
```
main.ts: Firebase init → ProgressManager → game.registry
Scene: registry.get('progress') → isLevelUnlocked(), getStars()
Game: LevelManager → ProgressManager.completeLevel() → saveProgress()
```

---

## 1. Lives System + Timer Regeneration

### Architecture Pattern

**Component:** `EconomyManager` (singleton in registry)
**Pattern:** Timer-based regeneration with localStorage cache
**Integration:** Parallel to ProgressManager, no engine changes

### Data Structure
```typescript
interface EconomyData {
  lives: number;              // Current lives (max 5)
  lastLifeLostTime: number;   // Timestamp for regeneration
  coins: number;              // Soft currency
  bonuses: {                  // Pre-level boosters
    tnt: number;
    lightBall: number;
    colorBomb: number;
  };
}
```

### Manager Implementation
```typescript
export class EconomyManager {
  private readonly MAX_LIVES = 5;
  private readonly REGEN_TIME_MS = 30 * 60 * 1000; // 30 minutes
  private data: EconomyData;
  private regenTimer: Phaser.Time.TimerEvent | null = null;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, initialData: EconomyData) {
    this.scene = scene;
    this.data = initialData;
    this.startRegenTimer();
  }

  private startRegenTimer(): void {
    // Calculate lives to regenerate based on elapsed time
    const now = Date.now();
    const elapsed = now - this.data.lastLifeLostTime;
    const livesToAdd = Math.min(
      Math.floor(elapsed / this.REGEN_TIME_MS),
      this.MAX_LIVES - this.data.lives
    );

    if (livesToAdd > 0) {
      this.data.lives = Math.min(this.MAX_LIVES, this.data.lives + livesToAdd);
      this.data.lastLifeLostTime = now - (elapsed % this.REGEN_TIME_MS);
      this.save();
    }

    // Start Phaser timer for UI updates
    if (this.data.lives < this.MAX_LIVES) {
      const nextRegenIn = this.REGEN_TIME_MS - (now - this.data.lastLifeLostTime);
      this.regenTimer = this.scene.time.addEvent({
        delay: nextRegenIn,
        callback: () => {
          this.addLife();
          if (this.data.lives < this.MAX_LIVES) {
            this.startRegenTimer();
          }
        },
      });
    }
  }

  spendLife(): boolean {
    if (this.data.lives > 0) {
      this.data.lives--;
      if (this.data.lives === this.MAX_LIVES - 1) {
        this.data.lastLifeLostTime = Date.now();
        this.startRegenTimer();
      }
      this.save();
      return true;
    }
    return false;
  }

  private save(): void {
    localStorage.setItem('klo_economy', JSON.stringify(this.data));
  }
}
```

### Integration Points

| Location | Change Type | Implementation |
|----------|-------------|----------------|
| `main.ts` | NEW | Create EconomyManager after ProgressManager, store in registry |
| `LevelSelectScene` | MODIFY | Check `economy.getLives()` before allowing level start, show lives UI |
| `GameScene` | MODIFY | On level lose: `economy.spendLife()`, show "out of lives" if false |
| `MenuScene` | NEW | Show lives counter with timer countdown in top-right HUD |

### localStorage Schema
```json
{
  "klo_economy": {
    "lives": 4,
    "lastLifeLostTime": 1707552000000,
    "coins": 150,
    "bonuses": { "tnt": 2, "lightBall": 1, "colorBomb": 0 }
  }
}
```

### Build Order
1. Create `EconomyManager.ts` with lives + timer logic
2. Add to `main.ts` initialization (load from localStorage or defaults)
3. Add lives display to `MenuScene` HUD
4. Modify `LevelSelectScene` to check lives before level start
5. Add "out of lives" overlay to `GameScene` lose condition

**Source:** [Timer - Notes of Phaser 3](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/timer/), [DESIGN ANALYSIS: MATCH-3](https://snoukdesignnotes.blog/2018/06/21/design-analysis-match-3/)

---

## 2. Bonus Economy (Coins, Pre-Level Boosters)

### Architecture Pattern

**Component:** Extension of `EconomyManager`
**Pattern:** Earn from levels, spend on boosters/lives
**Integration:** Add earning logic to ProgressManager callbacks, spending UI in scenes

### Earning System
```typescript
// In ProgressManager.completeLevel():
completeLevel(levelId: number, movesUsed: number, totalMoves: number): CompletionResult {
  const { stars, isNewBest } = this.calculateStars(movesUsed, totalMoves);

  // Award coins based on stars
  const coins = stars * 10; // 10/20/30 coins for 1/2/3 stars
  const economy = this.registry.get('economy') as EconomyManager;
  economy.addCoins(coins);

  // First-time bonus
  if (isNewBest && !this.progress.completed_levels.includes(levelId)) {
    economy.addCoins(50); // First completion bonus
  }

  return { stars, isNewBest, coinsEarned: coins };
}
```

### Spending System
```typescript
// In EconomyManager:
spendCoins(amount: number): boolean {
  if (this.data.coins >= amount) {
    this.data.coins -= amount;
    this.save();
    return true;
  }
  return false;
}

buyLife(): boolean {
  const LIFE_COST = 100;
  if (this.spendCoins(LIFE_COST)) {
    this.data.lives = Math.min(this.MAX_LIVES, this.data.lives + 1);
    this.save();
    return true;
  }
  return false;
}

buyBonus(type: 'tnt' | 'lightBall' | 'colorBomb'): boolean {
  const BONUS_COST = 50;
  if (this.spendCoins(BONUS_COST)) {
    this.data.bonuses[type]++;
    this.save();
    return true;
  }
  return false;
}
```

### Integration Points

| Location | Change Type | Implementation |
|----------|-------------|----------------|
| `ProgressManager` | MODIFY | Call `economy.addCoins()` on level completion |
| `GameScene` (pre-level) | NEW | Show bonus selection overlay, spend bonuses, apply to board |
| `GameScene` (lose overlay) | NEW | "+5 moves for 50 coins" button |
| `MenuScene` | NEW | Show coin count in HUD |
| `ShopScene` | NEW | Optional: Dedicated shop scene for buying bonuses/lives |

### Pre-Level Bonus Application
```typescript
// In GameScene, before generateGrid():
applyPreLevelBonuses(): void {
  const economy = this.registry.get('economy') as EconomyManager;
  const bonuses = economy.getActiveBonuses(); // User-selected bonuses

  this.engine.generateGrid(spawnRules);

  if (bonuses.tnt > 0) {
    const randomCell = this.getRandomEmptyCell();
    this.engine.placeBooster(randomCell.row, randomCell.col, 'bomb');
  }

  if (bonuses.lightBall > 0) {
    const randomCell = this.getRandomEmptyCell();
    this.engine.placeBooster(randomCell.row, randomCell.col, 'klo_sphere');
  }

  // ... similar for other bonuses
}
```

### Build Order
1. Extend `EconomyManager` with coin methods
2. Modify `ProgressManager.completeLevel()` to award coins
3. Add coin display to `MenuScene` and `GameScene` HUD
4. Create pre-level bonus selection overlay in `GameScene`
5. Implement bonus application logic in `GameScene.create()`
6. Add "+5 moves" purchase option to lose overlay

**Source:** [How Does Royal Match Make Money?](https://www.blog.udonis.co/mobile-marketing/mobile-games/royal-match-analysis), [Design Deep Dive #02- Royal Match!](https://medium.com/ironsource-levelup/design-deep-dive-02-royal-match-948f7af96f04)

---

## 3. Settings Persistence

### Architecture Pattern

**Component:** `SettingsManager` (singleton in registry)
**Pattern:** localStorage with reactive updates to AudioManager
**Integration:** Created in main.ts, consumed by all scenes

### Data Structure
```typescript
interface SettingsData {
  soundEnabled: boolean;
  musicEnabled: boolean;
  notificationsEnabled: boolean;
  locale: 'uk' | 'en'; // Ukrainian or English
  version: number; // For migration if settings schema changes
}
```

### Manager Implementation
```typescript
export class SettingsManager {
  private data: SettingsData;
  private listeners: Map<string, Set<(value: any) => void>> = new Map();

  constructor(initialData?: SettingsData) {
    this.data = initialData || this.getDefaults();
  }

  private getDefaults(): SettingsData {
    return {
      soundEnabled: true,
      musicEnabled: true,
      notificationsEnabled: true,
      locale: 'uk',
      version: 1,
    };
  }

  set(key: keyof SettingsData, value: any): void {
    this.data[key] = value;
    this.save();
    this.notify(key, value);
  }

  get<K extends keyof SettingsData>(key: K): SettingsData[K] {
    return this.data[key];
  }

  subscribe(key: keyof SettingsData, callback: (value: any) => void): void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);
  }

  private notify(key: keyof SettingsData, value: any): void {
    this.listeners.get(key)?.forEach(cb => cb(value));
  }

  private save(): void {
    localStorage.setItem('klo_settings', JSON.stringify(this.data));
  }

  static load(): SettingsData {
    const stored = localStorage.getItem('klo_settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Version migration logic here if needed
      return parsed;
    }
    return new SettingsManager().data;
  }
}
```

### AudioManager Integration
```typescript
// In AudioManager constructor:
constructor(scene: Phaser.Scene) {
  this.scene = scene;
  const settings = scene.registry.get('settings') as SettingsManager;

  // Set initial volume based on settings
  scene.sound.mute = !settings.get('soundEnabled');

  // Subscribe to changes
  settings.subscribe('soundEnabled', (enabled: boolean) => {
    scene.sound.mute = !enabled;
  });

  settings.subscribe('musicEnabled', (enabled: boolean) => {
    // Control background music separately if needed
  });
}
```

### Integration Points

| Location | Change Type | Implementation |
|----------|-------------|----------------|
| `main.ts` | NEW | Create SettingsManager from localStorage, store in registry |
| `MenuScene` | NEW | Add settings button, create SettingsOverlay scene |
| `SettingsOverlay` | NEW | Popup scene with toggle switches for sound/music/notifications |
| `AudioManager` | MODIFY | Subscribe to settings changes, update sound.mute accordingly |
| All scenes | MODIFY | Use `settings.get('locale')` for text translations |

### Build Order
1. Create `SettingsManager.ts` with localStorage persistence
2. Add to `main.ts` initialization
3. Create `SettingsOverlay.ts` scene with toggle UI
4. Add settings button to `MenuScene`
5. Modify `AudioManager` to subscribe to settings changes
6. Add locale-based text system (optional if only Ukrainian)

**Source:** [LocalStorage - Notes of Phaser 3](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/localstorage/), [Phaser Game Settings using localStorage](https://braelynnn.medium.com/phaser-game-settings-using-localstorage-1cf6a9fa6f2c)

---

## 4. Variable Board Shapes (Per-Row Cell Count)

### Architecture Pattern

**Component:** Extend `LevelData` JSON + modify `Board` class initialization
**Pattern:** Blocked cells → explicit per-row column counts
**Integration:** Engine agnostic, purely presentation layer

### Current Board Architecture
```typescript
// Current: Fixed 8x8 grid with blocked_cells array
{
  "grid": {
    "width": 8,
    "height": 8,
    "blocked_cells": [[0, 0], [0, 7], [7, 0], [7, 7]]
  }
}

// Board renders all cells, marks some as blocked
```

### New Variable Board Format
```typescript
// Option A: Per-row column definitions
{
  "grid": {
    "rows": [
      { "cols": 6, "offset": 1 },  // Row 0: 6 cells, offset by 1 (centered)
      { "cols": 7, "offset": 0.5 },
      { "cols": 8, "offset": 0 },
      { "cols": 8, "offset": 0 },
      { "cols": 8, "offset": 0 },
      { "cols": 8, "offset": 0 },
      { "cols": 7, "offset": 0.5 },
      { "cols": 6, "offset": 1 }
    ]
  }
}

// Option B: Explicit cell map (more flexible)
{
  "grid": {
    "cells": [
      [0, 0, 1, 1, 1, 1, 0, 0],  // 1 = active, 0 = empty
      [0, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1],
      // ... etc
    ]
  }
}
```

**Recommendation:** Use Option B (cell map) for maximum flexibility and clarity. Match3Engine already handles isEmpty flag.

### Engine Integration
```typescript
// Match3Engine modification (minimal):
generateGrid(spawnRules: SpawnRules, cellMap?: number[][]): void {
  this.grid = [];

  for (let row = 0; row < this.rows; row++) {
    this.grid[row] = [];
    for (let col = 0; col < this.cols; col++) {
      const isActive = cellMap ? cellMap[row][col] === 1 : true;

      if (!isActive) {
        this.grid[row][col] = this.createEmptyTile(row, col);
        this.grid[row][col].isEmpty = true; // Permanent empty
      } else {
        this.grid[row][col] = this.createRandomTile(row, col, spawnRules);
      }
    }
  }

  // Existing: Ensure no initial matches
  this.resolveInitialMatches();
}
```

### Rendering Changes
```typescript
// GameScene.createTilesFromEngine() - already handles isEmpty:
private createTilesFromEngine(): void {
  const grid = this.engine.getGrid();

  for (let row = 0; row < GRID_HEIGHT; row++) {
    this.tileSprites[row] = [];
    for (let col = 0; col < GRID_WIDTH; col++) {
      const tileData = grid[row][col];

      if (tileData.isEmpty) {
        this.tileSprites[row][col] = null; // Don't create sprite
        continue;
      }

      // Create sprite as normal
      const tile = new TileSprite(this, row, col, tileData.type, ...);
      this.tileSprites[row][col] = tile;
    }
  }
}
```

### Integration Points

| Location | Change Type | Implementation |
|----------|-------------|----------------|
| `types.ts` | MODIFY | Extend `LevelData.grid` to support `cells: number[][]` |
| `Match3Engine` | MODIFY | Accept optional cellMap in generateGrid(), mark cells isEmpty |
| `GameScene` | MODIFY | Pass cellMap from levelData to engine |
| Level JSONs | NEW | Add `cells` array to grid definition for shaped levels |

### Build Order
1. Extend `LevelData` interface with cells map option
2. Modify `Match3Engine.generateGrid()` to accept cellMap
3. Test with existing levels (no cellMap = default 8x8 behavior)
4. Create new level JSONs with variable shapes
5. Verify gravity and match detection work correctly

**Source:** [Match - Notes of Phaser 3](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/board-match/), existing codebase analysis

---

## 5. Progressive Obstacles (3-State Ice/Dirt)

### Architecture Pattern

**Component:** Extend `ObstacleData` interface + `ObstacleManager`
**Pattern:** Multi-layer damage system already exists, add visual variants
**Integration:** Modify obstacle rendering in TileSprite

### Current Obstacle System
```typescript
interface ObstacleData {
  type: ObstacleType; // 'ice' | 'dirt' | 'crate' | 'blocked'
  layers: number;     // 1-3 layers
}

// In Match3Engine.damageObstacles():
// Each match adjacent to obstacle reduces layers by 1
// At layers = 0, obstacle is removed
```

**Current State:** Architecture already supports progressive obstacles! Only visual feedback missing.

### Visual Mapping
```typescript
// In TileSprite.setObstacle():
setObstacle(obstacle?: ObstacleData): void {
  this.clearObstacle();

  if (!obstacle) return;

  let textureKey: string;

  switch (obstacle.type) {
    case 'ice':
      textureKey = obstacle.layers === 3 ? 'obstacle_ice03' :
                   obstacle.layers === 2 ? 'obstacle_ice02' : 'obstacle_ice01';
      break;
    case 'dirt':
      textureKey = obstacle.layers === 3 ? 'obstacle_grss03' :
                   obstacle.layers === 2 ? 'obstacle_grss02' : 'obstacle_grss01';
      break;
    case 'crate':
      textureKey = 'obstacle_bubble'; // Single sprite (1 layer only)
      break;
    case 'blocked':
      textureKey = 'obstacle_blocked'; // Non-damageable
      break;
  }

  this.obstacleSprite = this.scene.add.image(0, 0, textureKey);
  this.add(this.obstacleSprite);
}
```

### Level JSON Format
```json
{
  "obstacles": [
    {
      "type": "ice",
      "layers": 3,
      "positions": [[2, 3], [2, 4]],
      "description": "3-layer ice - requires 3 adjacent matches"
    },
    {
      "type": "dirt",
      "layers": 2,
      "positions": [[5, 5]],
      "description": "2-layer dirt - requires 2 adjacent matches"
    }
  ]
}
```

### Integration Points

| Location | Change Type | Implementation |
|----------|-------------|----------------|
| `TileSprite` | MODIFY | Map obstacle layers to correct sprite variant in setObstacle() |
| `Boot.ts` | ALREADY DONE | Sprites already loaded (ice01-03, grss01-03) |
| Level JSONs | MODIFY | Set layers: 1/2/3 for progressive obstacles |
| `ObstacleManager` | NO CHANGE | Damage logic already correct |

### Build Order
1. Modify `TileSprite.setObstacle()` to select sprite based on layers
2. Update level JSONs to use 3-layer obstacles
3. Test damage progression visually
4. Add VFX for obstacle layer breaking (optional polish)

**Source:** [Match-3 Game Design](https://vsquad.art/blog/match-3-game-design-what-is-it-how-to-make), [45 Match-3 Mechanics](https://www.gamedeveloper.com/design/45-match-3-mechanics)

---

## 6. Pre-Placed Tiles (Boosters, Specific Types)

### Architecture Pattern

**Component:** Extend level JSON + new Board initialization method
**Pattern:** Override random generation for specific cells
**Integration:** Add to LevelData, apply after generateGrid() but before initial match resolution

### Level JSON Extension
```typescript
interface LevelData {
  // ... existing fields
  initial_tiles?: {
    row: number;
    col: number;
    type: TileType;
    booster?: BoosterType;
  }[];
}

// Example:
{
  "initial_tiles": [
    { "row": 4, "col": 4, "type": "fuel", "booster": "bomb" },
    { "row": 3, "col": 3, "type": "coffee" },
    { "row": 3, "col": 4, "type": "coffee" },
    { "row": 3, "col": 5, "type": "coffee" }
  ]
}
```

### Engine Method
```typescript
// In Match3Engine:
applyInitialTiles(initialTiles: InitialTileConfig[]): void {
  for (const config of initialTiles) {
    const tile = this.grid[config.row][config.col];

    // Override type
    tile.type = config.type;

    // Apply booster if specified
    if (config.booster) {
      tile.booster = config.booster;
    }
  }

  // Re-check for initial matches (in case pre-placed tiles create matches)
  this.resolveInitialMatches();
}
```

### Integration Sequence
```typescript
// In GameScene.create():
this.engine.generateGrid(spawnRules, cellMap);

if (this.levelData.obstacles) {
  this.engine.initializeObstacles(this.levelData.obstacles);
}

// NEW: Apply pre-placed tiles
if (this.levelData.initial_tiles) {
  this.engine.applyInitialTiles(this.levelData.initial_tiles);
}

this.createTilesFromEngine();
```

### Integration Points

| Location | Change Type | Implementation |
|----------|-------------|----------------|
| `types.ts` | MODIFY | Extend LevelData with initial_tiles field |
| `Match3Engine` | NEW | Add applyInitialTiles() method |
| `GameScene` | MODIFY | Call applyInitialTiles() after obstacle initialization |
| Level JSONs | NEW | Add initial_tiles for tutorial/special levels |

### Use Cases
1. **Tutorial levels:** Pre-place match to teach mechanics
2. **Challenge levels:** Start with specific booster combinations
3. **Puzzle levels:** Exact tile configuration for solution-based gameplay

### Build Order
1. Extend `LevelData` interface
2. Implement `Match3Engine.applyInitialTiles()`
3. Call in `GameScene.create()` initialization sequence
4. Create tutorial level with pre-placed match (level 1)
5. Test that initial match resolution still works

**Source:** [Smart & Casual: Match 3 Level Design](https://room8studio.com/news/smart-casual-the-state-of-tile-puzzle-games-level-design-part-1/), [Playrix: Creating levels](https://gameworldobserver.com/2019/09/27/playrix-levels-elements-match-3)

---

## 7. Scrollable Kyiv Map with Parallax

### Architecture Pattern

**Component:** Modify LevelSelectScene with camera scrolling + parallax layers
**Pattern:** TileSprite backgrounds with different scroll factors
**Integration:** Replace static level select with scrollable camera view

### Current LevelSelectScene
```typescript
// Current: Static 5 checkpoints in fixed positions
const checkpoints = [
  { x: width * 0.2, y: height * 0.78 },
  { x: width * 0.5, y: height * 0.65 },
  // ... fixed positions
];
```

### New Scrollable Architecture
```typescript
class LevelSelect extends Phaser.Scene {
  private camera: Phaser.Cameras.Scene2D.Camera;
  private parallaxLayers: Phaser.GameObjects.TileSprite[];
  private levelCheckpoints: Phaser.GameObjects.Container[];

  create(): void {
    const WORLD_HEIGHT = 3000; // Tall vertical map

    // Set world bounds
    this.cameras.main.setBounds(0, 0, width, WORLD_HEIGHT);
    this.physics.world.setBounds(0, 0, width, WORLD_HEIGHT);

    // Create parallax background layers
    this.createParallaxBackground(WORLD_HEIGHT);

    // Create Kyiv landmarks as decorative elements
    this.createKyivLandmarks();

    // Create winding path with checkpoints
    this.createScrollingPath(WORLD_HEIGHT);

    // Setup camera controls (drag + bounds)
    this.setupCameraControls();

    // Scroll to current level on entry
    this.scrollToCurrentLevel();
  }

  private createParallaxBackground(worldHeight: number): void {
    // Layer 1: Sky (slowest - far background)
    const sky = this.add.tileSprite(width / 2, 0, width, worldHeight, 'bg_sky');
    sky.setOrigin(0.5, 0);
    sky.setScrollFactor(0.2); // Moves 5x slower than camera
    this.parallaxLayers.push(sky);

    // Layer 2: Distant buildings (medium)
    const buildings = this.add.tileSprite(width / 2, 0, width, worldHeight, 'bg_buildings');
    buildings.setOrigin(0.5, 0);
    buildings.setScrollFactor(0.5); // Moves 2x slower
    this.parallaxLayers.push(buildings);

    // Layer 3: Near landmarks (almost 1:1)
    const landmarks = this.add.tileSprite(width / 2, 0, width, worldHeight, 'bg_landmarks');
    landmarks.setOrigin(0.5, 0);
    landmarks.setScrollFactor(0.8); // Moves slightly slower
    this.parallaxLayers.push(landmarks);
  }

  private setupCameraControls(): void {
    // Enable drag scrolling
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        this.cameras.main.scrollY -= pointer.velocity.y / 10;
      }
    });

    // Clamp camera to bounds
    this.cameras.main.setBounds(0, 0, width, WORLD_HEIGHT);
  }
}
```

### Asset Requirements
```typescript
// In Boot.ts preload():
this.load.image('bg_sky', 'assets/backgrounds/kyiv_sky.png');
this.load.image('bg_buildings', 'assets/backgrounds/kyiv_buildings.png');
this.load.image('bg_landmarks', 'assets/backgrounds/kyiv_landmarks.png');
this.load.image('landmark_maidan', 'assets/landmarks/maidan.png');
this.load.image('landmark_lavra', 'assets/landmarks/lavra.png');
this.load.image('landmark_motherland', 'assets/landmarks/motherland.png');
// ... etc
```

### Integration Points

| Location | Change Type | Implementation |
|----------|-------------|----------------|
| `LevelSelectScene` | MAJOR REFACTOR | Add camera scrolling, parallax layers, vertical layout |
| `Boot.ts` | NEW | Load parallax background assets + landmark sprites |
| `assets/backgrounds/` | NEW | Create/source Kyiv-themed background layers |
| `ProgressManager` | NO CHANGE | Still returns unlocked levels |

### Build Order
1. Create placeholder background assets (gradient layers for testing)
2. Modify `LevelSelectScene` to use camera scrolling + world bounds
3. Add parallax TileSprite layers with different scroll factors
4. Test camera drag controls and bounds clamping
5. Add level checkpoints in vertical scrolling layout
6. Implement auto-scroll to current level on scene entry
7. Replace placeholder backgrounds with final Kyiv artwork

**Source:** [Add Pizazz with Parallax Scrolling](https://blog.ourcade.co/posts/2020/add-pizazz-parallax-scrolling-phaser-3/), [Parallax Scrolling with TileSprites Tutorial](https://phaser.io/news/2019/06/parallax-scrolling-with-tilesprites-tutorial)

---

## 8. Mobile Responsiveness + Canvas DPI

### Architecture Pattern

**Component:** Modify `main.ts` config + scene layout calculations
**Pattern:** Phaser ScaleManager + dynamic positioning
**Integration:** One-time config change, all scenes adapt

### Current Config
```typescript
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};
```

### DPI-Aware Config
```typescript
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  scale: {
    mode: Phaser.Scale.RESIZE, // Resize canvas to fill parent
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'game-container',
    min: { width: 320, height: 480 },   // Minimum mobile size
    max: { width: 1920, height: 1080 }, // Maximum desktop size
  },
  render: {
    pixelArt: false,        // Smooth scaling for vector-style graphics
    antialias: true,
    antialiasGL: true,
    resolution: window.devicePixelRatio || 1, // DPI awareness
  },
};
```

### Scene Responsive Layout
```typescript
// Pattern: Use camera dimensions instead of hardcoded values
class GameScene extends Phaser.Scene {
  create(): void {
    const width = this.cameras.main.width;   // Dynamic
    const height = this.cameras.main.height; // Dynamic

    // Center grid dynamically
    const gridPixelWidth = GRID_WIDTH * TILE_SIZE;
    const gridPixelHeight = GRID_HEIGHT * TILE_SIZE;
    this.gridOffsetX = (width - gridPixelWidth) / 2;
    this.gridOffsetY = (height - gridPixelHeight) / 2 + 30;

    // HUD positioned relative to screen size
    this.createHUD(width, height);
  }
}
```

### Integration Points

| Location | Change Type | Implementation |
|----------|-------------|----------------|
| `main.ts` | MODIFY | Update scale config to RESIZE mode, add resolution setting |
| All scenes | MODIFY | Replace hardcoded positions with dynamic width/height |
| `GameScene` | MODIFY | Add scale.on('resize') handler to reposition grid |
| Input handling | MODIFY | Adjust thresholds for mobile touch |

### Build Order
1. Update `main.ts` config with RESIZE mode and resolution
2. Test on desktop - ensure no visual breakage
3. Modify scenes to use `cameras.main.width/height` instead of hardcoded values
4. Add resize handlers to scenes with complex layouts
5. Test on mobile devices (real or emulator)
6. Adjust touch target sizes if needed
7. Add orientation lock for mobile (portrait/landscape preference)

**Source:** [Scale manager - Notes of Phaser 3](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/scalemanager/), [Help! Resizing a game with dpr](https://phaser.discourse.group/t/help-resizing-a-game-with-dpr-device-pixel-ratio/3242)

---

## Component Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│ main.ts                                                      │
│ ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐  │
│ │ ProgressManager │  │ EconomyManager   │  │ Settings    │  │
│ │ (Firebase)      │  │ (localStorage)   │  │ Manager     │  │
│ └────────┬────────┘  └────────┬─────────┘  └──────┬──────┘  │
│          │                    │                    │         │
│          └────────────────────┴────────────────────┘         │
│                       game.registry                          │
└──────────────────────────────┬───────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
        ┌───────▼──────┐              ┌──────▼──────┐
        │ LevelSelect  │              │  GameScene  │
        │ - Camera     │              │  - Board    │
        │ - Parallax   │◄─────────────┤  - Managers │
        │ - Scroll     │              │  - VFX      │
        └──────────────┘              └─────┬───────┘
                                            │
                    ┌───────────────────────┴────────────────┐
                    │                                        │
            ┌───────▼──────┐                      ┌─────────▼────────┐
            │ LevelManager │                      │ Match3Engine     │
            │ - Goals      │                      │ - Board state    │
            │ - Moves      │                      │ - Match logic    │
            │ - Win/Lose   │                      │ - Obstacles      │
            └──────────────┘                      └──────────────────┘
```

**Dependencies:**
- EconomyManager depends on ProgressManager for coin awards
- SettingsManager is independent, consumed by AudioManager
- GameScene depends on all registry managers
- LevelSelectScene depends on ProgressManager + EconomyManager
- Match3Engine remains dependency-free (pure logic)

---

## Data Flow Changes

### Before (Current)
```
User completes level → LevelManager emits 'level_won'
  → GameScene calls ProgressManager.completeLevel()
  → ProgressManager updates stars, unlocks next level
  → ProgressManager.saveProgress() → Firebase
  → Win overlay shows stars
```

### After (With New Features)
```
User spends life to start level → EconomyManager.spendLife()
  → GameScene creates with initial bonuses applied
  → User completes level → LevelManager emits 'level_won'
  → GameScene calls ProgressManager.completeLevel()
  → ProgressManager awards coins via EconomyManager.addCoins()
  → ProgressManager updates stars, unlocks
  → ProgressManager.saveProgress() → Firebase
  → EconomyManager.save() → localStorage
  → Win overlay shows stars + coins earned
```

**Key Change:** EconomyManager parallel to ProgressManager, both save independently.

---

## Recommended Build Order

### Phase 1: Economy Foundation
1. Create `EconomyManager` with lives + coins + bonuses
2. Add to `main.ts` initialization
3. Add lives display to MenuScene
4. Modify LevelSelectScene to check lives before level start
5. Add coin rewards to ProgressManager.completeLevel()

### Phase 2: Settings System
1. Create `SettingsManager` with localStorage
2. Create `SettingsOverlay` scene
3. Integrate with AudioManager
4. Add settings button to MenuScene

### Phase 3: Enhanced Levels
1. Extend LevelData for variable boards (cellMap)
2. Modify Match3Engine.generateGrid() to accept cellMap
3. Update TileSprite obstacle rendering for 3-layer progression
4. Add initial_tiles support to Match3Engine
5. Create new level JSONs with advanced features

### Phase 4: Visual Enhancements
1. Modify LevelSelectScene for camera scrolling
2. Add parallax background layers
3. Create Kyiv landmark assets
4. Implement vertical scrolling path

### Phase 5: Mobile Polish
1. Update main.ts config for DPI + RESIZE mode
2. Make all scenes responsive (dynamic positioning)
3. Add resize handlers where needed
4. Test on mobile devices
5. Adjust touch targets

**Total Estimated Complexity:** Medium - mostly additive changes, minimal refactoring of core systems.

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Lives timer drift on app close/reopen | Medium | Calculate regeneration on app start based on elapsed time |
| localStorage cleared (private browsing) | Low | Fall back to defaults, inform user |
| Variable boards break match detection | Medium | Test extensively, ensure Match3Engine handles isEmpty correctly |
| Parallax performance on mobile | Low | Use TileSprite (efficient), limit layer count to 3-4 |
| DPI scaling breaks input detection | Medium | Test on high-DPI devices, ensure Phaser 3.90+ (fixed in newer versions) |
| Firebase + localStorage sync conflict | Low | ProgressManager only writes to Firebase, EconomyManager only to localStorage |

---

## Performance Considerations

### Lives Timer
- **Impact:** Negligible (single setTimeout per scene)
- **Optimization:** Stop timer when scene is paused

### Parallax Layers
- **Impact:** Low (TileSprite is GPU-optimized)
- **Optimization:** Use max 4 layers, avoid transparency overdraw

### Variable Boards
- **Impact:** None (same grid iteration, some cells skipped)
- **Optimization:** Already optimal

### DPI Scaling
- **Impact:** Medium (higher resolution = more pixels to render)
- **Optimization:** Cap max resolution at 2x on mobile (balance sharpness vs performance)

---

## Summary

All new features integrate cleanly with the existing architecture:

- **Lives/Economy/Settings** → New registry singletons (parallel to ProgressManager)
- **Variable boards** → Level JSON extension + minor engine param
- **Progressive obstacles** → Visual-only change (logic already exists)
- **Pre-placed tiles** → Level JSON + new engine method
- **Kyiv map** → LevelSelectScene refactor (self-contained)
- **DPI/Mobile** → Config change + scene layout adjustments

**No breaking changes to core Match3Engine, GravityEngine, or existing manager contracts.**

**Confidence:** HIGH - patterns are standard Phaser 3 practices, well-documented, and align with existing codebase conventions.
