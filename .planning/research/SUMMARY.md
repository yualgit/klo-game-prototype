# Project Research Summary

**Project:** KLO Match-3 v1.2 "Polish & Collections"
**Domain:** Mobile Match-3 with Collection Card Meta-Progression
**Researched:** 2026-02-10
**Confidence:** HIGH

## Executive Summary

The v1.2 milestone integrates three major upgrades into an existing Phaser 3.90 match-3 game: collection cards meta-progression (gacha-style reward system with 3 collections of 6 cards each), persistent UI navigation (bottom nav + global header), and art quality improvements (1024px retina assets, 6 new tile types). Research confirms this is achievable with minimal new dependencies and well-documented patterns.

The recommended approach follows proven Phaser architecture: a dedicated persistent UI scene running parallel to game scenes, a CollectionManager singleton following the existing registry pattern (ProgressManager/EconomyManager), and phaser3-rex-plugins for complex UI layouts. Two new libraries required: random-seed-weighted-chooser for gacha probability (mature, TypeScript support) and rexUI for bottom navigation components (official Phaser recommendation). Art pipeline uses existing 1024px PNGs with optional sprite sheet generation via Free Texture Packer.

Critical risks center on scene lifecycle coordination (persistent UI + game scenes), memory management for high-resolution assets on mobile devices (iOS Safari 300-500MB cap), and economy transaction safety for collection card pulls (prevent duplicate currency deduction). All have documented mitigation strategies: explicit registry key constants, multi-atlas loading strategy with device detection, and transaction-based economy updates with idempotency keys.

## Key Findings

### Recommended Stack

Existing Phaser 3.90 stack (TypeScript, Vite, Firebase) requires no changes. Add two specialized libraries for new features.

**Core technologies (no changes):**
- **Phaser 3.90.0:** Game engine — DPR-aware rendering already validated
- **TypeScript 5.7.0:** Type safety — existing setup continues
- **Firebase 11.0.0:** Backend — progress/economy persistence proven
- **Vite 6.0.0:** Build tool — fast HMR for dev workflow

**New dependencies:**
- **random-seed-weighted-chooser 1.1.1:** Gacha probability engine — handles weighted random selection with custom seed, zero dependencies, TypeScript support
- **phaser3-rex-plugins 1.80.18:** UI components — production-ready Buttons, Sizer, Label components for bottom nav and complex layouts

**Why these libraries:** Gacha probability is error-prone (pity system math, floating-point precision). Existing library handles edge cases better than custom implementation. RexUI provides battle-tested layout containers that integrate seamlessly with Phaser scene system, avoiding HTML overlay complexity and DPR scaling issues.

**Art pipeline:** Free Texture Packer (web-based, no install) for sprite sheet generation. Current 1024px PNG assets already retina-ready. Collection cards (18 PNGs) bundled into atlas to reduce HTTP requests from 18 to 1.

### Expected Features

Collection cards, persistent navigation, and art upgrades follow established mobile game conventions with KLO-specific theming.

**Must have (table stakes):**
- **Collection progress visualization (X/6 complete)** — players expect clear completion tracking
- **Rarity color coding (grey/blue/purple/gold)** — universal standard across card games
- **Card reveal animation (flip metaphor)** — expected gacha mechanic
- **Bottom navigation (3 tabs: Levels/Collections/Shop)** — mobile UX convention for thumb-zone ergonomics
- **Persistent HUD (lives/bonuses/settings)** — must be visible across non-game screens
- **Responsive layout (all mobile viewports)** — iPhone SE through tablets, no cropping
- **Retina-quality tiles (1024px source)** — high-DPI screens show blur on low-res assets
- **Inactive cell visual** — variable board shapes need clear distinction

**Should have (differentiators):**
- **Pity mechanic (3 dupe streak → guaranteed new)** — anti-frustration, prevents infinite dupes
- **Pick 1 of 2 closed cards** — agency in randomness vs pure RNG
- **Thematic collections (coffee/food/cars)** — KLO brand integration with real rewards
- **Collection exchange animation (cards → coupon)** — premium feel
- **6 new tile types (burger, hotdog, oil, water, snack, soda)** — visual variety
- **Booster sprites** — replace procedural indicators with real art
- **Bottom nav notification dot** — "collection ready" indicator drives engagement

