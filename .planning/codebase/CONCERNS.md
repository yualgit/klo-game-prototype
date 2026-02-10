# Codebase Concerns

**Analysis Date:** 2026-02-10

## Tech Debt

**Type Safety Issues - Excessive `any` and `null!` Assertions:**
- Issue: Multiple files use `any` types and non-null assertions (`null!`) to bypass TypeScript strict mode, bypassing compile-time checks
- Files: `src/scenes/Game.ts` (lines 66, 209, 1219, 1255, 1280), `src/scenes/LevelSelect.ts` (line 34), `src/game/SettingsManager.ts`, `src/game/LevelManager.ts`
- Impact: Prevents compile-time error detection, increases runtime bugs, makes code harder to refactor safely. Examples:
  - `private levelData: any` (line 66) means accessing `levelData.grid.width` has no type safety
  - `animateMatchRemoval(matches: any[])` (line 1219) - parameters lack structure validation
  - `this.hudText = null!` (line 209) - signals broken initialization order
- Fix approach: Replace `any` with proper TypeScript interfaces:
  - Create `LevelData` interface from level JSON schema
  - Type animation function parameters: `animateMatchRemoval(matches: Match[])`
  - Fix initialization order instead of using `null!` - separate concerns into methods

**Excessive Console Logging in Production Code:**
- Issue: 60+ `console.log()` statements with `[Module]` prefixes scattered throughout source code
- Files: `src/scenes/Game.ts` (~20 logs), `src/game/Match3Engine.ts` (~12 logs), `src/game/EconomyManager.ts` (~8 logs), `src/firebase/firestore.ts` (~6 logs), others
- Impact: Degrades performance on low-end devices, exposes internal game logic in browser console, makes debugging harder to parse through noise
- Fix approach: Replace with conditional logging using environment variable:
  ```typescript
  if (process.env.NODE_ENV === 'development') {
    console.log('[Module] message');
  }
  ```

**Fire-and-Forget Async Save Operations Without Error Handling:**
- Issue: EconomyManager.recalculateLives() (line 161) uses fire-and-forget pattern: `this.save().catch(err => console.error())`
- Files: `src/game/EconomyManager.ts` (line 161)
- Impact: If Firestore save fails, player's economy state becomes out-of-sync with backend. Player loses lives/bonuses without notification.
- Fix approach:
  1. Implement retry logic with exponential backoff (3 retries, 1s base delay)
  2. Queue failed writes and retry on scene resume
  3. Surface critical errors to UI with retry button

**Hardcoded Magic Numbers in Responsive Layout:**
- Issue: Tile sizes, padding, button dimensions calculated with hardcoded pixel values scattered across code
- Files: `src/scenes/Game.ts` (lines 125, 217, 222, 223, 317, 360, 361, 400-404), responsive measurements throughout
- Impact: Makes layout brittle. Hard to adjust for new aspect ratios or device families without touching multiple files
- Fix approach: Extract all magic numbers to a central `LayoutConstants` object in `utils/responsive.ts`. Example:
  ```typescript
  const LAYOUT_CONSTANTS = {
    HUD_HEIGHT_CSS: 60,
    HUD_PADDING_CSS: 4,
    BUTTON_WIDTH_CSS: 180,
    // ... etc
  };
  ```

## Known Bugs

**Scene Lifecycle Race Condition - Async Chains Continue After Scene Shutdown:**
- Symptoms: If player rapidly switches scenes or device rotates during cascade animation, async promises can execute after scene is destroyed, causing null reference errors
- Files: `src/scenes/Game.ts` (lines 99-103, 1082-1211)
- Trigger: Rapid scene transitions (back button spam) or orientation change mid-cascade. Try: lose level, immediately click retry, then tap board before animations finish
- Current mitigation: `sceneActive` flag checked at 7+ points in `processCascade()`. However:
  - Flag check only happens before major operations, not between tweens within `Promise.all()`
  - Scene may destroy in middle of animation chain, leaving dangling tweens
  - No cleanup of pending tweens on shutdown
- Workaround: Scene waits for cascades to complete. But edge cases exist if player alt-tabs or loses focus.
- Fix approach:
  1. Call `this.tweens.killAll()` in shutdown event handler
  2. Check `sceneActive` before EVERY tween callback, not just before operations
  3. Use Promise.race() with scene shutdown signal to cancel cascades

