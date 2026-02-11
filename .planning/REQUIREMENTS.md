# Requirements: KLO Match-3 Demo

**Defined:** 2026-02-11
**Core Value:** Клієнт має побачити і відчути gameplay — як гра буде сприйматись реальними користувачами. Демо має передати "смак" механіки та KLO-бренд.

## v1.4 Requirements

Requirements for v1.4 Content Expansion. Each maps to roadmap phases.

### Tile System

- [ ] **TSYS-01**: Tile types are configured from a single data source (no hardcoded type literals)
- [ ] **TSYS-02**: Adding/removing a tile type requires only config changes (no code edits to type unions)
- [ ] **TSYS-03**: All 9 tile types (burger, coffee, fuel_can, hotdog, oil, snack, soda, water, wheel) render correctly with sprites

### Board

- [ ] **BOARD-01**: All levels use 7x7 board dimensions
- [ ] **BOARD-02**: Existing levels L1-L10 are retrofitted to 7x7 with adjusted goals/moves

### Levels

- [ ] **LVL-01**: 10 new levels (L11-L20) with 7x7 boards
- [ ] **LVL-02**: New levels use all 9 tile types
- [ ] **LVL-03**: New levels introduce progressive difficulty (more obstacles, harder goals)
- [ ] **LVL-04**: Level select map shows all 20 level nodes

## Future Requirements

None identified for this milestone.

## Out of Scope

| Feature | Reason |
|---------|--------|
| New obstacle types | Current 4 obstacle types sufficient for L11-L20 |
| New booster types | Current booster set covers gameplay needs |
| Level editor | Levels authored as JSON manually |
| Procedural level generation | Hand-crafted levels for demo quality |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TSYS-01 | — | Pending |
| TSYS-02 | — | Pending |
| TSYS-03 | — | Pending |
| BOARD-01 | — | Pending |
| BOARD-02 | — | Pending |
| LVL-01 | — | Pending |
| LVL-02 | — | Pending |
| LVL-03 | — | Pending |
| LVL-04 | — | Pending |

**Coverage:**
- v1.4 requirements: 9 total
- Mapped to phases: 0
- Unmapped: 9 (pending roadmap)

---
*Requirements defined: 2026-02-11*
*Last updated: 2026-02-11 after initial definition*
