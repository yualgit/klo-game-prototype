# Requirements: KLO Match-3

**Defined:** 2026-02-11
**Core Value:** Клієнт має побачити і відчути gameplay — як гра буде сприйматись реальними користувачами. Демо має передати "смак" механіки та KLO-бренд.

## v1.3 Requirements

Requirements for UI Polish milestone. Each maps to roadmap phases.

### Welcome Screen

- [ ] **WELC-01**: User cannot navigate back to welcome screen after pressing PLAY (remove back button from level select)
- [ ] **WELC-02**: "KLO Match-3" title scales to fit mobile screen width without clipping

### Header

- [ ] **HDR-01**: Settings icon is displayed inside `gui/Small Square Button Blue.png` container
- [ ] **HDR-02**: Bonus score display is removed from the header

### Settings Overlay

- [ ] **SETT-01**: Settings overlay text and elements scale down on mobile to fit screen
- [ ] **SETT-02**: Settings overlay renders above header and bottom navigation (z-order fix)
- [ ] **SETT-03**: Only one settings overlay can be open at a time (singleton guard)
- [ ] **SETT-04**: Settings overlay opens without crash on level/game page (fix `Cannot read properties of undefined (reading 'width')`)

### Bottom Navigation

- [ ] **NAV-01**: "Levels" and "Collections" tab positions are swapped
- [ ] **NAV-02**: Active tab indicator is a rounded rectangle instead of a circle

### Level Select

- [ ] **LVLS-01**: Level node spacing reduced on mobile so all nodes fit on screen (drawRoadPath)
- [ ] **LVLS-02**: Level buttons remain clickable after scene changes and page navigation (no reload required)

### Game Screen

- [ ] **GAME-01**: On mobile, "< Menu" back button displays in header as a square icon-only button with "<"
- [ ] **GAME-02**: On mobile, level number and moves counter are on a new line; goal text is smaller to fit screen
- [ ] **GAME-03**: Game board width = screen width - 32px (16px padding each side), max 1024px; height adjusts for narrow viewports (e.g., 1366x768 laptops)
- [ ] **GAME-04**: Fix resize error `Cannot read properties of undefined (reading 'setViewport')` in LevelSelect.ts

### Collections

- [ ] **COLL-01**: Infinite scroll bug is fixed (scroll has proper bounds)
- [ ] **COLL-02**: Collection cards display in a horizontal row with snap-to-card swipe navigation
- [ ] **COLL-03**: Card container has background color (0xffb800, 0.15 opacity) behind the swipeable cards

## Future Requirements

Deferred from previous milestones.

- **SHOP-01**: Shop screen content implementation
- **TUT-01**: Collection tutorial
- **ANLYT-01**: Analytics events

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| New levels (L11-20) | 10 levels sufficient for demo |
| Phone auth / loyalty_id | Not for demo |
| In-app purchases | Demo scope, no monetization |
| Card abilities / stats | Cards are visual collectibles |
| Card trading | Requires social graph |
| Progressive lives regen | Unvalidated, defer to experiment |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| WELC-01 | — | Pending |
| WELC-02 | — | Pending |
| HDR-01 | — | Pending |
| HDR-02 | — | Pending |
| SETT-01 | — | Pending |
| SETT-02 | — | Pending |
| SETT-03 | — | Pending |
| SETT-04 | — | Pending |
| NAV-01 | — | Pending |
| NAV-02 | — | Pending |
| LVLS-01 | — | Pending |
| LVLS-02 | — | Pending |
| GAME-01 | — | Pending |
| GAME-02 | — | Pending |
| GAME-03 | — | Pending |
| GAME-04 | — | Pending |
| COLL-01 | — | Pending |
| COLL-02 | — | Pending |
| COLL-03 | — | Pending |

**Coverage:**
- v1.3 requirements: 19 total
- Mapped to phases: 0
- Unmapped: 19 ⚠️

---
*Requirements defined: 2026-02-11*
*Last updated: 2026-02-11 after initial definition*