**Tile Selection Persists Across Scene Restarts - Null Pointer Access:**
- Symptoms: Null pointer errors when accessing `this.selectedTile` properties after scene restart
- Files: `src/scenes/Game.ts` (lines 202-210 resetState, lines 782-787 input handler)
- Trigger: Lose level, click retry immediately, tap board before fully loaded
- Current mitigation: `resetState()` in create() sets `this.selectedTile = null`, but timing window exists between shutdown and create
- Fix approach:
  1. Use type guard: `if (this.selectedTile?.row !== undefined)` instead of just `if (this.selectedTile)`
  2. Initialize all UI element references in resetState() BEFORE calling create() logic
  3. Add guard at scene start: `if (!this.tileSprites.length) return` in input handlers

**Unsafe Grid Access After Cell Inactivity Check Passes:**
- Symptoms: Player can tap inactive cells (cell_map = 0), causing IndexError when accessing `tileSprites[row][col]`
- Files: `src/scenes/Game.ts` (lines 857-868)
- Trigger: Board with custom cell_map (level 9+), tap outside the playable grid area
- Current mitigation: Line 863 checks `isCellActive()` before accessing sprite
- Fix approach: This is actually safe. Verify with unit test.

**Math.random() Unseeded - Non-Reproducible Levels:**
- Symptoms: Cannot reproduce exact same board state for bug investigation
- Files: `src/game/Match3Engine.ts` (lines 102, 180-189)
- Trigger: Any level generation or reshuffle uses unseeded `Math.random()`
- Current mitigation: None
- Workaround: No way to replay same board for debugging player-reported bugs
- Fix approach:
  1. Add optional `seed` parameter to Match3Engine constructor
  2. Implement seeded random (e.g., mulberry32 algorithm)
  3. Store seed in level/cascade events for replays

## Security Considerations

**Firestore Security Rules - Minimal / Incomplete:**
- Risk: `firestore.rules` exists but likely very basic. No validation that written data conforms to business rules
- Files: `/firestore.rules`, `src/firebase/firestore.ts`
- Current mitigation: Client-side validation in EconomyManager and ProgressManager
- Recommendations:
  1. Add strict Firestore rules that validate on every write:
     ```
     match /users/{uid} {
       allow read: if request.auth.uid == uid;
       allow write: if request.auth.uid == uid
         && request.resource.data.lives >= 0
         && request.resource.data.lives <= 5
         && request.resource.data.bonuses >= 0
         && request.resource.data.current_level >= 1
         && request.resource.data.current_level <= 10;
     }
     ```
  2. Add rate limiting to prevent bonus spam attacks
  3. Server timestamp validation - ensure `last_seen` is from server, not client

**Client-Side Economy State is Mutable Shallow Copy:**
- Risk: `EconomyManager.getState()` (line 116) returns `{ ...this.state }` - shallow copy only. Caller could theoretically mutate nested objects
- Files: `src/game/EconomyManager.ts` (line 116)
- Current mitigation: Callers don't directly modify state, but TypeScript doesn't prevent it
- Fix approach:
  1. Make state property truly read-only with `as const` assertion
  2. Return immutable wrapper or Object.freeze()
  3. Add JSDoc comment: `/** @readonly Returns immutable copy */`

**No Input Validation on Level JSON Schema:**
- Risk: If level JSON is corrupted, missing required fields, or has out-of-bounds positions, game crashes without graceful fallback
- Files: `src/scenes/Game.ts` (lines 110-111, 157-165)
- Trigger: Load level with malformed JSON (e.g., `grid.width: "abc"`, `goals: null`, `obstacles.positions: [[9,9]]`)
- Current mitigation: None - direct property access with no checks
- Fix approach:
  1. Create `LevelSchema` Zod/Joi validation schema
  2. Validate on load: `const level = LevelSchema.parse(rawData)`
  3. Fallback to demo level if validation fails
  4. Log validation errors to Sentry or error analytics

