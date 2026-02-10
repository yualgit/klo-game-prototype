# KLO Match-3 Demo

## What This Is

Playable match-3 demo for KLO gas stations with full game mechanics, KLO-themed AI-generated assets, 10 levels with variable board shapes and progressive obstacles, boosters with combo matrix, lives/bonus economy, settings, scrollable Kyiv map journey, and mobile-responsive rendering. Built for client presentation to demonstrate gameplay feel, progression depth, and KLO brand integration.

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

### Active

(None — planning next milestone)

### Out of Scope

- Об'єкти доставки (канистры) — з'являються з L8+
- Phone auth / loyalty_id — не для демо
- Remote Config — статичні JSON достатні
- Real-time multiplayer — не в скоупі
- In-app purchases — бонуси тестові, не реальні гроші
- Рівні L11-20 — 10 рівнів достатньо для демо
- Progressive lives regen (30→45→60→90→120 min) — unvalidated, defer to experiment

## Context

Shipped v1.1 Kyiv Journey with 7,274 LOC TypeScript.
Tech stack: Phaser 3.90 + TypeScript + Vite + Firebase (Auth, Firestore).
~112 commits across 10 phases in 6 days (v1.0 + v1.1).
Demo is fully playable with 10 levels, all mechanics, economy system, settings, Kyiv map journey, and mobile-responsive rendering.

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
| Procedural textures for Kyiv map | Avoids missing PNG assets, rapid iteration for demo | ✓ Good — replaced with real PNGs later |
| Camera bounds for scrollable map | Built-in Phaser enforcement vs manual clamping | ✓ Good — clean scroll with parallax |
| DPR via zoom: 1/dpr pattern | Avoids deprecated resolution property, crisp retina rendering | ✓ Good — works on all devices |
| setAlpha(0.001) for invisible hit areas | Phaser skips invisible objects in hit testing | ✓ Good — documented gotcha |

## Constraints

- **Stack**: Phaser 3 + TypeScript + Vite + Firebase — визначено в TECH_SPEC.md
- **Platform**: PWA для мобільних браузерів (також працює на desktop)
- **Assets**: AI-generated на основі STYLE_GUIDE.md (немає дизайнера)
- **Scope**: L1-10 з просунутими механіками та economy (демо)

---
*Last updated: 2026-02-10 after v1.1 Kyiv Journey milestone completed*