**Defer (v2+):**
- **Card trading between players** — requires social graph beyond current auth
- **Animation skip/fast-forward** — improve in future based on feedback
- **Virtualized scrolling for collections** — only needed if >100 cards

### Architecture Approach

Integration requires three new components and modifications to existing scene lifecycle. Uses proven Phaser patterns: persistent UI scene for navigation, singleton managers in registry, lazy asset loading.

**Major components:**

1. **CollectionManager singleton** — Card inventory, drop probability, pity tracking, Firestore persistence. Follows existing ProgressManager/EconomyManager pattern. Stores nested map in users/{uid} Firestore doc (sufficient for <100 cards). Uses random-seed-weighted-chooser for weighted rarity selection.

2. **UI Scene (persistent overlay)** — Dedicated scene running parallel to game scenes, manages bottom nav and global header. Uses rexUI Sizer/Buttons for responsive layout. Shows/hides based on active scene (bottom nav hidden in Game scene, both hidden in Boot/Menu). Renders at depth 1000 above game content. Handles visibility coordination via game.events 'scenechange'.

3. **Collection Scene** — New scene for viewing 3 collections (6 cards each). Lazy-loads card images on demand (not in Boot). Implements progressive loading as user scrolls. Shows rarity-based color coding, owned/locked states, completion progress.

**Integration pattern:** Boot scene initializes CollectionManager in registry, launches UI scene in parallel with game scenes. Game scene win overlay calls CollectionManager.rollForCard() after star calculation. UI scene listens to registry changes for reactive updates (lives/bonuses display). Scene sleep/wake used for input blocking during modals.

**Modifications to existing code:** Add CollectionManager init in main.ts. Modify Game scene win overlay to roll for card drops. Optionally remove duplicate HUD from LevelSelect (delegated to UI scene global header). Add card metadata JSON load in Boot. All other scenes unchanged.

### Critical Pitfalls

Top 5 mistakes that cause rewrites or major issues, with prevention strategies.

1. **Scene Registry String Key Inconsistencies** — Using inconsistent key naming (camelCase vs kebab-case) creates duplicate states without noticing. EconomyManager state desyncs across scenes. **Prevention:** Define registry keys as TypeScript constants in shared file, use type-safe wrapper, validate keys exist during Boot.

2. **Scene Transition Event Listener Memory Leaks** — Persistent UI scenes use sleep/wake instead of stop/start. Listeners from previous wake cycles never removed. Each wake adds duplicate listeners. Collection unlock triggers multiple times, economy deduction happens 2x-4x. **Prevention:** Use named event handler references (not inline functions), clean up in sleep handler, implement manager unsubscribe methods, use once() for one-time handlers.

3. **High-Resolution Asset Memory Explosion on Mobile** — Upgrading to 1024px tiles increases texture memory by 4x. With 30+ types, exceeds iOS Safari 300-500MB cap. Game crashes on level load. **Prevention:** Multi-atlas strategy (split by feature/scene), compress with WebP, detect device capability and load @2x vs @1x, destroy unused atlases after scene transition, cap canvas resolution at 2x DPR.

4. **Responsive Layout Retrofit - Scale Mode Conflicts** — Existing game uses Phaser.Scale.FIT. Adding responsive requires RESIZE mode to handle orientations, but RESIZE breaks fullscreen, FIT doesn't trigger resize events. Bottom nav appears off-screen on certain aspect ratios. **Prevention:** Use RESIZE mode with manual letterboxing, implement ResponsiveLayout utility with getSafeArea(), add resize handler to EVERY scene, test on device matrix (iPhone SE, iPhone 14 Pro, iPad, Android tablet).

