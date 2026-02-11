# Milestones

## v1.0 MVP (Shipped: 2026-02-10)

**Phases completed:** 5 phases, 15 plans
**Timeline:** 6 days (Feb 5 — Feb 10, 2026)
**Codebase:** 5,490 LOC TypeScript, 68 commits, 97 files

**Key accomplishments:**
- Phaser 3 + TypeScript + Vite + Firebase foundation with anonymous auth and Firestore persistence
- Complete match-3 engine with 8x8 grid, tap/swipe input, cascades, and board reshuffle
- Booster system (line, bomb, rocket, KLO-sphere) with full combo matrix
- Obstacle mechanics (ice, dirt, crate, blocked) with 5 playable levels from JSON
- Level select, progress tracking with stars, win/lose overlays, coupon mock
- AI-generated PNG sprites, particle effects, audio, animated UI with KLO branding

**Archives:** [Roadmap](milestones/v1.0-ROADMAP.md) | [Requirements](milestones/v1.0-REQUIREMENTS.md)

---

## v1.1 Kyiv Journey (Shipped: 2026-02-10)

**Phases completed:** 10 phases, 25 plans, 11 tasks

**Key accomplishments:**
- Individual booster effects and combo matrix with cross-clear rocket, 5x5 mega-bomb, triple-line, and KLO-sphere combos

---


## v1.2 Polish & Collections (Shipped: 2026-02-11)

**Phases completed:** 6 phases (11-16), 14 plans, 94 commits
**Timeline:** 2 days (Feb 10 — Feb 11, 2026)
**Codebase:** 9,892 LOC TypeScript, 223 files changed, +21,636/-4,188 lines
**Git range:** v1.1..2dd9455

**Key accomplishments:**
- Retina art upgrade with 6 new tile types (burger/hotdog/oil/water/snack/soda), dedicated booster sprites, and inactive cell styling
- Mobile-responsive layout with DPR-aware scaling (cssToGame), iOS safe area support, verified on iPhone SE through desktop
- Persistent UI shell: bottom navigation (Levels/Collections/Shop) + global header with reactive lives/bonuses display
- Collection system: 3 collections (Coffee/Food/Cars) with 18 cards, Firestore persistence, scrollable card grid UI
- Card acquisition flow: weighted rarity drops, pick-1-of-2 flip animation UX, pity system with configurable thresholds
- Collection exchange: 6/6 exchange with fold→compress→explode→coupon animation, notification dots on Collections tab

**Archives:** [Roadmap](milestones/v1.2-ROADMAP.md) | [Requirements](milestones/v1.2-REQUIREMENTS.md)

---


## v1.3 UI Polish (Shipped: 2026-02-11)

**Phases completed:** 6 phases (17-22), 10 plans, 54 commits
**Timeline:** 1 day (Feb 11, 2026)
**Codebase:** 10,057 LOC TypeScript, 8 source files changed, +732/-567 lines
**Git range:** feat(17-01)..docs(phase-22)

**Key accomplishments:**
- Header polished with settings button in square container; navigation tabs reordered with rounded-rect active indicator
- Welcome screen blocks return after PLAY; title scales responsively on mobile viewports
- Settings overlay centralized in UIScene with mobile sizing, z-order fix, and singleton guard
- Level select nodes horizontally clamped for mobile with correct MAP_WIDTH centering and reliable click handlers
- Game screen adapts to mobile with responsive two-line HUD, icon-only back button, and board width constraints (16px padding, 1024px max)
- Collections upgraded with horizontal card swiper, snap-to-card navigation, and golden background

**Archives:** [Roadmap](milestones/v1.3-ROADMAP.md) | [Requirements](milestones/v1.3-REQUIREMENTS.md)

---

