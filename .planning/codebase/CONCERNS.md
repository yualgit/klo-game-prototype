# Codebase Concerns

**Analysis Date:** 2026-02-05

## Tech Debt

**Incomplete prototype foundation:**
- Issue: Project exists as documentation only—no actual code implementation in `src/` directory. Core match-3 engine, Firebase integration, and level loader all need to be built from scratch.
- Files: `src/` is empty
- Impact: 1–2 week timeline cannot be met without parallel development across multiple components. Risk of cutting corners on architecture early.
- Fix approach: Immediately prioritize core match-3 grid/swap/match logic as Phase 1. Scaffold TypeScript project with Vite, Phaser 3, and Firebase SDKs before feature development. Establish code style guide and component patterns during Week 1 setup.

**Unvalidated game balance:**
- Issue: Level progression (L1–20) is designed but never playtested. Fail rate targets (L1–5: <5%, L11–20: <40%) are aspirational, not measured.
- Files: `GAME_DESIGN.md` (lines 89–209), `data/levels/*.json` (all levels)
- Impact: First playtest may reveal entire progression curve is broken. Churn risk if early levels are too hard or too easy. Remote config flexibility exists but takes time to implement.
- Fix approach: After basic match-3 logic works, immediately playtest L1–5 with at least 3–5 people. Measure actual fail rates. If <20% variance from targets, continue. Otherwise, halt L6+ content and rebalance L1–5 first. Use Firebase Remote Config to adjust `moves`, `spawn_rules`, and `obstacle` positions during testing—do NOT regenerate JSONs.

**Insufficient antifraud specification:**
- Issue: `TECH_SPEC.md` (lines 309–335) defines antifraud patterns but no implementation details. How is `device_id` collected? What APIs check IP? How are suspicious patterns detected in real-time vs. batch?
- Files: `TECH_SPEC.md` (lines 309–335)
- Impact: Fraud vectors (multi-accounting, coupon farming) could become critical before launch. Early users will discover exploits if antifraud is bolted on late.
- Fix approach: Before Cloud Functions are deployed, document exact antifraud logic: (1) Firebase Installation ID for `device_id`, (2) Cloud Functions logs for IP capture, (3) Firestore queries for rate-limiting checks. Implement checks inside `generateCoupon` function first. Test fraud scenarios (rapid account creation, bulk coupon claiming) in Firebase Emulator before live deployment.

**Missing Critical Dependencies Documentation:**
- Issue: Stack uses Phaser 3, TypeScript, Vite, Firebase SDK, but no `package.json` or version specifications. Dependency versions can diverge significantly during development.
- Files: `TECH_SPEC.md` (lines 10–30)
- Impact: Team members will install different versions, breaking reproducibility. Firebase SDK incompatibilities between Frontend and Cloud Functions can cause integration failures.
- Fix approach: Create `package.json` with locked dependencies during setup week. Enforce Node.js version with `.nvmrc` file. Create separate `functions/package.json` for Cloud Functions with explicitly compatible Firebase Admin SDK version.

**Asynchronous/Concurrent Level Requests Not Addressed:**
- Issue: `LevelLoader.ts` design assumes single sequential level loads, but players can spam "retry" or try to load next level while transition animation plays.
- Files: `TECH_SPEC.md` (lines 49–56, implies sequential design)
- Impact: State race conditions, dropped level progress saves, or duplicate coupon generation if loading and reward logic overlap.
- Fix approach: Implement loading state machine: `IDLE → LOADING → LOADED → PLAYING`. Reject level switch requests while not in `IDLE`. Add mutex/lock around Firestore writes in `generateCoupon` Cloud Function.

---

## Known Bugs

**Unspecified coupon expiration edge case:**
- Symptoms: What happens if a coupon is generated at 2026-02-05 23:55 UTC with `expires_days: 7`? Expires 2026-02-12 23:55? Or start of next day? No timezone handling specified.
- Files: `TECH_SPEC.md` (lines 141–147, 189–195), `GAME_DESIGN.md` (lines 245–250)
- Trigger: Any coupon generation near day boundary or in different timezones
- Workaround: Document that `expires_at = created_at + expires_days * 86400 seconds` (UTC). Ensure server generates all timestamps in UTC, never client time.