5. **Persistent UI Input Blocking with Graphics Objects** — Bottom nav and global header use Graphics for backgrounds. Graphics fills don't block input by default. Clicks pass through to game board underneath. **Prevention:** Make Graphics interactive with explicit hit area (setInteractive with Phaser.Geom.Rectangle), layer persistent UI scenes above game scenes (bringToTop), use scene sleep to disable input on background scenes, create reusable ModalScene base class.

## Implications for Roadmap

Based on architecture dependencies and risk mitigation, suggest 6-phase structure with foundation before features.

### Phase 1: Art & Asset Quality Upgrade
**Rationale:** Foundation work with zero scene changes. Validates memory management before adding complex features. Can be tested in isolation. No dependencies on other phases.

**Delivers:** 1024px retina tiles (crisp on DPR=2), 6 new tile types (burger, hotdog, oil, water, snack, soda), remove light tile cleanup, booster sprites (replace procedural indicators), inactive cell visual for variable boards. Free Texture Packer workflow established for future atlases.

**Addresses:** Retina-quality tiles, new tile types, booster sprites (table stakes + differentiators from FEATURES.md).

**Avoids:** High-resolution asset memory explosion (Pitfall 3) — implement multi-atlas strategy, device detection for @2x vs @1x loading, texture memory monitoring before adding more assets.

**Research needs:** SKIP — PNG replacement is well-documented, tile type extension follows existing pattern.

### Phase 2: Responsive Layout Foundation
**Rationale:** Establishes layout foundation before adding persistent UI. Scale mode changes affect all scenes. Must be tested across device matrix before building navigation on top.

**Delivers:** Phaser.Scale.RESIZE mode with manual letterboxing, ResponsiveLayout utility (getSafeArea, anchorBottom helpers), resize handlers in LevelSelect and Game scenes, tested on iPhone SE (375x667), iPhone 14 Pro (393x852 with notch), iPad (768x1024), Android tablet landscape (1280x800).

**Uses:** Existing Phaser scale system (STACK.md) — no new dependencies.

**Implements:** Responsive layout patterns (ARCHITECTURE.md) — layout utility with design constants.

**Avoids:** Scale mode conflicts (Pitfall 4) — choose RESIZE + manual letterboxing upfront, test on full device matrix before proceeding.

**Research needs:** SKIP — Phaser RESIZE mode well-documented, ResponsiveLayout pattern is standard.

### Phase 3: Persistent UI Navigation Shell
**Rationale:** After responsive foundation, build navigation layer. Persistent UI scene pattern must be validated before adding collection features that depend on it.

**Delivers:** UI Scene running parallel to game scenes (depth: 1000), bottom navigation bar with rexUI Buttons (3 tabs: Levels/Collections/Shop), global header with lives/bonuses/settings (reactive updates from EconomyManager), visibility coordination (bottom nav hidden in Game, both hidden in Boot/Menu), registry key constants for type safety.

**Uses:** phaser3-rex-plugins 1.80.18 (STACK.md) — Sizer, Buttons, Label components for layout.

**Implements:** Persistent UI Scene pattern (ARCHITECTURE.md) — dedicated scene for navigation elements.

**Avoids:** Registry key inconsistencies (Pitfall 1), event listener leaks (Pitfall 2), input blocking issues (Pitfall 5) — define REGISTRY_KEYS constants, implement cleanup in sleep handler, make Graphics interactive with explicit hit areas.

**Research needs:** MEDIUM — rexUI has comprehensive but scattered docs. Budget 4-6 hours for experimentation. Prototype bottom nav in isolated scene before integrating with main game.

### Phase 4: Collection Data Model & Viewing
**Rationale:** Backend and UI for collections, without economy integration yet. Tests CollectionManager pattern and lazy loading before adding complex card drop/exchange flows.

**Delivers:** CollectionManager singleton in registry (card inventory, metadata queries, Firestore persistence), card metadata JSON (3 collections × 6 cards = 18 cards), Collection Scene (scrollable card grid, rarity color coding, owned/locked states, progress X/6), card detail modal, lazy loading for card images (progressive as user scrolls).

