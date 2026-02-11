# KLO Match-3 Demo

## What This Is

Playable match-3 demo for KLO gas stations with full game mechanics, KLO-themed AI-generated assets, 20 levels on 7x7 boards with variable shapes and progressive obstacles, 9 tile types, boosters with combo matrix, lives/bonus economy, settings, scrollable Kyiv map journey, mobile-responsive rendering, persistent UI navigation shell, collection cards meta-progression with card pick UX, pity system and coupon exchange, and production-ready mobile UI polish across all screens. Built for client presentation to demonstrate gameplay feel, progression depth, and KLO brand integration.

## Core Value

Клієнт має побачити і **відчути** gameplay — як гра буде сприйматись реальними користувачами. Демо має передати "смак" механіки та KLO-бренд.

## Requirements

### Validated

- ✓ CORE-01..06: Full match-3 mechanics (swap, match, gravity, cascade, reshuffle) — v1.0
- ✓ TILE-01..04: 4 tile types with AI-generated sprites (fuel, coffee, snack, road) — v1.0
- ✓ BOOST-01..05: 4 booster types + combo matrix (line, bomb, rocket, KLO-sphere) — v1.0
- ✓ OBST-01..04: 4 obstacle types (ice, dirt, crate, blocked) — v1.0
- ✓ LVL-01..05: 5 levels from JSON with goals, moves, win/lose — v1.0
- ✓ UI-01..06: Full UI flow (level select, HUD, win/lose overlays, coupon mock) — v1.0
- ✓ FB-01..02: Firebase anonymous auth + Firestore progress persistence — v1.0
- ✓ ASSET-01..05: AI-generated tiles, boosters, obstacles, UI elements, backgrounds — v1.0
- ✓ ECON-01..07: Lives system with regeneration + bonus economy + Firestore persistence — v1.1
- ✓ SETT-01..04: Settings menu with SFX toggle, animation toggle, localStorage persistence — v1.1
- ✓ OBST-05..07: 3-state progressive ice and grass obstacles — v1.1
- ✓ LVLD-01..04: Variable board shapes, pre-placed tiles, 5 new levels (L6-L10) — v1.1
- ✓ VISL-01..03: Scrollable Kyiv map with parallax and winding path level nodes — v1.1
- ✓ VISL-04..05: Mobile-responsive layout with DPR-aware rendering (capped at 2x) — v1.1
- ✓ ART-01..05: Retina art upgrade with 6 new tile types, booster sprites, inactive cell styling — v1.2
- ✓ RESP-01..04: Responsive layout with DPR-aware scaling on all mobile viewports — v1.2
- ✓ NAV-01..07: Bottom navigation + global header with reactive lives/bonuses display — v1.2
- ✓ COL-01..13: Collection cards system (3 collections, card pick, pity, exchange for coupons) — v1.2
- ✓ SYS-01..02: Collection persistence to Firestore with state restoration — v1.2
- ✓ WELC-01..02: Welcome screen one-way flow + responsive title — v1.3
- ✓ HDR-01..02: Header settings button container + bonus display removed — v1.3
- ✓ SETT-01..04: Settings overlay mobile sizing, z-order, singleton, crash fix — v1.3
- ✓ NAV-01..02: Navigation tab order + rounded-rect indicator — v1.3
- ✓ LVLS-01..02: Level select mobile fit + reliable click handlers — v1.3
- ✓ GAME-01..04: Mobile HUD, back button, board sizing, resize fix — v1.3
- ✓ COLL-01..03: Collections scroll bounds, horizontal swiper, golden background — v1.3

### Active

## Current Milestone: v1.4 Content Expansion

**Goal:** Expand game content with data-driven tile system, 9 tile types, 7x7 boards, and 10 new levels.

**Target features:**
- Refactor tile type system from hardcoded literals to data-driven configuration
- Wire up 3 missing tile types (coffee, fuel_can, wheel) for 9 total
- Reduce all boards from 8x8 to 7x7
- Add 10 new levels (L11-L20) with 7x7 boards and all 9 tile types

### Out of Scope

- Об'єкти доставки (канистры) — з'являються з L8+
- Phone auth / loyalty_id — не для демо
- Remote Config — статичні JSON достатні
- Real-time multiplayer — не в скоупі
- In-app purchases — бонуси тестові, не реальні гроші
- ~~Рівні L11-20~~ — moved to v1.4 scope
- Progressive lives regen (30→45→60→90→120 min) — unvalidated, defer to experiment
- Analytics events — defer to future milestone
- Collection tutorial — defer to future milestone
- Shop screen implementation — tab exists in nav but content deferred
- Paid card packs / IAP — demo scope, no monetization
- Card trading between players — requires social graph
- Card abilities / stats — cards are visual collectibles