**Grid index out of bounds risk in obstacle placement:**
- Symptoms: Level JSON allows arbitrary `[x, y]` positions in `obstacles.positions` array with no validation that x < width or y < height. A malformed level (e.g., `[9, 9]` on 8×8 grid) will crash grid initialization or cause undefined behavior.
- Files: `data/levels/level_*.json`, `TECH_SPEC.md` (lines 89–140)
- Trigger: Any level JSON with positions outside grid bounds
- Workaround: Implement strict JSON schema validation in `LevelLoader.ts`: clamp or reject any position `(x, y)` where `x >= grid.width or y >= grid.height`.

**Missing null/undefined handling for optional reward fields:**
- Symptoms: `coupon_chance` and `possible_coupons` in level JSON are optional (lines 118–119 TECH_SPEC). If undefined, reward logic may crash when trying to iterate coupons or calculate probability.
- Files: `TECH_SPEC.md` (lines 110–120)
- Trigger: Any level JSON missing `rewards.coupon_chance` or `rewards.possible_coupons`
- Workaround: Set defaults in code: `coupon_chance ??= 0`, `possible_coupons ??= []` before use.

---

## Security Considerations

**Coupon validation bypass risk:**
- Risk: `redeemCoupon` Cloud Function checks `coupon_id` validity, but frontend can still claim coupons the player shouldn't get (by calling `generateCoupon` multiple times or crafting requests). No server-side validation of whether the player earned the reward.
- Files: `TECH_SPEC.md` (lines 231–259), `GAME_DESIGN.md` (lines 245–250)
- Current mitigation: User must be authenticated to Firebase before calling Cloud Function. Firestore rules (not detailed) likely restrict reads.
- Recommendations:
  1. Add `user_id` parameter to `generateCoupon` function and verify it matches Firebase auth context.
  2. Log coupon generation with level_id and player_id for audit trail.
  3. Implement hard cooldown on `generateCoupon`: query Firestore to ensure no coupon was generated for this user in the last 5 minutes (prevents rapid-fire requests).
  4. Restrict `redeemCoupon` to KLO backend only—do NOT allow frontend to call it directly.

**Exposed user loyalty_id in client-side analytics:**
- Risk: `loyalty_id` is sent to Firebase Analytics as user property (TECH_SPEC line 300). If Analytics data is not private, `loyalty_id` can be correlated with game behavior, leading to targeting or user profiling.
- Files: `TECH_SPEC.md` (lines 296–305)
- Current mitigation: Firebase Analytics has some privacy safeguards, but exact retention/visibility depends on Firebase project settings.
- Recommendations:
  1. Hash or pseudonymize `loyalty_id` before sending to Analytics. Keep raw mapping (user_id → loyalty_id) in Firestore only.
  2. Set Firebase Analytics data retention to 14 days (minimum).
  3. Document that raw loyalty_id should never appear in logs/metrics dashboards.

**No input sanitization on level descriptions/coupon values:**
- Risk: Level JSON allows arbitrary strings in `description`, `goals.description`, `coupon.value`. If these are rendered as HTML without escaping, XSS is possible (e.g., `<img src=x onerror="fetch('/steal-token')">`).
- Files: `data/levels/level_*.json` (all description fields), `TECH_SPEC.md` (lines 89–147)
- Current mitigation: None specified.
- Recommendations:
  1. In frontend UI code, always use text interpolation (not innerHTML) when rendering level descriptions.
  2. Define JSON schema that restricts description/value to alphanumeric + basic punctuation (no `<`, `>`, `&`).
  3. Run levels JSON through JSON schema validator at build time.

**Firebase Firestore rules not provided:**
- Risk: No Firestore security rules specified. Default rules allow/deny reads/writes arbitrarily. Player could potentially:
  - Read other players' coupons
  - Write to other players' progress
  - Query all users' data
