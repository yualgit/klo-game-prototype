# Codebase Structure

**Analysis Date:** 2026-02-05

## Directory Layout

```
klo-match-3/
├── README.md                    # Project overview, business goals, architecture summary
├── TECH_SPEC.md                 # Technical specification (stack, schemas, deployment)
├── GAME_DESIGN.md               # Game design document (mechanics, level progression, economy)
├── PROJECT_STATUS.md            # Current development status, next steps
├── .planning/
│   └── codebase/                # GSD codebase analysis documents
├── src/                         # Frontend source code (Phaser + TypeScript)
│   ├── main.ts                  # Entry point: Phaser game initialization
│   ├── scenes/                  # Phaser scenes (game states)
│   │   ├── Boot.ts              # Loading, auth, asset initialization
│   │   ├── Menu.ts              # Main menu, level select
│   │   ├── Game.ts              # Active level gameplay
│   │   └── UI.ts                # HUD overlay (moves, goals, pause)
│   ├── game/                    # Core match-3 game logic
│   │   ├── Grid.ts              # 8×8 grid manager, match detection, gravity, spawn
│   │   ├── Tile.ts              # Individual tile with type and state
│   │   ├── Match.ts             # Match detection algorithm
│   │   ├── Booster.ts           # Booster types (linear, bomb, rocket, sphere)
│   │   └── Obstacle.ts          # Obstacle types (ice, dirt, crate, blocked)
│   ├── data/                    # Data loading and management
│   │   ├── LevelLoader.ts       # Parse level JSON, return typed Level object
│   │   └── RemoteConfig.ts      # Firebase Remote Config wrapper
│   ├── firebase/                # Backend services integration
│   │   ├── auth.ts              # Firebase Auth (anonymous + phone)
│   │   ├── firestore.ts         # Firestore operations (user, coupon documents)
│   │   ├── analytics.ts         # Firebase Analytics event dispatch
│   │   └── functions.ts         # Cloud Functions client calls
│   └── utils/                   # Shared utilities
│       ├── constants.ts         # Game enums, tile types, move directions
│       └── helpers.ts           # Math, validation, formatting helpers
├── functions/                   # Firebase Cloud Functions (backend)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts             # Cloud Functions entry point
│       ├── coupons.ts           # generateCoupon, redeemCoupon logic
│       └── antifraud.ts         # Fraud detection, device/IP rate limiting
├── public/                      # Static assets served by Hosting
│   ├── index.html               # PWA entry point
│   ├── assets/                  # Game graphics, audio (PNG, MP3, etc.)
│   └── data/
│       └── levels/              # Copy of JSON levels (deployed with frontend)
├── data/                        # Source level definitions (canonical)
│   └── levels/
│       ├── level_001.json       # Tutorial: fuel collection
│       ├── level_002.json       # Tutorial: multi-type collection
│       ├── level_003.json       # First obstacles (ice)
│       ├── level_004.json       # Ice + multi-goal
│       └── level_005.json       # Booster creation + first coupon
├── docs/                        # Additional documentation
│   ├── STYLE_GUIDE.md           # Visual design system (colors, components, animations)
│   ├── ANALYTICS.md             # Event taxonomy, user properties, metrics
│   └── COUPONS.md               # Coupon generation/redemption flows, integration
├── assets/                      # Design source files (Figma, Illustrator, etc.)
├── .env.example                 # Template for environment variables
├── package.json                 # Frontend dependencies (Phaser, Firebase, TypeScript, Vite)
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Build tool config
├── firebase.json                # Firebase Hosting/Functions deployment config
└── .firebaserc                  # Firebase project alias
```

## Directory Purposes

**Root-level docs:**
- Purpose: Project governance and spec documents
- Contains: README.md, TECH_SPEC.md, GAME_DESIGN.md, PROJECT_STATUS.md
- Key files: These are single sources of truth for architecture, mechanics, status

**src/:**
- Purpose: All frontend application code
- Contains: TypeScript source files for game logic, UI, Firebase integration
- Key files: `src/main.ts` (entry point), `src/scenes/Game.ts` (core game loop)

**src/scenes/:**
- Purpose: Phaser scene definitions (application states)
- Contains: Game state management classes
- Key files: `src/scenes/Game.ts` is the main game loop; `src/scenes/Boot.ts` initializes auth/assets

**src/game/:**
- Purpose: Core match-3 game mechanics (not Phaser-specific)
- Contains: Grid, Tile, Match, Booster, Obstacle classes
- Key files: `src/game/Grid.ts` orchestrates all match-3 logic; `src/game/Match.ts` is pure algorithm

**src/data/:**
- Purpose: Data loading abstraction (level JSON, remote config)
- Contains: LevelLoader (file I/O), RemoteConfig (Firebase SDK wrapper)
- Key files: `src/data/LevelLoader.ts` parses `data/levels/*.json` files

**src/firebase/:**
- Purpose: All backend service calls and auth
- Contains: Firebase SDK initialization, Firestore operations, Analytics dispatch
- Key files: `src/firebase/auth.ts` (auth state), `src/firebase/functions.ts` (Cloud Function calls)

**src/utils/:**
- Purpose: Shared constants and helper functions
- Contains: Game constants (TILE_TYPES, DIRECTIONS), math helpers, validation
- Key files: `src/utils/constants.ts` defines all game enums

**functions/:**
- Purpose: Firebase Cloud Functions (server-side)
- Contains: generateCoupon, redeemCoupon, antifraud logic
- Key files: `functions/src/coupons.ts` is primary business logic

