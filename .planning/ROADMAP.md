# Roadmap: KLO Match-3 Demo

## Milestones

- ✅ **v1.0 MVP** — Phases 1-5 (shipped 2026-02-10) — [Archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Kyiv Journey** — Phases 6-10 (shipped 2026-02-10) — [Archive](milestones/v1.1-ROADMAP.md)
- ✅ **v1.2 Polish & Collections** — Phases 11-16 (shipped 2026-02-11) — [Archive](milestones/v1.2-ROADMAP.md)
- 📋 **v1.3 UI Polish** — Phases 17-22 (planned)

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-5 | v1.0 MVP | 15/15 | ✓ Complete | 2026-02-10 |
| 6-10 | v1.1 Kyiv Journey | 10/10 | ✓ Complete | 2026-02-10 |
| 11-16 | v1.2 Polish & Collections | 14/14 | ✓ Complete | 2026-02-11 |
| 17 | v1.3 UI Polish | 1/1 | ✓ Complete | 2026-02-11 |
| 18 | v1.3 UI Polish | 1/1 | ✓ Complete | 2026-02-11 |
| 19 | v1.3 UI Polish | 0/? | Not started | - |
| 20 | v1.3 UI Polish | 0/? | Not started | - |
| 21 | v1.3 UI Polish | 0/? | Not started | - |
| 22 | v1.3 UI Polish | 0/? | Not started | - |

---

## 📋 v1.3 UI Polish (Phases 17-22)

**Milestone Goal:** Polish UI across all screens for production-ready mobile experience (19 requirements: welcome screen, header, settings, navigation, level select, game screen, collections).

### Phase 17: Header & Navigation Polish
**Goal**: UI shell displays correctly with proper tab ordering and button styling
**Depends on**: Phase 16
**Requirements**: HDR-01, HDR-02, NAV-01, NAV-02
**Success Criteria** (what must be TRUE):
  1. Settings icon renders inside square button container (gui/Small Square Button Blue.png)
  2. Bonus score display is removed from header
  3. "Levels" tab appears before "Collections" tab in bottom navigation
  4. Active tab indicator is a rounded rectangle instead of circle
**Plans**: 1 plan

Plans:
- [x] 17-01-PLAN.md — Header polish (settings button container, remove bonus display) + Navigation polish (tab order, rounded rect indicator) — completed 2026-02-11

### Phase 18: Welcome Screen Refinement
**Goal**: Welcome screen adapts to mobile and blocks back navigation after start
**Depends on**: Phase 17
**Requirements**: WELC-01, WELC-02
**Success Criteria** (what must be TRUE):
  1. User cannot navigate back to welcome screen after pressing PLAY
  2. "KLO Match-3" title fits mobile screen width without clipping
**Plans**: 1 plan

Plans:
- [x] 18-01-PLAN.md — Remove back-to-menu button from LevelSelect + responsive Menu title sizing — completed 2026-02-11

### Phase 19: Settings Overlay Fixes
**Goal**: Settings overlay works reliably across all viewports and scenes
**Depends on**: Phase 18
**Requirements**: SETT-01, SETT-02, SETT-03, SETT-04
**Success Criteria** (what must be TRUE):
  1. Settings overlay text and elements fit mobile screen without clipping
  2. Settings overlay renders above header and bottom navigation (z-order correct)
  3. Only one settings overlay can be open at a time (no duplicates)
  4. Settings overlay opens from level/game pages without crash
**Plans**: 1 plan

Plans:
- [ ] 19-01-PLAN.md — Move settings overlay to UIScene with mobile scaling, z-order fix, singleton guard, and cleanup of per-scene handlers

### Phase 20: Level Select Improvements
**Goal**: Level select displays all nodes on mobile and buttons remain interactive
**Depends on**: Phase 19
**Requirements**: LVLS-01, LVLS-02
**Success Criteria** (what must be TRUE):
  1. All level nodes fit on mobile screen without scrolling (reduced spacing)
  2. Level buttons remain clickable after scene changes and navigation (no reload needed)
**Plans**: TBD

Plans:
- [ ] 20-01: TBD

### Phase 21: Game Screen Polish
**Goal**: Game screen adapts to mobile with responsive HUD and board sizing
**Depends on**: Phase 20
**Requirements**: GAME-01, GAME-02, GAME-03, GAME-04
**Success Criteria** (what must be TRUE):
  1. On mobile, "< Menu" back button displays in header as square icon-only button
  2. On mobile, level number and moves counter wrap to new line; goal text is smaller
  3. Game board width = screen width - 32px (16px padding), max 1024px; height adjusts for narrow viewports
  4. Resize error on LevelSelect.ts is fixed (no viewport undefined error)
**Plans**: TBD

Plans:
- [ ] 21-01: TBD

### Phase 22: Collections UX Upgrade
**Goal**: Collections screen provides horizontal swiper navigation with proper scroll bounds
**Depends on**: Phase 21
**Requirements**: COLL-01, COLL-02, COLL-03
**Success Criteria** (what must be TRUE):
  1. Scroll has proper bounds (infinite scroll bug fixed)
  2. Collection cards display in horizontal row with snap-to-card swipe navigation
  3. Card container has colored background (0xffb800, 0.15 opacity) behind cards
**Plans**: TBD

Plans:
- [ ] 22-01: TBD

---

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
*v1.1 added: 2026-02-10*
*v1.1 shipped: 2026-02-10*
*v1.2 added: 2026-02-10*
*v1.2 shipped: 2026-02-11*
*v1.3 added: 2026-02-11*