- Files: `TECH_SPEC.md` (deployment section mentions `firestore.rules` but no content given)
- Current mitigation: Assumed but not verified.
- Recommendations:
  1. Define strict Firestore rules before deployment:
     - Users can only read/write their own document (`uid` field)
     - Coupons can only be read by owner or redeemer (station backend)
     - Admins have special permissions for analytics reads
  2. Test rules in Firebase Emulator with adversarial reads/writes.

---

## Performance Bottlenecks

**8×8 grid rendering at 60 FPS unoptimized:**
- Problem: Phaser 3 game loop will render every tile, animation, and particle every frame. No mention of object pooling, culling, or batch rendering. Match-3 grids with heavy animations (3+ simultaneous boosters, 20+ particles) can drop frames.
- Files: `TECH_SPEC.md` (lines 44–54 game/ structure implies tile-per-frame rendering)
- Cause: Naive rendering of 64 tiles + animations without optimization.
- Improvement path:
  1. Use Phaser 3's built-in `Container` for tile groups to batch render.
  2. Pool particle emitters: reuse instead of create/destroy.
  3. Profile with browser DevTools during Week 1. If FPS drops below 50 with 5+ boosters, implement viewport culling.

**Firestore queries on every level load:**
- Problem: No caching strategy for levels. Every level load will query Firestore (or Firebase Remote Config) even though level data rarely changes.
- Files: `TECH_SPEC.md` (lines 56–57 RemoteConfig.ts design)
- Cause: Remote Config calls add network latency (~100–500ms) per level start.
- Improvement path:
  1. Cache Remote Config locally in IndexedDB or localStorage after first fetch.
  2. Re-fetch only on app startup or every N hours.
  3. Use Firebase SDK's built-in caching (set cache expiration to 1 hour).

**Coupon generation latency during win screen:**
- Problem: When player wins, game calls `generateCoupon` Cloud Function synchronously before showing win screen. If function is slow (antifraud checks, DB write), win animation is blocked.
- Files: `TECH_SPEC.md` (lines 202–229)
- Cause: Lack of async/background processing in reward flow.
- Improvement path:
  1. Show win screen immediately (optimistic).
  2. Call `generateCoupon` in background with `.then()` callback.
  3. Show "Coupon!" toast after generation completes.
  4. If generation fails, show "Try again" button but don't block gameplay.

---

## Fragile Areas

**Match-3 logic not isolated from Phaser scene:**
- Files: `TECH_SPEC.md` (lines 49–54 suggests Grid, Tile, Match as separate files but game/scene integration unclear)
- Why fragile: Match logic (detecting matches, updating grid) is often tightly coupled to rendering in game engines. If grid logic is buried in `Game.ts` scene, moving to Unity or fixing a bug requires touching the entire scene.
- Safe modification: Extract Grid, Match, Booster, Obstacle into pure TypeScript classes with no Phaser dependencies (use interfaces for events). Create `src/game/engine/` subfolder with unit-testable logic. Scene should only call engine methods and update view.
- Test coverage: No match logic tests mentioned. Implement Jest tests for Grid.swap(), Match.findMatches(), Grid.applyGravity() before shipping.

**Level progression hardcoded in JSON with no versioning:**
- Files: `data/levels/level_*.json`, `GAME_DESIGN.md` (lines 89–209)
- Why fragile: If level balance needs tweaking post-launch, developers must rebuild and redeploy. No A/B testing infrastructure.
- Safe modification: All level data should go into Firebase Remote Config or Firestore `levels` collection on day 1, even if initially populated from JSON. Frontend fetches levels from backend, not shipped JSON.
- Test coverage: No mechanism to test level changes without deploying. Use Firebase Emulator to load test configs.

**Coupon generation logic assumes synchronous database writes:**
- Files: `TECH_SPEC.md` (lines 202–229 generateCoupon function)
- Why fragile: If Firestore write fails (network, quota, auth), function may return success but coupon isn't saved. Or coupon is saved but analytics event fails, causing redemption confusion.
- Safe modification: Wrap entire coupon generation in transaction (`db.runTransaction()`). If any step fails, whole transaction rolls back. Return failure to client with clear error message.
- Test coverage: Test Firebase Emulator with intentional quota exhaustion / network failure scenarios.

