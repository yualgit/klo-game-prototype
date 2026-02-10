# Project Research Summary

**Project:** KLO Match-3 Demo — Milestone 2 (Kyiv Journey)
**Domain:** Match-3 Mobile Game Enhancement
**Researched:** 2026-02-10
**Confidence:** HIGH

## Executive Summary

This milestone adds player progression systems (lives regeneration, bonus economy, settings persistence), advanced level design features (variable board shapes, progressive obstacles, pre-placed tiles), and enhanced presentation (scrollable Kyiv map, canvas DPI scaling) to the existing match-3 game. Research confirms all features can be implemented using the current stack with **zero new dependencies**. Phaser 3.90, Firebase 11.0, and native Web APIs handle every requirement through additive architecture changes.

The recommended approach follows an additive manager pattern: create new `EconomyManager` and `SettingsManager` singletons parallel to the existing `ProgressManager`, extend level JSON schemas for advanced mechanics, and refactor `LevelSelectScene` for camera-based scrolling. Core game engine classes (Match3Engine, GravityEngine) remain untouched — changes are purely in presentation and persistence layers.

Key risks center on timer-based state management (lives regeneration can desync between devices if not using Firestore server timestamps), variable board coordinate mapping (non-rectangular grids break assumptions in existing rendering code), and canvas DPI performance on budget Android devices (3-4x resolution multiplier can collapse framerate). Mitigation strategies include server-authoritative timestamps for lives, explicit cell mapping in level JSON, and capping devicePixelRatio at 2x.

## Key Findings

### Recommended Stack

No changes to existing stack. All new features leverage current dependencies:

**Core technologies:**
- **Phaser 3.90**: Handles variable grid rendering, camera scrolling with parallax (setScrollFactor), canvas DPI via resolution config, scene registry for global state
- **Firebase 11.0**: Extends UserProgress interface for lives/bonuses, Firestore server timestamps prevent state desync, TTL policies available for cleanup
- **TypeScript 5.7**: Strong typing for new data structures (lives state, settings schema, level metadata)
- **localStorage (Web API)**: Settings persistence (0ms latency vs 50-200ms Firestore, no cross-device sync needed for UI preferences)
- **performance.now (Web API)**: High-precision monotonic timer for lives regeneration via Phaser time.now wrapper

**Explicitly rejected dependencies:**
- RxJS (350KB for timer features already in Phaser)
- Redux/Zustand (Phaser registry provides global state)
- Moment.js/Day.js (native Date + Timestamp sufficient for duration math)
- i18next (70KB overkill for 2 languages, 50-100 strings)

### Expected Features

**Must have (table stakes):**
- **Lives System (5 max)** — Industry standard across all match-3 (Candy Crush, Royal Match). Players expect lives cap, regeneration timer, and HUD display.
- **Lives regeneration timer** — Automatic recovery (30 min/life) prevents permanent lockout. Must persist across app close/reopen.
- **Settings menu access** — Gear icon modal with close button. Universal mobile game expectation.
- **Audio volume controls** — Separate music/SFX toggles. Players need individual control for social situations.
- **Board shape visualization** — Non-rectangular boards need clear playable vs empty cell distinction.
- **Mobile responsive layout** — Must work across phones/tablets/desktops without breaking.
- **High DPI display support** — Retina/high-density screens require explicit canvas resolution configuration.

**Should have (competitive differentiation):**
- **Scrollable Kyiv map level select** — Thematic storytelling through journey vs static grid. Stronger cultural identity.
- **3-state progressive obstacles** — Ice/grass with 3 layers (ice1→ice2→ice3) adds strategic depth vs single-hit obstacles.
- **Pre-placed tile configurations** — Hand-crafted puzzle feel vs pure RNG. Enables tutorial levels with guaranteed matches.
- **Buy lives with bonuses (not IAP)** — F2P-friendly alternative to ads/purchases. Rewards skilled play.

**Defer (v2+):**
- **Progressive timer** (30→45→60→90→120 min intervals) — LOW confidence, not found in major titles. Could confuse vs help.
- **Variable board width per row** — Medium complexity, defer until 20+ levels justify hand-crafted shapes.
- **Animation speed toggle** — Accessibility value, but lower priority than core features.
- **Social lives gifting** — Requires Facebook SDK integration, privacy complexity beyond anonymous Firebase.

### Architecture Approach

All additions are additive extensions following the existing manager pattern. Core game engine (Match3Engine, GravityEngine, MatchEngine) remains unchanged — implementations sit in presentation layer (scenes) and new managers.

