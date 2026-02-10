# Architecture

**Analysis Date:** 2026-02-10

## Pattern Overview

**Overall:** Layered MVC with Phaser 3 scene management, game logic separation, and singleton managers for cross-scene state.

**Key Characteristics:**
- Pure game logic decoupled from rendering (Match3Engine handles all rules, Phaser handles display)
- Singleton pattern for persistent game state (ProgressManager, EconomyManager, SettingsManager)
- Scene-based state machine (Boot → Menu → LevelSelect → Game)
- Registry-based dependency injection for scene access to managers
- Reactive settings with subscription pattern for audio/VFX control
- Firebase backend for user persistence (anonymous auth, progress/economy storage)

## Layers

**Core Game Logic Layer:**
- Purpose: Pure match-3 mechanics without dependencies on rendering
- Location: `src/game/Match3Engine.ts`
- Contains: Grid state, tile matching algorithms, cascade resolution, booster logic
- Depends on: Type definitions from `src/game/types.ts`
- Used by: `src/scenes/Game.ts`, `src/game/BoosterActivator.ts`, unit tests

**Rendering Layer:**
- Purpose: Phaser-based visual display of game state
- Location: `src/scenes/Game.ts` (main gameplay scene), `src/game/TileSprite.ts` (tile rendering)
- Contains: Container objects, sprite positioning, animations, input handling
- Depends on: Match3Engine output, assets loaded by Boot scene
- Used by: Game scene lifecycle

**State Management Layer:**
- Purpose: Persistent user state across scenes and sessions
- Location: `src/game/ProgressManager.ts`, `src/game/EconomyManager.ts`, `src/game/SettingsManager.ts`
- Contains: Progress tracking (levels/stars), resource management (lives/bonuses), user preferences (audio/animations)
- Depends on: Firebase (ProgressManager, EconomyManager), localStorage (SettingsManager)
- Used by: All scenes via `game.registry.get()`

**Scene Management Layer:**
- Purpose: Navigate app state, initialize scenes with managers
- Location: `src/scenes/Boot.ts`, `src/scenes/Menu.ts`, `src/scenes/LevelSelect.ts`, `src/scenes/Game.ts`
- Contains: Scene lifecycle (preload, create, update), scene transitions
- Depends on: Phaser, managers from registry, level data
- Used by: Main Phaser game instance

**Backend/Persistence Layer:**
- Purpose: Firebase integration for user data
- Location: `src/firebase/index.ts`, `src/firebase/firestore.ts`, `src/firebase/auth.ts`
- Contains: Anonymous auth, progress/economy read-write operations, offline persistence
- Depends on: Firebase SDK
- Used by: `src/main.ts` (bootstrap), managers (save/load operations)

**Utility Layer:**
- Purpose: Cross-cutting concerns
- Location: `src/utils/responsive.ts`, `src/utils/constants.ts`
- Contains: Responsive layout calculation (DPR-aware), game constants
- Depends on: None
- Used by: All scenes and managers

**Supporting Services:**
- Purpose: Specialized gameplay features
- Location: `src/game/LevelManager.ts` (goal/move tracking), `src/game/BoosterActivator.ts` (booster effects), `src/game/VFXManager.ts` (particles), `src/game/AudioManager.ts` (sound)
- Contains: Level state machines, booster combo logic, particle effects, sound playback
- Depends on: Match3Engine, SettingsManager, Phaser
- Used by: Game scene

## Data Flow

**Initialization Flow (Bootstrap):**

1. `src/main.ts` starts execution
2. Initialize Firebase (`src/firebase/index.ts`):
   - Anonymous sign-in
   - Enable offline persistence
   - Create AuthService and FirestoreService
3. Load/create user state:
   - ProgressManager from Firestore (first-time defaults if needed)
   - EconomyManager from Firestore (first-time defaults if needed)
   - SettingsManager from localStorage
4. Store all managers in `game.registry`:
   - `registry.set('progress', progressManager)`
   - `registry.set('economy', economyManager)`
   - `registry.set('settings', settingsManager)`
   - `registry.set('dpr', dpr)`
5. Start Phaser Game with scene list: Boot → Menu → LevelSelect → Game

**Gameplay Flow (Game Scene):**

1. User taps/swaps two tiles
2. Input handler passes to Match3Engine:
   - Engine validates swap legality
   - Checks for matches after swap
   - Returns MatchResult (tilesToRemove, boostersToSpawn)
3. If matches found:
   - VFXManager plays particle effects
   - AudioManager plays match sound
   - LevelManager updates goal progress
   - Engine removes matched tiles, spawns boosters
4. Gravity cascade:
   - Engine applies gravity (tiles fall)
   - Engine checks for new matches
   - Repeats up to MAX_CASCADE_DEPTH (20)
5. Level state:
   - LevelManager decrements moves, checks win/lose conditions
   - If goals complete before moves exhaust: level won, ProgressManager records stars
   - If moves exhausted before goals: level lost, EconomyManager loses a life
6. Scene transition:
   - Save all state (ProgressManager.saveProgress(), EconomyManager persistent saves)
   - Transition to LevelSelect or restart Game

**Settings Change Flow (Reactive):**

