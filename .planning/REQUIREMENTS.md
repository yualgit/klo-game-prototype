# Requirements: KLO Match-3 Demo

**Defined:** 2026-02-10
**Core Value:** Клієнт має побачити і відчути gameplay — як гра буде сприйматись реальними користувачами. Демо має передати "смак" механіки та KLO-бренд.

## v1.2 Requirements

Requirements for milestone v1.2 Polish & Collections. Each maps to roadmap phases.

### Art & Visual Quality

- [ ] **ART-01**: All existing tile sprites upgraded to 1024x1024 PNG for retina clarity on DPR=2
- [ ] **ART-02**: 6 new tile types available in game (burger, hotdog, oil, water, snack, soda)
- [ ] **ART-03**: Tile `light` fully removed from codebase and content
- [ ] **ART-04**: All 4 booster types have dedicated sprite art (line-h, line-v, bomb, rocket, KLO-sphere)
- [ ] **ART-05**: Inactive cells on variable board shapes display distinct non-playable visual (dark/grey texture)

### UI & Navigation

- [ ] **NAV-01**: Bottom navigation bar with 3 tabs (Levels / Collections / Shop) visible on all non-game screens
- [ ] **NAV-02**: Active tab visually highlighted with glow/contrast; inactive tabs dimmed
- [ ] **NAV-03**: Notification dot on Collections tab when at least one collection is 6/6 ready for exchange
- [ ] **NAV-04**: Global header displays current lives count, bonuses count, and settings button
- [ ] **NAV-05**: Global header values update reactively from EconomyManager state changes
- [ ] **NAV-06**: Bottom navigation hidden during gameplay; compact Level HUD shows moves left and goal progress
- [ ] **NAV-07**: Global header remains visible during gameplay

### Collections

- [ ] **COL-01**: Collections screen shows all 3 collections (Coffee/Food/Cars) on one scrollable page
- [ ] **COL-02**: Each collection displays name, reward description, 6-card grid, progress X/6, and exchange button
- [ ] **COL-03**: Uncollected cards shown as grayscale silhouette with "?"; collected cards shown in full color
- [ ] **COL-04**: Collection data model supports 3 parallel collections with configurable multiplier and reward
- [ ] **COL-05**: Each collection has 6 cards with rarity distribution (2 common, 2 rare, 1 epic, 1 legendary)
- [ ] **COL-06**: Drop chances driven by config (base_chance per rarity, collection multiplier, missing_card_floor_multiplier)
- [ ] **COL-07**: Card awarded only after bonus level win; 1 bonus level = 1 card
- [ ] **COL-08**: Card pick UX: show 2 closed cards, player picks one, both reveal, picked card added to inventory
- [ ] **COL-09**: Pity mechanic: after N consecutive duplicates (default 3), next card guaranteed new if missing cards exist
- [ ] **COL-10**: Pity config-driven (enabled, threshold, epic_multiplier, legendary_multiplier)
- [ ] **COL-11**: Exchange button active only when collection is 6/6; deducts exactly 6 cards, keeps duplicates
- [ ] **COL-12**: Exchange animation sequence: cards fold → compress → explode → coupon reveal → "Забрати купон" button
- [ ] **COL-13**: Collection can be collected again after exchange (repeatable)

### Persistence

- [ ] **SYS-01**: Collection progress (owned cards, pity streak, ready-to-exchange state) persisted to Firestore
- [ ] **SYS-02**: Collection state correctly restored after app refresh/re-entry

### Responsive Layout

- [ ] **RESP-01**: Level Select scene scales correctly on all test viewports without cropping road, checkpoints, or CTA buttons
- [ ] **RESP-02**: Game Board fully visible in viewport on all test devices; HUD does not overlap grid; no edge cell cropping
- [ ] **RESP-03**: Layout uses viewport-relative scaling (fit/contain), not fixed pixel values
- [ ] **RESP-04**: Verified on iPhone SE (375x667), iPhone 14 Pro, Android ~360x740

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Analytics

- **ANLT-01**: Collection card drop events tracked
- **ANLT-02**: Exchange events tracked with collection type

### Tutorials

- **TUT-01**: First-time collection tutorial explaining card pick flow
- **TUT-02**: Exchange tutorial when first collection reaches 6/6

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Paid card packs / IAP | Demo scope — no monetization |
| Card trading between players | Requires social graph, beyond anonymous auth |
| Card abilities / stats | Cards are visual collectibles, not gameplay items |
| Duplicate card conversion | No value for duplicates per spec |
| Collection progress badges in HUD | Per spec: progress only on Collections screen |
| Analytics events | Defer to future milestone |
| Collection tutorial | Defer to future milestone |
| Shop screen implementation | Tab exists in nav but content deferred |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ART-01 | Phase 11 | Pending |
| ART-02 | Phase 11 | Pending |
| ART-03 | Phase 11 | Pending |
| ART-04 | Phase 11 | Pending |
| ART-05 | Phase 11 | Pending |
| NAV-01 | Phase 13 | Pending |
| NAV-02 | Phase 13 | Pending |
| NAV-03 | Phase 16 | Pending |
| NAV-04 | Phase 13 | Pending |
| NAV-05 | Phase 13 | Pending |
| NAV-06 | Phase 13 | Pending |
| NAV-07 | Phase 13 | Pending |
| COL-01 | Phase 14 | Pending |
| COL-02 | Phase 14 | Pending |
| COL-03 | Phase 14 | Pending |
| COL-04 | Phase 14 | Pending |
| COL-05 | Phase 14 | Pending |
| COL-06 | Phase 15 | Pending |
| COL-07 | Phase 15 | Pending |
| COL-08 | Phase 15 | Pending |
| COL-09 | Phase 15 | Pending |
| COL-10 | Phase 15 | Pending |
| COL-11 | Phase 16 | Pending |
| COL-12 | Phase 16 | Pending |
| COL-13 | Phase 16 | Pending |
| SYS-01 | Phase 14 | Pending |
| SYS-02 | Phase 14 | Pending |
| RESP-01 | Phase 12 | Pending |
| RESP-02 | Phase 12 | Pending |
| RESP-03 | Phase 12 | Pending |
| RESP-04 | Phase 12 | Pending |

**Coverage:**
- v1.2 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-10*
*Last updated: 2026-02-10 after roadmap creation*