**Major components:**
1. **EconomyManager** (NEW singleton) — Lives timer with progressive regeneration, coin tracking, bonus inventory. Uses localStorage + Phaser.Time.TimerEvent, calculates regeneration on app start based on elapsed time since lastLifeLostTime.
2. **SettingsManager** (NEW singleton) — localStorage-backed key-value store with reactive listeners. AudioManager subscribes to soundEnabled/musicEnabled changes.
3. **Extended LevelData JSON** — Adds cells: number[][] for variable board shapes, layers: 1-3 for progressive obstacles, initial_tiles: [] for pre-placed boosters/matches.
4. **Camera-scrollable LevelSelectScene** — Replaces static checkpoint grid with vertical scrolling map. Parallax TileSprite backgrounds (3-4 layers with setScrollFactor 0.2-0.8), camera drag controls, auto-scroll to current level.
5. **DPI-aware Phaser config** — resolution: window.devicePixelRatio (capped at 2 for performance), scale.mode: RESIZE for responsive layout.

**Integration points:**
- Lives check gates level entry in LevelSelectScene via economy.canPlay()
- Coin rewards awarded in ProgressManager.completeLevel() callback
- Settings changes propagate to AudioManager via subscribe pattern
- Variable boards pass cellMap to Match3Engine.generateGrid()
- Progressive obstacles already supported (layers field exists), only visual sprite mapping needed

### Critical Pitfalls

1. **Timer-based lives regeneration state corruption** — Firestore eventual consistency + offline cache means livesLastUpdated timestamp can be stale on multi-device or background resume. Progressive intervals (30→45→60 min) compound error. **Prevention:** Store livesDepletedAt + livesCount, calculate regeneration using serverTimestamp(), cap at 5 lives max in calculation not just UI.

2. **Variable board coordinate mapping breaks** — Existing grid assumes rectangular 8x8. Variable row widths (row 0 = 4 cells, row 1 = 8 cells) break col * CELL_SIZE pixel mapping, match detection at edges, gravity column tracking. **Prevention:** Add cellMap: boolean[][] to level JSON, center each row independently with offsetX = (maxCols - rowCols) * CELL_SIZE / 2, engines must check cellMap before accessing.

3. **Canvas DPI scaling performance collapse** — Setting resolution: window.devicePixelRatio on high-DPI Android (DPR 3-4) creates 3-4x larger canvas. Budget phones can't handle 1440x3200 resolution with 60fps match-3 animations. **Prevention:** Cap DPR at Math.min(devicePixelRatio, 2), use Scale.FIT not RESIZE, profile on real Android before commit.

4. **Phaser scene shutdown race conditions** — v1.0 already hit tween callbacks firing after scene destroy. Adding settings/shop/lives overlays multiplies risk. Tweens, timers, event listeners outlive scene.shutdown(). **Prevention:** Register all timers in array, destroy in shutdown(), never use scene.start() from tween callbacks (use time.delayedCall()), test every transition path.

5. **Progressive obstacle animation state desync** — 3-state ice (level 1→2→3) needs sprite swap on each hit. If crack animation playing when next hit arrives, visual state desyncs from logical hitPoints. **Prevention:** hitPoints is source of truth, sprite follows immediately, play crack animation as overlay not blocking replacement.

## Implications for Roadmap

Based on research, suggested phase structure follows dependency order and risk mitigation:

### Phase 1: Economy Foundation
**Rationale:** Lives system gates level entry — must come first before any level design changes. Establishes persistence patterns (localStorage for economy, Firestore for progress) that later phases build on.

**Delivers:**
- EconomyManager singleton with lives, coins, bonuses tracking
- Lives timer with progressive regeneration (30 min/life)
- Lives HUD display in MenuScene with countdown
- Level entry gate in LevelSelectScene (check lives before start)
- Coin reward system in ProgressManager.completeLevel() callback

**Addresses:**
- Lives System (table stakes from FEATURES.md)
- Lives regeneration timer (table stakes)
- Bonus economy data structures (preparation for Phase 2)

**Avoids:**
- Pitfall #1: Use Firestore serverTimestamp(), calculate regeneration on read
- Pitfall #4: Proper timer cleanup in scene shutdown

### Phase 2: Settings & Polish
**Rationale:** Independent of game mechanics — can run parallel to economy work or immediately after. Settings persistence pattern (localStorage) validates approach before using for other features.

