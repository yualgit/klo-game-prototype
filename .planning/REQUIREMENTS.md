# Requirements: KLO Match-3 Demo

**Defined:** 2026-02-10
**Core Value:** Playable match-3 demo for client presentation — gameplay feel + KLO brand

## v1.1 Requirements

Requirements for milestone v1.1 "Kyiv Journey". Each maps to roadmap phases.

### Economy

- [ ] **ECON-01**: User starts with 5 lives and 500 test bonus balance
- [ ] **ECON-02**: User loses 1 life when failing a level
- [ ] **ECON-03**: User cannot start a level with 0 lives (shown "no lives" prompt with refill option)
- [ ] **ECON-04**: Lives regenerate at 1 per 30 minutes up to max 5
- [ ] **ECON-05**: User sees lives count and next-life countdown timer in HUD/level select
- [ ] **ECON-06**: User can buy full lives refill for 15 bonuses
- [ ] **ECON-07**: Lives count, bonus balance, and regen timer persist in Firestore

### Settings

- [ ] **SETT-01**: User can open settings menu from level select screen
- [ ] **SETT-02**: User can adjust SFX volume (slider or toggle)
- [ ] **SETT-03**: User can disable booster animation effects
- [ ] **SETT-04**: Settings persist across sessions via localStorage

### Obstacles

- [ ] **OBST-05**: Ice obstacle has 3 progressive states (full ice → half ice → cracked → cleared)
- [ ] **OBST-06**: Grass obstacle (renamed from dirt) has 3 progressive states (full grass → partial → minimal → cleared)
- [ ] **OBST-07**: Each hit reduces obstacle by 1 state with visual crack/break feedback

### Level Design

- [ ] **LVLD-01**: Level JSON supports variable board shapes (per-row active cell count via cell map)
- [ ] **LVLD-02**: Level JSON supports pre-placed tiles (blockers and boosters at fixed grid positions)
- [ ] **LVLD-03**: Match detection and gravity engines handle non-rectangular boards correctly
- [ ] **LVLD-04**: 5 new levels (L6-L10) using variable boards, 3-state obstacles, and pre-placed tiles

### Visual

- [ ] **VISL-01**: Level select screen scrolls vertically with drag/swipe gesture
- [ ] **VISL-02**: Stylized AI-generated Kyiv map as scrollable level select background
- [ ] **VISL-03**: Level nodes positioned along a winding path on the Kyiv map
- [ ] **VISL-04**: Game screen is mobile-responsive (adapts layout to viewport size)
- [ ] **VISL-05**: Canvas renders at device DPI (capped at 2x) for crisp graphics on retina displays

## v1.2 Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### Economy

- **ECON-08**: Progressive lives regeneration (30min → 45min → 1hr → 1.5hr → 2hr)
- **ECON-09**: Earn bonuses from completing levels (star-based rewards)

### Level Design

- **LVLD-05**: Levels L11-L20 with increasing difficulty progression

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real currency purchases | Demo only — test bonuses, not real money |
| Phone auth / loyalty_id | Not needed for demo presentation |
| Remote Config | Static JSON sufficient for 10 levels |
| Real-time multiplayer | Not in scope |
| Delivery objects (канистры) | Deferred to L8+ in future milestone |
| Progressive regen timer | Unvalidated pattern — defer to v1.2 as experiment |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ECON-01 | — | Pending |
| ECON-02 | — | Pending |
| ECON-03 | — | Pending |
| ECON-04 | — | Pending |
| ECON-05 | — | Pending |
| ECON-06 | — | Pending |
| ECON-07 | — | Pending |
| SETT-01 | — | Pending |
| SETT-02 | — | Pending |
| SETT-03 | — | Pending |
| SETT-04 | — | Pending |
| OBST-05 | — | Pending |
| OBST-06 | — | Pending |
| OBST-07 | — | Pending |
| LVLD-01 | — | Pending |
| LVLD-02 | — | Pending |
| LVLD-03 | — | Pending |
| LVLD-04 | — | Pending |
| VISL-01 | — | Pending |
| VISL-02 | — | Pending |
| VISL-03 | — | Pending |
| VISL-04 | — | Pending |
| VISL-05 | — | Pending |

**Coverage:**
- v1.1 requirements: 23 total
- Mapped to phases: 0
- Unmapped: 23 (pending roadmap creation)

---
*Requirements defined: 2026-02-10*
*Last updated: 2026-02-10 after initial definition*