**Uses:** Existing Firebase/Firestore for persistence (STACK.md), nested map schema in users/{uid}.

**Implements:** CollectionManager singleton (ARCHITECTURE.md), lazy asset loading pattern.

**Avoids:** Parallel scene lifecycle race conditions (Pitfall 7) — validate registry dependencies in create(), use events for late-binding.

**Research needs:** SKIP — Singleton pattern matches existing managers, Firestore nested map validated for <100 cards.

### Phase 5: Card Acquisition Flow
**Rationale:** After collection viewing works, add card drop mechanics. Probability engine and pity system are complex, need isolated testing before exchange flow.

**Delivers:** Pick 1-of-2 closed cards UI in Game win overlay, card reveal animation (Phaser sprite flip via scale X tween), probability engine with weighted rarity selection (random-seed-weighted-chooser), pity mechanic (3 dupe streak → guaranteed new card), transaction-based economy integration (prevent duplicate deduction), Firestore persistence with idempotency keys.

**Uses:** random-seed-weighted-chooser 1.1.1 (STACK.md) for weighted random selection.

**Implements:** Card drop logic in Game scene (ARCHITECTURE.md), CollectionManager.rollForCard() method.

**Avoids:** Duplicate currency deduction (Pitfall 6), pity state desync (Pitfall 9) — implement transaction-based economy updates with rollback, write pity counter immediately (not batched), add pull history validation with 500ms debounce.

**Research needs:** MEDIUM — Pity system math needs validation with gacha probability resources. Unit test probability curves with fixed seeds before integration. Test case: guarantee rare card within 10 pulls at 90% confidence.

### Phase 6: Collection Exchange & Polish
**Rationale:** Final feature after acquisition flow proven stable. Exchange animation is premium feel, not critical path. Notification dot drives engagement.

**Delivers:** 6/6 collection completion detection, exchange animation (cards fold → compress → explode → coupon reveal, multi-step tween sequence), coupon reward integration with EconomyManager, bottom nav notification dot (badge when collection ready), collection ready indicator in UI Scene.

**Implements:** Exchange flow (ARCHITECTURE.md), rexUI BadgeLabel for notification dot (STACK.md).

**Avoids:** Rarity distribution feel issues (Pitfall 13) — tune after initial implementation, consider "bad luck protection" beyond pity if 3-4 consecutive commons feel unfair.

**Research needs:** SKIP — Exchange is custom animation, no external patterns. Tween sequences well-documented in Phaser.

### Phase Ordering Rationale

- **Foundation first (Phases 1-2):** Art and responsive layout are non-breaking changes that establish groundwork. Can be tested independently. Avoids memory/layout issues before adding complex features.

- **Navigation before features (Phase 3):** Persistent UI Scene pattern must be proven before Collection Scene depends on it. Bottom nav provides navigation to Collection tab. Registry key constants prevent state desync issues early.

- **Data model before flows (Phase 4 before 5):** Collection viewing without acquisition tests backend architecture (CollectionManager, lazy loading) before adding complex probability/economy logic. Reduces integration risk.

- **Acquisition before exchange (Phase 5 before 6):** Card drop mechanics are critical path. Exchange animation is polish. If time-constrained, Phase 6 can defer to v1.3 without breaking core gameplay loop.

- **Dependencies respected:** Each phase builds on previous. No circular dependencies. Can stop after any phase for incremental release.

### Research Flags

**Phases likely needing deeper research during planning:**

- **Phase 3 (Persistent UI Navigation):** rexUI has comprehensive but scattered docs. Team unfamiliar with API. Recommend 4-6 hour exploration phase to prototype Sizer + Buttons components in isolated scene. Fallback: custom bottom nav with manual layout if rexUI too complex (+200 LOC, worse DX).

- **Phase 5 (Card Acquisition Flow):** Pity system math needs validation with gacha probability analysis resources. Unit test probability curves with deterministic seeding. Verify guarantee rare card within N pulls at 90% confidence interval before going live.

**Phases with standard patterns (skip research-phase):**