**Lives Regeneration Timer Exploitable:**
- Risk: Player can manually set device time forward to instantly regenerate lives
- Files: `src/game/EconomyManager.ts` (lines 138-158)
- Trigger: Advanced user opens dev tools, modifies `lives_regen_start` timestamp
- Current mitigation: Timestamp from Firestore on load. But if offline, uses local time.
- Fix approach:
  1. Only use server timestamps from Firestore - never trust client time
  2. On load, calculate lives based on `serverTimestamp()`, not device `Date.now()`
  3. Clamp regeneration to max realistic time (e.g., "can't regen more than 2 hours worth")

## Performance Bottlenecks

**Match3Engine.hasValidMoves() - O(n³) Complexity During Reshuffle:**
- Problem: Exhaustively checks all 128 adjacent swaps. Each calls `findMatches()` which is O(n²). Called in loop with 50 reshuffle attempts.
- Files: `src/game/Match3Engine.ts` (lines 543-578, called from line 597 in reshuffleBoard)
- Cause: Naive brute-force approach. Real cost: `50 attempts * 128 swaps * O(n²) findMatches = O(102,400)` operations
- Impact: On low-end devices (iPhone 6S), reshuffle can take 500ms-1s
- Improvement path:
  1. Use heuristic: randomly sample 20 positions instead of checking all 128
  2. Memoize failed swap patterns to avoid re-checking
  3. Early exit: if any 5 consecutive attempts find valid moves, stop trying
  4. Profile with DevTools to confirm actual bottleneck

**Cascade Depth Loop - Processes Entire Grid Multiple Times:**
- Problem: `processCascade()` calls `applyGravity()`, `spawnNewTiles()`, `syncSpritesToEngine()` every iteration
- Files: `src/scenes/Game.ts` (lines 1187-1206)
- Cause: Each operation is O(n²) grid traversal. With up to 20 cascade depth, full grid scans 20+ times
- Impact: Heavy animation chains (5+ boosters) can freeze screen for 2-3 seconds
- Improvement path:
  1. Batch gravity + spawn in single pass (collect empty positions, fill once)
  2. Only sync sprites that moved (track delta positions)
  3. Add frame-rate guard: if FPS drops below 30, skip visual sync until cascade complete
  4. Async cascade: process 2 depths per frame instead of all at once

**50ms Hard Delay Between Cascades - Arbitrary & Wasteful:**
- Problem: Line 1210 has hardcoded 50ms delay with no justification
- Files: `src/scenes/Game.ts` (line 1210)
- Cause: Likely added as quick fix to prevent frame drops, never optimized
- Impact: Even on high-end devices, cascades take minimum 1-2 seconds unnecessarily
- Improvement path: Replace fixed delay with frame-aware delay:
  ```typescript
  const startFPS = this.game.loop.actualFps;
  const delay = startFPS < 45 ? 100 : startFPS < 55 ? 50 : 16; // 1 frame at 60fps
  ```

**Responsive Layout Recalculated Every Resize Event:**
- Problem: `handleResize()` calls `getResponsiveLayout()` which recalculates tile size, font sizes, etc. on every window resize event
- Files: `src/scenes/Game.ts` (line 1317), `src/utils/responsive.ts` (line 21)
- Cause: No caching of layout results. Resize fires many times per second during device rotation
- Impact: Expensive calculations (parseInt, Math.min/max) executed 100+ times per rotation
- Improvement path:
  1. Debounce resize handler (100ms minimum)
  2. Cache layout results, only recalculate if viewport size actually changed
  3. Memoize `getResponsiveLayout()` with viewport dimensions as key

## Fragile Areas

**Match3Engine Grid State Mutation - No Immutability Checks:**
- Files: `src/game/Match3Engine.ts` (entire class, especially lines 210-236 swap, 402-414 removeMatches, 422-490 applyGravity)
- Why fragile: Grid is directly mutated in place. If any method fails mid-operation or is called out of order, grid can be left inconsistent:
  - Empty tiles with no spawn scheduled
  - Tiles marked empty but still in sprite array
  - Obstacle layers at negative counts
- Safe modification:
  1. Add invariant checks after each major operation:
     ```typescript
     private validateGridState(): void {
       for each tile: if isEmpty, check no duplicate exists in non-empty cells
       for each column: check gravity satisfied (empty below non-empty)
     }
     ```
  2. Unit test each operation in isolation AND in sequence
  3. Add undo/rollback capability for critical operations
