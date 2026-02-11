# Roadmap: KLO Match-3 Demo

## Milestones

- ✅ **v1.0 MVP** — Phases 1-5 (shipped 2026-02-10) — [Archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Kyiv Journey** — Phases 6-10 (shipped 2026-02-10) — [Archive](milestones/v1.1-ROADMAP.md)
- ✅ **v1.2 Polish & Collections** — Phases 11-16 (shipped 2026-02-11) — [Archive](milestones/v1.2-ROADMAP.md)
- ✅ **v1.3 UI Polish** — Phases 17-22 (shipped 2026-02-11) — [Archive](milestones/v1.3-ROADMAP.md)
- 🚧 **v1.4 Content Expansion** — Phases 23-25 (in progress)

## Phases

### 🚧 v1.4 Content Expansion (In Progress)

**Milestone Goal:** Expand game content with data-driven tile system, 9 tile types, 7x7 boards, and 10 new levels.

#### Phase 23: Tile System Refactor

**Goal:** Tile types are data-driven and all 9 tile types render correctly

**Depends on:** Phase 22

**Requirements:** TSYS-01, TSYS-02, TSYS-03

**Success Criteria** (what must be TRUE):
1. Tile types are defined in a single configuration source (no hardcoded type literals in game logic)
2. Adding or removing a tile type requires only config changes (no changes to type unions or switch statements)
3. All 9 tile types (burger, coffee, fuel_can, hotdog, oil, snack, soda, water, wheel) render correctly with their sprites
4. Board spawning and matching logic work with all 9 configured tile types

**Plans:** TBD

Plans:
- [ ] 23-01: TBD (tile config system)
- [ ] 23-02: TBD (wire up missing tiles)

---

#### Phase 24: 7x7 Board Transition

**Goal:** All levels use 7x7 boards with adjusted goals and moves

**Depends on:** Phase 23

**Requirements:** BOARD-01, BOARD-02

**Success Criteria** (what must be TRUE):
1. Game engine uses 7x7 grid dimensions (not 8x8)
2. All existing levels L1-L10 are retrofitted to 7x7 boards
3. Retrofitted levels have adjusted goals and move counts balanced for smaller board
4. Retrofitted levels remain winnable with similar difficulty

**Plans:** TBD

Plans:
- [ ] 24-01: TBD (resize engine to 7x7)
- [ ] 24-02: TBD (retrofit L1-L10)

---

#### Phase 25: New Levels

**Goal:** 10 new levels with progressive difficulty using all tile types

**Depends on:** Phase 24

**Requirements:** LVL-01, LVL-02, LVL-03, LVL-04

**Success Criteria** (what must be TRUE):
1. 10 new levels (L11-L20) exist with 7x7 boards
2. New levels use all 9 tile types in level configurations
3. New levels introduce progressive difficulty through more obstacles, harder goals, and fewer moves
4. Level select map displays all 20 level nodes with correct positioning on Kyiv map
5. User can play through all new levels and progress is tracked correctly

**Plans:** TBD

Plans:
- [ ] 25-01: TBD (create L11-L20 JSONs)
- [ ] 25-02: TBD (extend level select map)

---

## Progress

**Execution Order:**
Phases execute in numeric order. v1.4 continues from Phase 23.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-5 | v1.0 MVP | 15/15 | ✓ Complete | 2026-02-10 |
| 6-10 | v1.1 Kyiv Journey | 10/10 | ✓ Complete | 2026-02-10 |
| 11-16 | v1.2 Polish & Collections | 14/14 | ✓ Complete | 2026-02-11 |
| 17-22 | v1.3 UI Polish | 10/10 | ✓ Complete | 2026-02-11 |
| **23. Tile System Refactor** | **v1.4** | **0/TBD** | **Not started** | **—** |
| **24. 7x7 Board Transition** | **v1.4** | **0/TBD** | **Not started** | **—** |
| **25. New Levels** | **v1.4** | **0/TBD** | **Not started** | **—** |

---

<details>
<summary>✅ v1.3 UI Polish (Phases 17-22) — SHIPPED 2026-02-11</summary>

- [x] Phase 17: Header & Navigation Polish (1/1 plan) — completed 2026-02-11
- [x] Phase 18: Welcome Screen Refinement (1/1 plan) — completed 2026-02-11
- [x] Phase 19: Settings Overlay Fixes (2/2 plans) — completed 2026-02-11
- [x] Phase 20: Level Select Improvements (3/3 plans) — completed 2026-02-11
- [x] Phase 21: Game Screen Polish (2/2 plans) — completed 2026-02-11
- [x] Phase 22: Collections UX Upgrade (1/1 plan) — completed 2026-02-11

</details>

<details>
<summary>✅ v1.2 Polish & Collections (Phases 11-16) — SHIPPED 2026-02-11</summary>

- [x] Phase 11: Art & Asset Quality Upgrade (2/2 plans) — completed 2026-02-10
- [x] Phase 12: Responsive Layout Foundation (2/2 plans) — completed 2026-02-10
- [x] Phase 13: Persistent UI Navigation Shell (2/2 plans) — completed 2026-02-10
- [x] Phase 14: Collection Data Model & Viewing (2/2 plans) — completed 2026-02-10
- [x] Phase 15: Card Acquisition Flow (4/4 plans) — completed 2026-02-11
- [x] Phase 16: Collection Exchange & Polish (2/2 plans) — completed 2026-02-11

</details>

<details>
<summary>✅ v1.1 Kyiv Journey (Phases 6-10) — SHIPPED 2026-02-10</summary>

- [x] Phase 6: Economy System (2/2 plans) — completed 2026-02-10
- [x] Phase 7: Settings (2/2 plans) — completed 2026-02-10
- [x] Phase 8: Advanced Level Mechanics (2/2 plans) — completed 2026-02-10
- [x] Phase 9: Kyiv Map Experience (2/2 plans) — completed 2026-02-10
- [x] Phase 10: Mobile Polish (2/2 plans) — completed 2026-02-10

</details>

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
*v1.1 shipped: 2026-02-10*
*v1.2 shipped: 2026-02-11*
*v1.3 shipped: 2026-02-11*
*v1.4 roadmap created: 2026-02-11*
