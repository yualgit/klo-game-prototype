# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-10)

**Core value:** Клієнт має побачити і відчути gameplay — як гра буде сприйматись реальними користувачами. Демо має передати "смак" механіки та KLO-бренд.
**Current focus:** Phase 13 - Persistent UI Navigation Shell

## Current Position

Phase: 14 of 16 (Collection Data Model and Viewing)
Plan: 1 of 2 complete
Status: Phase 14 in progress — Collection data model and Firestore persistence complete
Last activity: 2026-02-10 — Phase 14-01 complete (Collection data model with Firestore persistence)

Progress: [█████████████████░░░░░░░░░░] 56% (13 of 16 phases complete, Phase 14: 1/2 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 30 (25 from v1.0 + v1.1, 5 from v1.2)
- Average duration: ~5 minutes per plan
- Total execution time: ~6 days across 13 phases

**By Phase:**

| Phase | Plans | Milestone | Status |
|-------|-------|-----------|--------|
| 1-5 | 15 | v1.0 MVP | Shipped 2026-02-10 |
| 6-10 | 10 | v1.1 Kyiv Journey | Shipped 2026-02-10 |
| 11 | 2 | v1.2 Collections | ✓ Complete 2026-02-10 |
| 12 | 2 | v1.2 Collections | ✓ Complete 2026-02-10 |
| 13 | 2 | v1.2 Collections | ✓ Complete 2026-02-10 |
| 14-16 | TBD | v1.2 Collections | Not started |

**Recent Trend:**
- v1.0 completed: 5 phases, 15 plans (Feb 5-10)
- v1.1 completed: 5 phases, 10 plans (Feb 10)
- v1.2 progress: 3 phases, 5 plans (Feb 10)
- Trend: Stable velocity with increasing phase complexity

*Plan metrics:*
| Phase 11 P01 | 239 | 3 tasks | 19 files |
| Phase 11 P02 | 409 | 3 tasks | 5 files |
| Phase 12 P01 | 385 | 1 task | 3 files |
| Phase 12 P02 | ~337 | 2 tasks | 5 files |
| Phase 13 P01 | 154 | 2 tasks | 3 files |
| Phase 13 P02 | 250 | 3 tasks | 6 files |
| Phase 14 P01 | 156 | 2 tasks | 4 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- **Phaser 3.90 + TypeScript + Vite + Firebase**: Core stack validated through v1.0 + v1.1
- **Registry pattern for managers**: ProgressManager/EconomyManager/SettingsManager proven
- **DPR via zoom: 1/dpr pattern**: Retina rendering works on all devices (basis for Phase 11 art upgrade)
- **setAlpha(0.001) for invisible hit areas**: Phaser gotcha documented (relevant for Phase 13 UI overlays)
- [Phase 11]: Generic Object.entries approach for spawn rules iteration (supports any tile types)
- [Phase 11]: Booster sprites use unique idle animations per type — REMOVED in Phase 12 (too prominent at variable scales)
- [Phase 11]: Inactive cell styling is conditional based on level config (block sprite vs transparent mask)
- [Phase 12]: Responsive layout via cssToGame() DPR multiplier — all sizes in CSS pixels × DPR = Phaser coords
- [Phase 12]: Tile size range 36-60px CSS (adapts to viewport width while maintaining touch targets)
- [Phase 12]: LevelSelect elements need proportionally smaller CSS sizes than Game scene for mobile
- [Phase 12]: Overlay buttons positioned relative to panel bottom to prevent overlap
- [Phase 12]: Camera world bottom extends dynamically for proper first-level positioning
- [Phase 13]: UIScene runs in parallel with content scenes via scene.launch() pattern
- [Phase 13]: EventsCenter singleton pattern (not game.events) for cross-scene communication
- [Phase 13]: Interactive graphics backgrounds required to block click-through (Phaser gotcha)
- [Phase 13-02]: UIScene integrated across all scenes with conditional nav visibility (full nav on LevelSelect/Collections/Shop, header-only on Game)
- [Phase 13-02]: Collections and Shop stub scenes created with navigation wiring, full implementation deferred to phases 14-15
- [Phase 14-01]: CollectionsManager does NOT extend EventEmitter yet (Phase 16 will add notification dot events)
- [Phase 14-01]: Collection state stored as nested map in existing user document (not subcollection)
- [Phase 14-01]: Default state uses empty owned_cards arrays with pity_streak: 0
- [Phase 14-01]: Card rarity distribution: 2 common + 2 rare + 1 epic + 1 legendary per collection

### Pending Todos

None yet — v1.2 milestone continuing.

### Blockers/Concerns

**Phase 12 Scale.FIT FAILED — lessons learned (RESOLVED):**
- Scale.FIT approach abandoned in favor of Scale.RESIZE + responsive layout
- All scenes now use cssToGame() for DPR-aware sizing
- Verified across iPhone SE, iPhone 14 Pro, Android 360x740, desktop

**Known considerations for v1.2:**
- Phase 13: rexUI learning curve (4-6 hour budget for experimentation)
- Phase 15: Pity system math validation (unit test with fixed seeds)

## Session Continuity

Last session: 2026-02-10
Stopped at: Completed 14-01-PLAN.md - Collection data model with Firestore persistence
Resume file: None

**Next action:** Execute Phase 14 Plan 02 (Collections UI scene)