- **Phase 1 (Art & Asset Quality):** PNG replacement is straightforward. Tile type extension follows existing TILE_TYPES pattern. Free Texture Packer workflow is web-based, no CLI complexity for 18 cards.

- **Phase 2 (Responsive Layout):** Phaser RESIZE mode + ResponsiveLayout utility pattern is well-documented. Testing on device matrix is QA work, not research.

- **Phase 4 (Collection Data Model):** Singleton manager pattern matches existing ProgressManager/EconomyManager. Firestore nested map schema validated for <100 cards. Lazy loading pattern is standard Phaser.

- **Phase 6 (Collection Exchange):** Custom animation work. Phaser tween sequences well-documented. No external patterns to research.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | random-seed-weighted-chooser actively maintained (v1.1.1 released 2025), TypeScript support verified. phaser3-rex-plugins v1.80.18 compatible with Phaser 3.90, official examples use UI scene pattern. Existing stack (Phaser/Firebase/Vite) already validated. |
| Features | HIGH | Monopoly GO and Marvel Snap collection patterns well-documented. 6-card collections with rarity tiers are standard. Bottom nav 3-tab pattern is mobile UX convention. Rarity color coding (grey/blue/purple/gold) universal across gaming. |
| Architecture | HIGH | Persistent UI Scene is official Phaser best practice. Singleton manager pattern proven with existing ProgressManager/EconomyManager. Firestore nested map validated for <100 cards. Lazy asset loading is standard. Build order dependencies clear. |
| Pitfalls | HIGH | All critical pitfalls have documented mitigation strategies. Scene lifecycle coordination risk mitigated with explicit registry keys + cleanup in sleep handlers. Memory management risk mitigated with multi-atlas + device detection. Economy transaction risk mitigated with idempotency keys + rollback. |

**Overall confidence:** HIGH (8/10)

### Gaps to Address

Areas where research was inconclusive or needs validation during implementation:

- **rexUI learning curve:** Team unfamiliar with rexUI API. Documentation comprehensive but scattered across 100+ plugin pages. **Mitigation:** Budget 4-6 hours for Phase 3 experimentation. Prototype bottom nav in isolated scene before integrating. Fallback to custom layout if rexUI too complex.

- **Pity system math validation:** random-seed-weighted-chooser handles weighted selection, but pity logic (increase weights after N failures) is custom business logic. **Mitigation:** Unit test pity curves with fixed seeds before integration. Validate with gacha math resources. Test case: guarantee rare card within 10 pulls at 90% confidence.

- **Art pipeline automation:** Free Texture Packer is web-based, no CLI. Manual export on each art update acceptable for 18 cards, but workflow slows with >100 assets. **Mitigation:** Acceptable for v1.2. If asset count grows >100 in future, migrate to free-tex-packer-core (Node.js, scriptable) or TexturePacker Pro CLI.

- **Scene lifecycle edge cases:** UI Scene runs concurrently with Game/Menu/LevelSelect. Potential race conditions if scenes emit events before UI Scene ready. **Mitigation:** UI Scene signals registry 'uiReady' event in create(). Other scenes wait for changedata-uiReady before emitting UI events.

- **Mobile device memory limits:** High-resolution assets tested on desktop, but iOS Safari 300-500MB cap and Android Chrome memory constraints need device testing. **Mitigation:** Implement multi-atlas strategy with @2x vs @1x device detection in Phase 1. Test on iPhone SE, iPhone 14 Pro, iPad, low-end Android before rolling out 1024px assets.

- **Collection card reveal animation performance:** 512×512 PNG decode on low-end devices during reveal animation might stutter. **Mitigation:** Test on low-end Android (4-core CPU) during Phase 5. Fallback to lower resolution card art (@1x) if performance degrades below 30 FPS.

## Sources

### Primary (HIGH confidence)

