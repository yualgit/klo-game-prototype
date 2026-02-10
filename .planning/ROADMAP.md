# Roadmap: KLO Match-3 Demo

## Milestones

- ✅ **v1.0 MVP** — Phases 1-5 (shipped 2026-02-10) — [Archive](milestones/v1.0-ROADMAP.md)
- 🚧 **v1.1 Kyiv Journey** — Phases 6-10 (active)

---

## v1.1 Kyiv Journey

**Created:** 2026-02-10
**Depth:** Quick (5 phases)
**Requirements:** 23 total (ECON-01..07, SETT-01..04, OBST-05..07, LVLD-01..04, VISL-01..05)

### Overview

Transform the v1.0 MVP into a deeper game experience with player progression (lives, bonuses), customization (settings), advanced level design (variable boards, progressive obstacles), and thematic presentation (Kyiv map journey). Every phase delivers verifiable user value built on the existing Phaser 3 + Firebase foundation.

### Phases

#### Phase 6: Economy System

**Goal:** Users experience lives system with regeneration and bonus economy that gates and rewards level play.

**Dependencies:** None (extends ProgressManager from v1.0)

**Requirements:**
- ECON-01: User starts with 5 lives and 500 test bonus balance
- ECON-02: User loses 1 life when failing a level
- ECON-03: User cannot start a level with 0 lives (shown "no lives" prompt with refill option)
- ECON-04: Lives regenerate at 1 per 30 minutes up to max 5
- ECON-05: User sees lives count and next-life countdown timer in HUD/level select
- ECON-06: User can buy full lives refill for 15 bonuses
- ECON-07: Lives count, bonus balance, and regen timer persist in Firestore

**Success Criteria:**
1. User starts new game with 5 lives displayed in level select screen
2. User who fails a level sees lives decrease by 1 and countdown timer start
3. User with 0 lives cannot tap level node (shown refill prompt instead of level start)
4. User sees lives automatically regenerate from 0→5 over 150 minutes (30 min per life)
5. User can spend 15 bonuses to instantly refill all lives from any count

**Plans:** 2 plans

Plans:
- [x] 06-01-PLAN.md — EconomyManager singleton + Firestore persistence + app startup wiring
- [x] 06-02-PLAN.md — Lives HUD in LevelSelect + life loss/refill in Game scene

**Research Flags:** None (standard Phaser timer + Firestore pattern)

---

#### Phase 7: Settings

**Goal:** Users can customize audio and visual preferences that persist across sessions.

**Dependencies:** None (independent feature)

**Requirements:**
- SETT-01: User can open settings menu from level select screen
- SETT-02: User can adjust SFX volume (slider or toggle)
- SETT-03: User can disable booster animation effects
- SETT-04: Settings persist across sessions via localStorage

**Success Criteria:**
1. User taps gear icon in level select to open settings overlay
2. User toggles SFX off and hears no sound effects in subsequent gameplay
3. User disables booster animations and sees instant booster activation (no tween delay)
4. User closes app, reopens, and sees previously configured settings still active

**Plans:** 2 plans

Plans:
- [x] 07-01-PLAN.md — SettingsManager singleton + localStorage persistence + AudioManager/VFXManager integration
- [x] 07-02-PLAN.md — Gear icon + settings overlay modal in LevelSelect

**Research Flags:** None (localStorage + reactive manager pattern)

---

#### Phase 8: Advanced Level Mechanics

**Goal:** Level designer can create complex puzzles with variable board shapes, progressive obstacles, and pre-placed tiles.

**Dependencies:** None (extends existing LevelData JSON schema and Match3Engine)

**Requirements:**
- OBST-05: Ice obstacle has 3 progressive states (full ice → half ice → cracked → cleared)
- OBST-06: Grass obstacle (renamed from dirt) has 3 progressive states (full grass → partial → minimal → cleared)
- OBST-07: Each hit reduces obstacle by 1 state with visual crack/break feedback
- LVLD-01: Level JSON supports variable board shapes (per-row active cell count via cell map)
- LVLD-02: Level JSON supports pre-placed tiles (blockers and boosters at fixed grid positions)
- LVLD-03: Match detection and gravity engines handle non-rectangular boards correctly
- LVLD-04: 5 new levels (L6-L10) using variable boards, 3-state obstacles, and pre-placed tiles