**State machine for gameplay not specified:**
- Files: `TECH_SPEC.md` (scenes section lines 44–48)
- Why fragile: Game can be in multiple states: LOADING, PLAYING, PAUSED, WIN, LOSE, TRANSITION. If states don't transition cleanly, players can soft-lock (swaps ignored, touches don't register).
- Safe modification: Define explicit state enum in `src/game/types.ts`. Every input (touch, button) checks current state before processing. Scene transitions only happen from valid states.
- Test coverage: Write integration tests for state transitions (PLAYING → WIN → TRANSITION → next level loads correctly).

---

## Scaling Limits

**Firebase Firestore billing on read-heavy analytics:**
- Current capacity: 50K players → ~500K–1M analytics reads/day
- Limit: Firestore charges per read. Naive "every player loads level = 1+ reads" can exceed budget.
- Scaling path:
  1. Use Remote Config (cheaper) for global level data instead of Firestore queries.
  2. Aggregate analytics server-side (batch write, not real-time per-event).
  3. Set Firestore indexes carefully—avoid cartesian product queries.
  4. Budget ~$100/month for small scale, $1K+/month for 1M daily active users. Validate early.

**Firebase Cloud Functions cold start latency at scale:**
- Current capacity: <100 concurrent users → acceptable latency
- Limit: If 1K+ users try to claim coupons simultaneously (e.g., campaign launch), functions cold-start and requests timeout.
- Scaling path:
  1. Use Firebase Pub/Sub to queue coupon requests instead of direct HTTP calls.
  2. Dedicated functions instance with reserved concurrency (costs more but eliminates cold start).
  3. Move high-volume logic (antifraud rate checks) to Firestore Realtime Database for speed.

**Remote Config fetch bottleneck:**
- Current capacity: 1 fetch per session (acceptable)
- Limit: If level data grows to 100+ levels, JSON becomes large. Fetch + parse at session start adds 500ms+ latency.
- Scaling path:
  1. Cache aggressively (localStorage, IndexedDB).
  2. Paginate Remote Config: fetch only levels 1–20 on start, lazy-load next 20.
  3. Consider custom backend (not Firebase) for level data retrieval as scale increases.

---

## Dependencies at Risk

**Phaser 3 version volatility:**
- Risk: Phaser 3 is mature (v3.55+) but has non-breaking API changes. Plugins and examples may be outdated.
- Impact: If Phaser 3 is used but significant bugs are found (e.g., memory leak in animation system), switching to pixi.js mid-project is expensive.
- Migration plan: Before committing to Phaser 3, spike a working 8×8 grid swap/match in 4 hours. If it's smooth, proceed. If animations are janky, fallback to pixi.js + custom match-3 engine.

**Firebase SDK breaking changes:**
- Risk: Firebase SDK v9+ has major API redesign (modular). old v8 code incompatible. Future v10 may break again.
- Impact: Keeping up with SDK updates is maintenance burden. Functions SDK version must match frontend SDK version.
- Migration plan: Pin Firebase versions explicitly in `package.json`. Set up Dependabot to notify on updates. Plan quarterly SDK upgrade sprints, not ad-hoc.

**TypeScript <5.0 compatibility:**
- Risk: TypeScript 5.0+ has better type narrowing. If locked to TS 4.x, advanced patterns may not work. Conversely, TS 5+ might have breaking changes.
- Impact: Type errors in beta features or library incompatibility.
- Migration plan: Use TS 5.0+ from start. Test with experimental flags during Week 1. Document minimum TS version in README.

---

## Missing Critical Features

**No offline support (critical for KLO brand):**
- Problem: PWA is marketed but game requires Firestore connectivity for every level load. No offline level caching or offline progress save.
- Blocks: Users in low-signal areas (highway, tunnels) can't play. Network latency ruins gameplay feel.
- Recommendation: Implement IndexedDB cache for levels + offline progress. Sync when online. Show offline badge to user.

