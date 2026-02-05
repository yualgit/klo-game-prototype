# Roadmap: KLO Match-3 Demo

## Overview

Build a playable match-3 demo for KLO gas stations in 5 phases. Start with project foundation and Firebase, implement core match-3 mechanics (grid, swap, match, cascade), add game features (boosters, obstacles, levels), polish UI and progression flow, then integrate AI-generated assets. Every phase delivers verifiable gameplay capabilities that bring the demo closer to client presentation.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Setup** - Project scaffold with Firebase and Phaser
- [ ] **Phase 2: Core Grid Mechanics** - Match-3 engine with tiles, swap, gravity, cascade
- [ ] **Phase 3: Game Features** - Boosters, obstacles, and level system
- [ ] **Phase 4: UI & Progression** - All screens, menus, win/lose flow, coupon mock
- [ ] **Phase 5: Assets & Polish** - AI-generated visuals and final integration

## Phase Details

### Phase 1: Foundation & Setup
**Goal**: Project runs locally with Firebase connected and Phaser initialized
**Depends on**: Nothing (first phase)
**Requirements**: FB-01, FB-02, ASSET-04, ASSET-05
**Success Criteria** (what must be TRUE):
  1. Developer can run `npm run dev` and see Phaser canvas in browser
  2. Firebase anonymous auth connects and creates user session automatically
  3. Progress data saves to Firestore and persists across browser sessions
  4. Project structure follows TECH_SPEC.md architecture (scenes, services, logic layers)
**Plans**: 3 plans in 2 waves

Plans:
- [x] 01-01-PLAN.md — Project scaffold (Phaser + Vite + TypeScript + Firebase deps)
- [x] 01-02-PLAN.md — Firebase integration (auth + Firestore persistence)
- [x] 01-03-PLAN.md — Phaser scenes (Boot, Menu, Game) with placeholder assets

### Phase 2: Core Grid Mechanics
**Goal**: Playable 8x8 grid with tiles, swap, match detection, gravity, and cascades
**Depends on**: Phase 1
**Requirements**: CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06, TILE-01, TILE-02, TILE-03, TILE-04
**Success Criteria** (what must be TRUE):
  1. Player can swap two adjacent tiles by tap or swipe
  2. 3+ matching tiles in row or column automatically clear and score points
  3. Tiles fall down to fill empty spaces after matches clear
  4. New tiles spawn from top with correct probabilities from level config
  5. Cascading matches continue automatically until grid stabilizes (max 20 depth)
  6. Board automatically reshuffles when no valid moves remain
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD
- [ ] 02-03: TBD

### Phase 3: Game Features
**Goal**: Full match-3 mechanics with boosters, obstacles, and 5 playable levels
**Depends on**: Phase 2
**Requirements**: BOOST-01, BOOST-02, BOOST-03, BOOST-04, BOOST-05, OBST-01, OBST-02, OBST-03, OBST-04, LVL-01, LVL-02, LVL-03, LVL-04, LVL-05
**Success Criteria** (what must be TRUE):
  1. Player can create all 4 booster types (line, bomb, rocket, KLO-sphere) by matching patterns
  2. Boosters activate correctly when matched or swapped with other boosters
  3. All 4 obstacle types appear on grid and require correct number of hits to clear
  4. Levels 1-5 load from JSON with unique goals, obstacles, and move limits
  5. Move counter decrements with each swap and level ends when moves run out
  6. Level completes with win when all goals met, or lose when moves exhausted
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

### Phase 4: UI & Progression
**Goal**: Complete UI flow from level select through gameplay to win/lose/coupon screens
**Depends on**: Phase 3
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05, UI-06
**Success Criteria** (what must be TRUE):
  1. Player sees level select menu showing L1-5 with locked/unlocked indicators
  2. During gameplay, HUD displays current goals and remaining moves
  3. Win screen appears when level completes with stars/score and "Next" button
  4. Lose screen appears when moves run out with "Retry" button
  5. After beating Level 5, coupon mock UI displays "Free Coffee" reward
  6. Level progress saves to Firebase and persists across sessions
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: Assets & Polish
**Goal**: Professional-looking demo with KLO-branded AI-generated assets
**Depends on**: Phase 4
**Requirements**: ASSET-01, ASSET-02, ASSET-03
**Success Criteria** (what must be TRUE):
  1. All 4 tile types display unique AI-generated sprites matching STYLE_GUIDE.md
  2. All 4 booster types have distinct AI-generated visual effects
  3. All 4 obstacle types show appropriate AI-generated graphics (ice, dirt, crate, blocked)
  4. Animations are smooth at 60fps on mobile browsers
  5. Demo feels polished with consistent KLO yellow/black branding throughout
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Setup | 3/3 | ✓ Complete | 2026-02-05 |
| 2. Core Grid Mechanics | 0/TBD | Not started | - |
| 3. Game Features | 0/TBD | Not started | - |
| 4. UI & Progression | 0/TBD | Not started | - |
| 5. Assets & Polish | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-05*
*Last updated: 2026-02-05*