**Success Criteria:**
1. User matches tiles next to 3-layer ice and sees ice progress through 3 visual states before clearing
2. User encounters grass obstacle that requires 3 separate hits to clear (not single-hit like v1.0 dirt)
3. User plays level with diamond-shaped board (rows have varying widths) and matches work at all edges
4. User starts level with pre-placed booster on board (not randomly generated)
5. User completes all 5 new levels (L6-L10) each showcasing different board shapes and obstacle combinations

**Plans:** 2 plans

Plans:
- [x] 08-01-PLAN.md — Types/schema extension + dirt-to-grass rename + Match3Engine cell_map algorithms
- [x] 08-02-PLAN.md — Game scene integration + L6-L10 level JSONs + Boot/LevelSelect expansion

**Research Flags:** None (cellMap pattern researched, implementation clear)

---

#### Phase 9: Kyiv Map Experience

**Goal:** Users navigate levels through scrollable Kyiv journey with thematic storytelling.

**Dependencies:** Phase 8 (needs L6-L10 to populate map)

**Requirements:**
- VISL-01: Level select screen scrolls vertically with drag/swipe gesture
- VISL-02: Stylized AI-generated Kyiv map as scrollable level select background
- VISL-03: Level nodes positioned along a winding path on the Kyiv map

**Success Criteria:**
1. User drags/swipes vertically on level select and map scrolls smoothly (parallax layers move at different speeds)
2. User sees Kyiv-themed background with recognizable landmarks (Maidan, Khreshchatyk, Golden Gate as placeholder → final art)
3. User sees 10 level nodes arranged along winding path (not grid) that tells journey story
4. User opens level select and camera auto-scrolls to current level position
5. User taps level node vs drags map and game correctly distinguishes tap (start level) from drag (scroll)

**Plans:** 2 plans

Plans:
- [x] 09-01-PLAN.md — Scrollable Kyiv map with camera bounds, parallax backgrounds, and winding path level nodes
- [x] 09-02-PLAN.md — Tap/drag interaction wiring, auto-scroll to current level, overlay fixes

**Research Flags:** Medium (Phaser camera API researched, but specific UX flows may need design iteration during planning)

---

#### Phase 10: Mobile Polish

**Goal:** Game delivers crisp visuals on all devices and screen sizes.

**Dependencies:** Phase 9 (validates responsive layout across all scenes including new map)

**Requirements:**
- VISL-04: Game screen is mobile-responsive (adapts layout to viewport size)
- VISL-05: Canvas renders at device DPI (capped at 2x) for crisp graphics on retina displays

**Success Criteria:**
1. User plays on phone (375x667), tablet (768x1024), and desktop (1920x1080) and all UI elements remain visible and proportional
2. User on retina iPhone sees sharp tile sprites (not blurry 1x upscaling)
3. User on high-DPI Android (3-4x) sees sharp graphics without framerate collapse (DPR capped at 2x)
4. User rotates device and game layout adapts without breaking (portrait primary, landscape acceptable)

**Research Flags:** None (Phaser Scale.RESIZE + resolution config well-documented)

---

### Progress

| Phase | Status | Requirements | Plans | Completion |
|-------|--------|--------------|-------|------------|
| 6 - Economy System | ✅ Complete (2026-02-10) | 7 (ECON-01..07) | 2/2 | 100% |
| 7 - Settings | ✅ Complete (2026-02-10) | 4 (SETT-01..04) | 2/2 | 100% |
| 8 - Advanced Level Mechanics | ✅ Complete (2026-02-10) | 7 (OBST-05..07, LVLD-01..04) | 2/2 | 100% |
| 9 - Kyiv Map Experience | ✅ Complete (2026-02-10) | 3 (VISL-01..03) | 2/2 | 100% |
| 10 - Mobile Polish | Pending | 2 (VISL-04..05) | 0/? | 0% |

**Overall:** 80% complete (4/5 phases)

### Coverage

**Mapped:** 23/23 requirements ✓

- ECON-01..07 → Phase 6
- SETT-01..04 → Phase 7
- OBST-05..07 → Phase 8
- LVLD-01..04 → Phase 8
- VISL-01..03 → Phase 9
- VISL-04..05 → Phase 10

**Unmapped:** None

---

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
*Last updated: 2026-02-10*