## Context

Shipped v1.3 UI Polish with 10,057 LOC TypeScript.
Tech stack: Phaser 3.90 + TypeScript + Vite + Firebase (Auth, Firestore).
~250+ commits across 22 phases in 7 days (v1.0 + v1.1 + v1.2 + v1.3).
Demo is fully playable with 10 levels, all mechanics, economy system, settings, Kyiv map journey, mobile-responsive rendering, bottom navigation, global header, collection cards meta-progression, and production-ready mobile UI across all screens.
Known tech debt: console.log statements in Game.ts, GUI_TEXTURE_KEYS constant unused in UIScene, hardcoded tile type literals violating DRY/KISS.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Phaser 3 замість pixi.js | Більше готових рішень для match-3, краща документація | ✓ Good — scene system, tweens, input handling worked well |
| Firebase замість custom backend | Швидкий старт, готові SDK для auth/analytics/firestore | ✓ Good — anonymous auth + Firestore persistence seamless |
| AI-generated assets | Немає дизайнера, STYLE_GUIDE.md має детальні промпти | ✓ Good — consistent KLO-branded look achieved |
| ProgressManager singleton in registry | Global access for Firebase persistence across scenes | ✓ Good — clean scene communication |
| Direct scene.start() from overlays | Avoid tween/shutdown race conditions | ✓ Good — fixed crash on scene restart |
| Runtime particle textures | Avoid external PNG dependencies for VFX | ✓ Good — self-contained particle system |
| Firebase Timestamp for lives regen | Prevents multi-device desync and local time exploits | ✓ Good — server-side time accuracy |
| EconomyManager + SettingsManager singletons | Registry pattern like ProgressManager — consistent architecture | ✓ Good — reactive subscriptions work cleanly |
| Cell map (number[][]) for variable boards | Backward compatible, reuses gravity/spawn skip for inactive cells | ✓ Good — L6-L10 showcase shapes |
| Camera bounds for scrollable map | Built-in Phaser enforcement vs manual clamping | ✓ Good — clean scroll with parallax |
| DPR via zoom: 1/dpr pattern | Avoids deprecated resolution property, crisp retina rendering | ✓ Good — works on all devices |
| setAlpha(0.001) for invisible hit areas | Phaser skips invisible objects in hit testing | ✓ Good — documented gotcha |
| Scale.RESIZE over Scale.FIT | Scale.FIT shrinks everything on mobile; RESIZE + responsive layout adapts | ✓ Good — all viewports work correctly |
| cssToGame() DPR multiplier | Single conversion function for CSS→Phaser coordinates | ✓ Good — consistent sizing across devices |
| EventsCenter singleton for cross-scene comms | Decouples scenes, avoids game.events pollution | ✓ Good — UIScene updates reactively |
| UIScene parallel launch pattern | Persistent header/nav across scenes via scene.launch() | ✓ Good — consistent navigation shell |
| Collection state in user document (not subcollection) | Simpler Firestore structure, fewer reads | ✓ Good — single document persistence |
| Weighted rarity + pity system | Config-driven drop rates with guaranteed new card after streak | ✓ Good — fair card acquisition |
| Collection exchange with animation overlay | Multi-stage fold→compress→explode→coupon for satisfying UX | ✓ Good — engaging exchange experience |
| Settings overlay in UIScene (v1.3) | Universal access from all scenes, z-order 300+ | ✓ Good — singleton guard prevents duplicates |
| Container-level click handlers (v1.3) | Scene-level input unreliable across scene changes | ✓ Good — reliable cross-scene interaction |
| MAP_WIDTH coordinate centering (v1.3) | Node range center (455) caused 57px offset on mobile | ✓ Good — correct centering at 512 |
| Destroy-recreate for viewport UI (v1.3) | Mobile HUD/back button need different layout than desktop | ✓ Good — responsive on resize |
| Dual-constraint tile sizing (v1.3) | min(width, height) constraint for square tiles on all viewports | ✓ Good — works on 1366x768 laptops |
| Horizontal card swiper with snap (v1.3) | Direction detection with 10px threshold for swipe vs scroll | ✓ Good — smooth 300ms Cubic.Out snap |

## Constraints

- **Stack**: Phaser 3 + TypeScript + Vite + Firebase — визначено в TECH_SPEC.md
- **Platform**: PWA для мобільних браузерів (також працює на desktop)
- **Assets**: AI-generated на основі STYLE_GUIDE.md (немає дизайнера)
- **Scope**: L1-20 з просунутими механіками та economy (демо)

---
*Last updated: 2026-02-11 after v1.4 milestone start*