**public/:**
- Purpose: Static assets deployed to Firebase Hosting
- Contains: index.html, graphics, audio, level JSON copies
- Key files: `public/index.html` is the PWA entry point

**data/:**
- Purpose: Canonical source for level definitions
- Contains: Level JSON files (L1–L5 examples, template for L6–L100)
- Key files: `data/levels/level_001.json` through `level_005.json` are reference implementations

**docs/:**
- Purpose: Design system and operational documentation
- Contains: Style guide, analytics event taxonomy, coupon integration details
- Key files: `docs/STYLE_GUIDE.md` for visual design, `docs/ANALYTICS.md` for event specs

## Key File Locations

**Entry Points:**
- `src/main.ts`: Creates Phaser game instance; loads Boot scene
- `public/index.html`: HTML template; mounts Phaser game
- `functions/src/index.ts`: Exports Cloud Functions (generateCoupon, redeemCoupon)

**Configuration:**
- `package.json`: Frontend dependencies, build scripts
- `tsconfig.json`: TypeScript compiler options
- `vite.config.ts`: Build pipeline (bundling, dev server, output)
- `firebase.json`: Hosting/Functions/Firestore deployment config
- `.firebaserc`: Firebase project alias mapping
- `.env.example`: Required environment variables (Firebase config, API keys)

**Core Logic:**
- `src/game/Grid.ts`: Grid state, match detection, gravity, spawn
- `src/game/Match.ts`: Match detection algorithm (pure function)
- `src/scenes/Game.ts`: Game loop, input handling, win/loss state
- `functions/src/coupons.ts`: Coupon generation/redemption business logic

**Testing:**
- `src/**/*.test.ts` or `src/**/*.spec.ts`: Unit tests (Jest, not yet created)
- `functions/**/*.test.ts`: Cloud Functions unit tests (not yet created)

**Data:**
- `data/levels/level_NNN.json`: Level definitions (source of truth)
- `public/data/levels/level_NNN.json`: Level copies (deployed)

## Naming Conventions

**Files:**

- `PascalCase` for Phaser scene and game class files: `Game.ts`, `Grid.ts`, `Booster.ts`
- `camelCase` for service/utility files: `auth.ts`, `analytics.ts`, `constants.ts`
- `kebab-case` for data directories: `data/levels/`, `public/assets/`
- Level JSONs: `level_NNN.json` with zero-padded 3-digit IDs (level_001, level_010, level_100)

**Directories:**

- `PascalCase` for multi-word feature domains (when used): Not currently used; directories are lowercase plural
- lowercase plural for domain collections: `scenes/`, `game/`, `firebase/`, `functions/`
- `data/levels/` for game content files
- `public/assets/` for graphics and audio
- `docs/` for additional specs and guides

## Where to Add New Code

**New Feature (e.g., new booster type):**
- Primary code: Extend `src/game/Booster.ts` with new booster class (implement `execute()` method)
- Game loop integration: Update `src/game/Grid.ts` to handle new booster in combo detection or player activation
- Level data: Update `data/levels/*.json` `rewards.boosters` field to include new type
- Tests: Create `src/game/Booster.test.ts` with unit tests for new booster logic

**New Game Scene (e.g., shop, settings):**
- Implementation: Create new file in `src/scenes/` (e.g., `src/scenes/Shop.ts`)
- Scene management: Register in `src/main.ts` Phaser scene list
- Transitions: Update Menu and Game scenes to call `scene.start('Shop')` as needed
- State: If persistent, use `src/firebase/firestore.ts` to read/write user config

**New Analytics Event:**
- Event dispatch: Add call to `src/firebase/analytics.ts` `logEvent()` in the appropriate game location
- Parameters: Document event schema in `docs/ANALYTICS.md`
- Remote Config override: Add to Firebase Remote Config dashboard if A/B testing

**New Obstacle Type:**
- Implementation: Extend `src/game/Obstacle.ts` with new type class (implement `onHit()` method)
- Level integration: Add type to level JSON `obstacles` array
- Grid interaction: Update `src/game/Grid.ts` match detection to account for obstacle blocking behavior

**Utilities:**
- Shared helpers: Add to `src/utils/helpers.ts` with TypeScript type signatures
- Constants: Add to `src/utils/constants.ts` (enums, magic numbers)

**Cloud Functions:**
- New callable function: Add to `functions/src/coupons.ts` or create new file (e.g., `missions.ts`)
- Deploy: `firebase deploy --only functions`
- Client call: Wrap in `functions/src/index.ts` export; call from scene via `src/firebase/functions.ts`

## Special Directories

**data/levels/:**
- Purpose: Canonical source for level definitions
- Generated: No (manually created JSON)
- Committed: Yes (part of git repo)
- Build step: Copied to `public/data/levels/` during Vite build

**public/:**
- Purpose: Static assets deployed to Firebase Hosting
- Generated: Yes (Vite outputs bundled JS/CSS here)
- Committed: No (generated, but level JSON copies are committed)

**functions/:**
- Purpose: Isolated backend environment
- Generated: No (source code; build output goes to `functions/lib/`)
- Committed: Yes (TypeScript source; `node_modules/` excluded)

**node_modules/:**
- Purpose: Installed packages
- Generated: Yes
- Committed: No (lockfile `package-lock.json` is committed)

**.planning/codebase/:**
- Purpose: GSD analysis documents
- Generated: No (written by GSD tools)
- Committed: Yes (guidance for future development)

---

*Structure analysis: 2026-02-05*