**Delivers:**
- SettingsManager singleton with localStorage persistence
- SettingsOverlay scene (modal with sound/music toggles)
- AudioManager integration (subscribe to settings changes)
- Settings button in MenuScene

**Addresses:**
- Settings menu access (table stakes from FEATURES.md)
- Audio volume controls (table stakes)
- Audio mute toggle (table stakes)

**Avoids:**
- Pitfall #4: Scene transition testing (settings overlay → game)

### Phase 3: Advanced Level Mechanics
**Rationale:** Builds on existing Match3Engine without refactoring core logic. Variable boards + progressive obstacles enable richer level design for Phase 4's Kyiv map. Pre-placed tiles support tutorial levels.

**Delivers:**
- Extended LevelData interface (cells map, initial_tiles, obstacle layers)
- Match3Engine.generateGrid() accepts cellMap parameter
- TileSprite obstacle rendering maps layers to sprite variants (ice01/02/03)
- Match3Engine.applyInitialTiles() for pre-placed boosters/matches
- 3-5 new level JSONs with variable shapes and progressive obstacles

**Addresses:**
- Board shape visualization (table stakes)
- 3-state progressive obstacles (differentiator)
- Pre-placed tile configurations (differentiator)
- Variable board shapes (enables richer design)

**Avoids:**
- Pitfall #2: Explicit cellMap with per-row centering, engines check cellMap before access
- Pitfall #5: Obstacle hitPoints is source of truth, sprite follows
- Pitfall #8: Apply initial_tiles first, skip in random fill

### Phase 4: Kyiv Map Level Select
**Rationale:** Depends on Phase 3's advanced level mechanics to populate map with interesting levels. Major scene refactor — isolate from other changes to simplify debugging. High complexity justifies dedicated phase.

**Delivers:**
- Camera-scrollable LevelSelectScene (vertical world bounds)
- Parallax background layers (sky, buildings, landmarks at different scrollFactors)
- Drag scroll controls with tap vs drag distance threshold
- Level checkpoint nodes positioned along winding path
- Auto-scroll to current level on scene entry
- Kyiv landmark assets (placeholder → final artwork)

**Addresses:**
- Scrollable Kyiv map level select (differentiator)
- Thematic storytelling through journey progression

**Avoids:**
- Pitfall #6: Drag distance threshold (< 10px = tap, >= 10px = scroll)
- Pitfall #4: Camera scroll input priority, disable game input behind overlay

### Phase 5: Mobile & DPI Polish
**Rationale:** Touches all scenes — do last to avoid merge conflicts with earlier phases. DPI changes affect rendering across entire game. Mobile responsiveness validates all previous work on actual devices.

**Delivers:**
- Phaser config: resolution capped at 2x, scale.mode RESIZE
- All scenes use cameras.main.width/height for dynamic positioning
- Touch input threshold scaled to cell size (cellSize * 0.3)
- Resize handlers for complex layouts
- Testing on real mobile devices (Android/iOS)

**Addresses:**
- Mobile responsive layout (table stakes)
- High DPI display support (table stakes)
- Touch input optimization for small screens

**Avoids:**
- Pitfall #3: Cap DPR at 2, use Scale.FIT, profile on real Android
- Pitfall #9: Scale swipe threshold relative to cell size

### Phase Ordering Rationale

- **Phase 1 first:** Lives system gates level entry — foundational for all gameplay. Establishes localStorage + Firestore persistence patterns.
- **Phase 2 parallel/second:** Settings independent of mechanics — can validate localStorage approach early without blocking level work.
- **Phase 3 before Phase 4:** Variable boards + progressive obstacles provide content for Kyiv map. Pre-placed tiles enable tutorial levels along journey.
- **Phase 4 isolated:** Major LevelSelectScene refactor — avoid conflicts with other scene changes. High complexity (camera, parallax, scroll) justifies focus.
- **Phase 5 last:** DPI + responsiveness touch all scenes — do after feature work complete to avoid rework. Mobile testing validates entire stack.

### Research Flags

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Economy):** Lives timer pattern well-documented in Phaser 3 + Firestore best practices. Implementation clear from research.
- **Phase 2 (Settings):** localStorage + reactive manager pattern standard in web games. No unknowns.
- **Phase 3 (Levels):** LevelData JSON extension follows existing obstacle pattern. Match3Engine changes minimal (parameter addition).
- **Phase 5 (Mobile/DPI):** Phaser Scale.RESIZE + resolution config well-documented. Device testing validates, no research phase needed.