**Phaser Architecture Patterns:**
- [Phaser UI Scene Example](https://phaser.io/examples/v3/view/scenes/ui-scene) — Official example for persistent UI scene pattern
- [Persistent UI Objects Discussion](https://phaser.discourse.group/t/persistent-ui-objects-components-on-scenes/2359) — Community consensus on parallel scene approach
- [Cross-Scene Communication](https://docs.phaser.io/phaser/concepts/scenes/cross-scene-communication) — Official docs for scene coordination
- [Phaser Scenes Overview](https://docs.phaser.io/phaser/concepts/scenes) — Scene lifecycle documentation

**Firestore Schema Design:**
- [Choose a Data Structure - Firestore](https://firebase.google.com/docs/firestore/manage-data/structure-data) — Official guidance on nested maps vs subcollections
- [Cloud Firestore Data Model](https://firebase.google.com/docs/firestore/data-model) — Schema best practices
- [Structure Data - Firestore](https://cloud.google.com/firestore/docs/concepts/structure-data) — When to use nested fields

**Phaser UI Components:**
- [phaser3-rex-plugins npm](https://www.npmjs.com/package/phaser3-rex-plugins) — v1.80.18 compatible with Phaser 3.90
- [rexUI Overview](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/ui-overview/) — Component documentation

**Gacha/Probability:**
- [random-seed-weighted-chooser npm](https://www.npmjs.com/package/random-seed-weighted-chooser) — v1.1.1 TypeScript support
- [Gacha probability algorithms](https://kylechen.net/writing/gacha-probability/) — Pity system math
- [Genshin Impact gacha mechanics](https://library.keqingmains.com/general-mechanics/gacha) — Real-world pity implementation

### Secondary (MEDIUM confidence)

**Mobile UX Patterns:**
- [Mobile Bottom Navigation UX](https://www.nngroup.com/articles/mobile-navigation-design/) — 3-tab thumb-zone convention
- [Mobile Touch Target Sizes](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html) — 44px+ targets (2026 standards)
- [Rarity Color Standards in Gaming](https://tvtropes.org/pmwiki/pmwiki.php/Main/ColourCodedForYourConvenience) — Grey/blue/purple/gold universal

**Match-3 Meta Progression:**
- [Monopoly GO Sticker Collections](https://www.pocketgamer.biz/monopoly-go-sticker-collection-analysis/) — 6-card collection pattern
- [Match-3 Meta Layers](https://www.gamerefinery.com/match3-meta-layers-matching-types/) — Collection system engagement
- [Match-3 Games Metrics Guide](https://www.gameanalytics.com/blog/match-3-games-metrics-guide) — Collection completion rates

**Phaser Performance:**
- [Phaser 3 Mobile Performance](https://phaser.discourse.group/t/phaser-3-mobile-performance-ios-android/1435) — iOS Safari memory limits
- [Optimizing Phaser 3 Action Game (2025)](https://franzeus.medium.com/how-i-optimized-my-phaser-3-action-game-in-2025-5a648753f62b) — Texture memory management
- [Poor WebGL performance on high resolutions](https://github.com/photonstorm/phaser/issues/2908) — Resolution caps

**Responsive Layout:**
- [Phaser 3 Retina Support](https://supernapie.com/blog/support-retina-with-phaser-3/) — DPR scaling patterns
- [Responsive Phaser Games](https://medium.com/@mattcolman/responsive-phaser-game-54a0e2dafba7) — RESIZE mode + letterboxing
- [Full-Screen Size and Responsive Game](https://medium.com/@tajammalmaqbool11/full-screen-size-and-responsive-game-in-phaser-3-e563c2d60eab) — Safe area handling

### Tertiary (LOW confidence)

**Art Pipeline:**
- [Free Texture Packer](https://free-tex-packer.com/app/) — Web-based sprite sheet tool, sufficient for <50 assets
- [TexturePacker Phaser 3 Tutorial](https://phaser.io/news/2018/03/texturepacker-and-phaser-3-tutorial) — Atlas generation workflow
- [Sprite Sheet Optimization](https://www.codeandweb.com/texturepacker/tutorials/how-to-create-sprite-sheets-for-phaser) — Compression strategies

---
*Research completed: 2026-02-10*
*Ready for roadmap: yes*
