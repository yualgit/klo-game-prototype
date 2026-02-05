# Architecture

**Analysis Date:** 2026-02-05

## Pattern Overview

**Overall:** Layered PWA architecture with a backend-driven game client pattern

**Key Characteristics:**
- Phaser 3-based frontend (TypeScript) connected to Firebase backend
- Game logic decoupled from UI/rendering
- Firebase as source of truth for user state, level definitions, and remote configuration
- Grid-based match-3 game engine with plugin-style booster and obstacle systems
- Event-driven analytics integration

## Layers

**Presentation (UI/Rendering):**
- Purpose: Render game scenes, handle user input, display animations and transitions
- Location: `src/scenes/`
- Contains: Phaser scene classes (Boot, Menu, Game, UI)
- Depends on: Game layer, Firebase services, Phaser 3 framework
- Used by: Player directly; orchestrates all visible interactions

**Game Engine:**
- Purpose: Core match-3 mechanics (grid, swap, match detection, gravity, spawn)
- Location: `src/game/`
- Contains: Grid manager, Tile, Match logic, Booster logic, Obstacle logic
- Depends on: Data formats, Phaser physics/graphics
- Used by: Game scene, UI layer for state feedback

**Data/Configuration:**
- Purpose: Load and manage game levels, remote configuration, local state
- Location: `src/data/`
- Contains: LevelLoader (parses JSON from `data/levels/`), RemoteConfig (Firebase Remote Config wrapper)
- Depends on: Firebase SDK, file system (public/data)
- Used by: Game engine, scenes for initialization

**Backend Services (Firebase):**
- Purpose: Persist user state, manage coupons, track analytics, serve configuration
- Location: `src/firebase/` (client), `functions/` (Cloud Functions)
- Contains: Auth service, Firestore document operations, Analytics integration, Cloud Functions triggers
- Depends on: Firebase SDK, Firestore rules
- Used by: Entire application (cross-cutting)

**Utilities:**
- Purpose: Shared constants, helper functions, enums
- Location: `src/utils/`
- Contains: Constants, math helpers
- Depends on: None
- Used by: All layers

## Data Flow

**Level Initialization:**

1. App boots → `Boot` scene loads
2. `LevelLoader.ts` fetches level JSON from `data/levels/level_NNN.json` (or Remote Config override)
3. Level schema is parsed into `Level` interface
4. `Grid.ts` initializes 8×8 grid with spawn rules from level definition
5. Obstacles placed at positions specified in level JSON
6. UI displays grid, goal counters, move counter

**Player Move Execution:**

1. Player taps two adjacent tiles
2. `Grid.swap()` validates move, swaps tile positions
3. `Match.detectMatches()` scans for 3+ consecutive matching tiles
4. Matched tiles removed, counters updated
5. `Grid.applyGravity()` drops remaining tiles
6. `Grid.spawn()` creates new tiles at top using spawn_rules probabilities
7. Repeat detection until no matches found
8. If combo occurred: `Booster.createBooster()` may be triggered
9. Goals checked: `Match.checkGoals()`
10. If goals complete: `level_win` event logged to Firebase Analytics
11. If moves depleted: `level_fail` event logged

**Coupon Generation & Redemption:**

1. Player wins level with coupon_chance triggered
2. Client calls Firebase Cloud Function `generateCoupon`
3. Function validates: user limits, campaign budget, antifraud checks
4. Coupon document created in Firestore collection `coupons`
5. Coupon returned to client, displayed in reward UI
6. On redemption (at KLO station): `redeemCoupon` function called
7. Coupon status updated to `redeemed`, metadata recorded (station_id, receipt_id, product_id)

**State Management:**

- **Client-side volatile:** Current game session (grid state, remaining moves, goals progress) stored in Phaser scene properties
- **Persistent (Firestore):** User profile, completed levels, booster inventory, earned coupons, stats
- **Configuration (Firebase Remote Config):** Level data overrides, reward frequencies, coupon types, A/B test flags
- **Analytics (Firebase Analytics):** All events logged synchronously; batched by Firebase SDK

## Key Abstractions

**Grid:**
- Purpose: Manages 8×8 tile matrix; orchestrates match detection, gravity, spawning
- Examples: `src/game/Grid.ts`
- Pattern: Singleton per level; maintains internal 2D array of Tile references

**Tile:**
- Purpose: Represents a single grid cell with type (fuel, coffee, snack, road) and state (normal, frozen, exploding)
- Examples: `src/game/Tile.ts`
- Pattern: Composite with Phaser Sprite; can be normal tile or booster tile

**Match:**
- Purpose: Detects connected components of matching tiles; generates combo chains
- Examples: `src/game/Match.ts`
- Pattern: Pure logic (no side effects); returns match groups for Grid to process

**Booster:**
- Purpose: Represents special effects (linear strip, bomb 3×3, rocket cross, KLO-sphere all-of-type)
- Examples: `src/game/Booster.ts`
- Pattern: Strategy pattern; each booster type implements `execute()` method

**Obstacle:**
- Purpose: Represents environmental challenges (ice layers, dirt, crates, blocked cells)
- Examples: `src/game/Obstacle.ts`
- Pattern: State-based; tracks health (layers), behavior on match impact

**Level:**
- Purpose: Immutable config for a single level (moves, grid, goals, obstacles, spawn rules)
- Examples: Interface in `TECH_SPEC.md`; loaded from JSON by `LevelLoader.ts`
- Pattern: Data transfer object; parsed once, referenced throughout level session

## Entry Points

**Application Boot:**
- Location: `src/main.ts`
- Triggers: Browser loads index.html, JavaScript bundled by Vite
- Responsibilities: Initialize Phaser game instance, load initial scene (Boot)

**Game Scene:**
- Location: `src/scenes/Game.ts`
- Triggers: Boot scene completes, Menu scene transitions to game on level select
- Responsibilities: Instantiate Grid, render tiles, listen for player input, orchestrate win/loss logic

**Firebase Initialization:**
- Location: `src/firebase/auth.ts` (and other service files)
- Triggers: Application startup
- Responsibilities: Initialize Firebase SDK, establish auth state (anonymous or linked to loyalty_id)

**Booster Activation:**
- Location: `src/game/Booster.ts` (specific type classes)
- Triggers: Either player manually uses pre-earned booster OR combo creates in-match booster
- Responsibilities: Calculate affected tiles, apply destruction/effects, update goals

## Error Handling

**Strategy:** Try-catch at service boundaries (Firebase calls, level loading); graceful degradation in match detection

**Patterns:**

- **Firebase Errors:** Catch in async/await try-catch; fallback to offline mode (single player session) or retry with exponential backoff
- **Level Load Failure:** Show error screen; allow retry or return to menu
- **Firestore Rules Rejection:** User sees "permission denied" toast; client logs telemetry
- **Grid Logic Errors:** Grid state reverts to pre-move snapshot if swap/match logic throws
- **Booster Activation Failure:** Booster returned to inventory; player refunded move if applied mid-move

## Cross-Cutting Concerns

**Logging:** Firebase Analytics event dispatch in key game state transitions (level_start, level_win, booster_used, coupon_claimed). Custom events logged via `src/firebase/analytics.ts`

**Validation:** Level JSON schema validated by TypeScript interfaces; Firestore security rules enforce user-scoped coupon access; Cloud Functions validate antifraud signals before coupon creation

**Authentication:** Firebase Anonymous auth by default; optional phone auth to link loyalty_id and unlock real coupons. Auth state persisted in Firestore user doc.

---

*Architecture analysis: 2026-02-05*