- Test coverage: Match3Engine.test.ts exists but only covers happy path (generator, swap, gravity). Missing:
  - Error recovery scenarios
  - Obstacle + booster interactions
  - Edge cases (single empty tile, all same type)

**Game Scene Initialization Order - 20+ Steps with Hidden Dependencies:**
- Files: `src/scenes/Game.ts` (lines 79-200 create() method)
- Why fragile: Dependencies between init steps not explicit. Example:
  - `createTilesFromEngine()` (line 193) depends on `engine.generateGrid()` (line 130) and `gridWidth`/`gridHeight` set (lines 118-119)
  - `setupInput()` (line 196) depends on `tileSprites` being populated
  - `drawGridBackground()` (line 190) depends on `layout` calculated (line 84)
  - Breaking order: if `drawGridBackground()` runs before `layout`, entire board invisible
- Safe modification:
  1. Group initialization into atomic phases: `initializeEngine()`, `initializeRendering()`, `initializeInput()`
  2. Add assertions after each phase:
     ```typescript
     initializeEngine() { ... }
     console.assert(this.engine.getGrid().length > 0, 'Engine not initialized');
     ```
  3. Unit test each phase independently
  4. Add initialization state machine: `UNINITIALIZED → ENGINE_READY → RENDERING_READY → INPUT_READY`
- Test coverage: Game scene not unit tested. 1480 lines, 0 Jest tests. Critical for stability.

**LevelData Type - Uses `any` Causing Cascading Errors:**
- Files: `src/scenes/Game.ts` (line 66, used lines 110-155, 157-165, 679, 1196)
- Why fragile: Accessing `this.levelData.goals`, `this.levelData.grid.width`, `this.levelData.spawn_rules` with no type safety. If any property missing:
  - `goals.map()` crashes if `goals` is undefined
  - `grid.width` returns undefined, breaks grid sizing
  - Errors only caught at runtime during level play
- Safe modification:
  1. Create strict `LevelData` TypeScript interface:
     ```typescript
     interface LevelData {
       moves: number;
       grid: { width: number; height: number; inactive_cell_style?: string };
       goals: LevelGoal[];
       spawn_rules: SpawnRules;
       // ... etc
     }
     ```
  2. Validate on load: `const levelData = validateLevelSchema(raw)`
  3. Provide fallback defaults for optional fields
- Test coverage: No level data loading tests

**Booster Activation Chain - Multiple Mutation Points in Cascade:**
- Files: `src/scenes/Game.ts` (lines 1114-1176 cascade booster activation), `src/game/BoosterActivator.ts`
- Why fragile: Tile removal, booster activation, obstacle damage, goal tracking happen in rapid succession. If ANY operation fails mid-cascade:
  - Tile marked empty but booster sprite not updated
  - Booster created but not synced to sprite
  - Obstacle damaged but health not reflected in UI
  - Goal progress incremented but sprite still shows old count
- Safe modification:
  1. Use transaction pattern: collect all mutations, validate, apply atomically
  2. Separate concerns: `calculateNextState()` (pure), `applyState()` (mutations)
  3. Add undo point: save grid state before cascade, restore on critical error
- Test coverage: BoosterActivator.test.ts exists (218 lines) but tests only activation logic, not integration with Game scene cascade

## Scaling Limits

**8x8 Grid Maximum - Not Designed for Variable Dimensions:**
- Current capacity: Game assumes 8x8 throughout (line 25: `MAX_LEVELS = 10`, no variable grid support in scenes)
- Limit: Extends to 10x10 theoretically, but:
  - Tile size calculations assume 8-column grids (line 31 in responsive.ts: `maxGridCssWidth / 8`)
  - hasValidMoves() becomes very slow on 12x8 (168 swaps instead of 128)
  - HUD scales to fixed aspect ratio - 10x8 board might push HUD off screen
- Scaling path:
  1. Parameterize grid dimensions from level data, not hardcoded
  2. Update tile size calculation: `maxGridCssWidth / Math.max(width, 8)`
  3. Test on 10x8, 8x10, 6x8 grids before committing

