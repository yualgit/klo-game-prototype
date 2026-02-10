# Codebase Structure

**Analysis Date:** 2026-02-10

## Directory Layout

```
klo-match-3/
├── src/                           # TypeScript source code
│   ├── main.ts                    # Application entry point (bootstrap)
│   ├── vite-env.d.ts              # Vite type definitions
│   ├── game/                      # Core game logic and managers
│   │   ├── Match3Engine.ts        # Pure match-3 mechanics
│   │   ├── BoosterActivator.ts    # Booster effect execution
│   │   ├── LevelManager.ts        # Goal/move tracking + level events
│   │   ├── ProgressManager.ts     # User progress persistence (Firestore)
│   │   ├── EconomyManager.ts      # Lives/bonuses management (Firestore)
│   │   ├── SettingsManager.ts     # User preferences (localStorage)
│   │   ├── TileSprite.ts          # Phaser sprite wrapper for tiles
│   │   ├── VFXManager.ts          # Particle effects
│   │   ├── AudioManager.ts        # Sound playback wrapper
│   │   ├── types.ts               # TypeScript type definitions
│   │   ├── constants.ts           # Game constants (colors, textures, etc)
│   │   ├── *.test.ts              # Unit tests (Match3Engine, LevelManager, etc)
│   │   └── .gitkeep
│   ├── scenes/                    # Phaser scenes
│   │   ├── Boot.ts                # Asset preload + progress bar
│   │   ├── Menu.ts                # Animated title screen
│   │   ├── LevelSelect.ts         # Level picker with winding path
│   │   ├── Game.ts                # Main 8x8 gameplay
│   │   ├── index.ts               # Scene exports
│   │   └── .gitkeep
│   ├── firebase/                  # Firebase integration
│   │   ├── index.ts               # Init function + module singletons
│   │   ├── config.ts              # Firebase config (uses vite env vars)
│   │   ├── auth.ts                # AuthService (anonymous sign-in)
│   │   ├── firestore.ts           # FirestoreService (save/load progress)
│   │   └── .gitkeep
│   ├── utils/                     # Utilities
│   │   ├── responsive.ts          # DPR-aware layout calculation
│   │   ├── constants.ts           # Global constants (tile size, gaps)
│   │   └── .gitkeep
│   └── data/                      # (placeholder for runtime data)
│       └── .gitkeep
├── public/                        # Static assets + level data
│   ├── data/                      # Level JSON files
│   │   └── levels/
│   │       ├── level_001.json     # Level 1 definition (goals, moves, obstacles)
│   │       ├── level_002.json     # ... (up to level_010.json)
│   │       └── ...
│   └── assets/                    # Image/audio assets
│       ├── tiles/                 # Tile textures (burger, hotdog, etc)
│       ├── boosters/              # Booster visuals (bomb, klo_horizontal, etc)
│       ├── blockers/              # Obstacle visuals (ice, grass, crate)
│       ├── blocks/                # Block background texture
│       ├── gui/                   # UI elements (buttons, icons, progress bars)
│       ├── bg/                    # Background layers (kyiv themed)
│       ├── collections/           # Collection quest icons (car, coffee, food)
│       ├── sound/                 # Audio effects (match, bomb, win, lose)
│       └── .gitkeep
├── dist/                          # Build output (generated)
├── node_modules/                  # Dependencies
├── .planning/                     # Project documentation
│   ├── codebase/                  # Codebase analysis docs
│   │   ├── ARCHITECTURE.md        # (this file)
│   │   ├── STRUCTURE.md           # (this file)
│   │   ├── STACK.md               # (tech stack)
│   │   └── ...
│   └── phases/                    # Implementation phase docs
├── tsconfig.json                  # TypeScript config
├── vite.config.ts                 # Vite bundler config
├── jest.config.js                 # Jest test runner config
├── package.json                   # Dependencies + scripts
└── .gitignore                     # Ignored files

```

## Directory Purposes

**`src/`:**
- Purpose: All application source code (TypeScript)
- Contains: Game logic, scenes, Firebase integration, utilities
- Key files: `main.ts` (entry point), scene files, manager classes

**`src/game/`:**
- Purpose: Core game engine, state management, and supporting services
- Contains: Match3Engine (pure logic), managers (Progress/Economy/Settings), rendering helpers (TileSprite, VFX, Audio)
- Key files: `Match3Engine.ts`, `ProgressManager.ts`, `EconomyManager.ts`, `types.ts`

**`src/scenes/`:**
- Purpose: Phaser scene implementations for app flow
- Contains: Boot (preload), Menu (title), LevelSelect (level picker), Game (gameplay)
- Key files: One class per file, all export to `index.ts`

**`src/firebase/`:**
- Purpose: Firebase SDK integration and backend communication
- Contains: Config loading, anonymous auth, Firestore persistence operations
- Key files: `index.ts` (bootstrap), `firestore.ts` (save/load), `auth.ts` (sign-in)

**`src/utils/`:**
- Purpose: Reusable utilities (responsive layout, constants)
- Contains: DPR-aware sizing calculations, game constant definitions
- Key files: `responsive.ts`, `constants.ts`

**`public/data/`:**
- Purpose: Level definition JSON files (loaded in Boot preload)
- Contains: Grid dimensions, goal definitions, spawn rules, obstacles per level
- Key files: `levels/level_NNN.json` (one per level 1-10)

**`public/assets/`:**
- Purpose: Game assets (images, sounds)
- Contains: Tile textures, booster visuals, obstacles, GUI elements, backgrounds, audio
- Key files: Organized by type (tiles/, boosters/, gui/, sound/, bg/)