1. SettingsManager.set(key, value):
   - Updates internal data
   - Saves to localStorage
   - Calls notify() to all subscribers
2. Subscribers (VFXManager, AudioManager):
   - Receive callback with new value
   - Update internal state (animationsEnabled, muted, volume)
   - Next gameplay event uses new settings

**State Management:**

- **ProgressManager**: Tracks level completion, stars (0-3 per level), current level
  - Persists to Firestore on completeLevel()
  - Accessed by LevelSelect (unlock logic), Game (star calculation)

- **EconomyManager**: Tracks lives (0-5 max), bonuses, regeneration timer
  - Auto-recalculates lives on getLives() call (includes regen logic)
  - Persists to Firestore on loseLife() or spendBonusesForRefill()
  - Accessed by LevelSelect (HUD), Game (life loss on level start)

- **SettingsManager**: Tracks sfxEnabled, sfxVolume, animationsEnabled
  - Persists to localStorage only
  - Subscribed to by VFXManager and AudioManager

## Key Abstractions

**Match3Engine:**
- Purpose: Pure game logic state machine
- Examples: `src/game/Match3Engine.ts`
- Pattern: Immutable grid operations (mutations return new state, no side effects)
- Core methods: `swapTiles()`, `processMatches()`, `processCascade()`, `getTilesInRadius()`

**TileSprite:**
- Purpose: Phaser Container wrapper for tile display and interaction
- Examples: `src/game/TileSprite.ts`
- Pattern: Managed sprite lifecycle (update, animation, selection state)
- Contains: tile image, booster overlay, obstacle overlay, obstacle layers text

**LevelManager:**
- Purpose: Level goal/move tracking with event emission
- Examples: `src/game/LevelManager.ts`
- Pattern: Observer pattern (listeners notified on state change)
- Emits: moves_changed, goals_updated, level_won, level_lost

**BoosterActivator:**
- Purpose: Booster effect execution (single and combo)
- Examples: `src/game/BoosterActivator.ts`
- Pattern: Strategy pattern (different booster types = different tile selection algorithms)
- Combos: Defined in BOOSTER_COMBO_TABLE lookup

## Entry Points

**Application Start:**
- Location: `src/main.ts`
- Triggers: Browser loads HTML, executes JS bundle
- Responsibilities:
  1. Initialize Phaser Game with Scale.RESIZE + DPR scaling
  2. Bootstrap Firebase and user state managers
  3. Create scene instances and register with game
  4. Store managers in registry for scene access

**Scene Transitions:**
- Boot → Menu: `this.scene.start('Menu')` after assets preload
- Menu → LevelSelect: Play button triggers `this.scene.start('LevelSelect')`
- LevelSelect → Game: Level node click triggers `this.scene.start('Game', { levelId })`
- Game → LevelSelect: Back button or level complete/lost triggers `this.scene.start('LevelSelect')`

**Input Entry Points:**
- LevelSelect drag scroll: Pointer down/move/up listeners update camera scroll
- Game tile select: Pointer move/down listeners track tile interactions for swaps
- Button clicks: Pointer down on text/image areas with setInteractive()

## Error Handling

**Strategy:** Try-catch wrapping async operations (Firebase), fallback defaults for missing data.

**Patterns:**

1. **Firebase Operations** (`src/firebase/firestore.ts`, `src/main.ts`):
   - `loadProgress()` returns null if user doc missing → main.ts creates new progress
   - `saveProgress()` wrapped in try-catch, logs to console
   - Offline persistence prevents throw on network errors

2. **Asset Loading** (`src/scenes/Boot.ts`):
   - Load event handlers manage progress bar
   - Missing assets don't throw (Phaser silently uses missing texture)

3. **Registry Access** (`src/scenes/Game.ts`):
   - `registry.get('progress')` used without null-check (assumes bootstrap succeeded)
   - Scene lifecycle ensures registry populated before scenes access

4. **Settings Persistence** (`src/game/SettingsManager.ts`):
   - localStorage.setItem wrapped in try-catch
   - localStorage.getItem returns null → fall back to defaults
   - Version migration logic allows future schema changes

## Cross-Cutting Concerns

**Logging:** Console.log with `[ModuleName]` prefix (e.g., `[Main]`, `[Match3Engine]`, `[EconomyManager]`)
- No centralized logger; ad-hoc logging per module
- Useful for debugging Firebase sync, cascade resolution, state changes

**Validation:** Input validation at scene boundaries
- Match3Engine validates swap legality (adjacent check, empty cell check)
- LevelManager validates goal state before win/lose (prevents double-completion)
- BoosterActivator validates booster type before activation

**Responsive Layout:** DPR-aware sizing via `getResponsiveLayout()`
- Calculates tile size based on viewport width (40-60px CSS target)
- Converts CSS pixels → Phaser pixels via `cssToGame()` multiplier
- Used by Game scene for dynamic tile sizing, all UI text sizing

**Memory Management:** Manual destruction of graphics/containers
- Game scene destroys blockSprites array on shutdown
- TileSprite containers destroyed on tile removal
- VFXManager particle emitters recycled to prevent memory leak

---

*Architecture analysis: 2026-02-10*