**Phases likely needing deeper research during planning:**
- **Phase 4 (Kyiv Map):** Custom scroll container, parallax layers, path-based progression. While Phaser camera API researched, specific layout (winding path, landmark positioning, scroll-to-level animation) may need design iteration. Consider lightweight phase-planning to nail down UX flows before implementation.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All features validated against current dependencies. No npm installs needed. |
| Features | HIGH | Lives system, settings, obstacles confirmed as table stakes via Candy Crush docs + GameAnalytics metrics. Kyiv map as differentiator based on mobile game best practices. |
| Architecture | HIGH | Additive manager pattern preserves existing code. Match3Engine changes minimal (parameter additions). LevelSelectScene refactor self-contained. |
| Pitfalls | HIGH | 5 critical pitfalls identified with concrete prevention strategies. Based on v1.0 learnings (scene shutdown races) + Phaser/Firestore documented issues. |

**Overall confidence: HIGH**

### Gaps to Address

**Progressive timer intervals (30→45→60→90→120 min):**
- Research found NO major match-3 games using progressive intervals — all use flat 30 min regeneration.
- Recommendation: Start with flat 30 min in Phase 1. If user feedback requests faster recovery after long waits, add progressive intervals in v1.2 as experiment.
- **How to handle:** Implement flat timer in Phase 1, mark progressive intervals as "needs user validation" in backlog.

**Kyiv map asset sourcing:**
- Research validates parallax scrolling pattern, but no specific Kyiv landmark asset libraries found.
- Recommendation: Use placeholder gradient layers + basic shapes in Phase 4 implementation. Commission or source final Kyiv artwork as separate asset task after UX validated.
- **How to handle:** Phase 4 plan includes "placeholder → final art" workflow. Assets unblock implementation.

**Variable board performance on low-end devices:**
- cellMap validation on every match check + gravity step adds conditional overhead vs fixed 8x8.
- Research validates pattern works, but no benchmark data for Phaser 3 specifically.
- **How to handle:** Profile in Phase 3 on real Android device. If < 60fps, optimize with cellMap caching or precomputed neighbor arrays.

**Pre-placed tiles balance:**
- No research on optimal density of pre-placed tiles (what % of board should be pre-configured vs random?).
- Too many = feels scripted, too few = random RNG board, no puzzle feel.
- **How to handle:** Start conservative (2-5 pre-placed tiles per level in Phase 3). Playtest feedback guides density for new levels.

## Sources

### Primary (HIGH confidence)

**Phaser 3 Official Docs:**
- Camera API, setScrollFactor, TileSprite parallax — validated pattern for scrolling map
- Scene registry, resolution config, Scale.RESIZE — core framework features
- time.now (performance.now wrapper) — battle-tested timer API

**Firebase Official Docs:**
- Firestore serverTimestamp() — server-authoritative time for lives regeneration
- TTL policies — optional cleanup for expired bonus timers
- Offline cache behavior — explains stale read risk

**Candy Crush Official Support:**
- Lives system mechanics: 5 lives max, 30 min flat regeneration, 150 min full refill
- Confirms lives as table stakes feature

**Web APIs (MDN):**
- performance.now() — monotonic clock, microsecond precision
- localStorage — 10 MiB quota, synchronous access, private browsing fallback

### Secondary (MEDIUM confidence)

**GameAnalytics Match-3 Metrics Guide:**
- Lives system metrics, player retention impact
- Validates lives as core engagement loop

**Playrix Help Centers (Fishdom, Homescapes):**
- 3-state obstacles (ice1/2/3, granite1/2/3) confirmed as standard mechanic
- Progressive obstacle strategy patterns

**Phaser Community:**
- Ourcade blog: Parallax scrolling tutorial
- Phaser Discourse: Parallax + drag pattern validation
- GitHub issues: DPI scaling performance discussions

### Tertiary (LOW confidence)

**Unity/Flutter tutorials:**
- Scrollable level map patterns adapted from non-Phaser frameworks
- Validates concept but requires Phaser-specific implementation

**GameDeveloper articles:**
- Match-3 level design principles, pre-placed tile balance
- General guidance, not Phaser-specific

---

**Research completed:** 2026-02-10
**Ready for roadmap:** Yes
**Recommended next step:** Create 5-phase roadmap based on implications section. All phases ready for planning except Phase 4 which may benefit from UX iteration on Kyiv map layout.