**`dist/`:**
- Purpose: Build output (should not be committed)
- Generated by: `npm run build`
- Contents: Bundled JS, compiled assets, HTML

## Key File Locations

**Entry Points:**
- `src/main.ts`: Browser execution starts here. Bootstraps Firebase, creates managers, starts Phaser.
- `src/scenes/Boot.ts`: First scene. Preloads all assets (textures, sounds, level JSONs), shows progress bar.

**Configuration:**
- `src/firebase/config.ts`: Firebase project credentials (loaded from vite env vars `VITE_FIREBASE_*`)
- `src/utils/constants.ts`: TILE_SIZE, TILE_GAP, DPR cap
- `src/game/constants.ts`: TILE_COLORS, TEXTURE_KEYS, SOUND_KEYS, GUI_TEXTURE_KEYS, MAP_CONFIG

**Core Logic:**
- `src/game/Match3Engine.ts`: All match-3 mechanics (swap, match detection, cascade, gravity)
- `src/game/types.ts`: TypeScript type definitions (TileData, BoosterType, LevelGoal, etc)
- `src/game/LevelManager.ts`: Goal tracking, move counter, win/lose logic

**State & Persistence:**
- `src/game/ProgressManager.ts`: Level completion, stars, persistence to Firestore
- `src/game/EconomyManager.ts`: Lives, bonuses, regeneration logic, persistence to Firestore
- `src/game/SettingsManager.ts`: Audio/animation toggles, persistence to localStorage

**Scenes:**
- `src/scenes/Menu.ts`: Title screen with animated tiles, "Play" button
- `src/scenes/LevelSelect.ts`: Level picker UI, winding path, star progress, locked levels
- `src/scenes/Game.ts`: Main 8x8 grid gameplay, HUD (moves/goals), back button, game over dialogs

**Supporting Services:**
- `src/game/TileSprite.ts`: Phaser Container for tile rendering (tile + booster + obstacle layers)
- `src/game/VFXManager.ts`: Particle bursts on match, sparkles on level complete
- `src/game/AudioManager.ts`: Sound effect playback (match, bomb, win/lose)
- `src/game/BoosterActivator.ts`: Booster effect logic (single + combo effects)

**Firebase Integration:**
- `src/firebase/index.ts`: Bootstrap function `initFirebase()`, exports getters for services
- `src/firebase/firestore.ts`: `FirestoreService` class with `saveProgress()`, `loadProgress()`, `saveEconomy()`, `loadEconomy()`
- `src/firebase/auth.ts`: `AuthService` class with `signInAnonymous()`

**Level Data:**
- `public/data/levels/level_001.json` through `level_010.json`: Level definitions
  - Each file: grid dimensions, goals (collect/destroy/create), moves, spawn rules, obstacles
  - Loaded by Boot preload as JSON

## Naming Conventions

**Files:**
- Scene files: `CamelCase.ts` matching class name (e.g., `Game.ts` contains `export class Game`)
- Manager files: `NameManager.ts` (e.g., `ProgressManager.ts`, `EconomyManager.ts`)
- Service files: `NameService.ts` (e.g., `FirestoreService`, `AuthService`)
- Test files: `FileName.test.ts` (e.g., `Match3Engine.test.ts`)
- Type files: `types.ts`, `constants.ts`

**Directories:**
- Functional grouping: `src/game/`, `src/scenes/`, `src/firebase/`, `src/utils/`
- Asset organization: By type (tiles/, boosters/, blockers/, gui/, bg/, sound/, collections/)
- Level data: `public/data/levels/level_NNN.json` (zero-padded numbers)

## Where to Add New Code

**New Gameplay Feature (e.g., new booster type):**
- Define type in `src/game/types.ts` (BoosterType union)
- Add visual key to `src/game/constants.ts` (BOOSTER_TEXTURE_KEYS)
- Implement activation logic in `src/game/BoosterActivator.ts` (activateBooster method)
- Add booster combo rules to `src/game/BoosterActivator.ts` (BOOSTER_COMBO_TABLE)
- Load texture in `src/scenes/Boot.ts` preload
- Add test cases in `src/game/BoosterActivator.test.ts`

**New Level:**
- Create JSON file: `public/data/levels/level_NNN.json`
- Match schema in `src/game/types.ts` (LevelData interface)
- Load in `src/scenes/Boot.ts` (add `this.load.json('level_NNN', '...')`)
- Add level name to `src/scenes/LevelSelect.ts` (LEVEL_NAMES map)
- Add level node position to `src/game/constants.ts` (MAP_CONFIG.LEVEL_NODES)
- Update MAX_LEVELS in `src/scenes/Game.ts`

**New Manager (cross-scene state):**
- Create class file: `src/game/NewManager.ts`
- Initialize in `src/main.ts` after Firebase setup
- Store in registry: `game.registry.set('newManager', instance)`
- Access in scenes: `const manager = this.registry.get('newManager')`

**Utility Functions:**
- Shared math/layout: `src/utils/responsive.ts` or new `src/utils/math.ts`
- Game constants: `src/utils/constants.ts`

## Special Directories

**`.planning/`:**
- Purpose: Project documentation and phase planning
- Generated: By GSD orchestrator
- Committed: Yes (tracked in git for historical reference)
- Contains: Architecture docs, phase plans, research, milestones

**`dist/`:**
- Purpose: Build output
- Generated: By `npm run build` (Vite)
- Committed: No (in .gitignore)
- Contents: Bundled JS, HTML, assets

**`public/`:**
- Purpose: Static files served as-is
- Contents: Level JSONs, image/audio assets
- How served: Vite dev server serves directly; build copies to dist/

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: By `npm install`
- Committed: No (in .gitignore)

---

*Structure analysis: 2026-02-10*