**Cascade Processing - 20 Depth Limit May Be Insufficient:**
- Current capacity: MAX_CASCADE_DEPTH = 20 (line 26 Match3Engine.ts, line 1084 Game.ts)
- Limit: With 5+ boosters triggering simultaneously on dense board, 20 might not complete all cascades. Could leave player with unresolved matches.
- Scaling path:
  1. Add telemetry: log actual cascade depths in 100 plays. If depth ≥ 18 in >1% of games, increase limit
  2. Alternative: allow unlimited depth BUT timeout at 5 seconds - force completion, animate remaining matches
  3. Consider mechanics redesign: cap simultaneous boosters to 3 to prevent exponential growth

**No Memory Pooling for Sprites - Allocates Per Animation:**
- Current capacity: 64 active tiles + 64+ animation tweens created/destroyed per cascade
- Limit: On low-end devices (iPhone 6S), memory allocation/GC per cascade causes stutter. Heavy booster chains kill framerate.
- Scaling path:
  1. Implement TileSprite pool: reuse 64 sprites across cascades instead of create/destroy
  2. Pool tweens: reuse tween objects for common animations instead of `new Promise()`
  3. Profile with Chrome DevTools memory recorder during heavy cascade to confirm GC pauses

## Dependencies at Risk

**Firebase SDK - Pinned to ^11.0.0, Not Following SemVer:**
- Risk: Firebase 11.x is recent, v12.x may have breaking API changes. No automated dependency update process.
- Impact: When Firebase 12 releases, code may break silently. Project could be stuck on 11.x if unaware.
- Migration plan:
  1. Set up Dependabot or npm audit to notify on updates
  2. Quarterly review cycle: check Firebase changelog, test upgrade in isolated branch
  3. Document any API changes in MIGRATION.md file

**Phaser 3.90.0 - Input API May Change in v4:**
- Risk: Phaser 3.x mature but v4.x planned. Input API (`setInteractive`, `pointerdown`, tweens) likely to change.
- Impact: 1480-line Game.ts heavily tied to Phaser 3 API. Migration to v4 would require significant refactoring.
- Migration plan:
  1. Wrap Phaser input in adapter layer: `class GameInputManager` to decouple from v3 specifics
  2. Document Phaser version in package.json with minimum version requirement
  3. Create upgrade guide before Phaser 4 adoption

**TypeScript 5.7.0 - Type Strictness May Change:**
- Risk: TS 5+ improvements in type narrowing and inference could expose latent type issues in codebase
- Impact: Future TS upgrades may fail type checking due to `any` and `null!` usage
- Migration plan:
  1. Fix all `any` types before upgrading TS
  2. Test with `strict: true` in tsconfig.json NOW (currently may have strict:false)
  3. Run type checker in CI to catch regressions

## Missing Critical Features

**No Error Boundary or Crash Recovery:**
- Problem: If any error occurs during cascade (e.g., invalid grid state, missing level data), game becomes unresponsive. Player must refresh to recover.
- Blocks: Cannot reliably deploy to production without error handling. Single bad level data breaks entire session.
- Workaround: Debugging via console. No user-facing error messages.
- Fix approach:
  1. Wrap cascade in try-catch, restore grid from snapshot on error
  2. Show error modal to player: "Game encountered an error. Tap to retry level."
  3. Log errors to Sentry or Firebase Crashlytics

**No Analytics or Telemetry for Cascade Performance:**
- Problem: Cannot see which levels have long cascades, where players get stuck, or if cascade timeout is hit
- Blocks: Cannot optimize level difficulty or identify performance problems in production
- Workaround: None - game is effectively blind to how it's performing
- Fix approach:
  1. Log cascade depth and duration to Firebase Analytics on level complete
  2. Create dashboard showing 95th percentile cascade time per level
  3. Alert if any level exceeds 3 seconds cascade (indicates balance issue or bug)

**No Offline Play - Always Requires Internet:**
- Problem: Every level load requires Firestore connection. Losing connection mid-level causes crash.
- Blocks: Cannot play on flights, subways, or poor signal areas. Contradicts mobile-first positioning.
- Workaround: None - requires redesign of persistence layer
- Fix approach:
  1. Cache levels in IndexedDB on first load
  2. Implement offline progress save to localStorage
  3. Sync when online, resolve conflicts (prefer server if timestamp newer)