**No in-game monetization path:**
- Problem: Game design mentions "booster_prices" in Remote Config (TECH_SPEC line 395) but no IAP (in-app purchase) logic, no payment UI, no backend validation.
- Blocks: Future monetization (if needed) requires significant rework.
- Recommendation: Scaffold IAP skeleton (button, payment flow) during MVP phase even if disabled. Use Stripe or Firebase billing for safety.

**No analytics dashboard specified:**
- Problem: Extensive analytics events are logged (15+ event types) but no dashboard to view them. Product team can't monitor KPIs in real-time.
- Blocks: First live week, no one knows if fail rate is actually <40% or who's churning.
- Recommendation: Set up Firebase Analytics dashboard with key metrics (L1–5 fail rate, D1 retention, coupon redemption rate) before launch. Brief product team on how to access.

**No A/B testing framework:**
- Problem: GAME_DESIGN (line 238) mentions "Variant A: coupon kHz every 5 levels, Variant B: every 10" but no framework to actually run A/B test.
- Blocks: Can't measure impact of reward frequency on retention/redemption.
- Recommendation: Use Firebase Remote Config variants feature. Define test on day 1 with success metrics. Run for 1 week post-launch.

---

## Test Coverage Gaps

**No unit tests for match-3 core logic:**
- What's not tested: Grid.swap(), Match.findMatches(), Grid.applyGravity(), Obstacle.onMatch() behavior
- Files: `src/game/Grid.ts`, `src/game/Match.ts`, `src/game/Obstacle.ts` (not yet written)
- Risk: Core gameplay bugs can persist into live. Regression when adding new obstacle types.
- Priority: **HIGH** — Match logic is the heart of the game.
- Fix: Write Jest tests for Grid class:
  ```typescript
  describe('Grid', () => {
    it('should swap adjacent tiles', () => {
      const grid = new Grid(8, 8);
      grid.swap(0, 0, 1, 0); // swap [0,0] with [1,0]
      expect(grid.getTile(0, 0).type).toBe(grid.getTile(1, 0).type); // should be same after
    });
    it('should find 3-in-a-row matches', () => {
      // place 3 red tiles in a row
      // expect findMatches() to return that row
    });
  });
  ```

**No integration tests for win/lose flow:**
- What's not tested: Winning level → reward screen → coupon generation success/failure → next level loads
- Files: `src/scenes/Game.ts` (not yet written), `src/firebase/functions.ts`
- Risk: Reward screen bugs, coupon generation failures don't surface until live playtest.
- Priority: **HIGH** — Players notice immediately if rewards are broken.
- Fix: Write Cypress or Jest integration tests:
  ```typescript
  it('should show coupon on level win', async () => {
    // load level, win immediately, assert reward screen shows coupon
    // assert Firestore document is created
  });
  ```

**No Firebase Cloud Function tests:**
- What's not tested: `generateCoupon` antifraud logic, budget checking, `redeemCoupon` validation
- Files: `functions/src/coupons.ts` (not yet written)
- Risk: Antifraud can be trivially bypassed, coupons can be generated infinitely, budget overruns unchecked.
- Priority: **CRITICAL** — Revenue/fraud risk.
- Fix: Use Firebase Emulator Suite. Write tests:
  ```typescript
  it('should reject coupon generation if daily limit exceeded', async () => {
    await generateCoupon({ user_id, level_id }); // first
    await generateCoupon({ user_id, level_id }); // second
    const result = await generateCoupon({ user_id, level_id }); // third
    expect(result.error).toContain('limit exceeded');
  });
  ```

**No playtesting of difficulty curve:**
- What's not tested: Do actual players fail L1–5 <5% of the time? Does L20 feel like a boss?
- Files: `GAME_DESIGN.md` (lines 89–209 are predictions, not measurements)
- Risk: Entire progression could be broken. Churn if too hard early, boredom if too easy.
- Priority: **CRITICAL** — KPI depends on this.
- Fix: After L1–20 game code complete (Week 2), recruit 5–10 external testers. Collect metrics (moves used, time, fail reason). Compare to design targets. Rebalance before public launch.

---

*Concerns audit: 2026-02-05*
