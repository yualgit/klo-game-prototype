# Roadmap: KLO Match-3 Demo

## Milestones

- ✅ **v1.0 MVP** — Phases 1-5 (shipped 2026-02-10) — [Archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Kyiv Journey** — Phases 6-10 (shipped 2026-02-10) — [Archive](milestones/v1.1-ROADMAP.md)
- 🚧 **v1.2 Polish & Collections** — Phases 11-16 (in progress)

---

## 🚧 v1.2 Polish & Collections (In Progress)

**Milestone Goal:** Add collection cards meta-progression, overhaul UI with global header + bottom navigation, improve art quality, fix mobile responsiveness.

### Phase 11: Art & Asset Quality Upgrade
**Goal**: Retina-quality assets with expanded tile variety and booster sprites
**Depends on**: Nothing (foundation work)
**Requirements**: ART-01, ART-02, ART-03, ART-04, ART-05
**Success Criteria** (what must be TRUE):
  1. All tile sprites display crisp on DPR=2 devices (no blur)
  2. Game board shows 6 distinct new tile types (burger, hotdog, oil, water, snack, soda)
  3. Light tile type no longer appears in any level or codebase
  4. All 4 booster types show dedicated sprite art instead of procedural indicators
  5. Variable board inactive cells display distinct dark/grey non-playable visual
**Plans**: 2 plans

Plans:
- [x] 11-01-PLAN.md — Core type system, engine, asset loading, and level data migration
- [x] 11-02-PLAN.md — Booster sprite rendering, inactive cell styling, and test updates

### Phase 12: Responsive Layout Foundation
**Goal**: Proper responsive scaling across all mobile viewports
**Depends on**: Phase 11
**Requirements**: RESP-01, RESP-02, RESP-03, RESP-04
**Success Criteria** (what must be TRUE):
  1. Level Select scene shows complete road, checkpoints, and CTA buttons on iPhone SE (375x667)
  2. Game Board fully visible with all edge cells accessible on Android 360x740 screens
  3. HUD elements never overlap grid or crop level goals on any test device
  4. Game scales smoothly when device rotated or browser resized (no layout breaks)
**Plans**: 2 plans

Plans:
- [x] 12-01-PLAN.md — DPR-aware responsive utility + Game scene adaptive layout
- [x] 12-02-PLAN.md — LevelSelect + Menu responsive layout + iOS safe area + verification

### Phase 13: Persistent UI Navigation Shell
**Goal**: Bottom navigation + global header visible across all non-game screens
**Depends on**: Phase 12
**Requirements**: NAV-01, NAV-02, NAV-04, NAV-05, NAV-06, NAV-07
**Success Criteria** (what must be TRUE):
  1. Bottom nav with 3 tabs (Levels/Collections/Shop) appears on Level Select and Collections screens
  2. Active tab shows glow/contrast, inactive tabs dimmed
  3. Global header displays current lives count, bonuses count, and settings button
  4. Lives/bonuses values update immediately when economy state changes (no refresh needed)
  5. During gameplay, bottom nav hidden but global header remains visible
**Plans**: 2 plans

Plans:
- [x] 13-01-PLAN.md — UIScene + EventsCenter + EconomyManager event emission
- [x] 13-02-PLAN.md — Scene integration (LevelSelect/Game/Collections/Shop) + visual verification

### Phase 14: Collection Data Model & Viewing
**Goal**: Collection screen shows all 3 collections with card inventory and progress tracking
**Depends on**: Phase 13
**Requirements**: COL-01, COL-02, COL-03, COL-04, COL-05, SYS-01, SYS-02
**Success Criteria** (what must be TRUE):
  1. Collections screen shows 3 collections (Coffee/Food/Cars) on scrollable page
  2. Each collection displays name, reward description, 6-card grid, and progress X/6
  3. Uncollected cards shown as grayscale silhouette with "?", collected cards in full color
  4. Each collection has 6 cards with correct rarity (2 common, 2 rare, 1 epic, 1 legendary)
  5. Collection progress persists after app refresh (Firestore restores state correctly)
**Plans**: 2 plans

Plans:
- [x] 14-01-PLAN.md — CollectionsManager singleton + card config + Firestore persistence
- [x] 14-02-PLAN.md — Collections scene UI with scrollable card grid + visual verification

### Phase 15: Card Acquisition Flow
**Goal**: Card drop mechanics with pick-1-of-2 UX, weighted rarity, and pity system
**Depends on**: Phase 14
**Requirements**: COL-06, COL-07, COL-08, COL-09, COL-10
**Success Criteria** (what must be TRUE):
  1. After winning bonus level, player sees 2 closed cards and picks one
  2. Picked card flips to reveal, other card also reveals (show what could have been)
  3. Card rarity follows weighted probability (common more frequent than legendary)
  4. After 3 consecutive duplicates, next card guaranteed new if missing cards exist
  5. Pity mechanic respects config (threshold, epic/legendary multipliers)
**Plans**: TBD

Plans:
- [ ] 15-01: TBD
- [ ] 15-02: TBD
- [ ] 15-03: TBD

### Phase 16: Collection Exchange & Polish
**Goal**: Exchange 6/6 collections for coupons with animation + notification dot
**Depends on**: Phase 15
**Requirements**: COL-11, COL-12, COL-13, NAV-03
**Success Criteria** (what must be TRUE):
  1. Exchange button active only when collection reaches 6/6 completion
  2. Exchange deducts exactly 6 cards (one of each), keeps duplicates
  3. Exchange animation plays (cards fold → compress → explode → coupon reveal)
  4. After exchange, collection can be collected again (repeatable)
  5. Collections tab shows notification dot when at least one collection ready for exchange
**Plans**: TBD

Plans:
- [ ] 16-01: TBD
- [ ] 16-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 11 → 12 → 13 → 14 → 15 → 16

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 11. Art & Asset Quality | v1.2 | 2/2 | ✓ Complete | 2026-02-10 |
| 12. Responsive Layout | v1.2 | 2/2 | ✓ Complete | 2026-02-10 |
| 13. Persistent UI Navigation | v1.2 | 2/2 | ✓ Complete | 2026-02-10 |
| 14. Collection Data Model | v1.2 | 2/2 | ✓ Complete | 2026-02-10 |
| 15. Card Acquisition Flow | v1.2 | 0/TBD | Not started | - |
| 16. Collection Exchange | v1.2 | 0/TBD | Not started | - |

---

## v1.1 Kyiv Journey (Archived)

<details>
<summary>✅ v1.1 Kyiv Journey (Phases 6-10) — SHIPPED 2026-02-10</summary>

- [x] Phase 6: Economy System (2/2 plans) — completed 2026-02-10
- [x] Phase 7: Settings (2/2 plans) — completed 2026-02-10
- [x] Phase 8: Advanced Level Mechanics (2/2 plans) — completed 2026-02-10
- [x] Phase 9: Kyiv Map Experience (2/2 plans) — completed 2026-02-10
- [x] Phase 10: Mobile Polish (2/2 plans) — completed 2026-02-10

</details>

## v1.0 MVP (Archived)

<details>
<summary>✅ v1.0 MVP (Phases 1-5) — SHIPPED 2026-02-10</summary>

- [x] Phase 1: Foundation & Setup (3/3 plans) — completed 2026-02-05
- [x] Phase 2: Core Grid Mechanics (3/3 plans) — completed 2026-02-06
- [x] Phase 3: Game Features (5/5 plans) — completed 2026-02-06
- [x] Phase 4: UI & Progression (1/1 plan) — completed 2026-02-06
- [x] Phase 5: Assets & Polish (3/3 plans) — completed 2026-02-10

</details>

---

*Roadmap created: 2026-02-05*
*v1.1 added: 2026-02-10*
*v1.1 shipped: 2026-02-10*
*v1.2 added: 2026-02-10*