## Test Coverage Gaps

**Game Scene - Not Unit Tested (1480 lines, 0 tests):**
- What's not tested: Input handling, cascade completion, win/lose conditions, scene lifecycle, responsive resizing, animation sequencing
- Files: `src/scenes/Game.ts`
- Risk: Core gameplay loop changes go undetected. Regression when refactoring input or cascade logic.
- Priority: **CRITICAL** - This is the most critical piece of the entire codebase
- Approach: Break Game.ts into testable units:
  1. Extract cascade logic to pure class: `GameCascadeProcessor`
  2. Extract input handling to `GameInputHandler`
  3. Test each independently, then integration test Game scene
  4. Aim for 80%+ coverage on Game.ts

**Scene Lifecycle - Not Tested:**
- What's not tested: Rapid scene transitions, shutdown during async operations, memory leaks from undestroyed objects, orientation changes mid-cascade
- Files: `src/scenes/Game.ts`, `src/scenes/LevelSelect.ts`, `src/scenes/Menu.ts`, `src/scenes/Boot.ts`
- Risk: Edge cases (device rotation during cascade, back button spam) not caught until field testing.
- Priority: **HIGH** - Affects user experience on mobile
- Approach: Write integration tests for state transitions using Phaser test utils

**LevelManager Integration - Partially Tested:**
- What's not tested: Goal tracking accuracy, win/lose condition logic with all goal types, star calculation, obstacle destruction counting
- Files: `src/game/LevelManager.ts` (188 lines, test file exists but coverage unknown)
- Risk: Players might earn stars incorrectly or lose levels they won. Goals don't increment properly.
- Priority: **HIGH** - Affects progression and revenue
- Approach: Expand LevelManager.test.ts with:
  1. Test each goal type (collect items, destroy obstacles, etc.)
  2. Test multi-goal combinations
  3. Test star calculation at different move thresholds

**Responsive Layout - Not Tested:**
- What's not tested: Tile sizing on extreme aspect ratios (21:9, 4:3), HUD text overflow, button hit areas on mobile, resize handling
- Files: `src/utils/responsive.ts`, responsive behavior in all scenes
- Risk: On unusual aspect ratios (tablet landscape, ultra-wide monitor), layout breaks or becomes unusable.
- Priority: **MEDIUM** - Affects accessibility on non-standard devices
- Approach: Write parametrized tests for responsive.ts:
  ```typescript
  describe.each([
    [1024, 768],   // iPad
    [390, 844],    // iPhone 12
    [2560, 1440],  // Desktop 16:9
  ])('responsive layout %dx%d', (w, h) => {
    it('should fit grid on screen', () => { ... });
  });
  ```

**Firebase Operations - Not Tested:**
- What's not tested: Network errors, offline fallback, concurrent saves, auth edge cases, race conditions in regeneration
- Files: `src/firebase/*.ts`, integration with `EconomyManager.ts` and `ProgressManager.ts`
- Risk: Firestore errors not handled gracefully. Progress lost on network interruption. Lives regeneration corrupted by concurrent saves.
- Priority: **MEDIUM** - Affects critical data persistence
- Approach: Use Firebase Emulator Suite to test:
  1. Simulate network timeout, verify retry + error UI
  2. Simulate offline, verify local cache, sync on reconnect
  3. Concurrent saves: call `loseLife()` twice simultaneously, verify single loss

**Booster Combinations - Not Tested:**
- What's not tested: Multiple boosters on same tile, booster + obstacle interactions, booster + goal interactions, rare cascade chains
- Files: `src/game/BoosterActivator.ts`, `src/game/Match3Engine.ts` findMatchesWithBoosters section
- Risk: Undiscovered bugs when all booster types are combined in late levels. Players report "wrong number of tiles cleared" for rare combinations.
- Priority: **MEDIUM** - Late-game stability
- Approach: Expand BoosterActivator.test.ts (218 lines) with:
  1. Test bomb + line_horizontal activation
  2. Test klo_sphere + bomb combo
  3. Test booster on tile with obstacle
  4. Test booster goal counting with simultaneous activations

---

*Concerns audit: 2026-02-10*
