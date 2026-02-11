# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-11)

**Core value:** Клієнт має побачити і відчути gameplay — як гра буде сприйматись реальними користувачами. Демо має передати "смак" механіки та KLO-бренд.
**Current focus:** v1.3 UI Polish

## Current Position

Phase: 22 of 22 (Collections UX Upgrade) — IN PROGRESS
Plan: 1 of 1 complete (22-01)
Status: Phase 22 Plan 01 complete (horizontal card swiper with snap navigation)
Last activity: 2026-02-11 — Phase 22-01 complete (horizontal card swiper implementation)

Progress: [█████████████████████████░] 96% (21.5/22 phases complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 49 (15 v1.0 + 10 v1.1 + 14 v1.2 + 10 v1.3)
- Total phases completed: 21 (Phase 22 in progress: 1/1 plans)
- Total execution time: ~7 days across 3 milestones

**By Milestone:**

| Milestone | Phases | Plans | Timeline |
|-----------|--------|-------|----------|
| v1.0 MVP | 1-5 | 15 | Feb 5-10, 2026 |
| v1.1 Kyiv Journey | 6-10 | 10 | Feb 10, 2026 |
| v1.2 Polish & Collections | 11-16 | 14 | Feb 10-11, 2026 |
| v1.3 UI Polish | 17-22 | 10 | In progress |

**Recent Plans:**

| Phase | Plan | Duration | Tasks | Files | Date |
|-------|------|----------|-------|-------|------|
| 22 | 01 | 113s | 2 | 1 | 2026-02-11 |
| 21 | 02 | 71s | 1 | 1 | 2026-02-11 |
| 21 | 01 | 90s | 2 | 2 | 2026-02-11 |
| 20 | 03 | 47s | 1 | 1 | 2026-02-11 |
| 20 | 02 | 152s | 1 | 2 | 2026-02-11 |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions:
- v1.3 (22-01): Direction detection with 10px threshold prevents horizontal/vertical scroll conflicts
- v1.3 (22-01): Snap animation uses Cubic.Out easing with 300ms duration for smooth feel
- v1.3 (22-01): Golden background (0xffb800, 0.15 opacity) behind card rows for visual hierarchy
- v1.3 (20-02): Horizontal clamping: center node range (260-650), clamp to edges, scale if needed
- v1.3 (20-02): Fallback x-position scaling for viewports < 468px game width
- v1.3 (20-02): Reverted 20-01's vertical compression - requirement was horizontal width clamping
- v1.3 (20-01): Container direct event handlers over scene-level input for reliable cross-scene interaction
- v1.3 (17-01): Settings gear font size reduced to cssToGame(16) for better fit in square button
- v1.3 (17-01): Active tab rounded rectangle dimensions: 44x28 with 8px corner radius
- v1.2: UIScene parallel launch pattern for persistent header/nav
- v1.2: Collection state in user document (not subcollection)
- v1.2: DPR via zoom: 1/dpr pattern for retina rendering
- v1.2: Scale.RESIZE over Scale.FIT for mobile adaptation
- [Phase 18-01]: Removed back-to-menu button from LevelSelect to enforce one-way flow
- [Phase 18-01]: Title font size capped at 18% viewport width for mobile responsiveness
- [Phase 19-01]: Settings overlay moved to UIScene for universal access with depth 300+ z-ordering
- [Phase 19-01]: Singleton guard pattern (settingsOpen flag) prevents duplicate overlays
- [Phase 19-02]: Title font reduced to 18px, toggles 44x22px, volume split to 2 rows for mobile fit
- [Phase 20-02]: Horizontal clamping: center node range (260-650), clamp to edges, scale if needed
- [Phase 20-02]: Fallback x-position scaling for viewports < 468px game width
- [Phase 20-03]: Center MAP_WIDTH coordinate space (512) not node range center (455) for correct mobile centering
- [Phase 21-01]: Mobile threshold: 600px CSS width for HUD and back button variants
- [Phase 21-01]: Destroy-recreate pattern for viewport-dependent UI (HUD + back button on resize)
- [Phase 21-02]: Board width constraint: min(viewport width - 32px, 1024px CSS)
- [Phase 21-02]: Dual-constraint tile sizing: min(tileSizeByWidth, tileSizeByHeight) for square tiles
- [Phase 21-02]: Height-aware board scaling for narrow viewports (e.g., 1366x768 laptops)
- [Phase 21]: Back button moved from Game scene to UIScene header (showBackButton option + eventsCenter 'game-back')

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-11
Stopped at: Phase 22-01 complete (horizontal card swiper with snap navigation)
Resume file: None

**Next action:** Phase 22 complete (1/1 plans). Phase 22 ready for verification.

---
*Updated: 2026-02-11 after Phase 22-01 execution*
