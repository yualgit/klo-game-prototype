# KLO Match-3 Demo

## What This Is

Playable match-3 demo for KLO gas stations with full game mechanics, KLO-themed AI-generated assets, 5 levels, boosters, obstacles, and Firebase persistence. Built for client presentation to demonstrate gameplay feel and KLO brand integration.

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

### Active

(None — define in next milestone with `/gsd:new-milestone`)

### Out of Scope

- Об'єкти доставки (канистры) — з'являються з L8+
- Phone auth / loyalty_id — не для демо
- Remote Config — статичні JSON достатні
- Рівні L6-20 — 5 рівнів достатньо для демо
- Real-time multiplayer — не в скоупі
- In-app purchases — безкоштовна гра з купонами

## Context

Shipped v1.0 MVP with 5,490 LOC TypeScript.
Tech stack: Phaser 3.90 + TypeScript + Vite + Firebase (Auth, Firestore).
68 commits across 5 phases in 6 days.
Demo is fully playable with 5 levels, all mechanics, and KLO-branded visuals.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Phaser 3 замість pixi.js | Більше готових рішень для match-3, краща документація | ✓ Good — scene system, tweens, input handling worked well |
| Firebase замість custom backend | Швидкий старт, готові SDK для auth/analytics/firestore | ✓ Good — anonymous auth + Firestore persistence seamless |
| AI-generated assets | Немає дизайнера, STYLE_GUIDE.md має детальні промпти | ✓ Good — consistent KLO-branded look achieved |
| L1-5 для демо | JSON вже готовий, достатньо для показу всіх механік | ✓ Good — showcases all mechanics adequately |
| Всі 4 бустери в демо | Показати клієнту повний потенціал | ✓ Good — combo matrix adds depth |
| ProgressManager singleton in registry | Global access for Firebase persistence across scenes | ✓ Good — clean scene communication |
| Direct scene.start() from overlays | Avoid tween/shutdown race conditions | ✓ Good — fixed crash on scene restart |
| Runtime particle textures | Avoid external PNG dependencies for VFX | ✓ Good — self-contained particle system |

## Constraints

- **Stack**: Phaser 3 + TypeScript + Vite + Firebase — визначено в TECH_SPEC.md
- **Platform**: PWA для мобільних браузерів (також працює на desktop)
- **Assets**: AI-generated на основі STYLE_GUIDE.md (немає дизайнера)
- **Scope**: Тільки L1-5 з повним набором механік

---
*Last updated: 2026-02-10 after v1.0 milestone*
